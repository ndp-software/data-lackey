/* eslint-env jest */

import {
  createReactPromiseDispatcher,
} from './reactDispatcher'

describe('createReactPromiseDispatcher', () => {
  it('returns a function that accepts a job and calls dispatch', () => {
    const dispatch = jest.fn(),
          subject  = createReactPromiseDispatcher(dispatch),
          promise  = Promise.resolve('foo'),
          job      = { promise, ruleOptions: { actionType: 'FOO' } }

    subject(job)

    expect(dispatch).toHaveBeenCalledWith({
                                            type:    'FOO',
                                            payload: promise,
                                          })
  })

  it('does not dispatch if no actionType', () => {
    const dispatch = jest.fn(),
          subject  = createReactPromiseDispatcher(dispatch),
          promise  = Promise.resolve('foo'),
          job      = { promise, ruleOptions: { actionType: null } }

    subject(job)

    expect(dispatch).not.toHaveBeenCalled()
  })
})
