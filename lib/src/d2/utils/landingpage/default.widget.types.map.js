/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/widget.constants", "i18n!d2/server.adaptors/models/impl/nls/lang", "csui-ext!d2/utils/landingpage/default.widget.types.map" ], function(_, widgetConstants, lang, extDefMaps) {
  "use strict";
  var defWidgetMap = {};
  defWidgetMap[widgetConstants.DEFAULT.VERSIONS] = {
    type: widgetConstants.D2.VERSIONS
  };
  defWidgetMap[widgetConstants.DEFAULT.RENDITIONS] = {
    type: widgetConstants.D2.RENDITIONS
  };
  defWidgetMap[widgetConstants.DEFAULT.RELATIONS] = {
    type: widgetConstants.D2.RELATIONS
  };
  defWidgetMap[widgetConstants.DEFAULT.DOCLIST] = {
    type: widgetConstants.D2.DOCLIST,
    errMissingWidgetConfig: lang.doclistWidgetUnavailable
  };
  defWidgetMap[widgetConstants.DEFAULT.SEARCH] = {
    type: widgetConstants.D2.DOCLIST,
    errMissingWidgetConfig: lang.searchWidgetUnavailable
  };
  defWidgetMap[widgetConstants.DEFAULT.FAVORITES] = {
    type: widgetConstants.D2.FAVORITES
  };
  defWidgetMap[widgetConstants.DEFAULT.BRAVACSR] = {
    type: widgetConstants.D2.BRAVACSR
  };
  defWidgetMap[widgetConstants.DEFAULT.VDOC] = {
    type: widgetConstants.D2.VDOC
  };
  defWidgetMap[widgetConstants.DEFAULT.TASKS] = {
    type: widgetConstants.D2.TASKS
  };
  defWidgetMap[widgetConstants.DEFAULT.TASK_ATTACHMENTS] = {
    type: widgetConstants.D2.TASK_ATTACHMENTS
  };
  defWidgetMap[widgetConstants.DEFAULT.MY_WORKFLOWS] = {
    type: widgetConstants.D2.WORKFLOWS
  };
  defWidgetMap[widgetConstants.DEFAULT.ALL_WORKFLOWS] = {
    type: widgetConstants.D2.WORKFLOWS
  };
  defWidgetMap[widgetConstants.DEFAULT.ADMIN_WORKFLOWS] = {
    type: widgetConstants.D2.ADMIN_WORKFLOWS
  };
  defWidgetMap[widgetConstants.DEFAULT.BRAVAENTERPRISE] = {
    type: widgetConstants.D2.BRAVAENTERPRISE
  };
  defWidgetMap[widgetConstants.DEFAULT.BRAVAIV] = {
    type: widgetConstants.D2.BRAVAIV
  };
  defWidgetMap[widgetConstants.DEFAULT.COLLECTIONS] = {
    type: widgetConstants.D2.COLLECTIONS
  };
  defWidgetMap[widgetConstants.DEFAULT.LOCATIONS] = {
    type: widgetConstants.D2.LOCATIONS
  };
  defWidgetMap[widgetConstants.DEFAULT.AUDIT] = {
    type: widgetConstants.D2.AUDIT
  };
  function addMaps(extraDefaultWidgetTypesMap) {
    _.each(extraDefaultWidgetTypesMap, function(map) {
      if (_.isObject(map) && map["defaultType"] && map["d2WidgetType"] && !defWidgetMap[map["defaultType"]]) {
        defWidgetMap[map["defaultType"]] = {
          type: map["d2WidgetType"],
          errMissingWidgetConfig: map["errMissingWidgetConfig"]
        };
      }
    });
  }
  function getMaps() {
    return _.deepClone(defWidgetMap);
  }
  if (extDefMaps) {
    addMaps(_.flatten(extDefMaps, true));
  }
  return {
    addMaps: addMaps,
    getMaps: getMaps
  };
});