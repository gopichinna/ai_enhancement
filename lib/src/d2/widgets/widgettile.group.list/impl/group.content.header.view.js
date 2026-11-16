/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/utils/nodesprites", "hbs!d2/widgets/widgettile.group.list/impl/group.content.header", "i18n!d2/widgets/widgettile.group.list/impl/nls/lang", "css!d2/widgets/widgettile.group.list/impl/group.content.header" ], function(Marionette, NodeSpritesCollection, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "d2-widget-tile-content-header-view",
    template: template,
    templateHelpers: function() {
      return {
        enableIcon: this.options.enableIcon,
        name: this.options.name,
        subtitle: this.options.subtitle,
        indicateRequired: this.options.indicateRequired,
        initialExpand: this.options.initialExpand,
        expandTitle: lang.expandTitle,
        collapseTitle: lang.collapseTitle,
        icon: NodeSpritesCollection.findByNode(this.options.node).get("className")
      };
    },
    ui: {
      expandCollapse: ".d2-group-expandCollapse",
      headerPanel: ".d2-group-panel-container"
    },
    events: {
      "click @ui.headerPanel": "onClickExpandCollapse"
    },
    constructor: function GroupContentHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onClickExpandCollapse: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.ui.expandCollapse.toggleClass([ "expand", "collapse" ]);
      this.ui.expandCollapse.attr("title", this.ui.expandCollapse.hasClass("collapse") ? lang.collapseTitle : lang.expandTitle);
      var isExpanded = this.ui.expandCollapse.hasClass("collapse");
      this.trigger("d2:widget:tile:group:expand:collapse", isExpanded);
      if (isExpanded) {
        this.adjustScrollOnExpand();
      }
    },
    adjustScrollOnExpand: function() {
      if (this.options.groupContentView && this.options.groupContentView.groupPanelView) {
        var me = this, groupContentView = me.options.groupContentView, groupPanelView = groupContentView.groupPanelView;
        setTimeout(function() {
          var scrollHeight = me.options.groupContentView.groupPanelView.el.scrollHeight, groupContentHeight = groupContentView.$el.outerHeight(), groupPanelHeight = groupPanelView.$el.outerHeight(), $focusableEl = groupContentView.contentView.$el.find("[tabindex]:visible:not([disabled])").first(), focusableElementTop = $focusableEl.offset().top - groupPanelView.$el.offset().top, scrollTopPosition = scrollHeight - groupContentHeight;
          if (focusableElementTop > groupPanelHeight) {
            me.options.groupContentView.groupPanelView.$el.scrollTop(scrollTopPosition);
          }
        }, 10);
      }
    }
  });
});