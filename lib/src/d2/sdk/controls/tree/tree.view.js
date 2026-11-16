/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/tree/tree.view'
], function(TreeViewImpl){

  /**
   * Tree View, renders data into a tree structure. Internally it is implemented using {@link external:Fancytree}.
   *
   * @example <caption>A sample tree construction may look like</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/tree/tree.view',
   *  'hbs!mybundle/test/test.tree'
   * ], function(Marionette, TreeView, template){
   *
   *  var MyTreeView = Marionette.LayoutView.extend({
   *    template: template,
   *
   *    regions: {
   *      rgnTree: '.rgnTree'
   *    },
   *
   *    constructor: function MyTreeView(options) {
   *      options = options || {};
   *      MyTreeView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      if(!this.treeView) {
   *        this.treeView = new TreeView(this._buildTreeOptions());
   *        this.rgnTree.show(this.treeView);
   *      }
   *    },
   *
   *    _buildTreeOptions: function() {
   *      var treeOption = {
   *        source: [
   *          //This demonstrates how to initialize a tree with literal data only
   *          {title: "Node 1", key: "1"},
   *          {title: "Folder 2", key: "2", folder: true, children: [
   *            {title: "Node 2.1", key: "3"},
   *            {title: "Node 2.2", key: "4"}
   *          ]}
   *        ]
   *      };
   *
   *      return treeOption;
   *    }
   *  });
   *
   *  return MyTreeView;
   * });
   *
   * @example
   * <caption> where the content of mybundle/test/test.tree.hbs is as follows </caption>
   * <div class="rgnTree"></div>
   *
   * @module {d2/sdk/controls/tree/tree.view} d2/sdk/controls/tree/"tree.view"
   * @name TreeView
   * @extends {external:Marionette.ItemView}
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Fancytree"
   * @see https://wwwendt.de/tech/fancytree/doc/jsdoc/Fancytree.html
   */


  var TreeView = TreeViewImpl.extend({

    /**
     * @constructs
     * @name TreeView
     * @alias module:TreeView
     * @param {object} options - Construction options holder. Only a subset of
     * @param {FancytreeEventCallback} [options.activate] - Called when some node is activated.
     * @param {FancytreeEventCallback} [options.beforeActivate] - Called when some node is about to become active.
     * @param {FancytreeEventCallback} [options.click] - Called when a node is clicked.
     * @param {FancytreeEventCallback} [options.clickPaging] - Called when a paging status node is clicked. A paging status node is used to render more siblings at given depth.
     * @param {FancytreeEventCallback} [options.collapse] - Called when a node is collapsed.
     * @param {FancytreeEventCallback} [options.dblclick] - Called when a node is clicked twice.
     * @param {FancytreeEventCallback} [options.expand] - Called when a node is expanded.
     * @param {FancytreeEventCallback} [options.focus] - Called when a node receives keyboard focus.
     * @param {FancytreeEventCallback} [options.init] - Called when the tree reaches a particular state, when tree is initialized, source data is loaded & visible nodes are rendered.
     * @param {FancytreeEventCallback} [options.keydown] - Called when a node has received a keyboard event.
     * @param {FancytreeEventCallback} [options.lazyLoad] - Called when `data.node` is expanded for the first time. The children data must be returned in `data.results` property.
     * @param {*} [options.source] - Used to compute/collect data for the initial tree rendering. Can return a jQuery promise which can then later be resolved with tree data. See {@link https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#NodeData|NodeData}.
     * @param {Object} [options.strings] - Key-value pairs used for translations.
     */
    constructor: function TreeView(options) {
      options = options || {};
      TreeView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @callback FancytreeEventCallback
   * @param {external:jQueryEvent} event - A jquery event representing interaction.
   * @param {external:FancytreeEventData} data - Data associated with the event.
   */

  /**
   * @external "FancytreeEventData"
   * @see https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#EventData
   *
   */

  /**
   * @external "jQueryEvent"
   * @see https://api.jquery.com/category/events/event-object/
   */

  return TreeView;
});