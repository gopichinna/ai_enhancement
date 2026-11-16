# DynamicToolItemsMixin

Helps updating dynamic tool items in typical situations - on events triggered when default and delayed actions become available. Toolbar controllers can use it to automate updates of the toolbars, which they maintain.

## Synopsis

```js
import { LayoutView } from 'csui/lib/marionette';
import DynamicToolItemsMixin from 'csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin';
import toolbars from 'myext/widgets/mywidget/toolbars';
import toolbarExtensions from 'csui-ext!myext/widgets/mywidget/impl/main.toolbar/main.toolbar.view';

export const MainToolbarView = Marionette.LayoutView.extend({
  constructor: function MainToolbarView(options) {
    Marionette.LayoutView.prototype.constructor.call(this, options);

    ...

    // Enable adding of dynamic tool items to two toolbars.
    this.makeDynamicToolItems({
      collection: this.collection,
      toolbars,
      toolbarNames: ['headerToolbar', 'selectionToolbar'],
      eventArgs: {
        context: this.context,
        container: this.container,
        collection: this.collection,
        selection: this.selectedNodes,
        addableTypes: this.addableTypes
      }
    });

    // Let the extensions listen to events for adding new tool items.
    if (toolbarExtensions) {
      toolbarExtensions.forEach(entryPoint => entryPoint(this));
    }
  },

  ...
});

DynamicToolItemsMixin.mixin(MainToolbarView.prototype);
```

See "Dynamic Tool Items" in `csui/controls/tabletoolbar/tabletoolbar.md` for information about the extensions, which will add the dy.

## Options

### model / collection

Type: usually `Backbone.Model` or `Backbone.Collection`, has to implement `Backbone.Events`

Either of the two properties can be specified, depending on the object, which fetches the data with permitted actions and may have delayed actions enabled. It is used to listen to the `sync` event and to the events specific to the delayed actions handling `delayedActions`.

### toolbarItems

Type: `{ [string]: ToolItemFactory }`

Object with toolbar configurations. It is usually the export from the extensible module that includes all toolbar configurations of a widget.

### toolbarNames

Type: `string[]`

Array with names of toolbars, which are supposed to support the dynamic tool items. Thay have to match the keys in the `toolbarItems` object.

### eventArgs

Type: `{ [string]: any }`

Additional properties to be included in the event arguments, which will be available in the event handlers responsible for adding the dynamic tool items.


All available buttons or menu items (tool items) are set up statically using `ToolItemsFactory`. They will be hidden if the related command is not enabled. If some buttons or menu items need to be added dynamically during the runtime, it is possible using the extension point in `TableToolbarView`:

```js
// Register an extension adding dynamic tool items
'csui/controls/tabletoolbar/tabletoolbar.view': {
  extensions: {
    demo: ['demo/dynamic.toolitems']
  }
}
```

The extension module has to return a function, which will be called during the toolbar construction and will be passed the `TableToolbarView` instance. The usual task to do is to subscribe to events triggered by the `TableToolbarView` instance:

```js
// Declare an extension adding dynamic tool items
csui.define('demo/dynamic.toolitems', [
  'csui/controls/toolbar/toolitem.model'
], ToolItemModel => {
  return tableToolbarView =>
    tableToolbarView.on('before:updateToolbar', ({ trigger, toolbarName, toolItemFactory, async }) => {
      // All properties of the input object:
      //   context: the context
      //   container: currently opened container, if applicable
      //   collection: currently listed collection, if applicable
      //   selection: current selection, if applicable
      //   addableTypes: addable types, if applicable
      //   toolbarName: name of the tool item factory
      //   toolItemFactory: the tool items configuration
      //   trigger: action triggering this event
      //   async: asynchronous return helper

      // Apply the changes only to the specific toolbar, only if the tool items
      // have not been added earlier. An additional condition based on the contents
      // of the objects above my be checked before the items are added.
      if (toolbarName === 'tableHeaderToolbar' &&
          !toolItemFactory.hasItem('demo-introduce-feature')) {
  '      // Get the asynchronous return helper
        const done = async();
        // Return additional tool items
        done([
          new ToolItemModel({
            signature: 'demo-introduce-feature',
            name: 'Introduce Feature'
          }),
          new ToolItemModel({
            signature: 'demo-deprecate-feature',
            name: 'Deprecate Feature'
          })
        ]);
      }
    });
});
```

Widgets usually use multiple toolbars. The name of the toolbar, which is one of the keys in the object returned from the toolbar configuration module, can be checked by the `toolbarName` property.

New tool items should be added only if they had not been added by an earlier event handler. The `toolItemFactory` property points to the object with all tool items and should be used to check the existing tool items. Also, do not set the `group` attribute for new tool items, unless you use a custom toolbar view, which can handle tool items placed to any location. The `group` attribute may put the new tool item among earlier existing ones, which would shift the existing tool items.

The event `before:updateToolbar` may be triggered multiple times. Typically, there may be one to four occurrences:

* The toolbar was created (no actions available).
* The model or collection was fetched (default actions available).
* Delayed (promoted) actions were fetched.
* Lazy (non-promoted) actions were fetched.
