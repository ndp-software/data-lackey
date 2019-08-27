# Data Lackey

* Tired of building complex views that manage data loading?
* Tired of promise chains to coordinate the loading of your pages? 
* Tired of pages breaking because some data wasn't loaded first?
* Tired of overloading your server with duplicate requests for the same data?

Give Data Lackey a spin! _Data Lackey orchestrates data loading for rich front-end JS applications._

With Data Lackey:
* declaratively express what data is needed
* separate data loading from views

At a basic level, Data Lackey keeps track of the loading of your data, so it's not 
buried in or distributed throughout components or middleware:
```
                                 rules 
                                   &
                                 loaders
                                   ⬇
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯→ load ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯→ Configured Data Lackey ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯→ promise for data
    (resource uri)
```
It layers on top of this :
* automatically track which data is not loaded, being loaded and already loaded. At any 
  point you can ask whether a given piece of data is loaded.
* configure dependencies between data, and be guaranteed data is loaded before other data. 
  This eliminates bugs and race conditions from view loading.
* reload data at periodic intervals (poll)
* expire data / support a ttl (time to live) for individual pieces of data

 [![CircleCI](https://circleci.com/gh/Verba/data-lackey/tree/master.svg?style=svg&circle-token=e5e3ede09f04662995e99094b75e6a0c84914c1a)](https://circleci.com/gh/Verba/data-lackey/tree/master) [![Maintainability](https://api.codeclimate.com/v1/badges/562327499c13db5defe0/maintainability)](https://codeclimate.com/github/Verba/data-lackey/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/562327499c13db5defe0/test_coverage)](https://codeclimate.com/github/Verba/data-lackey/test_coverage)

## Installation & Basic Usage

```bash
$ yarn add data-lackey
```
### Create and Configure your lackey

You'll need create a "data lackey" to track your data loading. Creating a file for this:
```js
// File: lackey.js -- or whatever you want

import { DataLackey } from 'data-lackey'

export const lackey = new DataLackey()

lackey.rule('/books',        { loader:    () => fetch('/api/books') })
lackey.rule('/book :bookId', { loader:    ({bookId}) => fetch(`/api/books/${bookId}`),
                               dependsOn: 'books' })
```
More details on [patterns](./docs/patterns.md) and [rules](./docs/rules.md).

### Load the Data

Very simply, you can call `lackey.load('/books')` to call the underlying `fetch`. This is 
nice because you can hide some details in the loader that you don't want in the load call--
but probably not worth restructuring your code for. But when you have dependencies
between different pieces of data-- the above the code wants the books index to be called before
an individual book-- it is convenient. Calling `load('/book 8')` will return a promise that 
includes the loading of the `/books` endpoint. These dependencies (promise chains) can become
quite complex if you have a larger webapp.

This direct usage [is outlined here.](./docs/direct_usage.md)

### Configure your React Component
Data Lackey understands React components, and offers a HOC to manage the loading of
data. Individual components can be completely free of data loading responsibilities.

Configure your component with a new wrapping method `mapPropsToDataRsrcs`:
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

Usage within React is 100% configuration driven and [is outlined here.](./docs/react.md)


## Testing with Data Lackey

Data Lackey itself is well tested. One of the benefits of Data Lackey is that it separates the loading
of data from the component itself. The loaders can be unit tested (they are functional in nature),
and should simplify your component tests.

# API

## Terminology:
 * `data resource`: a single set of data that can be loaded.
 * `data uri`: a string identifying a single resource. 
 * `load`: request the loading of a data resource.
 
#### Data Resource states:
  * `undefined`: unknown data resource, not yet tracked
  * `loading`
  * `loaded` => action `unload`
  * `failed to load`

### Related Projects

* [redial](https://github.com/markdalgleish/redial) -- define and trigger hooks for custom lifecycle events
* [Link to related resources](https://medium.com/@dbow1234/expressing-data-dependencies-in-react-43a2004e04bc)
* [Relay](https://facebook.github.io/relay/) -- similar goals, but coupled to GraphQL.
