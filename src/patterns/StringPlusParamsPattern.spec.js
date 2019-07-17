/* eslint-env jest */

import { uriFromSpec }         from '../uriFromSpec'
import StringPlusParamsPattern from './StringPlusParamsPattern'

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

    it('may not match', () => {
      expect(subject.matches('asset')).toBeFalsy()
      expect(() => subject.params('asset')).toThrow('possible bug: pattern found but does not match jobURI asset')
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
        uri     = uriFromSpec({ resource: 'asset', k: p })
      })

      it(`"matches" ${uriFromSpec({ resource: 'asset', k: p })}`, () => {
        expect(subject.matches(uri)).toBeTruthy()
      })

      it(`"params" extracts parameter "${p}" (round-trip encoding)`, () => {
        expect(subject.params(uri)).toEqual({ k: p.toString() })
      })
    })
  })

})
