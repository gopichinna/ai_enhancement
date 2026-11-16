/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "d2/utils/rest.linkrels", "d2/models/creation.profile.value.config", "d2/models/creation.profile" ], function(_, Backbone, Url, ConnectableMixin, FetchableMixin, RestLinkrels, ValueConfigModel, CreationProfileModel) {
  "use strict";
  var ValueConfigCollection = Backbone.Collection.extend({
    model: ValueConfigModel,
    constructor: function ValueConfigCollection(models, options) {
      options = options || {};
      this.mode = options.mode || "create";
      this.profile = options.profile;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      if (!(this.profile instanceof CreationProfileModel)) {
        throw Error("Profile is not set");
      }
      var url = RestLinkrels.getLink(this.profile.get("links"), RestLinkrels.D2_CREATION_PROFILE_VALUE_CONFIGS);
      return Url.appendQuery(url, Url.combineQueryString({
        mode: this.mode,
        inline: true
      }));
    },
    parse: function(response) {
      return _.isArray(response.entries) ? response.entries : [];
    }
  });
  ConnectableMixin.mixin(ValueConfigCollection.prototype);
  FetchableMixin.mixin(ValueConfigCollection.prototype);
  return ValueConfigCollection;
});