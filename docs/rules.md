# Rules in Detail

The above example glosses over many of the capabilities of the Data Lackey definition. 
Data lackey is based off of **rules**. A rule consists of: 
  * **matcher**, a pattern to match
  * **loader**, a function that provides the needed data
  * **dependencies**, if any
  * other options

You'll create one of these for each independently manageable piece of data. For example, a rule that loads
books from an API:
```js
  myLackey.rule('books', {
    loader: () => fetch('/api/books')
  })
```
Each of these pieces is explained in more detail below.

## Matcher
The **matcher** specifies a set "data resources". 
They may be top-level resources like `blog-posts`). 

A match may also 
specify _a set of URIs_, using URI patterns. For specific items with ids like `/post/73`, 
using a `$` to identify the IDs, as in `/posts/$postId`. 

For more options, see [patterns.md](./patterns.md)

## Loader
All rules require a **loader** function. As suggested by its name, this function will be called to 
load the matched data. This loader function should return _a promise object_ that resolves when 
the data is delivered.

```js
  myLackey.rule('blog_posts', {
    loader: () => Promise.resolve('ignored by data lackey')
  })
```

To facilitate general rules that applied to a range of requests, the loader will 
be called with arguments for any tagged matches in the matcher as properties 
of the first argument. For example:

```js
  myLackey.rule('/posts-$postId', {
    loader: ({postId}) => fetch('posts/' + postId)  // `postId` matched above
  })
```

__DataLackey does not know about or track the actual data.__ It does not model data at all-- 
you will use Redux or some other mechanism to do this. DataLackey is just helping 
orchestrate the loading calls.

## Dependencies 

All Data Lackey provides thusfar is a convoluated way to call `fetch`.
The final part of a rule definition is the **dependencies**. These are simply data lackey URIs that 
need to be loaded before the given rule. A typical example of this is that the 
user hits a widget detail component, but the widget details require the core widget 
information is loaded before the specific details. 
In this example, posts need the authors to be loaded before they load:

```js
  myLackey.rule('posts', {
    loader   : loadFn,
    dependsOn: 'authors'
  })

  myLackey.rule('authors', {
    loader   : loadFn,
  })
```
The `dependsOn` can also be an array of values, as needed.
```
  myLackey.rule('authors', {
    loader   : loadFn,
    dependsOn: ['publicists', 'managers']
  })
```

The dependencies will often require an `id` of the main request. To faciliate this, use a function, 
which receives the same parameters as the `loader` function. In the following example, 
the comments require that the main post be loaded first, as might happen on a page about the specific comment:

```js
  myLackey.rule('post-(\d+)\/comments', {
    loader   : id => loadFn,
    dependsOn: id => `post-${id}`
  })

  myLackey.rule('post-(\d+)', {
    loader   : id => loadFn,
  })
```
Like the static string, this can return an array of values if needed.


## Other Values

A rule's second argument will accept any object; all that it requires is a `loader`. This
is useful to provide data to other parts of the system and plugins. For example, 
using Redux you can add an `actionType` to the rule and configure the React/Redux dispatching
plugin. The plugin will grab the `actionType` and dispatch actions automatically as 
data is loaded. See [React](./react.md) 
