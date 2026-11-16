/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "csui/utils/commandhelper", "csui/utils/nodesprites", "csui/utils/contexts/factories/connector", "csui/dialogs/modal.alert/modal.alert", "d2/controls/globalmessage/globalmessage", "dctmw/server.adaptors/converters/node", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/mass.update/mass.update.validation.processing/mass.update.validation.processing.view", "d2/dialogs/mass.update/mass.update.validation.processing/mass.update.submit.processing.view", "d2/dialogs/mass.update/mass.update.document.validation/document.validation.layout.view", "d2/dialogs/mass.update/mass.update.document.validation/document.error.layout.view", "d2/dialogs/mass.update/mass.update.property.page/mass.update.property.view", "d2/dialogs/mass.update/mass.update.empty/mass.update.empty.view", "d2/utils/mass.update.utils", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/mass.update/impl/nls/lang" ], function(require, _, $, Backbone, Url, CommandHelper, NodeSprites, ConnectionFactory, ModalAlert, GlobalMessage, nodeConverter, RestResources, RestLinkrels, constants, StepperWizard, MassUpdateValidationProcessingView, MassUpdateSubmitProcessingView, MassUpdateDocumentValidationView, MassUpdateDocumentErrorView, MassUpdatePropertyView, NoValidFilesView, massUpdateUtils, commandLang, lang) {
  "use strict";
  var STEPS = Object.freeze({
    MASS_UPDATE_VALIDATION_PROCESSING_PAGE: "mass_update_validation_processing_page",
    MASS_UPDATE_SUBMIT_PROCESSING_PAGE: "mass_update_submit_processing_page",
    MASS_UPDATE_VALIDATION_PAGE: "mass_update_validation_page",
    MASS_UPDATE_ERROR_PAGE: "mass_update_error_page",
    MASS_UPDATE_PROPERTIES_PAGE: "mass_update_property_page",
    MASS_UPDATE_EMPTY_VIEW: "mass_update_empty_view"
  }), REQUEST_WAIT_TIME = 2500;
  function MassUpdateDialog(options) {
    options || (options = {});
    if (!options || !options.context || !options.massUpdateConfig || !options.updateTypes || !options.commandOptions || !options.massUpdateValidationPromise) {
      throw new Error("context, massUpdateConfig, updateTypes, commandOptions, massUpdateValidationPromise  are mandatory in the constructor options");
    }
    this.options = options;
  }
  _.extend(MassUpdateDialog.prototype, Backbone.Events, {
    showMassUpdateWizard: function() {
      var self = this, node = new Backbone.Model({}), wizard;
      node.connector = self.options.context.getObject(ConnectionFactory);
      var stepOptions = {
        steps: [ {
          id: STEPS.MASS_UPDATE_EMPTY_VIEW,
          viewClass: NoValidFilesView,
          viewOptions: self.options,
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
            hidden: false
          }, {
            id: "next",
            hidden: true
          } ]
        }, {
          id: STEPS.MASS_UPDATE_VALIDATION_PROCESSING_PAGE,
          viewClass: MassUpdateValidationProcessingView,
          transient: true,
          title: function() {
            return this.getTitle();
          },
          nextStepId: function() {
            return this.nextStepId;
          },
          buttons: [ {
            id: "previous",
            hidden: true
          }, {
            id: "next",
            hidden: true
          }, {
            id: "minimize_wizard",
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
            return self.onWizardCancel();
          }
        }, {
          id: STEPS.MASS_UPDATE_VALIDATION_PAGE,
          viewClass: MassUpdateDocumentValidationView,
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
            id: "next",
            label: commandLang.MassUpdateContinueLabel,
            clickHandler: function() {
              wizard.nextStep();
            },
            hidden: function() {
              return this.isNextHidden();
            }
          } ],
          onCancel: function() {
            return this.options.valideNodesCount === 0 ? undefined : self.onWizardCancel();
          }
        }, {
          id: STEPS.MASS_UPDATE_PROPERTIES_PAGE,
          viewClass: MassUpdatePropertyView,
          viewOptions: {},
          title: function() {
            return this.getTitle();
          },
          subTitle: function() {
            return this.getSubTitle();
          },
          buttons: [ {
            id: "next",
            disabled: function() {
              return !this.isValid();
            },
            hidden: function() {
              return this.isNextButtonHidden();
            },
            label: function() {
              return this.getNextButtonLabel();
            },
            clickHandler: function() {
              if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
                this.metadataView.expandFieldRegion.currentView.onUpdateClick();
              } else {
                if (this.metadataView.validateAllChildren()) {
                  this.metadataView._externalESign().done(function() {
                    this.metadataView.options.node._massUpdateFormValuesMap["signoff-inputs"] = this.metadataView.options.node._changedFormValuesMap.signoffInputs;
                    this.options.wizard.data.massUpdateData.propertyPageData = {
                      payload: this.metadataView.options.node._massUpdateFormValuesMap,
                      savePopertiesUrl: this.metadataView.options.node.massUpdateSaveUrl,
                      massUpdateValidNodes: this.options.massUpdateData.massUpdateValidationData.validObjects
                    };
                    self._submitMassUpdate(this.options.wizard);
                  }.bind(this));
                } else {
                  this.options.wizard.refreshFooter();
                }
              }
            }
          }, {
            id: "previous",
            hidden: function() {
              return this.isPreviousButtonHidden();
            },
            toolTip: function() {
              return this.getBackButtonTooltip();
            },
            clickHandler: function() {
              if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
                this.onWizardBackClick();
              } else {
                wizard && wizard.prevStep();
              }
            }
          } ],
          onCancel: function() {
            return self.onWizardCancel();
          }
        }, {
          id: STEPS.MASS_UPDATE_SUBMIT_PROCESSING_PAGE,
          viewClass: MassUpdateSubmitProcessingView,
          transient: true,
          title: function() {
            return this.getTitle();
          },
          subTitle: function() {
            return this.getSubTitle();
          },
          nextStepId: function() {
            return this.nextStepId;
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
            return self.onWizardCancel();
          }
        }, {
          id: STEPS.MASS_UPDATE_ERROR_PAGE,
          viewClass: MassUpdateDocumentErrorView,
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
            id: "close_wizard",
            align: "end",
            isPrimary: true,
            label: function() {
              return commandLang.MassUpdateDialogCloseLabel;
            },
            clickHandler: function() {
              this.options.wizard.close({
                data: this.options.wizard.data.massUpdateData.propertyPageData,
                ignoreSuccessMessage: true
              });
            }
          } ]
        } ],
        usePreviousStepTitleAsBackButtonTooltip: false,
        className: "d2-mass-update-wizard",
        data: {
          node: node,
          context: self.options.context,
          massUpdateOptions: self.options.commandOptions,
          langPrefix: self.options.updateTypes === constants.MassUpdateOptions.FILE_PROPERTIES ? "File" : self.options.updateTypes === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : "Item",
          massUpdateData: {}
        }
      };
      wizard = new StepperWizard(stepOptions);
      return self._checkMassUpdateValidationStatus(wizard);
    },
    _checkMassUpdateValidationStatus: function(wizard) {
      var self = this, deferred = $.Deferred(), massUpdateValidationWaitPromise, isProcessingIgnored = false, originatingView = self.options.commandOptions && self.options.commandOptions.originatingView, validationWaitTimeout = setTimeout(function() {
        originatingView && CommandHelper.unblockD2ViewActions(originatingView);
        if (self.options.massUpdateValidationPromise && self.options.massUpdateValidationPromise.state() === "pending" && isProcessingIgnored === false) {
          massUpdateValidationWaitPromise = $.Deferred();
          wizard.data.massUpdateData.massUpdateValidationWaitPromise = massUpdateValidationWaitPromise;
          wizard.show(STEPS.MASS_UPDATE_VALIDATION_PROCESSING_PAGE);
          wizard.listenTo(wizard, "wizard:shown", function() {
            $(document).off("focusin.binf.modal");
          });
        }
      }, REQUEST_WAIT_TIME);
      originatingView && CommandHelper.blockD2ViewActions(originatingView);
      self.options.massUpdateValidationPromise.always(function() {
        if (!massUpdateValidationWaitPromise) {
          clearTimeout(validationWaitTimeout);
        }
        originatingView && CommandHelper.unblockD2ViewActions(originatingView);
      }).done(function(response) {
        function handleError(message) {
          if (massUpdateValidationWaitPromise) {
            wizard && wizard.close({
              error: message
            });
          } else {
            deferred.reject(message);
          }
        }
        if (!response["mass_update_applicable"] && !response["mass_update_partial"] && !response["mass_update_not_applicable"]) {
          var message = commandLang.NoFileExistForMassUpdate;
          handleError(message);
        } else {
          var massUpdateValidationData = massUpdateUtils.getMassUpdateValidationData(response), wizardMassUpdateData = wizard.data.massUpdateData, nextStep;
          wizardMassUpdateData.massUpdateValidationData = massUpdateValidationData;
          wizardMassUpdateData.propertyPage = RestLinkrels.getLink(response.links, RestLinkrels.D2_MASS_UPDATE_PROPERTY_PAGE);
          wizardMassUpdateData.propertyPageBody = {
            "object-ids": _.pluck(massUpdateValidationData.validObjects, "r_object_id")
          };
          if (self.options.massUpdateConfig && self.options.massUpdateConfig["is_warning_message_enabled"] && (massUpdateValidationData.errorNodes || massUpdateValidationData.partialUpdatedNodes)) {
            wizardMassUpdateData.failedNodes = massUpdateValidationData.errorNodes;
            wizardMassUpdateData.partialUpdatedNodes = massUpdateValidationData.partialUpdatedNodes;
            wizardMassUpdateData.valideNodesCount = response["mass_update_applicable"] ? response["mass_update_applicable"].count : 0;
            nextStep = STEPS.MASS_UPDATE_VALIDATION_PAGE;
          } else {
            if (_.isEmpty(wizardMassUpdateData.massUpdateValidationData.validObjects)) {
              nextStep = STEPS.MASS_UPDATE_EMPTY_VIEW;
            } else {
              nextStep = STEPS.MASS_UPDATE_PROPERTIES_PAGE;
            }
          }
          if (massUpdateValidationWaitPromise) {
            massUpdateValidationWaitPromise.resolve(nextStep);
          } else {
            isProcessingIgnored = true;
            wizard.show(nextStep);
            wizard.listenTo(wizard, "wizard:shown", function() {
              $(document).off("focusin.binf.modal");
            });
            if (nextStep === STEPS.MASS_UPDATE_PROPERTIES_PAGE) {
              wizard.footerView.collection.get("previous").set("hidden", function() {
                return this.isPreviousButtonHidden();
              });
              wizard.refreshFooter([ "previous" ]);
            }
          }
        }
      }).fail(function(error) {
        deferred.reject(error);
        if (massUpdateValidationWaitPromise) {
          massUpdateValidationWaitPromise.reject();
        }
      });
      wizard.on("wizard:closed", function(cancel, args) {
        if (cancel) {
          deferred.reject("close");
          if (self.options.massUpdateValidationPromise && self.options.massUpdateValidationPromise.state() === "pending") {
            self.options.massUpdateValidationPromise.abort("CLIENT_ABORT");
          }
        } else if (args && args.error) {
          deferred.reject(args.error);
        } else {
          deferred.resolve(args);
        }
      });
      wizard.once("wizard:minimized", function() {
        self.options.commandOptions && self.options.commandOptions.commandPromise && self.options.commandOptions.commandPromise.resolve();
      });
      return deferred.promise();
    },
    _submitMassUpdate: function(wizard) {
      wizard.blockActions();
      var data = wizard.data.massUpdateData.propertyPageData, isProcessingIgnored = false, massUpdateValidObjects = wizard.data.massUpdateData.massUpdateValidationData.validObjects, massUpdateSubmitPromise = this._saveMassUpdateData(data, this.options.context), massUpdateSubmitWaitPromise;
      var submitWaitTimeout = setTimeout(function() {
        if (massUpdateSubmitPromise && massUpdateSubmitPromise.state() === "pending" && isProcessingIgnored === false) {
          massUpdateSubmitWaitPromise = $.Deferred();
          wizard.unblockActions();
          wizard.data.massUpdateData.massUpdateSubmitWaitPromise = massUpdateSubmitWaitPromise;
          wizard.gotoStep(STEPS.MASS_UPDATE_SUBMIT_PROCESSING_PAGE);
        }
      }, REQUEST_WAIT_TIME);
      massUpdateSubmitPromise.always(function() {
        if (!massUpdateSubmitWaitPromise) {
          clearTimeout(submitWaitTimeout);
        }
      }).done(function(response) {
        function getErrorNodes(items) {
          var nodes = [];
          if (items && items.length > 0) {
            _.each(items, function(item) {
              var validObject = _.findWhere(massUpdateValidObjects, {
                r_object_id: item["r_object_id"]
              });
              if (validObject) {
                if (validObject["rest-error"]) {
                  validObject = _.omit(validObject, "rest-error");
                }
                item = _.extend(item, validObject);
              }
              var node = massUpdateUtils.getErrorNodeObject(item);
              nodes.push(node);
            });
          }
          return nodes;
        }
        var massUpdateData = {
          data: data
        };
        if (response.errors && response.errors.length > 0 || response.warnings && response.warnings.length > 0) {
          if (response.errors && response.errors.length === massUpdateValidObjects.length) {
            massUpdateData.error = lang[wizard.options.data.langPrefix + "NoObjectUpdated"];
          } else {
            var nextStep = STEPS.MASS_UPDATE_ERROR_PAGE;
            wizard.data.massUpdateData.submitErrorNodes = getErrorNodes(response.errors);
            wizard.data.massUpdateData.submitWarningNodes = getErrorNodes(response.warnings);
          }
        }
        if (massUpdateSubmitWaitPromise) {
          massUpdateSubmitWaitPromise.resolve(nextStep, massUpdateData);
        } else {
          isProcessingIgnored = true;
          wizard.unblockActions();
          if (nextStep) {
            wizard.gotoStep(nextStep);
          } else {
            wizard.close(massUpdateData);
          }
        }
      }).fail(function(error) {
        var massUpdateError = {
          data: data,
          error: error
        };
        if (massUpdateSubmitWaitPromise) {
          massUpdateSubmitWaitPromise.reject(massUpdateError);
        } else {
          isProcessingIgnored = true;
          wizard.close(massUpdateError);
        }
      });
    },
    _saveMassUpdateData: function(data, context) {
      var dfd = $.Deferred(), url = data.savePopertiesUrl, connector = context.getObject(ConnectionFactory);
      if (!url) {
        dfd.reject();
      }
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        data: JSON.stringify(data.payload),
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: dfd.resolve,
        error: dfd.reject
      }));
      return dfd.promise();
    },
    onWizardCancel: function() {
      var deferred = $.Deferred(), massUpdateConfigName = this.options.massUpdateConfig["massupdate_config_label"] || this.options.massUpdateConfig["massupdate_config_name"], buttonOptions = {
        labelYes: commandLang.MassUpdateStopLabel,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, _.str.sformat(commandLang.MassUpdateConfirmMessage, massUpdateConfigName), commandLang.MassUpdateConfirmTitle, {
        buttons: buttonOptions
      });
      return deferred.promise();
    }
  });
  MassUpdateDialog.extend = Backbone.View.extend;
  return MassUpdateDialog;
});