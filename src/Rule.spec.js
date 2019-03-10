/* eslint-env jest */

import Rule from './Rule'


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
      subject = new Rule('a', { loader: loader })
      const params = { a: 'b' }

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(params)
    })

    it('spreads Array params', () => {
      const loader = jest.fn()
      subject = new Rule('a', { loader: loader })
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
      subject = new Rule('a', { dependsOn })

      subject.dependenciesAsURIs('foo')

      expect(dependsOn).toHaveBeenCalledWith('foo')
    })
    it('returns multiple', () => {
      subject = new Rule('a', { dependsOn: ['foo','bar'] })

      expect(subject.dependenciesAsURIs()).toEqual(['foo','bar'])
    })

  })

})
