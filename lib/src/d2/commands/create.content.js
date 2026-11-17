/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "d2/controls/globalmessage/globalmessage", "nuc/models/node/node.model", "csui/models/command", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/new.file/impl/nls/lang", "dctmw/server.adaptors/converters/node", "d2/utils/creation.utils" ], function(module, $, _, Backbone, log, GlobalMessage, NodeModel, CommandModel, lang, langDlgNewFile, nodeConverter, creationUtils) {
  "use strict";
  var logger = log(module.id);
  var STEPS = Object.freeze({
    SELECT_TYPE: "select_type",
    EDIT_TYPE: "edit_type",
    FINISH: "finish"
  });
  var CommandCreateContent = CommandModel.extend({
    defaults: {
      signature: "D2-CreateContent",
      command_key: "D2-CreateContent",
      name: lang.CommandNameCreateContent,
      verb: lang.CommandVerbCreateContent,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      this.openWizard(status, options).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    showGlobalErrorMessage: function(error) {
      if (_.isString(error)) {
        GlobalMessage.showMessage("error", error);
      } else {
        error.responseJSON = error.responseJSON || {};
        GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
      }
    },
    openWizard: function(status, options) {
      var deferred = $.Deferred();
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/select.type.view", "d2/dialogs/new.file/edit.type.view", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/models/creation.presets", "d2/models/creation.presets.value.configs", "d2/models/creation.presets.value.config", "csui/utils/commands" ], function(StepperWizard, SelectTypeView, EditTypeView, ProfileCollection, ValueConfigCollection, PresetCollection, PresetConfigCollection, PresetValueConfigModel, commands) {
        var me = this, mode = options.mode || "", connector = status.context.getObject("connector"), profileData = new Backbone.Model(), sourceContentNode = creationUtils.getSourceContentNode(status), landingPageInheritedNode = creationUtils.getLandingPageInheritedNode(status), container = status.container && !nodeConverter.isNonDCTMNode(status.container) ? status.container : undefined, editPresetProfileCollection = new ProfileCollection(undefined, {
          connector: connector,
          mode: mode,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode
        }), editPresetConfigCollection = new ValueConfigCollection(undefined, {
          connector: connector,
          mode: mode
        }), presetCollection = new PresetCollection(undefined, {
          connector: connector
        }), presetConfigCollection = new PresetConfigCollection(undefined, {
          mode: mode,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode,
          isOperatingModePreset: true,
          connector: connector
        }), recentConfigCollection = new PresetConfigCollection(undefined, {
          mode: mode,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode,
          isOperatingModePreset: false,
          connector: connector
        }), originatingView = status.originatingView;
        function updateProfileData(profile, valueConfig, sourceContentNode, doNotCloneProfile) {
          doNotCloneProfile = _.isBoolean(doNotCloneProfile) ? doNotCloneProfile : false;
          var cProfile = doNotCloneProfile ? profile : profile.clone();
          cProfile.set("valueConfig", valueConfig);
          if (sourceContentNode && (!landingPageInheritedNode || landingPageInheritedNode.get("id") !== sourceContentNode.get("id"))) {
            cProfile.set({
              "inherited-id": sourceContentNode.get("id")
            });
          } else {
            cProfile.set({
              "inherited-id": ""
            });
          }
          if (container) {
            cProfile.set({
              "link-id": container.get("id")
            });
          }
          creationUtils.mapProfileModelToProfileData(cProfile, profileData);
          return cProfile;
        }
        function executeCommand(isImportCommand, presetModel, wizard) {
          isImportCommand = _.isBoolean(isImportCommand) ? isImportCommand : true;
          var command = commands.get(isImportCommand ? "D2-ImportFile" : "D2-CreateFile");
          if (command) {
            var newStatus = _.extend({}, status, {
              presetModel: presetModel
            }), newOptions = _.extend({}, options, {
              recentProfileCollection: recentConfigCollection
            });
            if (presetModel) {
              newOptions.ignorePresetEditCheck = true;
            } else {
              newOptions.ignorePresetRetreival = true;
              newOptions.presetProfilesApplicable = presetCollection.length > 0;
            }
            Backbone.Wreqr.radio.channel("stepper_wizard").vent.once("wizard:shown", function() {
              wizard && wizard.minimize();
            });
            command.execute(newStatus, newOptions).always(function() {
              wizard && wizard.close();
            });
          } else {
            creationUtils.showErrorAlert(lang.CreateContentErrorCommandUnavailableAlertTitle, isImportCommand ? lang.CreateContentErrorCommandUnavailableAlertMessageImport : lang.CreateContentErrorCommandUnavailableAlertMessageCreate, lang.CreateContentErrorCommandUnavailableAlertOKButton);
          }
        }
        function executeCommandWithEditedPreset(isImportCommand, wizard) {
          var profile = profileData.data;
          var cPresetModel = profileData.data.presetModel.clone();
          cPresetModel.isEdited = profile.isEdited;
          cPresetModel.profile = profile;
          cPresetModel.sourceContent = new NodeModel({
            id: profile.get("inherited-id")
          }, {
            connector: cPresetModel.sourceContent.connector
          });
          profile.presetModel = cPresetModel;
          if (isImportCommand) {
            profile.set("inherit_content", false);
          }
          executeCommand(isImportCommand, cPresetModel, wizard);
        }
        var stepOptions = {
          steps: [ {
            id: STEPS.SELECT_TYPE,
            viewClass: SelectTypeView.extend({
              onActionCreateCustom: function() {
                executeCommand(false, undefined, this.wizard);
              },
              onActionImportCustom: function() {
                executeCommand(true, undefined, this.wizard);
              },
              onActionCreateWithPreset: function(presetModel) {
                if (presetModel) {
                  presetModel.isEdited = false;
                  executeCommand(false, presetModel, this.wizard);
                }
              },
              onActionImportWithPreset: function(presetModel) {
                if (presetModel) {
                  presetModel.isEdited = false;
                  executeCommand(true, presetModel, this.wizard);
                }
              },
              onActionEditPreset: function(presetModel) {
                if (presetModel) {
                  var profileInUse = SelectTypeView.prototype.onActionEditPreset.apply(this, arguments);
                  updateProfileData(profileInUse, presetModel.valueConfig, presetModel.sourceContent, true);
                  this.wizard && this.wizard.gotoStep(STEPS.EDIT_TYPE);
                }
              }
            }),
            viewOptions: {
              presetCollection: presetCollection,
              presetConfigCollection: presetConfigCollection,
              recentConfigCollection: recentConfigCollection,
              editPresetProfileCollection: editPresetProfileCollection,
              editPresetConfigCollection: editPresetConfigCollection
            },
            title: function() {
              return this.getTitle();
            },
            buttons: [ {
              id: "next",
              hidden: true
            } ]
          }, {
            id: STEPS.EDIT_TYPE,
            viewClass: EditTypeView,
            viewOptions: {
              profileCollection: editPresetProfileCollection,
              configCollection: editPresetConfigCollection
            },
            title: function() {
              return this.getTitle();
            },
            buttons: [ {
              id: "next",
              hidden: true
            }, {
              id: "cancel",
              clickHandler: function() {
                this.wizard && this.wizard.prevStep();
              }
            }, {
              id: "btnCreateFile",
              label: langDlgNewFile.tooltipSelectTypeNewFile,
              isPrimary: function() {
                return this.profileData && this.profileData.data && !this.profileData.data.canBeUsedForImport();
              },
              hidden: function() {
                return !(this.profileData && this.profileData.data && this.profileData.data.canBeUsedForCreate());
              },
              disabled: function() {
                return this.isNextButtonDisabled;
              },
              clickHandler: function() {
                if (this.validate() && this.profileData.data.presetModel) {
                  executeCommandWithEditedPreset(false, this.wizard);
                }
              }
            }, {
              id: "btnUploadFile",
              label: langDlgNewFile.tooltipSelectTypeImportFile,
              isPrimary: function() {
                return this.profileData && this.profileData.data && this.profileData.data.canBeUsedForImport();
              },
              hidden: function() {
                return !(this.profileData && this.profileData.data && this.profileData.data.canBeUsedForImport());
              },
              disabled: function() {
                return this.isNextButtonDisabled;
              },
              clickHandler: function() {
                if (this.validate() && this.profileData.data.presetModel) {
                  executeCommandWithEditedPreset(true, this.wizard);
                }
              }
            } ]
          } ],
          data: {
            profileData: profileData,
            context: status.context,
            container: container,
            mode: mode,
            inheritableSourceNode: sourceContentNode
          },
          showPageLeavingWarning: false,
          className: "d2-create-content-wizard"
        };
        function showWizard(stepId) {
          new StepperWizard(stepOptions).show(stepId).on("wizard:closed", function(isCancel) {
            if (isCancel) {
              deferred.reject(status, options);
              return;
            }
            deferred.resolve(status, options);
          }).on("wizard:forceclose", function() {
            deferred.reject(status, options);
          });
        }
        function blockActions() {
          originatingView && originatingView.blockActions();
        }
        function unblockActions() {
          originatingView && originatingView.unblockActions();
        }
        function handleDataFetchFailure(error) {
          unblockActions();
          me.showGlobalErrorMessage(error);
          deferred.reject(status, options);
        }
        function failWithNoProfileError() {
          handleDataFetchFailure(lang.CreateContentErrorNoProfile);
          logger.info("Create content profile data is empty") && console.log(logger.last);
        }
        blockActions();
        presetCollection.fetch().done(function() {
          if (presetCollection.length) {
            var preset = presetCollection.at(0);
            presetConfigCollection.preset = preset;
            recentConfigCollection.preset = preset;
            if (!preset.isCustomAllowed()) {
              presetConfigCollection.fetch().done(function() {
                if (!presetConfigCollection.length) {
                  if (preset.isRecentAllowed()) {
                    recentConfigCollection.fetch().done(function() {
                      unblockActions();
                      if (recentConfigCollection.length) {
                        showWizard();
                      } else {
                        failWithNoProfileError();
                      }
                    }).fail(handleDataFetchFailure);
                  } else {
                    failWithNoProfileError();
                  }
                } else {
                  unblockActions();
                  showWizard();
                }
              }).fail(handleDataFetchFailure);
            } else {
              unblockActions();
              showWizard();
            }
          } else {
            failWithNoProfileError();
          }
        }).fail(handleDataFetchFailure);
      }.bind(this), deferred.reject);
      return deferred.promise();
    }
  });
  return CommandCreateContent;
});