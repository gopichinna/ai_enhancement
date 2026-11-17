/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/uploadable/uploadable.mixin" ], function(_, Backbone, ConnectableMixin, UploadableMixin) {
  var AppliedCategoryModel = Backbone.Model.extend({
    constructor: function AppliedCategoryModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeUploadable(options);
    },
    isNew: function() {
      return !!this.get("category_id");
    },
    parse: function(response, options) {
      var attributes = this.attributes;
      if (attributes.category_id) {
        response.id = attributes.category_id;
        delete attributes.category_id;
      }
      return response;
    }
  });
  UploadableMixin.mixin(AppliedCategoryModel.prototype);
  ConnectableMixin.mixin(AppliedCategoryModel.prototype);
  return AppliedCategoryModel;
});