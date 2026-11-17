/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/server.query.utils'
], function(ServerQueryUtilsImpl){
  'use strict';

  /**
   * A general utility to access/process some commonly used D2-REST resources outside of a `Backbone.Model` or `Backbone.Collection`.
   * @module {d2/sdk/utils/server.query.utils} d2/sdk/utils/"server.query.utils"
   * @name ServerQueryUtils
   * @extends Object
   */

  return {
    /**
     * Form a query appended URL from a base URL, thus facilitates to make AJAX calls.
     * @param {string} url - The base URL.
     * @param {Object} options - The options hash to control URL generation.
     * @param {string} options.scope - The scope of the target D2-REST resource
     * @param {boolean} options.paginate - Whether to paginate the URL.
     * @return {String} The formed URL.
     * @static
     */
    appendQueryParams: function(url, options) {
      return ServerQueryUtilsImpl.appendQueryParams(url, options);
    },

    /**
     * Parses response from D2-REST resource.
     * @param {JSON} response - Raw response from server.
     * @param {Object} options - The options hash to control parsing.
     * @param {string} options.scope - The scope of the target D2-REST resource
     * @param {boolean} options.paginate - Whether to extract page information from the response.
     * @return {JSON} The parsed response.
     * @static
     */
    parseResponse: function(response, options) {
      return ServerQueryUtilsImpl.parseResponse(response, options);
    },

    /**
     * Fetch column preferences for a widget. It caches the preference data for a given widget type and name,
     * the first time it is fetched, and returns the data from this cache next time onwards.
     * @param {Object} options - Request options holder.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {*} options.scope - Scope of the request, usually should point to the related data model. E.g. when calling in the context of a collection, it should be the collection itself.
     * @param {string} options.widgetType - Type of the widget config.
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     * @param {Object} [options.columnOptions] - Options for the columns data, used while converting server columns to client columns
     * @param {boolean} [options.columnOptions.typeColumn] - Include type column
     * @param {boolean} [options.columnOptions.reservedColumn] - Include object lock status column
     * @param {boolean} [options.columnOptions.commentColumn] - Include comments column
     * @param {boolean} [options.columnOptions.favoriteColumn] - Include favorite status column
     * @returns {jQuery.Promise} resolves & invokes `ColumnPreferenceDoneCallback` on success, rejects otherwise.
     * @static
     */
    fetchColumnPreferences: function(options) {
      return ServerQueryUtilsImpl.fetchColumnPreferences(options);
    },

    /**
     * Save column preferences for a widget
     * @param {Object} options - Request options holder.
     * @param {string} options.widgetType - Type of the widget config.
     * @param {string} options.widgetName - Name of the widget config.
     * @param {string} [options.defaultType] - Default column types.
     * @param {external:ColumnPreferenceModel} options.columnPreference - The new preference data.
     * @param {string} options.sortOrder - Specify a sort order.
     * @returns {jQuery.Promise} resolves and invokes `ColumnPreferenceDoneCallback` on success, rejects otherwise.
     * @static
     */
    saveColumnPreferences: function(options) {
      return ServerQueryUtilsImpl.saveColumnPreferences(options);
    },

    /**
     * Get widget configuration object.
     * @param {string} widgetType - Type of the widget config.
     * @param {string} widgetName - Name of the widget config.
     * @returns {object} The widget config
     * @throws `Error` if any of the parameters are `null` or `undefined` or empty.
     * @static
     */
    getWidgetConfig: function (widgetType, widgetName) {
      return ServerQueryUtilsImpl.getWidgetConfig(widgetType, widgetName);
    },

    /**
     * Fetch user's permission level for the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {string} options.permissionLevel - Level of permission to check. Any of Documentum permission i.e 'browse', 'read', 'relate', 'version', 'write', 'delete'
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchPermissions: function(options){
      return ServerQueryUtilsImpl.fetchPermissions(options);
    },

    /**
     * Fetch user's favorite(subscription) status of the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchFavorites: function(options) {
      return ServerQueryUtilsImpl.fetchFavorites(options);
    },

    /**
     * Fetch allowed actions for the objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {string} options.menuType - Type of actions to be fetched. See `MenuTypes` from {@link ./constants|Constants}.
     * @param {string} options.widgetType - Type of widget for which menu is required (e.g. DoclistWidget). See `D2` from {@link ./widget.constants#module_WidgetConstants.D2|WidgetConstants.D2}
     * @param {string} options.queryAction - Types of actions to request. Possible values are PROMOTED, NON-PROMOTED and ALL. Default is ALL
     * @param {string[]} [options.parentIds] - List of parent ids in case the objects are renditions. It has to have a positional correspondence with `ids` i.e `parentIds[0]` should be the parent of `id[0]`.
     * @param {string[]} [options.associateIds] - List of associated object ids in case the objects are relations. It has to have a positional correspondence.
     * @param {string} [options.rulesType=node] - Rule collection to be used for filtering the actions. Can be one of 'user', 'node'.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchActions: function(options){
      return ServerQueryUtilsImpl.fetchActions(options);
    },

    /**
     * Fetch locations of the given objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {boolean} [options.fullPath=false] - Whether to parse full path or just include the immediate parent.
     * @param {boolean} [options.ancestorDetails] - Whether to fetch the parent node details along with location information
     * @returns {jQuery.Promise} on success it resolves and invokes callback with list of object specific responses
     * @static
     */
    fetchLocations: function(options){
      return ServerQueryUtilsImpl.fetchLocations(options);
    },

    /**
     * A single call to fetch different aspects of the objects. It can be used to fetch permission, favorited status, actions, locations, external share status,
     * preview formats and relation count for multiple objects
     * @param {Object} options - Request options holder.
     * @param {string[]} options.ids - Documentum object IDs.
     * @param {Connector} options.connector - AJAX transport. See {@link ./contexts/factories/connector|Connector}.
     * @param {(boolean|Object)} [options.permissions] - Fetch permissions.
     * @param {string} options.permissions.permissionLevel - Level of permission to check. Any of Documentum permission i.e 'browse', 'read', 'relate', 'version', 'write', 'delete'
     * @param {boolean} [options.favorites] - Fetch favorited status.
     * @param {ActionRequestType} [options.actions] - Fetch actions as per specified options.
     * @param {(boolean|Object)} [options.locations] - Fetch locations.
     * @param {boolean} [options.locations.fullPath=false] - Parse full path of each location.
     * @param {boolean} [options.ancestorDetails] - Whether to fetch the parent node details along with location information
     * @param {boolean} [options.externalShare=false] - Fetch external share status.
     * @param {boolean} [options.previewFormats=false] - Fetch preview formats.
     * @param {boolean} [options.relationsCount=false] - Fetch relations count.
     * @returns {jQuery.Promise} on success it resolves and invokes callback with separate maps representing permissions, favorites, actions etc. depending on what was requested.
     * @static
     */
    fetchDataForObjects: function(options) {
      return ServerQueryUtilsImpl.fetchDataForObjects(options);
    },

    /**
     * Works the same as fetchDataForObjects(), additionally collects related data for every objects individually into a
     * single object hash, as per most commonly used property naming conventions for NodeModel, so that the data can be easily merged
     * with any target NodeModel.
     * @param options Same as the options parameter for fetchDataForObjects().
     * @returns jQuery.Promise
     * @static
     */
    fetchDataAsPropertiesForObjects: function(options) {
      return ServerQueryUtilsImpl.fetchDataAsPropertiesForObjects(options);
    }
  };

  /**
   * @external ColumnPreferenceModel
   * @see ../models/table/column.preference
   */

  /**
   * Actions request type
   * @typedef {Object} ActionRequestType
   * @property {string} menuType - Type of actions to be fetched. See `MenuTypes` from {@link ./constants|Constants}.
   * @property {string} widgetType - Type of widget for which menu is required (e.g. DoclistWidget). See `D2` from {@link ./widget.constants#D2|WidgetConstants}
   * @property {string} [queryAction] - Types of actions to request. Possible values are PROMOTED, NON-PROMOTED and ALL. Default is ALL
   * @property {string[]} [parentIds] - List of parent ids in case the objects are renditions. It has to have a positional correspondence with `ids` i.e `parentIds[0]` should be the parent of `id[0]`.
   * @property {string[]} [associateIds] - List of associated object ids in case the objects are relations. It has to have a positional correspondence with `ids`.
   * @property {string} [rulesType=node] - Rule collection to be used for filtering the actions. Can be one of 'user', 'node', 'vdoc'.
   * @property {string} [vdFrameIds] - List of virtual document frame id. It has to have a positional correspondence with `ids`. Applies only if `rulesType` is set to `'vdoc'`.
   * @property {string[]} [vdRelationIds] - List of virtual document relation id. It has to have a positional correspondence with `ids`. Applies only if `vdFrameIds` is set.
   * @property {string[]} [vdmNumbers] - List of virtual document sequence numbers calculated relative to `vdFrameIds`. It has to have a positional correspondence with `ids`. Applies only if `vdFrameIds` is set.
   */

  /**
   * @callback ColumnPreferenceDoneCallback
   * @param {ResolvedColumnDefinition[]} clientColumns - Converted columns
   * @param {external:ColumnPreferenceModel} colPref - The server column preference
   */

  /**
   * Client-side column definition
   * @typedef {Object} ResolvedColumnDefinition
   * @property {string} key - unique identifier of this column
   * @property {string} column_key - Bound Documentum type attribute of this column
   * @property {number} definitions_order - Order of appearance, the order increases from left to right while laying out in a table format.
   * @property {string} [name] - Display label
   * @property {string} [title] - Tooltip
   * @property {boolean} [order=false] - If the column can be re-arranged in the client-side.
   * @property {boolean} [sort=true] - If the column supports click-to-sort behavior
   * @property {string} [d2_sort_key=<column_key>] - Specify a different sort key.
   * @property {string} [direction=''] - Sorting direction. Can be one of 'asc' or 'desc'. Ignored if `sort` is set to false.
   * @property {boolean} [filter=false] - If the column can be filtered with text search
   * @property {string} [filter_key=<column_key>] - Specify a different filter key.
   * @property {boolean} [default_action=false] - Should this column support 'click-to-execute-default-action' behavior.
   * @property {number} type - Documentum data type of this column, -7:Date, -4:Double, -1:String, 2:Integer, 5:Boolean
   * @property {string} type_name - Readable type name. One of Date, Double, String, Integer, Boolean
   *
   */
});
