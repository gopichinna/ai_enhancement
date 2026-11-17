/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "d2/dialogs/new.file/import/import.metadata.properties.view" ], function(require, $, ImportMetadataPropertiesView) {
  var BwsMultiPropertiesView = ImportMetadataPropertiesView.extend({
    initViews: function() {
      let def = $.Deferred();
      require([ "d2/controls/multi.item/multi.item.view", "d2/dialogs/bws/create.bws.instance/properties/bws.properties.view" ], (MultiItemView, BwsMetadataPropertiesView) => {
        def.resolve({
          MultiItemView: MultiItemView,
          PropertiesView: BwsMetadataPropertiesView
        });
      });
      return def.promise();
    }
  });
  return BwsMultiPropertiesView;
});