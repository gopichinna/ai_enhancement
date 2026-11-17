/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils" ], function(_, Backbone, Url, RestResources, RestLinkrels, utils) {
  "use strict";
  var storage = utils.getLocalStore("theme");
  return Backbone.Model.extend({
    constructor: function ThemeConfigModel(attributes, options) {
      this.options = options;
      this.defaultAttributes = attributes;
      var storedAttributes = storage.get(this.options.type);
      Backbone.Model.prototype.constructor.call(this, _.defaults({}, attributes, storedAttributes), options);
      this.listenTo(this, "sync", this._saveThemeLocally);
    },
    url: function() {
      var url;
      if (this.options.type === "landing_page") {
        url = Url.appendQuery(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_THEMES), "inline=true");
      } else if (this.options.type === "signin_page") {
        url = Url.combine(this.options.connector.connection.url, "d2-configurations/d2-theme-configs/default-theme");
      } else {
        throw "Attribute Type is missing";
      }
      return url;
    },
    parse: function(response) {
      var results = {}, currentUser = RestResources.getCurrentUser(), userSettings = currentUser instanceof Backbone.Model && currentUser.get("settings"), defaultSkin = userSettings && userSettings.defaultSkin, searchFocussed = userSettings && userSettings.searchFocusEnabled;
      for (var key in this.attributes) {
        results[key] = undefined;
      }
      var me = this;
      if (me.options.type === "landing_page" && response.entries) {
        response = _.find(response.entries, function(entry) {
          return entry.content.properties.object_name === defaultSkin;
        });
        if (response && response.content && response.content.properties) {
          _.extend(results, response.content.properties);
        }
      } else if (me.options.type === "signin_page" && response.properties) {
        _.extend(results, response.properties);
      }
      return _.extend(results, this.defaultAttributes, {
        _searchFocusedHeader: searchFocussed
      });
    },
    sync: function(method, model, options) {
      if (method === "read") {
        this.options.connector.extendAjaxOptions(options);
      }
      return Backbone.Model.prototype.sync.apply(this, arguments);
    },
    _saveThemeLocally: function() {
      storage.set(this.options.type, this.attributes);
    }
  });
});