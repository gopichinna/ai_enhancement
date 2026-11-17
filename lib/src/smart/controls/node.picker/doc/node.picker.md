# Configuration

## Node Picker Smart Control​

<p>Marionette collection that provides a modal window or a screen which allows the user to select one or more objects or containers from within the system.​</p>

**Module: smart/controls/node.picker/node.picker.**

### Example for using SmartControls Node Picker view

```js

define(["nuc/lib/underscore", "nuc/lib/marionette",
        "smart/controls/node.picker/node.picker"
], function (_, {Region}, NodePicker) {
  'use strict';
          nodePicker = new NodePicker({
          connector: options.getConnector(),
          context: options?.context,
          dialogTitle: options?.dialogTitle,
          defaultMode: options?.defaultMode, 
          initialContainer: options?.initialContainer,
          selectableTypes: options?.selectableTypes,
          unselectableTypes: options?.unselectableTypes,
          selectMultiple: options?.selectMultiple,
          selectButtonLabel: options?.selectButtonLabel,
          initialContainerType: options?.initialContainerType,
          getInitalContainer: options?.getInitalContainer,
          propertiesSeletor: options?.propertiesSeletor,
          nodeIndicators: options?.nodeIndicators,
          applyPropertiesOptions: [
            {
              id: propertiesSelectormap.KEEP_ORIGINAL_PROPERTIES,
              name: lang.KeepOriginalProperties
            },
            {
              id: propertiesSelectormap.APPLY_DESTINATION_PROPERTIES,
              name: lang.ApplyDestinationProperties
            },
            {
              id: propertiesSelectormap.COMBINE_ALL_PROPERTIES,
              name: lang.CombineAllProperties
            }
          ],
          defaultPropertySelector: propertiesSelectormap.KEEP_ORIGINAL_PROPERTIES,
          locationSelector: options?.locationSelector,
          startLocation: options?.startLocation,
          startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
            'favorites', 'recent.containers'],
          globalMessage: options?.globalMessage,
          showBreadCrumbs: options?.showBreadCrumbs,
          showSelectedCount: options?.showSelectedCount,
          addableTypes: options?.addableTypes,
          getLocations: NodePicker.prototype.getLocations,
          getAncestorsCollection: NodePicker.prototype.getAncestorsCollection,
          onClickAncestor: NodePicker.prototype.onClickAncestor,
          fetchContainer: NodePicker.prototype.fetchContainer,
          fetchCollection: NodePicker.prototype.fetchCollection,
          getViewOptions: NodePicker.prototype.getViewOptions,
          resetCollStartPosition: NodePicker.prototype.resetCollStartPosition,
          selectViewRefresh: NodePicker.prototype.selectViewRefresh,
          fetchCollectionOnScroll: NodePicker.prototype.fetchCollectionOnScroll,
          getNodeTypeIconView: NodePicker.prototype.getNodeTypeIconView,
          getAddableTypes: NodePicker.prototype.getAddableTypes,
          showTargetLocationName: options?.showTargetLocationName
          requestLazyAddableTpes: options?.requestLazyAddableTpes
          showCustomInlineForm: options?.showCustomInlineForm,
          hasTableToolbarView: options?.hasTableToolbarView,
          initializeToolbar: NodePicker.prototype.getNodeTypeIconView
        });
        nodePicker.show();

      }
  );

```

In order to render node indicator icons, file that returns an object with node indicator icons needs to be added in \*-extensions.json file for 'smart/controls/node.picker/indicator/node.indicator.icons'.

```js
....
....
    csui.require.config({
      config: {
        "smart/controls/node.picker/indicator/node.indicator.icons": {
          extensions: {
            greetings: [
              "greetings/controls/node.picker/indicator/greetings.node.indicator.icons"
            ],
          },
        },
      },
    });
....
....
```

Such that from "greetings.node.indicator.icons" extension point, leading application can decide to enable this indicator icon or not based on the options provided in enabled method as shown below

```js
....
....
    define(['i18n!greetings/controls/node.picker/indicator/nls/lang'], function (lang) {
      "use strict";
      return [
        {
          sequence: 250,
          otcIconName: "action:action_share32",
          enabled: function (opts) {
            // custom logic by leading application
          },
          title: lang.sharedTitle || function (opts) {
            // custom logic by leading application
          },
          ariaLabel: lang.sharedAriaLabel || function (opts) {
            // custom logic by leading application
          }
        },
      ];
    });
....
....
```

## Parameters

<ul>
  <li><b>context - `optional`</b> Application context (it can provide connector and current location).</li>
  <li><b>connector - `optional`</b> Provides the server connection (can be passed by context or container).</li>
  <li><b>dialogTitle - (string)</b> Text to show in the dialog caption.</li>
  <li><b>defaultMode  - (string)</b> Default mode is list, Supported modes are list and grid</li>
  <li><b>selectMultiple - `optional`(boolean)</b> Default: false, Enables selecting more than a single item.</li>
  <li><b>showSelectedCount - `optional`(boolean)</b> Default: true,  Boolean value that determines whether to show count of the selected values when selectMultiple is enabled.</li>
  <li><b>globalSearch - `optional`(boolean)</b> Default: false, Boolean value to detemine whether to show global search or not.</li>
  <li><b>locationSelector - `optional`(boolean)</b> Default: false, Boolean value that determines to show the locations dropdown.</li>
  <li><b>startLocation - (string)</b> Id of the start location when target browser opens (`current.location`,
`recent.containers`, `favorites`, `enterprise.volume`, `personal.volume`, `perspective.assets.volume`). If startLocation
is provided and valid, the target browser will start at the specified location, else it uses the intialContainer location or next location specified in the location rules.</li>
  <li><b>showBreadCrumbs - `optional`(boolean)</b> Default: true,  Boolean value that determines whether to show Breadcrumbs or not.</li>
  <li><b>selectableTypes - </b> Default: empty,  List of object types to show and thus make selectable (array of integers).</li>
  <li><b>unSelectableTypes - </b> Default: empty,  List of object types to make un-selectable (array of integers).</li>
  <li><b>showAllTypes - `optional`(boolean)</b> Default: false, to show all container items whether selectable or not. Only the items that match the provided "selectableTypes" will be enabled for selection.</li>
  <li><b>initialSelection - </b> Default: empty, List of nodes to pre-select when the picker is opened (array of object literals or node models).</li>
  <li><b>initialContainer - </b> Default: empty, Container to start looking for the node to select in (object literal or node
  model).</li>
  <li><b>propertiesSeletor - `optional`(boolean)</b> Default: false,  Boolean value that determines if an option to set source properties should be provided.</li>
  <li><b>applyPropertiesOptions - `optional`(Array of objects)</b> Default: [], List which will be shown for category prefereces selection dropdown. Leading applications must pass empty array if no options to be shown under dropdown, otherwise default options will be available.</li>
  <li><b>defaultPropertySelector - `optional`(any)</b> Default: id of first item in `ApplyPropertiesOptions`. Id which detemines the default selection under category prefereces selection.</li>
  <li><b>hideOpenPropertiesPage - `optional`(boolean)</b> Default: false, Boolean value that determines whether to hide `Opent properties page` menu item in category preferences dropdown.</li>
  <li><b>selectButtonLabel - (string)</b> Text to display on the action button.</li>
  <li><b>orderBy - </b> Indicates the order content is to be sorted. Default sort order is by 'name'
in ascending order.</li>
 <li><b>command - `optional`(String)</b> command type (like copy, move etc.) set various parameters and perform actions based on command type.</li>
  <li><b>resolveShortcuts - `optional`(Boolean).</b> Default false. Used for resolving shortcut nodes to their original nodes. Also used to validate nodes and disables if `resolveShortcuts` is true and Node model doesn't have original.</li>
  <li><b>resultOriginalNode - `optional`(Boolean)</b> Default false. Gets original node on selection if selected node model has original.</li>
  <li><b>disableSearchFromHere - `optional`(Boolean)</b> Default: false. Boolean value to disable search from here in global search.</li>
  <li><b>includeResources - `optional`(Array of strings)</b>Default [] One or more resources to be included in NodeChildren2Collection Yes No - optional, ex. includeResources: ["show_hidden"].</li>
  <li><b>unSelectableNodes - `optional`(Array of Nodes)</b> Default []. Array of Nodes to be marked as unselectable.</li>
  <li><b>saveFilter  - `optional`(Boolean) </b>Default false. To enable text box control to save filters as.</li>
  <li><b>initialFilter - `optional`(String)</b> Default empty string. Initial value for save filter text box.</li>
  <li><b>nodeIndicators - `optional`(Boolean)</b> Default false. Boolean value determines whether node indicator icons needed to be displayed along with items.</li>
  <li><b>multilingualPopoverMixin - `optional`</b> MultilingualPopoverMixin to be used with multilingual text field. `Mandatory` if multilingual data is enabled.</li>
  <li><b>addableTypes - `optional`</b> Default empty. List of addable types which can be added to the specified container. Eg: {type: 0, type_name: 'Folder'}</li>
   <li><b>breadcrumb - `optional`</b> Default empty. Options which can be passed to Smartcontrol's Breadcrumb. <br />Eg:  {collection: collection, stop: { 'id': 26841} }</li>
   <li><b>showTargetLocationName - `optional`</b>Default false. Boolean value to show selected target location name in the header.</li>
   <li><b>hasTableToolbarView - `optional`</b>Default false. Boolean value to show custom addabletypes dropdown and tool items.</li>
   <li><b>headerInputAria - `optional`</b>Screenreader text for the input field in the nodepicker header.</li>
</ul>

## Node Indicator icon Extensions Options

<ul>
  <li><b>Sequence - `required`(Integer)</b> Number for determining the sequence of icons</li>
  <li><b>otcIconName - `required`(String)</b> String of the ot-icon which will be a node indicator icon. <b>Smart Controls 
  Node Picker only supports ot-icons as node indicator icons</b></li>
  <li><b>enabled - `optional`(Function)</b> Function that returns whether enabled or not</li>
  <li><b>title - `optional`(Function/String)</b> Function/String which determines the title of that icon</li>
  <li><b>ariaLabel - `optional`(Function/String)</b> Function/String which determines the aria label of that icon</li>
</ul>

## TreeView

<p>A generic view(node.tree.list.view.js) to display the provided collection in tree view representation. Leading application need to provide the required collection in the group format please refer _synchronizeCollections() in ​node.tree.list.view.js. Also a boolean flag by name "isTreeView" need to be passed , which will decide to represent the collection either in tree/list view.</p>

#### Example:
  For favorites view:

```js
....
....
    getLocationParameters: function (options) {
      var favorites = new GroupsCollection(undefined, {
        connector: this.options.connector,
        autoreset: true,
        // TODO:  This will not be enough for the consumer.  How to work
        // around the skinflint in the REST API?
        expand: ['node'],
        ...options
      });
      return {
        container: null,
        collection: favorites,
        locationName: "Favorites",
        groupsLocationName: "favorites",
        isTreeView: true,
        groupsCollection: favorites.groupsCollection,
        groupIconName: "smart_mime_fav_group32"
      };
    }
....
....
```

#### Options for treeView:

<ul>
  <li><b>groupsCollection - `required`</b> Collection of group along with its children</li>
  <li><b>isTreeView - `required`(Boolean)</b> Boolen value which decides the representation of data in treeView if true, in nodelist view if false.</li>
  <li><b>groupsLocationName - `required`(string)</b> group collection location name</li>
  <li><b>groupIcon - `required`(string)</b> group icon name</li>
</ul>

## Leading application provided functions via options

<p> The following methods need to be provided through options by extending the nodepicker prototype:</p>
<ul>
  <li><b>getNodeTypeIconView():</b> Returns a NodeTypeIconView, which renders the mimetype icons.

#### Example:

```js
  getNodeTypeIconView: function (iconViewOptions) {
    return new NodeTypeIconView(iconViewOptions);
  }
```

  </li>

  <li><b>getConnector():</b> Function checks for container or nodes exists and returns a connector.

#### Example:

```js
    getConnector: function (options) {
   var connector;

   if (options.context) {
     connector = options.context.getObject(ConnectorFactory);
   } else if (options.initialSelection || options.initialContainer) {
     var initialSelection = options.initialSelection,
       nodes = initialSelection
         ? _.isArray(initialSelection)
           ? initialSelection
           : initialSelection.models
         : undefined,
       node = options.initialContainer || nodes[0];
     connector = node && node.connector;
   }

   return connector;
 }
```

  </li>

  <li><b>getLocations():</b> Leading application must provide this function which sets this._loations, this function must return a promise.

#### Example:

```js
getLocations: function (options) {
   this._locations = new StartLocationCollection(this.options);
   return this._locations
     .fetch({
       connector: this.options.connector,
       container: this.options.initialContainer,
       removeInvalid: false,
     });
 }
```

  </li>

  <li><b>getInitalContainer():</b> Returns/ constructs an inital container.

#### Example:

```js
getInitalContainer: function (options) {
   var container = options.initialContainer;

   if (container == null || _.isEmpty(container)) {
     var node = options.context && options.context.getModel(NodeModelFactory);
     if (node != null && node.parent != null && node.parent.isFetchable()) {
       if (node.parent.get("id") === 1 || node.get("container")) {
         container = node.clone();
       } else {
         container = node.parent.clone();
       }
     } else {
       container = null;
     }
   } else if (!(container instanceof Backbone.Model)) {
     container = new NodeModel(container, {connector: options.connector});
   }

   return container;
 }
```

  </li>

  <li><b>getAncestorsCollection():</b> Returns breadcrumbs ancestorcollection of given nodeid.

#### Example:

```js
 getAncestorsCollection: function (nodeId) {
    var node            = new NodeModel({id: nodeId}, {connector: this.connector}),
        ancestorOptions = {node: node, autofetch: true},
        newAncestors    = new NodeAncestorCollection(undefined, ancestorOptions),
        nodeInfo = {node: node, ancestorColl: newAncestors};
     return nodeInfo;
  }
```

  </li>

  <li><b>onClickAncestor():</b> Callback method that need to be executed on clicking the ancestor breadcrumb.

#### Example:

```js
onClickAncestor: function (model, node) {
   var context = this.context = this.options.context;
   this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);

   var args = {node: node};
   this.trigger('before:defaultAction', args);
   if (!args.cancel) {
     var nodeId = node.get('id');
     if (this._nextNode.get('id') === nodeId) {
       // when id is same as nextNode's id, nextNode.set(id) event is not triggered
       this._nextNode.unset('id', {silent: true});
     }

     var viewStateModel = this.context && this.context.viewStateModel;
     var viewState = viewStateModel && viewStateModel.get('state');
     if (viewState) {
       this.context.viewStateModel.set('state', _.omit(viewState, 'filter'), {silent: true});
     }

     this._nextNode.trigger('before:change:id', node, this);
     this._nextNode.set('id', nodeId);
   }

   this.$el.trigger('setCurrentTabFocus');
 }
```

  </li>

   <li><b>fetchContainer():</b> Ensures that the container of left/right view is fetched.

#### Example:

```js
  fetchContainer: function (view) {
    if (view.container && view.container.get("id")) {
      view.container.ensureFetched();
    }
    return true;
  }
```

   </li>

  <li><b>fetchCollection():</b> Fetch the collection of left/right view.

#### Example:

```js
   fetchCollection: function (view) {
   view.collection.setOrder(this.orderBy, false);
   view.collection.setFilter({type: this.listTypes}, false);
   view.collection.setLimit(0, this.pageSize || view.options.pageSize, false);
   view.collection.includeResources && view.collection.includeResources(this.includeResources);

   var deferred = $.Deferred(), self = this;
   var promise = view.collection.fetch({reset: false, merge: false, remove: false});
   promise.done(function (result) {
     view.listView.resolveShortcuts(view.collection).always(function () {
       deferred.resolve(view.collection);
     });
   }).fail(function (resp) {
     deferred.reject(resp);
   });

   return deferred;
 }
```

  </li>

  <li><b>getViewOptions():</b> Returns the  container, collection info to fetch.

#### Example:

```js
getViewOptions: function (nodeOrId, connector) {
   var isNode     = nodeOrId instanceof Backbone.Model,
       node       = isNode ? nodeOrId : new NodeModel({id: nodeOrId}, {connector: connector}),
       collection = new NodeChildren2Collection(undefined, {
         node: node,
         autofetch: true,
         orderBy: this.orderBy,
         // TODO:  This will not be enough for the consumer.  How to work
         // around the skinflint in the REST API?
         expand: {
           properties: ['original_id', 'parent_id']
         },
         fields: {
           properties: []
         },
         commands: 'default,open',
         includeResources:['show_hidden']
       });

   return {container: node, collection: collection, fetchContainer: !isNode};
 }
```

  </li>

  <li><b>resetCollStartPosition():</b> Fetches the Collections based on search query.

#### Example:

```js
  resetCollStartPosition: function (selectView, searchInfo) {
     selectView.collection.setLimit(0, selectView.pageSize, false);
     selectView.collection.setFilter(searchInfo, false);
     selectView.collection.fetch({ reset: true }).fail(function (resp) {
      selectView.listView.stopBlocker();
      selectView.trigger("search:failed", { resp: resp, view: selectView });
      });
      selectView.listView.reset();
    }
```

  </li>

  <li><b>fetchCollectionOnScroll():</b> Fetch Collection on scroll based on collection length.
  
  #### Example:

```js
  fetchCollectionOnScroll: function (nodeList) {
     nodeList.collection.setSkip(nodeList.collection.length, false);
     nodeList.collection.fetch({
       reset: false,
       remove: false,
       merge: false
     });
   }
```

 </li>

  <li><b>getAddableTypes():</b> Get list of addable types which can be added to the specified container.
  
  #### Example:

```js
 getAddableTypes: function (headerView) {
    return  addableTypes = [
     {type: 0, type_name: 'Folder'},
     {type: 128, type_name: 'Collection'}
     ];
  },
```

 </li>

 <li><b>requestLazyAddableTpes():</b> Get list of addable types from other modules, once the core addables are available.
  
  #### Example:

```js
requestLazyAddableTpes: function (headerView) {
  return new Promise((resolve) => {
    setTimeout(() => {
      var addables = nodePicker.options.lazyAddableTypes;
      resolve(addables);
    }, 1000);
  })

},
```

 </li>

  <li><b>initializeToolbar():</b> Get custom addable types dropdown view to append in the header. Bind the execute events on clicking on tool items.
  
  #### Example:

```js
initializeToolbar: function (headerView) {
    var addableDDView = new ToolbarView();
    addableDDView.render();
    return addableDDView;
},
```

 </li>

  <li><b>showCustomInlineForm():</b> If the addable type has the flag "hasinlineform"(eg: {type: 133, type_name: 'efile', hasinlineform: true}), then provision is given for leading app to show their custom inline form thorugh this method which need to be resolved once the form is saved.
  
  #### Example:

```js
showCustomInlineForm: function (headerView) {
  return new Promise((resolve) => {
    setTimeout(() => {
      var sp = new SidePanelView(sidePanelOpts);
      resolve(sp);
    }, 1000);
  })

},
```

 </li>
</ul>

## Public Methods

<ul>
  <li><strong>show</strong> - Method avaialable on NodePicker instance to show the dialog. It returns a promise.</li>
</ul>

## Events

<ul>
<li><b>save:form</b> - An event is triggered on clicking the save button in inline form with newly added node as event data. This event wil be available on `nodePickerInstance._view`, leading application need to wait for the promise to be resolved from `.show()` method and then provide the listener for `save:form`. </p>
  <p>If saving the model has any error , then the leading application need to set "smartInlineFormErrorMessage" property in the model.If saving the model has no errors then leading application need update the model with all the required properties (id and other NodeModel attributes) and need to trigger "edit:ended" on same NodeModel to execute a callback from SmartControl NodePicker.</li>

```js
nodePicker.show(options).then(() => {
  this.listenTo(nodePicker._view, "save:form", this._myCallback);
});
```

</ul>

<ul>
<li><b>edit:ended</b> - Leading application must trigger `edit:ended` event on NodeModel (sent as event data with save:form event).</li>

```js
newNode.trigger("edit:ended");
```

</ul>

### Important Links:

<p>Content Server Sub types : <a target="_blank" href="https://www.greggriffiths.org/livelink/reference/subtypes/">Sub Types</a></p>
