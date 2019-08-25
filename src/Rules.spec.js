/* eslint-env jest */
import Rules       from './Rules'
import ruleFactory from './ruleFactory'

describe('Rules', () => {
  let subject, consoleError, uniqueRule

  beforeEach(() => {
    consoleError = jest.fn()

    uniqueRule = ruleFactory('unique', {})

    subject = new Rules({ error: consoleError })
    subject.push(uniqueRule)
    subject.push(ruleFactory('ambi$guous', {}))
    subject.push(ruleFactory('ambi$dextrous', {}))
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
