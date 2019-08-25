# Patterns

When you define your data lackey, you identify resources with patterns.
These can be as simple as strings, but for more complex data structures,
DataLackey supports more flexible and convenient formats.

## Strings

The simplest way to specify a pattern is with a string, for example: `posts`. This specifies one resource, and is not parameterized. Specifying `posts` is just one thing. (It's worth coming up with a convention for these if you have-- or will have-- a larger app.)

If you have multiple resources, the string can be parameterized. This is done with `$` and the name of the variable. For example: `/user-$userId/invoices` would match when `/user-33/invoices` is loaded. Multiple parameters are allowed, such as `rsrc:/user/$userId/catalog/$catalogId/section-counts`.

The default `$` matching rules usually suffice, but they can be customized
by passing ruleOptions as the second parameter to the rule specifier.
```
lackey.rule(pattern, {
     patternOpts: {
       segmentNameStartChar: ':',   // default: $
       segmentValueCharset:  '\\d', // default: 'a-zA-Z0-9\\-,_%~\\.!\\*\\(\\)'
     }
   })
```   
Under the hood, DataLackey uses a small package, [url-pattern](https://github.com/snd/url-pattern), which is quite flexible. A rule's options are passed through to it, so you can use most of its customization features; if 
the documentation seems out of date, check [the code here.](https://github.com/snd/url-pattern/blob/master/src/url-pattern.coffee#L191).

When the loader for these patterns in called, the matching parameters are passed into the loader function.

## Regular Expressions

Sometimes even more flexibility is is needed, so regular expressions can be used to specify patterns. Just use them.

Matching segmenets of the RegExp will be passed to the loader function in the normal order they are matched. 

If you would rather have matched segments come in as properties of an object, you can specify `groupNames` as part of the `ruleOptions`. For example, `lackey.rule(/v(\d+)\.(\d+)/, {groupNames: ['major', 'minor']` would match `v10.2`, and provide the loader function with `{ major: '10', minor: '2' }`.

## Objects

When resource have more than a couple parameters, or optional parameters, building a string can become tedious and error-prone. In order to facilitate this, you can also specify rules as JavaScript objects. This looks like this:
```
lackey.rule({
    resource: `post'
    params: ['id', 'includeComments']
  }
```
To load this resource:
```
lackey.load({
    resource: 'post',
    params: { id: 7, includeComments: true }
  })
```
If you forget to use `params`, DataLackey will find and use the parameters, but this is not officially supported and may be removed.

## Arrays

Finally, you can pass an array of patterns in any of the above formats.
