/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import RestResources from "dctmw/utils/rest.resources";

import widgetConstants from "d2/utils/widget.constants";

import lang from "i18n!d2/server.adaptors/models/impl/nls/lang";

export default [ {
  widgetType: widgetConstants.D2.BWS,
  widgetTitle: lang.bwsWidgetTitle,
  resolveWidgetForType: function() {
    let defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
    return defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.BWS];
  },
  perspectiveLayout: {
    canEditPerspective: false,
    type: "left-center-right",
    options: {
      center: {
        type: widgetConstants.SMARTUI.BWS
      }
    }
  },
  resolveDataForPerspective: function(response) {
    let bwsIdAttribute = "dm_bws_aspect.bws_id";
    if (response?.properties && response?.properties[bwsIdAttribute]) {
      response.properties.bws_id = response.properties[bwsIdAttribute];
    }
  },
  decides: function(response) {
    let bwsIdAttribute = "dm_bws_aspect.bws_id", id = response?.properties?.r_object_id;
    return id?.indexOf("81") === 0 || response?.properties && response?.properties[bwsIdAttribute];
  }
} ];