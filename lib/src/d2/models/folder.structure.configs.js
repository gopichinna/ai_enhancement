/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/models/folder.structure.config" ], function(_, Backbone, Url, ConnectableMixin, FetchableMixin, RestLinkrels, RestResources, FolderStructureModel) {
  "use strict";
  var FolderStructureCollection = Backbone.Collection.extend({
    model: FolderStructureModel,
    constructor: function FolderStructureCollection(models, options) {
      options = options || {};
      this.mode = options.mode || "create";
      this.container = options.container;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options);
    },
    url: function() {
      var links = RestResources.getCurrentRepository().get("links");
      var url = RestLinkrels.getLink(links, RestLinkrels.D2_FOLDER_STRUCTURE_CONFIGS);
      return Url.appendQuery(url, Url.combineQueryString({
        "link-id": this.container ? this.container.get("id") : ""
      }));
    },
    parse: function(response) {
      return _.isArray(response.entries) ? response.entries : [];
    }
  });
  ConnectableMixin.mixin(FolderStructureCollection.prototype);
  FetchableMixin.mixin(FolderStructureCollection.prototype);
  return FolderStructureCollection;
});