/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "csui/utils/commands/node", "i18n!d2/commands/nls/localized.strings", "d2/commands/node.progress.command", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/models/creation.profile", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "css!d2/commands/impl/import.file" ], function(require, _, $, Backbone, NodeModel, NodeCommand, lang, NodeProgressCommand, ModalAlert, ProfileModel, ProfileCollection, ValueConfigCollection, creationUtil, RestLinkrels) {
  "use strict";
  var NodeProcessingResultView;
  var CreateEmailAttachments = NodeCommand.extend({
    defaults: {
      signature: "D2-CreateEmailAttachments",
      command_key: "D2-CreateEmailAttachments",
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      options = options || {};
      options.parallelism = options.parallelism || 1;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      this.loadDependencies(status, options).then(this.openWizard.bind(this)).then(this._performActions.bind(this)).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    loadDependencies: function(status, options) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/new.file/node.processing.result.view" ], function(NPRView) {
        NodeProcessingResultView = NPRView;
        deferred.resolve(status, options);
      }, deferred.reject);
      return deferred.promise();
    },
    _performAction: function(node) {
      var deferred = $.Deferred();
      node.profileData.set({
        "inherited-id": node.parentItem.get("id")
      }, {
        silent: true
      });
      creationUtil.createObject(node, "create").done(function() {
        if (!_.isArray(node.parentItem.linkedNodes)) {
          node.parentItem.linkedNodes = [];
        }
        node.parentItem.linkedNodes.push(node);
        creationUtil.createLinkDocumentRelations(node.parentItem, node, node.linkConfig).done(function() {
          deferred.resolve(node);
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _performActions: function(status, options) {
      var deferred = $.Deferred(), nodeCollection = status.nodeCollection, originatingView = status.originatingView;
      if (nodeCollection && nodeCollection.length) {
        var newStatus = _.defaults({
          nodes: nodeCollection
        }, status);
        newStatus.suppressMultipleSuccessMessage = true;
        newStatus.suppressMultipleFailMessage = true;
        originatingView && originatingView.blockActions();
        NodeProgressCommand.prototype._processItems.call(this, newStatus, options).always(function() {
          originatingView && originatingView.unblockActions();
        }).done(function() {
          deferred.resolve(status, options);
        }).fail(function(args) {
          var successNodes = args && _.filter(args, function(result) {
            return result instanceof NodeModel;
          }) || [];
          var failedNodes = _.difference(nodeCollection.models, successNodes);
          var alertContent = NodeProcessingResultView.create({
            collection: failedNodes,
            type: NodeProcessingResultView.Types.WARNING,
            title: lang.attachmentCreationErrorSomeFailedNodelistTitle
          });
          this.showConfirmationAlert(lang.attachmentCreationErrorSomeFailedAlertTitle, lang.attachmentCreationErrorSomeFailedMessage, lang.attachmentCreationErrorAlertOKButtonLabel, lang.attachmentCreationErrorAlertCancelButtonLabel, alertContent).done(function() {
            _.each(failedNodes, function(node) {
              if (_.isArray(node.parentItem.linkedNodes)) {
                var nodeIndex = _.indexOf(node.parentItem.linkedNodes, node);
                node.parentItem.linkedNodes.splice(nodeIndex, 1);
              }
            });
            creationUtil.finishCreateOperation(failedNodes, RestLinkrels.ABORT_ACTION).always(deferred.resolve);
          }.bind(this)).fail(function() {
            status.isCancelled = true;
            deferred.reject();
          });
        }.bind(this));
      } else {
        deferred.resolve(status, options);
      }
      return deferred.promise();
    },
    showConfirmationAlert: function(title, message, yesButtonLabel, cancelButtonLabel, contentView) {
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: yesButtonLabel,
        labelCancel: cancelButtonLabel,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmWarning(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, message, title, {
        buttons: buttonOptions,
        contentView: contentView,
        modalClass: "alert-node-processing-error"
      });
      return dfd.promise();
    },
    getProfileAndValueConfig: function(linkConfig, connector, mode, originatingView) {
      var deferred = $.Deferred(), profileCollection = new ProfileCollection(undefined, {
        connector: connector,
        mode: mode
      }), configCollection = new ValueConfigCollection(undefined, {
        connector: connector,
        mode: mode
      }), profileModel = new ProfileModel({
        links: linkConfig.get("links")
      }, {
        connector: connector
      }), rejectPromiseAndUnblockActions = function() {
        originatingView && originatingView.unblockActions();
        deferred.reject();
      };
      originatingView && originatingView.blockActions();
      profileModel.fetch().done(function() {
        profileModel.set({
          inheritanceHidden: true
        });
        profileModel.set("inherit_properties", true);
        profileModel.set("inherit_content", false);
        profileModel.set("inherit_vd_structure", false);
        profileCollection.set([ profileModel ]);
        profileCollection.fetched = true;
        configCollection.profile = profileModel;
        configCollection.fetch().done(function() {
          originatingView && originatingView.unblockActions();
          deferred.resolve(configCollection, profileModel, profileCollection);
        }).fail(rejectPromiseAndUnblockActions);
      }).fail(rejectPromiseAndUnblockActions);
      return deferred.promise();
    },
    getProfileAndValueConfigs: function(linkConfigsByProfileName, connector, mode, originatingView) {
      var deferred = $.Deferred(), configCollections = {}, promises = [], rejectPromiseAndUnblockActions = function() {
        originatingView && originatingView.unblockActions();
        deferred.reject();
      };
      originatingView && originatingView.blockActions();
      _.each(_.keys(linkConfigsByProfileName), function(profileName) {
        var me = this;
        (function(profileName) {
          var dfd = $.Deferred(), linkConfig = linkConfigsByProfileName[profileName][0];
          promises.push(dfd);
          me.getProfileAndValueConfig(linkConfig, connector, mode).done(function(configCollection) {
            configCollections[profileName] = configCollection;
            dfd.resolve();
          }).fail(dfd.reject);
        })(profileName);
      }.bind(this));
      $.whenAll.apply($, promises).done(function() {
        originatingView && originatingView.unblockActions();
        deferred.resolve(configCollections);
      }).fail(rejectPromiseAndUnblockActions);
      return deferred.promise();
    },
    getLinkConfigFromEmail: function(email) {
      return email.linkDocConfig.at(0).get("relation_items").at(0);
    },
    openWizard: function(status, options) {
      var deferred = $.Deferred(), mode = "import", context = status.context, connector = context && context.getObject("connector"), originatingView = status.originatingView, linkTargetNode = status.linkTargetNode, emailCollection = status.collection, attachmentsCollection = creationUtil.getCollectionForAttachment(emailCollection), nonSilentAttachmentsCollection = new Backbone.Collection(), applyToRemainingIsNeverApplicable = false;
      status.nodeCollection = new Backbone.Collection();
      if (attachmentsCollection.length) {
        var linksByProfileName = _.groupBy(emailCollection.map(this.getLinkConfigFromEmail.bind(this)), function(linkConfig) {
          return linkConfig.get("create_config");
        });
        this.getProfileAndValueConfigs(linksByProfileName, connector, mode, originatingView).done(function(configCollections) {
          var nonSilentProfileSet = {};
          attachmentsCollection.each(function(nodeModel) {
            if (!nodeModel.profileData) {
              nodeModel.profileData = new Backbone.Model();
            }
            nodeModel.linkTargetNode = linkTargetNode;
            var linkConfig = this.getLinkConfigFromEmail(nodeModel.parentItem), profileName = linkConfig.get("create_config"), configCollection = configCollections[profileName];
            nodeModel.linkConfig = linkConfig;
            nodeModel.configCollection = configCollection;
            nodeModel.profileCollection = configCollection.profile.collection;
            if (linkConfig.get("silent") !== true) {
              nonSilentAttachmentsCollection.add(nodeModel, {
                silent: true
              });
              nonSilentProfileSet[profileName] = true;
            }
          }.bind(this));
          if (nonSilentAttachmentsCollection.length) {
            var profileNames = _.keys(nonSilentProfileSet), configCollection;
            applyToRemainingIsNeverApplicable = profileNames.length > 1;
            if (profileNames.length === 1) {
              configCollection = configCollections[profileNames[0]];
            }
            var setSingleProfileConfig = function() {
              var profileModel = configCollection.profile.clone();
              profileModel.set("valueConfig", configCollection.at(0).clone());
              profileModel.set("link-id", linkTargetNode && linkTargetNode.get("id"));
              nonSilentAttachmentsCollection.each(function(nodeModel) {
                creationUtil.mapProfileModelToProfileData(profileModel, nodeModel.profileData);
                nodeModel.profileData.hasValidData = true;
              });
            };
            if (configCollection && configCollection.length === 1 && !configCollection.at(0).get("property_config")) {
              setSingleProfileConfig();
              status.nodeCollection.add(nonSilentAttachmentsCollection.models);
              deferred.resolve(status, options);
            } else {
              require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/emails/email.attachments.custom.profile.view", "d2/dialogs/new.file/emails/email.attachments.metadata.view" ], function(StepperWizard, EmailAttachmentsCustomProfileView, EmailAttachmentsMetadataView) {
                var stepOptions = {
                  steps: [ {
                    id: "attachments_custom_profile",
                    viewClass: EmailAttachmentsCustomProfileView,
                    viewOptions: {
                      inheritableSourceNode: linkTargetNode,
                      container: linkTargetNode
                    },
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
                      disabled: function() {
                        return this.isNextButtonDisabled;
                      },
                      clickHandler: function() {
                        this.gotoNextStep();
                      }
                    }, {
                      id: "applyToRemaining",
                      type: "binf-icon",
                      toolTip: function() {
                        return this.applyToRemainingCaption;
                      },
                      disabled: function() {
                        return this.applyRemainingBtnDisabled;
                      },
                      hidden: function() {
                        return applyToRemainingIsNeverApplicable || this.applyRemainingBtnHidden;
                      },
                      clickHandler: function() {
                        this.applyToRemaining();
                      }
                    } ],
                    onCancel: function() {
                      return creationUtil.showCancelAlertForImport.call(this, lang.AttachmentCreationCancelAlertMessage, "", lang.AttachmentCreationCancelAlertButtonLabelYes);
                    }
                  }, {
                    id: "attachments_metadata",
                    viewClass: EmailAttachmentsMetadataView,
                    viewOptions: {},
                    nextStepId: "finish",
                    title: function() {
                      return this.getTitle();
                    },
                    subTitle: function() {
                      return this.getSubTitle();
                    },
                    buttons: [ {
                      id: "nextFile",
                      className: "nextFileBtn",
                      label: function() {
                        return this.nextFileCaption;
                      },
                      disabled: function() {
                        return this.nextFileButtonDisabled;
                      },
                      hidden: function() {
                        return this.nextFileButtonHidden;
                      },
                      clickHandler: function() {
                        this.nextItem();
                      }
                    }, {
                      id: "next",
                      className: "nextBtn",
                      disabled: function() {
                        return this.nextButtonDisabled;
                      },
                      hidden: function() {
                        return this.nextButtonHidden;
                      },
                      clickHandler: function() {
                        this.next();
                      }
                    }, {
                      id: "applyToRemaining",
                      className: "applyToRemainingBtn",
                      type: "binf-icon",
                      toolTip: function() {
                        return this.applyToRemainingCaption;
                      },
                      ariaLabel: function() {
                        return this.applyToRemainingCaption;
                      },
                      disabled: function() {
                        return this.applyRemainingBtnDisabled;
                      },
                      hidden: function() {
                        return applyToRemainingIsNeverApplicable || this.applyRemainingBtnHidden;
                      },
                      clickHandler: function() {
                        this.applyToRemaining();
                      }
                    } ],
                    onCancel: function() {
                      return creationUtil.showCancelAlertForImport.call(this, lang.AttachmentCreationCancelAlertMessage, "", lang.AttachmentCreationCancelAlertButtonLabelYes);
                    }
                  } ],
                  data: {
                    context: status.context,
                    collection: nonSilentAttachmentsCollection,
                    container: status.container,
                    mode: mode
                  },
                  className: "d2-email-attachments-wizard"
                };
                var startingStepName = "attachments_custom_profile";
                if (configCollection && configCollection.length === 1) {
                  setSingleProfileConfig();
                  startingStepName = "attachments_metadata";
                  stepOptions.steps[1].viewOptions["noPreviousStep"] = true;
                }
                new StepperWizard(stepOptions).show(startingStepName).on("wizard:closed", function(isCancel) {
                  status.isCancelled = isCancel;
                  if (!isCancel) {
                    status.nodeCollection.add(nonSilentAttachmentsCollection.models);
                  }
                  deferred.resolve(status, options);
                }).on("wizard:forceclose", function() {
                  deferred.reject();
                });
              }.bind(this), deferred.reject);
            }
          } else {
            deferred.resolve(status, options);
          }
        }.bind(this)).fail(deferred.reject);
      } else {
        deferred.resolve(status, options);
      }
      return deferred.promise();
    }
  });
  return CreateEmailAttachments;
});