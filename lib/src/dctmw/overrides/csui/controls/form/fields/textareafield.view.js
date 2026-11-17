/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/form/fields/textareafield.view", "i18n!csui/controls/form/impl/nls/lang", "hbs!dctmw/controls/form/impl/textareafield/textareafield", "css!dctmw/controls/form/impl/textareafield/textareafield" ], function(_, TextAreaFieldView, lang, newTemplate) {
  "use strict";
  var origTemplateHelper = TextAreaFieldView.prototype.templateHelpers;
  var origTemplateEvent = TextAreaFieldView.prototype;
  TextAreaFieldView.prototype.template = newTemplate;
  TextAreaFieldView.prototype.delayedResizeTextarea = _.noop;
  origTemplateEvent.events = _.extend(origTemplateEvent.events, {
    "click .showMore-text": "showMoreText",
    "click .showLess-text": "showLessText"
  });
  TextAreaFieldView.prototype.onRender = function() {
    this.$el.find(".cs-no-resize").removeClass("cs-no-resize");
    this._ele = this.$el.find(".cs-field-textarea-data.dctmw-textareafield");
    if (this.mode === "writeonly") {
      var rowCount = this.model.attributes.options.rows;
      this.$el.find(".editable.dctmw-textareafield").css("height", rowCount + 2.5 + "em");
      this.isTextareaAutoHeight = false;
      if (this.model.attributes.data && _.isFunction(this.model.attributes.data.trim) && this.model.attributes.data.trim().length !== 0) {
        this._applyEllipses();
      }
      this.ui.writeField.val(_.isObject(this.model.get("data")) ? this.textareaValue : this.curVal);
    } else if (this.mode === "readonly") {
      this.stopListening("refresh:size").listenTo(this, "refresh:size", () => {
        this.$el.find(".dctmw-readonly-mode").removeClass("dctmw-memofield");
        refreshTextAreaHeight.call(this);
      });
      this.listenTo(this, "after:visible", function() {
        refreshTextAreaHeight.call(this);
      });
    }
    this.listenTo(this, "disable:field", function() {
      _setOrRemoveToolTipOnField.call(this);
    });
  };
  function _setOrRemoveToolTipOnField() {
    let textAreaWrapper = this.$el.find(".cs-field-write-inner");
    if (this.options?.alpaca?.schema?.disabled) {
      let textArea = this.$el.find(".cs-field-write-inner .dctmw-textareafield"), textAreaValue = textArea.val(), title = textAreaValue || lang.noValue;
      textAreaWrapper.attr("title", title);
    } else {
      textAreaWrapper.removeAttr("title");
    }
  }
  function refreshTextAreaHeight() {
    var that = this;
    var buttonHeight = this.$el.find(".dctmw-readonly-mode");
    var rows = that.model.attributes.options.rows;
    var mainElem = this.$el;
    var secondaryElem = that.$el;
    if (checkVisible(buttonHeight)) {
      expandActions(buttonHeight, rows, mainElem, secondaryElem);
    } else {
      checkForceVisibility(buttonHeight, rows, mainElem, secondaryElem);
    }
  }
  function checkVisible(buttonHeight) {
    return buttonHeight.is(":visible");
  }
  function expandActions(buttonHeight, rows, mainElem, secondaryElem) {
    if (!buttonHeight.hasClass("dctmw-memofield")) {
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
      data.mainElem.find(".dctmw-readonly-mode").css("max-height", data.memoWrapperHeight + "px");
      data.showDetailsWrapper.addClass("binf-hidden");
      data.buttonHeight.addClass("dctmw-memofield");
    } else {
      data.mainElem.find(".dctmw-readonly-mode").css("max-height", data.row * data.lineHeight.slice(0, -2) + "px");
      data.showDetailsWrapper.removeClass("binf-hidden");
      data.buttonHeight.addClass("dctmw-memofield");
    }
  }
  TextAreaFieldView.prototype.showMoreText = function() {
    const updateWidth = this.$el.find(".btn-container").width();
    this.$el.closest(".cs-formfield.cs-textareafield").addClass("csui-textareafield-reset");
    var hideElement = this.$el.find(".btn-container");
    hideElement.addClass("binf-hidden");
    var showElement = this.$el.find(".btn-container.dctmw-textareafield.binf-hidden");
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
    var hideElement = this.$el.find(".btn-container.dctmw-textareafield");
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
});