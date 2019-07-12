/* eslint-disable promise/avoid-new */
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
    it('is not loading', () => expect(subject.loading).toBeFalsy())
    it('is not reloading', () => expect(subject.reloading).toBeFalsy())
    it('is not loaded', () => expect(subject.loaded).toBeFalsy())
    it('is not failed', () => expect(subject.failed).toBeFalsy())
  })

  describe('.load', () => {
    let resolver, rejecter, promise, resolved, rejected

    beforeEach(() => {
      resolved = false
      rejected = false
      promise  = new Promise((resolve, reject) => {
        resolver = () => resolve()
        rejecter = () => reject()
      })
      loader   = () => promise
      subject  = new Job('uri', loader, ruleOptions)
      expect(subject.load({})
                    .then(() => resolved = true)
                    .catch(() => rejected = true))
        .toEqual(promise)
    })

    describe('when pending', () => {

      afterEach(() => resolver())

      it('is loading', () => expect(subject.loading).toBeTruthy())
      it('is not reloading', () => expect(subject.reloading).toBeFalsy())
      it('is not loaded', () => expect(subject.loaded).toBeFalsy())
      it('is not failed', () => expect(subject.failed).toBeFalsy())
      it('calls onLoad option', () => {
        expect(onLoad).toHaveBeenCalledWith(subject)
      })
    })

    describe('resolved', () => {
      beforeEach(() => resolver())

      it('is not loading', () => expect(subject.loading).toBeFalsy())
      it('is not reloading', () => expect(subject.reloading).toBeFalsy())
      it('is loaded', () => expect(subject.loaded).toBeTruthy())
      it('is not failed', () => expect(subject.failed).toBeFalsy())
      it('promise is resolved', () => expect(resolved).toBeTruthy())
      it('promise is not rejected', () => expect(rejected).toBeFalsy())
    })

    describe('rejected', () => {
      beforeEach(() => rejecter())

      it('is loading', () => expect(subject.loading).toBeFalsy())
      it('is not reloading', () => expect(subject.reloading).toBeFalsy())
      it('is not loaded', () => expect(subject.loaded).toBeFalsy())
      it('is failed', () => expect(subject.failed).toBeTruthy())
      it('promise is not resolved', () => expect(resolved).toBeFalsy())
      it('promise is rejected', () => expect(rejected).toBeTruthy())
    })

  })

  describe('.reload', () => {
    describe('if not loaded', () => {
      it('does nothing', () => {
        subject = new Job('uri', loader, ruleOptions)

        subject.reload()

        expect(subject.loaded).toBeFalsy()
        expect(subject.loading).toBeFalsy()
      })
    })

    describe('if at reload limit', () => {
      it('does nothing', () => {
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


    it('calls reload', async () => {
      let resolver
      loader                  = () => new Promise(resolve => resolver = () => resolve())
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

      resolver()
      await promise

      expect(subject.loading).toBeFalsy()
      expect(subject.reloading).toBeFalsy()
      expect(subject.loaded).toBeTruthy()
    })

    it('respects reloadLimit', () => {
      subject             = new Job('uri', loader, ruleOptions)
      subject.loaded      = true
      subject.reloadLimit = 0
      subject.load        = jest.fn()

      subject.reload()

      expect(subject.load).not.toHaveBeenCalled()
    })
  })

  describe('shouldPoll', function () {
    it('defaults to false', () => {
      subject = new Job('uri', loader, ruleOptions)
      expect(subject.shouldPoll()).toBeFalsy()
    })

    it('returns true if reloadInterval set with rule', () => {
      subject = new Job('uri', loader, { reloadInterval: 10 })
      expect(subject.shouldPoll()).toBeTruthy()
    })

    it('returns true if reloadInterval set with load()', () => {
      subject = new Job('uri', loader, ruleOptions)
      subject.load({ reloadInterval: 10 })
      expect(subject.shouldPoll()).toBeTruthy()
    })
  })

  describe('startPolling (polling with reloadInterval)', () => {
    it('does nothing if already queued up', () => {
      subject                 = new Job('uri', loader, ruleOptions)
      subject.reloadTimeoutId = 1
      window.setTimeout       = jest.fn()

      subject.startPolling()

      expect(window.setTimeout).not.toHaveBeenCalled()
    })

    it('queues up a job in N ms', () => {
      subject                 = new Job('uri', loader, { reloadInterval: 10 })
      subject.reloadTimeoutId = null
      window.setTimeout       = jest.fn()

      subject.startPolling()

      expect(window.setTimeout).toHaveBeenCalledWith(subject.reloadAgain, 10)
    })
  })

  describe('reloadAgain', () => {
    it('calls reload', () => {
      subject.reload = jest.fn()

      subject.reloadAgain()

      expect(subject.reload).toHaveBeenCalledWith()

    })
    it('resets reloadTimeoutId', () => {
      subject.reloadTimeoutId = 'foo'

      subject.reloadAgain()

      expect(subject.reloadTimeoutId).toEqual(null)
    })
  })

  describe('onUnload', () => {
    it('calls clearTimeout', () => {
      window.clearTimeout = jest.fn()

      subject.onUnload()

      expect(window.clearTimeout).not.toHaveBeenCalled()

      subject.reloadTimeoutId = 1

      subject.onUnload()

      expect(window.clearTimeout).toHaveBeenCalledWith(1)

    })

    it('calls ruleOptions.unload', () => {
      ruleOptions = { onLoad, unload: jest.fn() }
      subject     = new Job('uri', loader, ruleOptions)

      subject.onUnload()

      expect(ruleOptions.unload).toHaveBeenCalledWith(subject.uri)
    })
  })


})
