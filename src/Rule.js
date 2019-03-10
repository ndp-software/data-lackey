import UrlPattern from 'url-pattern'

import {
  asArray,
} from './util'


export default class Rule {

  constructor (pattern, ruleOptions) {
    const patternOptsForStrings = {
      segmentNameStartChar: '$',
      segmentValueCharset:  'a-zA-Z0-9\\-,_%~\\.!\\*\\(\\)',
      ...(ruleOptions.patternOpts || {}),
    }

    this.matcher = new UrlPattern(pattern,
                                  typeof(pattern) === 'string'
                                    ? patternOptsForStrings
                                    : undefined)
    this.ruleOptions = ruleOptions
  }

  matches (jobURI) {
    return this.matcher.match(jobURI)
  }

  /**
   * @param jobURI Which will be parsed using either a pattern or regular expression the individual matching strings will be extracted.
   * Note: All params are returned as Strings, even if they
   * look like numbers, so you may need to convert them.
   * @returns [Array|Object] Rules created with strings
   *   will return objects with keys matching the segment
   *   names. Regular expressions-- because we don't have
   *   reliable named capture groups-- will return an array
   *   of values captured.
   */
  params (jobURI) {
    const p = this.matcher.match(jobURI)
    if (!p) throw `possible bug: pattern found but does not match jobURI ${jobURI}`
    return p // whatever the match returns we pass as params
  }

  /**
   * Returns a promise by passing the matcher params
   * to the `loader` function. This is "raw" because it
   * does not factor in any of the dependencies of this rule.
   * @param params values return from `#params` function
   */
  rawLoaderPromise (params) {
    return this.ruleOptions.loader(...asArray(params))
  }

  /**
   * Resolves dependencies based on the given params. Dependencies can
   * be static string, but they can also be functions that are called
   * with the current job's parameters.
   * @param params
   * @returns {*}
   */
  dependenciesAsURIs(params) {
    const deps = asArray(this.ruleOptions.dependsOn || [])
    return deps.map(dep => typeof(dep) === 'function' ? dep(...asArray(params)) : dep)

  }

}
