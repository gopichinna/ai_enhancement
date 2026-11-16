## Simple ListView View Smart Control​

<p>Marionette view that provides a header which has a configurable icon and title, along with a back button.​</p>

**Module: smart/controls/list/simplelist.view.**

### Example for using SmartControls Simple List view

```js

define(['smart/controls/list/simplelist.view'], function (SmartSimpleListView) {

 var ExtendedSimpleListView = SmartSimpleListView.extend({
  constructor: function ExtendedSimpleListView(options) {
    options || (options = {});
    ....
    SmartSimpleListView.prototype.constructor.apply(this, arguments);
  },

  TabableRegion: {
    behaviorClass: TabableRegionBehavior
  },

 });
});
```
<p><strong>Note:</strong> Do not provide ListViewKeyboardBehavior to simple list view as it has its own functionality to handle keyboard navigation. Otherwise due to function definition conflicts between two, KN may not work.</P>

### Parameters

<ul>
  <li><b>data - `required`</b> Object with information for the simple list that is to be rendered.</li>
  <li><b>data.title - `required` (String)</b> Title for the simple list view that is displayed on the header.</li>
  <li><b>data.titleBarIcon - `optional` (String)</b> Icon class name for the icon that is to be shown on the header.</li>
  <li><b>data.back_button - `optional` (Boolean)</b> To show Back button on header. Default: 'false'</li>
  <li><b>data.iconName - `optional` (String)</b> name of V2 to be shown on header.</li>
  <li><b>data.listAria - `required` (String)</b>Aria label for list view. Default: "List View"</li>
  <li><b>data.listRole - `optional` (String)</b>Role for list view. Deafault: 'list'.</li>
  <li><b>data.childRole - `optional` (String)</b>Role for list item view. Deafault: 'listitem'.</li>
  <li><b>data.items - `optional`(Collection)</b>Collection of list item models that is shown within the simple list view. Empty View if shown if collection is given.</li>
   <li><b>items.name - `optional`(String)</b>Name of the item.</li>
  <li><b>items.href - `optional`(Collection)</b>URL for the item.</li>
   <li><b>items.enableIcon - `optional`(Boolean)</b>To show icon or no.</li>
  <li><b>items.icon - `optional`(String)</b>Icon class name that is displayed before the title of the icon.</li>
  <li><b>items.iconName - `optional`(String)</b>V2 icon name that is displayed before the title of the icon.</li>
</ul>

### Events

<ul>
<li><b>click:header</b> An event triggered when header is clicked.</li>
</ul>

```js
this.listenTo(this, "click:header", this._mycallback);
```

<ul>
<li><b>model:update</b> An event triggered when model needs to be updated.</li>
</ul>

```js
this.listenTo(this, "model:update", this._mycallback);
```

<ul>
<li><b>click:item</b> An event triggered when item is clicked.</li>
</ul>

```js
this.listenTo(this, '"click:item', this._mycallback);
```

<ul>
<li><b>set:css</b> An event triggered when item is clicked and css has to be set.</li>
</ul>

```js
this.listenTo(this, "set:css", this._mycallback);
```

<ul>
<li><b>click:back</b> An event triggered when back button is clicked.</li>
</ul>

```js
this.listenTo(this, "click:back", this._mycallback);
```

<ul>
<li><b>on:child:view:render</b> An event triggered when child view is rendered.</li>
</ul>

```js
this.listenTo(this, "on:child:view:render", this._mycallback);
```

<br>
<br>
