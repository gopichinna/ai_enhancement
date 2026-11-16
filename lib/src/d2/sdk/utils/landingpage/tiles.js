/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/utils/load-extensions/ext.utils',
  'd2/utils/landingpage/tiles',
  'dctm-ext!d2/sdk/utils/landingpage/tiles'
], function (extUtil, tileCollection, extraTileDefinitions) {
  'use strict';

  /**
   * Tile definition collection. Each tile definition describes its priority, association type, pre-requisite and finally a view that is used as the
   * representation of the tile. Based on priority a particular definition is picked from this collection to finally render D2 Smart View landing page.
   *
   * @see {@link ../widget.constants|WidgetConstants} for some related pre-defined constants.
   *
   * New definitions could be added to this collection by means of extension.
   * @example <caption>to register an extension, add in extension.json</caption>
   * {
   *   "d2/sdk/utils/landingpage/tiles": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/utils/landingpage/my.tiles"
   *         }
   *      }
   *    }
   * }
   *
   * @example <caption>whereas my.tiles.js is defined as</caption>
   * define(['d2/sdk/utils/widget.constants', 'i18n!mybundle/utils/landingpage/impl/nls/lang'], function(widgetConstants, lang){
   *    'use strict';
   *
   *    function validateURLShortcutConfig(widgetConfig, options) {
   *        var validation = {status: true};
   *        if (!widgetConfig.widgetParams && !widgetConfig.widgetParams.open_url) {
   *          validation.status = false; // It will be considered as a validation error
   *          validation.errorMessage = lang.openUrlWidgetMissing;
   *        }
   *        return validation;
   *    }
   *
   *    // See 'LandingTile' documentation for all possible properties with their usage
   *    return [
   *      {type: 'CreateFile', icon: 'icon-new', isShortcut: true, tileConfigType: widgetConstants.TileConfigTypes.NONE}, // widget configuration-less shortcut tile
   *      {type: 'OpenURLWidget', icon: 'icon-url', isShortcut: true, validateConfig: validateURLShortcutConfig}, // shortcut tile that needs & validates a widget configuration
   *      {
   *        // A widget tile that relies on the default widget validation
   *        type: 'CheckoutDocumentWidget',
   *        icon: 'title-checkout',
   *        tileView: 'mybundle/widgets/newcheckout',
   *        errMissingWidgetConfig: lang.checkoutWidgetMissing,
   *        applicationScope: 'checkedout'
   *      }
   *      // Any other definition
   *    ];
   * });
   *
   * @module {d2/sdk/utils/landingpage/tiles} d2/sdk/utils/landingpage/tiles
   * @name TileCollection
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  var tileDefinitions = [];

  if (extraTileDefinitions) {
    tileDefinitions = tileDefinitions.concat(extUtil.parseExtensions(extraTileDefinitions));
    tileCollection.add(tileDefinitions, {merge: true});
  }

  /**
   * @typedef {Object} LandingTile
   * @property {number} [sequence=1000] - Priority of this definition. For matching `type` property values, the definition with least value for `sequence` will be used.
   * @property {string} type - Association type of this tile. It should be set with a value from the enumeration `ShortcutType`, or any D2 widget type name.
   * Additional shortcut types or widget types declared by a D2 plugin also could be used.
   * @property {string} icon - CSS class name of the icon to be shown on the tile. For non-shortcut tiles, the icon is shown in the tile header.
   * @property {boolean} [isShortcut=false] - Whether it's shortcut tile or widget tile? `true` indicates a shortcut.
   * @property {TileConfigTypes} [tileConfigType=TileConfigTypes.WIDGET] - Tiles that don't require a widget config should set it to `TileConfigTypes.NONE`. See {@link ../widget.constants#TileConfigTypes|TileConfigTypes}.
   * @property {string} [tileView] - Not required for shortcut tiles. For other tiles it should point to a folder implementing the view to be associated with this tile. E.g For a path `mybundle/widget/somefolder` the runtime
   * will look for a `somefolder.view.js` within the `somefolder` directory. Alternatively it can be specified as just a name like `mytile`, in that case the tile's view will be resolved as
   * `<bundle_src_folder>/widgets/mytile/mytile.view.js`.
   * @property {ShortcutClickHandler} [clickHandler] - Callback to be executed only for those shortcut tiles that neither specifies an `applicationScope` (see below) nor a matching shortcut behavior
   * is found in the registry. See {@link ../../widgets/shortcut.tile/shortcut.tile.behaviors|ShortcutBehaviors}.
   * @property {ConfigValidatorCallback} [validateConfig] - Callback to validate the resolved widget config.
   * @property {TileOptionBuilderCallback} [buildTileOptions] - Callback to build tile options that would be passed to the `tileView` while constructing.
   * @property {string} [errMissingWidgetName] - The error to be shown if a tile definition requires a widget config but the corresponding D2 Smart View landing page configuration
   * fails to specify a name for it. If unspecified, a generic error message is shown.
   * @property {string} [errMissingWidgetConfig] - The error to be shown if a tile definition requires a widget config but a suitable widget configuration could not be resolved for some reason.
   * @property {string} [applicationScope] - The application scope in which this tile will expand into. Tile expansion is enabled only if this value matches one of the registered application scope perspective's id.
   * See {@link ../perspectives/app.scope.perspectives|ApplicationScopePerspectives}. For shortcut tiles, clicking anywhere in the tile activates the expansion. For list type of tiles, the tile header or
   * a dedicated 'Expand' button could be clicked to activate the expansion.
   *
   *
   */

  /**
   * OOTB D2SV shortcut types
   * @enum {string}
   * @name ShortcutType
   * @property CreateFile - New file shortcut
   * @property UploadFile - Import files shortcut
   * @property CreateUploadFile - Combined New/Import file shortcut
   * @property UploadFolder - Import folder shortcut
   * @property QueryFormObject - Query form shortcut
   * @property QueryObject - Saved query/search shortcut
   */

  /**
   * Callback function that validates a widget configuration for a tile
   *
   * @callback ConfigValidatorCallback
   * @param {Object} widgetConfig - The widget configuration being validated
   * @param {Object} [options] - Any additional context specific data that is not part of `widgetConfig` but might be relevant for validation
   * @returns {ConfigValidatorReturnType}
   */

  /**
   * @typedef {Object} ConfigValidatorReturnType
   * @property {boolean} status - `true` indicates validation succeeded, `false` otherwise.
   * @property {string} [errorMessage] - Error message to be shown in UI if the validation failed.
   */

  /**
   * Callback function that builds options for a tile
   *
   * @callback TileOptionBuilderCallback
   * @param {Object} tile - Parsed tile object from D2 Smart View landing page configuration. New properties could be attached to this object as part of forming additional option.
   * @param {Object} [widgetConfig] - Any relevant widget configuration, applicable only if the tile requires a widget configuration.
   * @returns {void}
   */

  /**
   * Callback to handle click event for a shortcut tile
   *
   * @callback ShortcutClickHandler
   * @param {object} options - The options container.
   * @param {Context} options.context - `context` object associated with the runtime. See {@link ../contexts/context.utils#Context|Context}.
   * @param {string} options.widgetName - Name of the widget configuration if the shortcut is of type `TileConfigTypes.WIDGET`. See {@link ../widget.constants#module_WidgetConstants.TileConfigTypes|TileConfigTypes}.
   * @param {object} options.widgetParams - Any parameters associated with the resolved widget configuration. Applicable only if the shortcut is of type `TileConfigTypes.WIDGET`. See {@link ../widget.constants#TileConfigTypes|TileConfigTypes}.
   * @returns {void}
   */

  return tileCollection;
});
