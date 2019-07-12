/*

Example of how you would specify data dependencies.

(IRL just export dataLackey itself, not the function that generates it. In this case, we need to call multiple times.)

 */

import { DataLackey } from './core'

export default function createLackeyWithLoaders (loaders, options = { console: false}) {

  // Step 1: create the lackey, with options
  const dataLackey = new DataLackey(options)

  // Step 2: add any number of patterns/URIs
  // `dispatch` would probably be used here.
  dataLackey.rule(/^dl:items$/, {
    loader: loaders.rootLoader
  })

  // Step 2b: loaders will be given () matches
  dataLackey.rule(/^dl:item\/(\d+)$/, {
    loader   : loaders.itemLoader,
    dependsOn: 'dl:items'
  })

  dataLackey.rule(/^dl:item\/(\d+)\/details$/, {
    loader   : loaders.detailsLoader,
    dependsOn: id => `dl:item/${id}`
  })

  return dataLackey
}
