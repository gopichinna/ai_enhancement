/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/behaviors/overflow.footer.button.behavior", "i18n!d2/controls/saved.search/impl/nls/lang", "hbs!d2/controls/saved.search/impl/saved.search.form.footer" ], function($, _, Marionette, OverflowFooterButtonBehavior, lang, template) {
  var SavedSearchFormFooterView = Marionette.ItemView.extend({
    template: template,
    className: "queryformbtn",
    ui: {
      searchbtn: ".search",
      resetbtn: ".reset",
      savebtn: ".save"
    },
    events: {
      "click .form-btn": "onClickBtn",
      "keyup .form-btn": "onKeyBtn",
      "keydown .form-btn": "onKeyBtn"
    },
    templateHelpers: function() {
      return {
        reset: lang.reset,
        search: lang.search,
        save: lang.save
      };
    },
    constructor: function SavedSearchFormFooterView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this, "query:form:validate", this._validate);
    },
    behaviors: {
      OverflowFooterButtonBehavior: {
        behaviorClass: OverflowFooterButtonBehavior
      }
    },
    onClickBtn: function(event) {
      var $el = $(event.currentTarget), actionName = $el.attr("action-name");
      if (actionName) {
        this.options.parent.triggerMethod("query:form:" + actionName);
      }
    },
    onKeyBtn: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        if (event.type === "keyup") {
          this.onClickBtn(event);
        }
        event.stopPropagation();
        event.preventDefault();
      }
    },
    _validate: function(isValid) {
      this.ui.searchbtn.prop("disabled", !isValid);
    },
    changeSaveButtonState: function(actionName) {
      var $saveBtn = this.$el.find("[button-id=save]"), htmlText = actionName === "saveas" ? lang.saveas : lang.save;
      $saveBtn.attr("action-name", actionName);
      $saveBtn.attr("ariaLabel", htmlText);
      $saveBtn.attr("title", htmlText);
      $saveBtn.text(htmlText);
      this.updateWrappedButtonModel("save", {
        action: actionName,
        name: htmlText
      });
    },
    showAndHideResetButton: function(forceShow) {
      if (forceShow || this.ui.resetbtn.hasClass("binf-hidden")) {
        this.ui.resetbtn.removeClass("binf-hidden");
      } else {
        this.ui.resetbtn.addClass("binf-hidden");
      }
    },
    enableOrDisableButton: function(buttonId, enable) {
      var $buttonEl = this.$el.find("[button-id=" + buttonId + "]");
      if (enable) {
        $buttonEl.removeAttr("disabled");
      } else {
        $buttonEl.attr("disabled", true);
      }
      this.updateWrappedButtonModel(buttonId, {
        disabled: !enable
      });
    },
    updateWrappedButtonModel: function(buttonId, data) {
      var wrappedButtonCollection = this._behaviors[0].wrappedButtonCollection;
      if (wrappedButtonCollection) {
        var wrappedButtonModal = wrappedButtonCollection.get(buttonId);
        if (wrappedButtonModal) {
          wrappedButtonModal.set(data);
        }
      }
    }
  });
  return SavedSearchFormFooterView;
});