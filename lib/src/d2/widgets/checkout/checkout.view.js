/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/contexts/factories/checkout.factory", "d2/widgets/widgettile/widgettile.view", "i18n!d2/widgets/checkout/impl/nls/lang" ], function(CheckoutCollectionFactory, WidgetTileView, lang) {
  "use strict";
  var CheckoutView = WidgetTileView.extend({
    constructor: function CheckoutView(options) {
      options = options || {};
      options.lang = lang;
      options.collectionFactory = CheckoutCollectionFactory;
      options.cssClass = "d2-checkedout";
      WidgetTileView.prototype.constructor.call(this, options);
      this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleReserveEvents: true
      });
    }
  });
  return CheckoutView;
});