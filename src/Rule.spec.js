/* eslint-env jest */

import ruleFactory      from './ruleFactory'


describe('Rule', () => {
  let subject

  describe('rawLoaderPromise', () => {
    it('calls loader with object', () => {
      const loader = jest.fn()
      subject      = ruleFactory('a', { loader: loader })
      const params = { a: 'b' }

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(params)
    })

    it('spreads Array params', () => {
      const loader = jest.fn()
      subject      = ruleFactory('a', { loader: loader })
      const params = ['a', 'b']

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(...params)
    })
  })


  describe('dependenciesAsURIs', () => {
    it('returns empty array if no dependsOn', () => {
      subject = ruleFactory('a', {})

      expect(subject.dependenciesAsURIs()).toEqual([])
    })
    it('returns string', () => {
      subject = ruleFactory('a', { dependsOn: 'foo' })

      expect(subject.dependenciesAsURIs()).toEqual(['foo'])
    })
    it('returns result of function', () => {
      subject = ruleFactory('a', { dependsOn: () => 'foo' })

      expect(subject.dependenciesAsURIs()).toEqual(['foo'])
    })
    it('passes params to function', () => {
      const dependsOn = jest.fn()
      subject         = ruleFactory('a', { dependsOn })

      subject.dependenciesAsURIs('foo')

      expect(dependsOn).toHaveBeenCalledWith('foo')
    })
    it('returns multiple', () => {
      subject = ruleFactory('a', { dependsOn: ['foo', 'bar'] })

      expect(subject.dependenciesAsURIs()).toEqual(['foo', 'bar'])
    })

  })

})
