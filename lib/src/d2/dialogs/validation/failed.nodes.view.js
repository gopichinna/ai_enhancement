/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/form/pub.sub", "dctmw/utils/utils", "hbs!d2/dialogs/validation/impl/failed.nodes", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(_, $, Marionette, TabableRegionBehavior, NodeTypeIconView, PerfectScrollingBehavior, PubSub, utils, template, lang) {
  "use strict";
  var lastFocussedRowIndex = 0;
  return Marionette.ItemView.extend({
    template: template,
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
      errorDetailRow: ".error-detail-row"
    },
    events: {
      "keydown @ui.errorDetailRow": "focusTableRows"
    },
    templateHelpers: function() {
      return {
        errorNodeItems: this.options.failedNodes,
        onlyOne: this.options.failedNodes.length === 1,
        headerMessage: lang.SomeDocumentsFailedMessage,
        mobile: utils.isMobile(),
        descMessage: this.descMessage
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
      this.descMessage = options.descMessage;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      if (utils.isMobile()) {
        this.$el.on("scroll", _.bind(this.check_scroll, this));
      }
      this._renderIconViews();
      this.removeNbsp();
    },
    _renderIconViews: function() {
      var self = this;
      this.ui.errorDetailRow.each(function(index, errorDetailRow) {
        var iconView = new NodeTypeIconView({
          el: $(errorDetailRow).find("td.type span").get(0),
          node: self.options.failedNodes[index].node
        });
        iconView.render();
      });
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
    check_scroll: function(e) {
      var elem = $(e.currentTarget);
      var me = this;
      if (Math.abs(elem[0].scrollHeight - elem.scrollTop() - elem.outerHeight()) < 5) {
        me.$el.find(".error-items").removeClass("fade-last-item");
      } else {
        me.$el.find(".error-items").addClass("fade-last-item");
      }
      if (elem.scrollTop() > 5) {
        me.$el.find(".failed-nodes-container").addClass("fade-first-item");
      } else {
        me.$el.find(".failed-nodes-container").removeClass("fade-first-item");
      }
    },
    onBeforeDestroy: function() {
      lastFocussedRowIndex = 0;
    }
  });
});