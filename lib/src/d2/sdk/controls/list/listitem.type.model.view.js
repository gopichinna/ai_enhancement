/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/controls/list/listitem.type.model.view'
], function(ListItemTypeModelViewImpl){
  'use strict';

  /**
   * A list item view that can work with any {@link external:Backbone.Model|Backbone.Model}.
   *
   * @example <caption>Typical usage</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/list/simple.list.view',
   *  'd2/sdk/controls/list/listitem.type.model.view',
   *  'd2/sdk/utils/contexts/context.utils',
   * ], function(Backbone, Marionette, ListView, ListItemTypeModelView, contextUtils){
   *  'use strict';
   *
   *  var collection = new Backbone.Collection([
   *    {
   *      id: 1,
   *      name: 'One'
   *    },
   *    {
   *      id: 2,
   *      name: 'Two'
   *    },
   *    {
   *      id: 3,
   *      name: 'Three'
   *    }
   *  ]), context = contextUtils.getPerspectiveContext();
   *
   *  var MyListView = ListView.extend({
   *    childView: ListItemTypeModelView,
   *    childViewOptions: function() {
   *      var opts = _.extend({}, this.options);
   *      opts.templateHelpers = function () {
   *        return {
   *          name: this.model.get('name'),
   *          itemLabel: this.model.get('name'),
   *          enableIcon: false,
   *          showInlineActionBar: false
   *        };
   *      };
   *      return opts;
   *    },
   *    constructor: function MyListView(options) {
   *      options = options || {};
   *      MyListView.__super__.constructor.call(this, options);
   *    }
   *  });
   *
   *  var myList = new MyListView({collection: collection, context: context});
   *  new Marionette.Region({el: '.host-el'}).show(myList);
   * });
   *
   * @module {d2/sdk/controls/list/listitem.type.model.view} d2/sdk/controls/list/"listitem.type.model.view"
   * @name ListItemTypeModel
   * @extends {external:Marionette.ItemView}
   */

  /**
   * @external "Marionette.ItemView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.itemview.html
   */

  /**
   * @external "Backbone.Model"
   * @see https://backbonejs.org/#Model
   */

  /**
   * @external ToolitemsFactory
   * @see ../toolbar/toolitems.factory
   */

  var ListItemTypeModelView = ListItemTypeModelViewImpl.extend({

    /**
     * @constructs
     * @name ListItemTypeModel
     * @alias module:ListItemTypeModel
     * @param {object} options - Constructor options
     * @param {Context} [options.context] - Reference to the active application context. Needed only if the listitem is going to have a dropdown menu.
     * @param {object} [options.toolbarData]
     * @param {external:ToolitemsFactory} [options.toolbarData.toolbaritems] - Menu configuration
     */
    constructor: function ListItemTypeModelView(options) {
      options = options || {};
      ListItemTypeModelView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name templateHelpers
   * @returns {TemplateOptions} That controls how each item is rendered.
   * @instance
   */

  /**
   * @typedef {object} TemplateOptions
   * @param {string} name - Displayable text for the item
   * @param {string} itemLabel - Aria-label associated with the item
   * @param {Boolean} [enableIcon=false] - Whether to show an icon for the item
   * @param {string} [icon] - CSS class name of an icon to be shown for the item. Ignored if `enableIcon` is set to `false`.
   * @param {Boolean} [showInlineActionBar=false] - Whether the item will have a dropdown menu
   */

  return ListItemTypeModelView;
});
