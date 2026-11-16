/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url" ], function(_, Backbone, Url) {
  var RepositoryModel = Backbone.Model.extend({
    idAttribute: "name"
  });
  var RepositoryCollection = Backbone.Collection.extend({
    model: RepositoryModel,
    constructor: function RepositoryCollection(models, options = {}) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.connector = options.connector;
    },
    url: function() {
      return Url.appendQuery(this.connector.connection.url + "/repositories", Url.combineQueryString({
        inline: true
      }));
    },
    parse: function(response) {
      return (response.entries || []).map(function(entry) {
        return _.pick(entry.content, "name", "description", "links");
      });
    }
  });
  return RepositoryCollection;
});