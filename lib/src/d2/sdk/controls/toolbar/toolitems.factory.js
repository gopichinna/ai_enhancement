/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/toolbar/toolitems.factory'
], function(ToolItemsFactoryImpl){
  'use strict';

  /**
   * Create a new toolbar definiftion. The definition could be used to create a menubar in UI.
   *
   * @example <caption>Static toolbar configuration</caption>
   * define([
   *  'd2/sdk/controls/toolbar/toolitem.factory'
   * ], function(ToolitemsFactory){
   *  'use strict';
   *
   *  return {
   *    rightToolbar: new ToolitemsFactory({
   *      main: [
   *        {
   *          signature: 'D2-RefreshList',
   *          name: 'Refresh',
   *          iconName: 'csui_action_refresh32',
   *          enabled: true
   *        }
   *      ]
   *    }, {
   *      maxItemsShown: 1
   *      dropDownText: 'More',
   *      dropDownIconName: 'csui_action_more32'
   *    });
   *  };
   * });
   *
   * @module {d2/sdk/controls/toolbar/toolitems.factory} d2/sdk/controls/toolbar/"toolitems.factory"
   * @name ToolitemsFactory
   * @extends {Object}
   *
   */

  function cloneToolbarItems(toolbarItems) {
    return ToolItemsFactoryImpl.cloneToolbarItems.call(ToolItemsFactoryImpl, toolbarItems);
  }

  var ToolitemsFactory = ToolItemsFactoryImpl.extend({

    /**
     * @constructs
     * @name ToolitemsFactory
     * @param {object} toolItems - Key-value pairs where key represents a group name and value represents menu items under that group. Each value should be an array of `ToolitemType`
     * @param {object} options - Controls options
     * @param {number} options.maxItemsShown - Number of menus to be shown at max if this toolbar config is used to draw a menubar. Setting it to `0` shows the menu as dropdown
     * @param {string} options.dropDownText - Text shown for dropdown button
     * @param {string} options.dropDownIconName - Action icon name for the dropdown button.
     */
    constructor: function ToolitemsFactory(toolItems, options) {
      ToolitemsFactory.__super__.constructor.call(this, toolItems, options);
    }
  }, {
    cloneToolbarItems: cloneToolbarItems
  });

  /**
   * @typedef {Object} ToolitemType
   * @property {string} signature - Signature of the command bound to this menu item.
   * @property {string} name - Text displayed for this menu item.
   * @property {string} iconName - Action icon name for this menu
   * @property {*} commandData - Arbitrary data. Must have a `menuId` attribute for uniqueness and equality check.
   * @property {string} [subItemOf] - ID of the menu item for which the current item is a sub-menu
   * @property {*} [actionProperties] - Additional menu configuration data later used by matching command implementations.
   * @property {Boolean} [promoted=false] - Whether this menu is promoted. Promoted menus represent priority actions that are fetched and shown before others.
   * @property {string} type - Menu type. Should correlate with action types from D2-REST `actions` API.
   * @property {Boolean} [dynamic=false] - Whether this menu is a dynamic menu.
   * @property {Boolean} [enabled=false] - Whether this menu should be always enabled.
   */

  return ToolitemsFactory;
});