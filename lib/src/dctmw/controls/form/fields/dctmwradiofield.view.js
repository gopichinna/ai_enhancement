/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/controls/form/fields/base/csformfield.view", "csui/controls/form/fields/base/csformfield.editable.behavior", "csui/controls/form/fields/base/csformfield.states.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!dctmw/controls/form/impl/dctmwradiofield/dctmwradiofield", "i18n!dctmw/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "css!dctmw/controls/form/impl/dctmwradiofield/dctmwradiofield" ], function(_, $, Backbone, Marionette, theming, PubSub, base, FormFieldView, FormFieldEditableBehavior, FormFieldStatesBehavior, TabableRegion, collectionTemplate, lang, csuiLang) {
  "use strict";
  var RadioFieldView = FormFieldView.extend({
    ui: {
      writeArea: ".cs-field-write",
      writeField: theming.isJATOTheme() ? ".cs-field-write otc-radio" : ".cs-field-write input",
      readField: theming.isJATOTheme() ? ".cs-field-read otc-radio" : ".cs-field-read button",
      inputfield: theming.isJATOTheme() ? ".cs-field-write otc-radio" : ".cs-field-write input",
      selectedLabel: ".selected-label",
      listitems: ".dctmw-radio-item-container label",
      expandCollapse: ".dctmw-text-overflow",
      iconContainer: ".dctmw-radio-container"
    },
    events: {
      focusout: "onFocusOutWriteArea",
      'change input[type="radio"]': "onSelectionChange",
      "change otc-radiogroup": "onSelectionChange",
      "click @ui.expandCollapse": "onToggleLabel",
      'keyup input[type="radio"]': "focusElement",
      "keyup otc-radio": "focusElement",
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
    className: "cs-formfield dctmw-radio-group",
    template: collectionTemplate,
    templateHelpers: function() {
      var options, data;
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
          item.isChecked = true;
        }
      });
      function canAlignHorizontal() {
        var containsLongLabel = _.find(items, function(item) {
          return item.name.length > 10;
        });
        return items.length === 2 && _.isUndefined(containsLongLabel);
      }
      var alignmentStyle, horizontalStyle, columns = options.columns || 1;
      if (canAlignHorizontal() || !this.alpacaField.options.vertical) {
        alignmentStyle = "display:inline-flex";
        horizontalStyle = "horizontal-radio";
        columns = 2;
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
        isJATO: theming.isJATOTheme(),
        columns: columns
      };
    },
    onRender: function() {
      this.alpacaField && this.alpacaField.setValue(this.model.get("data"));
      this._setHeight();
    },
    onShow: function() {
      this._afterVisible();
      if (theming.isJATOTheme() && this.ui.writeField.is("[disabled]")) {
        this.ui.writeField.removeAttr("readonly");
      }
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
      if (this.$el.find(theming.isJATOTheme() ? ".cs-field-write otc-radio[checked]" : "input:checked").length > 0) {
        var input = this.$el.find(theming.isJATOTheme() ? ".cs-field-write otc-radio[checked]" : "input:checked").get(0).id;
        if (input && input !== "") {
          let selectedModel = this.collection.find(model => model.id.toString() === input);
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
      $(".dctmw-active-radio").removeClass("dctmw-active-radio");
      this.getEditableBehavior().onFocusOutWrite(event);
    },
    _afterVisible: function() {
      var parentContainers = this.$el.parents(".dcmtw-container");
      _.some(parentContainers, function(el) {
        var $el = $(el);
        if ($el.hasClass("dcmtw-nested-fieldset-layout")) {
          this.$el.addClass("nested-fieldset-background");
          return true;
        }
      }, this);
      this._setHeight();
    },
    _setHeight: function() {
      $(this.ui.listitems).each(function() {
        var isOverflowing = $(this).parent().prop("clientHeight") < $(this).prop("scrollHeight");
        if (!isOverflowing) {
          $(this).parent().parent().find(".dctmw-text-overflow").hide();
        } else {
          $(this).parent().parent().find(".dctmw-text-overflow").show();
        }
      });
    },
    onToggleLabel: function(event) {
      $(event.target).toggleClass("dctmw-more-text").toggleClass("dctmw-less-text");
      $(event.target).parent().find(".dctmw-radio-item-container").toggleClass("dctmw-full-height");
    },
    focusElement: function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(".dctmw-active-radio").removeClass("dctmw-active-radio");
      theming.isJATOTheme() ? $(event.target).addClass("dctmw-active-radio") : $(event.target).parent().parent().parent().addClass("dctmw-active-radio");
    },
    loadActiveRadioElement: function() {
      $(".dctmw-active-radio").removeClass("dctmw-active-radio");
      $(this.$el).find(theming.isJATOTheme() ? ".cs-field-write otc-radio" : 'input[type="radio"]').each(function() {
        if ($(this).is(":focus")) {
          theming.isJATOTheme() ? $(this).addClass("dctmw-active-radio") : $(this).parent().parent().parent().addClass("dctmw-active-radio");
        }
      });
    },
    clickRadio: function(event) {
      if (!this.alpacaField.options.disabled) {
        var el = $(event.target).closest(".dctmw-radio-item-container").find("input");
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