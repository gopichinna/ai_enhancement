/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "csui/dialogs/modal.alert/modal.alert", "d2/models/workflow/workflow", "d2/utils/constants", "d2/utils/form.utils", "d2/utils/rest.linkrels", "d2/utils/task.utils", "dctmw/utils/utils", "i18n!d2/dialogs/launch.workflow/impl/nls/lang", "css!d2/dialogs/launch.workflow/impl/launch.workflow.dialog" ], function(require, _, $, Backbone, Url, ModalAlert, WorkFlowModel, constants, formUtils, RestLinkrels, taskUtils, utils, lang) {
  "use strict";
  function LaunchWorkflowDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(LaunchWorkflowDialog.prototype, {
    STEPS: {
      GENERAL: "general",
      PROCESSVARIABLE: "processVariables",
      PERFORMERS: "performers",
      DOCUMENTS: "documents",
      SCHEDULE: "schedule"
    },
    show: function() {
      this._deferred = $.Deferred();
      this._showWizard();
      return this._deferred.promise();
    },
    _createWizardSteps: function(finalSteps, viewClasses) {
      var me = this, node = this.options.node;
      const includePvStep = _.contains(finalSteps, me.STEPS.PROCESSVARIABLE) && node.get("process-variables-dialog"), hasPerformersStep = _.contains(finalSteps, me.STEPS.PERFORMERS), performersPrevStep = includePvStep ? me.STEPS.PROCESSVARIABLE : me.STEPS.GENERAL, documentsPrevStep = hasPerformersStep ? me.STEPS.PERFORMERS : performersPrevStep;
      var stepsDefinition = [];
      var generalStep = {
        id: this.STEPS.GENERAL,
        viewClass: viewClasses.WorkflowGeneralView,
        isRequired: true,
        title: function() {
          return node["workflow_config_label"];
        },
        subTitle: function() {
          return me._getSubtitle(node);
        },
        buttons: [ {
          id: "finish",
          isPrimary: false,
          label: lang.finishButtonLabel,
          disabled: function() {
            var pvstep = _.filter(me._wizard.steps, function(step) {
              return step.id === me.STEPS.PROCESSVARIABLE;
            });
            var disable = pvstep && pvstep.length === 1;
            return !me.areAllStepsValid() || disable;
          },
          clickHandler: function() {
            me.finishHandler(this);
          }
        }, {
          id: "next",
          label: lang.nextButtonLabel,
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.nextStep();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      var processVariableStep = {
        id: this.STEPS.PROCESSVARIABLE,
        previousStepId: this.STEPS.GENERAL,
        viewClass: viewClasses.WorkflowVariablesGroupView,
        isRequired: true,
        title: function() {
          return node["workflow_config_label"];
        },
        subTitle: function() {
          return me._getSubtitle(node);
        },
        buttons: [ {
          id: "finish",
          isPrimary: false,
          label: lang.finishButtonLabel,
          disabled: function() {
            return !me.areAllStepsValid();
          },
          clickHandler: function() {
            me.finishHandler(this);
          }
        }, {
          id: "next",
          label: lang.nextButtonLabel,
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.nextStep();
          }
        }, {
          id: "previous",
          toolTip: lang[me.STEPS.GENERAL + "_Section_Title"],
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      var performersStep = {
        id: this.STEPS.PERFORMERS,
        previousStepId: performersPrevStep,
        viewClass: viewClasses.WorkflowPerformersView,
        viewOptions: {
          formResponse: this.options.formResponse
        },
        isRequired: me.options.performersRequired,
        title: function() {
          return node["workflow_config_label"];
        },
        subTitle: function() {
          return me._getSubtitle(node);
        },
        buttons: [ {
          id: "finish",
          isPrimary: false,
          label: lang.finishButtonLabel,
          disabled: function() {
            return !me.areAllStepsValid();
          },
          clickHandler: function() {
            me.finishHandler(this);
          }
        }, {
          id: "next",
          label: lang.nextButtonLabel,
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            this.validatePerformers({
              refreshState: true,
              validateOnlyRequiredFields: false
            }).done(_.bind(function() {
              _.isFunction(this.updateModelData) && this.updateModelData();
              me._wizard && me._wizard.nextStep();
            }, this));
          }
        }, {
          id: "previous",
          toolTip: lang[me.STEPS.GENERAL + "_Section_Title"],
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      var documentsStep = {
        id: this.STEPS.DOCUMENTS,
        previousStepId: documentsPrevStep,
        viewClass: viewClasses.WorkflowAttachmentView,
        title: function() {
          return node["workflow_config_label"];
        },
        subTitle: function() {
          return me._getSubtitle(node);
        },
        buttons: [ {
          id: "finish",
          isPrimary: function() {
            return !_.contains(finalSteps, me.STEPS.SCHEDULE);
          },
          label: lang.finishButtonLabel,
          disabled: function() {
            return !me.areAllStepsValid();
          },
          clickHandler: function() {
            me.finishHandler(this);
          }
        }, {
          id: "next",
          label: lang.nextButtonLabel,
          hidden: function() {
            return !_.contains(finalSteps, me.STEPS.SCHEDULE);
          },
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.nextStep();
          }
        }, {
          id: "previous",
          toolTip: _.contains(finalSteps, me.STEPS.PERFORMERS) ? lang[me.STEPS.PERFORMERS + "_Section_Title"] : lang[me.STEPS.GENERAL + "_Section_Title"],
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      var scheduleStep = {
        id: this.STEPS.SCHEDULE,
        previousStepId: me.STEPS.DOCUMENTS,
        viewClass: viewClasses.WorkflowScheduleView,
        title: function() {
          return node["workflow_config_label"];
        },
        subTitle: function() {
          return me._getSubtitle(node);
        },
        buttons: [ {
          id: "finish",
          isPrimary: function() {
            return true;
          },
          label: lang.finishButtonLabel,
          disabled: function() {
            return !me.areAllStepsValid();
          },
          clickHandler: function() {
            me.finishHandler(this);
          }
        }, {
          id: "next",
          hidden: true
        }, {
          id: "previous",
          toolTip: lang[me.STEPS.DOCUMENTS + "_Section_Title"],
          disabled: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            _.isFunction(this.updateModelData) && this.updateModelData();
            me._wizard && me._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      _.each(finalSteps, function(step) {
        if (step === me.STEPS.GENERAL) {
          stepsDefinition.push(generalStep);
        }
        if (step === me.STEPS.PROCESSVARIABLE && includePvStep) {
          stepsDefinition.push(processVariableStep);
        }
        if (step === me.STEPS.PERFORMERS) {
          stepsDefinition.push(performersStep);
        }
        if (step === me.STEPS.DOCUMENTS) {
          stepsDefinition.push(documentsStep);
        }
        if (step === me.STEPS.SCHEDULE) {
          stepsDefinition.push(scheduleStep);
        }
      });
      var stepOptions = null;
      if (!_.isEmpty(stepsDefinition)) {
        stepOptions = {
          steps: stepsDefinition,
          StepHeaderView: viewClasses.StepHeaderView,
          usePreviousStepTitleAsBackButtonTooltip: false,
          data: {
            context: this.options.status.context,
            node: this.options.node,
            command: this.options.command,
            status: this.options.status
          },
          className: "d2-launch-workflow-wizard"
        };
      }
      if (utils.isMobile()) {
        stepOptions.StepFooterView = viewClasses.StepFooterView;
        _.each(stepsDefinition, function(step) {
          step.viewOptions = _.defaults(step.viewOptions, {
            message1: lang[step.id + "_Section_Title"],
            headerCloseButton: "cancel",
            stepFooterButton: "next",
            stepFooterPrevButton: "previous",
            supressBackButton: true
          });
        });
        _.last(stepsDefinition).viewOptions.stepFooterButton = "finish";
        scheduleStep.viewOptions = _.defaults(scheduleStep.viewOptions, {
          hideSubjectRegion: true
        });
      }
      return stepOptions;
    },
    areAllStepsValid: function() {
      var valid = true;
      _.each(this._wizard.steps, function(step) {
        if (step.view) {
          valid = valid && step.view.isValid();
        }
      });
      return valid;
    },
    finishHandler: function(view) {
      _.isFunction(view.updateModelData) && view.updateModelData();
      this._wizard.close();
    },
    _showWizard: function() {
      var me = this;
      var waitForStepCalculation = this.calculateApplicableStepsForWorkflowLaunch();
      this._loadDependencies(this._getDependenciesMap()).then(viewClasses => {
        let {
          StepperWizard
        } = viewClasses;
        viewClasses = _.omit(viewClasses, "StepperWizard");
        waitForStepCalculation.done(function(steps) {
          var stepOptions = me._createWizardSteps(steps, viewClasses);
          if (stepOptions) {
            me._wizard = new StepperWizard(stepOptions);
            var allStepsRendered = [];
            _.each(stepOptions.steps, function(step) {
              if (step.id === "performers") {
                var formRendered = $.Deferred();
                me._wizard.steps[step.id].view = new me._wizard.steps[step.id].viewClass(me._wizard.steps[step.id].options);
                var stepView = me._wizard.steps[step.id].view;
                stepView.listenToOnce(stepView, "step:rendered", function() {
                  stepView.formView.onFormFieldValidate().then(function() {
                    stepView.isValid() && _.isFunction(stepView.updateModelData) && stepView.updateModelData();
                  }).always(function() {
                    formRendered.resolve();
                  });
                });
                stepView.render();
                allStepsRendered.push(formRendered.promise());
              }
            });
            $.when.apply($, allStepsRendered).done(function() {
              me.options.command._unblockActions(me.options.status.originatingView);
              me._wizard.show().on("wizard:closed", function(isCancel) {
                if (isCancel) {
                  me._deferred.reject("close");
                } else {
                  me._deferred.resolve();
                }
              });
            }).fail(me._deferred.reject);
          } else {
            me._deferred.resolve();
          }
        }).fail(me._deferred.reject);
      }, me._deferred.reject);
    },
    _loadDependencies: function(depMap) {
      const deferred = $.Deferred(), deps = [], depKeys = [];
      Object.entries(depMap).forEach(([ depName, depPath ]) => {
        if (depPath) {
          deps.push(depPath);
          depKeys.push(depName);
        }
      });
      require(deps, function() {
        const depMap = {};
        for (let i = 0; i < arguments.length; i++) {
          depMap[depKeys[i]] = arguments[i];
        }
        deferred.resolve(depMap);
      }, deferred.reject);
      return deferred.promise();
    },
    _getDependenciesMap: function() {
      const depMap = {
        StepperWizard: "d2/controls/stepper.wizard/stepper.wizard.view",
        StepHeaderView: "d2/dialogs/launch.workflow/impl/launch.workflow.dialog.header/launch.workflow.header.view",
        WorkflowGeneralView: "d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general.view",
        WorkflowVariablesGroupView: "d2/dialogs/launch.workflow/impl/launch.workflow.variables/launch.workflow.variables.group.view",
        WorkflowAttachmentView: "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.view",
        WorkflowPerformersView: "d2/dialogs/launch.workflow/impl/launch.workflow.performers/launch.workflow.performers.view",
        WorkflowScheduleView: "d2/dialogs/launch.workflow/impl/launch.workflow.schedule/launch.workflow.schedule.view"
      };
      if (utils.isMobile()) {
        _.extend(depMap, {
          StepHeaderView: "d2mob/dialogs/mobile.launch.workflow/impl/mobile.launch.workflow.dialog.header/launch.workflow.header.view",
          WorkflowAttachmentView: "d2mob/dialogs/mobile.launch.workflow/impl/mobile.launch.workflow.attachments/mobile.launch.workflow.attachments.view",
          WorkflowVariablesGroupView: "d2mob/dialogs/mobile.launch.workflow/impl/mobile.launch.workflow.variables/mobile.launch.workflow.variables.view",
          StepFooterView: "d2mob/dialogs/mobile.launch.workflow/impl/mobile.launch.workflow.footer/launch.workflow.footer"
        });
      }
      return depMap;
    },
    calculateApplicableStepsForWorkflowLaunch: function() {
      var waitForStepCalculation = $.Deferred(), link = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.D2_PROCESS_VARIABLE_CONFIG), me = this;
      this.finalSteps = _.clone(this.STEPS);
      this.finalSteps = this.options.node.is_workflow_scheduling_enabled ? this.finalSteps : _.omit(this.finalSteps, "SCHEDULE");
      this.finalSteps = link ? this.finalSteps : _.omit(this.finalSteps, "PROCESSVARIABLE");
      link = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.D2_WORKFLOW_LAUNCH_PEROFMERS_DIALOG);
      if (link) {
        var qParams = {
          "document-id": this.options.node.workingFiles[0].get("id")
        }, url = Url.appendQuery(link, Url.combineQueryString(qParams));
        taskUtils.getUpdatePerformerForm(this.options.node, {
          formUrl: url
        }).done(function(formResponse) {
          me.options.formResponse = formResponse;
          var reqFields = [];
          formUtils.jsonObjTraverse(formResponse["page-content"].dialog.content, "", "requiredOnStartup", true, reqFields, "properties", true);
          me.options.performersRequired = !!reqFields.length;
          waitForStepCalculation.resolve(me.finalSteps);
        }).fail(waitForStepCalculation.reject);
      } else {
        this.finalSteps = _.omit(this.finalSteps, "PERFORMERS");
        return waitForStepCalculation.resolve(this.finalSteps).promise();
      }
      return waitForStepCalculation.promise();
    },
    _getSubtitle: function(node) {
      if (!(node.workingFiles && node.workingFiles.length >= 0)) {
        return;
      }
      if (utils.isMobile()) {
        return node.workingFiles.length === 1 ? lang.mobileOneFileSubtitle : _.str.sformat(lang.mobileManyFilesSubtitle, node.workingFiles.length);
      } else {
        return node.workingFiles.length === 1 ? node.workingFiles[0].get("name") : _.str.sformat(lang.manyFilesSubtitle, node.workingFiles.length);
      }
    },
    onCancel: function() {
      var deferred = $.Deferred(), buttonOptions = {
        labelYes: lang.confirmDialogLabelYes,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, lang.confirmDialogMessage, lang.confirmDialogTitle, {
        buttons: buttonOptions
      });
      return deferred.promise();
    }
  });
  return LaunchWorkflowDialog;
});