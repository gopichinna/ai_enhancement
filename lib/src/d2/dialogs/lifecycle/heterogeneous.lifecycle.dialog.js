/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/nodes", "csui/utils/commandhelper", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/lifecycle/lifecycle.state.change.dialog", "d2/dialogs/lifecycle/impl/multi.file/heterogeneous.lifecycle.dialog.view", "d2/dialogs/lifecycle/confirmation.view", "d2/dialogs/document.esignature.dialog/document.esignature.dialog.view", "d2/dialogs/document.external.esign.dialog/document.external.esign.dialog.view", "d2/dialogs/lifecycle/impl/metadata.properties/lifecycle.metadata.properties.view", "d2/dialogs/lifecycle/impl/processing/lifecycle.submit.processing.view", "d2/dialogs/lifecycle/lifecycle.state.change.dialog", "d2/dialogs/lifecycle/lifecycle.dialog.mixin", "d2/utils/rest.linkrels", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function(require, _, $, Backbone, Marionette, NodeCollection, CommandHelper, StepperWizard, D2LifecycleStateChangeDialog, D2HetrogenerousLifecycleDialogView, ConfirmationView, DocumentESignatureDialogView, DocumentExternalESignDialogView, MetadataPropertiesView, LifecycleSubmitProcessingView, LifecycleStateChangeDialog, LifecycleMixin, RestLinkrels, lang) {
  "use strict";
  var HeterogeneousLifecycleStateChangeDialog = D2LifecycleStateChangeDialog.extend({
    constructor: function HeterogeneousLifecycleStateChangeDialog() {
      D2LifecycleStateChangeDialog.prototype.constructor.apply(this, arguments);
    },
    show: function() {
      this._deferred = $.Deferred();
      this._showWizard();
      return this._deferred.promise();
    },
    getMultiSteps: function() {
      var collection = new NodeCollection(this.options.status.nodes.models);
      var obj = {}, isDirect = this.options.directState, emptyStepCount = 0, me = this, isDirectStatePropertyPageStepAdded = false;
      collection.forEach(function(model, index) {
        var lifecycleConfig = model.lifeCycleStateConfig, steps = [];
        if (!isDirectStatePropertyPageStepAdded && isDirect && !_.isEmpty(me.options?.status?.data?.dialog)) {
          var propertyStepIndex = _.findIndex(steps, {
            id: "d2_lifecycle_properties_" + model.get("id")
          }), propertyStep = {
            id: "d2_lifecycle_properties_" + model.get("id"),
            viewClass: MetadataPropertiesView,
            viewOptions: {
              node: model,
              wizard: me.options._wizard,
              url: CommandHelper.getOriginalActionLink(model, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) ? CommandHelper.getOriginalActionLink(model, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) : RestLinkrels.getLink(model.lifeCycleStateConfig?.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE),
              propertyConfigName: me.options?.status?.data?.dialog
            },
            isPropertyPageType: true
          };
          if (propertyStepIndex !== -1) {
            steps[propertyStepIndex] = propertyStep;
          } else {
            steps.push(propertyStep);
          }
          isDirectStatePropertyPageStepAdded = true;
        }
        if (lifecycleConfig) {
          if (lifecycleConfig["confirmation_message"] && !isDirect) {
            steps.push({
              id: "d2_lifecycle_confirm_" + model.get("id"),
              viewClass: ConfirmationView,
              viewOptions: {
                confirmationMessage: lifecycleConfig["confirmation_message"]
              }
            });
          }
          if (lifecycleConfig["signoff_required"]) {
            if (lifecycleConfig["external-esign-off"]) {
              steps.push(me.getExternalEsignStepConfig(model, index));
            } else {
              steps.push({
                id: "d2_lifecycle_esign_" + model.get("id"),
                viewClass: DocumentESignatureDialogView,
                viewOptions: {
                  intentionsDictionary: RestLinkrels._getLinkMeta(lifecycleConfig.links, RestLinkrels.D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY),
                  intentionsRequired: lifecycleConfig["is_intention_required"],
                  masterDocumentId: model.get("id"),
                  dictionary: lifecycleConfig["intention_dictionary_name"]
                }
              });
            }
          }
          if (lifecycleConfig["property_page_name"] && !isDirect) {
            steps.push({
              id: "d2_lifecycle_properties_" + model.get("id"),
              viewClass: MetadataPropertiesView,
              viewOptions: {
                node: model,
                wizard: me.options._wizard,
                url: CommandHelper.getOriginalActionLink(model, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) ? CommandHelper.getOriginalActionLink(model, me.options.command.get("signature"), RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE, null) : RestLinkrels.getLink(model.lifeCycleStateConfig?.links, RestLinkrels.D2_LIFECYCLE_PROPERTIES_PAGE),
                propertyConfigName: me.options?.status?.data?.dialog ? me.options?.status?.data?.dialog : model.lifeCycleStateConfig && model.lifeCycleStateConfig["property_page_name"]
              },
              isPropertyPageType: true
            });
          }
        }
        var noActionRequiredStep = {
          id: "d2_lifecycle_noInput_" + model.get("id"),
          viewClass: ConfirmationView,
          viewOptions: {
            confirmationMessage: ""
          }
        };
        if ((!lifecycleConfig || steps.length === 0) && !isDirect) {
          emptyStepCount++;
          steps.push(noActionRequiredStep);
        }
        if (steps.length > 0) {
          obj[model.get("id")] = steps;
        } else {
          steps.push(noActionRequiredStep);
          obj[model.get("id")] = steps;
        }
      });
      return emptyStepCount === _.size(obj) ? {} : obj;
    },
    getNextStepId: function() {
      return "d2_lifecycle_submit_processing";
    },
    _createWizardSteps: function() {
      var me = this, steps = me.getMultiSteps(), stepsDefinition = [];
      if (!_.isEmpty(steps)) {
        stepsDefinition.push({
          id: "d2_lifecycle_multifile_hetrogeneous",
          viewClass: D2HetrogenerousLifecycleDialogView,
          title: function() {
            return this.getTitle();
          },
          subTitle: function() {
            return this.getSubTitle();
          },
          viewOptions: {
            wizard: me.options._wizard,
            options: me.options
          },
          nextStepId: function() {
            return me.getNextStepId();
          },
          buttons: [ {
            id: "next",
            label: function() {
              return this.getButtonLabel();
            },
            disabled: function() {
              return this.isNextButtonDisabled();
            },
            clickHandler: function() {
              var self = this;
              if (this.multiItemView.currentItemDetailsView instanceof ConfirmationView) {
                this.nextItem();
              } else if (this.multiItemView.currentItemDetailsView instanceof DocumentESignatureDialogView) {
                me.checkSignOffData(this.multiItemView.getSelectedModel(), this.multiItemView.currentItemDetailsView.getAllFormValues()).done(function() {
                  self.nextItem();
                }).fail(function() {
                  self.invalidatedItem();
                  self.multiItemView.currentItemDetailsView.validUser = false;
                  me.options._wizard && me.options._wizard.refreshFooter();
                });
              } else if (this.multiItemView.currentItemDetailsView instanceof DocumentExternalESignDialogView) {
                me.options._wizard.prevStepTooltip = lang.D2LifecycleESignTitle;
                me._performExternalEsign(this.multiItemView.getSelectedModel(), me.options, this.multiItemView.currentItemDetailsView).done(function() {
                  self.nextItem();
                }).fail(function(xhr) {
                  self.multiItemView.currentItemDetailsView.isFormValid = false;
                  self.multiItemView.currentItemDetailsView.options.wizard.refreshFooter([ "next" ]);
                  self.multiItemView.currentItemDetailsView.setError(xhr && xhr.responseJSON);
                });
              } else if (this.multiItemView.currentItemDetailsView instanceof MetadataPropertiesView) {
                this.multiItemView.currentItemDetailsView.validate().done(function(isValid) {
                  if (isValid) {
                    var changedPropValueMap = this.multiItemView.currentItemDetailsView.getFormValues(this.options.options.fullForm);
                    if (!_.isEmpty(changedPropValueMap)) {
                      if (!this.multiItemView.getSelectedModel().lifeCycleStateConfig) {
                        this.multiItemView.getSelectedModel()["lifeCycleStateConfig"] = {};
                      }
                      this.multiItemView.getSelectedModel().lifeCycleStateConfig.properties = changedPropValueMap;
                    }
                    this.nextItem();
                  } else {
                    self.invalidatedItem();
                  }
                }.bind(this));
              }
            }
          }, {
            id: "previous",
            disabled: false,
            skipInitialHide: true,
            hidden: function() {
              return this.checkBackButtonVisibility();
            },
            toolTip: function() {
              return this.getPrevButtonToolTip();
            },
            clickHandler: function() {
              this.previousStep();
            }
          } ],
          onCancel: function() {
            return me.options.command.onCancel();
          }
        });
      }
      if (stepsDefinition.length === 0) {
        stepsDefinition = me.getPropertyStepForDialog();
        _.each(this.options.status.nodes.models, function(model) {
          model.lifeCycleStateConfig = {};
        });
      }
      var processingStep = me.getProcessingStep(LifecycleSubmitProcessingView);
      stepsDefinition.push(processingStep);
      var stepOptions = null;
      if (!_.isEmpty(stepsDefinition)) {
        stepOptions = {
          steps: stepsDefinition,
          usePreviousStepTitleAsBackButtonTooltip: true,
          data: {
            context: this.options.status.context,
            command: this.options.command,
            status: this.options.status,
            dialogView: this
          },
          multiSteps: steps,
          className: "d2-lifcycle-wizard"
        };
      }
      return stepOptions;
    }
  });
  LifecycleMixin.mixin(HeterogeneousLifecycleStateChangeDialog.prototype);
  return HeterogeneousLifecycleStateChangeDialog;
});