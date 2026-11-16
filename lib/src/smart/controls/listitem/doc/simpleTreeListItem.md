## SimpleTreeList Item View Smart Control​

<p>Marionette view that allows the user to display the items at two levels based on child collection passed. Users need to pass a backbone model with details about the group along with the child collection. Each level can be flatten based on the configuration provided by the user. They can also configure icon view and more actions for single item.</p>

**Module: smart/controls/listitem/simpletreelistitem.view.**

### Example for using SmartControls StandardListItem view

```js

define(['smart/controls/listitem/simpletreelistitem.view'], function (SimpleTreeListView) {

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
    },
    getElementByIndex: function (){
      .....
    }
  });
  ....
});
```

### Parameters

<ul>
  <li><b>model - `required`</b> Backbone model with item information.</li>
  <li><b>model.enableIcon - `optional`</b> Flag to decide to show icon or not. Default : false.</li>
  <li><b>model.expand - `optional`</b> Flag to render tree item as expanded. Default : false.</li>
  <li><b>model.flatten - `optional`</b> Flag to decide to render tree as a group or no. Default : false.</li>
  <li><b>model.childrenCollection - `Backbone Collection`</b>Backbone collection of child items with parent id.</li>
  <li><b>toolbarData - `optional` (Object)</b> toolbaritems info that is shown in inline menu.</li>
  <li><b>refetchNodeActions - `optional` (Boolean)</b> To set flag in model.</li>
  <li><b>checkDefaultAction - `optional` (Boolean)</b> To check default action of model.</li>
  <li><b>childRole - `optional` (String)</b> Role for item element.</li>
  <li><b>getInlinMenuView - `optional` (Function)</b>Function that returns inline menu view that is to be shown.</li>
  <li><b>getIconView - `optional` (Function)</b>Function that returns icon view that is to be shown.</li>
</ul>

### Events

<ul>
<li><b>click:item</b> An event triggered when item is clicked.</li>
</ul>

```js
this.listenTo(this, "click:item", this._mycallback);
```

<ul>
<li><b>click:tree:header</b> An event triggered when list header is clicked.</li>
</ul>

```js
this.listenTo(this, "click:tree:header", this._mycallback);
```

<ul>
<li><b>click:tree:item</b> An event triggered when item is clicked.</li>
</ul>

```js
this.listenTo(this, '"click:tree:item', this._mycallback);
```

<ul>
<li><b>before:execute:command</b> An event triggered when before:execute:command is triggered for inline menu.</li>
</ul>

```js
this.listenTo(this, "before:execute:command", this._mycallback);
```

<ul>
<li><b>after:execute:command</b> An event triggered when after:execute:command is triggered for inline menu.</li>
</ul>

```js
this.inlineMenu.trigger(this, "after:execute:command", this._mycallback);
```

<br>
<br>
