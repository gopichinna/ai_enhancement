/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/perspective.manage/impl/widget.list.view", "csui/perspective.manage/sidebar/widget.panel.item.view", "css!csui/perspective.manage/sidebar/impl/widget.panel.list.css" ], function(_, $, WidgetListView, WidgetPanelItemView) {
  "use strict";
  const WidgetPanelListView = WidgetListView.extend({
    constructor: function WidgetPanelListView(options) {
      this.options = options || {};
      this.options.data || (options.data = {});
      WidgetListView.prototype.constructor.apply(this, arguments);
    },
    renderItem: function(model) {
      let parentView = this;
      const itemView = new WidgetPanelItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, "widgets:expanded", _.bind(this.trigger, this, "dom:refresh", this));
      if (this.options?.query) {
        itemView.trigger("expand:header");
      }
      $(this.el).append(itemView.el);
    }
  });
  return WidgetPanelListView;
});