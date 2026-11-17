/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/utils/landingpage/default.widget.types.map',
  'csui-ext!d2/sdk/utils/landingpage/default.widget.types.map'
], function(_, defaultWidgetTypesMap, extraTypeMaps){
  'use strict';

  /**
   * An extensible map that assigns a D2-Config widget type to a D2 Smart View default widget type
   *
   * New mapping entries could be added using extension
   * @example <caption>to register an extension, add in extension.json</caption>
   * {
   *   "d2/sdk/utils/landingpage/default.widget.types.map": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/landingpage/my.default.widget.types"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.default.widget.types.js is defined as</caption>
   * define([], function(){
   *    'use strict';
   *
   *    return [
   *      {defaultType: 'svcustomtype1', d2WidgetType: 'FavoritesWidget'}, // uses default error if the widget configuration can't be resolved
   *      {defaultType: 'svcustomtype2', d2WidgetType: 'FavoritesWidget', errMissingWidgetConfig: 'Widget for svcustomtype2 is not found'}, //custom error
   *      // Got more maps ? keep appending here.
   *    ];
   * });
   *
   * @module {d2/sdk/utils/landingpage/default.widget.types.map} d2/sdk/utils/landingpage/"default.widget.types.map"
   * @name DefaultWidgetsMap
   * @extends Object
   *
   */

  var typesMap = [];

  if (extraTypeMaps) {
    typesMap = typesMap.concat(_.flatten(extraTypeMaps, true));
    defaultWidgetTypesMap.addMaps(typesMap);
  }

  /**
   * @typedef {Object} MapEntry
   * @property {string} defaultType - Name of D2 Smart View default widget type
   * @property {string} d2WidgetType - Name of D2-Config widget type
   * @property {string} errMissingWidgetConfig - Error to be shown in the UI if the mapped widget type from D2-Config is not resolved.
   */

  /**
   * Return type. Each key in this object represents a default widget type name in D2 Smart View.
   * @typedef {Object} MapEntryReturnType
   * @property {string} key - Default widget type name
   * @property {Object} value - The map
   * @property {string} value.type - D2 widget type name
   * @property {string} value.errMissingWidgetConfig - Error to be shown if widget config is not resolved
   */

  /**
   * @name addMaps
   * @function
   * @memberOf module:DefaultWidgetsMap
   * @description Add new mapping entries. Recommended way is to get it added via extension mechanism, see example from above.
   * @param {MapEntry[]} newEntries - Entries to be added
   * @returns void
   *
   * @example <caption>New types could be added as</caption>
   * // It has to be made sure that this AMD module is loaded by some other module.
   * define(['d2/sdk/utils/landingpage/default.widget.types.map'], function(widgetTypesMap){
   *    'use strict';
   *
   *    widgetTypesMap.addMaps([
   *      {defaultType: 'svcustomtype1', d2WidgetType: 'FavoritesWidget'},
   *      {defaultType: 'svcustomtype2', d2WidgetType: 'FavoritesWidget', errMissingWidgetConfig: 'Widget for svcustomtype2 is not found'}
   *      // More entries could be added.
   *    ]);
   *
   *    // some other code
   * });
   */

  /**
   * @name getMaps
   * @function
   * @memberOf module:DefaultWidgetsMap
   * @description Get existing map entries
   * @returns {MapEntryReturnType}
   */

  return defaultWidgetTypesMap;
});