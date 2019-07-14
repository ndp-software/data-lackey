import Rule from './Rule'
import StringPlusParamsPattern from './patterns/StringPlusParamsPattern'
import StringMatcher from './patterns/StringMatcher'
import RegExpPattern from './patterns/RegExpPattern'

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
