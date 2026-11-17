/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/widgets/widgettile/widgettile.view',
  'i18n!d2/sdk/widgets/list.tile/impl/nls/lang',
], function (WidgetTileView/*, lang*/) {
  'use strict';

  /**
   * Base class for all list type of tiles in D2 Smart View landing perspective.
   *
   * Each list tile has 4 different data states - Full (non-zero items), Empty(zero items),
   * ZeroResult(non-zero items but header filter yields zero matching item)
   * and Error (AJAX error while fetching data for the list). Empty, ZeroResult and Error states are
   * represented by a non-customizable background icon and customizable text message.
   * Each tile is already equipped with default message for these states, however those can be customized
   * if needed, by setting `emptyListText`, `zeroResults` and `failedListText` keys in the `lang` constructor option.
   *
   * @example <caption>A minimum sample list derivative may look like</caption>
   * //In mybundle/widgets/my.tile/my.tile.view.js
   * define([
   *  'd2/sdk/widgets/list.tile/list.tile.view',
   *  'mybundle/utils/contexts/factories/sample.tile.collection.factory'
   * ], function(ListTileView, SampleTileCollectionFactory){
   *    'use strict';
   *
   *    var SampleListTileView = ListTileView.extend({
   *      constructor: function SampleListTileView(options) {
   *        options = options || {};
   *        options.collectionFactory = SampleTileCollectionFactory;
   *
   *        SampleListTileView.__super__.constructor.call(this, options);
   *      }
   *    });
   *
   *    return SampleListTileView;
   * });
   *
   * @example <caption>To link this definition to the list of tiles looked up at landing page resolution time</caption>
   * //in mybundle/extensions/landing.tiles.js
   * define([], function(){
   *  'use strict';
   *
   *  return [{
   *    ...
   *    tileView: 'mybundle/widgets/my.tile/my.tile.view',
   *    ...
   *  }];
   * });
   *
   * @example <caption>Then finally the extension is registered in extension.json as</caption>
   * {
   *   "d2/sdk/utils/landingpage/tiles": {
   *      "extensions": {
   *         "mybundle": {
   *            "mybundle/extensions/landing.tiles"
   *         }
   *      }
   *    }
   * }
   *
   * @module {d2/sdk/widget/list.tile/list.tile.view} d2/sdk/widget/list.tile/"list.tile.view"
   * @name ListTileView
   * @extends {external:Marionette.CollectionView}
   */

  /**
   * @external "Marionette.CollectionView"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.collectionview.html
   */

  var SimpleListTileView = WidgetTileView.extend({

    /**
     * @constructs
     * @alias module:ListTileView
     * @name ListTileView
     * @param {object} options - constructor options
     * @param {ListTileData} [options.data] - Generic purpose data. Defaults to nothing.
     * @param {Factory} [options.collectionFactory] - A collection factory reference that will be used to create the collection that holds the data for this tile.
     * See {@link ../../utils/contexts/factories/factory|Factory}
     * @param {Backbone.Collection} [options.collection] - Reference to a collection instance to be used as data holder. Either one of `collectionFactory` or `collection` is required
     * If both are present in `options` then precedence is given to `collection`.
     * @param {object} [options.lang] - Translation keys to be used for displaying labels associated with this tile. Through keys `failedListText`, `emptyListText` & `zeroResults` the view's data state message can be customized.
     * @param {string} [options.orderBy] - Default sorting order for the data to be displayed in this tile. Defaults to `name asc` i.e sort by item names in ascending order.
     * @param {Boolean} [options.showTitleIcon] - Whether to show/hide icon for this tile. Defaults to `true`.
     * @param {Context} [options.context] - The application context. See {@link ../../utils/contexts/context.utils#Context|Context}
     * @param {Boolean} [options.showInlineActionBar] - Whether to show menu actions on this tile's items. Defaults to `true`. However, actual display of menu
     * depends on `toolbarItems` configuration and availability of actions against each list item.
     * @param {ToolItemsFactory} [options.toolbarItems] - The menu configuration for this tile's items. Default to Doclist menu configuration.
     * See {@link ../../controls/toolbar/toolitems.factory|ToolItemsFactory}
     * @param {string} [options.applicationScope] - Name of the application scope perspective which this tile may expand into. The value for this property
     * will be matched against all the registered application scopes. The relevant header button is enabled only if a match is found.
     * @param {Boolean} [options.hideOpenPerspective] - Whether to hide the header button that makes this tile expand into the linked application scope perspective.
     * Defaults to `false`.
     * @param {Boolean} [options.hideSearch] - Whether to hide the search box from tile header. Defaults to `false`.
     */
    constructor: function SimpleListTileView(options) {
      options = options || {};

      /*options.data.icon = options.icon;
      options.tileLang = options.lang || lang;
      if(options.showExpanded === undefined) {
        options.showExpanded = (options.perspectiveId === undefined) ? false : true;
      }

      if(!options.collectionFactory && !options.collection) {
        throw new Error('CollectionFactory or Collection is required');
      }
      if(!options.icon) {
        console.warn("Iconless tile will be rendered");
      }
      if(!options.lang) {
        console.warn("Good to have a lang file else generic messages will be shown");
      }
      if(options.showExpanded && !options.perspectiveId) {
        throw new Error("PespectiveId is required for expanded view");
      }*/


      SimpleListTileView.__super__.constructor.call(this, options);

      /*this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleReserveEvents: true
      });*/
    },

    /**
     * Get the name of factory param if this list view is backed by a collection factory.
     * For easy coupling factory param should be given a name same as the `propertyPrefix` of the backing collection factory.
     * @return {string} Should return the factory param name.
     * @instance
     */
    getFactoryParam: function() {
      var factoryProp = this.options.collectionFactory && this.options.collectionFactory.prototype.propertyPrefix;
      return factoryProp ? factoryProp : SimpleListTileView.__super__.getFactoryParam.apply(this, arguments);
    }
  });

  /**
   * @name onClickItem
   * @function
   * @description Handles what happens when a list item is clicked or equivalent user interaction happens.
   * The default implementation executes default action associated with the list item.
   * @param {Marionette.View} target - View instance associated with the item being clicked.
   * @return {void}
   * @instance
   */

  /**
   * @name onClickHeader
   * @function
   * @description Handles what happens when the tile's header is clicked. The default implementation tries to open
   * up linked application scope perspective, if any. Setting a special constructor option `avoidOpenPerspectiveOnHeader` to `true` prevents the
   * default behavior from happening.
   * @returns {void}
   * @instance
   */

  /**
   * @static
   * @name extend
   * @function
   * @description To define a derived type from `ListTileView`.
   * @param {object} protoProperties - Properties attached to the prototype of derived type.
   * @param {function} protoProperties.constructor - The function to be used to construct instance of the derived type.
   * @param {object} staticProperties - Properties statically attached to the derived type.
   * @returns {function} The derived type.
   */

  /**
   * Generic purpose data for the tile. Properties other than `icon` and `title` are directly merged with other constructor options.
   * @typedef {Object} ListTileData
   * @property {string} icon - CSS class name of the tile header icon
   * @property {string} title - Header label for the tile
   */

  return SimpleListTileView;

});
