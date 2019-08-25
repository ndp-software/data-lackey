import Job                           from './Job'
import { asArray, urisFromUriSpecs } from './util'

export default class Rule {

  constructor (matcher, ruleOptions, console) {
    this.matcher     = matcher
    this.ruleOptions = ruleOptions
    this.console     = console

    // this.matches = this.matcher.matches
    // this.params  = this.matcher.params
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

  newJob (uri, load, onLoad) {
    const params         = this.params(uri),
          dependencyURIs = urisFromUriSpecs(this.ruleOptions.dependsOn, params),
          rawLoader      = this.rawLoaderPromise.bind(this, params),
          loader         = dependencyURIs.length === 0
                           ? rawLoader
                           : () => this.promiseForDeps(dependencyURIs, load, rawLoader).then(rawLoader)

    return new Job(uri,
                   loader,
                   {
                     console: this.console,
                     onLoad:  onLoad,
                     ...this.ruleOptions,
                   })
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

  // Given a pattern's `options`, start the loader function and return a
  // record to track its status, including a `.promise` property.
  promiseForDeps (dependencyURIs, load) {
    this.console.log(`  checking dependencies (${dependencyURIs.length})...`)
    return load(dependencyURIs)
      .then(p => (this.console.log(`  ${dependencyURIs.length} dependencies loaded.`), p))
  }
}


