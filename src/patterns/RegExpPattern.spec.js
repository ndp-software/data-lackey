/* eslint-env jest */

import RegExpPattern from './RegExpPattern'

describe('RegExpPattern', () => {
  let subject

  describe('initialized with regexp', () => {
    beforeEach(() => {
      subject = new RegExpPattern(/\/foo(\d+)/)
    })

    it('matches', () => {
      expect(subject.matches('/foo78')).toBeTruthy()
      expect(subject.params('/foo78')).toEqual(['78'])
    })

    it('does not match', () => {
      expect(subject.matches('/food78')).toBeFalsy()
      expect(() => subject.params('/food78')).toThrow('possible bug: pattern found but does not match jobURI /food78')
    })
  })

  describe('multiple matches', () => {
    it('returns an Array of matching params', () => {
      subject = new RegExpPattern(/(\w+)\s(\d+)/)

      expect(subject.params('foo 39')).toEqual(['foo', '39'])
    })
  })

  describe('initialized with regexp and groupNames', () => {
    beforeEach(() => {
      subject = new RegExpPattern(/\/foo(\d+)\/(.*)/, ['i', 'z'])
    })

    it('matches', () => {
      expect(subject.matches('/foo78/boo')).toBeTruthy()
      expect(subject.params('/foo78/boo')).toEqual({ 'i': '78', 'z': 'boo' })
    })

    it('does not match', () => {
      expect(subject.matches('/food78')).toBeFalsy()
      expect(() => subject.params('/food78')).toThrow('possible bug: pattern found but does not match jobURI /food78')
    })
  })

})
