import Jobs                        from './Jobs'
import ruleFactory                 from './ruleFactory'
import Rules                       from './Rules'
import { sketchyUri, uriFromSpec } from './uriFromSpec'
import {
  asArray,
  urisFromUriSpecs,
}                                  from './util'
import { version }                 from '../package.json'

export class DataLackey {

  // Options:
  //  `console`: a global.console type function that lets you customize the logging. The default
  //             is no logging. Regular logging pass in `global.console`.
  constructor (options = { console: false }) {
    const log   = (options.console && options.console.log) || ((..._s) => null),
          error = (options.console && options.console.error) || log

    this.globalOnLoad  = null
    this.console       = { log, error }
    this.RULES         = new Rules(this.console)
    this.JOBS          = new Jobs(this.console)
    this.QUEUE         = []
    this.POLL_INTERVAL = options.pollInterval || 1000

    this.console.log(`DataLackey ${version} starting up`)
    window.lackey = this

    this.load    = this.load.bind(this)
    this.loadURI = this.loadURI.bind(this)
    this.pollNow = this.pollNow.bind(this)

    this.pollNow()
  }

  rule (patterns, ruleOptions) {
    asArray(patterns).forEach(pattern => this.RULES.push(ruleFactory(pattern, ruleOptions, this.console)))
  }


  loading (...jobSpecs) {
    return this.JOBS.jobsFromSpecs(jobSpecs).some(job => job.loading)
  }

  reloading (...jobSpecs) {
    return this.JOBS.jobsFromSpecs(jobSpecs).some(job => job.reloading)
  }

  // Are any of the given URLs failed?
  failed (...jobSpecs) {
    return this.JOBS.jobsFromSpecs(jobSpecs).some(job => job.failed)
  }

  // Are all of the given URLs loaded?
  loaded (...uriSpecs) {
    const uris = urisFromUriSpecs(uriSpecs),
          jobs = this.JOBS.jobs(uris)
    if (jobs.length < uris.length) return false
    return jobs.every(job => job.loaded)
  }

  job (jobURI) {
    return this.JOBS.job(jobURI)
  }

  unload (...jobSpecs) {
    const jobs = this.JOBS.jobsFromSpecs(jobSpecs)
    if (jobs.length === 0) return false
    return jobs.every(job => {
      this.console.log(`unload: ${job.uri}`)
      if (!job.loading) {
        job.onUnload()
        this.JOBS.setJob(job.uri)
      }
      return !this.JOBS.job(job.uri)
    })
  }

  setGlobalOnLoad (onLoad) {
    this.globalOnLoad = onLoad
  }

  // Load a given URI, returning a promise.
  // If already loaded or in progress, returns existing promise.
  load (uriSpecs, options) {
    if (Array.isArray(uriSpecs))
      return Promise.all(uriSpecs.filter(s => s).map(s => this.loadURI(uriFromSpec(s), options)))
    else
      return this.loadURI(uriFromSpec(uriSpecs), options)
  }

  loadURI (jobURI, options) {
    const existingJob = this.JOBS.job(jobURI)

    if (existingJob) {
      this.console.log(`  cache hit for ${jobURI}`)
      return existingJob.promise
    }

    const rule = this.RULES.findMatchingRule(jobURI)
    if (!rule) throw `Unmatched URI "${jobURI}"`

    // If a URL resolves to "undefined" or "null", it was likely a mistake. Highlight it.
    this.console[sketchyUri(jobURI) ? 'error' : 'log'](`load "${jobURI}"`)

    const newJob = rule.newJob(jobURI, this.load, this.globalOnLoad)
    this.JOBS.setJob(jobURI, newJob)
    return newJob.load(options)
  }

  reset () {
    this.unload(/.*/)
  }

  pollNow () {
    this.enqueueNextPollNow(this.workNextJob())
  }

  enqueueNextPollNow (promise) {
    if (!promise) return window.setTimeout(this.pollNow, this.POLL_INTERVAL)

    promise
      .then(r => (window.setTimeout(this.pollNow), r))
      .catch(this.pollNow)
  }

  enqueue (specs) {
    this.console.log(`enqueue (${this.QUEUE.length})`, specs)
    return asArray(specs).forEach(spec => this.QUEUE.unshift(uriFromSpec(spec)))
  }

  workNextJob () {
    const nextURI = this.QUEUE.pop()
    if (!nextURI) return null
    this.console.log(`workNextJob (${this.QUEUE.length})`)
    return this.loadURI(nextURI)
  }

  inspect () {
    return this.JOBS.inspect()
  }

}


