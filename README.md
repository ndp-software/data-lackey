# Data Lackey

> __Tired of having to build promise chains to coordinate the loading of your pages? 
Tired of having pages break because a user linked from a different page?
Tired of overloading your server with duplicate requests for the same data?
Give Data Lackey a spin....__


Data Lackey orchestrates data loading for rich front-end JS applications. 

With Data Lackey:
* declaratively express which data is needed by components
* automatically track which data is not loaded, being loaded and already loaded
* configure dependencies between data, and be guaranteed data is loaded before other data
* reload data at periodic intervals (poll)
* expire data / support a ttl (time to live) for individual pieces of data

 [![CircleCI](https://circleci.com/gh/Verba/data-lackey/tree/master.svg?style=svg&circle-token=e5e3ede09f04662995e99094b75e6a0c84914c1a)](https://circleci.com/gh/Verba/data-lackey/tree/master) [![Maintainability](https://api.codeclimate.com/v1/badges/562327499c13db5defe0/maintainability)](https://codeclimate.com/github/Verba/data-lackey/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/562327499c13db5defe0/test_coverage)](https://codeclimate.com/github/Verba/data-lackey/test_coverage)

## Installation & Basic Usage

```bash
shell> yarn add data-lackey
```
You'll need create a "data lackey" to track your data loading. Creating a file for this:
```js
// File: myLackey.js -- or whatever you want

import { DataLackey } from 'data-lackey'

export const myLackey = new DataLackey()

myLackey.rule('/books',        
              { 
                loader:    () => fetch('/api/books') 
              })
myLackey.rule('/book :bookId', 
              {
                loader:    ({bookId}) => fetch(`/api/books/${bookId}`),
                dependsOn: 'books'
              })
```
And then, configure your component with a new wrapping method `mapPropsToDataRsrcs`:
```js
// File: myComponent.js

import { loadData } from 'data-lackey'
import MyComponent from './MyComponent.jsx'

const mapPropsToDataRsrcs = props => `/book ${this.props.id}`,
      WrappedComponent    = loadData(mapPropsToDataRsrcs)(MyComponent)

export default WrappedComponent
````
Now, when the component is mounted, the `book` details will be requested. Since
that is dependent on the `books` data as well, that will be loaded first.
 


## Advanced Usage

Data Lackey works great with React, and removes tedious and error prone data loading
code, replacing it with declarations of data depedencies. Usage within React is 100% configuration driven and [is outlined here.](./docs/react.md)

You can also use it directly, to isolate the load orchestration details. This is called
["direct usage" and outlined here.](./direct_usage.md)



## Testing with Data Lackey

Data Lackey itself is well tested. As most of the configuration of Data Lackey is declarative, there's
less of a need to test this configuration. Given that, though, `loader` functions can be unit tested, 
as any data loading function can be tested. They are conveniently isolated from any component code.

# API

## Terminology:
 * `load`: queue up a data resource to load.
 * `data resource`: a single set of data that can be loaded.
 
#### Data Resource states:
  * `undefined`: unknown data resource, not yet tracked
  * `loading`
  * `loaded` => action `unload`
  * `failed to load`
  


### TODO

* `unload` callback should pass in params from matcher, not just URL
* ttl
* Load in batches


### Related Projects

* [redial](https://github.com/markdalgleish/redial) -- define and trigger hooks for custom lifecycle events
* [Link to related resources](https://medium.com/@dbow1234/expressing-data-dependencies-in-react-43a2004e04bc)
* [Relay](https://facebook.github.io/relay/) -- similar goals, but coupled to GraphQL.
