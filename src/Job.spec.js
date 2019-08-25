/* eslint-env jest */

import Job from './Job'

describe('Job', () => {

  let subject, loader, ruleOptions, onLoad, console
  beforeEach(() => {
    loader      = () => Promise.resolve('foo')
    onLoad      = jest.fn()
    console     = { log: jest.fn(), error: jest.fn() }
    ruleOptions = { onLoad, console }
    subject     = new Job('uri', loader, ruleOptions)
  })

  describe('new Job()', () => {
    test('is not loading', () => expect(subject.loading).toBeFalsy())
    test('is not reloading', () => expect(subject.reloading).toBeFalsy())
    test('is not loaded', () => expect(subject.loaded).toBeFalsy())
    test('is not failed', () => expect(subject.failed).toBeFalsy())
  })

  describe('.load', () => {
    let resolveNow, rejectNow, promise, resolved, rejected

    beforeEach(() => {
      resolved = false
      rejected = false
      promise  = new Promise((resolve, reject) => {
        resolveNow = () => resolve()
        rejectNow = () => reject()
      })
      loader   = () => promise
      subject  = new Job('uri', loader, ruleOptions)
      expect(subject.load({})
                    .then(() => resolved = true)
                    .catch(() => rejected = true))
        .toEqual(promise)
    })

    describe('when pending', () => {

      afterEach(() => resolveNow())

      test('is loading', () => expect(subject.loading).toBeTruthy())
      test('is not reloading', () => expect(subject.reloading).toBeFalsy())
      test('is not loaded', () => expect(subject.loaded).toBeFalsy())
      test('is not failed', () => expect(subject.failed).toBeFalsy())
      test('calls onLoad option', () => {
        expect(onLoad).toHaveBeenCalledWith(subject)
      })
    })

    describe('resolved', () => {
      beforeEach(() => resolveNow())

      test('is not loading', () => expect(subject.loading).toBeFalsy())
      test('is not reloading', () => expect(subject.reloading).toBeFalsy())
      test('is loaded', () => expect(subject.loaded).toBeTruthy())
      test('is not failed', () => expect(subject.failed).toBeFalsy())
      test('promise is resolved', () => expect(resolved).toBeTruthy())
      test('promise is not rejected', () => expect(rejected).toBeFalsy())
    })

    describe('rejected', () => {
      beforeEach(() => rejectNow())

      test('is loading', () => expect(subject.loading).toBeFalsy())
      test('is not reloading', () => expect(subject.reloading).toBeFalsy())
      test('is not loaded', () => expect(subject.loaded).toBeFalsy())
      test('is failed', () => expect(subject.failed).toBeTruthy())
      test('promise is not resolved', () => expect(resolved).toBeFalsy())
      test('promise is rejected', () => expect(rejected).toBeTruthy())
    })

  })

  describe('.reload', () => {
    describe('if not loaded', () => {
      test('does nothing', () => {
        subject = new Job('uri', loader, ruleOptions)

        subject.reload()

        expect(subject.loaded).toBeFalsy()
        expect(subject.loading).toBeFalsy()
      })
    })

    describe('if at reload limit', () => {
      test('does nothing', () => {
        subject             = new Job('uri', loader, ruleOptions)
        subject.loading     = false
        subject.reloading   = false
        subject.loaded      = true
        subject.reloadLimit = -1

        subject.reload()

        expect(subject.loading).toBeFalsy()
        expect(subject.reloading).toBeFalsy()
        expect(subject.loaded).toBeTruthy()
      })
    })


    test('calls reload', async () => {
      let resolveNow
      loader                  = () => new Promise(resolve => resolveNow = () => resolve())
      ruleOptions.reloadLimit = 10
      subject                 = new Job('uri', loader, ruleOptions)
      subject.loading         = false
      subject.reloading       = false
      subject.loaded          = true

      const promise = subject.reload()

      expect(subject.reloadLimit).toEqual(9)

      expect(subject.loading).toBeTruthy()
      expect(subject.reloading).toBeTruthy()
      expect(subject.loaded).toBeTruthy()

      resolveNow()
      await promise

      expect(subject.loading).toBeFalsy()
      expect(subject.reloading).toBeFalsy()
      expect(subject.loaded).toBeTruthy()
    })

    test('respects reloadLimit', () => {
      subject             = new Job('uri', loader, ruleOptions)
      subject.loaded      = true
      subject.reloadLimit = 0
      subject.load        = jest.fn()

      subject.reload()

      expect(subject.load).not.toHaveBeenCalled()
    })
  })

  describe('shouldPoll', function () {
    test('defaults to false', () => {
      subject = new Job('uri', loader, ruleOptions)
      expect(subject.shouldPoll()).toBeFalsy()
    })

    test('returns true if reloadInterval set with rule', () => {
      subject = new Job('uri', loader, { reloadInterval: 10 })
      expect(subject.shouldPoll()).toBeTruthy()
    })

    test('returns true if reloadInterval set with load()', () => {
      subject = new Job('uri', loader, ruleOptions)
      subject.load({ reloadInterval: 10 })
      expect(subject.shouldPoll()).toBeTruthy()
    })
  })

  describe('startPolling (polling with reloadInterval)', () => {
    test('does nothing if already queued up', () => {
      subject                 = new Job('uri', loader, ruleOptions)
      subject.reloadTimeoutId = 1
      window.setTimeout       = jest.fn()

      subject.startPolling()

      expect(window.setTimeout).not.toHaveBeenCalled()
    })

    test('queues up a job in N ms', () => {
      subject                 = new Job('uri', loader, { reloadInterval: 10 })
      subject.reloadTimeoutId = null
      window.setTimeout       = jest.fn()

      subject.startPolling()

      expect(window.setTimeout).toHaveBeenCalledWith(subject.reloadAgain, 10)
    })
  })

  describe('reloadAgain', () => {
    test('calls reload', () => {
      subject.reload = jest.fn()

      subject.reloadAgain()

      expect(subject.reload).toHaveBeenCalledWith()

    })
    test('resets reloadTimeoutId', () => {
      subject.reloadTimeoutId = 'foo'

      subject.reloadAgain()

      expect(subject.reloadTimeoutId).toEqual(null)
    })
  })

  describe('onUnload', () => {
    test('calls clearTimeout', () => {
      window.clearTimeout = jest.fn()

      subject.onUnload()

      expect(window.clearTimeout).not.toHaveBeenCalled()

      subject.reloadTimeoutId = 1

      subject.onUnload()

      expect(window.clearTimeout).toHaveBeenCalledWith(1)
    })

    test('calls ruleOptions.unload', () => {
      ruleOptions = { onLoad, unload: jest.fn() }
      subject     = new Job('uri', loader, ruleOptions)

      subject.onUnload()

      expect(ruleOptions.unload).toHaveBeenCalledWith(subject.uri)
    })
  })


})
