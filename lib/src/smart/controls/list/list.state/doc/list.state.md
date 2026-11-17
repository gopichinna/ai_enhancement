## ListState Smart Control​ Configuration

<p>Marionette Itemview that provides a container to display the app specified text showing the
 different states of list view.</p>

<p>
  Different states are...
  1. Loading (depricated, blocking view will take care of it)
  2. Listing
  3. Empty
  4. Error
</p>

**Module: smart/controls/list/list.state/list.state.**

### Example for using SmartControls emptylist view

```js
define(['smart/controls/list/list.state/list.state.view'
], function (ListStateView) {

  var SmartListStateView = ListStateView.extend({

    constructor: function SmartListStateView(options) {
      ListStateView.prototype.constructor.call(this, options);
    }

  });
  
  return SmartListStateView;
});

```

### Parameters

<ul>
  <li><b>empty - `optional`(String)</b>Default: "No Items", text to add in the empty list content area.</li>
  <li><b>emptyJatoIllustration - `optional`(SVG Content - String)</b>Default: Default svg content, SVG image that needs to display to relicate empty for the list.</li>
</ul>

<br>
<br>
