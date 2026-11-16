/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['require', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/log', 'nuc/utils/url'], function (
  _require,
  _,
  Backbone,
  log,
  Url
) {
  'use strict';

  // {
  //   signature:  unique identifier of the action to refer to
  //   name:       title of the action
  //   children:   array of action to appear as the submenu
  // }

  // ActionCollection to be filled on the first usage, preventing circular
  // dependency between ActionCollection and ActionModel.
  var ActionCollection;

  var ActionModel = Backbone.Model.extend({
    idAttribute: 'signature',

    constructor: function ActionModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      options && options.connector && options.connector.assignTo(this);
      // Require the ActionCollection on the first use to prevent a circular
      // dependency between ActionCollection and ActionModel.
      if (!ActionCollection) {
        ActionCollection = _require('nuc/models/actions');
      }
      // TODO: make the REST API return array or nothing; the children
      // property is supposed top be a collection.  It returns an empty
      // object literal if there are no children, while the clients like
      // Backbone.Collection expect an array or nothing.
      var children = (_.isArray(attributes && attributes.children) && attributes.children) || [];
      this.children = new ActionCollection(children);
    },

    // not yet working
    url: function () {
      return Url.combine(this.connector.connection.url, 'actions', this.get('signature'));
    },

    fetch: function (options) {
      log.debug('Fetching action with the ID {0}.', this.get('signature')) && console.log(log.last);
      return Backbone.Model.prototype.fetch.call(this, options);
    },

    parse: function (response) {
      var action = response;

      //if (log.debug("Parsing action \"{0}\" ({1}).", action.name, action.url)) {
      //  console.log(log.last);
      //  console.log(response);
      //}

      if (this.children) {
        // TODO: make the REST API return array or nothing; the children
        // property is supposed top be a collection.  It returns an empty
        // object literal if there are no children, while the clients like
        // Backbone.Collection expect an array or nothing.
        var children = (_.isArray(action.children) && action.children) || [];
        this.children.reset(children);
      }

      return action;
    }
  });

  return ActionModel;
});
