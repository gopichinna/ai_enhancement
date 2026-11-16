/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "smart/controls/tab.panel/tab.link.view", "nuc/utils/types/localizable", "hbs!smart/controls/tab.panel/impl/tab.link.ext", "i18n!smart/controls/tab.panel/impl/nls/lang", "i18n", "smart/dialogs/modal.alert/modal.alert", "smart/utils/smart.base", "smart/lib/binf/js/binf", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16" ], function(_, $, TabLinkView, localizable, tabLinkExtTemplate, lang, i18n, ModalAlert, base) {
  "use strict";
  var TabLinkViewExt = TabLinkView.extend({
    template: tabLinkExtTemplate,
    templateHelpers: function() {
      var uniqueTabId = this.model.get("uniqueTabId"), title = this._getTitle(), tabPanel = this.options.tabPanel, badgeEnabled = tabPanel?.options?.badgeEnabled && this?.model?.attributes?.badgeValue !== undefined;
      return {
        linkId: "tablink-" + uniqueTabId,
        required_tooltip: lang.requiredTooltip,
        delete_icon: this.options.delete_icon || "circle_delete",
        delete_tooltip: this.options?.delete_tooltip ? _.str.sformat(lang.deleteTooltip, this.options?.delete_tooltip) : lang.deleteTabToolTip,
        deleteTabAria: _.str.sformat(lang.deleteTabAria, title),
        tabTitle: title,
        allow_delete: this?.model?.attributes?.allow_delete ?? false,
        required: this?.model?.attributes?.required ?? false,
        badgeEnabled: badgeEnabled,
        badgeValue: badgeEnabled ? this?.model.get("badgeValue") : ""
      };
    },
    attributes: function() {
      var tabName = this._getTitle(), tabPanel = this.options?.tabPanel, required = this?.model?.attributes?.required ?? false, badgeEnabled = tabPanel?.options?.badgeEnabled && this?.model?.attributes?.badgeValue !== undefined, badgeValue = badgeEnabled ? this?.model.get("badgeValue") : "", deletable = (tabPanel?.options?.deletable && this?.model?.attributes?.allow_delete) ?? false, ariaLabel;
      if (required) {
        if (badgeEnabled) {
          ariaLabel = _.str.sformat(lang.requiredTabWithCountAria, tabName, badgeValue);
        } else if (deletable) {
          ariaLabel = _.str.sformat(lang.requiredTabWithDeleteAria, tabName);
        } else {
          ariaLabel = _.str.sformat(lang.requiredTabAria, tabName);
        }
      } else {
        if (badgeEnabled) {
          ariaLabel = _.str.sformat(lang.tabWithCountAria, tabName, badgeValue);
        } else if (deletable) {
          ariaLabel = _.str.sformat(lang.tabWithDeleteAria, tabName);
        } else {
          ariaLabel = tabName;
        }
      }
      return {
        "data-csui-tab": this.model.get("name"),
        "aria-label": ariaLabel,
        role: "tab",
        tabIndex: -1,
        "aria-selected": "false"
      };
    },
    events: {
      "show.binf.tab > a": "onShowingTab",
      "shown.binf.tab > a": "onShownTab",
      "focus .cs-delete-icon": "onFocusDeleteIcon",
      "blur .cs-delete-icon": "onBlurDeleteIcon",
      "click .cs-delete-icon": "onDelete"
    },
    ui: {
      link: ">a",
      deleteIcon: ".cs-delete-icon",
      deleteIconParent: ".cs-tablink-delete"
    },
    constructor: function TabLinkViewExt(options) {
      this.options = options || {};
      TabLinkView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "action:updated", function() {
        this._setRemoveable();
      });
      let activeTab = this.$el.hasClass("binf-active");
      if (activeTab) {
        this.el.querySelector("otc-badge") && this.el.querySelector("otc-badge").setAttribute("isactive", "");
      }
      this.listenTo(this, "activate:tab", this._makeBadgeActive);
    },
    onRender: function() {
      this._setRemoveable();
      this._index === 0 && this._makeBadgeActive();
    },
    _makeBadgeActive: function() {
      let tabPanel = this.options.tabPanel, activeTabBadge = tabPanel.el.querySelectorAll("otc-badge[isactive]");
      if (activeTabBadge.length !== 0) {
        activeTabBadge[0].removeAttribute("isactive");
      }
      this.el.querySelector("otc-badge") && this.el.querySelector("otc-badge").setAttribute("isactive", "");
    },
    _getTitle: function() {
      var title = this.model.get("title"), tabTitle;
      if (_.isObject(title)) {
        var defaultValue = "", loadableLocales = i18n.settings.loadableLocales;
        for (var i = 0; i < loadableLocales.length; i++) {
          var locale = loadableLocales[i].toLowerCase();
          if (!!title[locale]) {
            defaultValue = title[locale];
            break;
          }
        }
        tabTitle = localizable.getClosestLocalizedString(title, defaultValue);
      } else {
        tabTitle = title;
      }
      return tabTitle;
    },
    _setRemoveable: function() {
      if (!!this.model.get("removeable")) {
        this.ui.deleteIcon.addClass("removeable");
        this.ui.deleteIcon.removeClass("binf-hidden");
      } else {
        this.ui.deleteIcon.removeClass("removeable");
        this.ui.deleteIcon.addClass("binf-hidden");
      }
    },
    onFocusDeleteIcon: function() {
      this.ui.deleteIconParent.addClass("focused");
    },
    onBlurDeleteIcon: function() {
      this.ui.deleteIconParent.removeClass("focused");
    },
    onDelete: function(event) {
      event.preventDefault();
      this._deleteTab();
    },
    _deleteTab: function() {
      let message = _.str.sformat(lang.removeTabDialog, this?.model.get("name") ? this.model.get("name") : this.model.get("title")), title = lang.removeTab;
      let dialogBtns = {
        showYes: true,
        showCancel: true,
        showNo: false,
        labelYes: lang.removeTab,
        labelCancel: lang.cancelTab
      };
      ModalAlert.confirmWarning(message, title, {
        buttons: dialogBtns
      }).done(_.bind(this._removeTab, this)).fail(_.bind(function(err) {
        let tabPanel = this.options.tabPanel;
        let isKeyEvent = tabPanel.isKeyEvent;
        if (!!isKeyEvent) {
          this.$el?.trigger("focus");
        }
      }, this));
    },
    _activateSpecificTab: function(tabIndex = 0) {
      let tabPanel = this.options.tabPanel;
      var previousTab = tabPanel.tabLinks.children.findByIndex(tabIndex);
      tabPanel._autoScrollTabTo(tabIndex, {
        animationOff: true
      }).done(function() {
        previousTab && previousTab.activate();
        tabPanel._showHideNavigationButtons();
      });
    },
    _removeTab: function() {
      if (this.model.get("allow_delete") === true && this.model.get("removeable") === true) {
        let isActive = this.$el.hasClass("binf-active");
        let tabPanel = this.options.tabPanel;
        let activeVisible = tabPanel.isTabVisible(tabPanel.el.querySelector(".binf-active")) && !isActive;
        let isKeyEvent = tabPanel.isKeyEvent;
        if (isActive && tabPanel.options.mode !== "spy") {
          let activeIndexonDeletion = this._index !== this.options?.collection?.length - 1 ? this._index + 1 : this._index - 1;
          this._activateSpecificTab(activeIndexonDeletion);
          base.onTransitionEnd(this.options.tabPanel.$el, _.bind(() => {
            this.options.tabPanel.trigger("remove:tab", this.model);
            this.options.collection.remove(this.model);
            this.options.tabPanel.trigger("delete:tab", this._index, activeVisible);
            if (!!isKeyEvent) {
              let tabLinks = this.options?.tabPanel?.tabLinks;
              tabLinks.keyboardBehavior.refreshTabableElements(tabLinks);
              if (this._index === this.options.collection.length) {
                tabPanel.tabLinksBarChildren[this._index - 1]?.focus();
                tabPanel.scrollToFocusedTab(this._index - 1);
              } else {
                tabPanel.tabLinksBarChildren[this._index]?.focus();
                tabPanel.scrollToFocusedTab(this._index);
              }
            }
          }, this));
        } else {
          this.options.tabPanel.trigger("remove:tab", this.model);
          this.options.collection.remove(this.model);
          this.options.tabPanel.trigger("delete:tab", this._index, activeVisible);
          if (isActive) {
            this._activateSpecificTab(this._index);
          }
          if (!!isKeyEvent) {
            let tabLinks = this.options?.tabPanel?.tabLinks;
            tabLinks.keyboardBehavior.refreshTabableElements(tabLinks);
            if (this._index === this.options.collection.length) {
              tabPanel.tabLinksBarChildren[this._index - 1]?.focus();
              tabPanel.scrollToFocusedTab(this._index - 1);
            } else {
              tabPanel.tabLinksBarChildren[this._index]?.focus();
              tabPanel.scrollToFocusedTab(this._index);
            }
          }
        }
      }
    }
  });
  return TabLinkViewExt;
});