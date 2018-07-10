# Direct Usage

You can load directly by including `myLackey` and call `load` giving a specific URI. For example:
```js
import { myLackey } from 'myLackey'
...
componentWillMount () {
  myLackey.load('/users')
}
```
Once you have data lackey available, you can check on the status of the loading:

```js
  render() {
    const stillLoading = myLackey.loading('/users')

    return stillLoading
      ? <div>Loading...</div>
      : <div>...</div>
  }
```
Also available:
  * `loaded(uri)` or `loaded(uris...)` returns `true` if the data is already loaded.
  * `failed(uri)` returns `true` if the data loading promise failed.
  * `unload(uri)` or `unload(uris)` marks the given URIs unloaded
