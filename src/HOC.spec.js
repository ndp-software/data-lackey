/* eslint-env jest */
// eslint-disable-next-line no-unused-vars
import React from 'react'
import {
  mount,
  shallow,
}            from 'enzyme'

import { loadData }            from './HOC'
import createLackeyWithLoaders from './example.js'

// global console


function sampleComponent (props) {
  return <div>
    [{props.isLoading ? '' : 'not '}isLoading]
    [{props.isLoaded ? '' : 'not '}isLoaded]
    [{props.loadFailed ? '' : 'not '}loadFailed]
    Hello, {props.who} {props.message} {props.children}</div>
}

describe('HOC', function () {

  const FAIL = 999
  let lackey,
        // eslint-disable-next-line no-unused-vars
        WrappedComponent,
        recordLoad,
        propTracker

  beforeEach(() => {
    propTracker = 'Dispatched: '
    recordLoad  = jest.fn(x => propTracker = `${propTracker} ${x}`)

    const rootLoader    = jest.fn(() => Promise.resolve('items loaded').then(recordLoad))
    const itemLoader    = jest.fn(id => (id == FAIL) ? Promise.reject('failure') : Promise.resolve(`item ${id} loaded`).then(recordLoad))
    const detailsLoader = jest.fn(id => Promise.resolve(`detail ${id} loaded`).then(recordLoad))

    lackey           = createLackeyWithLoaders({
                                                 rootLoader,
                                                 itemLoader,
                                                 detailsLoader,
                                               })
    WrappedComponent = loadData('dl:items', { autoUnload: true })(sampleComponent)
  })

  describe('when no data lackey', () => {
    it('logs a descriptive message', () => {
      jest.spyOn(console, 'error').mockImplementation(() => null)

      try {
        shallow(<WrappedComponent who='dawg' />)
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError)
      }
      expect(console.error).toHaveBeenCalledWith('No dataLackey found. Unable to load specified data.')
    })
  })

  describe('with static resource', () => {
    it('renders immediately if data is already loaded', async () => {
      await lackey.load('dl:items')
      expect(lackey.loaded('dl:items')).toBe(true)

      const view = mount(<WrappedComponent who='dawg' dataLackey={lackey}>{propTracker}</WrappedComponent>)
      expect(lackey.loaded('dl:items')).toBe(true)
      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('items loaded')
      expect(view.text()).toContain('[not isLoading]')
      expect(view.text()).toContain('[isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')
    })

    it('loads when component is mounted', async () => {
      const view = mount(<WrappedComponent who='dawg' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(lackey.loading('dl:items')).toBe(true)
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')
      await lackey.load('dl:items')
    })

    it('dispatches values on resolution', async () => {
      mount(<WrappedComponent who='dawg' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(recordLoad).not.toHaveBeenCalled()

      await lackey.load('dl:items')

      expect(recordLoad).toHaveBeenCalledWith('items loaded')
    })

    it('logs when loading fails', async () => {
      WrappedComponent = loadData(`dl:item/${FAIL}`)(sampleComponent)

      jest.spyOn(lackey.console, 'error')

      mount(<WrappedComponent who='dawg' dataLackey={lackey}>{propTracker}</WrappedComponent>)


      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(lackey.console.error).toHaveBeenCalledWith('failed dl:item/999 Error=failure')
    })
  })

  describe('with multiple static resources', () => {
    beforeEach(() => {
      WrappedComponent = loadData('dl:item/1', 'dl:items')(sampleComponent)
    })

    it('loads when component is mounted', async done => {
      const view = mount(<WrappedComponent who='dawg' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      await lackey.load('dl:items')

      process.nextTick(async () => {
        expect(recordLoad).toHaveBeenCalledWith('items loaded')
        expect(view.text()).toContain('[not isLoading]')
        expect(view.text()).toContain('[isLoaded]')
        expect(view.text()).toContain('[not loadFailed]')
        done()
      })

    })

  })

  describe('with a dynamic resource', () => {
    beforeEach(() => {
      WrappedComponent = loadData(() => 'dl:item/1/details')(sampleComponent)
    })

    it('loads resource passed as property', async done => {
      const view = mount(<WrappedComponent
        who='dawg'
        dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      expect(lackey.loading('dl:item/1')).toBe(false) // blocked by dl:items
      await lackey.load('dl:items')
      expect(lackey.loading('dl:item/1')).toBe(true)

      expect(lackey.loading('dl:item/1/details')).toBe(true)
      await lackey.load('dl:item/1')
      expect(lackey.loading('dl:item/1/details')).toBe(true)

      expect(view.text()).toContain('[isLoading]')

      expect(lackey.loading('dl:item/1/details')).toBe(true)
      await lackey.load('dl:item/1/details') // resolution will trigger render
      expect(lackey.loading('dl:item/1/details')).toBe(false)

      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')

      /* globals process */
      process.nextTick(() => {
        expect(view.text()).toContain('[not isLoading]')
        expect(view.text()).toContain('[isLoaded]')
        done()
      })

    })

  })

  describe('resources changing', () => {

    it('will load new resource', () => {
      jest.spyOn(lackey, 'load')
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      expect(lackey.load).toBeCalledWith('dl:items', {})

      c.instance().setResources(['dl:item/1'])

      expect(lackey.load).toBeCalledWith('dl:items', {})
      expect(lackey.load).toBeCalledWith('dl:item/1', {})
    })

    it('will unload old resource', async () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      await c.instance().setResources(['dl:item/1'])
      jest.spyOn(lackey, 'unload')

      await c.instance().setResources(['dl:item/2'])

      expect(lackey.unload).toBeCalledWith('dl:item/1')
    })

    it('will load with reloadInterval if `reloadInterval` specified as a prop', async () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} reloadInterval={70} />)
      jest.spyOn(lackey, 'load')

      await c.instance().setResources(['dl:item/1'])

      expect(lackey.load).toHaveBeenCalledWith('dl:item/1', { reloadInterval: 70 })
    })
  })

  describe('componentWillUnmount', () => {
    it('will unload resources', () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)

      jest.spyOn(c.instance(), 'setResources')
      c.instance().componentWillUnmount()

      expect(c.instance().setResources).toHaveBeenCalledWith([], c.instance().props)
    })
  })

  describe('componentWillReceiveProps', () => {
    it('will unload resources', () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      jest.spyOn(c.instance(), 'setResources')

      c.instance().componentWillReceiveProps({ foo: 'bar' })

      expect(c.instance().setResources).toHaveBeenCalledWith(['dl:items'], { foo: 'bar' })

      c.instance().componentWillReceiveProps({ foo: 'bar' })
    })
  })
})
