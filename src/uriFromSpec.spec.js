/* eslint-env jest */
import {
  uriFromSpec as subject,
} from './uriFromSpec'

describe('uriFromSpec', () => {

  it('returns null',
     () => expect(subject(null)).toEqual(null))

  it('returns null if undefined',
     () => expect(subject()).toEqual(null))
  it('returns null if  empty string',
     () => expect(subject('')).toEqual(null))

  it('returns a URI',
     () => expect(subject('/foo')).toEqual('/foo'))

  it('handles params as query values',
     () => expect(subject('/foo?parm=cheese')).toEqual('/foo?parm=cheese'))

  it('handles object with "uri" prop', () => expect(subject({ resource: '/foo' })).toEqual('/foo'))

  it('handles object with "uri" prop and single params',
     () => expect(subject({
                            resource: '/foo',
                            bar:      'baz',
                          })).toEqual('/foo?bar=baz'))

  it('handles object with "uri" prop and multiple params',
     () => expect(subject({
                            resource: '/foo',
                            bar:      'baz', fizz: 'buzz',
                          })).toEqual('/foo?bar=baz&fizz=buzz'))

  it('alphabetizes multiple params',
     () => expect(subject({
                            resource: '/foo',
                            b:        '2', a: '1', c: '3',
                          })).toEqual('/foo?a=1&b=2&c=3'))

  it('does not include undefined params',
     () => expect(subject({
                            resource: '/foo',
                            bar:      undefined,
                          })).toEqual('/foo'))

  it('includes null params',
     () => expect(subject({
                            resource: '/foo',
                            bar:      null, baz: null,
                          })).toEqual('/foo?bar&baz'))

})
