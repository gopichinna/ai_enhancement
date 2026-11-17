/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "i18n", "nuc/lib/jquery", "nuc/utils/base", "dctmw/utils/form.utils" ], function(_, i18n, $, base, FormUtils) {
  "use strict";
  const _validateOptional = FormUtils._validateOptional;
  _.extend(FormUtils, {
    requiredFieldAddOnValidation: function(control) {
      return control.options.massUpdateFileCount && !control.isEmpty();
    },
    setStateWrite: function(control) {
      control.initialValue = control.getValue();
      if ($.fn.datetimepicker) {
        var that = control;
        control.ui.writeDateField.datetimepicker({
          format: control.format,
          keepInvalid: true,
          useStrict: true,
          widgetParent: control.$el,
          showClear: base.isTouchBrowser(),
          defaultDate: this._getPickerDefaultDate(control),
          widgetPositioning: {
            vertical: "auto",
            horizontal: i18n.settings.rtl ? "right" : "left"
          }
        }).on("dp.change", function(event) {
          $(event.target).parents(".csui-normal-scrolling").css("overflow", "auto");
        }).on("dp.place", function(event) {
          if (base.isMSBrowser() || base.isTouchBrowser() && i18n && i18n.settings.rtl) {
            var inputEle = $(event.target), dropDownContainer = that.$el.find(".binf-datetimepicker-widget");
            base.adjustDropDownField(inputEle, dropDownContainer, false, that, that.hideDateTimePicker);
            event.stopImmediatePropagation();
          }
        }).on("dp.show", function(event) {
          if (that.getEditableBehavior().hideActions) {
            that.options.isDropDownOpen = true;
            var scrollableCols = that.$el.closest(".csui-scrollable-writemode");
            if (!!scrollableCols && !scrollableCols.hasClass("csui-dropdown-open")) {
              scrollableCols.addClass("csui-dropdown-open");
            }
            that.getEditableBehavior().hideActions(event);
          }
          if (!base.isMSBrowser() || !(base.isTouchBrowser() && i18n && i18n.settings.rtl)) {
            var inputEle = $(event.target), dropDownContainer = that.$el.find(".binf-datetimepicker-widget");
            base.adjustDropDownField(inputEle, dropDownContainer, false, that, that.hideDateTimePicker);
          }
          event.stopImmediatePropagation();
        }).on("dp.hide", function(event) {
          if (that.getEditableBehavior().showActions) {
            that.options.isDropDownOpen = false;
            var scrollableCols = that.$el.closest(".csui-scrollable-writemode");
            if (!!scrollableCols && scrollableCols.hasClass("csui-dropdown-open")) {
              scrollableCols.removeClass("csui-dropdown-open");
            }
            that.getEditableBehavior().showActions(event);
          }
          event.stopImmediatePropagation();
          $(event.target).parents(".csui-normal-scrolling").css("overflow", "auto");
        });
      }
    },
    _validateOptional: function(control) {
      if (control.options.massUpdateFileCount && !control.isEmpty()) {
        return true;
      }
      return _validateOptional.apply(this, arguments);
    },
    _getPickerDefaultDate: function(control) {
      return control.options && control.options.alpacaField && control.options.alpacaField.options && control.options.alpacaField.options.pickerDefaultDate;
    },
    jsonObjTraverse: function(jsonObj, stack, key, val, res, prop, doNotCheckHidden) {
      var filterObjects = [ "ds" ];
      for (var property in jsonObj) {
        if (Object.prototype.hasOwnProperty.call(jsonObj, property)) {
          if (jsonObj[key] && jsonObj[key] === val && _.indexOf(res, prop) === -1) {
            if (!doNotCheckHidden) {
              res.push(prop);
            } else if (jsonObj["hidden"] !== true) {
              res.push(prop);
            }
          }
          if (typeof jsonObj[property] === "object" && _.indexOf(filterObjects, property, true) === -1) {
            this.jsonObjTraverse(jsonObj[property], stack + "." + property, key, val, res, property, doNotCheckHidden);
          }
        }
      }
    },
    setFocusOnConfiguredElement: function(fieldView) {
      var formView = fieldView.alpacaField.connector.config.formView;
      var allActiveTab = formView.options.originatingView.$el.find(".d2tab-active");
      allActiveTab.removeClass("d2tab-active").css({
        display: "none"
      });
      var path = fieldView.alpacaField.path.slice(1, fieldView.alpacaField.path.lastIndexOf("/")).split("/");
      var nextPath = "";
      _.reduce(path, function(nextPath, controlId) {
        nextPath = nextPath + "/" + controlId;
        var alpControl = this.getAlpacaControlByPath(nextPath.slice(1), "/");
        if (!_.isUndefined(alpControl)) {
          if (alpControl.type === "d2tab") {
            alpControl.activate();
          } else if (alpControl.type === "d2singleTab") {
            setTimeout(function() {
              alpControl.activate({
                showForm: true,
                animate: true,
                ignoreFocusOnBack: true
              });
            }, 1);
            alpControl.fieldView.listenToOnce(alpControl.fieldView, "dom:refresh", function() {
              if (fieldView && _.isFunction(fieldView.setFocus)) {
                fieldView.setFocus();
              }
            });
          }
        }
        return nextPath;
      }, nextPath, formView);
      if (fieldView && _.isFunction(fieldView.setFocus)) {
        fieldView.setFocus();
      }
    },
    removeEmptyRowsFromGridField: function(fieldValue) {
      if (fieldValue.length > 0) {
        var lastRow = fieldValue[fieldValue.length - 1];
        var isEmpty = _.every(lastRow, function(data) {
          return data === "" || data === null;
        });
        if (isEmpty) {
          fieldValue.pop();
          this.removeEmptyRowsFromGridField(fieldValue);
        }
      }
    }
  });
  return FormUtils;
});