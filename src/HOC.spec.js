/* eslint-env jest */
// global window
import createLackeyWithLoaders from './example.js'
// eslint-disable-next-line no-unused-vars
import React                   from 'react'
import { loadData }            from './HOC'
import {
  mount,
  shallow,
}                              from 'enzyme'


const sampleComponent = props => <div>
  [{props.isLoading ? '' : 'not '}isLoading]
  [{props.isLoaded ? '' : 'not '}isLoaded]
  [{props.loadFailed ? '' : 'not '}loadFailed]
  Hello, {props.who} {props.message} {props.children}</div>

describe('HOC', function () {

  let lackey,
      // eslint-disable-next-line no-unused-vars
      WrappedComponent,
      recordLoad,
      propTracker,
      options

  beforeEach(() => {
    propTracker = 'Dispatched: '
    recordLoad  = jest.fn(x => propTracker = `${propTracker} ${x}`)

    const rootLoader    = jest.fn(() => Promise.resolve('items loaded').then(recordLoad)),
          itemLoader    = jest.fn(id => Promise.resolve(`item ${id} loaded`).then(recordLoad)),
          detailsLoader = jest.fn(id => Promise.resolve(`detail ${id} loaded`).then(recordLoad))

    options          = {
      console: {
        log:   jest.fn(),
        error: jest.fn(),
      },
    }
    lackey           = createLackeyWithLoaders({
                                                 rootLoader,
                                                 itemLoader,
                                                 detailsLoader,
                                               },
                                               options)
    WrappedComponent = loadData('dl:items', { autoUnload: true })(sampleComponent)
  })

  // afterEach(() => expect(window.console.error).not.toHaveBeenCalled())

  describe('when no data lackey', () => {
    test('logs a descriptive message', () => {
      jest.spyOn(window.console, 'error').mockImplementation(() => null)

      try {
        shallow(<WrappedComponent who='world' />)
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError)
      }
      expect(window.console.error).toHaveBeenCalledWith('No dataLackey found. Unable to load specified data.')
    })
  })

  describe('with static resource', () => {

    afterEach(async () => await lackey.load('dl:items'))

    test('loads when component is mounted', async () => {
      const view = mount(<WrappedComponent who='world' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, world')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')
      expect(lackey.loading('dl:items')).toBe(true)
    })

    test('dispatches values on resolution', async () => {
      mount(<WrappedComponent who='world' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(recordLoad).not.toHaveBeenCalled()

      await lackey.load('dl:items')

      expect(recordLoad).toHaveBeenCalledWith('items loaded')
    })

    describe('data already loaded', () => {
      beforeEach(async () => await lackey.load('dl:items'))

      test('renders immediately', async () => {
        expect(lackey.loaded('dl:items')).toBe(true)
        expect(lackey.reloading('dl:items')).toBe(false)
        expect(lackey.loading('dl:items')).toBe(false)

        const view = mount(<WrappedComponent who='world' dataLackey={lackey}>{propTracker}</WrappedComponent>)

        expect(view.text()).toContain('Hello, world')
        expect(view.text()).toContain('items loaded')
        expect(view.text()).toContain('[not isLoading]')
        expect(view.text()).toContain('[isLoaded]')
        expect(view.text()).toContain('[not loadFailed]')
      })

    })

  })

  describe('when loading fails', () => {
    test('logs', async () => {
      const uri = 'FAILURE'
      lackey.rule(uri, { loader: () => Promise.reject('reject!') })
      // WrappedComponent = loadData(uri)(() => <div />)

      mount(<WrappedComponent who='world' dataLackey={lackey} />)

      await new Promise(resolve => window.setTimeout(resolve, 1)) //lackey.load(uri)

      expect(options.console.error).toHaveBeenCalledWith('failed FAILURE Error=reject!')
    })

  })

  describe('with multiple static resources', () => {
    beforeEach(() => {
      WrappedComponent = loadData('dl:item/1', 'dl:items')(sampleComponent)
    })

    test('loads when component is mounted', async done => {
      const view = mount(<WrappedComponent who='world' dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, world')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      await lackey.load('dl:items')

      process.nextTick(async () => {
        expect(recordLoad).toHaveBeenCalledWith('items loaded')
        expect(view.text()).toContain('[not isLoading]')
        expect(view.text()).toContain('[isLoaded]')
        expect(view.text()).toContain('[not loadFailed]')
        await lackey.load('dl:item/1')
        done()
      })
    })
  })

  describe('with a dynamic resource', () => {
    beforeEach(() => {
      WrappedComponent = loadData(() => 'dl:item/1/details')(sampleComponent)
    })

    test('loads resource passed as property', async done => {
      const view = mount(<WrappedComponent
        who='world'
        dataLackey={lackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, world')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      await lackey.load('dl:items')
      expect(lackey.loading('dl:item/1')).toBe(true)

      await lackey.load('dl:item/1')

      expect(view.text()).toContain('[isLoading]')

      expect(lackey.loading('dl:item/1/details')).toBe(true)
      await lackey.load('dl:item/1/details') // resolution will trigger render
      expect(lackey.loading('dl:item/1/details')).toBe(false)
      expect(view.text()).toContain('[not isLoading]')
      expect(view.text()).toContain('[isLoaded]')

      /* globals process */
      process.nextTick(() => {
        done()
      })

    })

  })

  describe('resources changing', () => {

    test('will load new resource', () => {
      jest.spyOn(lackey, 'load')
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      expect(lackey.load).toBeCalledWith('dl:items', {})

      c.instance().setResources(['dl:item/1'])

      expect(lackey.load).toBeCalledWith('dl:items', {})
      expect(lackey.load).toBeCalledWith('dl:item/1', {})
    })

    test('will unload old resource', async () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      await c.instance().setResources(['dl:item/1'])
      jest.spyOn(lackey, 'unload')

      await c.instance().setResources(['dl:item/2'])

      expect(lackey.unload).toBeCalledWith('dl:item/1')
    })

    test('will load with reloadInterval if `reloadInterval` specified as a prop', async () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} reloadInterval={70} />)
      jest.spyOn(lackey, 'load')

      await c.instance().setResources(['dl:item/1'])

      expect(lackey.load).toHaveBeenCalledWith('dl:item/1', { reloadInterval: 70 })
    })
  })

  describe('componentWillUnmount', () => {
    test('will unload resources', () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)

      jest.spyOn(c.instance(), 'setResources')
      c.instance().componentWillUnmount()

      expect(c.instance().setResources).toHaveBeenCalledWith([], c.instance().props)
    })
  })

  describe('componentWillReceiveProps', () => {
    test('will unload resources', () => {
      const c = shallow(<WrappedComponent dataLackey={lackey} />)
      jest.spyOn(c.instance(), 'setResources')

      // eslint-disable-next-line new-cap
      c.instance().UNSAFE_componentWillReceiveProps({ foo: 'bar' })

      expect(c.instance().setResources).toHaveBeenCalledWith(['dl:items'], { foo: 'bar' })

      // eslint-disable-next-line new-cap
      c.instance().UNSAFE_componentWillReceiveProps({ foo: 'bar' })
    })
  })
})
