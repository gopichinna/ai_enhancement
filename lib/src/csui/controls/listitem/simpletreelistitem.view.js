/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/controls/node-type.icon/node-type.icon.view", "csui/utils/node.links/node.links", "csui/behaviors/default.action/default.action.behavior", "csui/controls/listitem/impl/inline.menu/inline.menu.view", "smart/controls/listitem/simpletreelistitem.view" ], function(_, $, NodeTypeIconView, NodeLinks, DefaultActionBehavior, InlineMenuView, SmartSimpleTreeListItemView) {
  "use strict";
  var SimpleTreeListItemView = SmartSimpleTreeListItemView.extend({
    constructor: function SimpleTreeListItemView(options = {}) {
      options.getInlinMenuView = this.getInlinMenuView;
      options.setNodeLinks = this.setNodeLinks;
      options.getIconView = this.getIconView;
      options.defaultActionBehavior = {
        behaviorClass: DefaultActionBehavior
      };
      SmartSimpleTreeListItemView.prototype.constructor.call(this, options);
    },
    _highlightRow: function(targetNode, HIGHLIGHT_CLASS_NAME) {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
      this.$el.addClass(HIGHLIGHT_CLASS_NAME);
    },
    getInlinMenuView: function(options) {
      var self = this;
      this._inlineMenuView = new InlineMenuView({
        context: options.context,
        originatingView: options._parent?._parent ?? options,
        commands: options.defaultActionController.commands,
        model: options.model,
        tileViewToolbarItems: options.tileViewToolbarItems
      });
      return this._inlineMenuView;
    },
    getIconView: function(iconViewOptions) {
      return new NodeTypeIconView(iconViewOptions);
    },
    setNodeLinks: function(itemView) {
      if (itemView?.model?.get("id")) {
        itemView.model.set("href", NodeLinks.getUrl(itemView.model));
      }
    }
  });
  return SimpleTreeListItemView;
});