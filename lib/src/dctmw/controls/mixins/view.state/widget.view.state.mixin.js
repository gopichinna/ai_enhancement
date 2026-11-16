/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/widgets.utils" ], function(_, widgetUtils) {
  "use strict";
  return {
    setViewStateWidgetName: function(widgetName, options) {
      var viewStateModel = this.context.viewStateModel;
      return viewStateModel.setViewState("widget_name", widgetName, options);
    },
    getViewStateWidgetName: function() {
      return this.context.viewStateModel.getViewState("widget_name");
    },
    getInitialUrlParamsList: function() {
      return widgetUtils.getDefaultUrlParamsList();
    }
  };
});