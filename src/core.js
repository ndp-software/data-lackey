import Job   from './Job'
import Jobs  from './Jobs'
import Rule  from './Rule'
import Rules from './Rules'
import {
  asArray,
}            from './util'
import {
  canonicalUri
} from './canonicalUri'

const defaultOptions = {
  console: window.console,
}

export class DataLackey {

  // Options:
  //  `console`: a global.console type function that lets you customize the logging. The default
  //             is no logging. Regular logging pass in `global.console`.
  constructor (options = { console: false }) {
    const log   = (options.console && options.console.log) || ((..._s) => null),
          error = (options.console && options.console.error) || log

    this.globalOnLoad    = null
    this.options         = { ...defaultOptions, ...options }
    this.options.console = { log, error }
    this.RULES           = new Rules(this.options.console)
    this.JOBS            = new Jobs()
    this.QUEUE           = []
    this.POLL_INTERVAL   = 1000


    this.pollNow = this.pollNow.bind(this)
    this.pollNow() // start polling
  }

  pollNow () {
    this.enqueueNextPollNow(this.workNextJob())
  }

  enqueueNextPollNow (promise) {
    if (!promise) return window.setTimeout(this.pollNow, this.POLL_INTERVAL)

    promise
      .then(r => {
        window.setTimeout(this.pollNow)
        return r
      })
      .catch(this.pollNow)
  }

  rule (patterns, ruleOptions) {
    asArray(patterns).forEach(pattern => this.RULES.push(new Rule(pattern, ruleOptions, this.options.console)))
  }

  // Are any of the given URLs loading?
  loading (...uris) {
    return !!this.JOBS.any(uris, job => job.loading)
  }

  // Are any of the given URLs reloading?
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
                 .reduce(((acc, uri) => acc && this.JOBS.job(uri) && this.JOBS.job(uri).loaded), this.JOBS.matchJobs(uris).length > 0)
  }

  job (jobURI) {
    return this.JOBS.job(jobURI)
  }

  unload (...jobURIMatchers) {
    return this.JOBS.matchJobs(...jobURIMatchers)
               .map(jobURI => {
                 this.options.console.log(`unload: ${jobURI}`)
                 const job = this.JOBS.job(jobURI)
                 if (job && !job.loading) {
                   this.JOBS.job(jobURI).onUnload()
                   this.JOBS.setJob(jobURI)
                 }
                 return !this.JOBS.job(jobURI)
               })
               .reduce((acc, unloaded) => acc && unloaded, true)
  }

  enqueue (uris) {
    this.options.console.log(`enqueue (${this.QUEUE.length})`, uris)
    return asArray(uris).forEach(uri => this.QUEUE.unshift(uri))
  }

  workNextJob () {
    const nextURI = this.QUEUE.pop()
    if (!nextURI) return null
    this.options.console.log(`workNextJob (${this.QUEUE.length})`)
    return this.load(nextURI)
  }

  setGlobalOnLoad (onLoad) {
    this.globalOnLoad = onLoad
  }

  inspect () {
    return this.JOBS.inspect()
  }


  // Serially resolve dependencies
  promiseForDependencies (dependencyURIs) {
    this.options.console.log(`  checking dependencies (${dependencyURIs.length})...`)
    return Promise.all(dependencyURIs
                         .map(dep => this.load(dep)))
                  .then(p => {
                    this.options.console.log(`  ${dependencyURIs.length} dependencies loaded.`)
                    return p
                  })
  }

  // Given a pattern's `options`, start the loader function and return a
  // record to track its status, including a `.promise` property.
  promiseForURIAndDependencies (jobURI, rule) {
    const params         = rule.params(jobURI),
          dependencyURIs = rule.dependenciesAsURIs(params)

    return (dependencyURIs.length === 0)
           ? rule.rawLoaderPromise(params)
           : this.promiseForDependencies(dependencyURIs).then(() => rule.rawLoaderPromise(params))
  }

  // Load a given URI, returning a promise.
  // If already loaded or in progress, returns existing promise.
  load (uriish, loadOptions) {
    if (Array.isArray(uriish)) return Promise.all(uriish.filter(u => u).map(u => this.load(u)))

    const jobURI = canonicalUri(uriish)

    // If a URL resolves to "undefined" or "null", it was likely a mistake. Highlight it in the console.
    this.options.console[(jobURI.includes('undefined') || jobURI.includes('null')) ? 'error' : 'log'](`${this.JOBS.job(jobURI) && this.JOBS.job(jobURI).loaded ? '  cache hit for' : 'load'} "${jobURI}"`)

    if (!this.JOBS.job(jobURI)) {

      const rule = this.RULES.findMatchingRule(jobURI)
      if (!rule) throw `Unmatched URI "${jobURI}"`

      const loader = this.promiseForURIAndDependencies.bind(this, jobURI, rule)
      this.JOBS.setJob(jobURI, new Job(jobURI,
                                       loader,
                                       {
                                         console: this.options.console,
                                         onLoad:  this.globalOnLoad,
                                         ...rule.ruleOptions,
                                       }))
      this.JOBS.job(jobURI).load(loadOptions)
    }

    return this.JOBS.job(jobURI).promise
  }

  reset () {
    this.unload(/.*/)
  }


}


