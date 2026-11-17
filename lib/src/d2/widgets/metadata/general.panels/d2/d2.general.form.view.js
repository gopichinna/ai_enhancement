/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "dctmw/controls/form/form.view", "csui/behaviors/default.action/default.action.behavior", "nuc/lib/jsonpath", "csui/controls/form/pub.sub", "d2/models/mixins/expressions/expression.executor.mixin", "dctmw/models/mixins/expressions/expression.generator.mixin", "d2/models/mixins/expressions/expression.validator.mixin", "d2/utils/format.utils", "d2/controls/form/fields/alpaca/alpd2richtextfield", "d2/controls/form/fields/alpaca/alpd2urlfield", "d2/controls/form/fields/alpaca/alpd2combofield", "d2/controls/form/fields/alpaca/alpd2listfield", "d2/controls/form/fields/alpaca/alpd2passwordfield", "d2/controls/form/fields/alpaca/alpd2radiofield", "d2/controls/form/fields/alpaca/alpd2checkboxfield", "d2/controls/form/fields/alpaca/alpd2numberfield", "d2/controls/form/fields/alpaca/alpd2fileuploadfield", "i18n!d2/widgets/metadata/general.panels/d2/impl/nls/lang", "d2/controls/form/fields/alpaca/alpd2columnlayout", "d2/controls/form/fields/alpaca/alpd2fieldsetcontainer", "d2/controls/form/containers/alpaca/alpd2tab", "d2/controls/form/containers/alpaca/alpd2tabgroup", "d2/controls/form/fields/alpaca/alpd2singlecolarrayfield", "d2/controls/form/containers/alpaca/alpd2container", "d2/controls/form/fields/alpaca/alpd2nodepickerfield", "d2/controls/form/fields/alpaca/alpd2labelfield", "d2/controls/form/containers/alpaca/alpd2singlecolumntab", "d2/controls/form/fields/alpaca/alpd2usercombofield", "d2/controls/form/fields/alpaca/alpd2userlistfield", "d2/controls/form/fields/alpaca/alpd2querybuilderfield", "d2/controls/form/fields/alpaca/alpd2singleselecttreefield", "d2/controls/form/fields/alpaca/alpd2userorgroupcombosearchfield", "d2/utils/form.utils", "hbs!d2/widgets/metadata/general.panels/d2/impl/d2.general.form", "css!d2/widgets/metadata/general.panels/d2/impl/d2.general.form.ext" ], function(_, $, Backbone, log, FormView, DefaultActionBehavior, jsonPath, PubSub, ExpressionExecutorMixin, ExpressionGeneratorMixin, ExpressionValidatorMixin, FormatUtils, RichTextField, URLTextField, ComboField, ListField, PasswordField, RadioField, CheckboxField, NumberField, FileUploadField, lang, ColumnLayout, FieldSetContainer, TabContainer, TabGroupContainer, SingleColArray, alpd2container, D2NodePicker, D2LabelField, D2SingleColTabContainer, UserComboField, UserListFIeld, D2QueryBuilderField, D2SingleSelectTreeField, D2UserOrGroupComboSearchField, formUtils, formTemplate) {
  "use strict";
  var D2GeneralFormView = FormView.extend({
    behaviors: {
      defaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    className: function() {
      if (this.model.get("id") === "general") {
        return "cs-form csui-general-form d2-properties-form";
      } else {
        return "cs-form cs-form-update d2-properties-form";
      }
    },
    fieldToRefresh: [ "modify_date", "reserve_info" ],
    supportedContainerType: [ "d2column", "d2fieldset", "d2tab", "d2tabgroup", ...FormView.prototype.supportedContainerType ],
    constructor: function D2GeneralFormView(options) {
      FormView.prototype.constructor.call(this, options);
      this.userData = options.metadataView && options.metadataView.userData ? options.metadataView.userData : {};
    },
    formTemplate: formTemplate,
    ui: {
      expandAndCollapse: ".d2-properties-form-expand-collapse"
    },
    events: {
      "click @ui.expandAndCollapse": "expandAndCollapseFormContainer"
    },
    expandAndCollapseFormContainer: function() {
      const layoutMode = this.layoutMode ? "doublecolumn" : "singlecolumn";
      if (this.$el.find(".d2-properties-form-expand-collapse").hasClass("icon-expandArrowDown")) {
        this.$el.find(".d2-properties-form-expand-collapse").removeClass("icon-expandArrowDown").addClass("icon-expandArrowRight");
        this.$el.find(".csui-form-set-array-wrapper").addClass("binf-hidden");
        if (this.model.get("id") === "general") {
          this.$el.find(`.cs-form-${layoutMode}`).addClass("binf-hidden");
        }
      } else {
        this.$el.find(".d2-properties-form-expand-collapse").removeClass("icon-expandArrowRight").addClass("icon-expandArrowDown");
        this.$el.find(".csui-form-set-array-wrapper").removeClass("binf-hidden");
        if (this.model.get("id") === "general") {
          this.$el.find(`.cs-form-${layoutMode}`).removeClass("binf-hidden");
        }
      }
    },
    _getLayout: function() {
      var rgSplitObjectFields = this._splitFields();
      var bindings = {};
      var uniqueId = _.uniqueId("csform");
      _.each(rgSplitObjectFields, function(cur, i) {
        var col1Id = cur.isSetType ? "csfSingleCol_" + uniqueId + i : "csfLeftCol_" + uniqueId + i;
        col1Id = cur.isContainerType ? "csfSingleCol1_" + uniqueId + i : col1Id;
        var col2Id = cur.isSetType ? "csfSingleCol_" + uniqueId + i : "csfRightCol_" + uniqueId + i;
        col2Id = cur.isContainerType ? "csfSingleCol1_" + uniqueId + i : col2Id;
        _.extend(bindings, this._bindFields(cur, col1Id, col2Id));
      }, this);
      var template = this.getOption("formTemplate");
      var html = template.call(this, {
        modelId: uniqueId,
        fields: rgSplitObjectFields
      });
      var view = {
        parent: "bootstrap-csui",
        layout: {
          template: html,
          bindings: bindings
        }
      };
      return view;
    },
    _changeField: function(args) {
      var field = args.targetField;
      if (args.parentField && args.parentField.path && args.path.indexOf("[") > -1 && args.path.indexOf("]") > -1) {
        var model = this.getFieldForPath(args.model.get("schema"), "properties", "/", args.path.split("[")[0].substr(1));
        if (!!model && model._d2Containertype === "d2grid") {
          var index = _.last(args.name.split("_"));
          var fieldArgs = args;
          fieldArgs.value = _.pick(args.targetField.value, args.changedField)[args.changedField];
          fieldArgs.index = index;
          this.triggerMethod("change:field:" + args.changedField, fieldArgs);
        }
      } else {
        var eventKey = _.last(field.path.split("/"));
        this.triggerMethod("change:field:" + eventKey, args);
      }
      this.triggerMethod("d2:change:form:field", args);
      var formRequired = this.hasFormRequired();
      this.resetFormRequiredStatus(formRequired.required);
      this.resetFormRequiredFields(formRequired.reqFields);
    },
    setRequired: function(control, value) {
      if (control.schema.required === value) {
        return;
      }
      if (control.path.lastIndexOf("/") === 0) {
        this.alpaca.schema.properties[control.propertyId].required = value;
      } else if (control.path.indexOf("[") > -1 && control.path.indexOf("]") > -1) {
        var fieldPath = control.path.split("[")[0].substr(1);
        var grid = this.getFieldForPath(this.alpaca.schema, "properties", "/", fieldPath);
        if (grid) {
          grid.items.properties[control.propertyId].required = value;
          if (value) {
            PubSub.trigger("required:" + control.parent.parent.id, control.parent.parent);
          } else {
            var items = _.findKey(grid.items.properties, function(value) {
              return value.required === true;
            });
            if (!items) {
              PubSub.trigger("optional:" + control.parent.parent.id, control.parent.parent);
            }
          }
        }
      }
      control.schema.required = value;
      this.applyRequiredStatetoControl(control);
    },
    applyRequiredStatetoControl: function(control) {
      if (!control.isContainerField) {
        let grid = control?.parent?.parent?.schema?._d2Containertype === "d2grid" && control.parent.parent;
        if (grid) {
          this._refreshGridColumnRequiredHeaderState(grid, control);
        }
        if (control.schema.required) {
          $(control.field).addClass("alpaca-required");
          control.fireCallback("required");
          control.refreshValidationState(false, function() {
            this._onFieldValid(null, control.fieldView ? control.fieldView : control);
          }.bind(this));
          PubSub.trigger("required:" + control.id, control);
        } else {
          control.getFieldEl().removeClass("binf-has-error");
          control.getFieldEl().find(".alpaca-message-notOptional").remove(".alpaca-message-notOptional");
          $(control.field).removeClass("alpaca-required");
          control.refreshValidationState(false, function() {
            this._onFieldValid(null, control.fieldView ? control.fieldView : control);
            if (grid && control.isValid()) {
              control.field.find(".cs-formfield-invalid").removeClass("cs-formfield-invalid");
            }
          }.bind(this));
          var reqSpan = control.getFieldEl().find("span.alpaca-icon-required");
          reqSpan.remove();
          PubSub.trigger("optional:" + control.id, control);
        }
        var formRequired = this.hasFormRequired();
        this.resetFormRequiredStatus(formRequired.required);
        this.resetFormRequiredFields(formRequired.reqFields);
      }
    },
    _refreshGridColumnRequiredHeaderState: function(grid, control) {
      let columnIdx = control.parent.children.indexOf(control), hasRequiredCell = grid.children.find(row => {
        return row.children.at(columnIdx).schema.required;
      });
      let firstCell = grid.children.at(0).children.at(columnIdx), firstCellField = firstCell.field;
      if (hasRequiredCell) {
        if (!firstCellField.hasClass("alpaca-required")) {
          firstCellField.addClass("alpaca-required");
          firstCell.fireCallback("required");
        }
      } else {
        firstCellField.removeClass("alpaca-required");
        firstCellField.find("span.alpaca-icon-required").remove();
      }
    },
    findParentAndApplyDisplayStyle: function(control, style) {
      var parent = control && control.containerItemEl && $(control.containerItemEl);
      if (parent) {
        parent.css({
          display: style
        });
        if (parent.parent().hasClass("d2-control")) {
          parent.parent().css({
            display: style
          });
        }
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
    resetFormRequiredFields: function(requiredFields) {
      this.model.set("requiredfields", requiredFields, {
        silent: true
      });
      Backbone.trigger("dctmw:metadata:schema:updated", this.model);
      this.requiredFields = requiredFields;
    },
    hasFormRequired: function() {
      var formSchema = this.model.get("schema"), data = this.form ? this.getValues() : {}, required = false, reqFields, reqFieldsKey, hasDefaultDatas = [], reqfieldsTitle;
      if (formSchema) {
        reqFields = _.filter(jsonPath(formSchema.properties, "$..[?(@.required===true)]"), function(control) {
          return !control.hidden && !control.disabled;
        });
        reqFieldsKey = this.getRequiredFields(formSchema.properties);
        if (reqFields && data) {
          hasDefaultDatas = this.getDefaults(data);
        }
        var requiredWithoutDefaults = reqFieldsKey.filter(item => !hasDefaultDatas.includes(item.id));
        if (_.isArray(reqFields) && reqFields.length > 0) {
          required = true;
        }
        reqfieldsTitle = requiredWithoutDefaults.map(function(field) {
          return field.property?.title || field.id;
        });
      }
      return {
        required: required,
        reqFields: reqfieldsTitle
      };
    },
    getRequiredFields: function(formSchemaProp) {
      let result = [];
      for (const key in formSchemaProp) {
        const props = formSchemaProp[key];
        if (props) {
          if (props.properties !== undefined) {
            for (const prop in props.properties) {
              const property = props.properties[prop];
              if (property.required === true && !property.disabled && !property.hidden) {
                result.push({
                  id: prop,
                  property: property
                });
              }
              if (property.properties !== undefined) {
                const nestedRequiredFields = this.getRequiredFields(property.properties);
                result = result.concat(nestedRequiredFields);
              }
              if (property.items?.properties !== undefined) {
                const nestedRequiredFields = this.getRequiredFields(property.items.properties);
                result = result.concat(nestedRequiredFields);
              }
            }
          } else {
            if (props.required === true && !props.disabled && !props.hidden) {
              result.push({
                id: key,
                property: props
              });
            }
          }
        }
      }
      return result;
    },
    getDefaults: function(data) {
      let result = [];
      for (const key in data) {
        if (data[key]) {
          for (const uniqueId in data[key]) {
            const value = data[key][uniqueId];
            if (value !== null && value !== "" && !Array.isArray(value)) {
              result.push(uniqueId);
            } else if (Array.isArray(value) && value.length > 0 && uniqueId.startsWith("grid_")) {
              result = result.concat(this.getNonEmptyGridColumnKey(value));
            } else if (Array.isArray(value) && value.every(item => typeof item === "string" || item === null || item === undefined) && value.some(item => typeof item === "string" && item.trim() !== "")) {
              result.push(uniqueId);
            }
          }
        }
      }
      return result;
    },
    getNonEmptyGridColumnKey: function(arr) {
      if (arr.length === 0) return [];
      const keys = Object.keys(arr[0]);
      return keys.filter(key => arr.every(row => row[key] !== "" && row[key] !== null && row[key] !== undefined));
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
      if (this.options.originatingView && !this.options.originatingView?.options?.suppressSpyScroll) {
        this.$el.find(".d2-properties-form-expand-collapse").remove();
      }
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
      this.listenTo(this, "render:form", _.bind(function() {
        var formRequired = this.hasFormRequired();
        if (this.initFormRequired || formRequired) {
          this.resetFormRequiredStatus(formRequired.required);
          this.resetFormRequiredFields(formRequired.reqFields);
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
        if (!control.options.isGridField) {
          delete control.options.hiddenInit;
        }
      }
      if (!control.options.isGridField) {
        _.each(control.children, this.setVisibilityOnInit, this);
      } else {
        if (control.options.isSetType) {
          _.each(control.children, function(row) {
            _.each(row.children, function(cell) {
              delete cell.options.hiddenInit;
            });
          }, this);
        }
      }
    },
    getFieldForPath: function(parentFldConfig, propertyName, delimeter, fldPath) {
      var control = _.reduce(fldPath.split(delimeter), function(parentControl, childCntrlId) {
        var childControl;
        if (parentControl && parentControl.schema && parentControl.schema._d2Containertype === "d2grid") {
          var colCellControls = [];
          _.each(parentControl.children, function(row) {
            colCellControls.push(row["childrenByPropertyId"][childCntrlId]);
          }, this);
          return colCellControls;
        } else if (parentControl && parentControl._d2Containertype && parentControl._d2Containertype === "d2grid") {
          if (parentControl["fields"]) {
            return parentControl["fields"]["item"]["fields"][childCntrlId];
          } else {
            return parentControl["items"]["properties"][childCntrlId];
          }
        }
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
    shouldApplyRowBasedEvaluation: function(targetControl, sourceControlName) {
      if (targetControl.parent && targetControl.parent.parent && targetControl.parent.parent.options._d2Containertype === "d2grid" && targetControl.parent.parent.options.row_based_condition) {
        return targetControl.parent.childrenByPropertyId[sourceControlName];
      }
    },
    _modifyModel: function() {
      this._superModifyModel();
      var that = this;
      var toggleModeOptions = _.bind(function(fields) {
        _.each(fields, function(field) {
          if (![ "dctmwlabel", "d2label" ].includes(field._d2type)) {
            field.readonly = that.mode === "update";
          }
          if (field._d2Containertype) {
            if (field._d2Containertype === "d2grid") {
              toggleModeOptions(field.fields);
              toggleModeOptions(field.fields.item.fields);
            } else {
              toggleModeOptions(field.fields);
            }
          }
        });
      }, this);
      var toggleModeSchema = _.bind(function(properties) {
        _.each(properties, function(property) {
          if (property._d2Containertype && property._d2Containertype === "d2grid") {
            property.readonly = that.mode === "update";
            toggleModeSchema(property.items.properties);
          } else if (property.properties) {
            toggleModeSchema(property.properties);
          } else if (![ "dctmwlabel", "d2label" ].includes(property._d2type)) {
            property.readonly = that.mode === "update";
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
      var addActionBar = function(alpField, idx) {
        _.extend(alpField, {
          actionbar: {
            actions: [ {
              action: "remove",
              enabled: true,
              title: alpField.isSetType ? lang.removeRow : lang.removeField,
              "aria-label": alpField.isSetType ? lang.removeRow : lang.removeField,
              iconClass: "csui-icon circle_delete_grey" + " csui-array-icon-delete-" + idx,
              actionAria: _.str.sformat(lang.removeFieldAria, alpField.label)
            }, {
              action: "add",
              enabled: true,
              title: alpField.isSetType ? lang.addRow : lang.addField,
              "aria-label": alpField.isSetType ? lang.addRow : lang.addField,
              iconClass: "csui-icon circle_add_grey csui-array-icon-add-" + idx,
              actionAria: _.str.sformat(lang.addFieldAria, alpField.label)
            }, {
              action: "up",
              enabled: false
            }, {
              action: "down",
              enabled: false
            } ]
          }
        });
      };
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
      var updateAlpFieldsActionBar = _.bind(function(fields) {
        _.each(fields, function(field) {
          if (field._d2Containertype) {
            if (field._d2Containertype === "d2grid" && !!field.toolbarSticky) {
              addActionBar(field, field.uniqueId);
            } else {
              updateAlpFieldsActionBar(field.fields);
            }
          }
        });
      }, this);
      updateAlpFieldsActionBar(this.alpaca.options.fields);
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
          var reqFields = args.model.attributes?.requiredfields, isRequired = model.required && !model.hidden && !model.disabled;
          var fieldTitle = model.title;
          if (!reqFields) {
            reqFields = [];
          }
          if (this.node._changedFormValuesMap && !!model) {
            if (FormatUtils.isDateType(model.format)) {
              this.node._changedFormValuesMap["properties"][name] = FormatUtils.convertToServerFormat(args.value);
              this.checkRequiredFields(reqFields, fieldTitle, isRequired, FormatUtils.convertToServerFormat(args.value));
            } else if (model._d2Containertype === "d2grid") {
              model.valueChanged = true;
              if (!this.options.originatingView.options.gridState) {
                this.options.originatingView.options.gridState = {};
              }
              this.options.originatingView.options.gridState[model.items.firstColId] = true;
              for (var property in model.items.properties) {
                if (Object.prototype.hasOwnProperty.call(model.items.properties, property)) {
                  var prop = model.items.properties[property];
                  fieldTitle = prop.title;
                  isRequired = prop.required && !prop.hidden && !prop.disabled;
                  var propertyValues = _.pluck(args.fieldvalue ? args.fieldvalue : args.targetField.value, property);
                  if (FormatUtils.isDateType(prop.format)) {
                    propertyValues = _.map(propertyValues, function(propertyValue) {
                      return FormatUtils.convertToServerFormat(propertyValue);
                    });
                  }
                  this.node._changedFormValuesMap["properties"][property] = propertyValues;
                }
              }
            } else {
              let type = args?.fieldView?.alpacaField?.options?._type, isMultiVal = args?.fieldView?.alpacaField?.options?._repeating === true && _.isArray(args.value);
              if (type === "integer") {
                args.value = isMultiVal ? _.map(args.value, val => {
                  return parseInt("" + val);
                }) : parseInt("" + args.value);
              } else if (type === "double") {
                args.value = isMultiVal ? _.map(args.value, val => {
                  return parseFloat("" + val);
                }) : parseFloat("" + args.value);
              }
              this.node._changedFormValuesMap["properties"][name] = args.value;
              this.checkRequiredFields(reqFields, fieldTitle, isRequired, args.value);
            }
          }
        }
      }
    },
    checkRequiredFields: function(reqFields, fieldTitle, isRequired, value) {
      if (fieldTitle && isRequired) {
        var exists = $.grep(reqFields, function(field) {
          return field === fieldTitle;
        })?.length > 0;
        if (_.isEmpty(value)) {
          if (!exists) {
            reqFields.push(fieldTitle);
          }
        } else {
          reqFields = $.grep(reqFields, function(field) {
            return field !== fieldTitle;
          });
        }
      }
      this.resetFormRequiredFields(reqFields);
    },
    removeEmptyGridRows: function(properties) {
      var me = this;
      var gridGroup = {};
      _.each(properties, function(value, key) {
        var fieldPath = me._keyPathMap[key];
        if (fieldPath && fieldPath.fieldPath) {
          fieldPath = fieldPath.fieldPath.substring(0, fieldPath?.fieldPath.lastIndexOf("."));
          var model = me.getFieldForPath(me.alpaca.schema, "properties", ".", fieldPath);
          if (model && model._d2Containertype === "d2grid") {
            var gridName = fieldPath.substring(fieldPath.lastIndexOf("."));
            if (!gridGroup[gridName]) {
              gridGroup[gridName] = [];
            }
            gridGroup[gridName].push(key);
          }
        }
      });
      _.each(gridGroup, function(gridProperties) {
        me.removeEmptyRows(properties, gridProperties);
      });
    },
    removeEmptyRows: function(properties, gridProperties) {
      var isNull = true;
      _.each(gridProperties, function(prop) {
        if (properties[prop].length > 0) {
          var lastValue = _.last(properties[prop]), isNonEmptyRow = _.isNumber(lastValue) && !_.isNaN(lastValue) || _.isBoolean(lastValue) ? !_.isNull(lastValue) && !_.isUndefined(lastValue) : !_.isEmpty(lastValue);
          if (isNonEmptyRow) {
            isNull = false;
          }
        } else {
          isNull = false;
        }
      });
      if (isNull) {
        _.each(gridProperties, function(prop) {
          properties[prop].pop();
        });
        this.removeEmptyRows(properties, gridProperties);
      }
    },
    _raiseInvalidChangeEvent: function() {
      this.triggerMethod("d2:change:formValidation", {
        status: false
      });
    },
    _raiseValidChangeEvent: function() {
      this.triggerMethod("d2:change:formValidation", {
        status: true
      });
    },
    getValues: function() {
      var values = FormView.prototype.getValues.call(this);
      var editDateValues = function(controls, values) {
        _.each(controls, function(control) {
          if (FormatUtils.isDateType(control.type)) {
            values[control.propertyId] = FormatUtils.convertToServerFormat(control.getValue());
          }
          if (control.options._repeating && !_.isArray(values[control.propertyId]) && !control.options.isGridField) {
            values[control.propertyId] = [ values[control.propertyId] ];
          }
          if (control.children) {
            if (control.schema && control.schema._d2Containertype === "d2grid") {
              if (control.schema.valueChanged) {
                var rows = control.children;
                _.each(rows, function(row, index) {
                  var columns = row.children;
                  editDateValues(columns, values[control.propertyId][index]);
                });
              }
            } else {
              editDateValues(control.children, values[control.propertyId]);
            }
          }
        });
      };
      editDateValues(this.form.children, values);
      return values;
    },
    getLabelOrValues: function() {
      var values = FormView.prototype.getValues.call(this);
      var getChildControls = function(controls, values) {
        _.each(controls, function(control) {
          var type = control.type;
          if (FormatUtils.isDateType(type)) {
            values[control.propertyId] = FormatUtils.convertToServerFormat(control.getValue());
          }
          if (control.options._repeating && !_.isArray(values[control.propertyId]) && !control.options.isGridField) {
            values[control.propertyId] = [ values[control.propertyId] ];
          }
          if (type === "d2combo" || type === "d2list") {
            values[control.propertyId] = control?.fieldView?.getValueLabel();
          }
          if (control.children) {
            if (control.schema && control.schema._d2Containertype === "d2grid") {
              if (control.schema.valueChanged) {
                var rows = control.children;
                _.each(rows, function(row, index) {
                  var columns = row.children;
                  getChildControls(columns, values[control.propertyId][index]);
                });
              }
            } else {
              getChildControls(control.children, values[control.propertyId]);
            }
          }
        });
      };
      getChildControls(this.form.children, values);
      return values;
    },
    cacheFormState: function() {
      this.model.focusedTabs = {};
      var options = this.model.get("options");
      var tabGroupIds = [];
      formUtils.jsonObjTraverse(options.fields, "", "type", "d2tabgroup", tabGroupIds, "fields", false);
      if (tabGroupIds.length > 0) {
        _.each(tabGroupIds, function(tabGroupId) {
          var path = this._keyPathMap[tabGroupId];
          var control = this.getAlpacaControlByPath(path.fieldPath, ".");
          var activeTabId = control ? control.getCurrentlyActiveTabId() : undefined;
          this.model.focusedTabs[tabGroupId] = activeTabId;
        }, this);
      }
    },
    resetFormState: function() {
      this.model.focusedTabs = undefined;
    },
    setVisible: function(control, value) {
      FormView.prototype.setVisible.call(this, control, value);
      var formRequired = this.hasFormRequired();
      this.resetFormRequiredFields(formRequired.reqFields);
    },
    loadMixins: function() {
      ExpressionExecutorMixin.mixin(D2GeneralFormView.prototype);
      ExpressionGeneratorMixin.mixin(D2GeneralFormView.prototype);
      ExpressionValidatorMixin.mixin(D2GeneralFormView.prototype);
    }
  });
  return D2GeneralFormView;
});