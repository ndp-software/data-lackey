// Matchers that use the `UrlPattern` library directly
export default class AbstractUrlPattern {

  constructor (urlPattern) {
    this.urlPattern = urlPattern
  }

  matches (jobURI) {
    return this.urlPattern.match(jobURI)
  }

  params (jobURI) {
    const p = this.urlPattern.match(jobURI)

    if (!p) throw `possible bug: pattern found but does not match jobURI ${jobURI}`

    return p // whatever the match returns we pass as params
  }

}
