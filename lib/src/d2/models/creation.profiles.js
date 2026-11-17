/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/models/creation.profile" ], function(_, Backbone, Url, ConnectableMixin, FetchableMixin, RestResources, RestLinkrels, CreationProfileModel) {
  "use strict";
  var CreationProfileCollection = Backbone.Collection.extend({
    model: CreationProfileModel,
    comparator: function(model) {
      return model.get("name").toUpperCase();
    },
    constructor: function CreationProfiles(models, options) {
      options = options || {};
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
      this.mode = options.mode || "create";
      this.inheritableSourceNode = options.inheritableSourceNode;
    },
    url: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CREATION_PROFILES);
      var queryParams = {};
      if (this.inheritableSourceNode) {
        queryParams["inherited-id"] = this.inheritableSourceNode.get("id");
      }
      queryParams["mode"] = this.mode;
      queryParams["inline"] = true;
      return Url.appendQuery(url, Url.combineQueryString(queryParams));
    },
    parse: function(response) {
      return _.isArray(response.entries) ? response.entries : [];
    }
  });
  ConnectableMixin.mixin(CreationProfileCollection.prototype);
  FetchableMixin.mixin(CreationProfileCollection.prototype);
  return CreationProfileCollection;
});