export default class Rules {

  constructor (consoleLogger) {
    this.console = consoleLogger
    this.rules = []
  }

  push (rule) {
    this.rules.push(rule)
  }

  findMatchingRule (jobURI) {
    const matches = this.rules.filter(rule => rule.matches(jobURI))

    this.errIf(matches.length === 0, `Unable to match "${jobURI}".`)
    this.errIf(matches.length > 1, `Ambiguous URI "${jobURI}".`)

    return matches[0] || null
  }

  errIf (bool, ...args) {
    if (bool)
      this.console.error(...args)
  }

}
