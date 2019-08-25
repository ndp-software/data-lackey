/* eslint-env jest */
import {
  uriFromSpec as subject,
} from './uriFromSpec'

describe('uriFromSpec', () => {

  test('returns null',
       () => expect(subject(null)).toEqual(null))

  test('returns null if undefined',
       () => expect(subject()).toEqual(null))
  test('returns null if  empty string',
       () => expect(subject('')).toEqual(null))

  test('returns a URI',
       () => expect(subject('/foo')).toEqual('/foo'))

  test('handles params as query values',
       () => expect(subject('/foo?parm=cheese')).toEqual('/foo?parm=cheese'))

  test('handles object with "uri" prop', () => expect(subject({ resource: '/foo' })).toEqual('/foo'))

  test('handles object with "uri" prop and single params',
       () => expect(subject({
                              resource: '/foo',
                              bar:      'baz',
                            })).toEqual('/foo?bar=baz'))

  test('handles object with "uri" prop and multiple params',
       () => expect(subject({
                              resource: '/foo',
                              bar:      'baz', fizz: 'buzz',
                            })).toEqual('/foo?bar=baz&fizz=buzz'))

  test('handles object with "uri" prop and params object',
       () => expect(subject({
                              resource: '/foo',
                              params:   { bar: 'baz', fizz: 'buzz' },
                            })).toEqual('/foo?bar=baz&fizz=buzz'))

  test('alphabetizes multiple params',
       () => expect(subject({
                              resource: '/foo',
                              b:        '2', a: '1', c: '3',
                            })).toEqual('/foo?a=1&b=2&c=3'))

  test('does not include undefined params',
       () => expect(subject({
                              resource: '/foo',
                              bar:      undefined,
                            })).toEqual('/foo'))

  test('includes null params',
       () => expect(subject({
                              resource: '/foo',
                              bar:      null, baz: null,
                            })).toEqual('/foo?bar&baz'))

})
