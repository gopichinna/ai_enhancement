/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/utils/mass.update.utils", "i18n!d2/controls/form/impl/nls/lang" ], function(_, Backbone, MassUpdateUtils, FormLang) {
  "use strict";
  return {
    mixin: function(prototype) {
      var oldSetValue = prototype.setValue, oldGetValue = prototype.getValue, oldGetEditValue = prototype.getEditValue, oldOnClickNoneOption = prototype.onClickNoneOption, oldFocusOutAction = prototype.focusOutAction, oldSetFocus = prototype.setFocus;
      return _.extend(prototype, {
        setValue: function(value, validate, silent) {
          var model = this.options.model || this.model;
          if (model.get("options").massUpdateFileCount) {
            if (MassUpdateUtils.fieldHasMultipleValues(value) || value instanceof Backbone.Model && MassUpdateUtils.fieldHasMultipleValues(value.get("id"))) {
              this.ui.writeField.attr("placeholder", value instanceof Backbone.Model ? value.get("id") : value);
              this.ui.writeField.val("");
              this.showMultiplePlaceholder = true;
              if (value instanceof Backbone.Model) {
                var me = this, setMultipleValue = function() {
                  if (me.ui.writeField.val() === "") {
                    var childView = me.children.findByModel(me.collection.find(function(model) {
                      return MassUpdateUtils.fieldHasMultipleValues(model.get("id"));
                    }));
                    if (childView) {
                      me.onChildviewClickItem(childView);
                      me.showMultiplePlaceholder = true;
                      me.formView.trigger("d2:field:undo", me.alpacaField);
                    } else {
                      setTimeout(setMultipleValue);
                    }
                  }
                };
                this.ui.writeField.off("input", setMultipleValue);
                this.ui.writeField.on("input", setMultipleValue);
              } else {
                this.ui.writeField.one("input", function() {
                  this.showMultiplePlaceholder = false;
                  this.ui.writeField.attr("placeholder", this._getPlaceHolder());
                }.bind(this));
              }
            } else if (value === "" || value === null) {
              this.ui.writeField.attr("placeholder", this._getPlaceHolder());
            }
          }
          oldSetValue && oldSetValue.call(this, value, validate, silent);
        },
        onClickNoneOption: function() {
          oldOnClickNoneOption.apply(this, arguments);
          if (this.showMultiplePlaceholder) {
            this.showMultiplePlaceholder = false;
            this.ui.writeField.attr("placeholder", FormLang.selectFieldEmptyFieldLabel);
          }
        },
        focusOutAction: function() {
          if (this.showMultiplePlaceholder && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
            this.ui.writeField.val(this.model.get("id"));
            oldFocusOutAction.apply(this, arguments);
            this.ui.writeField.val("");
            this.ui.writeField.attr("placeholder", this.model.get("id"));
          } else {
            oldFocusOutAction.apply(this, arguments);
          }
        },
        setFocus: function() {
          oldSetFocus.apply(this, arguments);
          var model = this.options.model || this.model;
          if (model.get("options").massUpdateFileCount && this.showMultiplePlaceholder && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
            this.ui.writeField.attr("placeholder", this.model.get("id"));
          }
        },
        getValue: function() {
          var value = oldGetValue && oldGetValue.apply(this, arguments), model = this.options.model || this.model;
          if (model.get("options").massUpdateFileCount && (value === "" || value === null) && this.showMultiplePlaceholder) {
            value = this.ui.writeField.attr("placeholder");
          }
          return value;
        },
        getEditValue: function() {
          var value = oldGetEditValue && oldGetEditValue.apply(this, arguments), model = this.options.model || this.model;
          if (model.get("options").massUpdateFileCount && _.isEmpty(value) && this.showMultiplePlaceholder) {
            value = this.ui.writeField.attr("placeholder");
          }
          return value;
        }
      });
    }
  };
});