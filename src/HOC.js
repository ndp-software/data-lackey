import hoistNonReactStatic from 'hoist-non-react-statics'
import PropTypes           from 'prop-types'
import React               from 'react'
import {
  arraysEqual,
  flatMap,
  urisFromUriSpecs,
}                          from './util'

/* global Set */
if (!Set.prototype.difference)
  Set.prototype.difference = function (setB) {
    const difference = new Set(this)
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const elem of setB) {
      difference.delete(elem)
    }
    return difference
  }

// URIs might be functions that need to be called
function resolveResources (resources, props) {
  return flatMap(
    resources
      .map(rc =>
             (typeof (rc) === 'function'
              ? rc(props)
              : rc),
      )
      .filter(r => r),
    resource => (urisFromUriSpecs(resource).filter(r => r)),
  )
}

function nextResourcesPromise (nextResources, prevResources, { load, autoUnload, reloadInterval, dataLackey }) {
  console.log('nextResourcesPromise', nextResources, ' <== ', prevResources)
  if (arraysEqual(nextResources, prevResources)) return Promise.resolve() // do nothing

  const comingResources = new Set(nextResources).difference(prevResources),
        goingResources  = new Set(prevResources).difference(new Set(nextResources))

  if (autoUnload) dataLackey.unload(goingResources)

  const loadOptions = {}
  if (reloadInterval) loadOptions.reloadInterval = reloadInterval
  console.log('load', comingResources)
  return load([...comingResources], loadOptions)
}


/*
 Returns a function that wraps a function and supplies it `loadData` functionality.
 The function takes `resourceCreators`, which are:
 * resource URIs
 * functions that return resource URIs

 If the last parameters is an object, it is interpreted as "options". Valid
 options are:
 * `autoUnload` -- when the resources change, unload the old ones
 * `reloadInterval` -- reload the resource every N milliseconds
 */
export function loadData (...resourceCreators) {

  // Last argument might be options, grab it.
  const options = (resourceCreators.length > 1
                   && typeof (resourceCreators[resourceCreators.length - 1]) === 'object')
                  ? resourceCreators.pop()
                  : {}

  return WrappedComponent => {

    class WithData extends React.Component {
      constructor (props, context) {

        super(props)

        this.state = {
          autoUnload:     props.autoUnload || options.autoUnload,
          reloadInterval: props.reloadInterval || options.reloadInterval,
          resources:      [], //resolveResources(resourceCreators, props)

          // Allow overriding of the "dataLackey" source.
          dataLackey: this.props.dataLackey || (context && context.dataLackey),
        }
        // eslint-disable-next-line no-console
        if (!this.state.dataLackey) console.error('No dataLackey found. Unable to load specified data.')

        console.log('construtor: LOADED=', this.state.dataLackey.loaded(this.state.resources))
        // if (!this.state.dataLackey.loaded(this.state.resources))
        //   nextResourcesPromise(this.state.resources,
        //                        [],
        //                        {
        //                          load:           this.state.dataLackey.load.bind(this.state.dataLackey),
        //                          unload:         this.state.autoUnload && this.state.dataLackey.unload.bind(this.state.dataLackey),
        //                          reloadInterval: this.state.reloadInterval,
        //                        })

      }

      static getDerivedStateFromProps (props, state) {
        console.log('getDerivedStateFromProps props=', props)
        const nextResources = resolveResources(resourceCreators, props)
        const dataLackey       = state.dataLackey
        nextResourcesPromise(nextResources,
                             state.resources,
                             {
                               load: dataLackey.load,
                               dataLackey,
                               autoUnload:     state.autoUnload,
                               reloadInterval: state.reloadInterval,
                             })
        // .then(() => this.forceUpdate())
        // .catch(() => this.forceUpdate())
console.log('getDerivedStateFromProps ... returning ', { resources: nextResources })
        return { resources: nextResources }
      }

      componentWillUnmount () {
        console.log('componentWillUnmount')
        if (this.state.autoUnload) this.state.dataLackey.unload(this.state.resources)
      }

      shouldComponentUpdate () {
        console.log('shouldComponentUpdate=', !this.state.dataLackey.reloading(this.state.resources))
        // We want to suppress rendering while data is being reloaded
        return !this.state.dataLackey.reloading(this.state.resources)
      }

      render () {
        console.log('render resources=', this.state.resources)
        const isLoading   = this.state.dataLackey.loading(this.state.resources),
              isReloading = this.state.dataLackey.reloading(this.state.resources),
              isLoaded    = this.state.dataLackey.loaded(this.state.resources),
              loadFailed  = this.state.dataLackey.failed(this.state.resources)
        console.log('render', { isLoading, isReloading, isLoaded, loadFailed })

        /**/return <WrappedComponent {...this.props} {...{ isLoading, isReloading, isLoaded, loadFailed }} />
      }
    }

    // https://facebook.github.io/react/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging
    WithData.displayName = `WithData(${getDisplayName(WrappedComponent)})`

    hoistNonReactStatic(WithData, WrappedComponent)

    WithData.contextTypes = {
      dataLackey: PropTypes.object,
    }
    return WithData
  }
}

function getDisplayName (Component) {
  return Component.displayName || Component.name || 'Component'
}
