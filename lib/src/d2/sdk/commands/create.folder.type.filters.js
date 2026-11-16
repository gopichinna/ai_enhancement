/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/commands/create.folder.type.filter',
  'csui-ext!d2/sdk/commands/create.folder.type.filters'
], function(_, folderTypeFilters, extFilters){
  'use strict';

  /**
   * Type filter collection. Defines which Documentum types should be considered while creating a folder.
   *
   * This collection augments the default functionality of `D2-CreateFolder` command.
   *
   * `dm_folder` is the root Documentum type that represents a folder, any sub-type of it can also represent a folder.
   *
   * New types could be introduced by extension
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/commands/create.folder.type.filters": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/commands/my.folder.type.filter"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.folder.type.filter.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return function(typeData) {
   *      // This is the function that implements a custom filter condition
   *      return typeData.name === 'my_dctm_custom_folder_type';
   *    };
   * });
   *
   * @module {d2/sdk/commands/create.folder.type.filters} d2/sdk/commands/"create.folder.type.filters"
   * @name CreateFolderTypeFilter
   * @extends Object
   *
   */

  if(extFilters) {
    folderTypeFilters.addFilters(_.flatten(extFilters, true));
  }

  /**
   * This is a callback type that implements the condition of a filter.
   *
   * @callback FolderTypeFilterCondition
   * @param {object} typeData - Data representing a Documentum type
   * @param {string} typeData.name - Name of the documentum type
   * @returns {boolean} Should return `true` if the type should be included, `false` otherwise.
   */

  /**
   * @name addFilters
   * @function
   * @memberof module:CreateFolderTypeFilter
   * @description To manually register new type filters without using the 'extension' way.
   * @param {FolderTypeFilterCondition[]} newFilters - Array of callbacks that returns `true` or `false` to include or exclude a type respectively.
   */

  /**
   * @name filter
   * @function
   * @memberof module:CreateFolderTypeFilter
   * @description To retrieve the list of filtered types that can be used while creating a folder.
   * @param {object[]} types - Documentum types.
   * @param {string} types[].name - Name of a Documentum type.
   * @returns {object[]} The filtered types.
   */

  return folderTypeFilters;
});
