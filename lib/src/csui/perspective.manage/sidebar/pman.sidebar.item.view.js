/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "smart/themes/theming", "hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.item", "csui/controls/icons.v2" ], function(Marionette, theming, SideBarItemTemplate) {
  "use strict";
  let PmanSideNavItemView = Marionette.View.extend({
    constructor: function PmanSideNavItemView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    tagName: "li",
    template: SideBarItemTemplate,
    templateContext: function() {
      return {
        iconClass: "csui-sidebar-" + this.model.get("name") + "-btn",
        tooltip: this.model.get("name"),
        isJato: theming.isJATOTheme()
      };
    },
    events: {
      "click .csui-sidebar-item:not(.binf-active)": function() {
        this.showPanel();
      },
      "keydown .csui-sidebar-item:not(.binf-active)": function(event) {
        if (event.key === "Enter" || event.key === " ") {
          this.showPanel();
        }
      }
    },
    showPanel: function() {
      const targetView = this.model.getPanelView(this.options);
      const title = this.model.getPanelTitle();
      this.trigger("show:panel", this, targetView, title);
    }
  });
  return PmanSideNavItemView;
});