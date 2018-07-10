import Job   from './Job'
import Rule  from './Rule'
import Rules from './Rules'
import {
  asMatchFn,
  asArray,
  flatMap,
}            from './util'

export class DataLackey {

  // Options:
  //  `console`: a global.console type function that lets you customize the logging. The default
  //             is no logging. Regular logging pass in `global.console`.
  constructor (options = { console: false }) {
    const log = (...s) => options.console
                          && options.console.log
                          && options.console.log(...s),
          err = options.console
                && options.console.error || log

    this.globalOnLoad = null
    this.console      = { log: log, error: err }
    this.RULES        = new Rules(this.console)
    this.JOBS         = {}
    this.QUEUE        = []
    this.CIRCULAR_REF = -1


    this.pollNow = this.pollNow.bind(this)
    this.pollNow() // start polling
  }

  pollNow () {

    const promise = this.workNextJob()

    if (promise)
      promise.then(r => {
        window.setTimeout(this.pollNow)
        return r
      }).catch(this.pollNow)
    else
      window.setTimeout(this.pollNow, 1000)
  }

  rule (patterns, ruleOptions) {
    asArray(patterns).forEach(pattern => this.RULES.push(new Rule(pattern, ruleOptions)))
  }

  load (...args) {
    return this.jobForURI(...args)
  }

  loading (...uris) {
    return !!this.matchJobs(uris).find(uri => this.JOBS[uri].loading)
  }

  reloading (...uris) {
    return !!this.matchJobs(uris).find(uri => this.JOBS[uri].reloading)
  }

  failed (...uris) {
    return !!this.matchJobs(uris).find(uri => this.JOBS[uri].failed)
  }

  loaded (...uris) {
    uris = asArray(uris) // accept either multiple params or an array
    // Are there unknown URLs? then they are _not_ loaded
    if (uris.map(uri => this.matchJobs(uri)).find(uris => uris.length === 0)) return false
    return !!this.matchJobs(uris)
                 .reduce(((acc, uri) => acc && this.JOBS[uri] && this.JOBS[uri].loaded), this.matchJobs(uris).length > 0)
  }

  job (jobURI) {
    return this.JOBS[jobURI]
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

  unload (...jobURIMatchers) {
    return this.matchJobs(...jobURIMatchers)
               .map(jobURI => {
                 this.console.log(`unload: ${jobURI}`)
                 const job = this.JOBS[jobURI]
                 if (job && !job.loading) {
                   this.JOBS[jobURI].onUnload()
                   delete this.JOBS[jobURI]
                 }
                 return !this.JOBS[jobURI]
               })
               .reduce((acc, unloaded) => acc && unloaded, true)
  }

  enqueue (uris) {
    this.console.log(`enqueue (${this.QUEUE.length})`, uris)
    return asArray(uris).forEach(uri => this.QUEUE.unshift(uri))
  }

  workNextJob () {
    const nextURI = this.QUEUE.pop()
    if (!nextURI) return null
    this.console.log(`workNextJob (${this.QUEUE.length})`)
    return this.jobForURI(nextURI)
  }

  setGlobalOnLoad (onLoad) {
    this.globalOnLoad = onLoad
  }

  inspect () {
    return Object.values(this.JOBS).map(job => [
      job.uri,
      `${job.loading ? 'loading' : ''}${job.loaded ? 'loaded' : ''}${job.failed ? 'failed' : ''}`,
      job.ruleOptions, job.promise,
    ])
  }


  // Serially resolve dependencies
  promiseForDependencies (dependencies) {
    this.console.log(`  checking dependencies (${dependencies.length})...`)
    return dependencies
      .reduce((result, dep) => {
        return result.then(() => null).then(() => this.jobForURI(dep))
      }, Promise.resolve())
      .then(p => {
        this.console.log(`  ${dependencies.length} dependencies loaded.`)
        return p
      })
  }

  // Given a pattern's `options`, start the loader function and return a
  // record to track its status, including a `.promise` property.
  promiseForURIAndDependencies (jobURI, rule) {
    const params       = rule.params(jobURI),
          dependencies = rule.dependenciesAsStrings(params)

    return (dependencies.length === 0)
           ? rule.rawLoaderPromise(params)
           : this.promiseForDependencies(dependencies).then(() => rule.rawLoaderPromise(params))
  }

  // Load a given URI, returning a promise.
  // If already loaded or in progress, returns existing promise.
  jobForURI (jobURI, loadOptions) {
    if (Array.isArray(jobURI)) return jobURI.filter(u => u).map(u => this.jobForURI(u))

    this.console.log(`${this.JOBS[jobURI] && this.JOBS[jobURI].loaded ? '  cache hit for' : 'load'} "${jobURI}"`)

    if (this.JOBS[jobURI] === this.CIRCULAR_REF) throw `Circular reference for URI "${jobURI}"`

    if (!this.JOBS[jobURI]) {
      this.JOBS[jobURI] = this.CIRCULAR_REF

      const rule = this.RULES.findMatchingRule(jobURI)
      if (!rule) throw `Unmatched URI "${jobURI}"`

      const loader      = this.promiseForURIAndDependencies.bind(this, jobURI, rule)
      this.JOBS[jobURI] = new Job(jobURI,
                                  loader,
                                  {
                                    console: this.console,
                                    onLoad:  this.globalOnLoad,
                                    ...rule.ruleOptions,
                                  })
      this.JOBS[jobURI].load(loadOptions)
    }

    return this.JOBS[jobURI].promise
  }


}


