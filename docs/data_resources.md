## Data Resource URI Recommendations

These are called "URIs" throughout, and should look as such. We recommend prefixing them all with `rsrc:`, and then following them with looks like URLs to your data. For example:
```
rsrc:/users
rsrc:/posts
rsrc:/posts/:postId
rsrc:/posts/:postId/comments
rsrc:/posts/:postId/comments/:commendId
```
If you have an API, this is a good starting point, but you can use any scheme you want as long as it creates unambiguous URIs for your data.
To start, it's recommended that you include parent IDs in the URLs. This will make the loading easier to follow, and will make it easier to understand what is dependent on what. In the above example, if the comment URL were `/comments/:commentId`, it would be difficult within the loader to know easily whether its post had also been loaded; by including the `postID`, it's easy to check on the post's loading status.

