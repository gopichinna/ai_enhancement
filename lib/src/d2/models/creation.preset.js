/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone" ], function(_, Backbone) {
  "use strict";
  var PresetProfileModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function PresetProfileModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    parse: function(response) {
      var content = response.content || response;
      var properties = _.extend({}, content, {
        id: content["r_object_id"],
        name: content["title"] || content["object_name"]
      });
      return properties;
    },
    isCustomAllowed: function() {
      return this.has("allow_custom_profile") ? this.get("allow_custom_profile") : false;
    },
    isRecentAllowed: function() {
      return this.has("allow_recently_used") ? this.get("allow_recently_used") : false;
    }
  });
  return PresetProfileModel;
});