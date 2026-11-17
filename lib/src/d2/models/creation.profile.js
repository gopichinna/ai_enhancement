/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/utils/rest.linkrels", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin" ], function(_, Backbone, RestLinkrels, ConnectableMixin, FetchableMixin) {
  "use strict";
  var cloneableProperties = [ "connector", "presetModel", "isEdited", "isDefaultCustomName" ];
  var CreationProfileModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function CreationProfileModel(attrs, options) {
      options = options || {};
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.D2_CREATION_PROFILE);
    },
    parse: function(response) {
      var content = response.content || response;
      var properties = _.extend({}, _.omit(response, "content"), content, {
        id: content["r_object_id"],
        name: content["label"] || content["object_name"]
      });
      return properties;
    },
    canBeUsedForImport: function() {
      return this.has("import_profile") ? this.get("import_profile") : false;
    },
    canBeUsedForCreate: function() {
      return this.has("creation_profile") ? this.get("creation_profile") : false;
    },
    canBeUsedForLinkedDocument: function() {
      return this.has("linked_document_profile") ? this.get("linked_document_profile") : false;
    },
    clone: function() {
      var clonedModel = Backbone.Model.prototype.clone.apply(this, arguments);
      _.each(cloneableProperties, function(prop) {
        clonedModel[prop] = this[prop];
      }.bind(this));
      return clonedModel;
    }
  });
  ConnectableMixin.mixin(CreationProfileModel.prototype);
  FetchableMixin.mixin(CreationProfileModel.prototype);
  return CreationProfileModel;
});