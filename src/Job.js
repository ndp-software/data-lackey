import {
  isNumeric,
} from './util'

export default class Job { // rule, params
  constructor (jobURI, loader, options = {}) {
    this.uri         = jobURI
    this.loading     = false
    this.reloading   = false
    this.loaded      = false
    this.failed      = false
    this.loader      = loader
    this.ruleOptions = options
    this.options     = options
    this.reloadLimit = options && isNumeric(options.reloadLimit) ? options.reloadLimit : 100 // don't reload indefinitely
    this.console     = options.console || window.console
    this.load        = this.load.bind(this)
    this.reload      = this.reload.bind(this)
    this.onLoaded    = this.onLoaded.bind(this)
    this.reloadAgain = this.reloadAgain.bind(this)
  }

  load (options) {
    this.loading     = true
    this.loadOptions = options
    this.options     = { ...this.ruleOptions, ...this.loadOptions }
    this.promise     = this.loader()
                           .then(
                             r => {
                               this.onLoaded()
                               return r
                             },
                             e => {
                               this.onError(e)
                               throw e
                             })
    if (this.ruleOptions && this.ruleOptions.onLoad) this.ruleOptions.onLoad(this)
    return this.promise
  }

  // Reload if (and only if) it's already loaded
  reload () {
    if (!this.loaded) return
    if (this.reloadLimit <= 0) return

    this.reloading = true
    this.reloadLimit -= 1
    this.load(this.loadOptions)
  }

  onLoaded () {
    this.console.log(`${this.reloading ? 're-' : ''}loaded ${this.uri}`)
    this.loading   = false
    this.reloading = false
    this.loaded    = true

    if (this.shouldPoll())
      this.startPolling()
  }

  onUnload () {
    if (this.reloadTimeoutId) window.clearTimeout(this.reloadTimeoutId)
    if (this.ruleOptions.unload) this.ruleOptions.unload(this.uri)
  }

  onError (e) {
    this.console.error(`failed ${this.uri} Error=${e}`)
    this.loading   = false
    this.reloading = false
    this.loaded    = false
    this.failed    = true
    this.error     = e
  }

  shouldPoll () {
    return this.options.reloadInterval
  }

  startPolling () {
    // already started?
    if (this.reloadTimeoutId) return
    this.reloadTimeoutId = window.setTimeout(this.reloadAgain, this.options.reloadInterval)
  }

  /* private */
  reloadAgain () {
    this.reloadTimeoutId = null
    this.reload()
  }

}
