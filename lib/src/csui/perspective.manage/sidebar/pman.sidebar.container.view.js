/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/widgets/navigation.header/controls/help/help.view", "csui/perspective.manage/sidebar/pman.sidebar.item.view", "csui/models/sidebar.items", "csui/perspective.manage/sidebar/sidebar.items", "i18n!csui/perspective.manage/sidebar/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.container", "css!csui/perspective.manage/sidebar/impl/pman.sidebar.container", "csui/controls/icons.v2" ], function(Marionette, HelpView, PmanSidebarItemView, SidebarItemCollection, SidebarMenuItems, lang, template) {
  "use strict";
  let PManSideBarContainerView = Marionette.CompositeView.extend({
    tagName: "div",
    template: template,
    templateContext: function() {
      return {
        sideBarCloseIcon: lang.sideBarCloseIcon
      };
    },
    ui: {
      slideTitle: ".csui-sidebar-slide-title",
      slideBody: ".csui-sidebar-slide-body",
      closeIcon: ".csui-sidebar-slide-close",
      helpIcon: ".csui-ribbon-panel .icon-help"
    },
    className: "csui-sidebar-panel",
    events: {
      keydown: "onOpenPanelKeyDown",
      "click @ui.closeIcon": "closeSlidePanel",
      "click @ui.helpIcon": "onClickHelp"
    },
    childViewContainer: "ul.csui-pman-sidebar-ribbon",
    childView: PmanSidebarItemView,
    childViewOptions: function() {
      return this.options;
    },
    childViewTriggers: {
      "set:active": "child:set:active",
      "show:panel": "child:show:panel"
    },
    onRender: function() {
      this.el.closest(".csui-sidebar")?.classList.remove("csui-sidebar-open");
      this.slideRegion = new Marionette.Region({
        el: this.ui.slideBody
      });
    },
    constructor: function PManSideBarContainerView(options) {
      this.options = options || {};
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      let self = this;
      let sidebarItems = new SidebarItemCollection();
      SidebarMenuItems.filter(item => item.isEnabled(self.options) && sidebarItems.add(item));
      this.collection = sidebarItems;
      this.helpView = new HelpView(options);
    },
    onChildShowPanel(childView, View, name) {
      this.openSlidePanel(View, name);
      this.setActive(childView);
    },
    onChildSetActive(childView) {
      this.setActive(childView);
    },
    openSlidePanel: function(view, text) {
      this.slideRegion.show(view);
      this.el.closest(".csui-sidebar")?.classList.add("csui-sidebar-open");
      this.ui.slideTitle.text(text);
      this.ui.slideTitle.attr({
        "aria-label": text,
        title: text
      });
    },
    closeSlidePanel: function() {
      this.el.closest(".csui-sidebar")?.classList.remove("csui-sidebar-open");
      this.clearActive();
    },
    onClickHelp: function() {
      this.helpView.triggerMethod("click:help", "editpage");
    },
    onOpenPanelKeyDown: function(event) {
      if (event.key === "Escape") {
        this.closeSlidePanel();
      }
    },
    setActive: function(childView) {
      this.clearActive();
      childView.el.querySelector(".csui-sidebar-item").classList.add("binf-active");
    },
    clearActive: function() {
      this.el.querySelectorAll(".csui-sidebar-item").forEach(ele => ele.classList.remove("binf-active"));
    }
  });
  return PManSideBarContainerView;
});