/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery", "nuc/lib/jsonpath", "csui/controls/form/pub.sub", "csui/behaviors/default.action/default.action.behavior", "csui/controls/form/form.view", "dctmw/models/mixins/expressions/expression.executor.mixin", "dctmw/models/mixins/expressions/expression.generator.mixin", "dctmw/models/mixins/expressions/expression.validator.mixin", "i18n!dctmw/controls/form/nls/lang", "dctmw/controls/form/dctmw-form-controls" ], function(_, Backbone, $, jsonPath, PubSub, DefaultActionBehavior, FormView, ExpressionExecutorMixin, ExpressionGeneratorMixin, ExpressionValidatorMixin, lang) {
  "use strict";
  var DctmFormView = FormView.extend({
    behaviors: {
      defaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    fieldToRefresh: [],
    supportedContainerType: [ "fieldset" ],
    className: function() {
      var classname = "cs-form csui-general-form dctm-form";
      if (this.options.topAlignedLabel) {
        classname += " csui-top-align-label";
      }
      return classname;
    },
    constructor: function DctmFormView(options) {
      options = options || {};
      options.visiblityEvent = true;
      this.loadMixins();
      FormView.prototype.constructor.call(this, options);
      this._keyPathMap = this.model.get("_keyPathMap");
      this.expressionExecutor(options);
      this.expressionGenerator(options);
      this.expressionValidator(options);
      var modelExpr = this.model.get("expressions");
      this.expressions = this.processExpressions(modelExpr);
      var exp = _.partition(this.expressions, function(e) {
        return e && e.methodName === "setValid";
      });
      this.expressions = exp[1];
      _.each(exp[0], function(ve) {
        if (ve && ve.sourceControl) {
          var validator;
          var c = this.getFieldForPath(this.model.get("options"), "fields", ".", ve.sourceControl);
          if (!c._custom_validator) {
            return;
          }
          var errMsg = c._custom_validator.message ? c._custom_validator.message : lang.validationErrorMsg;
          if (c._custom_validator.regEx === false) {
            validator = this.createExpressionValidator(ve.function, errMsg);
            if (c._custom_validator.isDateValidator) {
              this.expressions.push(ve);
            }
          } else {
            validator = this.createRegExValidator(c._custom_validator.expression, errMsg);
          }
          c.validator = validator;
          c.validate = true;
          c.hideInitValidationError = true;
          delete c._custom_validator;
        }
      }, this);
      this.initFormRequired = this.hasFormRequired();
      this.node = this.node || this.options.node;
      if (this.node && !this.node._changedFormValuesMap) {
        this.node._changedFormValuesMap = {
          properties: {},
          signoffInputs: {}
        };
      }
      this.validationErrorList = [];
      this.fieldToRefresh = _.union(this.fieldToRefresh, options.fieldToRefresh || []);
      this.listenTo(this, "change:field", this._changeField);
      this.listenTo(this, "change:field", this._updateChangesMap);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    loadMixins: function() {
      ExpressionExecutorMixin.mixin(DctmFormView.prototype);
      ExpressionGeneratorMixin.mixin(DctmFormView.prototype);
      ExpressionValidatorMixin.mixin(DctmFormView.prototype);
    },
    initializeExpressions: function() {
      this.initExpressions();
    },
    _splitFields: function() {
      var Memo = function(isSetType, isObjectType, isContType) {
        this.isSetType = isSetType;
        this.isContainerType = isContType;
        this.rgVals = [];
        this.rgKeys = [];
        this.rgObjectKeys = [];
      };
      var oSchema = this.alpaca.schema;
      var oOptions = this.alpaca.options;
      var oData = JSON.parse(JSON.stringify(this.alpaca.data));
      var memo = new Memo(), rgSplit = [], prev;
      var defaultData = {};
      var self = this;
      _.reduce(oSchema.properties, _.bind(function(memo, cur, key) {
        var curIsSetType = cur.type === "array" && cur.items.type === "object";
        var curIsContainerType = false;
        if (oOptions.fields && oOptions.fields[key] && !curIsSetType) {
          var fld = oOptions.fields[key];
          curIsContainerType = _.contains(self.supportedContainerType, fld.type);
        }
        memo.isSetType !== undefined || (memo.isSetType = curIsSetType);
        memo.isContainerType !== undefined || (memo.isContainerType = curIsContainerType);
        if (memo.isSetType !== curIsSetType || memo.isContainerType !== curIsContainerType) {
          rgSplit.push(memo);
          memo = new Memo(curIsSetType, null, curIsContainerType);
        }
        if (cur.type === "object") {
          memo.rgObjectKeys = memo.rgObjectKeys.concat(_.keys(cur.properties));
        }
        if (curIsSetType) {
          oOptions.isSetType = curIsSetType;
          if (oOptions.fields && oOptions.fields[key]) {
            _.extend(oOptions.fields[key], {
              isSetType: true
            });
          }
          if (oData[key]) {
            var tempData = oData[key][0] || oData[key];
            _.each(cur.properties || cur.items.properties, function(val, key) {
              var arrData = tempData[key];
              if (!!val.items && !!val.items.defaultItems) {
                if (!!arrData && arrData.length > val.items.defaultItems) {
                  while (arrData.length > val.items.defaultItems) {
                    arrData.pop();
                  }
                } else if (!!arrData && arrData.length < val.items.defaultItems) {
                  while (arrData.length < val.items.defaultItems) {
                    arrData.push("");
                  }
                }
              }
            });
            this.setEmptyValueInData(oData);
            defaultData[key] = JSON.parse(JSON.stringify(tempData));
          }
        }
        memo.rgVals.push(cur);
        memo.rgKeys.push(key);
        prev = memo;
        return memo;
      }, this), memo);
      if (Object.keys(defaultData).length > 0) {
        oOptions.defaultData = defaultData;
      }
      if (prev) {
        rgSplit.push(prev);
      }
      return rgSplit;
    },
    adjustLayout: function() {
      FormView.prototype.adjustLayout.apply(this, arguments);
      this.triggerMethod("relayout:form", this);
      var triggerVisibleEvent = _.bind(function(control) {
        _.each(control.children, function(childControl) {
          if (childControl.isContainer() && childControl.children) {
            triggerVisibleEvent(childControl);
          }
          if (childControl.fieldView && childControl.fieldView._events["after:visible"]) {
            childControl.fieldView.trigger("after:visible", childControl.fieldView);
          }
        });
      }, this);
      if (this.form) {
        triggerVisibleEvent(this.form);
      }
    },
    _destroyForm: function() {
      this.cleanupExpressions();
      if (this.$form) {
        this.$form.off("change:field");
      }
      FormView.prototype._destroyForm.call(this);
    },
    _changeField: function(args) {
      var field = args.targetField;
      if (args.parentField && args.parentField.path && args.path.indexOf("[") > -1 && args.path.indexOf("]") > -1) {} else {
        var eventKey = _.last(field.path.split("/"));
        this.triggerMethod("change:field:" + eventKey, args);
      }
      this.triggerMethod("dctmw:change:form:field", args);
    },
    _getChangeFieldEventData: function(event) {
      var evtData = FormView.prototype._getChangeFieldEventData.call(this, event);
      if (event.changedField) {
        _.extend(evtData, {
          changedField: event.changedField,
          fieldvalue: event.fieldvalue
        });
      }
      evtData.fieldChain = !event.fieldChain ? [] : event.fieldChain;
      evtData.fieldChain.push(evtData.fieldView);
      return evtData;
    },
    setRequired: function(control, value) {
      if (control.schema.required === value) {
        return;
      }
      if (control.path.lastIndexOf("/") === 0) {
        this.alpaca.schema.properties[control.propertyId].required = value;
      }
      control.schema.required = value;
      this.applyRequiredStatetoControl(control);
    },
    applyRequiredStatetoControl: function(control) {
      if (!control.isContainerField) {
        if (control.schema.required) {
          $(control.field).addClass("alpaca-required");
          if ($(control.getFieldEl()[0]).find("label.alpaca-control-label > .alpaca-icon-required").length === 0) {
            control.fireCallback("required");
          }
          control.refreshValidationState(false, function() {
            this._onFieldValid(null, control.fieldView ? control.fieldView : control);
          }.bind(this));
          PubSub.trigger("required:" + control.id, control);
        } else {
          control.getFieldEl().removeClass("binf-has-error");
          control.getFieldEl().find(".alpaca-message-notOptional").remove(".alpaca-message-notOptional");
          $(control.field).removeClass("alpaca-required");
          var reqSpan = control.getFieldEl().find("span.alpaca-icon-required");
          control.refreshValidationState(false, function() {
            this._onFieldValid(null, control.fieldView ? control.fieldView : control);
          }.bind(this));
          reqSpan.remove();
          PubSub.trigger("optional:" + control.id, control);
        }
        var formRequired = this.hasFormRequired();
        this.resetFormRequiredStatus(formRequired);
      }
    },
    setEnabled: function(control, value) {
      var isDisabledFromParentContainer = !!control.schema["disabledByParent"];
      if (value && !isDisabledFromParentContainer) {
        control.schema["disabled"] = false;
        control.schema["disabledBySelf"] = false;
        if (control.options.isGridField) {
          control.parent.schema.properties[control.propertyId]["disabled"] = false;
        }
      } else {
        control.schema["disabled"] = true;
        control.schema["disabledBySelf"] = !value;
        if (control.options.isGridField) {
          control.parent.schema.properties[control.propertyId]["disabled"] = true;
        }
        this.reinitializeControlAndChildren(control, "reinit_enabled");
      }
      if (control.fieldView) {
        control.fieldView.trigger("disable:field", control.fieldView);
      }
      this.applyRequiredStatetoControl(control);
      if (control.children && !isDisabledFromParentContainer) {
        if (control.updateToolbars) {
          control.options.toolbarSticky = value;
          control.updateToolbars();
        }
        this.enableDisableChildren(control, value);
      }
    },
    enableDisableChildren: function(control, value) {
      _.each(control.children, function(childControl) {
        if (childControl.isContainer() && !childControl.schema["disabledBySelf"] && childControl.children) {
          this.enableDisableChildren(childControl, value);
        }
        if (value) {
          if (!childControl.schema["disabledBySelf"]) {
            childControl.schema["disabled"] = false;
            if (childControl.options.isGridField) {
              childControl.parent.schema.properties[childControl.propertyId]["disabled"] = false;
            }
          }
          childControl.schema["disabledByParent"] = false;
        } else {
          childControl.schema["disabled"] = true;
          childControl.schema["disabledByParent"] = true;
          if (childControl.options.isGridField) {
            childControl.parent.schema.properties[childControl.propertyId]["disabled"] = true;
          }
        }
        if (_.isFunction(childControl.updateToolbars)) {
          childControl.options.toolbarSticky = value;
          childControl.updateToolbars();
        }
        this.applyRequiredStatetoControl(childControl);
        if (childControl.fieldView) {
          childControl.fieldView.trigger("disable:field", childControl.fieldView);
        }
      }, this);
    },
    setVisible: function(control, value) {
      var visiblityStateChange = false;
      var isHiddenByParentContainer = !!control.options["hiddenByParent"];
      if (value === true && !isHiddenByParentContainer) {
        if (control.options.hidden) {
          this.findParentAndApplyDisplayStyle(control, "");
          control.schema["hidden"] = false;
          control.options["hidden"] = false;
          if (control.options.isGridField) {
            control.parent.schema.properties[control.propertyId]["hidden"] = false;
            control.parent.options.fields[control.propertyId]["hidden"] = false;
          }
          control.show();
          visiblityStateChange = true;
          PubSub.trigger("show:" + control.id, control);
        }
      } else {
        if (!control.options.hidden || control.options.hiddenBySelf) {
          this.reinitializeControlAndChildren(control, "_reinit_visible");
          this.findParentAndApplyDisplayStyle(control, "none");
          control.schema["hidden"] = true;
          control.options["hidden"] = true;
          if (control.options.isGridField) {
            control.parent.schema.properties[control.propertyId]["hidden"] = true;
            control.parent.options.fields[control.propertyId]["hidden"] = true;
          }
          control.hide();
          visiblityStateChange = true;
          PubSub.trigger("hide:" + control.id, control);
        }
      }
      if (control.options.hiddenInit === undefined) {
        control.options["hiddenBySelf"] = !value;
      }
      if (visiblityStateChange) {
        if (control.options.isSpyScrollContainer) {
          this.model.set("hidden", !value, {
            silent: true
          });
          Backbone.trigger("dctmw:metadata:schema:updated", this.model);
        }
        if (control.type === "array" && value) {
          control.restructureParentObjFieldContainer?.call(control);
        }
        if (control.children && !isHiddenByParentContainer) {
          this.showHideChildren(control, value);
        }
        var formRequired = this.hasFormRequired();
        this.resetFormRequiredStatus(formRequired);
      }
    },
    showHideChildren: function(control, value) {
      _.each(control.children, function(childControl) {
        if (childControl.isContainer() && !childControl.options["hiddenBySelf"] && childControl.children) {
          this.showHideChildren(childControl, value);
        }
        if (value) {
          if (!childControl.options["hiddenBySelf"]) {
            this.findParentAndApplyDisplayStyle(childControl, "");
            childControl.schema["hidden"] = false;
            childControl.options["hidden"] = false;
            childControl.show();
            if (childControl.type === "array") {
              childControl.restructureParentObjFieldContainer?.call(childControl);
            }
          }
          childControl.options["hiddenByParent"] = false;
        } else {
          this.findParentAndApplyDisplayStyle(childControl, "none");
          childControl.schema["hidden"] = true;
          childControl.options["hidden"] = true;
          childControl.options["hiddenByParent"] = true;
          childControl.hide();
        }
      }, this);
    },
    setValid: function(control) {
      control.validate();
      control.refreshValidationState(false, function() {
        this._onFieldValid(null, control.fieldView ? control.fieldView : control);
      }.bind(this));
    },
    reInitialize: function(control) {
      var val = _.isUndefined(control.options._reinitValue) ? null : control.options._reinitValue;
      this._reInitializeValue(control, val);
    },
    reinitializeControlAndChildren: function(control, reInitProperty) {
      if (control.options[reInitProperty] === true) {
        var val = _.isUndefined(control.options._reinitValue) ? null : control.options._reinitValue;
        this._reInitializeValue(control, val);
      }
      if (control.children) {
        _.each(control.children, function(childControl) {
          if (childControl.isContainer() && childControl.children) {
            this.reinitializeControlAndChildren(childControl, reInitProperty);
          }
          if (!childControl.isContainer() && childControl.options[reInitProperty]) {
            var val = _.isUndefined(control.options._reinitValue) ? null : control.options._reinitValue;
            this._reInitializeValue(childControl, val);
          }
        }, this);
      }
    },
    _reInitializeValue: function(control, value) {
      if (control && control.fieldView && control.fieldView.getValue() !== "" && !control.options.hidden && !control.options.readonly) {
        control.fieldView.setValue(value, true);
        if (control.fieldView.ui && control.fieldView.ui.writeField) {
          if (_.isFunction(control.fieldView.reinit)) {
            control.fieldView.reinit();
          } else {
            control.fieldView.ui.writeField.val(value);
          }
        }
      }
    },
    resetFormRequiredStatus: function(required) {
      this.model.set("required", required, {
        silent: true
      });
      Backbone.trigger("dctmw:metadata:schema:updated", this.model);
      this.hasRequiredField = required;
    },
    findParentAndApplyDisplayStyle: function(control, style) {
      var parent = control && control.containerItemEl && $(control.containerItemEl);
      if (parent) {
        parent.css({
          display: style
        });
        if (parent.parent().hasClass("dctmw-control")) {
          parent.parent().css({
            display: style
          });
        }
      }
    },
    hasFormRequired: function() {
      var formSchema = this.model.get("schema"), required = false, reqFields;
      if (formSchema) {
        reqFields = _.filter(jsonPath(formSchema.properties, "$..[?(@.required===true)]"), function(control) {
          return !control.hidden && !control.disabled;
        });
        if (_.isArray(reqFields) && reqFields.length > 0) {
          required = true;
        }
      }
      return required;
    },
    _onFieldValid: function(event, view) {
      var isFieldValid = view.alpacaField ? view.alpacaField.isValid() : _.isFunction(view.isValid) && view.isValid();
      isFieldValid ? this.triggerMethod("valid:field") : this.triggerMethod("invalid:field");
    },
    _renderContent: function() {
      FormView.prototype._renderContent.apply(this, arguments);
      this.$form.on("field:valid", _.bind(this._onFieldValid, this));
      this.$form.on("field:keyup", _.bind(this._keyupChange, this));
    },
    _keyupChange: function(event, args) {
      if (event.keyCode === 9) {
        return;
      }
      if (args.control.isRequired()) {
        if (args.control.options.disallowOnlyEmptySpaces && !_.isEmpty($.trim(args.val)) || !args.control.options.disallowOnlyEmptySpaces && !_.isEmpty(args.val)) {
          args.control.getFieldEl().removeClass("binf-has-error");
          args.control.getFieldEl().find(".alpaca-message-notOptional").remove(".alpaca-message-notOptional");
          this.triggerMethod("valid:field");
        } else {
          args.control.refreshValidationState(true);
          this.triggerMethod("invalid:field");
        }
      }
    },
    updateRenderedForm: function(options) {
      FormView.prototype.updateRenderedForm.apply(this, arguments);
      if (this.model.get("spyhidden")) {
        this.$el.parent().addClass("d2nonspy");
      }
      if (this.model.get("hidden") || this.model.get("options").hideTab) {
        this.$el.parent().addClass("binf-hidden");
        Backbone.trigger("dctmw:metadata:schema:updated", this.model);
      }
      var generalFormFieldDescriptors = this.options.generalFormFieldDescriptors;
      if (generalFormFieldDescriptors && generalFormFieldDescriptors.length) {
        this.listenToOnce(this, "render:general:form:fields", options.async());
      }
      this.initialInvalid = this.model.get("schema")["initial_invalid"];
      var alpacaForm = this.$el.alpaca("get");
      if (alpacaForm) {
        var children = alpacaForm.children;
        _.each(children, function(control) {
          this.setVisibilityOnInit(control);
        }, this);
      }
      this.listenToOnce(this, "render:form", _.bind(function() {
        var formRequired = this.hasFormRequired();
        if (this.initFormRequired || formRequired) {
          this.resetFormRequiredStatus(formRequired);
        }
      }, this));
      this.visiblityEvent = this.options.visiblityEvent;
      if (this.visiblityEvent) {
        this.subscribeToVisibilityEvent();
      }
      return this;
    },
    subscribeToVisibilityEvent: function() {
      this.listenToOnce(this, "render:form", _.bind(function() {
        var triggerVisibleEvent = _.bind(function(control) {
          _.each(control.children, function(childControl) {
            if (childControl.isContainer() && childControl.children) {
              triggerVisibleEvent(childControl);
            }
            if (childControl.fieldView && childControl.fieldView._events["after:visible"]) {
              childControl.fieldView.trigger("after:visible", childControl.fieldView);
            }
          });
        }, this);
        if (this.form) {
          triggerVisibleEvent(this.form);
        }
      }, this));
    },
    setVisibilityOnInit: function(control) {
      if (control.options.hiddenInit === true || control.options.hiddenBySelf === true) {
        this.setVisible(control, false);
      }
      if (control.children) {
        _.each(control.children, this.setVisibilityOnInit, this);
      }
    },
    getAlpacaControlByPath: function(controlPath, delimiter) {
      delimiter = _.isUndefined(delimiter) ? "." : delimiter;
      return this.getFieldForPath(this.form, "childrenByPropertyId", delimiter, controlPath);
    },
    getFieldForPath: function(parentFldConfig, propertyName, delimeter, fldPath) {
      var control = _.reduce(fldPath.split(delimeter), function(parentControl, childCntrlId) {
        var childControl;
        if (_.isEmpty(propertyName)) {
          if (_.isArray(parentControl)) {
            childControl = _.pluck(parentControl, childCntrlId);
          } else {
            childControl = parentControl[childCntrlId];
          }
        } else {
          if (parentControl) {
            childControl = parentControl[propertyName][childCntrlId];
          }
        }
        return childControl;
      }, parentFldConfig);
      return control;
    },
    _modifyModel: function() {
      this._superModifyModel();
      var toggleModeOptions = _.bind(function(fields) {
        _.each(fields, field => {
          if (field._d2type !== "dctmwlabel") {
            field.readonly = this.mode === "update" || field.readonly;
          }
          if (field._d2Containertype) {
            toggleModeOptions(field.fields);
          }
        });
      }, this);
      var toggleModeSchema = _.bind(function(properties) {
        _.each(properties, property => {
          if (property.properties) {
            toggleModeSchema(property.properties);
          } else if (property._d2type !== "dctmwlabel") {
            property.readonly = this.mode === "update" || property.readonly;
          }
        });
      }, this);
      toggleModeOptions(this.alpaca.options.fields);
      toggleModeSchema(this.alpaca.schema.properties);
    },
    _superModifyModel: function() {
      this.alpaca.options = this.alpaca.options || {};
      this.alpaca.options.focus = false;
      this.alpaca.options.hideInitValidationError = true;
      var updateAlpProperties = function(alpFields, alpProp, mode) {
        for (var idx in alpProp) {
          if (Object.prototype.hasOwnProperty.call(alpProp, idx)) {
            var isArrayType = alpProp[idx]["type"] === "array", isObjectType = alpProp[idx]["type"] === "object";
            if (!!alpProp[idx] && alpProp[idx]["type"] && (isArrayType || isObjectType)) {
              var alpPropItems = isArrayType ? alpProp[idx]["items"] : alpProp[idx], cur = alpFields[idx];
              if (cur) {
                cur.toolbarSticky = alpProp[idx].disabled ? false : true;
                cur.isMultiField = true;
                cur.uniqueId = idx;
                cur.messages = lang;
                cur.isEditMode = mode === "update";
                if (cur.fields) {
                  _.extend(cur.fields.item, {
                    isMultiFieldItem: true,
                    hideInlineActions: true
                  });
                  if (cur.validate !== undefined) {
                    _.extend(cur.fields.item, {
                      validate: cur.validate
                    });
                  }
                }
                var curSchema = alpPropItems;
                if (curSchema) {
                  if (curSchema.minItems !== 1 && curSchema.type === "object" || curSchema.maxItems !== curSchema.minItems && curSchema.type === "object") {
                    cur.isMultiRowSetEnabled = alpProp[idx].type === "array";
                    cur.toolbarSticky = alpProp[idx].disabled ? false : true;
                    if (cur.fields) {
                      var curItemFields = isArrayType ? cur.fields.item.fields : cur.fields.fields;
                      _.each(curItemFields, function(item) {
                        _.extend(item, {
                          isMultiFieldItem: true
                        });
                        cur.onlyread = item.readonly;
                      });
                    }
                  }
                  cur.canWrite = cur.readonly === undefined ? !cur.onlyread : !cur.readonly;
                  cur.isTabable = cur.isEditMode && !cur.isMultiFieldItem;
                }
              }
              if (isArrayType) {
                if (alpFields[idx].fields && alpFields[idx].fields.item && alpFields[idx].fields.item.fields) {
                  updateAlpProperties(alpFields[idx].fields.item.fields, alpPropItems.properties, mode);
                }
              } else if (isObjectType) {
                updateAlpProperties(alpFields[idx].fields, alpPropItems.properties, mode);
              }
            }
          }
        }
      };
      updateAlpProperties(this.alpaca.options.fields, this.alpaca.schema.properties, this.mode);
      var updateAlpFieldLabels = function(alpFields, opts) {
        for (var idx in alpFields) {
          if (Object.prototype.hasOwnProperty.call(alpFields, idx)) {
            var cur = alpFields[idx];
            cur.setRequiredFieldsEditable = opts.setRequiredFieldsEditable;
            cur.mode = opts.mode;
            if (cur.label && !cur.labelModifed) {
              cur.label = cur.label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
              cur.label = $("<div>").innerHTML = cur.label;
            }
            cur.labelModifed = true;
            if (opts.inContainer) {
              cur.inContainer = true;
            }
            if (cur.fields) {
              updateAlpFieldLabels(cur.fields, opts);
            }
          }
        }
      };
      var opts = {
        mode: this.mode,
        inContainer: !!this.options && !!this.options.node && !!this.options.node.get("container"),
        setRequiredFieldsEditable: this.setRequiredFieldsEditable,
        commonCategories: this.commonCategories
      };
      updateAlpFieldLabels(this.alpaca.options.fields, opts);
    },
    _updateChangesMap: function(args) {
      if (this.node) {
        var name = args.path.split("/")[args.path.split("/").length - 1];
        if (this.model.id === "electronicSignOff") {
          this.node._changedFormValuesMap["signoffInputs"][name] = args.value;
        } else {
          var fieldPath = args.path.substr(1);
          if (args.parentField && args.parentField.path && args.path.indexOf("[") > -1 && args.path.indexOf("]") > -1) {
            fieldPath = args.path.split("[")[0].substr(1);
          }
          var model = this.getFieldForPath(args.model.get("schema"), "properties", "/", fieldPath);
          if (this.node._changedFormValuesMap && !!model) {
            this.node._changedFormValuesMap["properties"][name] = args.value;
          }
        }
      }
    },
    _raiseInvalidChangeEvent: function() {
      this.triggerMethod("dctmw:change:formValidation", {
        status: false
      });
    },
    _raiseValidChangeEvent: function() {
      this.triggerMethod("dctmw:change:formValidation", {
        status: true
      });
    },
    sanitizeMaliciousHTML: function() {
      function sanitizeUserInput(input) {
        const htmlTagPattern = /<[^>]+>/;
        if (!htmlTagPattern.test(input)) {
          return input;
        }
        input = input.replace(/\s*(href|src|action|data-[^=]+)\s*=\s*["'][^"']*javascript:[^"']*["']/gi, ' $1=""');
        input = input.replace(/\s*on\w+="[^"]*"/gi, ' $&=""');
        input = input.replace(/\s*formaction=["'][^"']*["']/gi, ' formaction=""');
        input = input.replace(/\s*data-[^=]+=["'][^"']*["']/gi, ' $&=""');
        input = input.replace(/\s*(src|style)\s*=\s*["'][^"']*javascript:[^"']*["']/gi, ' $1=""');
        input = input.replace(/\s*(style|src)\s*=\s*["'][^"']*(javascript:[^"']*|data:[^"']*)["']/gi, ' $1=""');
        input = input.replace(/style\s*=\s*["'][^"']*javascript:[^"']*["']/gi, 'style=""');
        input = input.replace(/style\s*=\s*["'][^"']*(url\(['"][^'"]*javascript:[^'"]*['"][^'"]*\))[^'"]*/gi, 'style=""');
        input = input.replace(/src\s*=\s*["'][^"']*javascript:[^"']*["']/gi, 'src=""');
        return input;
      }
      if (this.options && this.options.node && !_.isEmpty(this.options.node._changedFormValuesMap.properties)) {
        var changedProperties = this.options.node._changedFormValuesMap.properties;
        for (let key of Object.keys(changedProperties)) {
          const value = changedProperties[key];
          if (typeof value === "string") {
            changedProperties[key] = sanitizeUserInput(value);
          }
        }
      }
    },
    validateForm: function(refreshState, validateOnlyRequiredFields) {
      var deferred = $.Deferred();
      this.sanitizeMaliciousHTML();
      this.form.hideInitValidationError = !refreshState;
      this.form.refreshValidationState(true, function() {
        if (this.isDestroyed) {
          return deferred.reject();
        }
        this.validationErrorList = [];
        var status = this.form.isValid(true);
        var hasAnyFieldInError = this.$form && this.$form.find(".binf-help-block.alpaca-message.alpaca-message-custom").length > 0;
        if (validateOnlyRequiredFields) {
          var hasEmptyRequiredfield = function(children) {
            return _.some(children, function(child) {
              if (child.children && child.isValidationParticipant()) {
                return hasEmptyRequiredfield(child.children);
              } else if (child.isValidationParticipant() && child.validation) {
                return child.validation["notOptional"] && child.validation["notOptional"].status === false;
              }
            });
          };
          status = !(hasEmptyRequiredfield(this.form.children) || hasAnyFieldInError);
        }
        if (!status) {
          this.updateValidationErrorList(this.form.children);
        }
        if (!validateOnlyRequiredFields || this.options.originatingView?.isErrorMode && this.options.originatingView.isErrorMode()) {
          this.model.set("isValid", this.validationErrorList.length === 0, {
            silent: true
          });
          this.trigger("dctmw:updateTab:formValidation", this.model);
          this.isValid = false;
        }
        deferred.resolve(status);
      }.bind(this));
      return deferred;
    },
    updateValidationErrorList: function(formChildren) {
      var me = this;
      _.each(formChildren, function(child) {
        if (child.children) {
          me.updateValidationErrorList(child.children);
        } else if (child.validation) {
          for (var key in child.validation) {
            if (Object.prototype.hasOwnProperty.call(child.validation, key)) {
              if (!child.validation[key].status) {
                me.validationErrorList.push({
                  id: child.propertyId,
                  label: child.schema.title || child.propertyId,
                  message: child.validation[key].message,
                  fieldView: child.fieldView,
                  fieldViewCid: child.fieldView.cid
                });
              }
            }
          }
        }
      });
    }
  });
  return DctmFormView;
});