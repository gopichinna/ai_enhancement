/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "d2/utils/contexts/factories/admin.checkout.factory", "d2/widgets/widgettable/widgettable.view", "d2/widgets/checkedouttable/toolbaritems", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "i18n!d2/widgets/admin/checkedouttable/impl/nls/lang" ], function(Backbone, AdminCheckoutCollectionFactory, D2WidgetTable, ToolbarItems, widgetConstants, constants, serverQueryUtils, lang) {
  "use strict";
  var AdminCheckedOutTableView = D2WidgetTable.extend({
    constructor: function AdminCheckedOutTableView(options) {
      options.toolbarItems = ToolbarItems;
      options.d2collectionFactory = AdminCheckoutCollectionFactory;
      D2WidgetTable.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "error", this._onCollectionSyncError);
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.ADMIN_CHECKOUT, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.dialogTitle;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.ADMIN_CHECKOUT;
    },
    _onCollectionSyncError: function(errorResponse) {
      errorResponse.responseJSON = errorResponse.responseJSON || {};
      this.context.rejectPerspective(new Backbone.Model(), new Error(errorResponse.responseJSON.message));
    }
  });
  return AdminCheckedOutTableView;
});