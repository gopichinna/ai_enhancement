/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/form/pub.sub", "dctmw/utils/utils", "hbs!d2/dialogs/mass.update/mass.update.document.validation/impl/mass.update.document.validation", "i18n!d2/commands/nls/localized.strings", "css!d2/dialogs/mass.update/mass.update.document.validation/impl/mass.update.document.validation" ], function(_, $, Marionette, TabableRegionBehavior, PerfectScrollingBehavior, PubSub, utils, template, lang) {
  "use strict";
  var lastFocussedRowIndex = 0;
  return Marionette.ItemView.extend({
    template: template,
    className: "mass-update-document-validation",
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },
    ui: {
      errorDetailRow: ".error-detail-row",
      showMoreItems: ".show-more"
    },
    events: {
      "keydown @ui.errorDetailRow": "focusTableRows",
      "click @ui.showMoreItems": "onClickShowMore"
    },
    templateHelpers: function() {
      var headerMsg;
      if (this.options.failedNodes.length === 1) {
        headerMsg = lang["MassUpdateValidationMessageOne" + this.options.langPrefix];
      } else if (this.options.failedNodes.length === this.options.valideNodesCount) {
        headerMsg = lang["MassUpdateValidationMessageAll" + this.options.langPrefix + "s"];
      } else {
        headerMsg = lang["MassUpdateValidationMessageSome" + this.options.langPrefix + "s"];
      }
      return {
        errorNodeItems: this.options.failedNodes,
        headerMessage: headerMsg,
        filesInfo: this.options.failedNodes.length > 7,
        filesInfoMessage: _.str.sformat(lang.MassUpdateShowFilesInfo, 100)
      };
    },
    focusTableRows: function(event) {
      var $selectedItem = this.$(".csui-acc-focusable-active"), tabElements = this.$(".error-detail-row"), selectedIndex = tabElements.index($selectedItem);
      $selectedItem.removeClass("csui-acc-focusable-active");
      switch (event.which) {
       case 34:
       case 35:
        this.$(tabElements[tabElements.length - 1]).addClass("csui-acc-focusable-active").trigger("focus");
        lastFocussedRowIndex = tabElements.length - 1;
        break;

       case 36:
       case 33:
        this.$(tabElements[0]).addClass("csui-acc-focusable-active").trigger("focus");
        lastFocussedRowIndex = 0;
        break;

       case 38:
        if (selectedIndex === 0) {
          this.$(tabElements[selectedIndex]).addClass("csui-acc-focusable-active").trigger("focus");
          lastFocussedRowIndex = selectedIndex;
        } else {
          this.$(tabElements[selectedIndex - 1]).addClass("csui-acc-focusable-active").trigger("focus");
          lastFocussedRowIndex = selectedIndex - 1;
        }
        break;

       case 40:
        if (tabElements.length - 1 === selectedIndex) {
          this.$(tabElements[selectedIndex]).addClass("csui-acc-focusable-active").trigger("focus");
          lastFocussedRowIndex = selectedIndex;
        } else {
          this.$(tabElements[selectedIndex + 1]).addClass("csui-acc-focusable-active").trigger("focus");
          lastFocussedRowIndex = selectedIndex + 1;
        }
        break;

       default:
        return;
      }
    },
    constructor: function FailedNodesView(options) {
      options = options || {};
      if (!options.failedNodes || !options.failedNodes.length) {
        throw Error("Error nodes list must be provided in the options");
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      if (utils.isMobile() && this.options.failedNodes.length > 2) {
        this.$el.addClass("show-more-added");
      }
      this.removeNbsp();
    },
    removeNbsp: function() {
      this.$el.find(".message").each(function(each, message) {
        message.innerHTML = message.innerHTML.replace(/\&nbsp;/g, " ");
        message.title = message.innerHTML;
      });
    },
    currentlyFocusedElement: function() {
      var tabElements = this.$("*[tabindex]:not(.ps-scrollbar-x, .ps-scrollbar-y)");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      this.$(tabElements[lastFocussedRowIndex]).addClass("csui-acc-focusable-active").trigger("focus");
      return $(tabElements[lastFocussedRowIndex]);
    },
    onBeforeDestroy: function() {
      lastFocussedRowIndex = 0;
    },
    onClickShowMore: function() {
      this.ui.showMoreItems.addClass("binf-hidden");
      this.$el.removeClass("show-more-added");
      PubSub.trigger("more:items:shown");
      if (this.options.failedNodes.length > 4) {
        this.$el.find(".error-items").addClass("fade-last-item");
        this.$el.on("scroll", _.bind(this.check_scroll, this));
      }
    },
    check_scroll: function(e) {
      var elem = $(e.currentTarget);
      var me = this;
      if (Math.abs(elem[0].scrollHeight - elem.scrollTop() - elem.outerHeight()) < 5) {
        me.$el.find(".error-items").removeClass("fade-last-item");
      } else {
        me.$el.find(".error-items").addClass("fade-last-item");
      }
    }
  });
});