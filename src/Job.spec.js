/* eslint-disable promise/avoid-new */
/* eslint-env jest */

import Job  from './Job'

describe('Job', () => {

  let subject, loader, ruleOptions

  beforeEach(() => {
    loader      = () => Promise.resolve('foo')
    ruleOptions = {}
  })

  describe('new Job()', () => {
    beforeEach(() => {
      ruleOptions = {}
      subject     = new Job('uri', loader, ruleOptions)
    })
    it('is not loading', () => expect(subject.loading).toBeFalsy())
    it('is not reloading', () => expect(subject.reloading).toBeFalsy())
    it('is not loaded', () => expect(subject.loaded).toBeFalsy())
    it('is not failed', () => expect(subject.failed).toBeFalsy())
  })

  describe('.load pending', () => {
    let resolver
    beforeEach(() => {
      const promise = new Promise(resolve => resolver = () => resolve())
      loader  = () => promise
      subject = new Job('uri', loader, ruleOptions)
      expect(subject.load({})).toEqual(promise)
    })

    afterEach(() => resolver())

    it('is loading', () => expect(subject.loading).toBeTruthy())
    it('is not reloading', () => expect(subject.reloading).toBeFalsy())
    it('is not loaded', () => expect(subject.loaded).toBeFalsy())
    it('is not failed', () => expect(subject.failed).toBeFalsy())
  })

  describe('.load resolved', () => {
    let resolver
    beforeEach(() => {
      loader = () => new Promise(resolve => resolver = () => resolve())
      subject = new Job('uri', loader, ruleOptions)
      subject.load({})
      resolver()
    })

    it('is not loading', () => expect(subject.loading).toBeFalsy())
    it('is not reloading', () => expect(subject.reloading).toBeFalsy())
    it('is loaded', () => expect(subject.loaded).toBeTruthy())
    it('is not failed', () => expect(subject.failed).toBeFalsy())
  })

  describe('.load failing', () => {
    let fail
    beforeEach(() => {
      // eslint-disable-next-line no-unused-vars
      loader = () => new Promise((resolve, reject) => fail = () => reject())
      subject = new Job('uri', loader, ruleOptions)
      subject.load({})
      fail()
    })

    it('is loading', () => expect(subject.loading).toBeFalsy())
    it('is not reloading', () => expect(subject.reloading).toBeFalsy())
    it('is not loaded', () => expect(subject.loaded).toBeFalsy())
    it('is failed', () => expect(subject.failed).toBeTruthy())
  })

  describe('.reload', () => {
    it('does nothing if not loaded', () => {
      subject = new Job('uri', loader, ruleOptions)

      subject.reload()

      expect(subject.loaded).toBeFalsy()
      expect(subject.loading).toBeFalsy()
    })

    it('does nothing if at reload limit', () => {
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

    it('calls reload', async () => {
      let resolver
      loader = () => new Promise(resolve => resolver = () => resolve())
      subject             = new Job('uri', loader, ruleOptions)
      subject.loading     = false
      subject.reloading   = false
      subject.loaded      = true
      subject.reloadLimit = 10

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

      expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10)
    })
  })


})
