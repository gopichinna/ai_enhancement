/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone", "csui/models/mixins/expandable/expandable.mixin", "csui/models/mixins/resource/resource.mixin", "csui/models/mixins/uploadable/uploadable.mixin", "csui/models/mixins/including.additional.resources/including.additional.resources.mixin", "esoc/widgets/socialactions/comment/server.adaptor.mixin" ], function($, Backbone, ExpandableMixin, ResourceMixin, UploadableMixin, IncludingAdditionalResourcesMixin, ServerAdaptorMixin) {
  var Comment = Backbone.Model.extend({
    defaults: {
      id: 0,
      data_id: 0,
      created_at: "-",
      modified_at: "",
      text: "-",
      feed_event_type: 0,
      user: {
        name: "-",
        screen_name: "-",
        profile_image_url: "-"
      },
      noMoreData: true,
      actions: {},
      extended_info: {}
    },
    constructor: function Comment(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeResource(options).makeIncludingAdditionalResources(options).makeUploadable(options).makeExpandable(options).makeServerAdaptor(options);
    },
    isNew: function() {
      return this.id === 0;
    }
  });
  IncludingAdditionalResourcesMixin.mixin(Comment.prototype);
  ExpandableMixin.mixin(Comment.prototype);
  UploadableMixin.mixin(Comment.prototype);
  ResourceMixin.mixin(Comment.prototype);
  ServerAdaptorMixin.mixin(Comment.prototype);
  return Comment;
});