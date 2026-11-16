## List View Smart Control​

<p>Marionette view that provides a presentation layer for the list view.
  The list provides a header which has a configurable icon and title, along with a search icon.
  Clicking the search icon opens a search field replacing the header title. When text is entered in the search field
  a search is performed on the list items, eventually reducing their number. Clearing the search field shows the complete list again, as does closing the search field by clicking on the search icon again.​</p>

**Module: smart/controls/list/list.view.**

### Example for using SmartControls List view

```js

define(['smart/controls/list/list.view'], function (SmartListView) {

 var ExtendedListView = SmartListView.extend({
  constructor: function ExtendedListView(options) {
    options || (options = {});
    ....
    SmartListView.prototype.constructor.apply(this, arguments);
  },

  childEvents: {
   ...
  },

  childView: ListItem,

  childViewOptions: {
    templateHelpers: function () {
      return {
       ...
      };
    },
  },

  behaviors: {
    ExpandableList: {
      ...
    },
    DefaultAction: {
      behaviorClass: DefaultActionBehavior,
    },
    TabableRegion: {
      behaviorClass: TabableRegionBehavior,
    },
    ListViewKeyboardBehavior: {
      behaviorClass: ListViewKeyboardBehavior,
    },
  },

   getElementByIndex: function (){
    // if leading application had any different target element they can pass 'customEle' as an option.
    // if they have custom logic to return their own element or a different child view other then
    // list item standard view, leading application need to override this method.
      .....
    }

 });
});
```

### Custom background image for SmartControls list view

Users need to add the following styling to obtain custom empty list background image for their list view.

```css
.cs-list <<classname>>.cs-emptylist-container:not(.csui-state-loading) {
  background-image: <<custom-width>>;
}
```

### Parameters

<ul>
  <li><b>data - `required`</b> Object with information for the list that is to be rendered.</li>
  <li><b>data.title - `required` (String)</b> Title for the list view that is displayed on the header.</li>
  <li><b>data.titleBarIcon - `optional` (String)</b> Icon name for the icon that is to be shown on the header.</li>
  <li><b>theme - `optional` (String)</b> Theme for the list view 'standard' or 'light'. Default: 'standard'</li>
  <li><b>_enableOpenPerspective - `optional` (Boolean)</b> To show expand icon on header pass true. Default: false</li>
  <li><b>hideSearch - `optional` (Boolean)</b>The search icon can be hidden from the view by adding a 'hideSearch: true' parameter to the templateHelpers function. </li>
  <li><b>searchPlaceholder - `optional` (String)</b>Placeholder that is shown in input box.</li>
  <li><b>customEle - `optional`(String)</b>Custom ele passed for first element on list for KN. Ex: 'div.csui-item-standard:nth-child({0})'</li>
</ul>

### Events

<ul>
<li><b>click:header</b> An event triggered when header is clicked.</li>
</ul>

```js
this.listenTo(this, "click:header", this._mycallback);
```

<ul>
<li><b>click:open:perspective</b> An event triggered when open perspective button is clicked.</li>
</ul>

```js
this.listenTo(this, "click:open:perspective", this._mycallback);
```
<ul>
<li><b>click:tile:expand</b> An event triggered when expand button is clicked.</li>
</ul>

```js
this.listenTo(this, "click:tile:expand", this._mycallback);
```

<ul>
<li><b>change:filterValue</b> An event triggered when input in search input in changed.</li>
</ul>

```js
this.listenTo(this, "change:filterValue", this._mycallback);
```

### Using behaviors with List View

ListViewKeyboardBehavior, InfiniteScrollingBehavior, CollectionStateBehavior, CollectionErrorBehavior can be used by extending Smart List View in following manner:

```js

define(["nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette",
  'smart/behaviors/keyboard.navigation/smart.tabables.behavior',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'smart/controls/list/behaviors/list.view.keyboard.behavior',
  'smart/controls/list/list.view',
  "smart/behaviors/infinite.scrolling/infinite.scrolling.behavior",
  'smart/behaviors/collection.state/collection.state.behavior',
  'smart/behaviors/collection.error/collection.error.behavior',
  'smart/controls/emptylist/emptylist.view',
  'smart/controls/progressblocker/blocker'], function ($, _, Backbone, Marionette,
    TabablesBehavior,
    TabableRegionBehavior,
    ListViewKeyboardBehavior,
    ListView,
    InfiniteScrollingBehavior,
    CollectionStateBehavior,
    CollectionErrorBehavior,
    EmptyListView,
    BlockingView) {
  let extendedListView = ListView.extend({
    constructor: function ExtendedListView(options) {
      this.collection = new Backbone.Collection();
      this.behaviors = _.extend(this.behaviors, {
        InfiniteScrolling: {
          behaviorClass: InfiniteScrollingBehavior,
          contentParent: ".tile-content"
        },
        CollectionState: {
          behaviorClass: CollectionStateBehavior,
          collection: function () {
            return this.collection;
          },
          stateView: EmptyListView,
        },
        CollectionError: {
          behaviorClass: CollectionErrorBehavior
        }
      });
      ListView.prototype.constructor.call(this, options);
      /*To use blocking view during different states of collection*/
      BlockingView.imbue(this);
      this.listenTo(this.collection, "request", _.bind(function () {
        this.blockActions();
      }, this));
      this.listenTo(this.collection, "sync error", _.bind(function () {
        this.unblockActions();
      }, this));
      this.listenTo(this, "collection:scroll:fetch", _.bind(function () {
        this.unblockActions();
      }, this));
    },

    childView: new Marionette.Veiw(),
    childViewOptions: function () {...},

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      }
    },

    onRender: function () {
      ListView.prototype.onRender.apply(this, arguments);
      var that = this;
      that.collection.reset();
      that.collection.trigger("request");
      fetch(url)
        .then((response) => {
          return response.json();
        })
        .then(res => {
          that.collection.reset();
          that.collection.add(res);
          _.extend(this.collection, {
            actualSkipCount: 0,
            skipCount: 0,
            totalCount: res.total,
            /*Dummy set skip, which should be part of collection*/
            setSkip: function (skip, fetch) {...},
            /*Dummy fetch, which should be part of collection*/
            fetch: function (options) {...}
          });
          that.collection.trigger("sync");
        })
        .catch(error => {
          that.collection.error = error;
          that.collection.trigger("error");
        });
    }
  });
});

```
<ul>
  <li>ListViewKeyboardBehavior : To handle keyboard navigation in list view</li>
  <li>InfiniteScrollingBehavior : To fetch next set of list items when scrollbar reaches near bottom of list items content view</li>
  <li>CollectionStateBehavior : Renders different views for different states of collection</li>
  <li>CollectionErrorBehavior : Renders error view on collection error state</li>
</ul>

<br>
<br>
