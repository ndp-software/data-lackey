/* eslint-env jest */

import * as subject from './util'

describe('arrayEqual', () => {

  test('handles the same array', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, a)).toEqual(true)
  })

  test('handles nulls', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, null)).toEqual(false)
    expect(subject.arraysEqual(null, a)).toEqual(false)
    expect(subject.arraysEqual(null, null)).toEqual(true)
  })
})


describe('asMatchFn', () => {


  describe('given a string', () => {
    test('returns false for none matching', () => {
      expect(subject.asMatchFn('foo')('bar')).toEqual(false)
    })

    test('returns false for partial match', () => {
      expect(subject.asMatchFn('foo')('food')).toEqual(false)
    })

    test('returns true for matching', () => {
      expect(subject.asMatchFn('foo')('foo')).toEqual(true)
    })
  })

  describe('given a function', () => {
    test('returns result of fn', () => {
      expect(subject.asMatchFn(_uri => true)('_')).toEqual(true)
      expect(subject.asMatchFn(_uri => false)('_')).toEqual(false)
    })
  })

  describe('given a regular expression', () => {
    const URI = 'dl:test-123/456'

    test('does not return URI if fn returns false', () => {
      expect(subject.asMatchFn(/x93fk/)(URI)).toEqual(null)
    })

    test('returns params if matches', () => {
      const regEx     = /test-(\d+)\/(\d+)/,
            matchData = subject.asMatchFn(regEx)(URI)

      expect(matchData[0]).toEqual('test-123/456')
      expect(matchData[1]).toEqual('123')
      expect(matchData[2]).toEqual('456')
    })


  })
})

describe('urisFromUriSpecs', () => {
  test('returns empty array if no dependsOn', () => {
    expect(subject.urisFromUriSpecs()).toEqual([])
  })

  test('returns string', () => {
    expect(subject.urisFromUriSpecs('foo')).toEqual(['foo'])
  })

  test('maps object to string', () => {
    expect(subject.urisFromUriSpecs({ resource: 'racks', id: 7 })).toEqual(['racks?id=7'])

  })

  test('returns result of function', () => {
    expect(subject.urisFromUriSpecs(() => 'foo')).toEqual(['foo'])
  })

  test('passes params to function', () => {
    const dependsOn = jest.fn()

    subject.urisFromUriSpecs(dependsOn, 'foo')

    expect(dependsOn).toHaveBeenCalledWith('foo')
  })

  test('returns multiple', () => {
    expect(subject.urisFromUriSpecs(['foo', 'bar'])).toEqual(['foo', 'bar'])
  })

})
