/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/controls/form/fields/base/csformfield.view", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!d2/controls/form/impl/d2radiofield/d2radiofield", "i18n!d2/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "css!d2/controls/form/impl/d2radiofield/d2radiofield" ], function(_, $, Backbone, Marionette, PubSub, base, FormFieldView, FormFieldEditableBehavior, FormFieldStatesBehavior, TabableRegion, collectionTemplate, lang, csuiLang) {
  "use strict";
  var RadioFieldView = FormFieldView.extend({
    ui: {
      writeArea: ".cs-field-write",
      writeField: ".cs-field-write input",
      readField: ".cs-field-read button",
      inputfield: ".cs-field-write input",
      selectedLabel: ".selected-label",
      listitems: ".d2-radio-item-container label",
      expandCollapse: ".d2-text-overflow",
      iconContainer: ".d2-radio-container"
    },
    events: {
      focusout: "onFocusOutWriteArea",
      'change input[type="radio"]': "onSelectionChange",
      "click @ui.expandCollapse": "onToggleLabel",
      'keyup input[type="radio"]': "focusElement",
      "click @ui.iconContainer": "clickRadio"
    },
    constructor: function RadioFieldView(options) {
      FormFieldView.prototype.constructor.apply(this, arguments);
      this.model = new Backbone.Model();
      if (this.options.selected) {
        this._setSelection(this.options.selected);
      } else {
        this.resetSelection();
      }
      this.listenTo(this.model, "change", this._raiseValueChanged);
      if (!this.options.dataId) {
        this.options.dataId = this.options.id;
      }
      this.mode = this.options.mode;
      this.mode = this.options.alpaca && this.options.alpaca.schema.readonly ? "readonly" : "read";
      this.$el.addClass(this.mode === "readonly" ? "cs-formfield-readonly" : "");
      this.curVal = this.oldVal = this.model.clone();
      this.alpacaField = this.options.alpacaField;
      if (this.options.alpaca) {
        if (options.alpaca.options.setRequiredFieldsEditable && this.mode !== "readonly") {
          this.mode = "writeonly";
        }
      }
      this.listenToOnce(this, "render", function() {
        $(window).on("resize." + this.cid, _.bind(this._setHeight, this));
      }).listenTo(this, "after:visible", this._afterVisible);
    },
    behaviors: {
      FormFieldEditable: {
        behaviorClass: FormFieldEditableBehavior
      },
      FormFieldStates: {
        behaviorClass: FormFieldStatesBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    className: "cs-formfield d2-radio-group",
    template: collectionTemplate,
    templateHelpers: function() {
      var options, data, validationErrorMsg;
      if (this.options.model) {
        options = this.options.model.get("options");
        data = this.options.model.get("data");
      }
      var items = this.collection.map(function(item) {
        return item.attributes;
      });
      _.each(items, function(item) {
        if (data === item.id) {
          item.checked = "checked='checked'";
        }
        if (_.isString(item.category) && /Error/.test(item.category)) {
          item.class = "radio-item-error";
          if (!validationErrorMsg) {
            validationErrorMsg = lang.radioFieldValidationErrorInvalidValue;
          }
        }
      });
      function canAlignHorizontal() {
        var containsLongLabel = _.find(items, function(item) {
          return item.name.length > 10;
        });
        return items.length === 2 && _.isUndefined(containsLongLabel);
      }
      var alignmentStyle, horizontalStyle;
      if (canAlignHorizontal() || !this.alpacaField.options.vertical) {
        alignmentStyle = "display:inline-flex";
        horizontalStyle = "horizontal-radio";
      } else {
        alignmentStyle = "display:block";
      }
      var radioGroupName = this.options.dataId, idBtn = this.options.alpacaField ? this.options.alpacaField.id : _.uniqueId("empty");
      return {
        items: items,
        radioGroupName: radioGroupName,
        alignmentStyle: alignmentStyle,
        horizontalStyle: horizontalStyle,
        hasData: data !== "" && data !== null && this.options.hasValue,
        writeonlyMode: this.mode === "writeonly",
        mode: this.mode,
        emptyLabel: csuiLang.noValueSet,
        idBtn: idBtn,
        idBtnLabel: this.options.labelId ? this.options.labelId : "",
        idValueDiv: idBtn + "ValueDiv",
        applyFlag: options.applyFlag,
        isReadOnly: this.mode === "readonly",
        validationErrorMsg: validationErrorMsg
      };
    },
    onRender: function() {
      this.alpacaField && this.alpacaField.setValue(this.model.get("data"));
      this._setHeight();
    },
    onShow: function() {
      this._afterVisible();
    },
    getDisplayValue: function() {
      var selectedModel = _.findWhere(this.collection.models, {
        id: this.model.get("data")
      });
      return selectedModel ? selectedModel.get("name") : "";
    },
    _setSelection: function(model) {
      var value;
      if (model instanceof Backbone.Model) {
        value = model.pick("id").id;
      } else {
        value = model;
      }
      this.options.model.attributes.data = value;
      this.model.set("data", value);
    },
    trySetValue: function() {
      var editVal = this.getEditValue(), bIsValid = true, isReadyToSaveView = this.isReadyToSave();
      if (isReadyToSaveView) {
        bIsValid = this.setValue(editVal, true);
      }
      this._setSelection(editVal);
      this._updateSelection();
      return bIsValid;
    },
    _updateSelection: function() {
      this.ui.readField.find(".selected-label").text(this.getDisplayValue());
      this.ui.readField.find(".selected-label").removeClass("placeholder");
      this.options.hasValue = true;
    },
    serializeData: function() {
      return _.defaults({
        id: _.uniqueId(),
        name: this.getDisplayValue()
      }, this.model.toJSON());
    },
    _raiseValueChanged: function() {
      var data = {
        fieldvalue: this.getValue().get("data"),
        fieldid: this.options.dataId,
        fieldpath: this.options.path,
        targetfieldpath: this.options.path,
        fieldView: this
      };
      this.trigger("field:changed", data);
      PubSub.trigger(this.options.dataId + "dependentattrchanged", this);
      var event = $.Event("field:changed");
      _.extend(event, data);
      this.$el.trigger(event);
    },
    onSelectionChange: function() {
      this.loadActiveRadioElement();
      this.trySetValue();
    },
    getEditValue: function() {
      if (this.$el.find("input:checked").length > 0) {
        var input = this.$el.find("input:checked").get(0).id;
        if (input && input !== "") {
          var selectedModel = _.find(this.collection.models, function(model) {
            if (model.id.toString() === input) {
              return model;
            }
          });
          var category = selectedModel.get("category"), erroneous = false;
          if (!erroneous) {
            erroneous = _.isString(category) && /Error/.test(category);
          }
          if (erroneous) {
            this.$el.find(".validation-error-message").removeClass("binf-hidden");
          } else {
            this.$el.find(".validation-error-message").addClass("binf-hidden");
          }
          return selectedModel.id;
        }
      }
      return this.getValue().id;
    },
    getOldValue: function() {
      return typeof this.oldVal === "object" ? this.oldVal.get("data") : this.oldVal;
    },
    setValue: function(value, validate, silent) {
      var bIsValid = true;
      if (validate) {
        if (this.alpacaField) {
          bIsValid = this.alpacaField.setValueAndValidate(value, validate);
        }
      }
      if (bIsValid) {
        this.$el.removeClass("cs-formfield-invalid");
        if (value !== this.curVal) {
          this.curVal = value;
        }
        this.model.set("data", value, {
          silent: !!silent
        });
        this.$el.trigger($.Event("field:valid"), this);
      } else {
        this.$el.addClass("cs-formfield-invalid");
        var event = $.Event("field:invalid");
        this.$el.trigger(event);
      }
      return bIsValid;
    },
    getValue: function() {
      return this.model;
    },
    onFocusOutWriteArea: function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      $(".d2-active-radio").removeClass("d2-active-radio");
      this.getEditableBehavior().onFocusOutWrite(event);
    },
    _afterVisible: function() {
      var parentContainers = this.$el.parents(".d2-container");
      _.some(parentContainers, function(el) {
        var $el = $(el);
        if ($el.hasClass("d2-nested-fieldset-layout")) {
          this.$el.addClass("nested-fieldset-background");
          return true;
        } else if ($el.hasClass("d2tabgroupcontainer")) {
          return true;
        }
      }, this);
      this._setHeight();
    },
    _setHeight: function() {
      $(this.ui.listitems).each(function() {
        var isOverflowing = $(this).parent().prop("clientHeight") < $(this).prop("scrollHeight");
        if (!isOverflowing) {
          $(this).parent().parent().find(".d2-text-overflow").hide();
        } else {
          $(this).parent().parent().find(".d2-text-overflow").show();
        }
      });
    },
    onToggleLabel: function(event) {
      $(event.target).toggleClass("d2-more-text").toggleClass("d2-less-text");
      $(event.target).parent().find(".d2-radio-item-container").toggleClass("d2-full-height");
    },
    focusElement: function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(".d2-active-radio").removeClass("d2-active-radio");
      $(event.target).parent().parent().parent().addClass("d2-active-radio");
    },
    loadActiveRadioElement: function() {
      $(".d2-active-radio").removeClass("d2-active-radio");
      $(this.$el).find('input[type="radio"]').each(function() {
        if ($(this).is(":focus")) {
          $(this).parent().parent().parent().addClass("d2-active-radio");
        }
      });
    },
    clickRadio: function(event) {
      if (!this.alpacaField.options.disabled) {
        var el = $(event.target).closest(".d2-radio-item-container").find("input");
        el.trigger("click");
        el.trigger("focus");
        this.loadActiveRadioElement();
        this.trySetValue();
      }
      return false;
    },
    reinit: function() {
      this.ui.writeField.each(function(index, element) {
        if ($(element).prop("checked")) {
          $(element).removeAttr("checked");
        }
      });
    }
  });
  return RadioFieldView;
});