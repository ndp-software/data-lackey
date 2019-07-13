/* eslint-env jest */

import { canonicalUri } from './canonicalUri'
import Rule             from './Rule'


describe('Rule', () => {
  let subject

  describe('.matcher', () => {
    describe('initialized with path string', () => {
      beforeEach(() => {
        subject = new Rule('/foo/$key', {})
      })

      it('matches', () => {
        expect(subject.matches('/foo/78')).toBeTruthy()
        expect(subject.matches('/foo/bar')).toBeTruthy()
      })

      it('does not match', () => {
        expect(subject.matches('xyz/foo/78')).toBeFalsy()
      })
    })

    describe('initialized with string', () => {
      beforeEach(() => {
        subject = new Rule('/foo$key', {})
      })

      it('matches', () => {
        expect(subject.matches('/foo78')).toBeTruthy()
        expect(subject.matches('/foobar')).toBeTruthy()
      })
    })

    describe('initialized with regexp', () => {
      beforeEach(() => {
        subject = new Rule(/\/foo(\d+)/, {})
      })

      it('matches', () => {
        expect(subject.matches('/foo78')).toBeTruthy()
      })

      it('does not match', () => {
        expect(subject.matches('/food78')).toBeFalsy()
      })
    })

    describe('initialized with regexp and groupNames', () => {
      beforeEach(() => {
        subject = new Rule(/\/foo(\d+)\/(.*)/, { groupNames: ['i', 'z'] })
      })

      it('matches', () => {
        expect(subject.matches('/foo78/boo')).toBeTruthy()
      })

      it('does not match', () => {
        expect(subject.matches('/food78')).toBeFalsy()
      })
    })

    describe('initialized with uri and requiredParams', () => {
      beforeEach(() => {
        subject = new Rule('/asset', { requiredParams: ['i', 'z'] })
      })

      it('matches', () => {
        expect(subject.matches('/asset?i=foo&z=bar')).toBeTruthy()
      })

      it('matches if extra params', () => {
        expect(subject.matches('/asset?i=foo&k=baz&z=bar')).toBeTruthy()
      })

      it('matches if extra params at beginning', () => {
        expect(subject.matches('/asset?a=z&i=foo&k=baz&z=bar')).toBeTruthy()
      })

      it('does not match if missing a param', () => {
        expect(subject.matches('/asset?i=foo')).toBeFalsy()
      })

      it('can be initialized with no requiredParams', () => {
        subject = new Rule('asset', { requiredParams: [] })
        expect(subject.matches('asset')).toBeTruthy()
        expect(subject.matches('asset?i=foo')).toBeTruthy()
      })
    })

    describe('overriding segment values', () => {
      beforeEach(() => {
        subject = new Rule('/foo/:key', {
          patternOpts: {
            segmentNameStartChar: ':',
            segmentValueCharset:  '\\d',
          },
        })
      })

      it('uses segmentNameStartChar', () => {
        expect(subject.matches('/foo/78')).toBeTruthy()
      })

      it('uses segmentValueCharset', () => {
        expect(subject.matches('/foo/0x78')).toBeFalsy()
      })
    })
  })


  describe('params', () => {
    it('returns an object of matching params', () => {
      subject = new Rule('/$a-$b-$c', {})

      expect(subject.params('/foo-bar-baz')).toEqual({ a: 'foo', b: 'bar', c: 'baz' })
    })

    it('returns an Array of matching params', () => {
      subject = new Rule(/(\w+)\s(\d+)/, {})

      expect(subject.params('foo 39')).toEqual(['foo', '39'])
    })

    describe('initialized with regexp', () => {
      it('matches', () => {
        subject = new Rule(/\/foo(\d+)/, {})

        expect(subject.params('/foo78')).toEqual(['78'])
      })
    })

    describe('initialized with regexp and groupNames', () => {
      it('matches', () => {
        subject = new Rule(/\/foo(\d+)\/(.*)/, { groupNames: ['i', 'z'] })

        expect(subject.params('/foo78/boo')).toEqual({ i: '78', z: 'boo' })
      })
    })

    describe('initialized with uri and requiredParams', () => {
      beforeEach(() => {
        subject = new Rule('/asset', { requiredParams: ['i', 'z'] })
      })

      it('returns params', () => {
        expect(subject.params('/asset?i=foo&z=bar')).toEqual({ i: 'foo', z: 'bar' })
      })

      it('returns params if extra params', () => {
        expect(subject.params('/asset?i=foo&k=baz&z=bar')).toEqual({ i: 'foo', k: 'baz', z: 'bar' })
      })

      it('returns params if extra params at beginning', () => {
        expect(subject.params('/asset?a=z&i=foo&k=baz&z=bar')).toEqual({ a: 'z', i: 'foo', k: 'baz', z: 'bar' })
      })

      it('can be initialized with no requiredParams', () => {
        subject = new Rule('/asset', { requiredParams: [] })
        expect(subject.params('/asset?i=foo')).toEqual({ 'i': 'foo' })
      })

      ;[8, 'word', 'two words', 'ampersand a&p', 'a=b+c/d*2'].forEach(p => {
        it(`can match and extract "${p}" (round-trip encoding)`, () => {
          subject = new Rule('asset', { requiredParams: [] })

          const uri = canonicalUri({ uri: 'asset', params: { k: p } })
          expect(subject.params(uri)).toEqual({ k: p.toString() })
        })
      })

    })

    it('raises exception if cannot find matcher', () => {
      subject = new Rule('/$a-$b-$c', {})

      expect(() => {
        subject.params('nada-match')
      }).toThrow('possible bug: pattern found but does not match jobURI nada-match')
    })
  })


  describe('rawLoaderPromise', () => {
    it('calls loader with object', () => {
      const loader = jest.fn()
      subject      = new Rule('a', { loader: loader })
      const params = { a: 'b' }

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(params)
    })

    it('spreads Array params', () => {
      const loader = jest.fn()
      subject      = new Rule('a', { loader: loader })
      const params = ['a', 'b']

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(...params)
    })
  })


  describe('dependenciesAsURIs', () => {
    it('returns empty array if no dependsOn', () => {
      subject = new Rule('a', {})

      expect(subject.dependenciesAsURIs()).toEqual([])
    })
    it('returns string', () => {
      subject = new Rule('a', { dependsOn: 'foo' })

      expect(subject.dependenciesAsURIs()).toEqual(['foo'])
    })
    it('returns result of function', () => {
      subject = new Rule('a', { dependsOn: () => 'foo' })

      expect(subject.dependenciesAsURIs()).toEqual(['foo'])
    })
    it('passes params to function', () => {
      const dependsOn = jest.fn()
      subject         = new Rule('a', { dependsOn })

      subject.dependenciesAsURIs('foo')

      expect(dependsOn).toHaveBeenCalledWith('foo')
    })
    it('returns multiple', () => {
      subject = new Rule('a', { dependsOn: ['foo', 'bar'] })

      expect(subject.dependenciesAsURIs()).toEqual(['foo', 'bar'])
    })

  })

})
