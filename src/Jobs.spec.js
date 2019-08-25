/* eslint-env jest */
import Job  from './Job'
import Jobs from './Jobs'


describe('matchingURIs', () => {
  it('returns matching URIs', () => {
    const subject = new Jobs()
    subject.setJob('a', {})

    expect(subject.matchingURIs(() => true)).toEqual(['a'])
    expect(subject.matchingURIs(() => false)).toEqual([])
  })
})

describe('urisFromSpecs', () => {
  it('returns matching URIs', () => {
    const subject = new Jobs()
    subject.setJob('a', {})

    expect(subject.urisFromSpecs('a')).toEqual(['a'])
    expect(subject.urisFromSpecs('b')).toEqual([])
  })
})

describe('jobsFromSpecs', () => {
  it('returns matching URIs', () => {
    const job     = 'foo',
          subject = new Jobs()
    subject.setJob('a', job)

    expect(subject.jobsFromSpecs('a')).toEqual([job])
    expect(subject.jobsFromSpecs('b')).toEqual([])
  })
})

describe('inspect', () => {

  let subject

  const URI = 'dl:test-123/456'

  beforeEach(() => {
    subject = new Jobs()
  })

  it('returns empty array if no jobs', () => {
    subject = new Jobs()
    expect(subject.inspect()).toEqual([])
  })

  it('returns job info', () => {
    subject = new Jobs()
    subject.setJob(URI, new Job(URI, jest.fn()))
    expect(subject.inspect()).toEqual([
                                        [
                                          'dl:test-123/456',
                                          '',
                                          {},
                                          undefined,
                                        ],
                                      ])
  })
})
