/* eslint-disable promise/avoid-new,promise/catch-or-return */
/* eslint-env jest */
import { DataLackey } from './core'


describe('DataLackey', function () {

  const URI  = 'dl:test-123/456',
        URI2 = 'dl:test-123/789'
  let subject, resolveFn, rejectFn, mockLog, result,
        promise, promiseB,
        promiseAResolve, promiseBResolve, promiseCResolve,
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


    describe('#matchJobs', () => {

      describe('given a string', () => {
        it('returns empty array when none known', () => {
          expect(subject.matchJobs(URI)).toEqual([])
        })

        it('returns empty array when no match', () => {
          subject.load(URI)
          expect(subject.matchJobs('foo')).toEqual([])
        })

        it('returns a loading URI that matches', () => {
          subject.load(URI)
          expect(subject.matchJobs(URI)).toEqual([URI])
        })

        it('returns empty array if only partial match', () => {
          subject.load(URI)
          expect(subject.matchJobs(URI.slice(0, URI.length - 3))).toEqual([])
        })

      })

      describe('given multiple params', () => {
        it('returns empty array when none known', () => {
          expect(subject.matchJobs(URI, URI2)).toEqual([])
        })

        it('returns a loading URI when first param matches', () => {
          subject.load(URI)
          expect(subject.matchJobs(URI, 'foo')).toEqual([URI])
        })

        it('returns URI when second param matches', () => {
          subject.load(URI)
          expect(subject.matchJobs('foo', URI)).toEqual([URI])
        })

        it('returns two matchJobs when two params match', () => {
          subject.load(URI)
          subject.load(URI2)
          expect(subject.matchJobs(URI, URI2)).toEqual([URI, URI2])
        })


      })

      describe('given a function', () => {
        it('returns empty array when none known', () => {
          expect(subject.matchJobs(_uri => true)).toEqual([])
        })

        it('returns URI if fn returns true', () => {
          subject.load(URI)
          expect(subject.matchJobs(_uri => true)).toEqual([URI])
        })

        it('does not return URI if fn returns false', () => {
          subject.load(URI)
          expect(subject.matchJobs(_uri => false)).toEqual([])
        })
      })

      describe('given a regular expression', () => {
        const regEx = /test-(\d+)\/(\d+)/

        it('returns empty array when none known', () => {
          expect(subject.matchJobs(regEx)).toEqual([])
        })

        it('returns URI if fn returns true', () => {
          subject.load(URI)
          expect(subject.matchJobs(regEx)).toEqual([URI])
        })

        it('does not return URI if fn returns false', () => {
          subject.load(URI)
          expect(subject.matchJobs(/x93fk/)).toEqual([])
        })

      })
    })


    describe('#load', () => {
      beforeEach(() => {
        expect(subject.job(URI)).toBe()
        result = subject.load(URI)
      })

      it('calls loader function with the matches', () => {
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
      })

      it('returns result of loader function', () => {
        expect(result).toEqual(promise)
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

      it('logs for duplicate matches', () => {
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

    describe('#load (with array)', function () {
      it('calls loader function with the matches', () => {
        expect(subject.job(URI)).toBe()
        result = subject.load([null, URI, null, URI, null])
        expect(loaderFn).toBeCalledWith({ first: '123', second: '456' })
        expect(loaderFn).toHaveBeenCalledTimes(1)
      })
    })

    describe('#enqueue', () => {

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
        expect(loaderFn).toBeCalledWith({'first': '123', 'second': '789'} )
        expect(loaderFn).toHaveBeenCalledTimes(2)
      })
    })

    describe('#unload()', () => {

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

          result = subject.load(URI)
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
      const promiseA = new Promise(resolve => promiseAResolve = resolve)
      const loaderA = jest.fn(() => promiseA)
      subject.rule('A9', {
        loader: loaderA,
      })

      // Dependency B
      const promiseB = new Promise(resolve => promiseBResolve = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader: loaderB,
      })

      // C depends on A and B
      const promiseC = new Promise(resolve => promiseCResolve = resolve)
      const loaderC = jest.fn(() => promiseC)
      subject.rule('C$post', {
        loader:    loaderC,
        dependsOn: [i => `A${i.post}`, 'B4'],
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      const uberPromise = subject.load('C9') // <== trigger everything

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()
      promiseAResolve('promiseA')
      await promiseA

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()
      promiseBResolve(1)
      await promiseB

      expect(loaderA).toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()
      // expect(loaderC).toHaveBeenCalled()
      promiseCResolve(true)
      await promiseC
      await uberPromise

      expect(loaderA).toHaveBeenCalledWith({})
      expect(loaderB).toHaveBeenCalledWith({ post: '4' })
      expect(loaderC).toHaveBeenCalledWith({ post: '9' })

    })

    it('express transitive dependencies', async function () {
      // Dependency A
      const promiseA = new Promise(resolve => promiseAResolve = resolve)
      const loaderA = jest.fn(() => promiseA)
      subject.rule('A$post', {
        loader: loaderA,
      })

      // Dependency B
      const promiseB = new Promise(resolve => promiseBResolve = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader:    loaderB,
        dependsOn: i => `A${i}`,
      })

      // C depends on A and B
      const promiseC = new Promise(resolve => {
        promiseCResolve = resolve
      })
      const loaderC  = jest.fn(() => promiseC)
      subject.rule('C$post', {
        loader:    loaderC,
        dependsOn: i => `B${i}`,
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()

      const uberPromise = subject.load('C123') // <== trigger everything

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()
      expect(loaderC).not.toHaveBeenCalled()

      promiseAResolve('promiseA')
      promiseA.then(() => promiseBResolve('promiseB'))
      promiseB.then(() => promiseCResolve('promiseC'))

      promiseA.then(() => {
        expect(loaderA).not.toHaveBeenCalled()
        expect(loaderB).not.toHaveBeenCalled()
        expect(loaderC).not.toHaveBeenCalled()
        return 'A'
      })

      promiseB.then(() => {
        expect(loaderA).not.toHaveBeenCalled()
        expect(loaderB).not.toHaveBeenCalled()
        expect(loaderC).not.toHaveBeenCalled()
        return 'B'
      })

      promiseC.then(() => {
        expect(loaderA).not.toHaveBeenCalledWith('123')
        expect(loaderB).not.toHaveBeenCalledWith('123')
        expect(loaderC).not.toHaveBeenCalledWith('123')
        return 'C'
      })

      await promiseA
      await promiseB
      await promiseC
      await uberPromise
    })

    it('express cyclic dependencies', async function () {
      // Dependency A
      const promiseA = new Promise(resolve => promiseAResolve = resolve)
      const loaderA = jest.fn(() => promiseA)
      subject.rule('A$post', {
        loader:    loaderA,
        dependsOn: i => `B${i}`,
      })

      // Dependency B
      const promiseB = new Promise(resolve => promiseBResolve = resolve)
      const loaderB = jest.fn(() => promiseB)
      subject.rule('B$post', {
        loader:    loaderB,
        dependsOn: i => `A${i}`,
      })

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      subject.load('A123')

      expect(loaderA).not.toHaveBeenCalled()
      expect(loaderB).not.toHaveBeenCalled()

      promiseAResolve('promiseA')
      promiseA.then(() => promiseBResolve('promiseB'))

      promiseA.then(() => {
        expect(loaderA).toHaveBeenCalled()
        expect(loaderB).toHaveBeenCalled()
        return 'A'
      })

      promiseB.then(() => {
        expect(loaderA).toHaveBeenCalled()
        expect(loaderB).toHaveBeenCalled()
        return 'B'
      })

      await promiseA
      await promiseB
    })
  })

})

