/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/jquery.parse.param", "nuc/models/nodes", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "d2/commands/external.esign", "d2/utils/constants", "d2/utils/form.utils", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/dialogs/lifecycle/lifecycle.dialog.mixin", "d2/dialogs/document.esignature.dialog/document.esignature.dialog.view", "d2/dialogs/document.external.esign.dialog/document.external.esign.dialog.view", "d2/dialogs/lifecycle/impl/metadata.properties/lifecycle.metadata.properties.view", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function(require, _, $, Backbone, parseParams, NodeCollection, Url, GlobalMessage, ModalAlert, CommandHelper, ExternalESignCommand, constants, formUtils, RestLinkrels, utils, LifecycleMixin, DocumentESignatureDialogView, DocumentExternalESignDialogView, MetadataPropertiesView, lang) {
  "use strict";
  function D2LifecycleStateChangeDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(D2LifecycleStateChangeDialog.prototype, {
    show: function() {
      this._deferred = $.Deferred();
      this._showWizard();
      return this._deferred.promise();
    },
    _createWizardSteps: function() {
      var me = this, node = this.options.status.nodes.at(0), lifeCycleStateConfig = node.lifeCycleStateConfig;
      var stepsDefinition = lifeCycleStateConfig ? me.getStepDefinitions(lifeCycleStateConfig) : [];
      if (stepsDefinition.length === 0) {
        stepsDefinition = me.getPropertyStepForDialog();
        node.lifeCycleStateConfig = {};
      }
      var stepOptions = null;
      if (!_.isEmpty(stepsDefinition)) {
        stepOptions = {
          steps: stepsDefinition,
          usePreviousStepTitleAsBackButtonTooltip: false,
          data: {
            context: this.options.status.context,
            command: this.options.command,
            status: this.options.status,
            dialogView: this
          },
          className: "d2-lifcycle-wizard"
        };
      }
      return stepOptions;
    },
    getPropertyStepForDialog: function() {
      var me = this, node = this.options.status.nodes.at(0), propertiesStep = [];
      if (!_.isEmpty(CommandHelper.getOriginalActionLink(node, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null, me.options.status.data)) && !_.isEmpty(me.options?.status?.data?.dialog)) {
        var propertiesStepConfig = me.getPropertiesStepConfig(node);
        propertiesStep.push(propertiesStepConfig);
      }
      return propertiesStep;
    },
    getStepDefinitions: function(lifeCycleStateConfig) {
      var me = this, node = this.options.status.nodes.at(0), action = this.options.command, signOffSteps = [], propertiesStep = [];
      this.options.status.lifeCycleStateConfig = lifeCycleStateConfig;
      if (lifeCycleStateConfig[action.PROPERTIES.SIGNOFF_REQUIRED]) {
        var signOffStep = lifeCycleStateConfig["external-esign-off"] ? me.getExternalEsignStepConfig(node, 0) : me.getEsignStepConfig(node, 0);
        signOffSteps.push(signOffStep);
      }
      if (!_.isEmpty(node.lifeCycleStateConfig["property_page_name"]) && RestLinkrels.getLink(node.lifeCycleStateConfig.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE) || !_.isEmpty(CommandHelper.getOriginalActionLink(node, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null)) && !_.isEmpty(me.options?.status?.data?.dialog)) {
        var propertiesStepConfig = me.getPropertiesStepConfig(node);
        propertiesStep.push(propertiesStepConfig);
      }
      if (me.options.directState) {
        return _.isEmpty(me.options?.status?.data?.dialog) ? signOffSteps : propertiesStep.concat(signOffSteps);
      } else {
        return signOffSteps.concat(propertiesStep);
      }
    },
    getSubTitleForEsign: function(node) {
      return node.get("name");
    },
    getEsignStepConfig: function(node, index, esignEachDoc) {
      var me = this, action = this.options.command;
      var signOffStep = {
        id: "d2_lifecycle_esign_" + node.get("id"),
        viewClass: DocumentESignatureDialogView,
        viewOptions: {
          node: node,
          model: esignEachDoc ? node : null,
          intentionsDictionary: RestLinkrels._getLinkMeta(node.lifeCycleStateConfig.links, RestLinkrels.D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY),
          intentionsRequired: node.lifeCycleStateConfig[action.PROPERTIES.INTENTION_REQUIRED],
          masterDocumentId: this.options.status.nodes.at(0).get("id"),
          dictionary: node.lifeCycleStateConfig[action.PROPERTIES.INTENTION_DICTIONARY_NAME]
        },
        title: utils.isMobile() ? lang.MobileD2LifecycleESignTitle : lang.D2LifecycleESignTitle,
        subTitle: me.getSubTitleForEsign(node, index),
        nextStepId: function() {
          return me._evaluateNextId(this.options.node, this.options.wizard);
        },
        buttons: [ {
          id: "next",
          disabled: function() {
            return !this.isValid();
          },
          label: function() {
            return me._evaluateNextLabel(this.options.node, this.options.wizard);
          },
          clickHandler: function() {
            me.options._wizard.prevStepTooltip = esignEachDoc ? lang.D2LifecycleEsignBackbuttonTooltip + me.options._wizard.currentView.model.get("name") : lang.D2LifecycleESignTitle;
            var values = this.getAllFormValues();
            var action = this;
            me.checkSignOffData(this.options.node, values).done(function() {
              me.options._wizard && me.options._wizard.nextStep();
            }).fail(function() {
              action.validUser = false;
              me.options._wizard && me.options._wizard.refreshFooter();
            });
          }
        }, {
          id: "previous",
          disabled: false,
          skipInitialHide: true,
          hidden: function() {
            return me.checkBackButtonVisibility(index);
          },
          toolTip: function() {
            return me.getPrevButtonToolTip(index);
          },
          clickHandler: function() {
            me.options._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return action.onCancel();
        }
      };
      if (utils.isMobile()) {
        _.extend(signOffStep.viewOptions, {
          mobileTitle: signOffStep.title,
          hideSubjectRegion: false,
          message1: node.get("name")
        });
      }
      return signOffStep;
    },
    getExternalEsignStepConfig: function(node, index) {
      var me = this, action = this.options.command, fileCount = this.options.status.nodes.length, workingCollection = this.options.status.nodes, esignEachDoc = fileCount > 1 && node.lifeCycleStateConfig["signoff_each_document"];
      var externalESignRequired = !!node.lifeCycleStateConfig["external-esign-off"];
      var signOffStep = {
        id: "document_external_esign",
        viewClass: DocumentExternalESignDialogView,
        viewOptions: {
          node: node,
          model: fileCount !== 1 ? node : undefined,
          intentionsDictionary: RestLinkrels._getLinkMeta(node.lifeCycleStateConfig.links, RestLinkrels.D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY),
          intentionsRequired: node.lifeCycleStateConfig[action.PROPERTIES.INTENTION_REQUIRED],
          externalESignRequired: externalESignRequired,
          esignEachDoc: esignEachDoc,
          customMessage: node.lifeCycleStateConfig[action.PROPERTIES.ESIGN_CONFIRMATION_MESSAGE],
          workingCollection: workingCollection,
          masterDocumentId: me.options.status.nodes.at(0).get("id"),
          originatingView: me.options.status.originatingView,
          dictionary: node.lifeCycleStateConfig[action.PROPERTIES.INTENTION_DICTIONARY_NAME]
        },
        title: lang.D2LifecycleESignTitle,
        subTitle: me.getSubTitleForEsign(node, index),
        nextStepId: function() {
          return me._evaluateNextId(this.options.node, this.options.wizard);
        },
        buttons: [ {
          id: "next",
          disabled: function() {
            return !this.isValid();
          },
          label: function() {
            return me._evaluateNextLabel(this.options.node, this.options.wizard);
          },
          clickHandler: function() {
            var self = this;
            me.options._wizard.prevStepTooltip = lang.D2LifecycleESignTitle;
            me._performExternalEsign(node, me.options, this).done(function() {
              if (me.options.status.lifeCycleStateConfig["external-esign-off"] && me.options.status.lifeCycleStateConfig["signoff_each_document"]) {
                me.handleNextStepForExternalEsign(self);
              } else {
                me.options._wizard && me.options._wizard.nextStep();
              }
            }).fail(function(xhr) {
              if (self?.formView && self.formView.options.intentionsRequired) {
                self.isFormValid = false;
                self.options.wizard.refreshFooter([ "next" ]);
              }
              self.setError(xhr && xhr.responseJSON);
            });
          }
        }, {
          id: "previous",
          disabled: false,
          skipInitialHide: true,
          hidden: function() {
            return me.checkBackButtonVisibility(index);
          },
          toolTip: function() {
            return me.getPrevButtonToolTip(index);
          },
          clickHandler: function() {
            me.options._wizard.prevStep();
          }
        } ],
        onCancel: function() {
          return action.onCancel();
        }
      };
      if (utils.isMobile()) {
        _.extend(signOffStep.viewOptions, {
          mobileTitle: lang.MobileD2LifecycleESignTitle,
          hideSubjectRegion: false,
          message1: node.get("name")
        });
      }
      return signOffStep;
    },
    handleNextStepForExternalEsign: function(documentEsign) {
      if (documentEsign.index === this.options.status.nodes.length - 1) {
        this.options._wizard && this.options._wizard.nextStep();
      } else {
        documentEsign.trigger("refresh");
      }
    },
    getNextStepId: function() {
      if (this.options.directState) {
        let stepperWizardSteps = Object.keys(this.options._wizard.steps);
        return stepperWizardSteps[_.indexOf(stepperWizardSteps, this.options._wizard.currentStep) + 1] || "finish";
      }
      return "finish";
    },
    getPropertiesStepConfig: function(node) {
      var me = this, subTitle = node.get("name"), propertiesStepConfig = {
        id: "d2_lifecycle_properties_" + node.get("id"),
        viewClass: MetadataPropertiesView,
        title: function() {
          return node.lifeCycleStateConfig && node.lifeCycleStateConfig["menu-label"] ? node.lifeCycleStateConfig["menu-label"] : lang.EditProperties_Title;
        },
        subTitle: subTitle,
        viewOptions: {
          node: node,
          wizard: me.options._wizard,
          url: CommandHelper.getOriginalActionLink(node, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) ? CommandHelper.getOriginalActionLink(node, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) : RestLinkrels.getLink(node.lifeCycleStateConfig?.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE),
          propertyConfigName: me.options?.status?.data?.dialog ? me.options?.status?.data?.dialog : node.lifeCycleStateConfig && node.lifeCycleStateConfig["property_page_name"]
        },
        nextStepId: function() {
          return me.getNextStepId();
        },
        buttons: [ {
          id: "next",
          label: function() {
            return me._evaluateNextLabel(this.options.node, this.options.wizard);
          },
          disabled: function() {
            return this.nextButtonDisabled;
          },
          clickHandler: function() {
            if (this.validate()) {
              if (!_.isEmpty(node._changedFormValuesMap.properties)) {
                this.options.node.lifeCycleStateConfig.properties = node._changedFormValuesMap.properties;
              }
              me.options._wizard && me.options._wizard.nextStep();
            }
          }
        } ],
        onCancel: function() {
          return me.options.command.onCancel();
        }
      };
      if (utils.isMobile()) {
        _.extend(propertiesStepConfig.viewOptions, {
          hideSubjectRegion: true,
          enableMetadataExpandCollapse: true,
          enableMetadataRequiredHeaderState: true
        });
      }
      return propertiesStepConfig;
    },
    _performExternalEsign: function(node, options, esignView) {
      var deferred = $.Deferred();
      var self = this, currentNode;
      require([ !utils.isAppworks() ? "d2/commands/external.esign" : "d2mob/commands/mobile/mobile.external.esign" ], function(ExternalESignCommand) {
        var status = {
          nodes: new NodeCollection([ node ]),
          context: options.status.context,
          originatingView: options.status.originatingView
        }, extEsignOptions = {
          externalEsignOff: node.lifeCycleStateConfig["external-esign-off"]
        };
        var command = new ExternalESignCommand();
        if (command.enabled(status, extEsignOptions)) {
          extEsignOptions.auditUrl = RestLinkrels.getLink(node.lifeCycleStateConfig["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS);
          extEsignOptions.node = node;
          command.execute(status, extEsignOptions).done(function(data) {
            var values = esignView.getAllFormValues() || {};
            _.extend(values, {
              signoff_login: "",
              signoff_password: data,
              nonce_token: node.lifeCycleStateConfig["external-esign-off"]["nonce_token"]
            });
            options._wizard.blockActions();
            if (node.lifeCycleStateConfig.signoff_each_document) {
              currentNode = options.status.nodes.models[esignView.index];
            } else {
              currentNode = node;
            }
            self.checkSignOffData(currentNode, values, true).then(deferred.resolve, deferred.reject).always(function() {
              options._wizard.unblockActions();
            });
          }).fail(function() {
            deferred.reject();
          });
        } else {
          deferred.reject();
        }
      }, deferred.reject);
      return deferred.promise();
    },
    _evaluateNextId: function(node, wizard) {
      var currentStepId = wizard.currentStep, nextStep;
      var stepsArray = wizard.options && wizard.options.steps ? wizard.options.steps : [];
      for (var i = 0; i < stepsArray.length; i++) {
        if (stepsArray[i].id === currentStepId) {
          nextStep = stepsArray[i + 1];
          break;
        }
      }
      return _.isUndefined(nextStep) ? "finish" : nextStep.id;
    },
    _evaluateNextLabel: function(node, wizard) {
      var currentStepId = wizard.currentStep;
      var stepsArray = wizard.options && wizard.options.steps ? wizard.options.steps : [];
      var label = lang.D2LifcycleSubmitStepLabel;
      for (var i = 0; i < stepsArray.length; i++) {
        if (stepsArray[i].id === currentStepId && !_.isUndefined(stepsArray[i + 1])) {
          label = utils.isMobile() ? lang.MobileD2LifcycleNextStepLabel : lang.D2LifcycleNextStepLabel;
          break;
        }
      }
      return label;
    },
    checkBackButtonVisibility: function(index) {
      return !index;
    },
    getPrevButtonToolTip: function(index) {
      if (index) {
        return this.options._wizard.prevStepTooltip;
      }
      return "";
    },
    _showWizard: function() {
      var me = this;
      var stepOptions = me._createWizardSteps();
      if (stepOptions && !_.isEmpty(stepOptions)) {
        stepOptions.size = me.options.dialogSize;
        require([ "d2/controls/stepper.wizard/stepper.wizard.view" ], function(StepperWizard) {
          me.options._wizard = new StepperWizard(stepOptions).show().on("wizard:closed", function(isCancel) {
            if (isCancel) {
              me.cleanup();
              me._deferred.reject("close");
              return;
            }
            me.cleanup();
            me._deferred.resolve();
          });
          me.options._wizard.once("wizard:minimized", function() {
            me.options.status.commandPromise && me.options.status.commandPromise.resolve();
          });
        });
      } else {
        me._deferred.resolve();
      }
    },
    cleanup: function() {
      this.options.status.nodes.forEach(function(node) {
        delete node.propertiesSource;
      });
    },
    getProcessingStep: function(ViewClass) {
      var processingStep = {
        id: "d2_lifecycle_submit_processing",
        viewClass: ViewClass,
        transient: true,
        title: function() {
          return this.getTitle();
        },
        subTitle: function() {
          return this.getSubTitle();
        },
        buttons: [ {
          id: "previous",
          hidden: true
        }, {
          id: "cancel",
          hidden: true
        }, {
          id: "next",
          hidden: true
        }, {
          id: "minimize_wizard",
          align: "end",
          isPrimary: true,
          label: function() {
            return this.minimizeButtonLabel;
          },
          disabled: function() {
            return !this.isMinimizable();
          },
          clickHandler: function() {
            this.minimize();
          }
        } ],
        onCancel: function() {
          return true;
        }
      };
      return processingStep;
    }
  });
  D2LifecycleStateChangeDialog.extend = Backbone.View.extend;
  LifecycleMixin.mixin(D2LifecycleStateChangeDialog.prototype);
  return D2LifecycleStateChangeDialog;
});