import hoistNonReactStatic from 'hoist-non-react-statics'
import PropTypes           from 'prop-types'
import React               from 'react'
import {
  arraysEqual,
  flatMap,
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

        // Allow overriding of the "dataLackey" source.
        this.dataLackey = this.props.dataLackey || (context && context.dataLackey)

        // eslint-disable-next-line no-console
        if (!this.dataLackey) console.error('No dataLackey found. Unable to load specified data.')

        this.state = {
          autoUnload:     this.props.autoUnload || options.autoUnload,
          reloadInterval: this.props.reloadInterval || options.reloadInterval,
          resources:      [],
        }
      }

      setResources (rcs, props) {
        const nextResources = this.resolveResources(rcs, props),
              promise       = this.loadResources(nextResources)

        this.setState({ resources: nextResources }, () => {
          promise
            .then(() => this.forceUpdate())
            .catch(() => this.forceUpdate())
        })
      }


      loadResources (nextResources) {

        if (arraysEqual(nextResources, this.state.resources)) return Promise.resolve() // do nothing

        const prevResources   = this.state.resources,
              comingResources = new Set(nextResources).difference(prevResources),
              goingResources  = new Set(prevResources).difference(new Set(nextResources))

        if (this.state.autoUnload)
          goingResources.forEach(uri => this.dataLackey.unload(uri))

        const loadOptions = {}
        if (this.state.reloadInterval) loadOptions.reloadInterval = this.state.reloadInterval
        return Promise.all([...comingResources].map(uri => this.dataLackey.load(uri, loadOptions)))
      }

      // URIs might be functions that need to be called
      resolveResources (creators, props) {
        return flatMap(
          creators
            .map(rc =>
                   (typeof (rc) === 'function'
                   ? rc(props)
                   : rc),
            )
            .filter(resource => resource),
          resource => resource,
        )
      }

      componentWillMount () {
        this.setResources(resourceCreators, this.props)
      }

      componentWillUnmount () {
        this.setResources([], this.props)
      }

      componentWillReceiveProps (nextProps) {
        this.setResources(resourceCreators, nextProps)
      }

      shouldComponentUpdate () {
        // We want to suppress rendering while data is being reloaded
        return !this.dataLackey.reloading(this.state.resources)
      }

      render () {
        const isLoading   = this.dataLackey.loading(this.state.resources),
              isReloading = this.dataLackey.reloading(this.state.resources),
              isLoaded    = this.dataLackey.loaded(this.state.resources),
              loadFailed  = this.dataLackey.failed(this.state.resources)

        return <WrappedComponent {...this.props} {...{ isLoading, isReloading, isLoaded, loadFailed }} />
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
