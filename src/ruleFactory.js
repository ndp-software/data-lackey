import Rule from './Rule'
import {
  UriWithParamsMatcher,
  ParameterizedStringMatcher,
  RegExpMatcher,
}           from './matchers'

export default function ruleFactory (pattern, ruleOptions, console) {
  const isString = typeof (pattern) === 'string'

  let matcher
  if (isString && ruleOptions.requiredParams)
    matcher = new UriWithParamsMatcher(pattern, ruleOptions.requiredParams)
  else if (isString)
    matcher = new ParameterizedStringMatcher(pattern, ruleOptions)
  else
    matcher = new RegExpMatcher(pattern, ruleOptions)

  return new Rule(matcher, ruleOptions, console)
}
