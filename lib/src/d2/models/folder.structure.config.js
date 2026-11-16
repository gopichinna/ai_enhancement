/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone" ], function(_, Backbone) {
  "use strict";
  var FolderStructureConfigModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function FolderStructureConfigModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    parse: function(response) {
      var content = response.content, links = _.isArray(response.links) ? response.links : [];
      links = links.concat(content.links);
      var properties = _.extend({}, _.omit(response, "content"), content, {
        links: links
      });
      return properties;
    }
  });
  return FolderStructureConfigModel;
});