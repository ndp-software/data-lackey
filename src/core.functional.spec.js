/* eslint-env jest */
import { DataLackey }          from './core'
import createLackeyWithLoaders from './example'

describe('DataLackey', () => {

  describe('specifying a simple data lackey URI', function () {

    const uri          = 'todos'
    const responseBody = [{ id: 1 }, { id: 2 }]
    let loader, loadAction, subject, mockFetch, dispatch

    beforeEach(() => subject = new DataLackey())

    beforeEach(() => {
      dispatch   = jest.fn()
      loadAction = jest.fn(x => ({ type: 'load', payload: x }))
      mockFetch  = Promise.resolve(responseBody)
      loader     = jest.fn(() => mockFetch.then(data => dispatch(loadAction(data))))
    })

    beforeEach(() => {
      subject.rule(/todos/, { loader })
    })

    it('expects initial state and `loader` not to have been called', () => {
      expect(subject.loaded(uri)).toBeFalsy()
      expect(loader).not.toHaveBeenCalled()
    })

    it('load() returns the promise', async () => {
      const result = subject.load(uri)
      expect(result).toEqual(mockFetch)
      await result
    })

    it('load() calls the `loader` function', async () => {

      await subject.load(uri)

      expect(loader).toHaveBeenCalled()

      expect(loadAction).toHaveBeenCalled()
      expect(loadAction.mock.calls.length).toEqual(1)
      const ids = loadAction.mock.calls[0][0]
      expect(ids[0].id).toEqual(1)
      expect(ids[1].id).toEqual(2)

      expect(dispatch).toHaveBeenCalledWith({ 'type': 'load', 'payload': responseBody })
    })

  })


  describe('specifying dependent data lackey URI', function () {

    let rootLoader, itemLoader, detailsLoader, loadAction, subject, dispatch

    beforeEach(() => {
      dispatch      = jest.fn()
      loadAction    = jest.fn(x => ({ type: 'load', payload: x }))
      rootLoader    = jest.fn(() => Promise.resolve([{ id: 1 }, { id: 2 }]).then(data => dispatch(loadAction(data))))
      itemLoader    = jest.fn(id => Promise.resolve({
                                                      id,
                                                      name: `It's ${id}`,
                                                    }).then(data => dispatch(loadAction(data))))
      detailsLoader = jest.fn(id => Promise.resolve({
                                                      id,
                                                      details: 'some detail',
                                                    }).then(data => dispatch(loadAction(data))))

      subject = createLackeyWithLoaders({ rootLoader, itemLoader, detailsLoader })

    })

    it('rootLoader is not yet called', () => {
      expect(subject.loaded('dl:items')).toBeFalsy()
      expect(rootLoader).not.toHaveBeenCalled()
      expect(itemLoader).not.toHaveBeenCalled()
      expect(detailsLoader).not.toHaveBeenCalled()
    })

    it('calling load() returns the promise', async () => {
      const result = subject.load('dl:item/1/details')
      expect(result).toBeInstanceOf(Promise)
      await result
    })

    it('load() calls the `rootLoader` function', async () => {

      await subject.load('dl:item/2/details')

      expect(rootLoader).toHaveBeenCalled()
      expect(itemLoader).toHaveBeenCalled()
      expect(detailsLoader).toHaveBeenCalled()

      expect(loadAction).toHaveBeenCalled()
      const calls = loadAction.mock.calls
      expect(calls.length).toEqual(3)
      expect(calls[0][0][0].id).toEqual(1)
      expect(calls[1][0]).toEqual({ id: '2', name: 'It\'s 2' })
      expect(calls[2][0]).toEqual({ id: '2', details: 'some detail' })
    })

  })
})
