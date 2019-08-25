export function uriFromSpec (spec) {
  if (!spec) return null
  if (typeof spec === 'object') {
    // We allow passing in a specific `params` key, or just throw in the params.
    const {
            resource,
            params: explicitParams = {},
            ...     implicitParams
          }      = spec,
          params = {
            ...explicitParams,
            ...implicitParams,
          }
    if (params) {
      return buildParams(resource, params)
    } else
      return resource
  } else
    return spec
}

function buildParams (uriBase, params) {
  const keys = Object.keys(params).sort()
  return keys.reduce((uri, k) => {
    const parm = params[k]
    if (typeof (parm) === 'undefined') return uri
    return `${uri}${k === keys[0] ? '?' : '&'}${k}${parm === null ? '' : `=${encodeURIComponent(parm)}`}`
  }, uriBase)

}

export function sketchyUri (uri) {
  return uri.includes('undefined') || uri.includes('null')
}
