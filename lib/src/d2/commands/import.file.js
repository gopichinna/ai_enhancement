/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/node/node.model", "nuc/models/nodes", "nuc/models/node.children2/node.children2", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "csui/utils/command.error", "csui/utils/commandhelper", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "d2/utils/creation.utils", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/constants", "d2/ctf/ctfBridge", "d2/utils/concurrency.manager", "i18n!d2/commands/nls/localized.strings", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang", "css!d2/commands/impl/import.file" ], function(module, require, _, $, Backbone, log, NodeModel, NodeCollection, NodeChildren2Collection, UploadFileCollection, GlobalMessage, NodeCommand, CommandError, CommandHelper, NodeCreationSuccessMessageView, nodeConverter, RestLinkrels, CreationUtils, RestResources, utils, constants, ctfBridge, ConcurrencyManager, lang, dndLang) {
  "use strict";
  var config = _.extend({
    dialogSize: constants.WizardSize.SMALL,
    fullForm: false
  }, module.config());
  var logger = log(module.id);
  var PerspectiveContext, STEPS = Object.freeze({
    SELECT_TYPE: "select_type",
    EDIT_TYPE: "edit_type",
    FILE_UPLOAD: "upload",
    CREATE_TYPE: "custom_type",
    PROCESS_O2: "process_o2",
    PROPERTIES: "properties",
    PROCESS_FILES: "process_files",
    ATTACHMENT_SUMMARY: "attachment_summary",
    LINKED_DOC: "linked_document",
    FINISH: "finish"
  });
  return NodeCommand.extend({
    defaults: {
      signature: "D2-ImportFile",
      command_key: "D2-ImportFile",
      name: lang.CommandNameImportFile,
      pageLeavingWarning: lang.ImportFilePageLeavingWarning,
      scope: "single",
      defaultRefresh: true
    },
    enabled: function(status, options) {
      var menuType;
      if (status.toolItem) {
        var props = status.toolItem.get("actionProperties");
        menuType = props && props.menuType;
      }
      if (menuType === constants.MenuTypes.NEW_OBJECT || menuType === constants.MenuTypes.BWS_NEW_OBJECT) {
        if (status.container) {
          var nodes = new NodeCollection([ status.container ]), newStatus = _.defaults({
            nodes: nodes
          }, status);
          return NodeCommand.prototype.enabled.call(this, newStatus, options);
        } else {
          console.warn("status.container should be defined.");
        }
      } else {
        if (status.nodes && status.nodes.length === 1) {
          var node = CommandHelper.getJustOneNode(status);
          if (node) {
            return NodeCommand.prototype.enabled.call(this, status, options);
          }
        }
      }
      return false;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), secondaryPromise = $.Deferred();
      options = options || {};
      options.parallelism = options.parallelism || 1;
      if (options.disableConcurrentProcess !== true) {
        ConcurrencyManager.listenForProcessMinimize(status, options, this).always(() => {
          deferred.resolve(secondaryPromise);
        });
      }
      if (ctfBridge.isCtfEnabled()) {
        options.parallelism = 1;
      }
      if (status.container && status.collection && !(status.collection instanceof NodeChildren2Collection)) {
        delete status.container;
      }
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      this.loadDependencies(status, options).then(this.fetchPresetProfile.bind(this)).then(CreationUtils.getLinkDocumentConfigurations(status, options), deferred.reject).then(this.openWizard.bind(this)).then(this._performActions.bind(this)).then(function(...args) {
        if (!options.refreshNode) {
          return $.Deferred().resolve(...args).promise();
        } else {
          return CreationUtils.refreshSelection(...args);
        }
      }).done((...args) => {
        deferred.resolve.apply(deferred, args);
        secondaryPromise.resolve.apply(secondaryPromise, args);
      }).fail((...args) => {
        deferred.reject.apply(deferred, args);
        secondaryPromise.reject.apply(secondaryPromise, args);
      }).always(function() {
        delete status.nodeCollection;
      });
      return deferred.promise();
    },
    fetchPresetProfile: function(status, options) {
      var promise = CreationUtils.fetchPresetProfile("import", status, options);
      promise.fail(function(error) {
        this.showGlobalErrorMessage(error);
      }.bind(this));
      return promise;
    },
    loadDependencies: function(status, options) {
      var deferred = $.Deferred();
      require([ "csui/utils/contexts/perspective/perspective.context" ], function(PContext) {
        PerspectiveContext = PContext;
        deferred.resolve(status, options);
      }, deferred.reject);
      return deferred.promise();
    },
    _performAction: function(model, options) {
      var deferred = $.Deferred();
      var nodeList = [];
      if (model.get("state") === "aborted" || model.get("state") === "stopped") {
        if (model.node.fileUploaded) {
          nodeList.push(model.node);
          if (model.node.linkedNodes && model.node.linkedNodes.length > 0) {
            nodeList = nodeList.concat(model.node.linkedNodes);
          }
          CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION).always(function() {
            model.set("count", model.get("total"));
            model.deferred.reject(model);
            deferred.reject();
          });
        } else {
          model.set("count", model.get("total"));
          model.deferred.reject(model);
          deferred.reject();
        }
      } else {
        if (model.node.fileUploaded) {
          nodeList.push(model.node);
          if (model.node.linkDocConfig || model.node.silentLinkDocuments) {
            if (model.node.linkedNodes && model.node.linkedNodes.length > 0) {
              nodeList = nodeList.concat(model.node.linkedNodes);
            }
            CommandHelper.refreshNode(model.node).always(function() {
              CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION, true).always(function() {
                CommandHelper.findValidParentForNode({
                  node: model.node,
                  context: options.context
                }).done(function(validParent) {
                  var modelAttributes = {
                    count: model.get("total"),
                    state: "resolved"
                  };
                  if (validParent !== undefined) {
                    model.node.parent = validParent;
                  } else {
                    model.reEvaluateDoneLink = true;
                    var doneCmd = model.get("doneCommand") || {};
                    doneCmd.signature = "Browse";
                    doneCmd.label = lang.ImportItemDoneCommandLabel;
                    modelAttributes.doneCommand = doneCmd;
                  }
                  model.set(modelAttributes);
                  model.deferred.resolve(model);
                  deferred.resolve(model.node);
                });
              });
            });
          } else {
            CommandHelper.refreshNode(model.node).always(function() {
              CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION, true).always(function() {
                CommandHelper.findValidParentForNode({
                  node: model.node,
                  context: options.context
                }).done(function(validParent) {
                  var modelAttributes = {
                    count: model.get("total"),
                    state: "resolved"
                  };
                  if (validParent !== undefined) {
                    model.node.parent = validParent;
                  } else {
                    model.reEvaluateDoneLink = true;
                    var doneCmd = model.get("doneCommand") || {};
                    doneCmd.signature = "Browse";
                    doneCmd.label = lang.ImportItemDoneCommandLabel;
                    modelAttributes.doneCommand = doneCmd;
                  }
                  model.set(modelAttributes);
                  model.deferred.resolve(model);
                  deferred.resolve(model.node);
                });
              });
            });
          }
        } else {
          CreationUtils.initiateImport(model.node, true, options.mode, options).progress(function(values) {
            if (values && values.done) {
              model.set({
                count: values.done
              });
            }
          }).done(function() {
            CommandHelper.refreshNode(model.node).always(function() {
              model.set({
                count: model.get("total"),
                state: "resolved"
              });
              model.deferred.resolve(model);
              deferred.resolve(model.node);
            });
          }).fail(function(error) {
            var errorDetails;
            if (error.responseText) {
              errorDetails = utils.parseAjaxError(error);
            } else {
              errorDetails = error;
            }
            var commandError = new CommandError(errorDetails, model.node);
            model.set({
              count: model.get("total"),
              state: "rejected"
            });
            model.deferred.reject(model, commandError);
            deferred.reject(commandError);
          });
        }
      }
      return deferred.promise();
    },
    getDoneCommand: function() {
      return {
        signature: RestResources.getD2Options().go_to_location_enabled ? "D2-GoToLocation" : "Browse",
        label: RestResources.getD2Options().go_to_location_enabled ? lang.GoToLocationCommandLabel : lang.ImportItemDoneCommandLabel
      };
    },
    _performActions: function(status, options) {
      var deferred = $.Deferred(), me = this, nodeCollection = status.nodeCollection, sourceCollection = status.collection, connector = status.context && status.context.getObject("connector");
      var filteredCollection = new Backbone.Collection();
      nodeCollection.each(function(node) {
        if (node.attributes.itemState !== constants.ItemStates.INVALID_ENDING) {
          filteredCollection.add(node);
        }
      });
      nodeCollection = filteredCollection;
      if (nodeCollection && nodeCollection.length) {
        var importModels = nodeCollection.map(function(node, index) {
          var total = 1;
          if (node.contentFile && node.contentFile.size) {
            if (node.contentFile.pluginMode === constants.BrowserPluginMode.WSCTF) {
              total = 100;
            } else {
              total = node.contentFile.size;
            }
          }
          return {
            name: node.get("name"),
            mime_type: node.get("mime_type"),
            state: index === 0 ? "processing" : "pending",
            count: 0,
            total: total,
            node: node,
            doneCommand: me.getDoneCommand(),
            commandContainer: status.container,
            context: status.context
          };
        });
        var importCollection = new UploadFileCollection(importModels, {
          connector: connector
        });
        var hasLinkedDocument = false, hasAttachments = false;
        importCollection.each(function(importModel) {
          var node = importModel.get("node");
          importModel.node = node;
          importModel.unset("node");
          if (node && node.linkedNodes && node.linkedNodes.length > 0) {
            hasLinkedDocument = true;
            if (node.qualifiedAsEmail) {
              hasAttachments = true;
            }
          }
        });
        if (!status.suppressD2ProgressBar) {
          if (importCollection.length === 1) {
            importCollection.at(0).set("targetLocation", true);
          }
          this.showProgressMessages(importCollection, hasAttachments, hasLinkedDocument, options, status);
        }
        var newStatus = _.defaults({
          nodes: importCollection
        }, status);
        newStatus.suppressMultipleSuccessMessage = true;
        newStatus.suppressMultipleFailMessage = true;
        NodeCommand.prototype._performActions.call(this, newStatus, options).done(function(results) {
          if (options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
            importCollection.at(0).set("targetLocation", false);
            deferred.resolve(results, nodeCollection, options.progressPanel);
          } else {
            me.addLocalNodesToTopOfCollectionIfInContainer(nodeCollection.models, sourceCollection, status.container, status);
            if (nodeCollection.length === 1) {
              var node = nodeCollection.at(0), inSameContainer = me.isNodeInContainer(node, status.container), getSingleSuccessToastMessage = function() {
                if (inSameContainer) {
                  if (hasAttachments) {
                    return lang.ImportOneItemSuccessMessageAttachments;
                  } else {
                    return hasLinkedDocument ? lang.ImportOneItemSuccessMessageLD : lang.ImportOneItemSuccessMessage;
                  }
                } else {
                  if (hasAttachments) {
                    return lang.ImportOneItemSuccessMessageFolderAttachments;
                  } else {
                    return hasLinkedDocument ? lang.ImportOneItemSuccessMessageFolderLD : lang.ImportOneItemSuccessMessageFolder;
                  }
                }
              }, showSingleSuccessMessageAndResolve = function() {
                var msg = getSingleSuccessToastMessage();
                importCollection.at(0).set("targetLocation", !inSameContainer === false ? undefined : !inSameContainer);
                let parent = node?.fallBackToOverview ? lang.CreateItemSuccessUnknownParentFolder : node.parent.get("name");
                importCollection.at(0).set("resolvedToastMessage", _.str.sformat(msg, node.get("name"), parent));
                deferred.resolve(results);
              };
              if (node.parent && !inSameContainer) {
                CommandHelper.findValidParentForNode({
                  node: node,
                  context: options.context
                }).done(function(validParent) {
                  if (validParent !== undefined) {
                    node.parent = validParent;
                  } else {
                    node.fallBackToOverview = true;
                  }
                  showSingleSuccessMessageAndResolve();
                });
              } else {
                showSingleSuccessMessageAndResolve();
              }
            } else {
              deferred.resolve(results);
            }
          }
        }).fail(function(args) {
          if (options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
            deferred.reject(args);
          } else {
            var successNodes = args && _.filter(args, function(result) {
              return result instanceof NodeModel;
            }) || [];
            if (successNodes.length) {
              me.addLocalNodesToTopOfCollectionIfInContainer(successNodes, sourceCollection, status.container, status);
            }
            importCollection.at(0).set({
              state: "rejected",
              count: importCollection.at(0).get("total")
            });
            deferred.reject(args);
          }
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    isNodeInContainer: function(node, container) {
      var parentIds = node && node.get("i_folder_id") || [];
      return container && node && _.contains(parentIds, container.get("id"));
    },
    addLocalNodesToTopOfCollectionIfInContainer: function(nodes, collection, container, status) {
      var localNodes = [], self = this, promises = [];
      var originatingView = status.originatingView;
      if (originatingView && originatingView.blockActions) {
        originatingView.blockActions();
      }
      var widgetConfig = {};
      if (container && container.get("id") && collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
      }
      _.each(nodes, function(node) {
        var p = $.Deferred();
        promises.push(p);
        if (self.isNodeInContainer(node, container)) {
          CommandHelper.refreshNode(node, widgetConfig).always(function() {
            node.isLocallyCreated = true;
            node.collection = collection;
            localNodes.push(node);
            p.resolve();
          });
        } else {
          p.resolve();
        }
        if (node && node.linkedNodes && node.linkedNodes.length > 0) {
          _.each(node.linkedNodes, function(linkedNode) {
            var ldp = $.Deferred();
            promises.push(ldp);
            if (self.isNodeInContainer(linkedNode, container)) {
              CommandHelper.refreshNode(linkedNode, widgetConfig).always(function() {
                linkedNode.isLocallyCreated = true;
                linkedNode.collection = collection;
                localNodes.push(linkedNode);
                ldp.resolve();
              });
            } else {
              ldp.resolve();
            }
          });
        }
      }.bind(this));
      $.whenAll.apply($, promises).always(function() {
        localNodes.length && collection && collection.unshift(localNodes);
        if (originatingView && originatingView.unblockActions) {
          originatingView.unblockActions();
        }
      });
    },
    showSuccessMessageForSingleNode: function(node, msg, status, showLink) {
      const doneCommand = this.getDoneCommand();
      GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
        showLink: showLink,
        node: node,
        context: status.context,
        successMessageFormat: msg,
        linkLabel: doneCommand.label,
        link_command_signature: doneCommand.signature
      });
    },
    showProgressMessages: function(importCollection, hasAttachments, hasLinkedDocument, options, status) {
      const doneCommand = this.getDoneCommand();
      options.progressPanel = GlobalMessage.showProgressPanel(importCollection, options && options.messageOptions || {
        oneFilePending: lang.ImportingOneItem,
        multiFilePending: lang.ImportingManyItems,
        oneFileSuccess: lang.ImportOneItemSuccessMessage,
        multiFileSuccess: hasAttachments ? lang.ImportManyItemsSuccessMessageAttachments : hasLinkedDocument ? lang.ImportManyItemsSuccessMessageLD : lang.ImportManyItemsSuccessMessage,
        oneFileFailure: lang.ImportOneItemFailMessage,
        multiFileOneFailure: lang.ImportManyItemsOneFailMessage,
        multiFileFailure: lang.ImportManyItemsFailMessage,
        someItemsStopped: lang.ImportStopped,
        gotoLocationLinkLabel: doneCommand.label,
        actionType: "UPLOAD",
        link_command_signature: doneCommand.signature,
        doAutoClose: true,
        commandContainer: status.container,
        configOptions: {
          enhancePanel: importCollection.length > 1
        },
        context: status.context,
        enableCancel: importCollection.length > 1
      });
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
      require([ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/select.type.view", "d2/dialogs/new.file/edit.type.view", "d2/controls/file.uploader/file.uploader.view", "d2/dialogs/new.file/custom.profile.view", "d2/dialogs/new.file/o2.processing.view", "d2/dialogs/new.file/import/import.metadata.properties.view", "d2/dialogs/new.file/upload.processing.view", "d2/dialogs/new.file/link.document/link.document.view", "d2/dialogs/new.file/emails/email.attachments.summary.view", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/models/creation.presets", "d2/models/creation.presets.value.configs", "d2/models/creation.presets.value.config", "csui/utils/commands" ], function(StepperWizard, SelectTypeView, EditTypeView, FileUploaderView, CustomProfileView, O2ProcessingView, ImportMetadataPropertiesView, UploadProcessingView, LinkDocumentView, EmailAttachmentsSummaryView, ProfileCollection, ValueConfigCollection, PresetCollection, PresetConfigCollection, PresetValueConfigModel, commands) {
        var me = this, collection = new Backbone.Collection(), emailCollection = new Backbone.Collection(), linkDocumentCollection = new Backbone.Collection(), profileData = new Backbone.Model(), mode = options.mode || "import", connector = status.context.getObject("connector"), sourceContentNode = this.getSourceContentNode(status), landingPageInheritedNode = this._getLandingPageInheritedNode(status, connector), container = status.container && !nodeConverter.isNonDCTMNode(status.container) ? status.container : undefined, profileCollection = new ProfileCollection(undefined, {
          connector: connector,
          mode: mode,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode
        }), configCollection = new ValueConfigCollection(undefined, {
          connector: connector,
          mode: mode
        }), createTypeScreenHasCustomNameField = true, editPresetProfileCollection = new ProfileCollection(undefined, {
          connector: connector,
          mode: mode,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode
        }), editPresetConfigCollection = new ValueConfigCollection(undefined, {
          connector: connector,
          mode: mode
        }), profileSelected = false, presetCollection = new PresetCollection(undefined, {
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
        }), statusPresetModel = status.presetModel instanceof PresetValueConfigModel ? status.presetModel : undefined;
        profileData.recentProfileCollection = options.recentProfileCollection ? options.recentProfileCollection : recentConfigCollection;
        function updateProfileData(profile, valueConfig, sourceContentNode, doNotCloneProfile) {
          doNotCloneProfile = _.isBoolean(doNotCloneProfile) ? doNotCloneProfile : false;
          var cProfile = doNotCloneProfile ? profile : profile.clone();
          cProfile.set("valueConfig", valueConfig);
          cProfile.set("inherit_content", false);
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
          CreationUtils.mapProfileModelToProfileData(cProfile, profileData);
          CreationUtils.setProfileDataToNodeModels(collection, profileData);
          profileSelected = true;
          return cProfile;
        }
        function getNextStepAfterProfileSelection() {
          if (CreationUtils.isO2Enabled(profileData) && (collection.length && collection.some(function(nodeModel) {
            return !CreationUtils.hasO2Properties(nodeModel);
          }))) {
            return STEPS.PROCESS_O2;
          } else if (CreationUtils.hasPropertyPage(profileData)) {
            return STEPS.PROPERTIES;
          } else if (status.linkedDocumentExist) {
            return STEPS.PROCESS_FILES;
          }
          return STEPS.FINISH;
        }
        function fetchCustomProfileAndRunNextStep(cbError) {
          cbError = _.isFunction(cbError) ? cbError : function(error) {
            me.showGlobalErrorMessage(error);
          };
          profileSelected = false;
          this.options.wizard && this.options.wizard.blockActions();
          profileCollection.ensureFetched().done(function() {
            if (profileCollection.length === 1 && profileCollection.at(0).get("inheritanceHidden")) {
              configCollection.profile = profileCollection.at(0);
              configCollection.ensureFetched().done(function() {
                if (configCollection.length === 1) {
                  updateProfileData(profileCollection.at(0), configCollection.at(0), sourceContentNode);
                }
                this.options.wizard && this.options.wizard.unblockActions();
                this.options.wizard && this.options.wizard.nextStep();
              }.bind(this)).fail(cbError);
            } else {
              this.options.wizard && this.options.wizard.unblockActions();
              this.options.wizard && this.options.wizard.nextStep();
            }
          }.bind(this)).fail(cbError);
        }
        function handleUploadScreenDataFetchFailure(error) {
          me.showGlobalErrorMessage(error);
          this.footerDisabled = true;
          this.options.wizard && this.options.wizard.unblockActions();
          this.options.wizard && this.options.wizard.refreshFooter();
        }
        function fetchCustomProfileAndRunNextStepFromFileUploadScreen() {
          fetchCustomProfileAndRunNextStep.call(this, handleUploadScreenDataFetchFailure.bind(this));
        }
        function fileUploadScreenNextButtonHandler() {
          var commandOptions = options;
          profileSelected = false;
          if (statusPresetModel) {
            var profileInUse = updateProfileData(statusPresetModel.profile, statusPresetModel.valueConfig, statusPresetModel.sourceContent);
            if (commandOptions.ignorePresetEditCheck || !statusPresetModel.isEditable() || profileInUse.get("inheritanceHidden")) {
              this.options.wizard && this.options.wizard.nextStep();
            } else {
              editPresetProfileCollection.reset([ profileInUse ]);
              editPresetProfileCollection.fetched = true;
              editPresetConfigCollection.profile = profileInUse;
              editPresetConfigCollection.reset([ statusPresetModel.valueConfig ]);
              editPresetConfigCollection.fetched = true;
              profileInUse.set("custom_name", statusPresetModel.get("name"));
              this.options.wizard && this.options.wizard.gotoStep(STEPS.EDIT_TYPE);
            }
          } else if (commandOptions.ignorePresetRetreival) {
            if (commandOptions.presetProfilesApplicable !== true) {
              createTypeScreenHasCustomNameField = false;
              delete profileData.recentProfileCollection;
            }
            fetchCustomProfileAndRunNextStepFromFileUploadScreen.call(this);
          } else {
            this.options.wizard && this.options.wizard.blockActions();
            presetCollection.ensureFetched().done(function() {
              if (presetCollection.length) {
                var preset = presetCollection.at(0);
                presetConfigCollection.preset = preset;
                presetConfigCollection.ensureFetched().done(function() {
                  recentConfigCollection.preset = preset;
                  if (presetConfigCollection.length > 0) {
                    if (presetConfigCollection.length === 1 && !presetConfigCollection.at(0).isEditable() && !preset.isCustomAllowed()) {
                      var presetModel = presetConfigCollection.at(0);
                      if (preset.isRecentAllowed()) {
                        recentConfigCollection.ensureFetched().done(function() {
                          if (recentConfigCollection.length === 0) {
                            updateProfileData(presetModel.profile, presetModel.valueConfig, presetModel.sourceContent);
                            this.options.wizard && this.options.wizard.unblockActions();
                            this.options.wizard && this.options.wizard.nextStep();
                          } else {
                            this.options.wizard && this.options.wizard.unblockActions();
                            this.options.wizard && this.options.wizard.gotoStep(STEPS.SELECT_TYPE);
                          }
                        }.bind(this)).fail(handleUploadScreenDataFetchFailure.bind(this));
                      } else {
                        updateProfileData(presetModel.profile, presetModel.valueConfig, presetModel.sourceContent);
                        this.options.wizard && this.options.wizard.unblockActions();
                        this.options.wizard && this.options.wizard.nextStep();
                      }
                    } else {
                      this.options.wizard && this.options.wizard.unblockActions();
                      this.options.wizard && this.options.wizard.gotoStep(STEPS.SELECT_TYPE);
                    }
                  } else {
                    if (preset.isCustomAllowed() || !preset.isRecentAllowed()) {
                      this.options.wizard && this.options.wizard.unblockActions();
                      fetchCustomProfileAndRunNextStepFromFileUploadScreen.call(this);
                    } else {
                      recentConfigCollection.ensureFetched().done(function() {
                        this.options.wizard && this.options.wizard.unblockActions();
                        if (recentConfigCollection.length) {
                          this.options.wizard && this.options.wizard.gotoStep(STEPS.SELECT_TYPE);
                        } else {
                          fetchCustomProfileAndRunNextStepFromFileUploadScreen.call(this);
                        }
                      }.bind(this)).fail(handleUploadScreenDataFetchFailure.bind(this));
                    }
                  }
                }.bind(this)).fail(handleUploadScreenDataFetchFailure.bind(this));
              } else {
                createTypeScreenHasCustomNameField = false;
                delete profileData.recentProfileCollection;
                this.options.wizard && this.options.wizard.unblockActions();
                fetchCustomProfileAndRunNextStepFromFileUploadScreen.call(this);
              }
            }.bind(this)).fail(handleUploadScreenDataFetchFailure.bind(this));
          }
        }
        var isSingleRepoPaste = false;
        if (options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
          isSingleRepoPaste = true;
          var files = [];
          var clipboarddata = options.data;
          _.each(clipboarddata, function(data) {
            var file = {
              id: data.nodeAttributes.id,
              name: data.nodeAttributes.name,
              type: data.nodeAttributes.aContentType
            };
            files.push(file);
          });
          options.files = files;
        }
        var cancelMessage = isSingleRepoPaste ? lang.PasteCancelAlertMessage : lang.ImportCancelAlertMessage;
        var cancelTitle = isSingleRepoPaste ? lang.PasteCancelAlertTitle : lang.ImportCancelAlertTitle;
        var stepOptions = {
          steps: [ {
            id: STEPS.FILE_UPLOAD,
            viewClass: FileUploaderView,
            viewOptions: {
              files: options.files,
              single: options.singleFileUpload,
              fixedFileImport: options.fixedFileImport,
              targetLocation: options.targetLocation,
              fileImportObject: options.fileImportObject
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return profileSelected ? getNextStepAfterProfileSelection() : STEPS.CREATE_TYPE;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.footerDisabled;
              },
              clickHandler: fileUploadScreenNextButtonHandler
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          }, {
            id: STEPS.SELECT_TYPE,
            viewClass: SelectTypeView.extend({
              onActionImportCustom: function() {
                fetchCustomProfileAndRunNextStep.call(this);
              },
              onActionEditPreset: function(preset) {
                if (preset) {
                  var profileInUse = SelectTypeView.prototype.onActionEditPreset.apply(this, arguments);
                  updateProfileData(profileInUse, preset.valueConfig, preset.sourceContent, true);
                  this.wizard && this.wizard.gotoStep(STEPS.EDIT_TYPE);
                }
              }
            }),
            viewOptions: {
              presetCollection: presetCollection,
              presetConfigCollection: presetConfigCollection,
              recentConfigCollection: recentConfigCollection,
              inheritableSourceNode: sourceContentNode,
              editPresetProfileCollection: editPresetProfileCollection,
              editPresetConfigCollection: editPresetConfigCollection
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return profileSelected ? getNextStepAfterProfileSelection() : STEPS.CREATE_TYPE;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.selectedModel;
              },
              clickHandler: function() {
                var view = this, wizard = view.options.wizard, preset = view.selectedModel;
                if (preset) {
                  preset.isEdited = false;
                  updateProfileData(preset.profile, preset.valueConfig, preset.sourceContent);
                  wizard && wizard.nextStep();
                }
              }
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          }, {
            id: STEPS.EDIT_TYPE,
            viewClass: EditTypeView,
            viewOptions: {
              inheritableSourceNode: sourceContentNode,
              profileCollection: editPresetProfileCollection,
              configCollection: editPresetConfigCollection
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return getNextStepAfterProfileSelection();
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.isNextButtonDisabled;
              },
              clickHandler: function() {
                var view = this, wizard = view.options.wizard;
                if (view.validate()) {
                  if (view.profileData.data.presetModel) {
                    view.profileData.data.presetModel.isEdited = view.profileData.data.isEdited;
                  }
                  profileSelected = true;
                  wizard && wizard.nextStep();
                }
              }
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          }, {
            id: STEPS.CREATE_TYPE,
            viewClass: CustomProfileView.extend({
              onStepBeforeActive: function() {
                this.showCustomNameField = createTypeScreenHasCustomNameField;
                return CustomProfileView.prototype.onStepBeforeActive && CustomProfileView.prototype.onStepBeforeActive.apply(this, arguments);
              }
            }),
            title: function() {
              return this.getTitle();
            },
            viewOptions: {
              inheritableSourceNode: sourceContentNode,
              profileCollection: profileCollection,
              configCollection: configCollection
            },
            nextStepId: function() {
              return getNextStepAfterProfileSelection();
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.isNextButtonDisabled;
              },
              clickHandler: function() {
                this.options.wizard.isFileCreationCalledFromIVPublish = options?.fileImportObject;
                if (this.validate()) {
                  CreationUtils.setProfileDataToNodeModels(collection, profileData);
                  this.options.wizard && this.options.wizard.nextStep();
                }
              }
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          }, {
            id: STEPS.PROCESS_O2,
            viewClass: O2ProcessingView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              if (CreationUtils.hasPropertyPage(profileData)) {
                return STEPS.PROPERTIES;
              } else if (status.linkedDocumentExist) {
                return STEPS.PROCESS_FILES;
              }
              return STEPS.FINISH;
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
              hidden: function() {
                return !(status.context instanceof PerspectiveContext);
              },
              label: function() {
                return this.minimizeButtonLabel;
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
              }
            }
          }, {
            id: STEPS.PROPERTIES,
            viewClass: ImportMetadataPropertiesView,
            title: function() {
              return this.getTitle();
            },
            subTitle: function() {
              return this.getSubTitle();
            },
            viewOptions: {
              multiItemSelect: true,
              fullForm: config.fullForm
            },
            nextStepId: function() {
              if (status.linkedDocumentExist) {
                return STEPS.PROCESS_FILES;
              }
              return STEPS.FINISH;
            },
            isPropertyPageType: true,
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
                return this.applyRemainingBtnHidden;
              },
              clickHandler: function() {
                this.applyToRemaining();
              }
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          }, {
            id: STEPS.PROCESS_FILES,
            viewClass: UploadProcessingView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              if (CreationUtils.isEmailFlowApplicable(collection)) {
                emailCollection.reset(CreationUtils.getAcceptableEmailNodes(collection), {
                  silent: true
                });
                return STEPS.ATTACHMENT_SUMMARY;
              } else if (CreationUtils.isLinkDocumentApplicable(collection)) {
                linkDocumentCollection.reset(collection.models, {
                  silent: true
                });
                return STEPS.LINKED_DOC;
              }
              return STEPS.FINISH;
            },
            viewOptions: {
              fixedFileImport: options.fixedFileImport,
              targetLocation: options.targetLocation,
              fileImportObject: options.fileImportObject,
              bearerToken: options.bearerToken
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
              hidden: function() {
                return !(status.context instanceof PerspectiveContext);
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
              }
            }
          }, {
            id: STEPS.ATTACHMENT_SUMMARY,
            viewClass: EmailAttachmentsSummaryView,
            viewOptions: {
              collection: emailCollection,
              isCancellable: false
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              if (CreationUtils.isLinkDocumentApplicable(collection)) {
                linkDocumentCollection.reset(CreationUtils.getNodesExceptEmails(collection), {
                  silent: true
                });
                return STEPS.LINKED_DOC;
              }
              return STEPS.FINISH;
            },
            buttons: [ {
              id: "previous",
              hidden: true
            }, {
              id: "next",
              clickHandler: function() {
                var wizard = this.wizard, createAttachmentCommand = commands.get("D2-CreateEmailAttachments");
                this.options.isCancellable = false;
                if (createAttachmentCommand) {
                  var commandStatus = _.defaults({
                    collection: emailCollection,
                    originatingView: wizard,
                    linkTargetNode: sourceContentNode
                  }, status);
                  createAttachmentCommand.execute(commandStatus).done(function() {
                    if (commandStatus.isCancelled !== true) {
                      wizard && wizard.nextStep();
                    }
                  }).fail(function() {
                    wizard && emailCollection.each(function(emailNode) {
                      wizard.data.linkedNodes[emailNode.get("id")] = _.isArray(emailNode.linkedNodes) ? emailNode.linkedNodes : [];
                    });
                    if (commandStatus.isCancelled === true) {
                      this.options.isCancellable = true;
                      wizard && wizard.cancel();
                    } else {
                      CreationUtils.showErrorAlert(lang.ImportAttachmentFailedErrorAlertTitle, lang.ImportAttachmentFailedErrorAlertMessage, lang.ImportAttachmentFailedErrorAlertOKButtonLabel);
                    }
                  }.bind(this));
                } else {
                  CreationUtils.showErrorAlert(lang.ImportAttachmentFailedErrorAlertTitle, lang.ImportAttachmentFailedErrorAlertMessage, lang.ImportAttachmentFailedErrorAlertOKButtonLabel);
                }
              }
            } ],
            onCancel: function() {
              if (!this.options.isCancellable) {
                return CreationUtils.showConfirmationAlert.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
              }
            }
          }, {
            id: STEPS.LINKED_DOC,
            viewClass: LinkDocumentView,
            viewOptions: {
              collection: linkDocumentCollection
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return STEPS.FINISH;
            },
            buttons: [ {
              id: "previous",
              hidden: true
            }, {
              id: "next",
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                var wizard = this.options.wizard;
                if (wizard && wizard.data && wizard.data.linkedNodes) {
                  var linkedNodes = wizard.data.linkedNodes;
                  if (this.collection && this.collection.length > 0) {
                    this.collection.each(function(node) {
                      var id = node.get("id");
                      if (linkedNodes && linkedNodes[id] && linkedNodes[id].length > 0) {
                        node.linkedNodes = linkedNodes[id];
                      }
                    });
                  }
                }
                wizard.nextStep();
              }
            } ],
            onCancel: function() {
              return CreationUtils.showCancelAlertForImport.call(this, cancelMessage, cancelTitle, lang.ImportCancelAlertButtonLabelYes);
            }
          } ],
          data: {
            collection: collection,
            profileData: profileData,
            context: status.context,
            container: status.container,
            documentCollection: status.collection,
            mode: mode,
            linkedNodes: {},
            suppressD2FailMessage: status.suppressD2FailMessage,
            status: status,
            contentUploadValidator: options.contentUploadValidator
          },
          className: "d2-import-file-wizard" + (options?.importDialogExtraCssClass ? " " + options?.importDialogExtraCssClass : ""),
          size: status?.data?.panelsize || config.dialogSize
        };
        function getLinkDocumentForNode(node, linkedNodesMap) {
          var linkedNodes;
          var id = node.get("id");
          if (linkedNodesMap && linkedNodesMap[id] && linkedNodesMap[id].length > 0) {
            linkedNodes = linkedNodesMap[id];
          }
          return linkedNodes;
        }
        var wizard;
        profileCollection.ensureFetched().done(function() {
          if (profileCollection.length === 0) {
            GlobalMessage.showMessage("error", dndLang.uploadNotPermitted);
            logger.info("Import profile data is empty") && console.log(logger.last);
            logger.info(JSON.stringify(profileCollection)) && console.log(logger.last);
          } else {
            wizard = new StepperWizard(stepOptions).show().on("wizard:closed", function(isCancel) {
              status.isCancelled = isCancel;
              if (!isCancel) {
                status.nodeCollection = collection;
              } else {
                var nodeList = [];
                collection.each(function(nModel) {
                  if (nModel.has("id")) {
                    nodeList.push(nModel);
                  }
                  var linkedNodes = getLinkDocumentForNode(nModel, wizard.data.linkedNodes);
                  if (linkedNodes && linkedNodes.length > 0) {
                    _.each(linkedNodes, function(linkedNode) {
                      if (linkedNode.has("id")) {
                        nodeList.push(linkedNode);
                      }
                    });
                  }
                });
                if (nodeList.length > 0) {
                  CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION);
                }
                deferred.reject(status, options);
              }
              deferred.resolve(status, options);
            }).on("wizard:forceclose", function() {
              var nodeList = [];
              collection.each(function(nModel) {
                if (nModel.has("id")) {
                  nodeList.push(nModel);
                }
                var linkedNodes = getLinkDocumentForNode(nModel, wizard.data.linkedNodes);
                if (linkedNodes && linkedNodes.length > 0) {
                  _.each(linkedNodes, function(linkedNode) {
                    if (linkedNode.has("id")) {
                      nodeList.push(linkedNode);
                    }
                  });
                }
              });
              if (nodeList.length > 0) {
                CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION, false);
              }
              deferred.reject(status, options);
            });
          }
        }.bind(this)).fail(deferred.reject);
      }.bind(this), deferred.reject);
      return deferred.promise();
    },
    getSourceContentNode: CreationUtils.getSourceContentNode,
    _getLandingPageInheritedNode: CreationUtils.getLandingPageInheritedNode
  });
});