/* eslint-env jest */

import ruleFactory from './ruleFactory'
import Rule        from './Rule'


describe('Rule', () => {
  let subject

  describe('matches', () => {
    test('defers to the matcher', () => {
      const matcherResult = Math.random(),
            mock          = jest.fn(() => matcherResult)
      subject             = new Rule({ matches: mock }, {}, {})

      const result = subject.matches('foo')

      expect(mock).toHaveBeenCalledWith('foo')
      expect(result).toBe(matcherResult)
    })
  })

  describe('params', () => {
    test('defers to the matcher', () => {
      const matcherResult = Math.random(),
            mock          = jest.fn(() => matcherResult)
      subject             = new Rule({ params: mock }, {}, {})

      const result = subject.params('foo')

      expect(mock).toHaveBeenCalledWith('foo')
      expect(result).toBe(matcherResult)
    })
  })

  describe('rawLoaderPromise', () => {
    test('calls loader with object', () => {
      const loader = jest.fn()
      subject      = ruleFactory('a', { loader: loader })
      const params = { a: 'b' }

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(params)
    })

    test('spreads Array params', () => {
      const loader = jest.fn()
      subject      = ruleFactory('a', { loader: loader })
      const params = ['a', 'b']

      subject.rawLoaderPromise(params)

      expect(loader).toHaveBeenCalledWith(...params)
    })
  })

})
