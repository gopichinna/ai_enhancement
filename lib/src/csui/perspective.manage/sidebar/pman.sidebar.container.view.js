/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/widgets/navigation.header/controls/help/help.view", "csui/perspective.manage/sidebar/pman.sidebar.item.view", "csui/models/sidebar.items", "csui/perspective.manage/sidebar/sidebar.items", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.app.header.icons", "i18n!csui/perspective.manage/sidebar/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/pman.sidebar.container", "css!csui/perspective.manage/sidebar/impl/pman.sidebar.container", "csui/controls/icons.v2" ], function(Marionette, HelpView, PmanSidebarItemView, SidebarItemCollection, SidebarMenuItems, theming, jatoActionIcons, jatoHeaderIcons, lang, template) {
  "use strict";
  let PManSideBarContainerView = Marionette.CompositeView.extend({
    tagName: "div",
    template: template,
    templateContext: function() {
      return {
        sideBarCloseIcon: lang.sideBarCloseIcon,
        help: lang.help,
        isJato: theming.isJATOTheme(),
        jatoIconHelp: jatoHeaderIcons.actionHelpCircle,
        jatoIconClose: jatoActionIcons.actionCloseSmall
      };
    },
    ui: {
      slideTitle: ".csui-sidebar-slide-title",
      slideBody: ".csui-sidebar-slide-body",
      closeIcon: ".csui-sidebar-slide-close",
      helpIcon: ".csui-ribbon-panel .icon-help",
      helpOTIcon: ".csui-ribbon-panel .otIcon-help",
      sideBarItem: ".csui-sidebar-item",
      sidebarSlideContainer: ".csui-sidebar-slide-container"
    },
    className: "csui-sidebar-panel",
    events: {
      "keydown @ui.sidebarSlideContainer": "onKeyDownSidebarPanel",
      "keydown @ui.sideBarItem": "onOpenPanelKeyDown",
      "click @ui.closeIcon": "closeSlidePanel",
      "click @ui.helpIcon": "onClickHelp",
      "click @ui.helpOTIcon": "onClickHelp",
      "keydown @ui.helpIcon": "onKeydownHelp",
      "keydown @ui.closeIcon": "onKeydowncloseIcon"
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
      this.listenTo(options.context, "open:rules", this.openSettingsPanel);
      this.listenTo(options.context, "close:sidepanel", this.closeSlidePanel);
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
      this.ui.closeIcon.attr({
        id: text
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
      let leftRibbonFocusableElements = this.el.querySelectorAll("otc-button:not(:disabled), button:not(:disabled)");
      let settingIcons = Array.from(this.el.querySelectorAll(".csui-pman-sidebar-ribbon li"));
      let currentFocusedElementIndex = settingIcons.indexOf(event.target.parentElement);
      switch (event.key) {
       case "ArrowUp":
        if (currentFocusedElementIndex > 0) {
          leftRibbonFocusableElements[currentFocusedElementIndex - 1].focus();
        }
        event.preventDefault();
        break;

       case "ArrowDown":
        event.preventDefault();
        if (currentFocusedElementIndex < leftRibbonFocusableElements.length - 1 && currentFocusedElementIndex >= 0) {
          leftRibbonFocusableElements[currentFocusedElementIndex + 1].focus();
        }
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab") {
          this.options?.context?.pmanView?.ui.addPageBtn[0].focus();
        } else {
          this._setFocusOnFirstWidget();
        }
        event.preventDefault();
        break;

       case "Escape":
        this.closeSlidePanel();
        break;
      }
    },
    onKeyDownSidebarPanel: function(event) {
      let sidebarActiveMenuItem;
      if (event.key === "Escape") {
        sidebarActiveMenuItem = this.el.querySelector(".csui-ribbon-panel [toggled]");
        this.closeSlidePanel();
        sidebarActiveMenuItem.focus();
      }
    },
    onKeydownHelp: function(event) {
      let settingFocusableActions = this.el.querySelectorAll("otc-button:not(:disabled), button:not(:disabled)");
      switch (event.key) {
       case "ArrowUp":
        settingFocusableActions[settingFocusableActions.length - 1].focus();
        break;

       case "Tab":
        this._setFocusOnFirstWidget();
        break;
      }
    },
    onKeydowncloseIcon: function(event) {
      switch (event.key) {
       case "Enter":
        this.closeSlidePanel();
        this._setFocusOnSettingItem(event);
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab") {
          this._setFocusOnSettingItem(event);
        }
        break;
      }
    },
    _setFocusOnFirstWidget: function() {
      let focusableEle = document.querySelectorAll(".cs-perspective-panel .cs-perspective .csui-pman-editable-widget")[0];
      let shortcutButton = focusableEle.querySelector(".shortcut-group-wrapper");
      if (shortcutButton?.getAttribute("tabindex") === "0") {
        shortcutButton.focus();
      } else {
        focusableEle.querySelectorAll(".wrapper-button")[0].focus();
      }
    },
    _setFocusOnSettingItem: function(event) {
      let sidebarActiveItem = ".csui-sidebar-" + event.target.getAttribute("id") + "-btn";
      document.querySelector(sidebarActiveItem).focus();
      event.preventDefault();
    },
    setActive: function(childView) {
      this.clearActive();
      childView.el.querySelector(".csui-sidebar-item").setAttribute("toggled", "");
      if (childView.model.has("initialFocusTarget")) {
        this.ui.sidebarSlideContainer[0]?.querySelector(childView.model.get("initialFocusTarget"))?.focus();
      } else {
        this.ui.slideBody[0]?.querySelectorAll("*[tabindex], button, input.search-widget")[0]?.focus();
      }
    },
    clearActive: function() {
      this.el.querySelectorAll(".csui-sidebar-item").forEach(ele => ele.removeAttribute("toggled"));
    },
    openSettingsPanel: function() {
      if (this.children.length === 0) {
        return;
      }
      const childView = this.children.find(el => el.model?.get("signature") === "Settings");
      if (childView) {
        const settingsPanelView = childView.model?.getPanelView(this.options);
        const title = childView.model?.getPanelTitle();
        this.onChildShowPanel(childView, settingsPanelView, title);
      }
    }
  });
  return PManSideBarContainerView;
});