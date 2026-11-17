/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jsonpath", "smart/controls/tab.panel/tab.links.ext.view", "d2/controls/tab.panel/d2tab.link.ext.view", "dctmw/utils/utils", "i18n!d2/controls/tab.panel/impl/nls/lang", "css!d2/controls/tab.panel/impl/tabPanel.links.view" ], function(_, Backbone, jsonPath, TabLinksExtView, D2TabLinkViewExt, utils, lang) {
  "use strict";
  var D2TabLinkCollectionViewExt = TabLinksExtView.extend({
    className: function() {
      return utils.isMobile() ? "d2mobile-tab-links-bar" : TabLinksExtView.prototype.className.call(this);
    },
    constructor: function D2TabLinkCollectionViewExt(options) {
      options.badgeEnabled = true;
      TabLinksExtView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "dctmw:metadata:schema:updated", function(model) {
        var tabLink = this.children.findByModel(model);
        if (tabLink) {
          if (model.attributes?.required && model.attributes?.requiredfields?.length > 0) {
            var badgeValue = model.attributes.requiredfields.length, fields = model.attributes.requiredfields;
            tabLink._setBadgeValue(badgeValue);
            tabLink._generateHTMLContent(lang.pleaseFill, fields);
          }
          tabLink.render();
        }
      });
      this.listenTo(this, "d2:formValidation", function(model) {
        var tabLink = this.children.findByModel(model);
        if (tabLink) {
          tabLink.$el.find(".d2-error-validation").remove();
          if (!tabLink.model.get("isValid")) {
            if (tabLink.model.get("spyhidden")) {
              var tabIndex = model.collection && model.collection.indexOf(model), previousTabLink;
              if (_.isNumber(tabIndex)) {
                tabIndex--;
                while (tabIndex >= 0) {
                  var previousModel = model.collection.at(tabIndex), previousTab = this.children.findByModel(previousModel);
                  if (previousTab.model.get("spyhidden")) {
                    tabIndex--;
                  } else {
                    tabIndex = -1;
                    previousTabLink = previousTab;
                  }
                }
              }
              tabLink = previousTabLink || tabLink;
              tabLink.$el.find(".d2-error-validation").remove();
            }
            var cssClasses = "d2-error-validation", tooltip = "error";
            tabLink.$el.find(".cs-tablink-text").after("<span class='" + cssClasses + "' aria-label='" + tooltip + "' title='" + tooltip + "'></span>");
          }
        }
      });
    },
    getChildView: function() {
      return D2TabLinkViewExt;
    },
    hideTabLinkConversion: function(tabLink) {
      if (tabLink.model.get("id") === "general" || tabLink.model.get("hideTabLinkConversion")) {
        tabLink.$el.addClass("binf-hidden");
      } else {
        tabLink.$el.removeClass("binf-active");
      }
    },
    onChildviewRender: function(tabLink) {
      this.applyChangesToSpyScroll(tabLink);
    },
    applyChangesToSpyScroll: function(tabLink) {
      if (utils.isMobile()) {
        var tabLinkUniqueId = tabLink.$el.find("a").attr("href");
        tabLinkUniqueId = tabLinkUniqueId && tabLinkUniqueId.indexOf("#") === 0 ? tabLinkUniqueId.substr(1) : tabLinkUniqueId;
        tabLink.$el.attr("data-id", tabLinkUniqueId);
        var isAccordionReq = tabLink.$el.find(".category_required");
        if (isAccordionReq && isAccordionReq.length !== 0) {
          tabLink.$el.addClass("d2mobile-accordion accordion-required");
        } else {
          tabLink.$el.addClass("d2mobile-accordion");
        }
      }
      var alreadyHidden = tabLink.$el.hasClass("binf-hidden");
      if (tabLink.model.get("spyhidden") || tabLink.model.get("hidden") || tabLink.model.get("options").hideTab) {
        if (!alreadyHidden) {
          tabLink.$el.addClass("binf-hidden");
        }
        tabLink.$el.find(">a").attr("data-cstabindex", -1);
      } else if (alreadyHidden) {
        tabLink.$el.removeClass("binf-hidden");
        tabLink.$el.find(">a").removeAttr("data-cstabindex");
      }
      this.options?.suppressSpyScroll && this.hideTabLinkConversion(tabLink);
      this.triggerMethod("refresh:tabable:elements", this);
    }
  });
  return D2TabLinkCollectionViewExt;
});