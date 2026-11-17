/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/form/fields/booleanfield.view", "d2/controls/table/cells/field.value.count/field.value.count.view", "d2/utils/mass.update.utils", "i18n!d2/utils/impl/nls/lang", "css!d2/controls/form/fields/massupdatefields/impl/d2massupdatebooleanfield" ], function($, _, Marionette, BooleanFieldView, FieldValueCountView, MassUpdateUtils, MassUpdateLang) {
  "use strict";
  return BooleanFieldView.extend({
    className: BooleanFieldView.prototype.className + " d2-massupdatebooleanfield",
    constructor: function D2MassUpdateBooleanFieldView() {
      BooleanFieldView.prototype.constructor.apply(this, arguments);
      this.hasMultipleValues = this.model.get("options").multiFileCountData;
    },
    setValue: function(value, validate, silent, isNextSwitch) {
      if (this.hasMultipleValues) {
        var updateValue = !isNextSwitch;
        this.multiFileCountData[updateValue].value = value;
        this.multiFileCountData[updateValue].label = value;
        if (this.multiFileCountData[true].value === this.multiFileCountData[false].value) {
          BooleanFieldView.prototype.setValue.call(this, this.multiFileCountData[true].value, validate, silent);
        } else {
          BooleanFieldView.prototype.setValue.call(this, this.originalValue, validate, silent);
        }
      } else {
        if (MassUpdateUtils.fieldHasMultipleValues(this.originalValue) && this.model.get("options").maxObjectThresholdReached) {
          setTimeout(function() {
            this.$el.find(".binf-switch-wrapper").addClass("binf-switch-disabled");
          }.bind(this));
        }
        BooleanFieldView.prototype.setValue.call(this, value, validate, silent);
      }
    },
    addCountViews: function() {
      if (this.model.get("options").maxObjectThresholdReached && MassUpdateUtils.fieldHasMultipleValues(this.originalValue)) {
        this.$el.find(".binf-switch-wrapper").each(function() {
          $(this).after('<div class="multiple-values">' + MassUpdateLang.multipleValues + "</div>");
        });
        return;
      }
      var me = this;
      this.$el.find(".binf-switch-wrapper").each(function(index) {
        var countData = me.hasMultipleValues ? me.model.get("options").multiFileCountData[index === 0] : {
          value: me.originalValue,
          label: me.originalValue,
          count: me.model.get("options").massUpdateFileCount,
          objectIds: _.pluck(me.model.get("options").massUpdateNodes, "r_object_id"),
          totalCount: me.model.get("options").massUpdateFileCount
        }, countView = new FieldValueCountView({
          model: MassUpdateUtils.getCountDataModel(countData, me.model.get("options"))
        });
        $(this).after('<div class="count-region"></div>');
        var countRegion = new Marionette.Region({
          el: $(this).next(".count-region")
        });
        countRegion.show(countView);
      });
    },
    onRender: function() {
      this.originalValue = this.model.get("data");
      BooleanFieldView.prototype.onRender.apply(this, arguments);
      if (this.hasMultipleValues || this.model.get("options").maxObjectThresholdReached && MassUpdateUtils.fieldHasMultipleValues(this.originalValue)) {
        var id = _.uniqueId("input"), idBtnLabel = this.options.labelId, checkboxName = _.uniqueId("csui-checkbox");
        this.$el.find(".control-area").after($('<input type="checkbox" name="' + checkboxName + '" aria-labelledby="' + idBtnLabel + '" aria-checked=false id="' + id + '">'));
        this.nextSwitch = this.$el.find("input#" + id);
        this.nextSwitch.wrap($('<div class="control-area"></div>'));
        this.nextSwitch[0].checked = true;
        this.nextSwitch.binfSwitch({
          state: true,
          size: "mini",
          onText: "&nbsp;",
          offText: "&nbsp;",
          labelText: "&nbsp;",
          disabled: this.alpacaField && this.alpacaField.schema && this.alpacaField.schema.disabled ? true : false,
          readonly: this.mode === "readonly",
          isValidChange: _.bind(function() {
            if (this.mode !== "writeonly" && document.querySelectorAll(".binf-has-error").length > 0) {
              var errorElement = $($(document.querySelectorAll(".binf-has-error")).find(":input")[0]);
              var errorElementParent = errorElement.parents(".cs-form-set.cs-form-set-container");
              var targetElementParent = this.$el.parents(".cs-form-set.cs-form-set-container");
              if (!errorElementParent.is(targetElementParent)) {
                errorElement.trigger("focus");
                return false;
              }
            }
            return true;
          }, this),
          onSwitchChange: _.bind(function(event, state) {
            this.$el.find(".binf-switch-wrapper").addClass("binf-switch-disabled");
            if (this.checkErrorExists()) {
              return false;
            }
            this.setValue(!state, true, undefined, true);
            this.$el.find(".binf-switch-wrapper").removeClass("binf-switch-disabled");
            this.nextSwitch.trigger("focus");
            this.nextSwitch.attr("aria-checked", !state);
            this.nextSwitch[0].checked = !state;
          }, this)
        });
        this.multiFileCountData = this.model.get("options").multiFileCountData;
      }
      this.addCountViews();
    },
    onClickWriteField: function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(event.target).binfSwitch("toggleState");
    },
    setStateRead: function(focus) {
      this.ui.flagWriteField.binfSwitch({
        readonly: true
      });
      this.nextSwitch && this.nextSwitch.binfSwitch({
        readonly: true
      });
      if (focus) {
        this.ui.flagWriteField.trigger("focus");
      }
      return true;
    },
    setStateWrite: function(validate, focus) {
      this.ui.flagWriteField.binfSwitch({
        readonly: false
      });
      this.nextSwitch && this.nextSwitch.binfSwitch({
        readonly: false
      });
      if (focus) {
        this.ui.flagWriteField.trigger("focus");
      }
      return true;
    }
  });
});