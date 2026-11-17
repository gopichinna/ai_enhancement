/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/models/creation.preset" ], function(_, Backbone, Url, ConnectableMixin, FetchableMixin, RestResources, RestLinkrels, PresetProfileModel) {
  "use strict";
  var PresetProfileCollection = Backbone.Collection.extend({
    model: PresetProfileModel,
    comparator: function(model) {
      return model.get("name").toUpperCase();
    },
    constructor: function PresetProfileCollection(models, options) {
      options = options || {};
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CREATION_PRESET_PROFILES);
      return Url.appendQuery(url, Url.combineQueryString({
        inline: true
      }));
    },
    parse: function(response) {
      return _.isArray(response.entries) ? response.entries : [];
    }
  });
  ConnectableMixin.mixin(PresetProfileCollection.prototype);
  FetchableMixin.mixin(PresetProfileCollection.prototype);
  return PresetProfileCollection;
});