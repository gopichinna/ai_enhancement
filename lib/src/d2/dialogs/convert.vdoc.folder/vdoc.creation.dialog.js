/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/custom.profile.view", "d2/dialogs/new.file/create/create.metadata.propertypage.view", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "dctmw/utils/utils", "d2/utils/creation.utils", "d2/utils/vdoc.creation.utils", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function(module, _, $, Backbone, NodeModel, StepperWizard, CustomProfileView, MetadataPropertiesView, ProfileCollection, ValueConfigCollection, utils, CreationUtils, VdocCreationUtils, nodeConverter, RestLinkrels, lang) {
  "use strict";
  function VdocCreationDialog(status, options) {
    options || (options = {});
    this.options = options;
    this.action = options.action;
    this.status = status;
    this.deferred = $.Deferred();
    this.mode = options.mode;
    this.sourceContentNode = this._getSourceContentNode(status);
    this.node = new NodeModel(undefined, {
      context: status.context,
      connector: this.status.context.getObject("connector")
    });
    this.STEPS = Object.freeze({
      CREATE_TYPE: "custom_type",
      PROPERTIES: "properties"
    });
    this.landingPageInheritedNode = this._getLandingPageInheritedNode(this.status, this.status.context.getObject("connector"));
    var self = this;
    this.profileCollection = new ProfileCollection(undefined, {
      connector: self.status.connector,
      mode: self.status.mode,
      inheritableSourceNode: self.sourceContentNode || self.landingPageInheritedNode
    }), this.configCollection = new ValueConfigCollection(undefined, {
      connector: self.status.connector,
      mode: self.status.mode
    }), this.createTypeScreenHasCustomNameField = false, this.profileData = new Backbone.Model(), 
    this.subTitle = "";
    this.profileData.on("change", function() {
      self.profileDataChanged = true;
    });
  }
  _.extend(VdocCreationDialog.prototype, {
    _getSourceContentNode: CreationUtils.getSourceContentNode,
    _getLandingPageInheritedNode: CreationUtils.getLandingPageInheritedNode,
    _showWizard: function(stepPage) {
      var self = this;
      self.wizard.show(stepPage).on("wizard:closed", function(isCancel, arg) {
        self.status.results = arg;
        self.status.isCancelled = isCancel;
        if (isCancel || arg && arg.success !== true) {
          var nodeList = [ self.node ];
          CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION);
          arg = arg || {};
          arg.isCancelled = isCancel;
          self.deferred.reject(isCancel ? arg : !arg.success ? arg.error : arg, self.options);
        }
      }).on("wizard:forceclose", function() {
        var nodeList = [ self.node ];
        CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION, false);
        self.deferred.reject(self.status, self.options);
      });
    },
    createObjectAndNext: function(wizard) {
      var self = this;
      self._announceOperationStart(wizard, self.status);
      self.action.createFile(self.node, self.status).done(function() {
        self._announceOperationEnd(wizard, self.status);
        var nodeList = [ self.node ];
        CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION);
        if (wizard) {
          wizard.close({
            success: true,
            newNode: self.node
          });
        }
        self.deferred.resolve(self.node);
      }).fail(function(error) {
        self._announceOperationEnd(wizard, self.status);
        self.wizard.close({
          success: false,
          error: error
        });
        self.deferred.reject(error);
      });
    },
    handleDataFetchFailure: function(error) {
      this.deferred.reject(error);
    },
    updateProfileDataAndAttachToNodeModel: function(profile, valueConfig, sourceContentNode, doNotCloneProfile) {
      doNotCloneProfile = _.isBoolean(doNotCloneProfile) ? doNotCloneProfile : false;
      var cProfile = doNotCloneProfile ? profile : profile.clone();
      var self = this;
      cProfile.set("valueConfig", valueConfig);
      CreationUtils.mapProfileModelToProfileData(cProfile, self.profileData);
      self.node.profileData = self.profileData;
      return cProfile;
    },
    decideAndRunStepAfterImplicitProfileSelection: function() {
      var self = this;
      if (CreationUtils.hasPropertyPage(self.profileData)) {
        self._showWizard(self.STEPS.PROPERTIES);
      } else {
        self.createObjectAndNext();
      }
    },
    fetchProfileAndRunStep: function() {
      var self = this;
      if (self.configCollection.length === 1) {
        self.updateProfileDataAndAttachToNodeModel(self.profileCollection.at(0), self.configCollection.at(0), self.sourceContentNode);
        self.decideAndRunStepAfterImplicitProfileSelection();
      } else {
        self._showWizard(self.STEPS.CREATE_TYPE);
      }
    },
    handleNextButtonClickAfterProfileSelection: function(dialog) {
      var self = this, wizard = self.wizard;
      var onNext = function() {
        if (!CreationUtils.hasPropertyPage(dialog.profileData)) {
          self.createObjectAndNext(wizard);
        } else {
          wizard && wizard.nextStep();
        }
      };
      var tokenId = dialog.node._tokenId;
      if (dialog.profileDataChanged === true) {
        dialog.profileDataChanged = false;
        dialog.node.profileData = _.clone(dialog.profileData);
        dialog.node.trigger("refresh:form:model");
        if (tokenId) {
          this.deleteCreatedNode(onNext, dialog);
          return;
        } else {
          if (dialog.node.has("properties")) {
            dialog.node.unset("properties");
          }
        }
      }
      onNext();
    },
    deleteCreatedNode: function(callback, dialog) {
      if (dialog.node._tokenId) {
        CreationUtils.finishCreateOperation([ dialog.node ], RestLinkrels.ABORT_ACTION).always(function() {
          dialog.node.clear({
            silent: true
          });
          _.isFunction(callback) && callback();
        });
      } else {
        _.isFunction(callback) && callback();
      }
    },
    generateSteps: function() {
      var self = this;
      return {
        steps: [ {
          id: self.STEPS.CREATE_TYPE,
          viewClass: CustomProfileView.extend({
            onStepBeforeActive: function() {
              this.showCustomNameField = self.createTypeScreenHasCustomNameField;
              return CustomProfileView.prototype.onStepBeforeActive && CustomProfileView.prototype.onStepBeforeActive.apply(this, arguments);
            }
          }),
          title: function() {
            return this.getTitle();
          },
          subTitle: self.subTitle,
          viewOptions: {
            inheritableSourceNode: self.sourceContentNode,
            profileCollection: self.profileCollection,
            configCollection: self.configCollection
          },
          nextStepId: function() {
            return self.STEPS.PROPERTIES;
          },
          buttons: [ {
            id: "next",
            disabled: function() {
              return this.isNextButtonDisabled;
            },
            clickHandler: function() {
              var view = this;
              if (view.validate()) {
                self.handleNextButtonClickAfterProfileSelection(self);
              }
            }
          } ],
          onCancel: function() {
            return self.onCancel();
          }
        }, {
          id: self.STEPS.PROPERTIES,
          viewClass: MetadataPropertiesView,
          title: function() {
            return this.getTitle();
          },
          subTitle: self.subTitle,
          viewOptions: {
            action: self.mode,
            formMode: self.mode,
            operationType: self.mode
          },
          buttons: [ {
            id: "next",
            label: lang.CommandNameConvertToVDoc,
            disabled: function() {
              return this.nextButtonDisabled;
            },
            clickHandler: function() {
              var view = this, wizard = view.parent;
              if (view.validate()) {
                if (view.updateModelData) {
                  view.updateModelData();
                }
                self.createObjectAndNext(wizard);
              }
            }
          } ],
          onCancel: function() {
            return self.onCancel();
          }
        } ],
        data: {
          profileData: self.profileData,
          node: self.node,
          context: self.status.context,
          container: self.status.container,
          mode: self.mode,
          isLinkedDoc: self.action.isLinkedDoc,
          linkedNodes: {}
        },
        className: "d2-convert-vd-wizard"
      };
    },
    showWizard: function() {
      var self = this;
      self._announceOperationStart(undefined, status);
      VdocCreationUtils.fetchFolderConfiguration(self.status, self.options).done(function(data) {
        self._announceOperationEnd(undefined, status);
        self.profileCollection = data.profile;
        self.configCollection = data.valueConfig;
        self.profileCollection.fetched = true;
        self.wizard = new StepperWizard(self.generateSteps());
        self.fetchProfileAndRunStep();
      }).fail(self.handleDataFetchFailure);
      self._announceOperationEnd(undefined, status);
      return self.deferred.promise();
    },
    _announceOperationStart: function(wizard, status) {
      var view = wizard || status.originatingView;
      if (view && view.blockActions) {
        view.blockActions();
      }
    },
    _announceOperationEnd: function(wizard, status) {
      var view = wizard || status.originatingView;
      if (view && view.unblockActions) {
        view.unblockActions();
      }
    },
    onCancel: function() {
      return CreationUtils.showCancelAlertForImport.call(this, lang.ConvertVDCancelAlertMessage, "", lang.ConvertVDCancelAlertButtonLabelYes, true);
    }
  });
  return VdocCreationDialog;
});