/* eslint-env jest */

import { canonicalUri } from './canonicalUri'
import {
  UriWithParamsMatcher,
}                       from './matchers'

describe('UriWithParamsMatcher', () => {
  [
    8,
    'word',
    'two words',
    'ampersand a&p',
    'a=b+c/d*2',
  ].forEach(p => {


    describe(`URI with "${p}" as a parameter`, () => {

      let subject, uri

      beforeEach(() => {
        subject = new UriWithParamsMatcher('asset', [])
        uri     = canonicalUri({ uri: 'asset', params: { k: p } })
      })

      it(`matches ${canonicalUri({ uri: 'asset', params: { k: p } })}`, () => {
        expect(subject.matches(uri)).toBeTruthy()
      })

      it(`extracts parameter "${p}" (round-trip encoding)`, () => {
        expect(subject.params(uri)).toEqual({ k: p.toString() })
      })
    })
  })

})
