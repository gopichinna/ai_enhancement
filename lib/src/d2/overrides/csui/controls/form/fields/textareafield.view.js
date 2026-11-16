/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/textareafield.view", "csui/controls/form/pub.sub", "d2/controls/form/fields/massupdatefields/mass.update.field.mixin", "dctmw/utils/utils", "i18n!csui/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/textareafield/textareafield" ], function(_, TextAreaFieldView, PubSub, MassUpdateFieldMixin, utils, lang, newTemplate) {
  "use strict";
  var origTemplateHelper = TextAreaFieldView.prototype.templateHelpers;
  var origTemplateEvent = TextAreaFieldView.prototype;
  TextAreaFieldView.prototype.template = newTemplate;
  origTemplateEvent.events = _.extend(origTemplateEvent.events, {
    "click .showMore-text": "showMoreText",
    "click .showLess-text": "showLessText"
  });
  TextAreaFieldView.prototype.onRender = function() {
    this._ele = this.$el.find(".cs-field-textarea-data.d2-textareafield");
    if (this.mode === "writeonly") {
      var rowCount = this.model.attributes.options.rows;
      this.$el.find(".editable.cs-no-resize.d2-textareafield").css("max-height", rowCount + 2.5 + "em");
      if (this.model.attributes.data && _.isFunction(this.model.attributes.data.trim) && this.model.attributes.data.trim().length !== 0) {
        this._applyEllipses();
      }
      this.ui.writeField.val(this.curVal);
      if (utils.isMobile()) {
        var textEl = this.ui.writeField[0];
        this.$el.on("keydown paste cut", function() {
          setTimeout(function() {
            textEl.style.height = "auto";
            textEl.style.height = textEl.scrollHeight + "px";
          }, 10);
        });
        this.listenToOnce(PubSub, "d2:textarea:setHeight", function() {
          textEl.style.height = textEl.scrollHeight + "px";
        });
      }
    } else if (this.mode === "readonly") {
      this.listenTo(this, "after:visible", function() {
        var that = this;
        var buttonHeight = this.$el.find(".d2-readonly-mode");
        var rows = that.model.attributes.options.rows;
        var mainElem = this.$el;
        var secondaryElem = that.$el;
        if (checkVisible(buttonHeight)) {
          expandActions(buttonHeight, rows, mainElem, secondaryElem);
        } else {
          checkForceVisibility(buttonHeight, rows, mainElem, secondaryElem);
        }
      });
    }
  };
  function checkVisible(buttonHeight) {
    return buttonHeight.is(":visible");
  }
  function expandActions(buttonHeight, rows, mainElem, secondaryElem) {
    if (!buttonHeight.hasClass("d2-memofield")) {
      buttonHeight.css("max-height", (rows + 10) * 28 + "px");
      var memoWrapperHeight = buttonHeight.innerHeight();
      var lineHeight = buttonHeight.css("line-height");
      var widthParent = mainElem.find(".cs-field-read-inner").width();
      mainElem.find(".csui-textareafield-reset-button").css("width", widthParent);
      var showDetailsWrapper = secondaryElem.find(".memo-show-details-parent");
      var showMoreShowLessText = secondaryElem.find(".showMore-text");
      var requiredData = {
        memoWrapperHeight: memoWrapperHeight,
        lineHeight: lineHeight,
        row: rows,
        showDetailsWrapper: showDetailsWrapper,
        showMoreShowLessText: showMoreShowLessText,
        mainElem: mainElem,
        buttonHeight: buttonHeight
      };
      displayHelper(requiredData);
    }
  }
  function checkForceVisibility(buttonHeight, rows, mainElem, secondaryElem) {
    var delay = 500;
    var timer = setInterval(function() {
      if (buttonHeight.is(":visible")) {
        clearInterval(timer);
        expandActions(buttonHeight, rows, mainElem, secondaryElem);
      }
    }, delay);
  }
  function displayHelper(data) {
    if (data.memoWrapperHeight <= data.row * data.lineHeight.slice(0, -2)) {
      data.mainElem.find(".d2-readonly-mode").css("max-height", data.memoWrapperHeight + "px");
      data.showDetailsWrapper.addClass("binf-hidden");
      data.buttonHeight.addClass("d2-memofield");
    } else {
      data.mainElem.find(".d2-readonly-mode").css("max-height", data.row * data.lineHeight.slice(0, -2) + "px");
      data.showDetailsWrapper.removeClass("binf-hidden");
      data.buttonHeight.addClass("d2-memofield");
    }
  }
  TextAreaFieldView.prototype.showMoreText = function() {
    const updateWidth = this.$el.find(".btn-container").width();
    this.$el.closest(".cs-formfield.cs-textareafield").addClass("csui-textareafield-reset");
    var hideElement = this.$el.find(".btn-container");
    hideElement.addClass("binf-hidden");
    var showElement = this.$el.find(".btn-container.d2-textareafield.binf-hidden");
    showElement.removeClass("binf-hidden");
    var iconExpandArrowDown = this.$el.find(".cs-icon.icon-expandArrowDown.binf-show.cs-icon-exp-col");
    iconExpandArrowDown.removeClass("icon-expandArrowDown").addClass("icon-expandArrowUp");
    var showLess = this.$el.find(".showMore-text");
    showLess.addClass("binf-hidden");
    var showMore = this.$el.find(".showLess-text");
    showMore.removeClass("binf-hidden");
    const memoShowLessContainer = this.$el.find(".csui-textareafield-reset-button");
    memoShowLessContainer.width(Math.round(updateWidth));
    iconExpandArrowDown.css("left", "58px");
  };
  TextAreaFieldView.prototype.showLessText = function() {
    var iconExpandArrowUp = this.$el.find(".cs-icon.icon-expandArrowUp.binf-show.cs-icon-exp-col");
    iconExpandArrowUp.removeClass("icon-expandArrowUp").addClass("icon-expandArrowDown");
    this.$el.closest(".cs-formfield.cs-textareafield").removeClass("csui-textareafield-reset");
    var showElement = this.$el.find(".btn-container.binf-hidden");
    showElement.removeClass("binf-hidden");
    var hideElement = this.$el.find(".btn-container.d2-textareafield");
    hideElement.addClass("binf-hidden");
    var showMore = this.$el.find(".showMore-text");
    showMore.removeClass("binf-hidden");
    var showLess = this.$el.find(".showLess-text");
    showLess.addClass("binf-hidden");
    iconExpandArrowUp.css("left", "58px");
  };
  TextAreaFieldView.prototype.templateHelpers = function() {
    var options = origTemplateHelper.call(this);
    if (!this.model.get("data")) {
      options.data = "";
    }
    options.seeMore = lang.seeMore;
    options.seeLess = lang.seeLess;
    return options;
  };
  MassUpdateFieldMixin.mixin(TextAreaFieldView.prototype);
});