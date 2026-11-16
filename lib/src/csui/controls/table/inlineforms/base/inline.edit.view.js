/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette3", "csui/controls/table/inlineforms/base/base.inline.form.view", "csui/controls/table/inlineforms/inlineform/inlineform.schemas", "i18n!csui/controls/table/inlineforms/base/impl/nls/lang", "hbs!csui/controls/table/inlineforms/base/impl/inline.edit", "css!csui/controls/table/inlineforms/base/impl/inline.edit" ], function($, _, Backbone, Marionette, BaseInlineFormView, InlineFormSchemas, lang, baseTemplate) {
  var InlineEditView = Marionette.View.extend({
    className: "csui-inline-editform",
    template: baseTemplate,
    regions: {
      inlineFormRegion: {
        el: ".csui-inlineform-region",
        replaceElement: true
      }
    },
    ui: {
      cancelButton: ".csui-btn-cancel",
      editCancelButton: ".csui-btn-edit-cancel",
      saveButton: ".csui-btn-save"
    },
    events: {
      "click @ui.saveButton": "saveClicked",
      "click @ui.cancelButton": "cancelClicked",
      keydown: "onKeyInView"
    },
    templateContext: function() {
      var errorMessage = this.model.get("csuiInlineFormErrorMessage"), data = {
        haveErrorMessage: !!errorMessage,
        formModeIsEdit: this._isEditMode(),
        EditCancelTooltip: lang.EditCancelTooltip,
        SaveEditTooltip: lang.SaveEditTooltip,
        CancelButtonLabel: lang.CancelButtonLabel,
        SaveButtonLabel: lang.AddButtonLabel
      };
      if (data.haveErrorMessage) {
        data.errorMessage = errorMessage;
        data.errorMsgId = _.uniqueId("err");
        this.options.node.set("errorid", data.errorMsgId);
      }
      return data;
    },
    constructor: function InlineEditView(options) {
      options || (options = {});
      var schemaOptions = {
        node: new Backbone.Model({
          type: options.model.get("type")
        })
      };
      options.otherOptions = options.otherOptions || (options.otherOptions = {});
      _.extend(schemaOptions, options.otherOptions);
      var node = InlineFormSchemas.getFormFieldsSchema(schemaOptions);
      if (!node) {
        schemaOptions = {
          node: new Backbone.Model({
            type: -1
          })
        };
        node = InlineFormSchemas.getFormFieldsSchema(schemaOptions);
      }
      options.node = node;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var blockableView = this.options.originatingView, itemsLength, isInvalidUrl;
      blockableView && this.listenTo(blockableView, "disable:blocking", this.setFocus);
      this.options.showOnlyDefaultField = this._isEditMode() || !!this.errorMessage;
      this.baseInlineFormView = new BaseInlineFormView(this.options);
      this.getRegion("inlineFormRegion").show(this.baseInlineFormView);
      this.listenTo(this.baseInlineFormView, "enable:save:btn", this._enableSaveBtn).listenTo(this.baseInlineFormView, "cancel:edit:form", function() {
        this.trigger("cancel:edit:form");
        this.cancel();
      }).listenTo(this.baseInlineFormView, "end:of:edit", function() {
        this.trigger("end:of:edit");
        this.destroy();
      });
      itemsLength = this.baseInlineFormView.collection && this.baseInlineFormView.collection.length;
      isInvalidUrl = !!this.model.get("isInvalidUrl") ? "csui-invalid-url" : "";
      this.$el.addClass(isInvalidUrl + " csui-field-size-" + itemsLength);
    },
    onDomRefresh: function() {
      this._enableSaveBtn();
      this.setFocus();
    },
    setFocus: function() {
      this.refreshTabableElements();
      let errorIndex = 0;
      this.tabableElements.forEach((item, index) => {
        if ($(item).hasClass("csui-inlineform-error")) {
          errorIndex = index;
          return;
        }
      });
      !!this.tabableElements && !!this.tabableElements[errorIndex] && $(this.tabableElements[errorIndex]).trigger("focus");
    },
    _isEditMode: function() {
      return this.model.get("id") !== undefined;
    },
    onKeyInView: function(event) {
      if (event.keyCode === 9) {
        this._moveTab(event);
        return true;
      }
      if (event.keyCode === 27 && !$(event.target).is("button")) {
        this.cancel();
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    },
    refreshTabableElements: function() {
      this.tabableElements = this.$el.find("input:not([disabled]),  select:not([disabled]), button:not([disabled])").filter(":visible").toArray();
    },
    currentlyFocusedElement: function() {
      if (!this.currentlyFocusedElementIndex) {
        !this.tabableElements && this.refreshTabableElements();
        let errorIndex = 0;
        this.tabableElements.forEach((item, index) => {
          if ($(item).hasClass("csui-inlineform-error")) {
            errorIndex = index;
            return;
          }
        });
        return $(this.tabableElements[errorIndex]);
      }
      return $(this.tabableElements[this.currentlyFocusedElementIndex]);
    },
    _moveTab: function(event) {
      this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
      if (event.shiftKey) {
        if (this.currentlyFocusedElementIndex > 0) {
          this.currentlyFocusedElementIndex -= 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
        } else {
          this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
        }
      } else {
        if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
          this.currentlyFocusedElementIndex += 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
        } else {
          this.currentlyFocusedElementIndex = 0;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger("focus");
        }
      }
      event.stopPropagation();
      event.preventDefault();
    },
    _enableSaveBtn: function() {
      var isAllFieldsValid = this.baseInlineFormView.checkAllformFields();
      this._isRendered && this.ui.saveButton.prop("disabled", !isAllFieldsValid);
      this.refreshTabableElements();
    },
    saveClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.baseInlineFormView.saveForm();
    },
    cancelClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.model.get("originalurl")) {
        this.model.set({
          name: this.model.get("originalname"),
          url: this.model.get("originalurl")
        }, {
          silent: true
        });
      }
      this.trigger("cancel:edit:form");
      this.cancel();
    },
    cancel: function(options) {
      options || (options = {});
      this.destroy();
      if (this.model.get("id") === undefined) {
        this.model.destroy();
      } else {
        delete this.model.inlineFormView;
        this.model.set("csuiInlineFormErrorMessage", "dummy", {
          silent: true
        });
        this.model.unset("csuiInlineFormErrorMessage", {
          silent: options.silent
        });
      }
    }
  });
  return InlineEditView;
});