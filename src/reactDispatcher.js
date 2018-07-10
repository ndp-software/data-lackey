 /*
 Configure extension to dispatch an action when the job is started.
 For example:
 ```js
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
*/
export function createReactPromiseDispatcher (dispatch) {
  return job => {
    if (dispatch && job.ruleOptions.actionType) {
      dispatch({
                 type:    job.ruleOptions.actionType,
                 payload: job.promise,
               })
    }
  }
}
