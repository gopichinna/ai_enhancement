/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/backbone',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
  'nuc/models/authenticated.user/server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin, IncludingAdditionalResourcesMixin, ServerAdaptorMixin) {
  'use strict';

  var AuthenticatedUserModel = Backbone.Model.extend({
    constructor: function AuthenticatedUserModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
        .makeIncludingAdditionalResources(options)
        .makeExpandable(options)
        .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticatedUserModel.prototype);
  ExpandableMixin.mixin(AuthenticatedUserModel.prototype);
  ResourceMixin.mixin(AuthenticatedUserModel.prototype);
  ServerAdaptorMixin.mixin(AuthenticatedUserModel.prototype);

  return AuthenticatedUserModel;
});
