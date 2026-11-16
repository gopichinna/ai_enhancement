## SimpleTreeList View Smart Control​

<p>Marionette view that renders group of simple tree item views.</p>

**Module: smart/controls/list/simpletreelist.view.**

### Example for using SmartControls SimpleTreeList view

```js

define(['smart/controls/list/simpletreelist.view'], function (SimpleTreeListView) {

 var ExtendedSimpleListView = SmartListView.extend({
  constructor: function ExtendedSimpleListView(options) {
    options || (options = {});
    ....
    SmartListView.prototype.constructor.apply(this, arguments);
  },
  childView: SmartStandardListItem,

  childViewOptions: function () {
      ...
      return {
         ...
         toolbarData: toolbarData,
         getIconView: function () {
           return ....;
         }
       };
    }
  });
  ....
});
```

### Parameters

<ul>
  <li><b>model - `required`</b> Backbone model with item information.</li>
  <li><b>toolbarData - `optional` (Object)</b> toolbaritems info that is shown in inline menu.</li>
  <li><b>refetchNodeActions - `optional` (Boolean)</b> To set flag in model.</li>
  <li><b>checkDefaultAction - `optional` (Boolean)</b> To check default action of model.</li>
  <li><b>childRole - `optional` (String)</b> Role for item element.</li>
</ul>

### Events

<ul>
<li><b>click:item</b> An event triggered when item is clicked.</li>
</ul>

```js
this.listenTo(this, '"click:item', this._mycallback);
```

<br>
<br>
