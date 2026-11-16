/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "dctmw/utils/utils", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!d2/dialogs/mass.update/mass.update.document.validation/impl/document.validation.item", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.document.validation/impl/document.validation.item" ], function(_, $, Marionette, utils, TabableRegionBehavior, template, lang, massUpdateLang) {
  "use strict";
  var lastFocussedRowIndex = 0, initialRenderItemsCount = 7, maxItemsCountToShow = 50;
  return Marionette.ItemView.extend({
    template: template,
    ui: {
      errorDetailRow: ".error-detail-row",
      showMoreItems: ".show-more",
      showMoreLabel: ".show-more-label",
      showMoreIcon: ".show-more-icon",
      showFileInfo: ".show-file-Info",
      copyIcon: ".d2-validation-copy",
      toggleExpandCollapse: ".expand-collase-button"
    },
    events: {
      "keydown @ui.errorDetailRow": "focusTableRows",
      "click @ui.showMoreItems": "onClickShowMore",
      "keydown @ui.showMoreItems": "onKeydownShowMore",
      "click @ui.toggleExpandCollapse": "onExpandCollapse",
      "keydown @ui.toggleExpandCollapse": "onKeydownExpandCollapse",
      "click @ui.copyIcon": "onClickCopyIcon",
      "keydown @ui.copyIcon": "onKeyupCopyIcon"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    templateHelpers: function() {
      return {
        errorNodeItems: this.options.errorNodes.slice(0, this.options.itemsCountToShow),
        headerMessage: this.options.headerMsg,
        showFilesInfo: this.options.showMoreButton,
        filesInfoMessage: _.str.sformat(lang["MassUpdateShow" + this.options.langPrefix + "sInfo"], this.options.errorNodes.length),
        showMoreLabel: this.options.showMoreLabel,
        showMore: this.options.errorNodes.length > initialRenderItemsCount,
        showExpandButton: this.options.errorNodes.length > initialRenderItemsCount,
        showCopyIcon: this.options.errorNodes.length > initialRenderItemsCount,
        copyTooltip: massUpdateLang.copyTooltip,
        expandTooltip: massUpdateLang.CollapseButtonTooltip
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
    constructor: function ErrorNodesView(options) {
      options = options || {};
      options.totalerrorNodes = _.clone(options.errorNodes);
      options.itemsCountToShow = initialRenderItemsCount;
      options.showMoreLabel = lang.MassUpdateShowMoreLabel;
      options.showMoreButton = false;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      if (utils.isMobile() && this.options.errorNodes.length > 2) {
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
    onClickShowMore: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.ui.showMoreIcon.hasClass("show-more-icon")) {
        this.options.itemsCountToShow = maxItemsCountToShow;
        this.options.showMoreLabel = lang.MassUpdateShowLessLabel;
        this.options.showMoreButton = true;
        this.render();
        this.options.errorNodes.length > maxItemsCountToShow ? this.ui.showFileInfo.removeClass("binf-hidden") : this.ui.showFileInfo.addClass("binf-hidden");
        this.ui.showMoreIcon.removeClass("show-more-icon");
        this.ui.showMoreIcon.addClass("show-less-icon");
      } else {
        this.options.itemsCountToShow = initialRenderItemsCount;
        this.options.showMoreLabel = lang.MassUpdateShowMoreLabel;
        this.options.showMoreButton = false;
        this.render();
        this.ui.showFileInfo.addClass("binf-hidden");
        this.ui.showMoreIcon.removeClass("show-less-icon");
        this.ui.showMoreIcon.addClass("show-more-icon");
      }
      this._updateScrollbar();
    },
    onExpandCollapse: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.ui.toggleExpandCollapse.hasClass("expand")) {
        this.$el.find(".error-items").addClass("binf-hidden");
        this.ui.toggleExpandCollapse.removeClass("expand");
        this.ui.toggleExpandCollapse.addClass("collapse");
        this.ui.toggleExpandCollapse.attr("title", massUpdateLang.ExpandButtonTooltip);
        this.ui.showMoreItems && this.ui.showMoreItems.addClass("binf-hidden");
        this.ui.showFileInfo && this.ui.showFileInfo.addClass("binf-hidden");
      } else {
        this.$el.find(".error-items").removeClass("binf-hidden");
        this.ui.toggleExpandCollapse.removeClass("collapse");
        this.ui.toggleExpandCollapse.addClass("expand");
        this.ui.toggleExpandCollapse.attr("title", massUpdateLang.CollapseButtonTooltip);
        this.ui.showMoreItems && this.ui.showMoreItems.removeClass("binf-hidden");
        this.ui.showFileInfo && this.ui.showFileInfo.removeClass("binf-hidden");
      }
      this._updateScrollbar();
    },
    onKeyupCopyIcon: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickCopyIcon(event);
        break;
      }
    },
    onKeydownExpandCollapse: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onExpandCollapse(event);
        break;
      }
    },
    onKeydownShowMore: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickShowMore(event);
        break;
      }
    },
    _getErrorString: function() {
      return massUpdateLang.copyToClipboardDataHeader + "\n" + _.map(this.options.errorNodes, function(errorNode) {
        return _.str.sformat("{0};{1};{2}", errorNode.name, errorNode["showVersionLabel"] ? errorNode["r_version_label"] : "", errorNode.message);
      }).join("\r\n");
    },
    onClickCopyIcon: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!this.ui.copyIcon.hasClass("copied")) {
        if (utils.copyToClipboard(this._getErrorString())) {
          this.ui.copyIcon.addClass("copied");
          this.ui.copyIcon.find("svg").addClass("binf-hidden");
          this.ui.copyIcon.attr("title", massUpdateLang.copiedTooltip);
          setTimeout(function() {
            this.ui.copyIcon.removeClass("copied");
            this.ui.copyIcon.find("svg").removeClass("binf-hidden");
            this.ui.copyIcon.attr("title", massUpdateLang.copyTooltip);
          }.bind(this), 2500);
        }
      }
    },
    _updateScrollbar: function() {
      this.$el.closest(".mass-update-document-validation").perfectScrollbar("update");
    }
  });
});