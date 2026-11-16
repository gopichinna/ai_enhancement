# Configuration

## Facet Bar Smart Control​

<p>Marionette view that provides a control with the presentation layer which allows the user to display all applied filters.​</p>

**Module: smart/controls/facet.bar/facet.bar.**

### Example for using SmartControls Facet bar view

```js

define(['smart/controls/facet.bar/facet.bar.view'
], function (SmartFacetBarView) {
  'use strict';

  var FacetBarView = SmartFacetBarView.extend({
    constructor: function FacetPanelView(options) {
      SmartFacetBarView.prototype.constructor.call(this, options);
    },

     _mycallback:  function(){
      ...
      ...
    
      });
      
  return FacetBarView;

});

```
## Parameters

<ul>
  <li><b>collection - `required`</b> Backbone collection or collection of facets inherited from `FacetCollection` provided by "csui/models/facets".</li>
  <li><b>scrollableParentEle - `required`</b>container element with which facet dropdown height is calculated and scroll will be applied </li>
</ul>

## Public Methods

<ul>
  <li><b>applyFilter():</b> triggers an event once the filter is selected.</li>
  <li><b>onRemoveFilter():</b> triggers an event to remove the filter with the filter data.</li>
  <li><b>onClearAll():</b>triggers an event to remove all the applied filters.</li>
</ul>

## Events

<ul>
<li>
  <p><b>facet:bar:hidden</b> Triggered when the facetbar is empty</p>
  <p>

    ```js

      this.listenTo(this, "facet:bar:hidden", this._mycallback);

    ```
  </p>
</li>
<li>
  <p><b>filters:updated</b> Triggered when the facetbar collection is reset</p>
  <p>

    ```js

      this.listenTo(this, "filters:updated", this._mycallback);

    ```
  </p>
</li>
<li>
  <p><b>remove:filter</b> Triggered when a single selected facet topic is to be removed</p>
  <p>

    ```js

    this.listenTo(this, "remove:filter", this._mycallback);

    ```
  </p>
</li>
<li>
  <p><b>remove:all</b> Triggered when clicking on clear all button to remove  all the selected facet topics</p>
  <p>

  ```js

    this.listenTo(this, "remove:all", this._mycallback);
    
  ```
  </p>
</li>
</ul>
