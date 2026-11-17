/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/utils/rest.linkrels", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin" ], function(_, Backbone, RestLinkrels, ConnectableMixin, FetchableMixin) {
  "use strict";
  var ValueConfigModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function ValueConfigModel(attrs, options) {
      options = options || {};
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.D2_CREATION_PROFILE_VALUE_CONFIG);
    },
    parse: function(response) {
      var content = response.content || response, links = _.isArray(response.links) ? response.links : [];
      if (response !== content) {
        links = links.concat(content.links);
      }
      var properties = _.extend({}, _.omit(response, "content"), content, {
        id: content["r_object_id"],
        links: links
      }), dictionary = _.isArray(properties.dictionaries) ? properties.dictionaries : [];
      this.dictionaries = new Backbone.Collection(dictionary, {
        comparator: "order"
      });
      this.dictionaries.valueConfigModel = this;
      return properties;
    }
  });
  ConnectableMixin.mixin(ValueConfigModel.prototype);
  FetchableMixin.mixin(ValueConfigModel.prototype);
  return ValueConfigModel;
});