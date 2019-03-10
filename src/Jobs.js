import { asMatchFn, flatMap } from './util'

export default class Jobs {
  constructor () {
    this.JOBS = {}
  }

  job (jobURI) {
    return this.JOBS[jobURI]
  }

  setJob (jobURI, value) {
    this.JOBS[jobURI] = value
    if (typeof value === 'undefined') delete this.JOBS[jobURI]
  }

  /**
   * Find 0 or more job URIs based on a matcher
   * @param matchers one of:
   *    string   -- exact match for the URI
   *    regex    -- wildcard (or other) match
   *    function -- call the function with each jobURI for a true/false value
   * @returns {Array.<*>}
   */
  matchJobs (...matchers) {
    if (matchers.length > 1) return flatMap(matchers, m => this.matchJobs(m))
    if (Array.isArray(matchers[0])) return flatMap(matchers[0], m => this.matchJobs(m))

    return Object.keys(this.JOBS).filter(asMatchFn(matchers[0]))
  }

  any (uris, test) {
    return !!this.matchJobs(uris).find(uri => test(this.JOBS[uri]))
  }

  // forEach (f) {
  //   Object.keys(this.JOBS).forEach(k => f(this.JOBS[k]))
  // }

  inspect () {
    return Object.values(this.JOBS).map(job => [
      job.uri,
      `${job.loading ? 'loading' : ''}${job.loaded ? 'loaded' : ''}${job.failed ? 'failed' : ''}`,
      job.ruleOptions, job.promise,
    ])
  }

}
