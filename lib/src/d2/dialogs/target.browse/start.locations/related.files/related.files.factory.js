/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "d2/dialogs/target.browse/start.locations/related.files/impl/related.files.collection" ], function(_, $, LocationBaseFactory, RelatedFilesCollection) {
  "use strict";
  var RelatedFilesFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        hide: true,
        invalid: false
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var relatedFilesModel = {}, container = this.options.container;
      var relatedFiles = new RelatedFilesCollection(relatedFilesModel.models, _.extend({
        connector: options.connector
      }, {
        node: options.nodeModel,
        subTypeFilters: options.subTypeFilters,
        autofetch: true,
        autoreset: true,
        top: options.pageSize,
        showInTargetBrowse: true
      }));
      if (container) {
        container.set("unselectable", false);
      }
      return {
        container: container,
        collection: relatedFiles,
        locationName: ""
      };
    }
  });
  return RelatedFilesFactory;
});