import UrlPattern from 'url-pattern'

import {
  asArray,
} from './util'


export default class Rule {

  constructor (pattern, ruleOptions, console) {
    const patternOptsForStrings = {
      segmentNameStartChar: '$',
      segmentValueCharset:  'a-zA-Z0-9\\-,_%~\\.!\\*\\(\\)',
      ...(ruleOptions.patternOpts || {}),
    }

    if (typeof (pattern) === 'string' && ruleOptions.requiredParams) {
      if (ruleOptions.requiredParams.length)
        pattern += '\\?.*' + ruleOptions.requiredParams.sort().map(p => `\\b${p}=.*`).join('&')
      pattern = new RegExp(`^${pattern}`)
    }

    this.matcher     = new UrlPattern(pattern,
                                      typeof (pattern) === 'string'
                                      ? patternOptsForStrings
                                      : ruleOptions.groupNames)
    this.ruleOptions = ruleOptions
    this.console     = console
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

    if (!this.ruleOptions.requiredParams)
      return p // whatever the match returns we pass as params

    // requiredParams case
    return jobURI.split('?')[1].split('&').map(e => e.split('=')).reduce((m, s) => (m[s[0]] = decodeURIComponent(s[1]), m), {})
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
  dependenciesAsURIs (params) {
    const deps = asArray(this.ruleOptions.dependsOn || [])
    return deps.map(dep => typeof (dep) === 'function' ? dep(...asArray(params)) : dep)
  }

  // Given a pattern's `options`, start the loader function and return a
  // record to track its status, including a `.promise` property.
  promiseForURIAndDependencies (jobURI, load) {
    const params         = this.params(jobURI),
          rawLoader      = this.rawLoaderPromise.bind(this, params),
          dependencyURIs = this.dependenciesAsURIs(params)

    if (dependencyURIs.length === 0) return rawLoader()

    this.console.log(`  checking dependencies (${dependencyURIs.length})...`)
    return load(dependencyURIs)
      .then(p => (this.console.log(`  ${dependencyURIs.length} dependencies loaded.`), p))
      .then(rawLoader)
  }


}
