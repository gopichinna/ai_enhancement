/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'nuc/models/member',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin'
], function (
  _,
  Backbone,
  Url,
  MemberModel,
  ConnectableMixin,
  FetchableMixin,
  ExpandableMixin,
  IncludingAdditionalResourcesMixin
) {
  'use strict';

  var AuthenticationModel = Backbone.Model.extend({
    constructor: function AuthenticationModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.makeConnectable(options)
        .makeIncludingAdditionalResources(options)
        .makeFetchable(options)
        .makeExpandable(options);

      this.user = new MemberModel(this.get('user'), options);
    },

    idAttribute: null,

    url: function () {
      var url = Url.combine(this.connector.connection.url, 'auth'),
        query = Url.combineQueryString(this.getExpandableResourcesUrlQuery(), this.getAdditionalResourcesUrlQuery());
      return query ? url + '?' + query : url;
    },

    parse: function (response) {
      // Normalize the response to have always an user there.
      var user = response.user || (response.user = response.data);

      // Properties out of data are not passed to the constructor.  This
      // may yet get its own sub-model.
      _.defaults(user, {
        perspective: response.perspective
      });

      // Parse can be called from the parent constructor, before the
      // of this functional object has finished.  In that case, the
      // raw data will be returned in the parsed object; otherwise
      // they will be set to the existing nested collections.
      if (this.user) {
        this.user.set(user);
      }

      return response;
    }
  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticationModel.prototype);
  ExpandableMixin.mixin(AuthenticationModel.prototype);
  ConnectableMixin.mixin(AuthenticationModel.prototype);
  FetchableMixin.mixin(AuthenticationModel.prototype);

  return AuthenticationModel;
});
