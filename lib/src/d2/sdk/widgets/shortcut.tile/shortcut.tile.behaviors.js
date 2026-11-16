/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'csui-ext!d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors'
], function(_, extBehaviors){
  'use strict';

  /**
   * Collection of all registered shortcut behaviors. Used by shortcut tiles on D2 Smart View landing perspective to define what happens when a particular
   * shortcut tile is clicked.
   *
   * To implement a new shortcut behavior and get it registered with this collection, see -
   *
   * * {@link ./shortcut.tile.behavior|ShortcutBehavior}
   *
   * @module {d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors} d2/sdk/widgets/shortcut.tile/"shortcut.tile.behaviors"
   * @name ShortcutTileBehaviorCollection
   * @extends {Array}
   */

  var shortcutBehaviors = [];

  if (extBehaviors) {
    shortcutBehaviors = extBehaviors.concat(_.flatten(extBehaviors, true));
  }

  return shortcutBehaviors;
});
