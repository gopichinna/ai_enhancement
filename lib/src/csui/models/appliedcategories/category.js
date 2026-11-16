/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/mixins/expandable/expandable.mixin", "csui/models/mixins/resource/resource.mixin", "csui/models/mixins/uploadable/uploadable.mixin", "csui/models/appliedcategories/category.server.adaptor.mixin" ], function(Backbone, ExpandableMixin, ResourceMixin, UploadableMixin, ServerAdaptorMixin) {
  "use strict";
  var CategoryModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function CategoryModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;
      this.makeResource(options).makeUploadable(options).makeExpandable(options).makeServerAdaptor(options);
    },
    clone: function() {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });
  ExpandableMixin.mixin(CategoryModel.prototype);
  UploadableMixin.mixin(CategoryModel.prototype);
  ResourceMixin.mixin(CategoryModel.prototype);
  ServerAdaptorMixin.mixin(CategoryModel.prototype);
  return CategoryModel;
});