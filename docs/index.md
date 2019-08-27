### Load the Data

Very simply, you can call `lackey.load('/books')` to call the underlying `fetch`. This is 
nice because you can hide some details in the loader that you don't want in the load call--
but probably not worth restructuring your code for. But when you have dependencies
between different pieces of data-- the above the code wants the books index to be called before
an individual book-- it is convenient. Calling `load('/book 8')` will return a promise that 
includes the loading of the `/books` endpoint. These dependencies (promise chains) can become
quite complex if you have a larger webapp.

This direct usage [is outlined here.](./direct_usage.md)

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

Usage within React is 100% configuration driven and [is outlined here.](./react.md)


## [motivation.md](motivation.md) and [VISION.md](VISION.md) 

## [rules.md](rules.md)

## [data_resources.md](data_resources.md)

## [patterns.md](patterns.md)

## [direct_usage.md](direct_usage.md)

## [react.md](react.md)

## [faqs.md](faqs.md)
