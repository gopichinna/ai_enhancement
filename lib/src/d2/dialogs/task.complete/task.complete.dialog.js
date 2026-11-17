/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "d2/utils/constants", "d2/utils/rest.linkrels", "d2/utils/task.utils", "dctmw/utils/utils", "i18n!d2/dialogs/task.complete/impl/nls/lang" ], function(require, _, $, Url, GlobalMessage, ModalAlert, constants, RestLinkrels, taskUtils, utils, lang) {
  "use strict";
  function TaskCompleteDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(TaskCompleteDialog.prototype, {
    STEPS: Object.freeze({
      TASK_MANAGE: "task_manage",
      TASK_ESIGN: "task_esign",
      TASK_PROPERTIES: "task_property_page",
      TASK_DIGITAL_SIGN_SIGNEE: "task_digital_sign_signee",
      TASK_DIGITAL_SIGN_SUPPORTING_DOCS: "task_digital_sign_supporting_docs",
      TASK_PROCESS_VARIABLES: "task_process_variables"
    }),
    _getActionLabel: function(node, command) {
      var action = node.actions.get(command.get("signature")), actionProperties = action && action.get("actionProperties"), label = actionProperties && actionProperties["name"] || command.PROPERTIES.DEFAULT_ACTION_LABEL;
      return _.isEmpty(node.get(command.PROPERTIES.ACTION_LABEL)) ? label : node.get(command.PROPERTIES.ACTION_LABEL);
    },
    _evaluateNextLabel: function(node, wizard, action, stepId, isLastFile) {
      stepId || (stepId = wizard.currentStep);
      var label = lang.TaskSubmitStepLabel;
      let isMobile = utils.isMobile();
      switch (stepId) {
       case this.STEPS.TASK_MANAGE:
        label = action._getPropertyPageLink(node) || node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || this._checkDigitalSignAllowed(node, action) ? lang.TaskNextStepLabel : label;
        break;

       case this.STEPS.TASK_PROCESS_VARIABLES:
        label = node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || this._checkDigitalSignAllowed(node, action) ? lang.TaskNextStepLabel : label;
        break;

       case this.STEPS.TASK_PROPERTIES:
        label = node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || node.get("process_variables") || this._checkDigitalSignAllowed(node, action) ? lang.TaskNextStepLabel : label;
        break;

       case this.STEPS.TASK_ESIGN:
        label = node.get(action.PROPERTIES.SIGNOFF_EACH_DOCUMENT) && !isLastFile ? isMobile ? lang.TaskNextStepLabel : lang.TaskNextFileStepLabel : this._checkDigitalSignAllowed(node, action) ? lang.TaskNextStepLabel : label;
        break;

       case this.STEPS.TASK_DIGITAL_SIGN_SIGNEE:
        label = this.supportingFileCollection.length > 0 && !node.get("wf_sv_disable_supporting_files") ? lang.TaskNextStepLabel : label;
        break;
      }
      return label;
    },
    _evaluateNextStep: function(node, wizard, masterPayload, options, action, digitalSignatureOptions, stepId, isLastFile) {
      stepId || (stepId = wizard.currentStep);
      if (stepId === this.STEPS.TASK_MANAGE && (action._getPropertyPageLink(node) || node.get("process_variables") || node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || this._checkDigitalSignAllowed(node, action)) || stepId === this.STEPS.TASK_PROPERTIES && (node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || node.get("process_variables") || this._checkDigitalSignAllowed(node, action)) || stepId === this.STEPS.TASK_PROCESS_VARIABLES && (node.get(action.PROPERTIES.SIGNOFF_REQUIRED) || this._checkDigitalSignAllowed(node, action)) || stepId === this.STEPS.TASK_ESIGN && (node.get(action.PROPERTIES.SIGNOFF_EACH_DOCUMENT) && !isLastFile || this._checkDigitalSignAllowed(node, action)) || stepId === this.STEPS.TASK_DIGITAL_SIGN_SIGNEE && (this.supportingFileCollection.length > 0 && !node.get("wf_sv_disable_supporting_files"))) {
        wizard && wizard.nextStep();
      } else {
        this._submitForm(node, wizard, masterPayload, options, action, digitalSignatureOptions);
      }
    },
    _submitForm: function(node, wizard, masterPayload, options, action, digitalSignatureOptions) {
      wizard.close({
        node: node,
        masterPayload: masterPayload,
        options: options,
        digitalSignatureOptions: digitalSignatureOptions
      });
    },
    _updateManageDialogPayload: function(values, masterPayload, options, action) {
      if (options && !options.disable_notes) {
        masterPayload["note_text"] = $.trim(values["task_note"]);
      }
      if (values["next_tasks"] && values["next_tasks"].length) {
        masterPayload[action.PROPERTIES.NEXT_TASKS] = values["next_tasks"];
      }
      if (values.performers) {
        _.extend(masterPayload, taskUtils.getPerformerAliasesData({
          data: values.performers
        }));
      }
    },
    _updateProcessVariablesDialogPayload: function(values, masterPayload) {
      if (values["process_variables"]) {
        masterPayload["process_variables"] = values["process_variables"];
      }
    },
    _updateESignDialogPayload: function(values, node, masterPayload, model, index, externalEsign) {
      _.extend(masterPayload["signoff-inputs"], {
        signoff_login: values.signoff_login,
        signoff_password: values.signoff_password
      });
      if (externalEsign) {
        masterPayload["signoff-inputs"].nonce_token = values.nonce_token;
      }
      if (!_.isUndefined(values.signoff_intentions)) {
        masterPayload["signoff-inputs"].signoff_intentions = masterPayload["signoff-inputs"].signoff_intentions || [];
        if (model && _.isNumber(index)) {
          var intention = {
            r_object_id: model.get("id"),
            intention: values.signoff_intentions
          };
          if (masterPayload["signoff-inputs"].signoff_intentions[index]) {
            masterPayload["signoff-inputs"].signoff_intentions[index] = intention;
          } else {
            masterPayload["signoff-inputs"].signoff_intentions.push(intention);
          }
        } else {
          masterPayload["signoff-inputs"].signoff_intentions = [ {
            r_object_id: node.get("id"),
            intention: values.signoff_intentions
          } ];
        }
      }
    },
    _createSteps: function(workingFileCollection, viewClasses, supportingFileCollection) {
      var action = this.options.command, options = this.options, node = options.node, masterPayload = {}, step, digitalSignatureOptions = {
        digitalSignEnabled: false
      }, isMobile = utils.isMobile(), me = this;
      var stepOptions = {
        steps: [],
        usePreviousStepTitleAsBackButtonTooltip: false,
        className: "d2-task-accept-reject-wizard"
      };
      if (action._evaluateManageDialogCondition(node)) {
        step = {
          id: me.STEPS.TASK_MANAGE,
          viewClass: viewClasses.TaskManageDialogView,
          viewOptions: {
            task: node,
            context: options.context,
            nextTasks: node.get(action.PROPERTIES.NEXT_TASKS),
            maxNextTasks: node.get(action.PROPERTIES.MAX_NEXT_TASKS),
            nextTasksEditable: action._nextTasksEditable(node),
            taskSubject: node.get("name"),
            mandatoryComment: node.get(action.PROPERTIES.MANDATORY_COMMENT),
            showTaskPerformers: action._evaluateTaskPerformersCondition(node),
            formResponse: options.performersForm
          },
          title: me._getActionLabel(node, action),
          buttons: [ {
            id: "next",
            disabled: function() {
              return !this.isValid();
            },
            label: function() {
              return me._evaluateNextLabel(node, me.wizard, action);
            },
            clickHandler: function() {
              this.validateAllTabs().done(_.bind(function() {
                var values = this.getAllFormValues();
                if (isMobile) {
                  values["next_tasks"] = _.isArray(values["next_tasks"]) ? values["next_tasks"] : [ values["next_tasks"] ];
                }
                if (action._getLifeCycleCheckLink(node) && action._nextTasksEditable(node) && !_.isEqual(this.previousCheckedTasks, values["next_tasks"])) {
                  me.wizard.blockActions();
                  action._checkLifeCycleConsistency(node, _.extend({
                    nextTasks: values["next_tasks"]
                  }, options)).done(function() {
                    this.previousCheckedTasks = _.clone(values["next_tasks"]);
                    me._updateManageDialogPayload(values, masterPayload, {
                      disable_notes: node.get("wf_sv_disable_notes")
                    }, action);
                    me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions);
                  }.bind(this)).always(function() {
                    me.wizard.unblockActions();
                  }).fail(function(xhr, message, statusText) {
                    GlobalMessage.showMessage("error", xhr.responseText ? utils.parseAjaxErrorAsString(xhr, statusText, message) : xhr);
                  });
                } else {
                  me._updateManageDialogPayload(values, masterPayload, {
                    disable_notes: node.get("wf_sv_disable_notes")
                  }, action);
                  me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions);
                }
              }, this));
            }
          } ],
          onCancel: function() {
            return me.onCancel();
          }
        };
        if (isMobile) {
          _.extend(step.viewOptions, {
            mobileTitle: step.title,
            message1: node.get("name"),
            action: action,
            hideSubjectRegion: true
          });
          step.buttons.push({
            id: "cancel",
            hidden: true
          });
        }
        stepOptions.steps.push(step);
      }
      if (action._getPropertyPageLink(node)) {
        step = {
          id: me.STEPS.TASK_PROPERTIES,
          viewClass: viewClasses.TaskMetadataPropertiesView,
          viewOptions: {
            masterDocumentId: workingFileCollection?.at(0)?.get("id"),
            node: node,
            context: this.options.context,
            propertyPage: action._getPropertyPageLink(node)
          },
          title: _.str.sformat(lang.EditTaskPropertiesTitle, me._getActionLabel(node, action)),
          isPropertyPageType: true,
          buttons: [ {
            id: "next",
            disabled: function() {
              return !this.isValid();
            },
            label: function() {
              return me._evaluateNextLabel(node, me.wizard, action);
            },
            clickHandler: function() {
              _.extend(masterPayload.document_properties, this.getFormValues());
              me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions);
            }
          } ],
          onCancel: function() {
            return me.onCancel();
          }
        };
        if (isMobile) {
          _.extend(step.viewOptions, {
            enableMetadataExpandCollapse: true,
            enableMetadataRequiredHeaderState: true,
            hideSubjectRegion: true,
            mobileTitle: lang.MobileEditTaskPropertiesTitle
          });
        }
        stepOptions.steps.push(step);
        masterPayload.document_properties = {};
      }
      if (node.get("process_variables")) {
        step = {
          id: me.STEPS.TASK_PROCESS_VARIABLES,
          viewClass: viewClasses.TaskUpdateProcessVariablesView,
          viewOptions: {
            task: node,
            context: options.context
          },
          title: _.str.sformat(lang.TaskProcessVariablesLabel, me._getActionLabel(node, action)),
          buttons: [ {
            id: "next",
            disabled: function() {
              return !this.isValid();
            },
            label: function() {
              return me._evaluateNextLabel(node, me.wizard, action);
            },
            clickHandler: function() {
              var values = this.getAllFormValues();
              me.wizard.blockActions();
              me._updateProcessVariablesDialogPayload(values, masterPayload);
              me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_PROCESS_VARIABLES);
              me.wizard.unblockActions();
            }
          } ],
          onCancel: function() {
            return me.onCancel();
          }
        };
        if (isMobile) {
          _.extend(step.viewOptions, {
            mobileTitle: step.title,
            taskModel: node,
            hideSubjectRegion: true
          });
        }
        stepOptions.steps.push(step);
      }
      if (node.get(action.PROPERTIES.SIGNOFF_REQUIRED)) {
        var _createESignatureStep = function(model, index) {
          var id = me.STEPS.TASK_ESIGN, isLastFile = true, fileCount = workingFileCollection.totalCount, subTitle = _.str.sformat(lang.TaskESignSubTitle, fileCount);
          if (_.isNumber(index)) {
            id = me.STEPS.TASK_ESIGN + (index + 1);
            isLastFile = index === workingFileCollection.totalCount - 1;
            subTitle = _.str.sformat(lang.TaskESignEachDocumentSubtitle, index + 1, fileCount);
          }
          if (fileCount === 1) {
            subTitle = (model || workingFileCollection.at(0)).get("name");
          }
          var externalESignRequired = node.get("external_esign_off") ? true : false;
          step = {
            id: id,
            viewClass: viewClasses.TaskESignatureDialogView,
            viewOptions: {
              node: node,
              model: fileCount !== 1 ? model : undefined,
              intentionsDictionary: RestLinkrels._getLinkMeta(node.get("links"), RestLinkrels[action.PROPERTIES.INTENTION_DICTIONARY]),
              intentionsRequired: node.get(action.PROPERTIES.INTENTION_REQUIRED),
              externalESignRequired: externalESignRequired,
              originatingView: options.originatingView,
              propertyPageData: masterPayload && masterPayload.document_properties ? masterPayload.document_properties : undefined,
              masterDocumentId: workingFileCollection.at(0).get("id"),
              dictionary: node.get(action.PROPERTIES.INTENTION_DICTIONARY_NAME)
            },
            title: _.str.sformat(lang.TaskESignTitle, me._getActionLabel(node, action)),
            subTitle: fileCount !== 0 ? subTitle : undefined,
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.isValid();
              },
              label: function() {
                return me._evaluateNextLabel(node, me.wizard, action, me.STEPS.TASK_ESIGN, isLastFile);
              },
              clickHandler: function() {
                var values = this.getAllFormValues();
                if (!_.isEqual(this.cachedValues, values)) {
                  var isMatch = _.isMatch(_.extend({
                    signoff_domain: this.cachedValues && this.cachedValues.signoff_domain
                  }, this.cachedValues), {
                    signoff_login: values.signoff_login,
                    signoff_password: values.signoff_password,
                    signoff_domain: values.signoff_domain
                  });
                  if (!isMatch) {
                    me.wizard.blockActions();
                    me._validateSignoff(values, node).done(function() {
                      me._updateESignDialogPayload(values, node, masterPayload, model, index);
                      me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                    }.bind(this)).fail(function(xhr, message, statusText) {
                      GlobalMessage.showMessage("error", utils.parseAjaxErrorAsString(xhr, statusText, message));
                      this.cachedValues = undefined;
                    }.bind(this)).always(function() {
                      me.wizard.unblockActions();
                    }.bind(this));
                  } else {
                    me._updateESignDialogPayload(values, node, masterPayload, model, index);
                    me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                  }
                  this.cachedValues = _.clone(values);
                } else {
                  me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                }
              }
            } ],
            onCancel: function() {
              return me.onCancel();
            }
          };
          if (isMobile) {
            var message2 = _.isNumber(index) && fileCount > 1 ? _.str.sformat(lang.MobileTaskEsignsubTitle, index + 1, fileCount) : undefined;
            _.extend(step.viewOptions, {
              message1: model?.get("name") || "",
              message2: message2,
              mobileTitle: lang.MobileTaskEsignTitle
            });
          }
          return step;
        };
        var _createExternalESignStep = function() {
          var id = me.STEPS.TASK_ESIGN, isLastFile = true, fileCount = workingFileCollection.totalCount, subTitle = _.str.sformat(lang.TaskESignSubTitle, fileCount), esignEachDocOriginalPropValue = node.get(action.PROPERTIES.SIGNOFF_EACH_DOCUMENT), esignEachDoc = fileCount === 1 ? false : esignEachDocOriginalPropValue, count = 0;
          var externalESignRequired = node.get("external_esign_off") ? true : false;
          step = {
            id: id,
            viewClass: viewClasses.TaskExternalESignDialogView,
            viewOptions: {
              node: node,
              intentionsDictionary: RestLinkrels._getLinkMeta(node.get("links"), RestLinkrels[action.PROPERTIES.INTENTION_DICTIONARY]),
              intentionsRequired: node.get(action.PROPERTIES.INTENTION_REQUIRED),
              externalESignRequired: externalESignRequired,
              workingCollection: workingFileCollection,
              wizard: me.wizard,
              esignEachDoc: esignEachDoc,
              customMessage: node.get("external_esign_message"),
              originatingView: options.originatingView,
              propertyPageData: masterPayload && masterPayload.document_properties ? masterPayload.document_properties : undefined,
              masterDocumentId: workingFileCollection.at(0).get("id"),
              dictionary: node.get(action.PROPERTIES.INTENTION_DICTIONARY_NAME)
            },
            title: _.str.sformat(lang.TaskESignTitle, me._getActionLabel(node, action)),
            subTitle: fileCount !== 0 ? subTitle : undefined,
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.isValid();
              },
              label: function() {
                return count === fileCount - 1 ? lang.TaskSubmitStepLabel : lang.TaskNextFileStepLabel;
              },
              clickHandler: function() {
                var self = this;
                count++;
                me._performExternalEsign(node, options, self, me.wizard, action).done(function(values) {
                  var modelValue, indexValue;
                  if (esignEachDocOriginalPropValue) {
                    modelValue = self.model;
                    indexValue = self.index;
                  }
                  me._updateESignDialogPayload(values, node, masterPayload, modelValue, indexValue, true);
                  if (!self.options.esignEachDoc) {
                    me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                  } else {
                    if (workingFileCollection.totalCount - 1 === self.index) {
                      me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                    } else {
                      self.trigger("refresh");
                    }
                  }
                }).fail(function(xhr) {
                  self.setError(xhr.responseJSON);
                });
              }
            } ],
            onCancel: function() {
              return me.onCancel();
            }
          };
          return step;
        };
        var _createMobileExternalEsignStep = function(model, index) {
          var isLastFile = true, step = _createESignatureStep(model, index);
          if (_.isNumber(index)) {
            isLastFile = index === workingFileCollection.totalCount - 1;
          }
          _.extend(step, {
            viewClass: viewClasses.TaskExternalESignDialogView,
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.isValid();
              },
              label: function() {
                return isLastFile ? lang.TaskSubmitStepLabel : lang.MobileTaskEsignTitle;
              },
              clickHandler: function() {
                var self = this;
                me._performExternalEsign(node, options, self, me.wizard, action).done(function(values) {
                  me._updateESignDialogPayload(values, node, masterPayload, model, index, true);
                  me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions, me.STEPS.TASK_ESIGN, isLastFile);
                }).fail(function(xhr) {
                  self.setError(xhr.responseJSON);
                });
              }
            } ]
          });
          _.extend(step.viewOptions, {
            model: model || workingFileCollection.at(0),
            externalESignRequired: !!node.get("external_esign_off"),
            customMessage: node.get("external_esign_message"),
            isLastFile: isLastFile
          });
          return step;
        };
        masterPayload["signoff-inputs"] = {};
        var _createEsignSteps = function(cb) {
          if (node.get(action.PROPERTIES.SIGNOFF_EACH_DOCUMENT) && workingFileCollection.totalCount) {
            workingFileCollection.each(function(model, index) {
              stepOptions.steps.push(cb(model, index));
            });
          } else {
            stepOptions.steps.push(cb());
          }
        };
        if (node.get("external_esign_off") && !isMobile) {
          stepOptions.steps.push(_createExternalESignStep());
        } else {
          var createEsignCb = _createESignatureStep;
          if (isMobile && node.get("external_esign_off")) {
            createEsignCb = _createMobileExternalEsignStep;
          }
          _createEsignSteps(createEsignCb);
        }
      }
      if (me._checkDigitalSignAllowed(node, action)) {
        step = {
          id: me.STEPS.TASK_DIGITAL_SIGN_SIGNEE,
          viewClass: viewClasses.AddSigneeView,
          viewOptions: {
            task: node,
            model: node.digitalSignatureModel,
            context: options.context
          },
          title: lang.AddSignerTitle,
          buttons: [ {
            id: "next",
            disabled: function() {
              return !this.isValid();
            },
            label: function() {
              return me._evaluateNextLabel(node, me.wizard, action);
            },
            clickHandler: function() {
              var values;
              if (!isMobile) {
                values = this.signatureEmailFormView.getValues();
              } else {
                values = {
                  email_subject: this.model.get("digital_signature_email_subject") || "",
                  email_message: this.model.get("digital_signature_email_message") || ""
                };
              }
              digitalSignatureOptions.digitalSignatureModel = this.model;
              digitalSignatureOptions.signers = !isMobile ? this.collection : this.getUsersCollection();
              digitalSignatureOptions.documents = workingFileCollection;
              digitalSignatureOptions.digitalSignEnabled = true;
              digitalSignatureOptions.node = node;
              digitalSignatureOptions.supportingDocs = [];
              digitalSignatureOptions.subject = values["email_subject"];
              digitalSignatureOptions.message = values["email_message"];
              me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions);
            }
          } ],
          onCancel: function() {
            return me.onCancel();
          }
        };
        if (isMobile) {
          var firstStep = !stepOptions.steps.length;
          _.extend(step.viewOptions, {
            hideSubjectRegion: true
          });
          step.onCancel = function() {
            if (firstStep && !this.getUsersCollection().length) {
              return $.Deferred().resolve().promise();
            } else {
              return me.onCancel();
            }
          };
        }
        stepOptions.steps.push(step);
        if (supportingFileCollection.length > 0 && !node.get("wf_sv_disable_supporting_files")) {
          step = {
            id: me.STEPS.TASK_DIGITAL_SIGN_SUPPORTING_DOCS,
            viewClass: viewClasses.SupportingDocsSelectionView,
            viewOptions: {
              task: node,
              model: node.digitalSignatureModel,
              collection: supportingFileCollection,
              context: options.context
            },
            title: lang.SupportingDocsTitle,
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.isValid();
              },
              label: function() {
                return me._evaluateNextLabel(node, me.wizard, action);
              },
              clickHandler: function() {
                digitalSignatureOptions.supportingDocs = this.getSelectedChildren();
                me._evaluateNextStep(node, me.wizard, masterPayload, options, action, digitalSignatureOptions);
              }
            } ],
            onCancel: function() {
              return me.onCancel();
            }
          };
          if (isMobile) {
            _.extend(step.viewOptions, {
              mobileTitle: lang.MobileSupportingDocsTitle,
              hideSubjectRegion: true
            });
          }
          stepOptions.steps.push(step);
        }
      }
      if (isMobile) {
        stepOptions.context = options.context, stepOptions.infoSubHeader = true, 
        stepOptions.infoMessage = node.get("name"), _.each(stepOptions.steps, function(step) {
          step.viewOptions = _.defaults(step.viewOptions, {
            headerCloseButton: "cancel",
            supressBackButton: true
          });
          step.buttons.push({
            id: "previous",
            clickHandler: function() {
              me.wizard.prevStep();
            },
            label: lang.mobileBackBtnLabel
          });
        });
      }
      return stepOptions;
    },
    _checkDigitalSignAllowed: function(node, action) {
      if (node.get(action.PROPERTIES.DIGITAL_SIGN_REQUIRED)) {
        if (node.digitalSignatureModel && node.digitalSignatureModel.get("signStatus") && node.digitalSignatureModel.get("signStatus").get("signature_status") && node.digitalSignatureModel.get("signStatus").get("signature_status") !== action.PROPERTIES.DRAFT_STATUS) {
          return false;
        }
        return true;
      }
      return false;
    },
    show: function() {
      var deferred = $.Deferred(), action = this.options.command, options = this.options, node = options.node, isMobile = utils.isMobile(), opts = isMobile ? {
        force: true,
        cache: false
      } : {}, me = this;
      this._loadDependencies(this._getDependencies()).done(imports => {
        let {
          TaskWorkingFileCollection,
          TaskSupportingFileCollection,
          DigitalSignatureLoginCommand,
          STEPPER_WIZARD: StepperWizard
        } = imports;
        var workingFileCollection = new TaskWorkingFileCollection(undefined, {
          node: node
        });
        var supportingFileCollection = new TaskSupportingFileCollection(undefined, {
          node: node
        });
        var digitalSignCommand = new DigitalSignatureLoginCommand();
        var digitalOptions = {
          node: node,
          command: action,
          status: {
            originatingView: me.options.originatingView
          }
        };
        workingFileCollection.fetch(opts).done(function() {
          digitalOptions.documents = workingFileCollection;
          me._checkAndValidateDigitalSignature(node, digitalOptions, digitalSignCommand, action).done(function() {
            me._fetchSupportingFiles(node, supportingFileCollection, action).done(function() {
              me.supportingFileCollection = supportingFileCollection;
              action._unblockActions(options.originatingView);
              let viewClasses = _.pick(imports, [ "TaskESignatureDialogView", "TaskExternalESignDialogView", "TaskManageDialogView", "TaskMetadataPropertiesView", "AddSigneeView", "SupportingDocsSelectionView", "TaskUpdateProcessVariablesView" ]), stepOptions = me._createSteps(workingFileCollection, viewClasses, supportingFileCollection);
              me.wizard = new StepperWizard(stepOptions);
              me.wizard.show();
              me.wizard.on("wizard:closed", function(cancel, result) {
                if (cancel || !(cancel || result)) {
                  deferred.reject("cancel");
                } else if (result) {
                  deferred.resolve(result);
                }
              });
            }).fail(deferred.reject);
          }).fail(function() {
            deferred.reject("cancel");
          });
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
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
    _getDependencies: function() {
      const depMap = {
        STEPPER_WIZARD: "d2/controls/stepper.wizard/stepper.wizard.view",
        TaskESignatureDialogView: "d2/dialogs/task.complete/task.esignature.dialog.view",
        TaskExternalESignDialogView: "d2/dialogs/task.complete/task.external.esign.dialog.view",
        TaskManageDialogView: "d2/dialogs/task.complete/task.manage.dialog.view",
        TaskMetadataPropertiesView: "d2/dialogs/task.complete/task.metadata.properties.view",
        AddSigneeView: "d2/dialogs/digital.signature/add.signee.view",
        SupportingDocsSelectionView: "d2/dialogs/digital.signature/supporting.document.selection.view",
        TaskUpdateProcessVariablesView: "d2/dialogs/task.update.process.variables/task.update.process.variables.view",
        DigitalSignatureLoginCommand: "d2/commands/digital.signature",
        TaskWorkingFileCollection: "d2/models/workflow/task.working.files",
        TaskSupportingFileCollection: "d2/models/workflow/task.supporting.files"
      };
      if (utils.isMobile()) {
        _.extend(depMap, {
          DigitalSignatureLoginCommand: "d2mob/commands/mobile/mobile.digital.signature",
          AddSigneeView: "d2mob/dialogs/mobile.digital.signature/mobile.add.signee.view",
          SupportingDocsSelectionView: "d2mob/dialogs/mobile.digital.signature/mobile.supporting.document.selection.view",
          TaskUpdateProcessVariablesView: "d2mob/dialogs/mobile.launch.workflow/impl/mobile.launch.workflow.variables/mobile.launch.workflow.variables.view"
        });
      }
      return depMap;
    },
    _checkAndValidateDigitalSignature: function(node, digitalSignatureOptions, digitalSignCommand, action) {
      var deferred = $.Deferred();
      if (this._checkDigitalSignAllowed(node, action)) {
        digitalSignCommand.validateNode(digitalSignatureOptions).done(deferred.resolve).fail(deferred.reject);
      } else {
        deferred.resolve(false);
      }
      return deferred.promise();
    },
    _performExternalEsign: function(node, options, esignView, wizard, action) {
      var deferred = $.Deferred(), me = this;
      require([ "nuc/models/nodes", !utils.isAppworks() ? "d2/commands/external.esign" : "d2mob/commands/mobile/mobile.external.esign" ], function(NodeCollection, ExternalESignCommand) {
        var status = {
          nodes: new NodeCollection([ node ]),
          context: options.context,
          originatingView: options.originatingView
        }, extEsignOptions = {
          externalEsignOff: node.get("external_esign_off")
        };
        var command = new ExternalESignCommand();
        if (command.enabled(status, extEsignOptions)) {
          extEsignOptions.auditParams = {
            source: action.PROPERTIES.SOURCE,
            action: action.PROPERTIES.ACTION,
            "master-document-id": esignView.model && esignView.model.get("id")
          };
          extEsignOptions.auditUrl = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS);
          extEsignOptions.node = node;
          command.execute(status, extEsignOptions).done(function(data) {
            var values = esignView.getAllFormValues() || {};
            _.extend(values, {
              signoff_login: "",
              signoff_password: data,
              nonce_token: node.get("external_esign_off").nonce_token
            });
            wizard.blockActions();
            me._validateSignoff(values, node, true).then(function() {
              deferred.resolve(values);
            }, deferred.reject).always(function() {
              wizard.unblockActions();
            });
          }).fail(function() {
            console.log("error has occured");
          });
        } else {
          deferred.reject();
        }
      }, deferred.reject);
      return deferred.promise();
    },
    _validateSignoff: function(values, node, externalEsign) {
      var deferred = $.Deferred(), url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_SIGNOFF_VALIDATION);
      var payload = {
        signoff_login: values.signoff_login,
        signoff_password: values.signoff_password
      };
      if (!_.isUndefined(values.signoff_domain)) {
        payload.signoff_domain = values.signoff_domain;
      }
      if (externalEsign) {
        url = Url.appendQuery(url, Url.combineQueryString({
          "ext-sign-off": true
        }));
      }
      var ajaxOptions = node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function() {
          deferred.resolve();
        }
      });
      var connectorError = ajaxOptions.error;
      ajaxOptions.error = function(xhr, message, statusText) {
        if (xhr.responseJSON && xhr.responseJSON.status === 401 && xhr.responseJSON.code !== "E_INVALID_AUTHENTICATION") {
          connectorError.apply(this, arguments);
        }
        deferred.reject(xhr, message, statusText);
      };
      $.ajax(ajaxOptions);
      return deferred.promise();
    },
    onCancel: function() {
      let isMobile = utils.isMobile();
      var deferred = $.Deferred(), buttonOptions = {
        labelYes: lang.TaskCompleteStopLabel,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, isMobile ? lang.MobileTaskCompleteCancelConfirmMessage : lang.TaskCompleteCancelConfirmMessage, isMobile ? lang.MobileTaskCompleteCancelConfirmTitle : lang.TaskCompleteCancelConfirmTitle, {
        buttons: buttonOptions
      });
      return deferred.promise();
    },
    _fetchSupportingFiles: function(node, supportingFileCollection, action) {
      var deferred = $.Deferred();
      if (this._checkDigitalSignAllowed(node, action)) {
        var isMobile = utils.isMobile(), opts = isMobile ? {
          force: true,
          cache: false
        } : {};
        supportingFileCollection.fetch(opts).done(deferred.resolve).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });
  return TaskCompleteDialog;
});