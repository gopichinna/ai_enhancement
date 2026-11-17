/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/jsonpath", "smart/controls/tab.panel/tab.link.ext.view", "dctmw/utils/utils" ], function(_, $, _Backbone, _jsonPath, TabLinkExtView, _utils) {
  "use strict";
  var D2TabLinkViewExt = TabLinkExtView.extend({
    constructor: function D2TabLinkViewExt(options) {
      this.options = options || {};
      TabLinkExtView.prototype.constructor.apply(this, arguments);
    },
    events: _.extend({}, TabLinkExtView.prototype.events, {
      "mouseenter @ui.badgeIcon": "showPopover",
      "mouseleave @ui.badgeIcon": "hidePopover",
      "click @ui.link": "onClickTabLink"
    }),
    ui: _.extend({}, TabLinkExtView.prototype.ui, {
      badgeIcon: ".smart-tab-contents-count"
    }),
    initialize: function() {
      TabLinkExtView.prototype.initialize.apply(this, arguments);
    },
    templateHelpers: function() {
      var tabLinkExtViewHelper = TabLinkExtView.prototype.templateHelpers.call(this), tabPanel = this.options.tabPanel;
      tabLinkExtViewHelper.badgeEnabled = tabPanel?.options?.badgeEnabled;
      this.tabId = tabLinkExtViewHelper.linkId;
      return tabLinkExtViewHelper;
    },
    _setBadgeValue: function(value) {
      if (!value) return;
      if (typeof value === "number") {
        this.count = value;
      } else if (typeof value === "string") {
        this.count = Number(value);
      }
      this.once("render", function() {
        var badge = this.$("otc-badge");
        if (badge !== undefined) {
          badge.attr("value", value);
        }
      });
    },
    activate: function() {
      if (!this.options?.suppressSpyScroll) {
        TabLinkExtView.prototype.activate.call(this, arguments);
      }
    },
    onClickTabLink: function() {
      this.onShownTab();
    },
    _setPopOverContent: function(content) {
      this.content = content;
    },
    showPopover: _.debounce(function() {
      var tabId = "#" + this.tabId;
      if (typeof this.count === "number" && this.count > 0) {
        this.popoverOptions = {
          content: this.content,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          viewport: $(tabId),
          template: '<div class="binf-popover bordered-popover role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: this.getPopoverPlacement()
        };
        this.ui.badgeIcon.binf_popover(this.popoverOptions);
        this.ui.badgeIcon.binf_popover("show");
      }
    }, 200),
    getPopoverPlacement: function() {
      var offset = this.ui.badgeIcon.offset(), countWidth = this.ui.badgeIcon.outerWidth(), calc_width = $(window).width() - (offset.left + countWidth);
      return calc_width > 260 ? "right" : "left";
    },
    _generateHTMLContent: function(title, fields) {
      var html = "<div class='tab-pop-over'>" + "<h3 class='pop-over-title'>" + title + "</h3><hr/>";
      fields.forEach(function(field) {
        html += "<p class='pop-over-item'>" + field + "</p>";
      });
      html += "</div>";
      this.content = html;
    },
    hidePopover: _.debounce(function(event) {
      event.stopPropagation();
      event.preventDefault();
      event.type !== "focusout" && this.ui.badgeIcon.data("binf.popover") && this.ui.badgeIcon.data("binf.popover").tip().hasClass("binf-in");
      this.ui.badgeIcon.binf_popover("hide");
    }, 200)
  });
  return D2TabLinkViewExt;
});