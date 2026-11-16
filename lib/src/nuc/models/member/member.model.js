/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/models/member/member.server.adaptor.mixin'
], function (_, Backbone, Url, ResourceMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var MemberModel = Backbone.Model.extend({
    constructor: function MemberModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = options;
      this.groupId = attributes.groupId;
      this.makeResource(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  UploadableMixin.mixin(MemberModel.prototype);
  ResourceMixin.mixin(MemberModel.prototype);
  ServerAdaptorMixin.mixin(MemberModel.prototype);

  return MemberModel;
});
