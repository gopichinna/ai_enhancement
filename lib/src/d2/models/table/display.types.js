/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, RestResources, RestLinkrels) {
  var DisplayTypeModel = Backbone.Model.extend({
    idAttribute: "name"
  });
  var DisplayTypeCollection = Backbone.Collection.extend({
    model: DisplayTypeModel,
    constructor: function DisplayTypeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      var repo = RestResources.getCurrentRepository(), url = RestLinkrels.getLink(repo.get("links"), RestLinkrels.D2_DISPLAY_TYPES);
      return Url.appendQuery(url, Url.combineQueryString({
        inline: true
      }));
    },
    parse: function(response) {
      var output = [];
      _.each(response.entries || [], function(entry) {
        output.push({
          name: entry.content.name,
          label: entry.content.label,
          properties: entry.content.properties
        });
      });
      return output;
    }
  });
  ConnectableMixin.mixin(DisplayTypeCollection.prototype);
  FetchableMixin.mixin(DisplayTypeCollection.prototype);
  return DisplayTypeCollection;
});