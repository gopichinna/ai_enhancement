/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'csui/utils/nodesprites',
  'csui-ext!d2/sdk/controls/icon.sprites/node.icon.sprites'
], function(_, nodeIconSprites, extIcons){
  'use strict';

  /**
   * Node icons collection. Used to visually represent a {@link ../../models/node.model|NodeModel} within a `NodeIconView`.
   *
   * The collection can be looked up to discover possible representation or it can be augmented by extension
   *
   * @example <caption>To extend the node icons collection</caption>
   * //In mybundle/extensions/node.icons.js
   * define([], function(){
   *  'use strict';
   *
   *  return [
   *    {
   *      decides: function(node) {
   *        return node.get('type') === 'group';
   *      },
   *      className: 'csui-icon d2-icon-type-group-user',
   *      mimeType: 'Group',
   *      sequence: 20
   *    },
   *    {
   *      decides: function(node) {
   *        return node.get('type') === 'user';
   *      },
   *      className: 'csui-icon d2-icon-type-single-user',
   *      mimeType: 'User',
   *      sequence: 20
   *    }
   *  ];
   * });
   *
   * //To register the extension, put in extensions.json
   *  "d2/sdk/controls/icon.sprites/node.icon.sprites": {
   *    "extensions": {
   *      "mybundle": [
   *        "mybundle/extensions/node.icons"
   *      ]
   *    }
   *  }
   *
   * @module {d2/sdk/controls/icon.sprites/node.icon.sprites} d2/sdk/controls/icon.sprites/"node.icon.sprites"
   * @name NodeIconSprites
   * @extends {external:Backbone.Collection}
   */

  /**
   * @external "Backbone.Collection"
   * @see https://backbonejs.org/#Collection
   */

  if(extIcons) {
    nodeIconSprites.add(_.flatten(extIcons, true));
  }

  return nodeIconSprites;
});
