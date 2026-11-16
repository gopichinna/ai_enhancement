/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/contexts/factories/checkout.factory", "d2/widgets/widgettable/widgettable.view", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "i18n!d2/widgets/checkedouttable/impl/nls/lang" ], function(module, $, _, Backbone, Marionette, CheckoutCollectionFactory, D2WidgetTable, widgetConstants, constants, serverQueryUtils, lang) {
  "use strict";
  var CheckedOutTableView = D2WidgetTable.extend({
    constructor: function CheckedOutTableView(options) {
      options.d2collectionFactory = CheckoutCollectionFactory;
      D2WidgetTable.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.CHECKOUT, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.dialogTitle;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.CHECKOUT;
    }
  });
  return CheckedOutTableView;
});