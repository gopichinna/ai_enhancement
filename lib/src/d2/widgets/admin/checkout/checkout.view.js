/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/contexts/factories/admin.checkout.factory", "d2/widgets/widgettile/widgettile.view", "i18n!d2/widgets/checkout/impl/nls/lang" ], function(AdminCheckoutCollectionFactory, WidgetTileView, lang) {
  "use strict";
  var AdminCheckoutView = WidgetTileView.extend({
    constructor: function AdminCheckoutView(options) {
      options = options || {};
      options.lang = lang;
      options.collectionFactory = AdminCheckoutCollectionFactory;
      WidgetTileView.prototype.constructor.apply(this, arguments);
    },
    getFactoryParam: function() {
      return "admincheckedout";
    }
  });
  return AdminCheckoutView;
});