/* eslint-env jest */

import { canonicalUri } from './canonicalUri'
import {
  StringPlusParamsPattern,
  StringMatcher,
  RegExpPattern,
}                       from './patterns'
/*
 pattern
 =======
 string => pattern
 {string,params} => pattern
 regex => pattern

 (pattern, URI) => match?
 (pattern, URI) => params

 spec
 =======
 spec => [URI...]
 */

describe('StringPlusParamsPattern', () => {

  describe('basic behavior', () => {
    let subject

    beforeEach(() => {
      subject = new StringPlusParamsPattern('/asset', ['i', 'z'])
    })

    it('required params', () => {
      expect(subject.matches('/asset?i=foo&z=bar')).toBeTruthy()
      expect(subject.params('/asset?i=foo&z=bar')).toEqual({ i: 'foo', z: 'bar' })
    })

    it('handles extra params', () => {
      expect(subject.matches('/asset?i=foo&k=baz&z=bar')).toBeTruthy()
      expect(subject.params('/asset?i=foo&k=baz&z=bar')).toEqual({ i: 'foo', k: 'baz', z: 'bar' })
    })

    it('handles extra params at beginning', () => {
      expect(subject.matches('/asset?a=z&i=foo&k=baz&z=bar')).toBeTruthy()
      expect(subject.params('/asset?a=z&i=foo&k=baz&z=bar')).toEqual({ a: 'z', i: 'foo', k: 'baz', z: 'bar' })
    })

    it('can be initialized with no requiredParams', () => {
      subject = new StringPlusParamsPattern('/asset', [])
      expect(subject.matches('asset')).toBeFalsy()
      expect(subject.matches('/asset')).toBeTruthy()
      expect(subject.params('/asset?')).toEqual({})
      expect(subject.params('/asset')).toEqual({})
      expect(subject.matches('/asset?i=foo')).toBeTruthy()
      expect(subject.params('/asset?i=foo')).toEqual({ 'i': 'foo' })
    })

  })

  ;[
    8,
    'word',
    'two words',
    'questionable?',
    'ampersand a&p',
    'a=b+c/d*2',
  ].forEach(p => {

    describe(`URI with "${p}" as a parameter`, () => {

      let subject, uri

      beforeEach(() => {
        subject = new StringPlusParamsPattern('asset', [])
        uri     = canonicalUri({ uri: 'asset', params: { k: p } })
      })

      it(`"matches" ${canonicalUri({ uri: 'asset', params: { k: p } })}`, () => {
        expect(subject.matches(uri)).toBeTruthy()
      })

      it(`"params" extracts parameter "${p}" (round-trip encoding)`, () => {
        expect(subject.params(uri)).toEqual({ k: p.toString() })
      })
    })
  })

})


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
