import {
  canonicalUri as subject,
} from './canonicalUri'

describe('canonicalUri', () => {

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

  it('handles object with "uri" prop', () => expect(subject({ uri: '/foo' })).toEqual('/foo'))

  it('handles object with "uri" prop and null params',
     () => expect(subject({
                            uri:    '/foo',
                            params: null,
                          })).toEqual('/foo'))

  it('handles object with "uri" prop and empty params',
     () => expect(subject({
                            uri:    '/foo',
                            params: {},
                          })).toEqual('/foo'))

  it('handles object with "uri" prop and single params',
     () => expect(subject({
                            uri:    '/foo',
                            params: { bar: 'baz' },
                          })).toEqual('/foo?bar=baz'))

  it('handles object with "uri" prop and multiple params',
     () => expect(subject({
                            uri:    '/foo',
                            params: { bar: 'baz', fizz: 'buzz' },
                          })).toEqual('/foo?bar=baz&fizz=buzz'))

  it('alphabetizes multiple params',
     () => expect(subject({
                            uri:    '/foo',
                            params: { b: '2', a: '1', c: '3' },
                          })).toEqual('/foo?a=1&b=2&c=3'))

  it('does not include undefined params',
     () => expect(subject({
                            uri:    '/foo',
                            params: { bar: undefined },
                          })).toEqual('/foo'))

  it('includes null params',
     () => expect(subject({
                            uri:    '/foo',
                            params: { bar: null, baz: null },
                          })).toEqual('/foo?bar&baz'))

})
