import {
  canonicalUri,
  sketchyUri,
}                  from './canonicalUri'
import Job         from './Job'
import Jobs        from './Jobs'
import ruleFactory from './ruleFactory'
import Rules       from './Rules'
import { asArray } from './util'

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
    this.JOBS          = new Jobs()
    this.QUEUE         = []
    this.POLL_INTERVAL = 1000

    this.pollNow = this.pollNow.bind(this)
    this.pollNow() // start polling

    this.load = this.load.bind(this)
  }

  rule (patterns, ruleOptions) {
    asArray(patterns).forEach(pattern => this.RULES.push(ruleFactory(pattern, ruleOptions, this.console)))
  }

  loading (...uris) {
    return !!this.JOBS.any(uris, job => job.loading)
  }

  reloading (...uris) {
    return !!this.JOBS.any(uris, job => job.reloading)
  }

  // Are any of the given URLs failed?
  failed (...uris) {
    return !!this.JOBS.any(uris, job => job.failed)
  }

  // Are all of the given URLs loaded?
  loaded (...uris) {
    uris = asArray(uris) // accepts either multiple params or an array
    // Are there unknown URLs? then they are _not_ loaded
    if (uris.map(uri => this.JOBS.matchJobs(uri)).find(matchingJobs => matchingJobs.length === 0)) return false
    return !!this.JOBS.matchJobs(uris)
                 .reduce(((acc, uri) => acc && this.job(uri) && this.job(uri).loaded), this.JOBS.matchJobs(uris).length > 0)
  }

  job (jobURI) {
    return this.JOBS.job(jobURI)
  }

  unload (...jobURIMatchers) {
    return this.JOBS.matchJobs(...jobURIMatchers)
               .map(jobURI => {
                 this.console.log(`unload: ${jobURI}`)
                 const job = this.job(jobURI)
                 if (job && !job.loading) {
                   this.job(jobURI).onUnload()
                   this.JOBS.setJob(jobURI)
                 }
                 return !this.job(jobURI)
               })
               .reduce((acc, unloaded) => acc && unloaded, true)
  }

  setGlobalOnLoad (onLoad) {
    this.globalOnLoad = onLoad
  }

  // Load a given URI, returning a promise.
  // If already loaded or in progress, returns existing promise.
  load (urish, loadOptions) {
    if (Array.isArray(urish)) return Promise.all(urish.filter(u => u).map(u => this.load(u)))

    const jobURI      = canonicalUri(urish),

          existingJob = this.job(jobURI)
    if (existingJob) this.console.log(`  cache hit for ${jobURI}`)
    if (existingJob) return existingJob.promise

    const rule = this.RULES.findMatchingRule(jobURI)
    if (!rule) throw `Unmatched URI "${jobURI}"`

    // If a URL resolves to "undefined" or "null", it was likely a mistake. Highlight it.
    this.console[sketchyUri(jobURI) ? 'error' : 'log'](`load "${jobURI}"`)
    const newJob = new Job(jobURI,
                           rule.promiseForURIAndDependencies.bind(rule, jobURI, this.load),
                           {
                             console: this.console,
                             onLoad:  this.globalOnLoad,
                             ...rule.ruleOptions,
                           })
    this.JOBS.setJob(jobURI, newJob)
    return newJob.load(loadOptions)
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

  enqueue (uris) {
    this.console.log(`enqueue (${this.QUEUE.length})`, uris)
    return asArray(uris).forEach(uri => this.QUEUE.unshift(uri))
  }

  workNextJob () {
    const nextURI = this.QUEUE.pop()
    if (!nextURI) return null
    this.console.log(`workNextJob (${this.QUEUE.length})`)
    return this.load(nextURI)
  }

  inspect () {
    return this.JOBS.inspect()
  }

}


