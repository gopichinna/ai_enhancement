/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/widgets/widgettable/widgettable.view'
], function(_, NodesTableViewImpl){
  'use strict';

  /**
   * Base class for all table-like widgets. Typically a subclass of this type is used whenever an
   * {@link ../../utils/perspectives/app.scope.perspectives|ApplicationScopePerspective} requires a table-like rendering.
   *
   * @example <caption>A minimum sample derivative may look like</caption>
   * //In mybundle/widgets/sample.table/sample.table.view.js
   *
   * define([
   *  'd2/sdk/widgets/nodestable/nodestable.view',
   *  'mybundle/utils/contexts/factories/sample.table.collection.factory'
   * ], function(NodesTableView, SampleTableCollectionFactory){
   *    'use strict';
   *
   *    var SampleTableView = NodesTableView.extend({
   *      constructor: function SampleTableView(options) {
   *        options = options || {};
   *        options.className = 'my-table-view';
   *        options.d2collectionFactory = SampleTableCollectionFactory;
   *
   *        SampleTableView.__super__.constructor.call(this, options);
   *      }
   *    });
   *
   *    return SampleTableView;
   * });
   *
   * @example <caption>To link it to a perspective</caption>
   * //In mybundle/utils/perspectives/table.perspective.json
   *
   *  {
   *      "type": "left-center-right",
   *      "options": {
   *        "center": {
   *          "type": "mybundle/widgets/sample.table"
   *        }
   *      }
   *  }
   *
   *
   * //In mybundle/extensions/perspectives.js
   * define([], function(){
   *  'use strict';
   *
   *  return [{
   *    ...,
   *    perspectiveJson: 'mybundle/utils/perspectives/table.perspective.json',
   *    ...
   *  }];
   * });
   *
   * @example <caption>Finally, to register the perspective definition as an application scope perspective</caption>
   * //In extensions.json
   * {
   *   "d2/sdk/utils/perspectives/app.scope.perspectives": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/extensions/perspectives"
   *         }
   *      }
   *    }
   * }
   *
   *
   * @module {d2/sdk/widgets/nodestable/nodestable.view} d2/sdk/widgets/nodestable/"nodestable.view"
   * @name NodesTableView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  /**
   * @external ToolitemsFactory
   * @see ../../controls/toolbar/toolitems.factory
   */

  /**
   * @external NodeModel
   * @see ../../models/node.model
   */

  var NodesTableView = NodesTableViewImpl.extend({

    /**
     * @constructs
     * @alias module:NodesTableView
     * @name NodesTableView
     * @param {object} [options] - Constructor options
     * @param {string} [options.cssClass] - CSS class name to be added to HTML element representing this whole table view. `options.className` will have a higher precedence over the same purpose.
     * @param {Factory} [options.d2collectionFactory] - Collection factory to be used to instantiate the collection that will hold data for this table.
     * @param {function} [options.collectionClass] - A constructor type to be used to instantiate the data holder collection.
     * @param {Backbone.Collection} [options.collection] - A collection instance to be used as data holder for the table. One of `d2collectionFactory`, `collectionClass` or
     * `collection` has to be provided as part of constructor options. Otherwise, it fails with error.
     * @param {NodesTableToolbar} [options.toolbarItems] - Menu configuration for the table view.
     */
    constructor: function NodesTableView(options) {
      options = options || {};
      if(options.className) {
        options.cssClass = options.className;
        delete options.className;
      }

      NodesTableView.__super__.constructor.call(this, options);
    },

    className: function() {
      var superClassName = NodesTableView.__super__.className,
        className = '';
      if(_.isFunction(superClassName)) {
        className += ' ' + superClassName.call(this);
      } else if(_.isString(superClassName)) {
        className += superClassName;
      }

      return className + ' ' + this.options.cssClass;
    },

    /**
     * @returns {string} Text to be shown when there are no items in the data holder collection.
     * @instance
     */
    getZeroRecordText: function() {
      return NodesTableView.__super__.getZeroRecordText.apply(this, arguments);
    },

    /**
     *
     * @returns {string} Title to show at header of this table
     * @instance
     */
    getTitle: function() {
      return NodesTableView.__super__.getTitle.apply(this, arguments);
    },

    /**
     * @returns {external:NodeModel} A node model to hold representation data for the table header.
     * @instance
     */
    getContainerNode: function() {
      return NodesTableView.__super__.getContainerNode.apply(this, arguments);
    },

    /**
     *
     * @returns {object} Additional attributes to be merged with the NodeModel returned from `getContainerNode()`.
     * @instance
     */
    getExtraIconConfig: function() {
      return NodesTableView.__super__.getExtraIconConfig.apply(this, arguments);
    },

    /**
     * @returns {object} Additional option to be used while constructing the collection from `collectionClass` constructor option.
     * @instance
     */
    getCollectionOptions: function() {
      return NodesTableView.__super__.getCollectionOptions.apply(this, arguments);
    }
  });

  /**
   * Toolbar type for NodesTable.
   * @typedef {Object} NodesTableToolbar
   * @property {external:ToolitemsFactory} inlineActionbar - Menu configuration used at individual item level.
   * @property {external:ToolitemsFactory} tableHeaderToolbar - Menu configuration for the header.
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `NodesTableView`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  return NodesTableView;
});