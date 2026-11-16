# Configuration

## BreadCrumbCollectionView

<p>Marionette Collection view that provides a view to display current location of the page rendered
  within a navigational hierarchy to access the parent locaions.</p>

### Example for using SmartControls Breadcrumbs view

```js
....
....
define(['smart/controls/breadcrumbs/breadcrumbs.view'], function (SmartBreadcrumbsView) {
 var BreadCrumbCollectionView = SmartBreadcrumbsView.extend({
    constructor: function BreadcrumbCollectionView(options) {
      SmartBreadcrumbsView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'before:synchronized', this._myBeforeSyncCallback));
      this.listenTo(this, 'childview:click:ancestor', this._myClickAncestorcallback);
      this.listenTo(this, 'childview:click:home:ancestor', this._myClickHomeAncestorcallback);
    },

    refresh: function(){
      ...
      this.trigger("readjust:breadcrumbs");
      ...
    },

    _myBeforeSyncCallback:  function(){
      ...
      this.trigger("sync:collection");
      ...
    },

    _myClickAncestorcallback:  function(){
      ...
      // handle ancestor click functionality
      ...
    },

    _myClickHomeAncestorcallback:  function(){
      ...
      // handle "home" ancestor click functionality
      ...
    }

 });
....
....
```

## Parameters

<ul>
  <li><b>collection - `required` (Backbone collection)</b> Simplified node model schema.</li>
  <li><b>fetchOnCollectionUpdate - `optional`( Boolean)</b> To prevent the control from an extra
    fetching of the collection.
  </li>
  <li><b>stop - `optional` (Backbone Model)</b> Node model of breadcrumb till where breadcrumbs need to be removed</li>
  <li><b>theme - `optional` (String)</b> Default light theme applies. Supported themes are dark/light only.</li>
  <li><b>honorCustomizations - `optional` (Boolean)</b> Default false. When this option is enabled, then
  the customization changes on breadcrumbs will be enabled.
  .</li>
  <li><b>textColor - `optional` (String)</b> Leading application needs to provide this. If not provided, default value <b>white</b> will be applied in dark theme.</li>
  <li><b>textColorForLastItem - `optional` (String)</b> Leading application needs to provide this. If not provided, "textColor" will be considered as "default value". If "textColor" also not provided, it will consider CSS specificity to provide color of last item.</li>
  <li><b>enableHome - `optional` (Boolean)</b> Default false. When this option is enabled, then
  home icon will be present at beginning of the breadcrumbs.
  .</li>
</ul>

## Public Methods

<ul>
  <li><b>isTabable():</b> Checks if element is tabable region or not. Returns boolean variable.</li>
  <li><b>currentlyFocusedElement():</b> Checks element that is currently focused which is tabable.
  </li>
  <li><b>onKeyInView():</b> Performs keyboard navigation according to key event and updates the
    currently focused element.
  </li>
  <li><b>refresh():</b> Reloads breadcrumb view and adjusts width according to available width.</li>
  <li><b>onChildviewClickAncestor():</b> Triggers event `click:ancestor` which needs to be listened
    in respective view and perform action.
  </li>
  <li><b>onChildviewClickHomeAncestor():</b> Triggers event `click:home:ancestor` which needs to be
  listened this `home` ancestor link click in respective view and perform action.
  </li>
</ul>


## Events

<ul>
<li><b>click:ancestor</b> An event registered that is to be triggered when an ancestor node is clicked</li>
</ul>

```js
this.listenTo(this.breadCrumbsView, "childview:click:ancestor", this._mycallback);
```

<ul>
<li><b>click:home:ancestor</b> An event registered that is to be triggered when a "home" ancestor
link is clicked</li>
</ul>

```js
this.listenTo(this.breadCrumbsView, "childview:click:home:ancestor", this._myHomeClickCallback);
```

<ul>
<li><b>before:synchronized</b> An event registered that is to be triggered when collection needs to be updated. For example, if leading application wants to give specific urls for each breadcrumb, or if home option ("enableHome") is enabled, then leading application can change required attributes in that "home" model as they wish, etc.,</li>
</ul>

```js
this.listenTo(this.breadCrumbsView, "before:synchronized", this._mycallback);
```

<ul>
<li><b>readjust:breadcrumbs</b> An event to be triggered when breadcrumbs needs to be adjusted </li>
</ul>

```js
this.breadCrumbsView.trigger("readjust:breadcrumbs");
```

<ul>
<li><b>sync:collection</b> An event to be triggered when breadcrumbs collection needs to be snychronized. Options: (Boolean) </li>
</ul>

```js
this.breadCrumbsView.trigger("sync:collection",true);
```
