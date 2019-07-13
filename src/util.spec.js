/* eslint-env jest */

import * as subject from './util'

describe('arrayEqual', () => {

  it('handles the same array', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, a)).toEqual(true)
  })

  it('handles nulls', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, null)).toEqual(false)
    expect(subject.arraysEqual(null, a)).toEqual(false)
    expect(subject.arraysEqual(null, null)).toEqual(true)
  })
})


describe('asMatchFn', () => {


  describe('given a string', () => {
    it('returns false for none matching', () => {
      expect(subject.asMatchFn('foo')('bar')).toEqual(false)
    })

    it('returns false for partial match', () => {
      expect(subject.asMatchFn('foo')('food')).toEqual(false)
    })

    it('returns true for matching', () => {
      expect(subject.asMatchFn('foo')('foo')).toEqual(true)
    })
  })

  describe('given a function', () => {
    it('returns result of fn', () => {
      expect(subject.asMatchFn(_uri => true)('_')).toEqual(true)
      expect(subject.asMatchFn(_uri => false)('_')).toEqual(false)
    })
  })

  describe('given a regular expression', () => {
    const URI = 'dl:test-123/456'

    it('does not return URI if fn returns false', () => {
      expect(subject.asMatchFn(/x93fk/)(URI)).toEqual(null)
    })

    it('returns params if matches', () => {
      const regEx     = /test-(\d+)\/(\d+)/,
            matchData = subject.asMatchFn(regEx)(URI)

      expect(matchData[0]).toEqual('test-123/456')
      expect(matchData[1]).toEqual('123')
      expect(matchData[2]).toEqual('456')
    })


  })
})
