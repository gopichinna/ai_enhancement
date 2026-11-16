/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/factories/favorites", "dctmw/widgets/widgettile/widgettile.view", "i18n!dctmw/widgets/favorites/impl/nls/lang", "css!dctmw/widgets/favorites/impl/favorites" ], function(FavoriteCollectionFactory, WidgetTileView, lang) {
  "use strict";
  var FavoritesView = WidgetTileView.extend({
    constructor: function FavoritesView(options) {
      options = options || {};
      options.lang = lang;
      options.collectionFactory = FavoriteCollectionFactory;
      options.cssClass = "d2-favorites";
      WidgetTileView.prototype.constructor.call(this, options);
      this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleDeleteEvent: true
      });
    }
  });
  return FavoritesView;
});