/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/action'], function (_, Backbone, ActionModel) {
  'use strict';

  // ActionCollection
  // ----------------

  var ActionCollection = Backbone.Collection.extend({
    model: ActionModel,

    constructor: function ActionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options = options || {};
    },

    // Finds an action by its cid or signature (id) recursively; if the
    // action doesn't exist in the models of this collection, it will be
    // looked for in children of those models recursively.
    findRecursively: function (id) {
      // search the terminal actions in the collection first
      var action =
        this.get({ cid: id }) ||
        this.find(function (item) {
          return item.get('signature') === id;
        });
      // if not found, try all the submenus
      if (!action) {
        // make an array of all action finding results produced
        // recursively and pick the first action found
        action = _.find(
          this.map(function (item) {
            // if the submenu isn't empty handle it as another action
            // collection recursively - get the action or undefined
            // if it wasn't found
            return item.children.findRecursively(id);
            // pick the first action which is not undefined
          }),
          function (item) {
            return item;
          }
        );
      }
      return action;
    }
  });

  // Module
  // ------

  _.extend(ActionCollection, {
    version: '1.0'
  });

  return ActionCollection;
});
