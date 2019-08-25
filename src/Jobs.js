import { matcherFromJobMatchers } from './util'

export default class Jobs {
  constructor () {
    this.JOBS = {}
  }

  job (jobURI) {
    return this.JOBS[jobURI]
  }

  jobs (jobURIs) {
    return jobURIs.map(uri => this.job(uri)).filter(j => j)
  }

  setJob (jobURI, value) {
    if (typeof value === 'undefined')
      delete this.JOBS[jobURI]
    else
      this.JOBS[jobURI] = value
  }

  urisFromSpecs (jobMatchers) {
    const matcher = matcherFromJobMatchers(jobMatchers)

    return this.matchingURIs(matcher)
  }

  jobsFromSpecs (jobSpecs) {
    const uris = this.urisFromSpecs(jobSpecs)
    return this.jobs(uris)
  }

  matchingURIs (matcher) {
    return Object.keys(this.JOBS).filter(matcher)
  }

  inspect () {
    return Object.values(this.JOBS).map(job => [
      job.uri,
      `${job.loading ? 'loading' : ''}${job.loaded ? 'loaded' : ''}${job.failed ? 'failed' : ''}`,
      job.ruleOptions, job.promise,
    ])
  }

}
