/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/utils/url", "dctmw/models/repositories" ], function(Backbone, Url, Repositories) {
  return Backbone.Model.extend({
    constructor: function ProductInfoModel(attributes, options = {}) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      attributes = attributes || {};
      this.repositories = new Repositories(attributes.repositories || [], options);
      this.networkLocations = new Backbone.Collection(attributes.networkLocations);
      this.connector = options.connector;
    },
    url: function() {
      return Url.combine(this.connector.connection.url, "product-info");
    },
    parse: function(response, options) {
      if (!response.repositories_info && options.error) {
        options.error(this, response, options);
      }
      var repositories = response.repositories_info && response.repositories_info.map(function(entry) {
        let repoName = entry?.repository?.repositoryName;
        if (!entry.name && repoName) {
          entry.name = repoName;
        }
        return entry;
      });
      var networkLocations = response.network_locations && response.network_locations.map(function(entry) {
        return entry;
      });
      this.repositories.reset(repositories);
      this.networkLocations.reset(networkLocations);
      var output = {};
      if (response.product_info && response.product_info.properties) {
        output = response.product_info.properties;
        this.connector.connection.authMode = output.auth_mode;
      }
      output.repositories = repositories;
      output.networkLocations = networkLocations;
      output.links = response.links;
      output.defaultRepositoryName = response.default_repository_name;
      return output;
    }
  });
});