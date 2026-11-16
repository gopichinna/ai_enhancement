# CSS

Bundles and loads CSS stylesheets referred from JavaScript module dependencies.

TODO: Write the documentation.

## Load CSS bundle

Stylesheet bundles are loaded by a call to `styleLoad` in bundle indexes, for example:

```js
define([
  ...
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-browse');
});
```

### styleLoad(require, bundleName, separateRTLCSS?): Promise<Event>

* `require` - the `require` function required for the module, where the `styleLoad` is going to be called
* `bundleName` - the name of the module bundle, for which the stylesheet will be loaded
* `separateRTLCSS` - if the stylesheet for the RTL text-writing direction is in the same or in a separate file (default is `true`)

If `separateRTLCSS` is `true` or not specified and the selected UI language requires the RTL text-writing direction, the stylesheet name will include the suffix `-rtl`. The RTL stylesheet will be used instead of the default one:

| Bundle name                | LTR text-writing direction     | RTL text-writing direction         |
|:---------------------------|:-------------------------------|:-----------------------------------|
| `csui/bundles/csui-browse` | `csui/bundles/csui-browse.css` | `csui/bundles/csui-browse-rtl.css` |

If `separateRTLCSS` is `false` and the selected UI language requires the RTL text-writing direction, the default stylesheet name will be used. The default stylesheet is supposed to contain styles supporting both LTR and RTL text-writing direction:

| Bundle name                | LTR text-writing direction     | RTL text-writing direction     |
|:---------------------------|:-------------------------------|:-------------------------------|
| `csui/bundles/csui-browse` | `csui/bundles/csui-browse.css` | `csui/bundles/csui-browse.css` |

If the RTL stylesheet fails loading this method will make an attempt to load the default (LTR) stylesheet. If the default stylesheet doesn't contain RTL styles, the application will not work fully in the RTL mode, but having some styling instead of no styling might make the problem not so critical, before the fix is released. If such failure (a 404 status from requesting a `*-rtl.css` file) occurs, it will be fixed either by:

* producing the RTL stylesheet and including it in the packaged build output. This is the most usual situation, because separate RTL stylesheets is the default way how to handle RTL in Smart UI projects.
* not loading the RTL stylesheet, because the RTL styles are in the default one. The last argument of `styleLoad` will be set to `false`: `styleLoad(require, '...', false)`.

The method returns a promise, which will be fulfilled with the event, which was caught by the internally used event handler for `load` or `error` events. If the stylesheet failed loading, the promise will be rejected and the event will contain a property `type === 'error'`. If it succeeded, the promise will be resolved. If the default stylesheet was tried to be loaded after loading the RTL stylesheet failed, the promise will be rejected with the event from the first RTL stylesheet loading. That event will have an additional property - `defaultStylesheet` - which will make the event from loading the default stylesheet accessible too.
