/* eslint-env jest */

import Rules from './Rules'
import Rule  from './Rule'


describe('Rules', () => {
  let subject, consoleError, uniqueRule

  beforeEach(() => {
    consoleError = jest.fn()
    subject = new Rules({ error: consoleError })
    uniqueRule = new Rule('unique', {})
    subject.push(uniqueRule)
    subject.push(new Rule('ambi$guous', {}))
    subject.push(new Rule('ambi$dextrous', {}))
  })

  it('matches uniq rule', () => {
    expect(subject.findMatchingRule('unique')).toEqual(uniqueRule)
  })

  it('returns null and calls error', () => {
    expect(subject.findMatchingRule('inconceivable')).toEqual(null)
    expect(consoleError).toHaveBeenCalledWith('Unable to match "inconceivable".')
  })

  it('returns ambiguous match, but logs error', () => {
    expect(subject.findMatchingRule('ambitious')).not.toBeNull()
    expect(consoleError).toHaveBeenCalledWith('Ambiguous URI "ambitious".')
  })
})
