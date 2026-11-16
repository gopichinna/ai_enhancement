# Configuration

## Facet Panel Smart Control​

<p>Facet panel displays a one level tree structure of available facet filters.​</p>

**Module: smart/controls/facet.panel/facet.panel.**

### Example for using SmartControls Facet panel view

```js

define(['smart/controls/facet.panel/facet.panel.view'
], function (SmartFacetPanelView) {
  'use strict';

  var FacetPanelView = SmartFacetPanelView.extend({
    constructor: function FacetPanelView(options) {
      options || (options = {});
      options.data || (options.data = {});
      this.facets = options.collection;
      options.collection = this._getAvailableFacets();
      this.listenTo(this, 'fetch:morefacets', _.bind(this._mycallback, this));
      SmartFacetPanelView.prototype.constructor.call(this, options);
    },

     _mycallback:  function(){
      ...
      ...
    
      });
      
  return FacetPanelView;

});

```
## Parameters

<ul>
  <li><b>collection - `required`</b> (Facet collection)</li>
  <li><b>facetPanelTitle - `optional`</b>Facet panel header title, default is 'Refine by' </li>
  <li><b>itemsToShow - `optional`(Number)</b>Default: 5, if not provided from options, it will get from the model attributes.</li>
  <li><b>showButtonsInEachFacet - `required`(boolean)</b>Default: true, if false the apply and cancel buttons are hidden.<br />This is how leading apps can send it as config parameter:<br />```
  csui.require.config({
    config: {
      "smart/controls/facet.panel/facet.panel.view": {
        showButtonsInEachFacet: false
      }
    }
  });
  ```
  </li>
  <li><b>maxFacetSelection - `optional`(number)</b>Default: 5 (minimum 1), sets max limit for facet selection. When user select items in a facet equals to this number, other items in facet will be disabled.<br />This is how leading apps can send it as config parameter:<br />```
    csui.require.config({
      config: {
        "smart/controls/facet.panel/facet.panel.view": {
          maxFacetSelection: 4
        }
      }
    });
    ```
  </li>
  <li><b>displayCountProps - `optional`(object)</b>Default: true, display count will be showed for admin users irrespective of Dispaly counts setting,where as for non admin users display count will be displayed as per display count settings.</li>
  <li><b>Always </b>'Always' is a default value. Supported Values are: Always, Never, >1, >2, >3 >4, >5, >10, >25,>50,>100. Here '> num' means minimum display count / after which display count will be showed.</li>
</ul>

## Public Methods

<ul>
  <li><b>applyFilter():</b> triggers an event once the filter is selected.</li>
  <li><b>setActiveFacet():</b> Set active facet and disable all others.</li>
  <li><b>fetchFacets():</b> fetch more facets on clicking the show more link</li>
  <li><b>onClearAll():</b> Find all of the checkboxes that are checked and trigger a click event on them so that they will be unchecked.</li>
  <li><b>onSetSingleSelect():</b> for single select hides all the checkboxes, except the selected one</li>
   <li><b>onSetSingleUnSelect():</b> for single select, enable all the checkboxes on unselecting the selected filter.</li>
  <li><b>onSingleFilterSelect():</b> triggers "apply:filter" event on clicking on the name of the filter or selecting the single select checkbox.</li>
  <li><b>onMultiFilterUnSelect():</b> triggers "remove:filter" event on unselecting the checkbox of the filter.</li>
  <li><b>onShowMore():</b> Event handler, called on clicking the showmore link</li>
  <li><b>onShowFacet():</b>  Event handler, called on clicking the collapisible facet header.</li>
  <li><b>onMultiFilterSelect():</b>  Event handler, called on selecting the multiple filters and enables the apply and cancel buttons.</li>
  <li><b>onChangeValue():</b>  Event handler, called on selecting the checkbox.</li>
</ul>

## Events

<ul>
<li><b>request</b> Listening to request event on collection</li>
</ul>

```js
  this.listenTo(this.facets, 'request', this._mycallback);
```
<ul>
<li><b>sync</b> Listening to sync event on collection</li>
</ul>

```js
  this.listenTo(this.facets, 'sync', this._mycallback);
```
<ul>
<li><b>error</b> Listening to error event on collection</li>
</ul>

```js
  this.listenTo(this.facets, 'error', this._mycallback);
```
<ul>
<li><b>refresh:tabindexes</b> An event is triggered after collection is rendered to update the tabindexes</li>
</ul>

```js
  this.trigger("refresh:tabindexes");
```
<ul>
<li><b>apply:filter</b> An event is triggered when multiple filters are selected</li>
</ul>

```js
this.trigger("apply:filter", facet.newFilter);
```
<ul>
<li><b>remove:filter</b> An event is triggered on unselecting the checkbox when the apply and cancel buttons are not shown</li>
</ul>

```js
this.trigger("remove:filter", facet.newFilter);
```
<ul>
<li><b>fetch:morefacets</b> An event is triggered on clicking the show more link</li>
</ul>

```js
this.trigger('fetch:morefacets', childview);
```

