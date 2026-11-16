/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'smart/controls/icons.v2/icons.v2',
  'csui-ext!d2/sdk/controls/action.icons/action.icons'
], function(_, IconRegistryImpl, extraIcons){
  'use strict';

  if (extraIcons) {
    if (_.isArray(extraIcons)) {
      for (var i = 0; i < extraIcons.length; i++) {
        var iconsMap = extraIcons[i];
        IconRegistryImpl.registerIcons(iconsMap);
      }
    } else {
      IconRegistryImpl.registerIcons(extraIcons);
    }
  }

  /**
   * Action icon registry. Allows registering new action icons through extension.
   * Also provides managed API to look up a registered action icon given its name.
   *
   * New action icons can be registered through extension
   * @example <caption>to register an extension, add in extension.json</caption>
   *
   * {
   *   "d2/sdk/controls/action.icons/action.icons": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/theme/action.icons"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas action.icons.js is defined as</caption>
   *
   * define([], function(){
   *    'use strict';
   *
   *    return {
   *      'mybundle_action_1': '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2__d2_action_abort_workflow"><path d="M16,30c7.732,0,14-6.268,14-14c0-7.732-6.268-14-14-14C8.268,2,2,8.268,2,16 C2,23.732,8.268,30,16,30z" fill="none" class="csui-icon-v2-state"/><path d="M16,8c-4.418,0-8,3.582-8,8c0,4.418,3.582,8,8,8s8-3.582,8-8C24,11.582,20.418,8,16,8z M9.778,16 c0-3.436,2.786-6.222,6.222-6.222c1.373,0,2.641,0.444,3.67,1.197l-8.695,8.695C10.222,18.641,9.778,17.372,9.778,16z M16,22.222 c-1.423,0-2.734-0.478-3.783-1.281l8.724-8.724c0.804,1.049,1.281,2.36,1.281,3.783C22.222,19.436,19.436,22.222,16,22.222z" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M16,31.5c8.56,0,15.5-6.94,15.5-15.5c0-8.56-6.94-15.5-15.5-15.5C7.44,0.5,0.5,7.44,0.5,16 C0.5,24.56,7.44,31.5,16,31.5z" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
   *      'mybunle_action_2': '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2__d2_action_view_notes"><circle cx="16" cy="16" r="14" fill="none" class="csui-icon-v2-state"/><g><path d="M20,7h-9C9.897,7,9,7.888,9,8.98v13.859c0,1.092,0.897,1.979,2,1.979h10c1.103,0,2-0.888,2-1.979V9.97L20,7z M22,22.839c0,0.54-0.448,0.979-1,0.979H11c-0.551,0-1-0.439-1-0.979V8.98C10,8.439,10.449,8,11,8h8.588L22,10.387V22.839z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M12.5,11.75c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75h7c0.414,0,0.75-0.336,0.75-0.75 s-0.336-0.75-0.75-0.75H12.5z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M19.5,15.75h-7c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75h7c0.414,0,0.75-0.336,0.75-0.75 S19.914,15.75,19.5,15.75z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M18,19.75h-5.5c-0.414,0-0.75,0.336-0.75,0.75s0.336,0.75,0.75,0.75H18c0.414,0,0.75-0.336,0.75-0.75 S18.414,19.75,18,19.75z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/></g><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>'
   *    };
   * });
   *
   * @module {d2/sdk/controls/action.icons/action.icons} d2/sdk/controls/action.icons/"action.icons"
   * @name ActionIconRegistry
   * @extends external:Backbone.Collection
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  return {
    /**
     * Register action icons.
     * @param {object} icons - A hash of key value pairs, such that key represents an icon name and value is the string serialized svg content.
     * @return {void}
     * @throws Error If an icon name matches with any of already registered icons.
     * @static
     */
    registerIcons: function (icons) {
      return IconRegistryImpl.registerIcons(icons);
    },

    /**
     * Find an action icon by name.
     * @param {string} iconName - Name of the action icon being looked up.
     * @return {string} Matched icon content or a generalized missing icon if given name is not found in the registry.
     * @static
     */
    getIconByName: function(iconName) {
      return IconRegistryImpl.getIconByName(iconName);
    },

    /**
     * Find an icon and return decored copy with supplied options
     * @param {object} iconOptions
     * @param {string} iconOptions.iconName - Find the icon by this name.
     * @param {string} iconOptions.theme - Decorate found icon with css class `csui-icon-v2-theme-<theme>`
     * @param {boolean} iconOptions.allStateByElement - Whether to decorate icon with all possible state CSS classes.
     * @param {boolean} iconOptions.hoverStateByElement - Decorate with mouse hover state CSS class.
     * @param {boolean} iconOptions.activeStateByElement - Decorate with mouse left button down state CSS class.
     * @param {boolean} iconOptions.focusStateByElement - Decorate with keyboard focus state CSS class.
     * @param {boolean} iconOptions.disabledStateByElement - Decorate with disabled state CSS class.
     * @param {boolean} iconOptions.states - Whether the icon is capable of showing different states.
     * @param {boolean} iconOptions.handleRTL - Whether the icon is capable of handling RTL.
     * @param {boolean} iconOptions.on - Decorate icon with on state CSS class.
     * @param {string} iconOptions.filter - Apply filter. Only supported value is `grayscale`. `theme`, `states` & `on` must be false.
     * @param {string} iconOptions.colorTheme - Apply a coloring scheme. Applies only when `theme`, `states` & `on` are `false`. Possible values are
     * `'tree', 'outline-light', 'outline-dark', 'ot-navy', 'ot-indigo', 'ot-plum', 'ot-teal', 'ot-light-blue', 'ot-steal', 'ot-cloud'`.
     * @return {string} Matched icon content or the missing icon after decorating it with given options.
     * @static
     */
    getIconByNameWithOptions: function (iconOptions) {
      return IconRegistryImpl.getIconByNameWithOptions(iconOptions);
    }
  };
});