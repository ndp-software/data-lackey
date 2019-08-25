/* eslint-env jest */

import ruleFactory, {
  matcherFactory,
}                              from './ruleFactory'
import Rule                    from './Rule'
import StringPlusParamsPattern from './patterns/StringPlusParamsPattern'
import StringMatcher           from './patterns/StringMatcher'
import RegExpPattern           from './patterns/RegExpPattern'


describe('ruleFactory', () => {
  test('creates a rule', () => {
    const r = ruleFactory('foo', {})
    expect(r).toBeInstanceOf(Rule)
  })
})

describe('matcherFactory', () => {

  test('from string', () => {
    const r = matcherFactory('foo', {})

    expect(r).toBeInstanceOf(StringMatcher)
  })

  test('from string + requiredParams (not a feature)', () => {
    const r = matcherFactory('foo', {
      requiredParams: ['bar'],
    })

    expect(r).toBeInstanceOf(StringPlusParamsPattern)
  })

  test('from RegExp', () => {
    const r = matcherFactory(/foo/, {})
    expect(r instanceof RegExpPattern)
  })

  test('from object w/ params', () => {
    const r = matcherFactory({
                               resource: 'foo',
                               params:   ['bar'],
                             }, {})

    expect(r).toBeInstanceOf(StringPlusParamsPattern)
  })

  test('from object w/o params', () => {
    expect(() => matcherFactory({
                                  resource: 'foo',
                                }, {})).toThrow(/Unknown rule pattern/)
  })

  test('null', () => {
    expect(() => matcherFactory(null, {})).toThrow(/Unknown rule pattern/)
  })

  test('boolean', () => {
    expect(() => matcherFactory(true, {})).toThrow(/Unknown rule pattern/)
  })
})
