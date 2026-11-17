/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/factories/recentlyaccessed", "d2/widgets/widgettile/widgettile.view", "i18n!d2/widgets/recentlyaccessed/impl/nls/lang" ], function(RecentlyAccessedCollectionFactory, WidgetTileView, lang) {
  "use strict";
  var RecentlyAccessedView = WidgetTileView.extend({
    constructor: function RecentlyAccessedView(options) {
      options = options || {};
      options.orderBy = "access_date_last desc";
      options.lang = lang;
      options.collectionFactory = RecentlyAccessedCollectionFactory;
      options.cssClass = "d2-recentlyaccessed";
      WidgetTileView.prototype.constructor.call(this, options);
      this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleDeleteEvent: true
      });
    }
  });
  return RecentlyAccessedView;
});