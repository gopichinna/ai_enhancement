## EmptyList Smart Control​ Configuration

<p>Marionette Itemview that provides a container to display the app specified text showing the
 list is empty. If the text is not provided, "No items" is dispalyed by default</p>

**Module: smart/controls/emptylist/emptylist.**

### Example for using SmartControls emptylist view

```js


define(['smart/controls/emptylist/emptylist.view'
], function (SmartEmptyListView) {

  var EmptyListView = SmartEmptyListView.extend({

    constructor: function EmptyListView(options) {
      SmartEmptyListView.prototype.constructor.call(this, options);
    }

  });
  
  return EmptyListView;
});

```

### Parameters

<ul>
  <li><b>text - `optional`(String)</b>Default: "No Items", text to add in the empty list content area.</li>
</ul>

<br>
<br>
