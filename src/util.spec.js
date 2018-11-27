/* eslint-env jest */

import * as subject from './util'

describe('arrayEqual', () => {

  it('handles the same array', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, a)).toEqual(true)
  })

  it('handles nulls', () => {
    const a = ['foo', 'bar']
    expect(subject.arraysEqual(a, null)).toEqual(false)
    expect(subject.arraysEqual(null, a)).toEqual(false)
    expect(subject.arraysEqual(null, null)).toEqual(true)
  })
})
