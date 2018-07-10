# Motivation

Example React projects demonstrate loading data from a component:
As the component is mounted, an Ajax request is made,
and the view draws in a "loading" state. Then, when the Ajax completes,
the data is put into the state, the view renders again, displaying it. This pattern is straightforward, but overly simplistic.
 
This pattern does not scale:

* If two views use the same data, the data will get loaded twice, be sensitive to caching policies, 
  or without care, one view will depend on the other view to fetch its data.
* Adding testing around data loading code is difficult because it's coupled with the component lifecycle.
* Data fetching code is controlled by React rendering code:
  * Pre-fetching must be handled explicitly outside of the 
    normal data loading cycle.
  * Fine-tuning is difficult: To do any loading besides a simple fetch, custom code is requied.
  * Batch loading of data is hard to manage. For example, if a view 
    draws 100 items on the page, but we want to load them in batches of 10, 
    there's no good place for this code to live.
* We need keep track of what data is loaded and not loaded (or in progress). We
  will want to show the user some visual indicator of "loading". If code looks in
  the store for data, it can be ambiguous whether `null` means "no data" or 
  "not loaded yet", or we end up storing "meta" data for all our data.
* When navigating between virtual React pages, data can be loaded by the views as needed,
  and the URL changed to provide a "bookmarkable" page. But if the user visits
  this page directly from the URL, if there is any complexity to the data an its
  relationships, it will be bug prone. Worst case, a view won't have the data it expects.
  
In general, **if the view is directly responsible for data loading, the coupling 
between fetching and the drawing will cause problems**. This is 
fundamentally against "separation of concerns". 

This library offers a solution to these problems.
