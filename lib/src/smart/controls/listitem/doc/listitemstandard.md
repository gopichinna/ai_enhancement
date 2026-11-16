## StandardListItem View Smart Control​

<p> The StandardListItem provides a simple list item, to be used in [ListView](#),
  which comprises an icon, a text and a place holder for inline menu. Both icon and text are configurable and usually set by the list.
  If the text ist too long for the available space, it is cut off and provided with ellipsis. When
  clicked, the item throws an event 'click:item'.​</p>

**Module: smart/controls/listitem/listitemstandard.view.**

### Example for using SmartControls StandardListItem view

```js

define(['smart/controls/listitem/listitemstandard.view'], function (SmartStandardListItem) {

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
         getInlinMenuView: function () {
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
  <li><b>getInlinMenuView - `optional` (Function)</b>Function that returns inline menu view that is to be shown.</li>
</ul>

### Events

<ul>
<li><b>render:icon</b> An event triggered to render icon view in the element passed.</li>
</ul>

```js
this.listenTo(this, "render:icon", this._mycallback);
```

<ul>
<li><b>click:item</b> An event triggered when item is clicked.</li>
</ul>

```js
this.listenTo(this, '"click:item', this._mycallback);
```

<ul>
<li><b>before:execute:command</b> An event triggered when before:execute:command is triggered for inline menu.</li>
</ul>

```js
this.listenTo(this, "before:execute:command", this._mycallback);
```
<br>
<br>
