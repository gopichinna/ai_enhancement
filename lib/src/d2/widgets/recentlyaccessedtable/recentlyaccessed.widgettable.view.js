/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/recentlyaccessed", "d2/widgets/checkedouttable/toolbaritems", "d2/widgets/widgettable/widgettable.view", "d2/utils/widget.constants", "d2/utils/constants", "d2/utils/server.query.utils", "i18n!d2/widgets/recentlyaccessedtable/impl/nls/lang" ], function(module, $, _, Backbone, Marionette, RecentlyAccessedCollectionFactory, ToolbarItems, D2WidgetTable, widgetConstants, constants, serverQueryUtils, lang) {
  "use strict";
  var RecentlyAccessedTableView = D2WidgetTable.extend({
    constructor: function RecentlyAccessedTableView(options) {
      options.toolbarItems = ToolbarItems;
      options.d2collectionFactory = RecentlyAccessedCollectionFactory;
      D2WidgetTable.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.RECENTLY_ACCESSED, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.dialogTitle;
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.RECENTLYACCESSED;
    }
  });
  return RecentlyAccessedTableView;
});