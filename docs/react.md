# React Integration

Data Lackey out of the box is not coupled with React, but provides easy configuration. 

## Lackey Provider (One-time Set Up)

Data Lackey's `Provider` makes data lackey available to your components (similar to 
how [React/Redux does this](https://medium.com/@bloodyowl/the-provider-and-higher-order-component-patterns-with-react-d16ab2d1636)).
 
Near the top of your hierarchy, use a Data Lackey Provider:
```js
import myLackey from '.'

<Provider dataLackey={myLackey} >
  <YourApp>
</Provider>
```

## Redux Integration

Data Lackey on its own will call `loader` functions, but does not store data. If
you're using Redux, DataLackey integrates easily. It will dispatch an action every 
time it a loader is triggered. The integration requires a promise middleware, so
the store configuration looks like:

```js
// File: store.js

const store = createStore(reducer, composeEnhancers(
  applyMiddleware(
    promiseMiddleware({promiseTypeSuffixes: ['REQUEST', 'SUCCESS', 'FAILURE'] }),
    ...
    )
))

import myDataLackey from 'model/dataLackey'
import { createReactPromiseDispatcher } from 'data-lackey'

myDataLackey.setGlobalOnLoad(createReactPromiseDispatcher(store.dispatch))
```

##### Wrap an Existing Component

Wrap your components to automatically load when the component 
mounts. This is done with the container code, in the same way `mapStateToProps` and other 
HOCs (high-order components):

```js
  import { loadData } from 'data-lackey'

  class MyComponent {}
  
  const mapPropsToDataRsrcs = props => `/item/${props.id}`
  
  export default loadData(mapPropsToDataRsrcs)(MyComponent)
```
You actually may end up with more of a mouthful if you also use the container pattern:
```js
export default connect(mapStateToProps, mapDispatchToProps)(
  loadData(mapPropsToDataRsrcs, { autoUnload: true })(View))
```

Finally, this `loadData` supports useful options:
* `autoUnload`: automatically call the unload function when the component is unmounted.
* `reloadInterval`: periodically reload the data. 

This HOC exposes useful properties to the wrapped component: `isLoaded`, `isLoading` and `loadFailed`.

##### Insert a New Component

A stand-alone component can be used to prevent sub-components from rendering until data
is loaded. This may be easier to understand for DOM-oriented developers than the HOC. 

The function `createLoaderComponent` creates a new component that:
  * loads the specified Data Lackey URI resource
  * renders its children
  * exposes `isLoaded`, `isLoading` and `loadFailed` properties to children.
  
An example:
```js
import { createLoaderComponent } from 'data-lackey'

const WithTenants = createLoaderComponent('/tenants') // `/tenants` is the data this component loads
```
Now, `WithTenants` can be used anywhere as a regular component:
```js
<WithTenants>
  <ul>
    { this.props.isLoading ? 'Loading' : 
      this.props.recipes ? this.props.recipes.map(u => <li>{u}</li>) : <li>No Users</li> }
    </ul>
</WithTenants>
```

This can also accept a function that will be called with the props passed to the component. This can be integrated naturally with a router:
```
const CatalogLoader = createLoaderComponent(({ params: { catalogId } }) => `rsrc:/catalog/${catalogId}`)
 // ...
  render () {
    return (
      <Router history={history}>
        <Route path='/' component={MainLayout}>
          <Route path='/:catalogId' component={CatalogLoader}>
 ...
 ```
