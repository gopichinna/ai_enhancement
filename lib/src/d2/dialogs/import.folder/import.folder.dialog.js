/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "csui/utils/contexts/perspective/perspective.context", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/custom.profile.view", "d2/dialogs/import.folder/profile.selection.view", "d2/dialogs/new.file/create/create.metadata.propertypage.view", "d2/dialogs/import.folder/import.folder.processing.view", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/models/folder.structure.configs", "d2/models/creation.profile", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "dctmw/server.adaptors/converters/node", "d2/utils/constants", "i18n!d2/dialogs/import.folder/impl/nls/lang" ], function(_, $, Backbone, NodeModel, PerspectiveContext, StepperWizard, VdocProfileView, ProfileSelectionView, MetadataPropertiesView, UploadProcessingView, ProfileCollection, ValueConfigCollection, FolderStructureCollection, CreationProfile, CreationUtils, RestLinkrels, nodeConverter, constants, lang) {
  "use strict";
  function ImportFolderStructureDialog(options) {
    options || (options = {});
    this.options = options;
    var profileData = new Backbone.Model();
    this.options.profileData = profileData;
    this.options.vdocProfileData = new Backbone.Model();
    this.options.node.profileData = profileData;
    var filteredFiles = CreationUtils.filterFileArrayMsg(this.options.files, false, true);
    var disAllowedFiles = CreationUtils.filterFileArrayMsg(this.options.files, false, false);
    var files = this.options.files;
    var rootFolderName;
    if (this.options.files && this.options.files[0] && this.options.files[0].rootDirectory) {
      rootFolderName = this.options.files[0].rootDirectory;
    } else {
      if (files instanceof FileList) {
        rootFolderName = files[0].webkitRelativePath.slice(0, files[0].webkitRelativePath.indexOf("/"));
      } else {
        rootFolderName = files[0].path.slice(0, files[0].path.indexOf("/"));
      }
    }
    this.options.node.set("files", filteredFiles);
    this.options.node.set("rootFolderName", rootFolderName);
    this.options.files = filteredFiles;
    this.options.disAllowedFiles = disAllowedFiles;
    this.vdocProfileCollection = new ProfileCollection(undefined, {
      connector: this.options.connector,
      mode: this.options.mode,
      inheritableSourceNode: this.options.node
    });
    this.vdocConfigCollection = new ValueConfigCollection(undefined, {
      connector: this.options.connector,
      mode: this.options.mode
    });
    this.options.status.vdocNode = new NodeModel(undefined, {
      context: this.options.status.context,
      connector: this.options.status.context.getObject("connector")
    });
    profileData.on("change", function() {
      this.options.node.trigger("refresh:form:model");
    }.bind(this));
    this.options.vdocProfileData.on("change", function() {
      this.options.status.vdocNode.trigger("refresh:form:model");
    }.bind(this));
  }
  _.extend(ImportFolderStructureDialog.prototype, {
    STEPS: {
      EDIT_TYPE: "edit_type",
      PROPERTIES: "properties",
      PROCESS_FILES: "process_files",
      EDIT_VDOC_TYPE: "edit_vdoc_type",
      VDOC_PROPERTIES: "vdoc_properties"
    },
    show: function() {
      this._deferred = $.Deferred();
      this._showWizard();
      return this._deferred.promise();
    },
    _createWizardSteps: function(finalSteps) {
      var me = this;
      function isVDConversionApplicable() {
        return me.options.profileData && me.options.profileData.folderSelectionModel && me.options.profileData.folderSelectionModel.get("properties") && me.options.profileData.folderSelectionModel.get("properties")["convert_to_vd"];
      }
      function isUploadProcessingExist() {
        if (isVDConversionApplicable() || me.options.status.suppressD2ProgressBar) {
          return true;
        }
        return false;
      }
      var stepsDefinition = [];
      var editProfileStep = {
        id: this.STEPS.EDIT_TYPE,
        viewClass: ProfileSelectionView,
        title: function() {
          return this.getTitle();
        },
        nextStepId: function() {
          if (!CreationUtils.hasPropertyPage(me.options.profileData)) {
            if (isUploadProcessingExist()) {
              return me.STEPS.PROCESS_FILES;
            } else {
              return "finish";
            }
          }
          return "properties";
        },
        buttons: [ {
          id: "next",
          label: lang.ProfileSelection_Next,
          disabled: function() {
            return this.isNextButtonDisabled;
          },
          clickHandler: function() {
            if (this.validate()) {
              if (!CreationUtils.hasPropertyPage(me.options.profileData) && isUploadProcessingExist()) {
                me.options.status.node = me.options.node;
                me.options.status.disAllowedFiles = me.options.disAllowedFiles;
                me.options.command.getFileUploadModels(me.options.status).done(function() {
                  me._wizard && me._wizard.nextStep();
                });
              } else {
                me._wizard && me._wizard.nextStep();
              }
            }
          }
        } ],
        viewOptions: this.options
      };
      var propertiesStep = {
        id: this.STEPS.PROPERTIES,
        viewClass: MetadataPropertiesView,
        title: function() {
          return lang.EditProperties_Title;
        },
        subTitle: "",
        viewOptions: this.options,
        nextStepId: function() {
          if (isUploadProcessingExist()) {
            return me.STEPS.PROCESS_FILES;
          } else {
            return "finish";
          }
        },
        buttons: [ {
          id: "next",
          label: lang.ProfileSelection_Next,
          disabled: function() {
            return this.nextButtonDisabled;
          },
          clickHandler: function() {
            this.validate().done(function(isValid) {
              if (isValid) {
                this.updateModelData();
                me.options.status.node = me.options.node;
                if (isUploadProcessingExist()) {
                  me.options.status.disAllowedFiles = me.options.disAllowedFiles;
                  me.options.command.getFileUploadModels(me.options.status).done(function() {
                    me._wizard && me._wizard.nextStep();
                  });
                } else {
                  me._wizard && me._wizard.nextStep();
                }
              }
            }.bind(this));
          }
        } ],
        onCancel: function() {
          return me.options.command.onCancel();
        }
      };
      var processingStep = {
        id: this.STEPS.PROCESS_FILES,
        viewClass: UploadProcessingView,
        transient: true,
        title: function() {
          return this.getTitle();
        },
        nextStepId: function() {
          if (isVDConversionApplicable()) {
            return me.STEPS.EDIT_VDOC_TYPE;
          } else {
            return "finish";
          }
        },
        viewOptions: _.extend({
          wizardView: me
        }, this.options),
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
          hidden: function() {
            return !(me.options.status.context instanceof PerspectiveContext);
          },
          label: function() {
            return this.minimizeButtonLabel;
          },
          clickHandler: function() {
            this.minimize();
          }
        } ]
      };
      var editVdocProfileStep = {
        id: this.STEPS.EDIT_VDOC_TYPE,
        viewClass: VdocProfileView,
        title: function() {
          return lang.Vdoc_ProfileSelection_Title;
        },
        nextStepId: function() {
          if (!CreationUtils.hasPropertyPage(me.options.vdocProfileData)) {
            return "finish";
          }
          return me.STEPS.VDOC_PROPERTIES;
        },
        buttons: [ {
          id: "previous",
          hidden: true
        }, {
          id: "next",
          label: lang.ProfileSelection_Next,
          disabled: function() {
            return this.isNextButtonDisabled;
          },
          clickHandler: function() {
            if (this.validate()) {
              me._wizard && me._wizard.nextStep();
            }
          }
        } ],
        viewOptions: {
          profileCollection: this.vdocProfileCollection,
          configCollection: this.vdocConfigCollection,
          profileData: this.options.vdocProfileData,
          showCustomNameField: false,
          inheritableSourceNode: this.options.node,
          node: this.options.status.vdocNode
        }
      };
      var vdocPropertiesStep = {
        id: this.STEPS.VDOC_PROPERTIES,
        viewClass: MetadataPropertiesView,
        title: function() {
          return lang.Vdoc_EditProperties_Title;
        },
        subTitle: "",
        nextStepId: function() {
          return "finish";
        },
        buttons: [ {
          id: "next",
          label: lang.ProfileSelection_Next,
          disabled: function() {
            return this.nextButtonDisabled;
          },
          clickHandler: function() {
            if (this.validate()) {
              this.updateModelData();
              me._wizard && me._wizard.nextStep();
            }
          }
        } ],
        viewOptions: {
          node: this.options.status.vdocNode,
          formMode: this.options.formMode,
          action: this.options.action,
          operationType: this.options.operationType
        },
        onCancel: function() {
          return me.options.command.onCancel();
        }
      };
      _.each(finalSteps, function(step) {
        if (step === me.STEPS.EDIT_TYPE) {
          stepsDefinition.push(editProfileStep);
        }
        if (step === me.STEPS.PROPERTIES) {
          stepsDefinition.push(propertiesStep);
        }
        if (step === me.STEPS.PROCESS_FILES) {
          stepsDefinition.push(processingStep);
        }
        if (step === me.STEPS.EDIT_VDOC_TYPE) {
          stepsDefinition.push(editVdocProfileStep);
        }
        if (step === me.STEPS.VDOC_PROPERTIES) {
          stepsDefinition.push(vdocPropertiesStep);
        }
      });
      var stepOptions = null;
      if (!_.isEmpty(stepsDefinition)) {
        stepOptions = {
          steps: stepsDefinition,
          data: {
            context: this.options.status.context,
            container: this.options.container,
            node: this.options.node,
            selectedFiles: this.options.files,
            command: this.options.command,
            status: this.options.status
          },
          className: "d2-import-folder-wizard"
        };
      }
      return stepOptions;
    },
    _showWizard: function() {
      var me = this;
      var waitForStepCalculation = this.calculateApplicableStepsForFolderImport();
      waitForStepCalculation.done(function(steps) {
        var stepOptions = me._createWizardSteps(steps);
        if (stepOptions) {
          me._wizard = new StepperWizard(stepOptions).show().on("wizard:closed", function(isCancel) {
            if (isCancel) {
              me.options.status.isCancelled = true;
              me._deferred.reject();
            } else {
              var disAllowedFiles = me.options.status.disAllowedFiles;
              CreationUtils.addDisallowedFilesToModels(me, disAllowedFiles, me.options.status.folderUploadModels);
              me._deferred.resolve();
            }
          });
        } else {
          me._deferred.resolve();
        }
      }).fail(function(error) {
        me._deferred.reject(error);
      });
    },
    calculateApplicableStepsForFolderImport: function() {
      var waitForStepCalculation = $.Deferred();
      this.finalSteps = _.clone(this.STEPS);
      this.folderStructure = new FolderStructureCollection(undefined, {
        connector: this.options.connector,
        mode: this.options.mode,
        inheritableSourceNode: this.options.inheritableSourceNode,
        container: this.options.container
      });
      this.profileCollection = new ProfileCollection(undefined, {
        connector: this.options.connector,
        mode: this.options.mode,
        inheritableSourceNode: this.options.inheritableSourceNode
      });
      this.configCollection = new ValueConfigCollection(undefined, {
        connector: this.options.connector,
        mode: this.options.mode
      });
      var me = this;
      this.folderStructure.ensureFetched().then(function() {
        if (me.folderStructure.length === 1) {
          var model = me.folderStructure.at(0);
          me.options.profileData.folderSelectionModel = _.clone(model);
          me.options.profileData.set("folder-structure-config-id", model.get("id"));
          if (!model.get("properties")["convert_to_vd"]) {
            if (!me.options.status.suppressD2ProgressBar) {
              me.finalSteps = _.omit(me.finalSteps, "PROCESS_FILES");
            }
            me.finalSteps = _.omit(me.finalSteps, "EDIT_VDOC_TYPE");
            me.finalSteps = _.omit(me.finalSteps, "VDOC_PROPERTIES");
          }
          var profileModel = new CreationProfile({
            links: model.get("links")
          });
          profileModel.fetch().done(function() {
            me.profileCollection.reset([ profileModel ]);
            me.profileCollection.fetched = true;
            if (me.profileCollection.at(0).get("inheritanceHidden")) {
              me.configCollection.profile = me.profileCollection.at(0);
              me.configCollection.fetch().done(function() {
                if (me.configCollection.length === 1) {
                  var cProfile = _.clone(me.profileCollection.at(0));
                  cProfile.set("valueConfig", me.configCollection.at(0));
                  me.finalSteps = _.omit(me.finalSteps, "EDIT_TYPE");
                  if (me.options.status.container && !nodeConverter.isNonDCTMNode(me.options.status.container)) {
                    cProfile.set({
                      "link-id": me.options.status.container.get("id")
                    });
                  }
                  CreationUtils.mapProfileModelToProfileData(cProfile, me.options.profileData);
                  if (!CreationUtils.hasPropertyPage(me.options.profileData)) {
                    me.finalSteps = _.omit(me.finalSteps, "PROPERTIES");
                  }
                }
                if (model.get("properties")["convert_to_vd"] || me.options.status.suppressD2ProgressBar === true) {
                  me.options.status.node = me.options.node;
                  me.options.command.getFileUploadModels(me.options.status).done(function() {
                    waitForStepCalculation.resolve(me.finalSteps);
                  });
                } else {
                  waitForStepCalculation.resolve(me.finalSteps);
                }
              }).fail(function(error) {
                waitForStepCalculation.reject(error);
              });
            } else {
              waitForStepCalculation.resolve(me.finalSteps);
            }
          }).fail(function(error) {
            waitForStepCalculation.reject(error);
          });
        } else if (me.folderStructure.length === 0) {
          waitForStepCalculation.reject(lang.FolderStructureConfigNotFound);
        } else {
          waitForStepCalculation.resolve(me.finalSteps);
        }
      }).fail(function(error) {
        waitForStepCalculation.reject(error);
      });
      return waitForStepCalculation.promise();
    },
    calculateApplicableStepsForVdocConversion: function() {
      var waitForVdocStepCalculation = $.Deferred();
      var me = this;
      this.options.status.vdocNode.profileData = this.options.vdocProfileData;
      var link = RestLinkrels.getLink(this.options.node.get("links"), RestLinkrels.FOLDER_STRUCTURE_CONVERSION_CONFIG);
      $.ajax(this.options.status.vdocNode.connector.extendAjaxOptions({
        url: link,
        type: "GET",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          if (!response["object_name"]) {
            me.options.status.folderVDConversionFailed = true;
            me.options.status.folderStructureError = lang.FolderStructureConversionConfigError;
            waitForVdocStepCalculation.reject(lang.FolderStructureConversionConfigError);
            return;
          }
          var profileModel = new CreationProfile({
            links: response["links"]
          });
          profileModel.fetch().done(function() {
            me.vdocProfileCollection.reset([ profileModel ]);
            me.vdocProfileCollection.fetched = true;
            if (me.vdocProfileCollection.at(0).get("inheritanceHidden")) {
              me.vdocConfigCollection.profile = me.vdocProfileCollection.at(0);
              me.vdocConfigCollection.fetch().done(function() {
                if (me.vdocConfigCollection.length === 1) {
                  var cProfile = _.clone(me.vdocProfileCollection.at(0));
                  cProfile.set("valueConfig", me.vdocConfigCollection.at(0));
                  me.finalSteps = _.omit(me.finalSteps, "EDIT_VDOC_TYPE");
                  if (me.options.status.container && !nodeConverter.isNonDCTMNode(me.options.status.container)) {
                    cProfile.set({
                      "link-id": me.options.status.container.get("id")
                    });
                  }
                  CreationUtils.mapProfileModelToProfileData(cProfile, me.options.vdocProfileData);
                  if (!CreationUtils.hasPropertyPage(me.options.vdocProfileData)) {
                    me.finalSteps = _.omit(me.finalSteps, "VDOC_PROPERTIES");
                  }
                }
                waitForVdocStepCalculation.resolve(me.finalSteps);
              }).fail(function(error) {
                me.options.status.folderVDConversionFailed = true;
                me.options.status.folderStructureError = error;
                waitForVdocStepCalculation.reject(error);
              });
            } else {
              waitForVdocStepCalculation.resolve(me.finalSteps);
            }
          });
        },
        error: function(xhr) {
          waitForVdocStepCalculation.reject(xhr);
        }
      }));
      return waitForVdocStepCalculation.promise();
    }
  });
  return ImportFolderStructureDialog;
});