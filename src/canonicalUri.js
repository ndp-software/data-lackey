export function canonicalUri (uriish) {
  if (!uriish) return null
  if (typeof uriish === 'object')
    if (uriish.params) {
      return buildParams(uriish.uri, uriish.params)
    } else
      return uriish.uri
  else
    return uriish
}

function buildParams (uriBase, params) {
  const keys = Object.keys(params).sort()
  return keys.reduce((uri, k) => {
    const parm = params[k]
    if (typeof (parm) === 'undefined') return uri
    return `${uri}${k === keys[0] ? '?' : '&'}${k}${parm === null ? '' : `=${encodeURIComponent(parm)}`}`
  }, uriBase)

}

export function sketchyUri(uri) {
  return uri.includes('undefined') || uri.includes('null')
}
