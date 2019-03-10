/* global global */
/**
 * This function returns a promise that will resolve when the supplied `expectation` function
 * executes without throwing an error (i.e. due to a failed assertion). This approach is based
 * heavily off the wait-for-assert utility: https://github.com/TheBrainFamily/wait-for-expect. It
 * can prove handy for integration tests.
 *
 * Endorsements:
 * https://www.apollographql.com/docs/guides/testing-react-components.html
 * https://github.com/kentcdodds/react-testing-library#wait
 *
 * @param {Function} expectation a function containing assertions
 * @param {Number} timeout the max interval to wait before rejecting the promise
 * @param {Number} interval the time between retries
 * @return {Promise}
 */
export function waitForAssertion (expectation, timeout = 500, interval = 50) {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {

    const rejectOrRerun = error => {
      if (Date.now() - startTime >= timeout) {
        reject(error)
      } else {
        global.setTimeout(runExpectation, interval)
      }
    }

    function runExpectation () {
      try {
        const result = expectation()

        Promise.resolve(result)
               .then(() => resolve())
               .catch(rejectOrRerun)
      } catch (error) {
        rejectOrRerun(error)
      }
    }

    global.setTimeout(runExpectation, 0)
  })
}
