import Rule from './Rule'
import {
  StringPlusParamsPattern,
  StringMatcher,
  RegExpPattern,
}           from './patterns'

export default function ruleFactory (pattern, ruleOptions, console) {
  const isString = typeof (pattern) === 'string'

  let matcher
  if (isString && ruleOptions.requiredParams)
    matcher = new StringPlusParamsPattern(pattern, ruleOptions.requiredParams)
  else if (isString)
    matcher = new StringMatcher(pattern, ruleOptions.patternOpts)
  else
    matcher = new RegExpPattern(pattern, ruleOptions.groupNames)

  return new Rule(matcher, ruleOptions, console)
}
