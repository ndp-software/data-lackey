/* eslint-env jest */
import Job  from './Job'
import Jobs from './Jobs'

describe('matchJobs', () => {

  let subject

  const URI  = 'dl:test-123/456',
        URI2 = 'dl:test-123/789'

  beforeEach(() => {
    subject = new Jobs()
  })

  describe('given a string', () => {
    it('returns a loading URI that matches', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      expect(subject.matchJobs(URI)).toEqual([URI])
    })
  })

  describe('given multiple params', () => {
    it('returns empty array when none known', () => {
      expect(subject.matchJobs(URI, URI2)).toEqual([])
    })

    it('returns a loading URI when first param matches', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      expect(subject.matchJobs(URI, 'foo')).toEqual([URI])
    })

    it('returns URI when second param matches', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      expect(subject.matchJobs('foo', URI)).toEqual([URI])
    })

    it('returns two matchJobs when two params match', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      subject.setJob(URI2, new Job(URI2, jest.fn()))
      expect(subject.matchJobs(URI, URI2)).toEqual([URI, URI2])
    })


  })

  describe('given a function', () => {
    it('returns URI if fn returns true', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      expect(subject.matchJobs(_uri => true)).toEqual([URI])
    })
  })

  describe('given a regular expression', () => {
    const regEx = /test-(\d+)\/(\d+)/

    it('returns URI if fn returns true', () => {
      subject.setJob(URI, new Job(URI, jest.fn()))
      expect(subject.matchJobs(regEx)).toEqual([URI])
    })

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
