/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/content.assist'
], function(ContentAssistUtilImpl){
  'use strict';

  /**
   * Utility to fetch ContentAssist dialog related options
   *
   * @module {d2/sdk/utils/content.assist} d2/sdk/utils/"content.assist"
   * @name ContentAssistDialogUtil
   * @extends {Object}
   */

  return {
    /**
     * Get content assist dialog configuration
     * @param {object} options - options holder
     * @param {Context} options.context - Application runtime context. See {@link ./contexts/context.utils#Context|Context}.
     * @returns {jQuery.Promise} resolves & invokes `ContentAssistConfigCallback` on success, rejects otherwise.
     * @memberOf module:ContentAssistDialogUtil
     */
    getContentAssistConfig: function(options) {
      return ContentAssistUtilImpl.getContentAssistConfig(options);
    },

    /**
     * Gets and caches the configuration for Content Assist dialog.
     * @param {object} options - options holder
     * @param {Context} options.context - Application runtime context. See {@link ./contexts/context.utils#Context|Context}.
     * @returns {jQuery.Promise} resolves & invokes `ContentAssistOptionsCallback` on success, rejects otherwise.
     * @memberOf module:ContentAssistDialogUtil
     */
    getContentAssistOptions: function(options) {
      return ContentAssistUtilImpl.getContentAssistOptions(options);
    }
  };

  /**
   * @callback ContentAssistConfigCallback
   * @param {Object} response - Raw AJAX response.
   */

  /**
   * @callback ContentAssistOptionsCallback
   * @param {ContentAssistConfigHolder} config
   */

  /**
   * @typedef {Object} ContentAssistConfigHolder
   * @property {string} label_value - Display name of the Content Assist Dialog.
   * @property {ContentAssistConfig} properties - Raw properties associated with this config.
   */

  /**
   * @typedef {Object} ContentAssistConfig
   * @property {string} r_object_id - Documentum object id.
   * @property {string} object_name - Documentum object name.
   * @property {boolean} has_browse_assist - Whether to enable browsing mode in this dialog.
   * @property {boolean} has_favorites_assist - Whether to show favorited objects in this dialog.
   * @property {boolean} has_recent_assist - Whether to show recently accessed objects in this dialog.
   * @property {boolean} has_search_assist - Whether to enable searching in this dialog.
   */
});