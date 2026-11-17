/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/utils/url'], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (_options) {
          return this;
        },

        urlRoot: function () {
          var apiBase = new Url(this.connector.connection.url).getApiBase('v2');
          return Url.combine(apiBase, '/members');
        },

        url: function () {
          var finalClauses = Url.combineQueryString(
            {
              limit: this.limit,
              sort: this.orderBy,
              query: this.query
            },
            this.memberType.length && {
              where_type: this.memberType
            },
            this.expandFields.length && {
              expand: 'properties{' + this.expandFields + '}'
            }
          );
          // Return the query
          return Url.appendQuery(_.result(this, 'urlRoot'), finalClauses);
        },

        parse: function (response) {
          if (!_.isEmpty(response.results)) {
            _.each(response.results, function (member) {
              member = _.extend(member, member.data.properties);
              delete member.data;
            });
            return response.results;
          }
          return null;
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
