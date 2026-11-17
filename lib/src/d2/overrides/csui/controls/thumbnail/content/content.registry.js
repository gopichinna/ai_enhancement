/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/thumbnail/content/content.registry", "csui/controls/thumbnail/content/name/name.view" ], function(ContentRegistry, ThumbnailNameView) {
  "use strict";
  var getContentView = ContentRegistry.getContentView;
  ContentRegistry.getContentView = function(columnDefinition) {
    var contentView = getContentView.apply(this, arguments);
    var firstColumnInColumnCollection = columnDefinition?.collection?.at(0);
    if (firstColumnInColumnCollection?.get("key") === columnDefinition?.get("key")) {
      firstColumnInColumnCollection.set("isNaming", true);
      firstColumnInColumnCollection.set("defaultAction", true);
      contentView = ThumbnailNameView;
    }
    return contentView;
  };
});