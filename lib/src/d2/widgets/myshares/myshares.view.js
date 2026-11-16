/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/myshares/myshares.factory", "d2/widgets/widgettile/widgettile.view", "i18n!d2/widgets/myshares/impl/nls/lang" ], function(MySharesCollectionFactory, WidgetTileView, lang) {
  "use strict";
  var MyShareTileView = WidgetTileView.extend({
    constructor: function MyShareTileView(options) {
      options = options || {};
      options.lang = lang;
      options.collectionFactory = MySharesCollectionFactory;
      options.cssClass = "d2-myshares";
      WidgetTileView.prototype.constructor.call(this, options);
      this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleDeleteEvent: true,
        handleCoreEvents: true
      });
    }
  });
  return MyShareTileView;
});