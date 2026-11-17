/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/utils/commandhelper',
  'd2/overrides/csui/utils/commandhelper'
], function(CommandHelperImpl){
  'use strict';

  /**
   * A few frequently used functions that helps reduce code duplication across {@link external:CommandModel} implementations.
   *
   * @module {d2/sdk/utils/commandhelper} d2/sdk/utils/commandhelper
   * @name CommandHelper
   * @extends {Object}
   *
   */

  /**
   * @external NodeModel
   * @see ../models/node.model
   */

  /**
   * @external CommandModel
   * @see ../commands/command
   */

  /**
   * @external BlockingView
   * @see ../controls/blocker
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  return {
    /**
     * Get exactly one node from the given `status`
     * @param {object} status - The `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {external:NodeModel} Returns the first node from `status.nodes`.
     * @memberOf module:CommandHelper
     */
    getJustOneNode: function(status) {
      return CommandHelperImpl.getJustOneNode(status);
    },

    /**
     * Get the most matching action of a node for a given command signature. Used for disambiguation of an action when it may be present multiple times due to repetitive menu config.
     * @param {external:NodeModel} node - The node whose actions are being looked up
     * @param {string} signature - The command signature being looked up
     * @param {object} [commandData] - `commandData` associated with the `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {ActionModel} Returns the action that matches most. if `commandData` is not passed, the first action matching the `signature` is returned.
     * @memberOf module:CommandHelper
     */
    getOriginalAction: function (node, signature, commandData) {
      return CommandHelperImpl.getOriginalAction(node, signature, commandData);
    },

    /**
     * Get the URL for given linkrel ID from the most matching action of a node. Internally calls {@link module:CommandHelper.getOriginalAction} to lookup the matching action.
     * @param {external:NodeModel} node - The node whose actions are being looked up
     * @param {string} signature - The command signature being looked up
     * @param {string} linkrel - Linkrel identifier being looked up.
     * @param {object} [params] - If the link relation points to an href-template, then resolve the template using these params.
     * @param {object} [commandData]  - `commandData` associated with the `status` parameter from {@link external:CommandModel}'s `enabled` or `execute` methods.
     * @returns {String} the URL
     * @memberOf module:CommandHelper
     */
    getOriginalActionLink: function (node, signature, linkrel, params, commandData) {
      return CommandHelperImpl.getOriginalActionLink(node, signature, linkrel, params, commandData);
    },

    /**
     * Refresh the attributes of a node from server in the context of a widget
     * @param {external:NodeModel} node - The node being refreshed
     * @param {object} [widgetConfig] - Widget configuration to set the context of refresh
     * @param {string} widgetConfig.widgetName - Name of the widget
     * @param {string} widgetConfig.widgetType - Type of the widget
     * @returns {jQuery.Promise} it is `resolve()`-ed only if the refresh is successful, `reject()`-ed otherwise.
     * @memberOf module:CommandHelper
     */
    refreshNode: function (node, widgetConfig) {
      return CommandHelperImpl.refreshNode(node, widgetConfig);
    },

    /**
     * Show an error toast associated with a node.
     * @param {external:NodeModel} node - The node to associate the message with
     * @param {string} errMessage - Brief message to be shown
     * @param {string} detailMessage - Verbose detail of the `errMessage`. The detail is shown in an expandable region of the toast.
     * @returns {*} the toast instance
     * @memberOf module:CommandHelper
     */
    showErrorPanel: function (node, errMessage, detailMessage) {
      return CommandHelperImpl.showErrorPanel(node, errMessage, detailMessage);
    },

    /**
     * Enable blocker UI.
     * @param {external:Marionette.View} view - A view instance infused with the progress blocker API. See {@link external:BlockingView}.
     * @returns {void}
     * @memberOf module:CommandHelper
     */
    blockD2ViewActions: function (view) {
      CommandHelperImpl.blockD2ViewActions(view);
    },

    /**
     * Disable blocker UI.
     * @param {external:Marionette.View} view - A view instance infused with the progress blocker API. See {@link external:BlockingView}.
     * @returns {void}
     * @memberOf module:CommandHelper
     */
    unblockD2ViewActions: function (view) {
      CommandHelperImpl.unblockD2ViewActions(view);
    }
  };
});