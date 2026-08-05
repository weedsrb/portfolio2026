import { describe, expect, it } from 'vitest'

import { SqlError, execute, type Table } from './execute'
import { ORDER_ROWS, DEMO_TENANT } from '@/data/fixtures/orders-rows'

/**
 * The console runs real SQL against real rows, so the engine is tested like one.
 * A query it cannot support must fail loudly — a subset engine that guesses is
 * worse than no engine at all.
 */

const people: Table = {
  name: 'people',
  rows: [
    { name: 'Layla', city: 'Ramallah', age: 31, spend: 120 },
    { name: 'Omar', city: 'Ramallah', age: 24, spend: 80 },
    { name: 'Nour', city: 'Nablus', age: 45, spend: 200 },
    { name: 'Sami', city: 'Nablus', age: 38, spend: null },
  ],
}

const orders: Table = { name: 'orders', rows: ORDER_ROWS }
const tables = [people, orders]

const run = (sql: string) => execute(sql, tables, { tenant: DEMO_TENANT })

describe('projection and filtering', () => {
  it('selects columns', () => {
    const r = run('select name, age from people')
    expect(r.columns).toEqual(['name', 'age'])
    expect(r.rows[0]).toEqual(['Layla', 31])
  })

  it('expands star', () => {
    expect(run('select * from people').columns).toEqual(['name', 'city', 'age', 'spend'])
  })

  it('filters with where', () => {
    const r = run("select name from people where city = 'Nablus'")
    expect(r.rows.flat()).toEqual(['Nour', 'Sami'])
  })

  it('combines conditions', () => {
    const r = run("select name from people where city = 'Ramallah' and age > 30")
    expect(r.rows.flat()).toEqual(['Layla'])
  })

  it('handles is null', () => {
    expect(run('select name from people where spend is null').rows.flat()).toEqual(['Sami'])
    expect(run('select name from people where spend is not null').rows).toHaveLength(3)
  })

  it('orders and limits', () => {
    const r = run('select name from people order by age desc limit 2')
    expect(r.rows.flat()).toEqual(['Nour', 'Sami'])
  })

  it('orders by select-list position', () => {
    expect(run('select name, age from people order by 2').rows[0]).toEqual(['Omar', 24])
  })
})

describe('aggregates', () => {
  it('counts rows', () => {
    expect(run('select count(*) from people').rows[0]).toEqual([4])
  })

  it('ignores nulls in count(column) and avg', () => {
    expect(run('select count(spend) from people').rows[0]).toEqual([3])
    expect(run('select avg(spend) from people').rows[0]).toEqual([(120 + 80 + 200) / 3])
  })

  it('groups', () => {
    const r = run('select city, count(*) as n from people group by city order by city')
    expect(r.columns).toEqual(['city', 'n'])
    expect(r.rows).toEqual([['Nablus', 2], ['Ramallah', 2]])
  })

  it('filters groups with having', () => {
    const r = run('select city, count(*) as n from people group by city having count(*) > 5')
    expect(r.rows).toHaveLength(0)
  })

  it('supports case inside an aggregate', () => {
    const r = run(
      "select sum(case when city = 'Nablus' then 1 else 0 end) as nablus from people",
    )
    expect(r.rows[0]).toEqual([2])
  })

  it('rounds', () => {
    expect(run('select round(avg(age), 1) as a from people').rows[0]).toEqual([34.5])
  })
})

describe('errors are honest', () => {
  it('names an unknown column', () => {
    expect(() => run('select nope from people')).toThrow(/no column called "nope"/)
  })

  it('names an unknown table', () => {
    expect(() => run('select 1 from nowhere')).toThrow(/no table called "nowhere"/)
  })

  it('names an unsupported function rather than guessing', () => {
    expect(() => run('select median(age) from people')).toThrow(/does not support the function median/)
  })

  it('rejects syntax it does not understand', () => {
    expect(() => run('select name from people join other on 1 = 1')).toThrow(SqlError)
    expect(() => run('update people set age = 1')).toThrow(SqlError)
  })

  it('reports an empty query', () => {
    expect(() => run('  ')).toThrow(/Empty query/)
  })
})

describe('the featured query, against the real rows', () => {
  const sql = `
    select
      width_bucket(parse_confidence, 0.5, 1.0, 5) as confidence_bucket,
      count(*)                                    as orders,
      round(100.0 * avg(case when needed_edit
                        then 0 else 1 end), 1)    as pct_untouched,
      round(100.0 * avg(case when status = 'confirmed'
                        then 1 else 0 end), 1)    as pct_confirmed
    from orders
    where merchant_id = current_tenant()
    group by 1
    order by 1;`

  it('runs and returns one row per bucket', () => {
    const r = execute(sql, tables, { tenant: DEMO_TENANT })
    expect(r.columns).toEqual([
      'confidence_bucket',
      'orders',
      'pct_untouched',
      'pct_confirmed',
    ])
    expect(r.rows.length).toBeGreaterThan(3)
  })

  it('honours the tenant predicate', () => {
    const all = execute('select count(*) as n from orders', tables).rows[0]![0] as number
    const mine = execute(
      'select count(*) as n from orders where merchant_id = current_tenant()',
      tables,
      { tenant: DEMO_TENANT },
    ).rows[0]![0] as number
    expect(mine).toBeLessThan(all)
    expect(mine).toBeGreaterThan(0)
  })

  it('shows confidence rising with being left alone, then flattening', () => {
    // The finding the section is built on. If the generator ever stops
    // producing it, the prose on the page becomes false.
    const rows = execute(sql, tables, { tenant: DEMO_TENANT }).rows
    const untouched = rows.map((r) => r[2] as number)

    expect(untouched[0]!).toBeLessThan(untouched.at(-1)!)

    const topGain = untouched.at(-1)! - untouched.at(-2)!
    const earlyGain = untouched[1]! - untouched[0]!
    expect(topGain).toBeLessThan(earlyGain)

    // And a meaningful share of the most confident parses still needed a human.
    expect(untouched.at(-1)!).toBeLessThan(85)
  })
})

describe('determinism', () => {
  it('returns the same rows every run', () => {
    const a = run('select status, count(*) as n from orders group by 1 order by 1')
    const b = run('select status, count(*) as n from orders group by 1 order by 1')
    expect(a).toEqual(b)
  })
})
