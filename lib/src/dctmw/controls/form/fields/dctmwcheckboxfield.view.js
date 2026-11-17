/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "csui/controls/form/pub.sub", "nuc/utils/base", "csui/controls/form/fields/base/csformfield.view", "hbs!dctmw/controls/form/impl/dctmwcheckbox/dctmwcheckboxfield", "i18n!dctmw/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "css!dctmw/controls/form/impl/dctmwcheckbox/dctmwcheckboxfield", "csui/lib/binf/js/binf" ], function(_, $, Backbone, Marionette, theming, PubSub, base, FormFieldView, collectionTemplate, lang, csuiLang) {
  "use strict";
  var CheckboxFieldView = FormFieldView.extend({
    ui: {
      writeArea: ".cs-field-write",
      writeField: theming.isJATOTheme() ? ".cs-field-write otc-checkbox" : ".cs-field-write input",
      readField: theming.isJATOTheme() ? ".cs-field-read otc-checkbox" : ".cs-field-read button",
      selectedLabel: ".cs-formfield .cs-field-read button .selected-label",
      inputfield: theming.isJATOTheme() ? ".dctmw-checkbox-group otc-checkbox" : ".dctmw-checkbox-group input",
      listitems: ".dctmw-checkbox-item-container label",
      expandCollapse: ".dctmw-text-overflow"
    },
    events: {
      focusout: "onFocusOutWriteArea",
      'change input[type="checkbox"]': "onSelectionChange",
      'click input[type="checkbox"]': "onSelectionClick",
      "click otc-checkbox": "onSelectionClick",
      "change otc-checkbox": "onSelectionChange",
      "click @ui.expandCollapse": "onToggleLabel",
      'focus input[type="checkbox"]': "focusElement",
      'keydown input[type="checkbox"]': "accessibility",
      "focus otc-checkbox": "focusElement",
      "keydown otc-checkbox": "accessibility"
    },
    constructor: function CheckboxFieldView(options) {
      FormFieldView.prototype.constructor.apply(this, arguments);
      this.originatingView = options.originatingView || {};
      if (this.options.selected) {
        this._setSelection(this.options.selected);
      } else {
        this.resetSelection();
      }
      this.stopListening(this.model);
      this.listenTo(this.model, "change", this._raiseValueChanged);
      this.listenTo(this, "disable:field", this.onFieldDisabled);
      if (!this.options.dataId) {
        this.options.dataId = this.options.id;
      }
      this.mode = this.options.mode;
      this.mode = this.options.alpaca && this.options.alpaca.schema.readonly ? "readonly" : "read";
      this.$el.addClass(this.mode === "readonly" ? "cs-formfield-readonly" : "");
      this.curVal = [];
      this.oldVal = [];
      _.each(this.model.get("data"), function(d) {
        this.curVal.push(d);
        this.oldVal.push(d);
      }, this);
      this.alpacaField = this.options.alpacaField;
      if (this.options.alpaca) {
        if (options.alpaca.options.setRequiredFieldsEditable && this.mode !== "readonly") {
          this.mode = "writeonly";
        }
      }
      this.listenToOnce(this, "render", function() {
        $(window).on("resize." + this.cid, _.bind(this._setHeight, this));
      }).listenTo(this, "after:visible", this._afterVisible);
      this.originatingView._data = this.originatingView._data || {};
    },
    className: "cs-formfield dctmw-checkbox-group",
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
        item.renderId = _.uniqueId(item.id);
        item.showOnHover = options.showOnHover;
        _.each(data, function(d) {
          if (d === item.id) {
            item.checked = "checked='checked'";
            item.isChecked = true;
          }
        });
      });
      var checkboxGroupName = this.options.dataId, idBtn = this.options.alpacaField ? this.options.alpacaField.id : _.uniqueId("empty");
      return {
        items: items,
        checkboxGroupName: checkboxGroupName,
        hasData: _.isArray(data) && !_.isEmpty(data),
        writeonlyMode: this.mode === "writeonly",
        mode: this.mode,
        emptyLabel: this.getDefaultDisplayName(),
        idBtn: idBtn,
        idBtnLabel: this.options.labelId ? this.options.labelId : "",
        idValueDiv: idBtn + "ValueDiv",
        applyFlag: options.applyFlag,
        isReadOnly: this.mode === "readonly",
        isJATO: theming.isJATOTheme(),
        columns: options.columns
      };
    },
    onRender: function() {
      if (this.model.get("data")) {
        this.alpacaField && this.alpacaField.setValue(this.model.get("data"));
      } else {
        this.alpacaField && this.alpacaField.setValue([]);
      }
      this._setHeight();
    },
    onShow: function() {
      this._afterVisible();
      if (theming.isJATOTheme() && this.ui.writeField.is("[disabled]")) {
        this.ui.writeField.removeAttr("readonly");
      }
    },
    onFieldDisabled: function() {
      var value = this.model.get("data");
      if (this.alpacaField && this.alpacaField.options && !!this.alpacaField.options.resetOnDisable) {
        if (value && _.isArray(value) && value.length > 0 && this.ui.writeArea.hasClass("dctmw-field-disabled")) {
          this.model.set("data", []);
          this.collection.each(function(model) {
            if (model.has("checked")) {
              model.unset("checked");
            }
          });
          this.render();
        }
        this.ui.writeField.attr("tabindex", 0);
      }
    },
    _setSelection: function(model) {
      var data = [];
      if (model instanceof Backbone.Model) {
        data = model.pick("data").data;
      } else if (_.isArray(model)) {
        data = model;
      }
      this.model.set("data", data);
      return;
    },
    trySetValue: function() {
      var editVal = this.getEditValue(), bIsValid = true, isReadyToSaveView = this.isReadyToSave();
      if (isReadyToSaveView) {
        bIsValid = this.setValue(editVal, true);
      }
      this._updateSelection();
      return bIsValid;
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
          this.curVal = value === null ? [] : value;
        }
        this.model.set("data", _.map(value, function(v) {
          return v;
        }), {
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
    _updateSelection: function() {
      var displayName = this.getDisplayName();
      var selectedLabel = this.ui.readField.find("span.selected-label");
      if (_.isEmpty(displayName)) {
        selectedLabel.addClass("placeholder");
        selectedLabel.text(this.getDefaultDisplayName());
        this.ui.readField.attr("title", "");
      } else {
        selectedLabel.removeClass("placeholder");
        selectedLabel.text(displayName);
        this.ui.readField.attr("title", displayName);
      }
    },
    serializeData: function() {
      return _.defaults({
        id: _.uniqueId(),
        name: this.getDisplayName()
      }, this.model.toJSON());
    },
    _raiseValueChanged: function() {
      var data = {
        fieldvalue: this.getValue(),
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
    getEditValue: function() {
      var data = [];
      var inputs = this.$el.find(theming.isJATOTheme() ? ".cs-field-write otc-checkbox[checked]" : "input.checkbox-item:checked");
      var that = this;
      inputs.each(function() {
        var id = $(this).attr("value");
        if (id && id !== "") {
          var selectedModel = that.collection.findWhere(function(model) {
            var mId = model.get("id") + "";
            return mId === id;
          });
          if (selectedModel) {
            data.push(selectedModel.get("id"));
          }
        }
      });
      this.curVal = data ? [ ...data ] : [];
      return this.curVal;
    },
    setStateWrite: function() {
      this.oldVal = _.map(this.alpacaField.getValue(), function(v) {
        return v;
      });
      return false;
    },
    onFocusOutWriteArea: function(event) {
      $(".dctmw-active-checkbox").removeClass("dctmw-active-checkbox");
      this.getEditableBehavior().onFocusOutWrite(event);
    },
    onSelectionClick: function(event, skipCheck) {
      if (skipCheck) {
        return;
      }
      var options = this.model.get("options");
      if (!options) {
        return;
      }
      if (options.singleSelect && $(event.target).is(theming.isJATOTheme() ? "[checked]" : ":checked")) {
        this.$el.find(theming.isJATOTheme() ? ".cs-field-write otc-checkbox[checked]" : 'input[type="checkbox"]:checked').each(function() {
          this !== event.target && $(this).trigger("click", true);
        });
      }
    },
    onSelectionChange: function() {
      this.loadActiveElement();
      this.trySetValue();
    },
    resetOldValueAfterCancel: function() {
      var me = this;
      this.ui.writeArea.find(theming.isJATOTheme() ? "otc-checkbox" : ".checkbox-item").each(function() {
        var $el = $(this);
        $el.prop("checked", _.some(me.oldVal, function(v) {
          return v + "" === $el.attr("value");
        }));
      });
      this.trySetValue();
      return true;
    },
    getDisplayName: function() {
      var labels = [];
      _.each(this.model.get("data"), function(id) {
        var selectedModel = this.collection.findWhere({
          id: id
        });
        if (selectedModel) {
          labels.push(selectedModel.get("name"));
        }
      }, this);
      var label = _.reduce(labels, function(memo, l) {
        return memo + (memo.length > 0 ? "," : "") + l;
      }, "");
      return label;
    },
    getDefaultDisplayName: function() {
      return csuiLang.noValueSet;
    },
    dctmwCheckboxDataConverter: function(data) {
      return {
        id: data.value,
        name: data.text
      };
    },
    doDSReload: function(args) {
      if (this.alpacaField.options["getDataSource"]) {
        if (args.value) {
          this.alpacaField.options.sourceContentNode = this.originatingView._data[args.value];
        } else {
          this.alpacaField.options.sourceContentNode = undefined;
        }
        var dataArray = this.alpacaField.options["getDataSource"](this.alpacaField.options);
        var collectionData = [], enums = [], optionLabels = [];
        collectionData = _.map(dataArray, data => {
          enums.push(data.value);
          optionLabels.push(data.text);
          return this.dctmwCheckboxDataConverter(data);
        });
        this.alpacaField.schema.enum = enums;
        this.alpacaField.options.optionLabels = optionLabels;
        this.collection.reset(collectionData);
        var val = _.reject(this.model.get("data"), function(id) {
          var selectedModel = this.collection.findWhere({
            id: id
          });
          if (!selectedModel) {
            return true;
          }
        }, this);
        this.model.set("data", val);
        this.render();
      }
    },
    doFieldReinitialization: function(args) {
      if (this.alpacaField.options["getData"]) {
        if (args.value) {
          this.alpacaField.options.sourceContentNode = this.originatingView._data[args.value];
        } else {
          this.alpacaField.options.sourceContentNode = undefined;
        }
        var val = this.alpacaField.options["getData"](this.alpacaField.options);
        val = _.isArray(val) ? val : [ val ];
        this.model.set("data", val);
      }
      this.doDSReload(args);
    },
    _afterVisible: function() {
      var parentContainers = this.$el.parents(".dctmw-container");
      _.some(parentContainers, function(el) {
        var $el = $(el);
        if ($el.hasClass("dctmw-nested-fieldset-layout")) {
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
      $(event.target).parent().find(".dctmw-checkbox-item-container").toggleClass("dctmw-full-height");
    },
    focusElement: function(event) {
      $(".dctmw-active-checkbox").removeClass("dctmw-active-checkbox");
      theming.isJATOTheme() ? $(event.target).addClass("dctmw-active-checkbox") : $(event.target).parent().parent().addClass("dctmw-active-checkbox");
    },
    loadActiveElement: function() {
      $(".dctmw-active-checkbox").removeClass("dctmw-active-checkbox");
      $(this.$el).find(theming.isJATOTheme() ? ".cs-field-write otc-checkbox" : 'input[type="checkbox"]').each(function() {
        if ($(this).is(":focus")) {
          theming.isJATOTheme() ? $(this).addClass("dctmw-active-checkbox") : $(this).parent().parent().addClass("dctmw-active-checkbox");
        }
      });
    },
    accessibility: function(event) {
      var validKeys = [ 38, 40, 113, 13, 37, 39 ];
      if (validKeys.indexOf(event.keyCode) !== -1) {
        var searchBase = this.$el.find(theming.isJATOTheme() ? ".cs-field-write otc-checkbox" : "li"), index = searchBase.index(searchBase.filter(".dctmw-active-checkbox"));
        if (event.keyCode === 38 || event.keyCode === 37) {
          index = index === -1 || index === 0 ? searchBase.length - 1 : index - 1;
        } else if (event.keyCode === 40 || event.keyCode === 39) {
          index = index === -1 || index === searchBase.length - 1 ? 0 : index + 1;
        } else if (event.keyCode === 13) {
          theming.isJATOTheme() ? $(searchBase[index]).click() : $(searchBase[index]).find('input[type="checkbox"]').first().trigger("click");
        }
        theming.isJATOTheme() ? $(searchBase[index]).focus() : $(searchBase[index]).find('input[type="checkbox"]').first().trigger("focus");
      }
    },
    reinit: function() {
      this.ui.writeField.each(function(index, element) {
        if ($(element).prop("checked")) {
          $(element).removeAttr("checked");
        }
      });
    }
  });
  return CheckboxFieldView;
});