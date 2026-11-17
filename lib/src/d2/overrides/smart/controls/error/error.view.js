/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import i18n from "i18n";

import ErrorView from "smart/controls/error/error.view";

import theming from "smart/themes/theming";

var proto = ErrorView.prototype, origErrorUiElements = proto.ui, origErrorEvents = proto.events, currentPopoverTarget = null;

_.extend(proto, {
  ui: _.extend(origErrorUiElements, {
    iconArea: ".csui-error-icon-parent"
  }),
  events: _.extend(origErrorEvents, {
    "focusout @ui.showMoreBtnArea": "_hidePopoverAction"
  }),
  initialize: function() {
    $("*").on("scroll", this._hidePopoverAction.bind(this));
  },
  onBeforeDestroy: function() {
    $("*").off("scroll", this._hidePopoverAction.bind(this));
  },
  _hidePopoverAction: function() {
    if (currentPopoverTarget) {
      currentPopoverTarget.binf_popover("destroy");
      currentPopoverTarget = null;
    }
  },
  handleShowMoreBtnErrorView: function() {
    const errorSuggestionMessageArea = this.$el.find(".csui-suggestion");
    errorSuggestionMessageArea.addClass("binf-hidden");
    this.ui.detailedMsgArea.addClass("binf-hidden");
    this.ui.showMoreBtnArea.removeClass("binf-hidden");
    theming.isJATOTheme() && this.handleJatoIconSize();
  },
  showMoreErrorInfo: function() {
    if (this.options.model.get("title")) {
      var self = this;
      this.popoverOptions = {
        content: _.str.join(" ", this.options.model.get("suggestion"), this.options.model.get("title")),
        html: true,
        container: $.fn.binf_modal.getDefaultContainer(),
        template: '<div class="binf-popover d2-error-info-flyout" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
        placement: function() {
          var offset = self.ui.iconArea.offset(), infoWidth = self.ui.iconArea.outerWidth(), calc_width = $(window).width() - (offset.left + infoWidth);
          return i18n.settings.rtl ? offset.left > 260 ? "left" : "right" : calc_width > 260 ? "right" : "left";
        }
      };
      this.ui.iconArea.binf_popover(this.popoverOptions);
      this.ui.iconArea.binf_popover("toggle");
      currentPopoverTarget = this.ui.iconArea;
    }
  }
});