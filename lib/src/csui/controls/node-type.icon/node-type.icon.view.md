# NodeTypeIconView

Renders an icon of a node, which should be passed to the constructor as the `node` option.

```javascript
var node = new NodeModel(...),
    region = new Marionette.Region(...),
    iconView = new NodeTypeIconView({node: node});
region.show(iconView);
```


## Icon source

the source of the icon can be determined by type and mime_type or by image_url.

### Type and mime type

The icon consists of a *main icon* decided mainly by the node `type` and
`mime_type` for documents and by *overlay icons*, which may indicate some
node characteristics.

### Image URL

If the image_url attribute of the node is set, the provided URL is used as image source.
The URL can be an image loadable by the browser itself or it can be a URL,
that needs authentication in which case an ajax call is done.

To determine whether an ajax is needed or not, the extension 'csui/controls/node-type.icon/node-type.icon.view.ext'
is used. The node-type.icon.view.ext extension provides an object with the method needsAjax:

```
{
  /**
   * Check if ajax call is needed to get the image (i.e. url contains the cgi script).
   * @this calling context is set to the node type icon view.
   * @param {url} the image url to check.
   * @returns true if ajax call is needed, false otherwise.
   */
  needsAjax: function (url) {
    ...
  }
}
```

The standard implementation of the extension simply checks if the URL is addressing the cgi-script
and if so delivers true, otherwise false.


If the call to needsAjax delivers true, the view fetches the image using an ajax call.
Otherwise the URL is used directly as SRC in the IMG tag.
URLs starting with 'data:' or 'blob:' are handled as 'loadable by the browser' and
are used as is SRC in the IMG tag.


## Icon size and coloring

In addition to node you can specify the following options that influence the rendered icon:
1) `size: 'xsmall`: the icon is rendered in the specified size. Available sizes are described in
 icons.v2.md.
2) `useTwoColorIcon: true`: if available, an alternative version of the icon is rendered, which
 is optimized for being displayed by using only two colors.
3) `colorFirst: 'OT Steal +1`: if using together with a two color icon, it overrides the default
 for the first color (fill and stroke in the svg are set to this color). Note that the name of
  the color must be from the OT color schema - described in icons.v2.md
4) `colorSecond: 'Burnt`: same as colorFirst, but for the secoond color.

Note: to be able to use useTwoColorIcon, colorFirst or colorSecond the SVG must be drawn in a way
 that all elements (path, poly, circle, etc.) that should get colorFirst must be in a layer with
 name 'colorFirst'. The exported SVG makes a group with id="colorFirst" out of this layer and
 during build of csui the layer id is converted into a corresponding class name.
