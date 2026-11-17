/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/form", "nuc/utils/log", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/utils/constants", "d2/utils/task.utils", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/format.utils", "nuc/utils/types/date", "i18n!d2/widgets/workflow.queryform/impl/nls/lang", "css!d2/widgets/workflow.queryform/impl/workflow.query.form" ], function($, _, Backbone, FormModel, log, PerfectScrollingBehavior, WizardTabableRegionBehavior, constants, taskUtils, D2FormView, MetadataConverter, formatUtils, date, lang) {
  "use strict";
  var FIELD_WF_DOCUMENT_ID = "document-id", FIELD_WF_TEMPLATE_ID = "template-ids", FIELD_WF_USER_TYPE = "wf-user-type", FIELD_WF_USERS = "wf-users", FIELD_WF_STATE = "wf-states", FIELD_WF_OVERDUE_DATE = "overdue", FIELD_WF_DATE_FROM = "wf-start-date-range-from", FIELD_WF_DATE_TO = "wf-start-date-range-to";
  return D2FormView.extend({
    constructor: function WorkflowQueryPanelView(options) {
      var formModelData = this.getFormModelData(options);
      options.model = new FormModel(formModelData);
      options.mode = "create";
      _.extend(this.behaviors, {
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          suppressScrollX: true,
          scrollYMarginOffset: 15
        },
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
      this.listenTo(this, "d2:change:formValidation", this.onFormFieldValidate);
      this.userData = {};
    },
    className: function() {
      var parentClassName = D2FormView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      var reportingTypeClassName = this.options.workflowsReportingType === constants.WorkflowsReportingType.ALL ? "d2-all-workflow-query-panel" : "d2-my-workflow-query-panel";
      return parentClassName + " d2-workflow-query-panel " + reportingTypeClassName;
    },
    getFormValues: function() {
      var formMap = this.getValues();
      if (formMap && _.keys(formMap).length > 0) {
        var queryformValue = {};
        _.each(formMap, function(value, key) {
          if (!value) {
            return;
          }
          if (key === FIELD_WF_DATE_FROM) {
            var local_from_date = formatUtils.convertToMoment(value);
            value = date.formatISODate(local_from_date);
          } else if (key === FIELD_WF_DATE_TO) {
            var local_to_date = formatUtils.convertToMoment(value);
            local_to_date.hour(23).minute(59).second(59);
            value = date.formatISODate(local_to_date);
          }
          queryformValue[key] = value;
        });
        return queryformValue;
      }
    },
    setUserData: function(usersDump) {
      _.extend(this.userData, usersDump);
    },
    onFormFieldValidate: function() {
      this.validateForm(true, false).done(function(isValid) {
        this.formValidated = isValid;
        this.updateFooterButton();
      }.bind(this));
    },
    validateAllForms: function(refreshState, validateOnlyRequiredFields) {
      return this.validateForm(refreshState, validateOnlyRequiredFields);
    },
    updateFooterButton: function() {
      this.searchButtonDisabled = !this.formValidated;
      if (this.options.wizard) {
        this.options.wizard.refreshFooter();
      }
      if (this.options.parent) {
        this.options.parent.refreshFooter();
      }
    },
    getFormModelData: function(options) {
      var self = this, formData = self.getQueryFormData(options), form = MetadataConverter.convertConfig(formData, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field, alpControl) {
          if (field && alpControl) {
            var fieldId = field.id;
            if (fieldId === FIELD_WF_DOCUMENT_ID && options.widgetName) {
              if (options.widgetName) {
                _.extend(alpControl["options"]["fields"][fieldId], {
                  placeholder: lang.nodePickerPlaceHolder
                });
              }
            } else if (fieldId === FIELD_WF_TEMPLATE_ID && options.widgetName) {
              if (options.widgetName) {
                _.extend(alpControl["options"]["fields"][fieldId], {
                  nodeSelectWidgetName: options.widgetName,
                  includeWorkflowTemplates: true,
                  placeholder: lang.nodePickerPlaceHolder
                });
              }
            } else if (fieldId === FIELD_WF_USERS) {
              _.extend(alpControl["options"]["fields"][fieldId], {
                ensureUserInfoForValue: true
              });
              field.getDataSourceCallBack = function(attr, alpField) {
                var dfd = $.Deferred(), fieldOptions = alpField.options.ds, fieldView = alpField.fieldView, filter = fieldOptions && fieldOptions.filter || "";
                taskUtils.getUserForWorkflowWidget(options.widgetName, filter, options).done(function(userResponse) {
                  if (userResponse["has-more-records"]) {
                    fieldView.collection.hasMoreRecords = true;
                  } else if (!filter) {
                    fieldView.allUserOptions = userResponse.options;
                    field.asynchronous = false;
                    delete alpField.options.ds;
                  }
                  self.setUserData(userResponse.userData);
                  dfd.resolve(fieldView.allUserOptions || userResponse.options);
                }).fail(dfd.reject);
                return dfd.promise();
              };
            }
          }
        }
      });
      return form.propertiesConfig[0];
    },
    getQFormParamsFromUrl: function(options) {
      var qparamMap = {};
      try {
        var qparam = options.context.viewStateModel.getViewState("qform-param", true);
        if (qparam) {
          qparamMap = JSON.parse(qparam);
        }
      } catch (err) {
        log.error("Error while getting query form param from view state model", err);
      }
      return qparamMap;
    },
    getQueryFormData: function(options) {
      var qparamMap = this.getQFormParamsFromUrl(options);
      function getDefaultStates() {
        return options.ignoreDefaultState ? [] : [ constants.WorkflowState.SCHEDULED, constants.WorkflowState.RUNNING, constants.WorkflowState.PAUSED ];
      }
      function getFieldValue(fieldId) {
        if (options.ignoreDefaultValue) {
          return;
        }
        return qparamMap && qparamMap[fieldId];
      }
      function getUpdatedFieldOptions(fieldId, fieldOptions, preSelectOptions, ignoreFieldReset) {
        if (options.ignoreDefaultValue && !ignoreFieldReset) {
          _.each(fieldOptions, function(fieldOption) {
            delete fieldOption.s;
          });
          return fieldOptions;
        }
        function updatedFieldOptionItem(queryValue) {
          if (queryValue) {
            if (fieldOptions) {
              var fieldOption = _.findWhere(fieldOptions, {
                v: queryValue
              });
              fieldOption.s = true;
            } else {
              fieldOptions = [ {
                v: queryValue,
                s: true
              } ];
            }
          }
        }
        if (qparamMap) {
          var queryValues = qparamMap[fieldId];
          if (queryValues) {
            if (_.isArray(queryValues)) {
              _.each(queryValues, function(queryValue) {
                updatedFieldOptionItem(queryValue);
              });
            } else if (_.isString(queryValues)) {
              updatedFieldOptionItem(queryValues);
            }
          } else if (preSelectOptions && preSelectOptions.length > 0) {
            _.each(preSelectOptions, function(preSelectOption) {
              if (preSelectOption) {
                var fieldOption = _.findWhere(fieldOptions, {
                  v: preSelectOption
                });
                if (fieldOption) {
                  fieldOption.s = true;
                }
              }
            });
          }
        }
        return fieldOptions;
      }
      var formContent = {
        order: 1
      }, formData = {
        dialog: {
          content: formContent
        }
      }, wfDocumentIdField = {
        id: FIELD_WF_DOCUMENT_ID,
        label: lang.documentName,
        property_type: "string",
        repeating: false,
        value: getFieldValue(FIELD_WF_DOCUMENT_ID),
        storeContainer: options["document-id_storeContainer"],
        restoreContainer: options["document-id_restoreContainer"]
      }, wfTemplateIdField = {
        id: FIELD_WF_TEMPLATE_ID,
        label: lang.templateName,
        property_type: "string",
        repeating: false,
        value: getFieldValue(FIELD_WF_TEMPLATE_ID)
      }, wfUserType = {
        id: FIELD_WF_USER_TYPE,
        label: lang.userType,
        assistance_dictionary: "user_type",
        assistance_type: "dictionary",
        line: true,
        o: getUpdatedFieldOptions(FIELD_WF_USER_TYPE, [ {
          v: constants.WorkflowUserType.SUPERVISOR,
          l: lang.userTypeSupervisor
        }, {
          v: constants.WorkflowUserType.PERFORMER,
          l: lang.userTypePerformer
        } ], [ constants.WorkflowUserType.SUPERVISOR ], true)
      }, wfUserDropdown = {
        id: FIELD_WF_USERS,
        label: lang.users,
        field_content_type: "USER_OR_GROUP",
        assistance_type: "custom",
        asynchronous: true,
        o: getUpdatedFieldOptions(FIELD_WF_USERS),
        autoselect_single: true
      }, wfStates = {
        id: FIELD_WF_STATE,
        line: true,
        condition_required: true,
        assistance_dictionary: "wf_state",
        assistance_type: "dictionary",
        label: lang.wfState,
        o: getUpdatedFieldOptions(FIELD_WF_STATE, [ {
          v: constants.WorkflowState.SCHEDULED,
          l: lang.wfStateScheduled
        }, {
          v: constants.WorkflowState.RUNNING,
          l: lang.wfStateRunning
        }, {
          v: constants.WorkflowState.PAUSED,
          l: lang.wfStatePaused
        }, {
          v: constants.WorkflowState.ABORTED,
          l: lang.wfStateAborted
        }, {
          v: constants.WorkflowState.FINISHED,
          l: lang.wfStateFinished
        } ], getDefaultStates())
      }, wfOverdueDate = {
        id: FIELD_WF_OVERDUE_DATE,
        line: true,
        assistance_dictionary: "D2-Base Types",
        assistance_dictionary_alias: "auto",
        assistance_type: "dictionary",
        label: lang.overdueDate,
        o: getUpdatedFieldOptions(FIELD_WF_OVERDUE_DATE, [ {
          v: "overdue_workflows",
          l: lang.overdueWorkflows
        } ])
      }, wfStarteDateFrom = {
        id: FIELD_WF_DATE_FROM,
        condition_validation: "getValue(" + FIELD_WF_DATE_FROM + ").isLessOrEqualsThan('getValue(" + FIELD_WF_DATE_TO + ")')",
        label: lang.dateFrom,
        mapping_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
        value_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
        property_type: "date",
        value: getFieldValue(FIELD_WF_DATE_FROM),
        mapping_value: getFieldValue(FIELD_WF_DATE_FROM),
        validation_message: lang.dateFromValidation
      }, wfStartDateTo = {
        id: FIELD_WF_DATE_TO,
        condition_validation: "getValue(" + FIELD_WF_DATE_TO + ").isGreaterOrEqualsThan('getValue(" + FIELD_WF_DATE_FROM + ")')",
        label: lang.dateTo,
        mapping_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
        value_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
        property_type: "date",
        value: getFieldValue(FIELD_WF_DATE_TO),
        mapping_value: getFieldValue(FIELD_WF_DATE_TO),
        validation_message: lang.dateToValidation
      }, myWorkflowQueryFields = {
        "list-checkbox": [ _.extend({
          order: "1.1"
        }, wfStates), _.extend({
          order: "1.2"
        }, wfOverdueDate) ],
        date: [ _.extend({
          order: "1.3"
        }, wfStarteDateFrom), _.extend({
          order: "1.4"
        }, wfStartDateTo) ],
        "node-picker": [ _.extend({
          order: "1.5"
        }, wfDocumentIdField), _.extend({
          order: "1.6"
        }, wfTemplateIdField) ]
      }, allWorkflowQueryFields = {
        "node-picker": [ _.extend({
          order: "1.1"
        }, wfDocumentIdField), _.extend({
          order: "1.2"
        }, wfTemplateIdField) ],
        "list-radio": _.extend({
          order: "1.3"
        }, wfUserType),
        combo: _.extend({
          order: "1.4"
        }, wfUserDropdown),
        "list-checkbox": [ _.extend({
          order: "1.5"
        }, wfStates), _.extend({
          order: "1.6"
        }, wfOverdueDate) ],
        date: [ _.extend({
          order: "1.7"
        }, wfStarteDateFrom), _.extend({
          order: "1.8"
        }, wfStartDateTo) ]
      };
      _.extend(formContent, options.workflowsReportingType === constants.WorkflowsReportingType.ALL ? allWorkflowQueryFields : myWorkflowQueryFields);
      return formData;
    }
  });
});