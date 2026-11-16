# ReopeningToolbarMixin

Helps implementations of toolbars to let the dropdown or a direct sub menu
stay open when a refilter on the toolitems.filtered.model is triggered.

## Usage

```js
define([
  ...
  'csi/lib/marionette',
  'csui/controls/mixins/dynamic.toolitems/reopening.toolbar.mixin',
  ...
], function (
  ...
  Marionette,
  ReopeningToolbarMixin,
  ...
) {

  var MyToolBarView = Marionette.CollectionView.extend({

    constructor: function ToolBarView(options) {
      
      ...

      Marionette.CollectionView.prototype.constructor.apply(this, arguments);

      this.makeReopeningToolbar();

      ...
    },

    ...
  });

  ReopeningToolbarMixin.mixin(MyToolBarView.prototype);

  return MyToolBarView;
});
```
The mixin listens to the "before:reset remain" events of the filtered 
toolitem collection of the toolbar view and checks if the dropdown or a submenu
is open at that point in time. If this the case, then it listens once to the event
'after:adjust' to reopen the dropdown or sub menu.


Note: the dropdown must be implemented as a binf-dropdown and
findable by the query selector 'ul > li.binf-dropdown' in view.el.
Direct sub menus must be implemented by binf-dropdown-submenu and
findable by the query selector '.binf-dropdown-submenu' in view.el.
The open state must be reflected on these elements by the css class 'binf-open'.

## Options

### afterAdjustEvent

Type: string

Specifies which event to listen to, to reopen the dropdowns. By default it is 'after:adjust'
Set options.afterAdjustEvent of your toolbar view instance options to a different event name, if needed.
