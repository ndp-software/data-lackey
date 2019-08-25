import { Children, Component } from 'react'
import PropTypes from 'prop-types'

export class Provider extends Component {

  getChildContext () {
    const dataLackey = this.props.dataLackey
    return { dataLackey }
  }

  render () {
    // `Children.only` enables us not to add a <div /> for nothing
    return Children.only(this.props.children)
  }

}

Provider.propTypes = {
  dataLackey: PropTypes.object.isRequired,
}

Provider.childContextTypes = {
  dataLackey: PropTypes.object.isRequired,
}

export default Provider
