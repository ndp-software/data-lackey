/* eslint-env jest */
import { DataLackey }       from './api'
import { waitForAssertion } from './jest/waitForAssertion'


describe('DataLackey', function () {

  const URI  = 'dl:test-123/456',
        URI2 = 'dl:test-123/789'
  let subject, resolveFn, rejectFn, mockLog, resultPromise,
      promise, promiseB,
      resolvePromiseANow, resolvePromiseBNow, resolvePromiseCNow,
      loaderFn, unloadFn

  beforeEach(() => {
    mockLog = jest.fn()
    subject = new DataLackey({ console: { log: mockLog } })
  })

  describe('with a data pattern', () => {

    beforeEach(() => {
      promise  = new Promise((resolve, reject) => {
        resolveFn = resolve
        rejectFn  = reject
      })
      loaderFn = jest.fn(() => promise)
      unloadFn = jest.fn()
      subject.rule('dl:test-$first/$second', {
        loader: loaderFn,
        unload: unloadFn,
      })
    })

    afterEach(() => {
      resolveFn()
    })


    describe('load', () => {
      beforeEach(() => {
        expect(subject.job(URI)).toBe()
        resultPromise = subject.load(URI)
      })

      it('calls loader function with the matches', () => {
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
      })

      it('returns result of loader function', () => {
        expect(resultPromise).toEqual(promise)
      })

      it('logs for non-matching pattern', () => {
        try {
          subject.load('foo')
        } catch (e) {
          // swallow
        } finally {
          expect(mockLog).toHaveBeenCalledWith('Unable to match "foo".')
        }
      })

      it('raises for non-matching pattern', () => {
        expect(() => {
          subject.load('foo')
        }).toThrow('Unmatched URI "foo"')
      })

      it('logs for Ambiguous matches', () => {
        subject.rule(/b../, { loader: () => Promise.resolve(1) })
        subject.rule(/.a./, { loader: () => Promise.resolve(1) })
        subject.rule(/..r/, { loader: () => Promise.resolve(1) })
        subject.load('bar')
        expect(mockLog).toHaveBeenCalledWith('Ambiguous URI "bar".')
      })

      it('initially is loading, but not not loaded or failed', () => {
        expect(subject.loading(URI)).toBe(true)
        expect(subject.loaded(URI)).toBe(false)
        expect(subject.failed(URI)).toBe(false)
      })

      describe('a second call', () => {
        it('does not call loader function again', () => {
          subject.load(URI)
          expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
          expect(loaderFn).toHaveBeenCalledTimes(1)
        })
        it('returns a data resource', () => {
          const r = subject.job(URI)
          expect(r).not.toBe()
          expect(r).not.toBe(null)
        })
      })

    })

    describe('load (with array)', function () {
      it('calls loader function with the matches', () => {
        expect(subject.job(URI)).toBe()
        subject.load([null, URI, null, URI, null])
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
        expect(loaderFn).toHaveBeenCalledTimes(1)
      })

      it('returns a promise for all loaders', () => {
        let resolve2Fn
        subject.rule('a', {
          loader: () => promise,
        })
        subject.rule('b', {
          loader: () => new Promise(resolve => {
            resolve2Fn = resolve
          }),
        })

        resultPromise = subject.load(['a', 'b'])

        let isResolved = false
        resultPromise  = resultPromise.then(() => isResolved = true)

        expect(isResolved).toEqual(false)
        resolveFn()
        expect(isResolved).toEqual(false)
        resolve2Fn()
        waitForAssertion(() => expect(isResolved).toEqual(true))

      })
    })

    describe('enqueue', () => {

      beforeEach(() => {
        expect(subject.job(URI)).toBe()
        subject.enqueue(URI)
      })

      it('does not call load()', () => {
        expect(loaderFn).not.toBeCalled()
        expect(subject.loading(URI)).toBe(false)
        expect(subject.loaded(URI)).toBe(false)
        expect(subject.failed(URI)).toBe(false)
      })

      it('is loaded when queue is worked', () => {
        subject.workNextJob()
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
        expect(loaderFn).toHaveBeenCalledTimes(1)
      })

      it('can "work" and empty queue', () => {
        subject.workNextJob()
        subject.workNextJob()
        subject.workNextJob()
      })

      it('works jobs FIFO', () => {
        subject.enqueue(URI2)
        subject.workNextJob()
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
        subject.workNextJob()
        expect(loaderFn).toBeCalledWith({ 'first': '123', 'second': '789' })
        expect(loaderFn).toHaveBeenCalledTimes(2)
      })
    })

    describe('unload()', () => {

      describe('before loading', () => {

        it('is ignored', () => {

          subject.unload(URI, true)

          expect(unloadFn).not.toBeCalled()
          expect(subject.loading(URI)).toBe(false)
          expect(subject.loaded(URI)).toBe(false)
          expect(subject.failed(URI)).toBe(false)
        })
      })

      describe('while loading', () => {
        it('is ignored', () => {
          expect(subject.loaded(URI)).toEqual(false)

          resultPromise = subject.load(URI)
          expect(subject.loaded(URI)).toEqual(false)
          expect(subject.loading(URI)).toEqual(true)

          const unloaded = subject.unload(URI, true)
          expect(subject.loading(URI)).toEqual(true) // Don't abort
          expect(unloaded).toEqual(false)
          expect(unloadFn).not.toBeCalled()
          // Note: this could be done the other way. TODO discuss
        })

      })
      describe('after loading', () => {
        it('becomes dirty', async function () {

          subject.load(URI)
          resolveFn()

          await subject.job(URI).promise
          expect(subject.loaded(URI)).toEqual(true)

          subject.unload(URI, true)
          expect(subject.loaded(URI)).toEqual(false)
          expect(unloadFn).toHaveBeenCalled()
        })

        it('will load again if asked for load', async function () {
          subject.load(URI)
          expect(loaderFn).toHaveBeenCalledTimes(1)
          resolveFn()
          await subject.job(URI).promise
          subject.unload(URI, true)

          subject.load(URI)
          expect(loaderFn).toHaveBeenCalledTimes(2)
        })

      })
    })


    describe('loading states', () => {

      it('returns false for unknown URIs', () => {
        expect(subject.loading('foo')).toEqual(false)
        expect(subject.loaded('foo')).toEqual(false)
        expect(subject.failed('foo')).toEqual(false)
      })

      it('transitions from loading to loaded when promise resolves', async function () {
        expect(subject.loading(URI)).toBe(false)
        expect(subject.loading([URI])).toBe(false)
        expect(subject.loading([URI, URI2])).toBe(false)
        expect(subject.loading(URI, URI2)).toBe(false)
        expect(subject.loaded(URI)).toBe(false)

        subject.load(URI)
        expect(subject.loading(URI)).toBe(true)
        expect(subject.loading([URI])).toBe(true)
        expect(subject.loading(URI2, URI)).toBe(true)
        expect(subject.loading([URI2, URI])).toBe(true)
        expect(subject.loaded(URI)).toBe(false)

        resolveFn()
        await subject.job(URI).promise
        expect(subject.loading(URI)).toBe(false)
        expect(subject.loaded(URI)).toBe(true)
        expect(subject.loaded([URI])).toBe(true)
        expect(subject.loaded([URI, URI])).toBe(true)
        expect(subject.loaded(URI2, URI)).toBe(false) // URI2 not loaded
        expect(subject.loaded([URI2, URI])).toBe(false)
        expect(subject.loaded([URI, URI2])).toBe(false)
      })
    })

    describe('failing states', () => {

      it('transitions to failed when promise is rejected', async function () {
        expect(subject.loading(URI)).toBe(false)
        expect(subject.loaded(URI)).toBe(false)
        expect(subject.failed(URI)).toBe(false)
        expect(subject.failed([URI])).toBe(false)
        expect(subject.failed(URI2, URI)).toBe(false)
        expect(subject.failed([URI2, URI])).toBe(false)

        subject.load(URI)

        expect(subject.loading(URI)).toBe(true)
        expect(subject.loaded(URI)).toBe(false)
        expect(subject.failed(URI)).toBe(false)

        rejectFn(-1)

        try {
          await subject.job(URI).promise
        } catch (e) {
          //expect(e).toMatch('error');
        }

        expect(subject.loading(URI)).toBe(false)
        expect(subject.loaded(URI)).toBe(false)
        expect(subject.failed(URI)).toBe(true)
        expect(subject.failed([URI])).toBe(true)
        expect(subject.failed(URI2, URI)).toBe(true)
        expect(subject.failed([URI2, URI])).toBe(true)
      })
    })

  })

  describe('express static dependencies on other resources', () => {
    it('express dependencies as strings', async () => {

      const loaderA = jest.fn(() => Promise.resolve(1))
      subject.rule('A7', {
        loader: loaderA,
      })

      promiseB      = Promise.resolve(null)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B7', {
        loader:    loaderB,
        dependsOn: 'A7',
      })

      await subject.load('B7')

      expect(loaderA).toHaveBeenCalled()
    })

    it('express dependencies as functions', async () => {
      const loaderA = jest.fn(() => Promise.resolve(true))
      subject.rule('A$post', {
        loader: loaderA,
      })

      promiseB      = Promise.resolve(null)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader:    loaderB,
        dependsOn: x => `A${x.post}`,
      })

      await subject.load('B12')

      expect(loaderA).toHaveBeenCalledWith({ post: '12' })
    })

    it('express multiple dependencies', async function () {
      // Dependency A
      const promiseA = new Promise(resolve => resolvePromiseANow = resolve),
            loaderA  = jest.fn(() => promiseA)
      subject.rule('A9', {
        loader: loaderA,
      })

      // Dependency B
      promiseB      = new Promise(resolve => resolvePromiseBNow = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader: loaderB,
      })

      // C depends on A and B
      const promiseC = new Promise(resolve => resolvePromiseCNow = resolve),
            loaderC  = jest.fn(() => promiseC)
      subject.rule('C$post', {
        loader:    loaderC,
        dependsOn: [i => `A${i.post}`, 'B4'],
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      const uberPromise = subject.load('C9') // <== trigger everything

      // expect(loaderA).not.toHaveBeenCalled()
      // expect(loaderB).not.toHaveBeenCalled()
      // expect(loaderC).not.toHaveBeenCalled()
      resolvePromiseANow('promiseA')
      await promiseA

      // expect(loaderA).toHaveBeenCalled()
      // expect(loaderB).not.toHaveBeenCalled()
      // expect(loaderC).not.toHaveBeenCalled()
      resolvePromiseBNow(1)
      await promiseB

      expect(loaderA).toHaveBeenCalled()
      expect(loaderB).toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()
      resolvePromiseCNow(true)
      await promiseC
      await uberPromise

      expect(loaderA).toHaveBeenCalledWith({})
      expect(loaderB).toHaveBeenCalledWith({ post: '4' })
      expect(loaderC).toHaveBeenCalledWith({ post: '9' })
    })

    it('express transitive dependencies', async function () {
      // Dependency A
      const promiseA = new Promise(resolve => resolvePromiseANow = resolve),
            loaderA  = jest.fn(() => promiseA)
      subject.rule('A$post', {
        loader: loaderA,
      })

      // Dependency B
      promiseB      = new Promise(resolve => resolvePromiseBNow = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader:    loaderB,
        dependsOn: ({ post }) => `A${post}`,
      })

      // C depends on A and B
      const promiseC = new Promise(resolve => {
              resolvePromiseCNow = resolve
            }),
            loaderC  = jest.fn(() => promiseC)
      subject.rule('C$post', {
        loader:    loaderC,
        dependsOn: ({ post }) => `B${post}`,
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()

      const uberPromise = subject.load('C123') // <== trigger everything

      expect(loaderA).toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()

      resolvePromiseANow('promiseA')
      await promiseA

      resolvePromiseBNow('promiseB')
      await promiseB

      resolvePromiseCNow('promiseC')
      await promiseC

      await uberPromise

      expect(loaderB).toHaveBeenCalled()
      expect(loaderC).toHaveBeenCalled()
    })

    it('express cyclic dependencies', async function () {
      // Dependency A
      const promiseA = new Promise(resolve => resolvePromiseANow = resolve),
            loaderA  = jest.fn(() => promiseA)
      subject.rule('A', {
        loader:    loaderA,
        dependsOn: () => 'B',
      })

      // Dependency B
      promiseB      = new Promise(resolve => resolvePromiseBNow = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B', {
        loader:    loaderB,
        dependsOn: () => 'A',
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      const a = subject.load('A')

      expect(subject.loading('A')).toEqual(true)
      expect(subject.loading('B')).toEqual(true)
      expect(subject.loaded('A')).toEqual(false)
      expect(subject.loaded('B')).toEqual(false)

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      resolvePromiseANow('promiseA')
      resolvePromiseBNow('promiseB')
      await promiseA

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).toHaveBeenCalled()
      await promiseB

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).toHaveBeenCalled()
      await a
      expect(loaderA).toHaveBeenCalled()
      expect(loaderB).toHaveBeenCalled()

      expect(loaderA).toHaveBeenCalled()
      expect(loaderB).toHaveBeenCalled()

    })
  })

  describe('reset', () => {

    const RESET_URI = 'dl:test'

    beforeEach(() => {
      mockLog = jest.fn()
      subject = new DataLackey({ console: { log: mockLog } })

      loaderFn = jest.fn(() => Promise.resolve('foo'))
      unloadFn = jest.fn()
      subject.rule('dl:test', {
        loader: loaderFn,
        unload: unloadFn,
      })
      expect(subject.job(RESET_URI)).toBe()
    })

    it('does nothing if nothing loaded', () => {
      expect(subject.JOBS.JOBS).toEqual({})
      expect(subject.loaded(RESET_URI)).toBe(false)

      subject.reset()

      expect(subject.loaded(RESET_URI)).toBe(false)
      expect(subject.JOBS.JOBS).toEqual({})
    })

    it('marks previously loaded jobs as unloaded', async () => {
      await subject.load(RESET_URI)
      expect(subject.loaded(RESET_URI)).toBe(true)
      expect(subject.JOBS.JOBS).not.toEqual({})

      subject.reset()

      expect(subject.loaded(RESET_URI)).toBe(false)
      expect(subject.JOBS.JOBS).toEqual({})
    })

    it('calls `unload` (this behavior subject to change)', async () => {
      expect(unloadFn).not.toHaveBeenCalled()
      await subject.load(RESET_URI)

      subject.reset()

      expect(unloadFn).toHaveBeenCalled()
    })

    it('handles in-progress jobs gracefully', async () => {
      promise = subject.load(RESET_URI)
      expect(subject.loading(RESET_URI)).toBe(true)

      subject.reset()

      await promise
      expect(subject.loading(RESET_URI)).toBe(false)
    })
  })


  describe('pollNow and #enqueueNextPollNow', () => {

    it('passes result of workNextJob to enqueueNextPollNow', () => {
      subject.workNextJob        = jest.fn(() => 'foo')
      subject.enqueueNextPollNow = jest.fn()

      subject.pollNow()

      expect(subject.enqueueNextPollNow).toHaveBeenCalledWith('foo')
    })

    it('keeps polling if the promise is null', () => {
      subject.workNextJob = jest.fn(() => null)
      window.setTimeout   = jest.fn()

      subject.enqueueNextPollNow(null)

      expect(window.setTimeout).toHaveBeenCalledWith(subject.pollNow, 1000)
    })

    it('keeps polling when the promise resolves', async () => {
      jest.useFakeTimers()
      subject.pollNow = jest.fn()

      const promise1 = Promise.resolve()
      subject.enqueueNextPollNow(promise1)

      await promise1
      expect(subject.pollNow).not.toHaveBeenCalled()
      jest.runOnlyPendingTimers()

      expect(subject.pollNow).toHaveBeenCalled()
    })

    it('keeps polling when the promise rejects', async () => {
      subject.pollNow = jest.fn()

      promise = Promise.reject('fail')
      subject.enqueueNextPollNow(promise)

      try {
        await promise
      } catch (e) {
        expect(e).toEqual('fail')
        expect(subject.pollNow).toHaveBeenCalled()
      }

    })


  })


})

