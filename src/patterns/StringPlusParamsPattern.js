
/*
 In this matcher, a pattern is simple string that must be matched at the beginning
 to apply the rule. eg. `/posts` `users`.

 It can also have "required" params, in which case we build a regular expression that
 looks for those urls, ie. `/posts` with an `id` parameter would have a regular expression
 of `^/posts?.*\bid=.*`.

 The job URI is built by alphabetically appending the params as query parameters.
 */
export default class StringPlusParamsPattern {

  constructor (path, requiredParams) {


    // Build a RegExp that will match the path + the required params.
    if (requiredParams.length)
      path += '\\?.*' + requiredParams.sort().map(p => `\\b${p}=.*`).join('&')
    else
      path += '\\b'

    this.regExp = new RegExp(`^${path}`)
  }

  matches (jobURI) {
    return this.regExp.exec(jobURI)
  }

  params (jobURI) {
    if (!this.matches(jobURI)) throw `possible bug: pattern found but does not match jobURI ${jobURI}`

    // dig out parameters from the URL
    const pieces = jobURI.split('?')
    if (pieces.length === 0 || !pieces[1]) return {}
    return pieces[1]
      .split('&')
      .map(e => e.split('='))
      .reduce((m, s) => (m[s[0]] = decodeURIComponent(s[1]), m), {})
  }

}

