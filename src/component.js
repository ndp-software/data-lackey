import { loadData } from './HOC'

// Creates a component that renders children while loading the given URI
export function createLoaderComponent(...dataUris) {
  return loadData(...dataUris)(props => props.children)
}
