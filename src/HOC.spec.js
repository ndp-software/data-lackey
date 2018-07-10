/* eslint-env jest */
import React from 'react'
import { mount } from 'enzyme'

import { loadData } from './HOC'
import configureDataLackey from './example.js'

function sampleComponent (props) {
  return <div>
    [{props.isLoading ? '' : 'not '}isLoading]
    [{props.isLoaded ? '' : 'not '}isLoaded]
    [{props.loadFailed ? '' : 'not '}loadFailed]
    Hello, {props.who} {props.message} {props.children}</div>
}

describe('HOC', function () {

  let dataLackey,
      WrappedComponent,
      recordLoad,
      propTracker

  beforeEach(() => {
    propTracker = 'Dispatched: '
    recordLoad  = jest.fn(x => propTracker = `${propTracker} ${x}`)

    const rootLoader    = jest.fn(() => Promise.resolve('items loaded').then(recordLoad))
    const itemLoader    = jest.fn(id => Promise.resolve(`item ${id} loaded`).then(recordLoad))
    const detailsLoader = jest.fn(id => Promise.resolve(`detail ${id} loaded`).then(recordLoad))

    dataLackey       = configureDataLackey({
                                             rootLoader,
                                             itemLoader,
                                             detailsLoader,
                                           })
    WrappedComponent = loadData('dl:items')(sampleComponent)
  })

  describe('with static resource', () => {
    beforeEach(() => {
      WrappedComponent = loadData('dl:items')(sampleComponent)
    })

    it('renders immediately if data is already loaded', async () => {
      await dataLackey.load('dl:items')
      expect(dataLackey.loaded('dl:items')).toBe(true)

      const view = mount(<WrappedComponent who='dawg' dataLackey={dataLackey}>{propTracker}</WrappedComponent>)
      expect(dataLackey.loaded('dl:items')).toBe(true)
      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('items loaded')
      expect(view.text()).toContain('[not isLoading]')
      expect(view.text()).toContain('[isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')
    })

    it('loads when component is mounted', async () => {
      const view = mount(<WrappedComponent who='dawg' dataLackey={dataLackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(dataLackey.loading('dl:items')).toBe(true)
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')
      await dataLackey.load('dl:items')
    })

    it('dispatches values on resolution', async () => {
      mount(<WrappedComponent who='dawg' dataLackey={dataLackey}>{propTracker}</WrappedComponent>)

      expect(recordLoad).not.toHaveBeenCalled()

      await dataLackey.load('dl:items')

      expect(recordLoad).toHaveBeenCalledWith('items loaded')
    })
  })

  describe('with multiple static resources', () => {
    beforeEach(() => {
      WrappedComponent = loadData('dl:item/1', 'dl:items')(sampleComponent)
    })

    it('loads when component is mounted', async done => {
      const view = mount(<WrappedComponent who='dawg' dataLackey={dataLackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      await dataLackey.load('dl:items')

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
      const view = mount(<WrappedComponent who='dawg'
                                           dataLackey={dataLackey}>{propTracker}</WrappedComponent>)

      expect(view.text()).toContain('Hello, dawg')
      expect(view.text()).toContain('[isLoading]')
      expect(view.text()).toContain('[not isLoaded]')
      expect(view.text()).toContain('[not loadFailed]')

      expect(dataLackey.loading('dl:item/1')).toBe(false) // blocked by dl:items
      await dataLackey.load('dl:items')
      expect(dataLackey.loading('dl:item/1')).toBe(true)

      expect(dataLackey.loading('dl:item/1/details')).toBe(true)
      await dataLackey.load('dl:item/1')
      expect(dataLackey.loading('dl:item/1/details')).toBe(true)

      expect(view.text()).toContain('[isLoading]')

      expect(dataLackey.loading('dl:item/1/details')).toBe(true)
      await dataLackey.load('dl:item/1/details') // resolution will trigger render
      expect(dataLackey.loading('dl:item/1/details')).toBe(false)

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
})
