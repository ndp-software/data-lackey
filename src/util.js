/** Returns a function given:
 *    function -- argument #1
 *    string   -- function that matches string on exact match
 *    regex    -- function that matches string by calling the `match` function
 */
export const asMatchFn = matcher => {
  return typeof(matcher) === 'function'
    ? matcher
    : typeof(matcher) === 'string'
      ? (uri => matcher === uri)
      : (uri => uri.match(matcher))
}


export function asArray (a) {
  return Array.isArray(a) ? ((a.length === 1 && Array.isArray(a[0])) ? a[0] : a) : [a]
}

export function flatMap (array, callback) {
  return [].concat(...array.map(callback))
}

export function isNumeric(value /*: any*/)/*: boolean*/ {
  return !isNaN(value - parseFloat(value))
}
