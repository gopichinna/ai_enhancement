/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "smart/themes/theming", "csui/utils/node.links/node.links", "csui/behaviors/default.action/default.action.behavior", "csui/controls/listitem/impl/inline.menu/inline.menu.view", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tableactionbar/tableactionbar.view", "smart/controls/listitem/listitemstandard.view" ], function(_, theming, NodeLinks, DefaultActionBehavior, InlineMenuView, NodeTypeIconView, TableActionBarView, SmartStandardListItem) {
  "use strict";
  var StandardListItem = SmartStandardListItem.extend({
    constructor: function StandardListItem(options = {}) {
      options.getInlinMenuView = this.getInlinMenuView;
      options.getIconView = this.getIconView;
      options.defaultActionBehavior = {
        behaviorClass: DefaultActionBehavior
      };
      SmartStandardListItem.prototype.constructor.call(this, options);
      if (this.model?.get("id")) {
        this.model.set("href", NodeLinks.getUrl(this.model));
      }
      this.listenTo(this, "doc:preview:generic:actions", this._highlightRow);
    },
    _highlightRow: function(targetNode, HIGHLIGHT_CLASS_NAME) {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
      this.$el.addClass(HIGHLIGHT_CLASS_NAME);
    },
    getInlinMenuView: function(view) {
      const inlineBarElemOptions = {
        context: view.context,
        originatingView: view._parent ?? view,
        commands: view.defaultActionController.commands,
        model: view.model,
        tileViewToolbarItems: view.tileViewToolbarItems
      };
      if (!_.isEmpty(view?.tileViewToolbarItems?.inlineActionbar?.options)) {
        view.$el.addClass("csui-tile-with-more-btn");
        this._inlineMenuView = new InlineMenuView(inlineBarElemOptions);
      } else {
        view.$el.addClass("csui-row-with-inlineactions-btn");
        const inlineMenuViewOptions = _.extend({
          collection: view.tileViewToolbarItems.inlineActionbar,
          containerCollection: view.model.collection,
          status: {
            originatingView: view._parent
          }
        }, inlineBarElemOptions);
        this._inlineMenuView = new TableActionBarView(inlineMenuViewOptions);
      }
      return this._inlineMenuView;
    },
    getIconView: function(iconViewOptions) {
      theming.isJATOTheme() && (iconViewOptions.size = "small");
      return new NodeTypeIconView(iconViewOptions);
    }
  });
  return StandardListItem;
});