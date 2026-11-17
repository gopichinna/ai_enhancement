/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "d2/utils/rest.linkrels" ], function(_, Backbone, ConnectableMixin, RestLinkrels) {
  "use strict";
  var ThumbnailModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function ThumbnailModel(node) {
      Backbone.Model.prototype.constructor.apply(this);
      this.options = {};
      this.node = node;
      this.options.connector = node.connector;
      this.makeConnectable(this.options);
    },
    url: function() {
      return RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_THUMBNAIL);
    },
    parse: function(response) {
      var prop = response.properties;
      prop && this.set(_.extend({
        id: prop.r_object_id
      }, prop), {
        silent: true
      });
      Backbone.Model.prototype.parse.apply(this, arguments);
    }
  });
  ConnectableMixin.mixin(ThumbnailModel.prototype);
  return ThumbnailModel;
});