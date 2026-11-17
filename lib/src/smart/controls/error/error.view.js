/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!smart/controls/error/impl/error", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.mime", "i18n!smart/controls/error/impl/nls/lang", "smart/lib/binf/js/binf", "css!smart/controls/error/impl/error" ], function($, _, Marionette, template, theming, jatoMimeIcons, lang) {
  "use strict";
  var ErrorView = Marionette.ItemView.extend({
    className: function() {
      var className = "csui-error content-tile csui-error-container";
      if (this.options.low) {
        className += " csui-low";
      }
      return className;
    },
    template: template,
    templateHelpers: function() {
      let isJATO = theming.isJATOTheme();
      return {
        isJATO: isJATO,
        errorJatoMimeIcon: jatoMimeIcons?.mimeNotification,
        errorIconAlt: lang.errorIconAltText,
        detailedMessage: this?.model?.get("title") || this?.model?.get("detailedMessage"),
        showMoreErrorText: _.str.sformat(lang.showMoreErrorTextAria, this?.model?.get("message")),
        showMoreBtn: lang.showMoreBtnName,
        showMoreBtnType: isJATO ? "more" : "inline",
        showMoreBtnSize: isJATO ? "regular" : "small"
      };
    },
    modelEvents: {
      change: "render"
    },
    ui: {
      messageArea: ".smart-error-message",
      showMoreBtnArea: ".smart-show-more",
      showMoreBtn: ".show-more-btn",
      detailedMsgArea: ".smart-error-detailed-message"
    },
    events: {
      "click @ui.showMoreBtn": "showMoreErrorInfo",
      "keydown @ui.showMoreBtn": "onKeyShowMore"
    },
    constructor: function ErrorView(options = {}) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      $(window).on("resize", _.bind(this.handleShowMoreBtnErrorView, this));
    },
    onDomRefresh: function() {
      this.handleShowMoreBtnErrorView();
    },
    handleShowMoreBtnErrorView: function() {
      const errorMessageArea = this.el.querySelector(".smart-error-message");
      const showMoreBtnArea = this.el.querySelector(".smart-show-more");
      theming.isJATOTheme() && this.handleJatoIconSize();
      this.handleLineClamp(this.ui.detailedMsgArea[0], "remove");
      const messageHeight = errorMessageArea?.scrollHeight;
      this.handleLineClamp(this.ui.detailedMsgArea[0], "add");
      const msgContainerHeight = this?.el?.querySelector(".smart-error-message")?.clientHeight;
      if (messageHeight > msgContainerHeight) {
        errorMessageArea?.classList.remove("csui-normal-scrolling");
        showMoreBtnArea?.classList.remove("binf-hidden");
      } else {
        showMoreBtnArea?.classList.add("binf-hidden");
      }
    },
    handleJatoIconSize: function() {
      const errorJatoIcon = this.el.querySelector(".smart-error-icon");
      if (errorJatoIcon && (this?.el?.clientWidth < 300 || this?.el?.clientHeight < 300)) {
        errorJatoIcon?.classList.add("smart-error-icon-med");
      } else {
        errorJatoIcon?.classList.remove("smart-error-icon-med");
      }
    },
    showMoreErrorInfo: function() {
      this.ui.showMoreBtnArea[0]?.classList.add("binf-hidden");
      this.ui.messageArea[0]?.classList.add("csui-normal-scrolling");
      this.handleLineClamp(this.ui.detailedMsgArea[0], "remove");
    },
    handleLineClamp: function(container, action) {
      container?.classList?.[action]("line-clamp-three");
    },
    onKeyShowMore: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.showMoreErrorInfo();
        this.ui.messageArea.focus();
      }
    }
  });
  return ErrorView;
});