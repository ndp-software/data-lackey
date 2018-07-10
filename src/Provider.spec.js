/* eslint-env jest */
/* globals console */
/* eslint-disable no-console */
import React     from 'react'
import PropTypes from 'prop-types'
import Provider  from './Provider'
import {
  shallow,
  mount,
}                from 'enzyme'

describe('Provider', () => {

  it('requires child', () => {
    expect(() => {
      shallow(<Provider dataLackey={{}}/>)
    }).toThrow()
  })

  it('requires dataLackey', () => {
    console.error = jest.fn()

    shallow(<Provider dataLackey={{}}>
      <div/>
    </Provider>)
    expect(console.error).not.toHaveBeenCalled()

    shallow(<Provider>
      <div/>
    </Provider>)
    expect(console.error).toHaveBeenCalled()
  })


  it('provides dataLackey in context', () => {
    const dataLackey          = { foo: 'bar' },
          constructorObserver = jest.fn()

    class Nested extends React.Component {
      constructor (props, context) {
        constructorObserver(context.dataLackey)
        super(props)
      }

      render () {
        return <div/>
      }
    }

    Nested.contextTypes = {
      dataLackey: PropTypes.object,
    }

    mount(
      <Provider dataLackey={dataLackey}>
        <Nested myProp={3}/>
      </Provider>,
    )

    expect(constructorObserver).toHaveBeenCalledWith(dataLackey)
  })

})
