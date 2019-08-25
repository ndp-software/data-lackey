import Rule                    from './Rule'
import StringPlusParamsPattern from './patterns/StringPlusParamsPattern'
import StringMatcher           from './patterns/StringMatcher'
import RegExpPattern           from './patterns/RegExpPattern'

export default function ruleFactory (pattern, ruleOptions, console) {
  const matcher = matcherFactory(pattern, ruleOptions)
  return new Rule(matcher, ruleOptions, console)
}

export function matcherFactory (pattern, ruleOptions) {
  const isString = typeof (pattern) === 'string'

  let matcher
  if (isString && ruleOptions.requiredParams)
    matcher = new StringPlusParamsPattern(pattern, ruleOptions.requiredParams)
  else if (isString)
    matcher = new StringMatcher(pattern, ruleOptions.patternOpts)
  else if (pattern instanceof RegExp)
    matcher = new RegExpPattern(pattern, ruleOptions.groupNames)
  else if (pattern
           && typeof pattern == 'object'
           && pattern.resource
           && pattern.params)
    matcher = new StringPlusParamsPattern(pattern.resource, pattern.params)
  else if (pattern
           && typeof pattern == 'object'
           && pattern.resource)
    throw `Unknown rule pattern; patterns without params can be strings. Can you use 'rule("${pattern}")'?`
  else
    throw `Unknown rule pattern; must be string, RegExp or object with a 'resource' key: ${pattern}`

  return matcher
}
