/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'dctmw/controls/tree/tree.sprites',
  'csui-ext!d2/sdk/controls/icon.sprites/tree.icon.sprites'
], function(_, treeIconSprites, extIcons){
  'use strict';

  /**
   * Tree icons collection. Used to visually represent a {@link ../../models/node.model|NodeModel} within a `TreeView`.
   *
   * The collection can be looked up to discover possible representation or it can be augmented by extension
   *
   * See {@link ./node.icon.sprites|NodeIconSprites} for sample extension definition. Registering the extension is also
   * similar except the target module
   *
   * @example <caption>To register an extension</caption>
   * // Assuming that mybundle/extensions/tree.icons.js is the extension
   * // Add to extension.json as shown below
   *
   * "d2/sdk/controls/icon.sprites/tree.icon.sprites": {
   *    "extensions": {
   *      "mybundle": [
   *        "mybundle/extensions/tree.icons"
   *      ]
   *    }
   *  }
   *
   * @module {d2/sdk/controls/icon.sprites/tree.icon.sprites} d2/sdk/controls/icon.sprites/"tree.icon.sprites"
   * @name TreeIconSprites
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  if(extIcons) {
    treeIconSprites.add(_.flatten(extIcons, true));
  }

  return treeIconSprites;
});
