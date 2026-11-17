/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/utils/base", "csui/utils/url" ], function(module, _, Backbone, ConnectableMixin, base, Url) {
  "use strict";
  var SelectedContainerId;
  var ContainerResponsiveStateModel = Backbone.Model.extend({
    defaults: {
      changed: undefined,
      new_state: undefined,
      state_id: undefined,
      state_message: undefined,
      user_message: undefined
    },
    constructor: function ContainerResponsiveStateModel(options) {
      Backbone.Model.prototype.constructor.call(this, options);
      this.options = options;
      SelectedContainerId = this.options.selectedContainerId;
      this.previousState = null;
      this.makeConnectable(options);
    },
    getChanged: function() {
      return this.get("changed");
    },
    getState: function() {
      return this.get("new_state");
    },
    getUserMessage: function() {
      return this.get("user_message");
    },
    changeSelectedContainerId: function(newContainerId) {
      SelectedContainerId = newContainerId;
      this.previousState = null;
    },
    urlBase: function() {
      var url;
      var apiBase = new Url(this.connector.connection.url).getApiBase("v2");
      if (!this.previousState) {
        url = Url.combine(apiBase, "/nodes/", SelectedContainerId, "/state");
      } else {
        var query = "?current_state=" + this.getState();
        url = Url.combine(apiBase, "/nodes/", SelectedContainerId, "/state") + query;
      }
      return url;
    },
    url: function() {
      var url = this.urlBase();
      return url;
    },
    parse: function(response) {
      this.previousState = response.results.new_state;
      return response.results;
    }
  });
  ConnectableMixin.mixin(ContainerResponsiveStateModel.prototype);
  return ContainerResponsiveStateModel;
});