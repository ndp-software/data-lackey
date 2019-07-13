
import { asArray } from './util'

export default class Rule {

  constructor (matcher, ruleOptions, console) {
    this.matcher     = matcher
    this.ruleOptions = ruleOptions
    this.console     = console
  }

  matches (jobURI) {
    return this.matcher.matches(jobURI)
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
    return this.matcher.params(jobURI)
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
    return deps.map(dep => (typeof (dep) === 'function' ? dep(...asArray(params)) : dep))
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


