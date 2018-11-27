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

export function arraysEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

