/* eslint-env jest */

import StringMatcher    from './StringMatcher'

describe('StringMatcher', () => {
  let subject

  describe('with defaults', () => {
    beforeEach(() => {
      subject = new StringMatcher('/foo/$key')
    })

    it('matches', () => {
      expect(subject.matches('/foo/78')).toBeTruthy()
      expect(subject.params('/foo/78')).toEqual({ 'key': '78' })

      expect(subject.matches('/foo/bar')).toBeTruthy()
      expect(subject.params('/foo/bar')).toEqual({ 'key': 'bar' })
    })

    it('does not match', () => {
      expect(subject.matches('xyz/foo/78')).toBeFalsy()
      expect(() => subject.params('xyz/foo/78')).toThrow('possible bug: pattern found but does not match jobURI xyz/foo/78')
    })
  })

  describe('multiple matches', () => {
    it('returns an object of matching params', () => {
      subject = new StringMatcher('/$a-$b-$c')

      expect(subject.params('/foo-bar-baz')).toEqual({ a: 'foo', b: 'bar', c: 'baz' })
    })
  })

  describe('overriding segment values', () => {
    beforeEach(() => {
      subject = new StringMatcher('/foo/:key', {
        segmentNameStartChar: ':',
        segmentValueCharset:  '\\d',
      })
    })

    it('uses segmentNameStartChar', () => {
      expect(subject.matches('/foo/78')).toBeTruthy()
      expect(subject.params('/foo/78')).toEqual({ key: '78' })
    })

    it('uses segmentValueCharset', () => {
      expect(subject.matches('/foo/0x78')).toBeFalsy()
      expect(subject.matches('/foo/x')).toBeFalsy()
    })
  })

})

