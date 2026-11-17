/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "csui/models/command", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "nuc/models/nodes", "csui/models/fileupload", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/utils/commandhelper", "nuc/utils/url", "dctmw/utils/rest.resources", "d2/commands/download", "d2/dialogs/new.file/create/template", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/server.adaptors/converters/node", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/ctf/ctfBridge", "i18n!d2/commands/nls/localized.strings" ], function(module, require, _, $, Backbone, log, CommandModel, NodeModel, NodeChildren2Collection, NodeCollection, FileUploadModel, UploadFileCollection, GlobalMessage, CommandHelper, Url, RestResources, DownloadCommand, Template, NodeCreationSuccessMessageView, nodeConverter, CreationUtils, RestLinkrels, constants, ctfBridge, lang) {
  "use strict";
  var config = _.extend({
    dialogSize: constants.WizardSize.SMALL,
    fullForm: false,
    shouldCloseWizardOnError: true
  }, module.config());
  var logger = log(module.id);
  var DownloadHelper = DownloadCommand.extend({
    getDownloadLink: function(node) {
      const parameters = {
        "event-name": constants.ViewType.O2_EDIT,
        c2_override: true
      };
      let downloadUrl = RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS);
      return downloadUrl ? Url.appendQuery(downloadUrl, Url.combineQueryString(parameters)) : downloadUrl;
    }
  });
  return CommandModel.extend({
    defaults: {
      signature: "D2-CreateFile",
      command_key: "D2-CreateFile",
      name: lang.CommandNameCreateFile,
      scope: "single"
    },
    STEPS: Object.freeze({
      SELECT_TYPE: "select_type",
      EDIT_TYPE: "edit_type",
      CREATE_TYPE: "custom_type",
      PROPERTIES: "properties",
      TEMPLATE: "templates",
      VDOC_TEMPLATE: "vdoc_templates",
      ASYNC_OPERATION: "async_operation",
      LINKED_DOC: "linkeddocreview",
      EDIT_FILE: "edit_file",
      ADD_VERSION: "add_version",
      DOWNLOADING_CONTENT: "downloading_content",
      UPLOADING_CONTENT: "uploading_content"
    }),
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
          return CommandModel.prototype.enabled.call(this, newStatus, options);
        } else {
          console.warn("Container should be defined.");
        }
      } else {
        if (status.nodes && status.nodes.length === 1) {
          var node = CommandHelper.getJustOneNode(status);
          if (node) {
            return CommandModel.prototype.enabled.call(this, status, options);
          }
        }
      }
      return false;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this;
      me.done = false;
      options = options || {};
      if (status.container && status.collection && !(status.collection instanceof NodeChildren2Collection)) {
        delete status.container;
      }
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      me.isLinkedDoc = false;
      me.fetchPresetProfile(status, options).then(me.openWizard.bind(me)).then(CreationUtils.refreshSelection).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    fetchPresetProfile: function(status, options) {
      var promise = CreationUtils.fetchPresetProfile("create", status, options);
      promise.fail(function(error) {
        this.showErrorAndReject(undefined, error);
      }.bind(this));
      return promise;
    },
    createFile: function(nodeModel, templateCollection, status) {
      var me = this;
      var dfd = $.Deferred();
      $.when(CreationUtils.createObject(nodeModel, "create")).then(function() {
        var type = nodeModel.get("type");
        if (type === constants.Types.FOLDER || type === constants.Types.CABINET) {
          me.done = true;
          dfd.resolve(nodeModel);
          return;
        }
        if (me._isContentInherited(nodeModel)) {
          me.editModelOrMoveToNextStep(nodeModel, undefined, status).then(function(nodeModel) {
            dfd.resolve(nodeModel);
          }, function(error) {
            me.showErrorAndReject(nodeModel, error, dfd);
          });
          return;
        }
        $.when(me.fetchTemplates(nodeModel, templateCollection)).then(function(templates) {
          if (templates && templates.length > 0) {
            if (templates.length === 1) {
              var template = templates.at(0);
              if (me._checkSelectedDocTemplateIsVD(template) || me._isVDStructureInherited(nodeModel)) {
                me.editModelOrMoveToNextStep(nodeModel, template, status).then(function(nodeModel) {
                  dfd.resolve(nodeModel);
                }, function(error) {
                  me.showErrorAndReject(nodeModel, error, dfd);
                });
              } else {
                me.editNodeModel(nodeModel, template).then(function() {
                  dfd.resolve(nodeModel);
                }, function(error) {
                  me.showErrorAndReject(nodeModel, error, dfd);
                });
              }
            } else {
              me.stepId = me.STEPS.TEMPLATE;
              dfd.resolve(nodeModel);
            }
          } else {
            var vdStructureInheritedId = me._getVdocStructureInheritedId(nodeModel);
            if (!me.isLinkedDoc && vdStructureInheritedId && nodeModel.get("r_is_virtual_doc") !== 1) {
              me.fetchVdocTemplates(vdStructureInheritedId, nodeModel.connector).then(function(vdocTemplates) {
                if (vdocTemplates && vdocTemplates.length > 0) {
                  if (vdocTemplates.length === 1) {
                    me.setVdocTemplateForNode(nodeModel, vdocTemplates.at(0), status).then(function() {
                      if (nodeModel.asyncURL && (status.linkedDocumentExist || CreationUtils.canEditContent(nodeModel.profileData))) {
                        me.done = false;
                        me.stepId = me.STEPS.ASYNC_OPERATION;
                        dfd.resolve(nodeModel);
                      } else if (nodeModel.asyncURL) {
                        me.done = true;
                        dfd.resolve(nodeModel);
                      } else if (CreationUtils.canEditContent(nodeModel.profileData)) {
                        me.done = false;
                        me.stepId = me.STEPS.EDIT_FILE;
                      } else {
                        dfd.resolve(nodeModel);
                      }
                    }, function(error) {
                      dfd.reject(error);
                    });
                  } else {
                    me.stepId = me.STEPS.VDOC_TEMPLATE;
                    nodeModel.vdocTemplates = vdocTemplates;
                    dfd.resolve(nodeModel);
                  }
                } else {
                  dfd.reject(lang.vdocTemplateNotConfigured);
                }
              }, function(error) {
                dfd.reject(error);
              });
            } else {
              me.checkLinkedDocumentConfig(nodeModel).then(function(nodeModel) {
                dfd.resolve(nodeModel);
              }, function(error) {
                me.showErrorAndReject(nodeModel, error, dfd);
              });
            }
          }
        }, function(error) {
          me.showErrorAndReject(nodeModel, error, dfd);
        });
      }, function(error) {
        me.showErrorAndReject(nodeModel, error, dfd);
      });
      return dfd.promise();
    },
    fetchLinkedDocumentConfig: function(node) {
      var dfd = $.Deferred(), me = this;
      me._announceOperationStart(me.wizard);
      CreationUtils.getLinkDocumentRelations(node).done(function(data) {
        var linkDocumentRelationsConfig = CreationUtils.getLinkDocumentRelationsConfig(data);
        if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0 || linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
          var nodeLinks = node.get("links");
          CommandHelper.refreshNode(node).done(function() {
            nodeLinks = _.uniq(_.union(nodeLinks, node.get("links")), "rel");
            node.set("links", nodeLinks, {
              silent: true
            });
            if (linkDocumentRelationsConfig.groupLinkDocumentRelations && linkDocumentRelationsConfig.groupLinkDocumentRelations.length > 0) {
              me.done = false;
              me.stepId = me.STEPS.LINKED_DOC;
              node.linkDocConfig = linkDocumentRelationsConfig.groupLinkDocumentRelations;
            } else if (CreationUtils.canEditContent(node.profileData)) {
              me.stepId = me.STEPS.EDIT_FILE;
            } else {
              me.done = true;
            }
            if (linkDocumentRelationsConfig.silentLinkDocuments && linkDocumentRelationsConfig.silentLinkDocuments.length > 0) {
              node.silentLinkDocuments = linkDocumentRelationsConfig.silentLinkDocuments;
              CreationUtils.createLinkDocumentAsSilent(node).done(function(nodeList) {
                me.wizard.data.linkedNodes[node.get("id")] = nodeList;
                node.linkedNodes = nodeList;
                me.done = me.done && true;
                me._announceOperationEnd(me.wizard);
                dfd.resolve();
              }).fail(function(error) {
                me._announceOperationEnd(me.wizard);
                dfd.reject(error);
              });
            } else {
              me._announceOperationEnd(me.wizard);
              dfd.resolve();
            }
          }).fail(function(error) {
            me._announceOperationEnd(me.wizard);
            dfd.reject(error);
          });
        } else if (CreationUtils.canEditContent(node.profileData)) {
          me._announceOperationEnd(me.wizard);
          me.stepId = me.STEPS.EDIT_FILE;
          dfd.resolve();
        } else {
          me._announceOperationEnd(me.wizard);
          me.done = true;
          dfd.resolve();
        }
      }).fail(function(error) {
        me._announceOperationEnd(me.wizard);
        dfd.reject(error);
      });
      return dfd.promise();
    },
    fetchTemplates: function(nodeModel, templateCollection) {
      var dfd = $.Deferred();
      if (nodeModel.templateInfo) {
        var templateProp = {};
        if (nodeModel.templateInfo["preset_profile_value_config_id"]) {
          templateProp["preset_profile_value_config_id"] = nodeModel.templateInfo["preset_profile_value_config_id"];
        }
        if (nodeModel.templateInfo.templatedId && nodeModel.templateInfo.templateUrl) {
          $.ajax(nodeModel.connector.extendAjaxOptions({
            url: nodeModel.templateInfo.templateUrl,
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            success: function(response) {
              var nodeProp = nodeConverter.convertNode(response);
              templateProp["id"] = nodeModel.templateInfo.templatedId;
              if (nodeProp["r_is_virtual_doc"] === 1) {
                templateProp["a_content_type"] = "vd";
              }
              templateCollection.add(new Template(templateProp));
              dfd.resolve(templateCollection);
            },
            error: function(request) {
              dfd.reject(request);
            }
          }));
        } else {
          templateProp["id"] = "";
          templateCollection.add(new Template(templateProp));
          dfd.resolve(templateCollection);
        }
      } else {
        templateCollection.setLimit(0, 20, false);
        templateCollection.fetch({
          reload: true
        }).then(function() {
          dfd.resolve(templateCollection);
        }, function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    editModelOrMoveToNextStep: function(nodeModel, template, status) {
      var me = this, dfd = $.Deferred(), vdStructureInheritedId = me._getVdocStructureInheritedId(nodeModel, template);
      me.selectedDocTemplate = template;
      if (!me.isLinkedDoc && vdStructureInheritedId && nodeModel.get("r_is_virtual_doc") !== 1) {
        me.fetchVdocTemplates(vdStructureInheritedId, nodeModel.connector).then(function(vdocTemplates) {
          if (vdocTemplates && vdocTemplates.length > 0) {
            if (vdocTemplates.length === 1) {
              me.editNodeModel(nodeModel, template, vdocTemplates.at(0), status).then(function() {
                dfd.resolve(nodeModel);
              }, function(error) {
                dfd.reject(error);
              });
            } else {
              me.stepId = me.STEPS.VDOC_TEMPLATE;
              nodeModel.vdocTemplates = vdocTemplates;
              dfd.resolve(nodeModel);
            }
          } else {
            dfd.reject(lang.vdocTemplateNotConfigured);
          }
        }, function(error) {
          dfd.reject(error);
        });
      } else {
        me.editNodeModel(nodeModel, template).then(function() {
          dfd.resolve(nodeModel);
        }, function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    fetchVdocTemplates: function(inheritedId, connector) {
      var dfd = $.Deferred();
      require([ "d2/dialogs/new.file/create/vdoc.templates" ], function(VdocTemplatesCollection) {
        var vdocTemplatesCollection = new VdocTemplatesCollection(undefined, {
          connector: connector,
          inheritedId: inheritedId,
          orderBy: "name asc",
          autoreset: true
        });
        vdocTemplatesCollection.fetch().then(function() {
          dfd.resolve(vdocTemplatesCollection);
        }, function(error) {
          dfd.reject(error);
        });
      });
      return dfd.promise();
    },
    editNodeModel: function(nodeModel, template, vdocTemplate, status) {
      var me = this;
      var dfd = $.Deferred();
      var editURL = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.D2_SET_TEMPLATE), templateId = template && template.get("id") || "", payload = {};
      if (templateId) {
        payload["template-id"] = templateId;
      }
      if (editURL) {
        var queryParams = {};
        if (nodeModel.profileData && nodeModel.profileData.data.get("link-id")) {
          queryParams["link-id"] = nodeModel.profileData.data.get("link-id");
        }
        if (template && template.get("preset_profile_value_config_id")) {
          queryParams["preset-profile-value-config-id"] = template.get("preset_profile_value_config_id");
        }
        editURL = Url.appendQuery(editURL, Url.combineQueryString(queryParams));
      }
      if (!editURL) {
        GlobalMessage.showMessage("error", lang.MissingTemplateLinkrel);
        dfd.reject(lang.MissingTemplateLinkrel);
        return;
      }
      $.ajax(nodeModel.connector.extendAjaxOptions({
        url: editURL,
        type: "PATCH",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(payload),
        success: function() {
          if (vdocTemplate) {
            me.setVdocTemplateForNode(nodeModel, vdocTemplate, status).then(function(nodeModel) {
              if (!nodeModel.asyncURL) {
                me.checkLinkedDocumentConfig(nodeModel).then(function(nodeModel) {
                  dfd.resolve(nodeModel);
                }, function(error) {
                  dfd.reject(error);
                });
              } else {
                if (status.linkedDocumentExist || CreationUtils.canEditContent(nodeModel.profileData)) {
                  me.done = false;
                  me.stepId = me.STEPS.ASYNC_OPERATION;
                  dfd.resolve(nodeModel);
                } else {
                  me.done = true;
                  dfd.resolve(nodeModel);
                }
              }
            }, function(error) {
              dfd.reject(error);
            });
          } else {
            me.checkLinkedDocumentConfig(nodeModel).then(function(nodeModel) {
              dfd.resolve(nodeModel);
            }, function(error) {
              dfd.reject(error);
            });
          }
        },
        error: function(request) {
          dfd.reject(request);
        }
      }));
      return dfd.promise();
    },
    checkLinkedDocumentConfig: function(nodeModel) {
      var dfd = $.Deferred();
      if (this.isLinkedDoc === true) {
        if (CreationUtils.canEditContent(nodeModel.profileData)) {
          this.done = false;
          this.stepId = this.STEPS.EDIT_FILE;
        } else {
          this.done = true;
        }
        dfd.resolve(nodeModel);
      } else {
        this.fetchLinkedDocumentConfig(nodeModel).done(function() {
          dfd.resolve(nodeModel);
        }).fail(function(error) {
          dfd.reject(_.isArray(error) ? error[0] : error);
        });
      }
      return dfd.promise();
    },
    setVdocTemplateForNode: function(nodeModel, vdocTemplate, status) {
      var me = this, dfd = $.Deferred();
      var inheritedId = me._getVdocStructureInheritedId(nodeModel, me.selectedDocTemplate);
      if (vdocTemplate && vdocTemplate.get("id") && inheritedId) {
        var url = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.ADD_VIRTUAL_DOCUMENT_NODES);
        if (!url) {
          dfd.reject(lang.MissingVDocTemplateLinkrel);
          return dfd.promise();
        }
        var urlParam = {
          "inherited-id": inheritedId,
          "vd-template-id": vdocTemplate.get("id"),
          "track-async-operation": true
        };
        url = Url.appendQuery(url, Url.combineQueryString(urlParam));
        $.ajax(nodeModel.connector.extendAjaxOptions({
          url: url,
          type: "POST",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            var asyncObjectUrl = RestLinkrels.getLink(response.links, RestLinkrels.ASYNC_OPERATION);
            if (asyncObjectUrl) {
              nodeModel.asyncURL = asyncObjectUrl;
              if (me.isLinkedDoc !== true) {
                CreationUtils.getLinkDocumentConfigurations(status).then(function() {
                  dfd.resolve(nodeModel);
                }, function(error) {
                  dfd.reject(error);
                });
              } else {
                dfd.resolve(nodeModel);
              }
            } else {
              dfd.resolve(nodeModel);
            }
          },
          error: function(request) {
            dfd.reject(request);
          }
        }));
      } else {
        dfd.reject(lang.MissingVDocTemplateLinkrel);
      }
      return dfd.promise();
    },
    onCancel: function() {
      return CreationUtils.showCancelAlertForImport.call(this, lang.CreateCancelAlertMessage, "", lang.CreateCancelAlertButtonLabelYes, true);
    },
    openWizard: function(status, options) {
      var deferred = $.Deferred(), action = this, mode = "create", connector = status.context.getObject("connector"), sourceContentNode = this._getSourceContentNode(status), landingPageInheritedNode = this._getLandingPageInheritedNode(status, connector), node = new NodeModel(undefined, {
        context: status.context,
        connector: connector
      });
      require([ "csui/utils/contexts/perspective/perspective.context", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/new.file/select.type.view", "d2/dialogs/new.file/edit.type.view", "d2/dialogs/new.file/custom.profile.view", "d2/dialogs/new.file/create/create.metadata.propertypage.view", "d2/dialogs/new.file/create/create.select.template.view", "d2/dialogs/new.file/create/create.select.vdoc.template.view", "d2/dialogs/new.file/link.document/link.document.view", "d2/dialogs/new.file/vdoc.async.view", "d2/dialogs/new.file/edit/create.add.version.view", "d2/dialogs/new.file/edit/edit.content.view", "d2/dialogs/new.file/edit/created.content.processing.view", "d2/dialogs/new.file/create/templates", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/models/creation.presets", "d2/models/creation.presets.value.configs", "d2/models/creation.presets.value.config" ], function(PerspectiveContext, StepperWizard, SelectTypeView, EditTypeView, CustomProfileView, MetadataPropertiesView, TemplatesView, VdocTemplateView, LinkDocumentView, VDOCAsyncView, CreateAddVersionView, EditContentView, CreatedContentProcessingView, TemplatesCollection, ProfileCollection, ValueConfigCollection, PresetCollection, PresetConfigCollection, PresetValueConfigModel) {
        var templatesCollection = new TemplatesCollection(undefined, {
          connector: connector,
          node: node,
          orderBy: "name asc"
        }), profileCollection = new ProfileCollection(undefined, {
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
        }), profileData = new Backbone.Model(), subTitle = "", presetCollection = new PresetCollection(undefined, {
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
        }), statusPresetModel = status.presetModel instanceof PresetValueConfigModel ? status.presetModel : undefined, dlHelper = new DownloadHelper();
        profileData.recentProfileCollection = options.recentProfileCollection ? options.recentProfileCollection : recentConfigCollection;
        if (action.isLinkedDoc) {
          subTitle = status.parentNode.get("name");
          profileCollection.add(status.profile);
          profileCollection.fetched = true;
        }
        profileData.on("change", function() {
          action.profileDataChanged = true;
          action.selectedDocTemplate && delete action.selectedDocTemplate;
        });
        function showWizard(stepPage) {
          action.wizard.show(stepPage).on("wizard:closed", function(isCancel, arg) {
            status.results = arg;
            status.isCancelled = isCancel;
            if (node.contentCreatedBeforeEdit === true) {
              if (status.wizardClosed !== true) {
                status.wizardClosed = true;
                action.showSuccessAndClose(node, status, action.wizard);
                deferred.resolve(status, options);
              }
            } else if (!isCancel && arg && arg.success === true) {
              deferred.resolve(status, options);
            } else {
              var nodeList = action._getCreatedNodes(node, status, action.wizard);
              CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION);
              deferred.reject(status, options);
            }
          }).on("wizard:forceclose", function() {
            if (node.contentCreatedBeforeEdit === true) {
              return;
            }
            var nodeList = action._getCreatedNodes(node, status, action.wizard);
            CreationUtils.finishCreateOperation(nodeList, RestLinkrels.ABORT_ACTION, false);
            deferred.reject(status, options);
          });
        }
        function createObjectAndNext(wizard) {
          action._announceOperationStart(wizard, status);
          action.createFile(node, templatesCollection, status).then(function() {
            if (action.done === true) {
              action.showSuccessAndClose(node, status, wizard);
            } else {
              action._announceOperationEnd(wizard, status);
              wizard.nextStep();
            }
          }, function(error) {
            action._announceOperationEnd(wizard, status);
            config.shouldCloseWizardOnError && wizard.close({
              success: false,
              error: error
            });
          });
        }
        function handleDataFetchFailure(error) {
          action._announceOperationEnd(undefined, status);
          action.showErrorAndReject(undefined, error, deferred);
        }
        function updateProfileDataAndAttachToNodeModel(profile, valueConfig, sourceContentNode, doNotCloneProfile, preset) {
          doNotCloneProfile = _.isBoolean(doNotCloneProfile) ? doNotCloneProfile : false;
          var cProfile = doNotCloneProfile ? profile : profile.clone();
          cProfile.set("valueConfig", valueConfig);
          if (action.isLinkedDoc || !sourceContentNode || sourceContentNode.get("container")) {
            cProfile.set("inherit_content", false);
          }
          if (action.isLinkedDoc || !sourceContentNode || sourceContentNode.get("r_is_virtual_doc") !== 1) {
            cProfile.set("inherit_vd_structure", false);
          }
          if (sourceContentNode && (!landingPageInheritedNode || landingPageInheritedNode.get("id") !== sourceContentNode.get("id"))) {
            cProfile.set({
              "inherited-id": sourceContentNode.get("id")
            });
          } else {
            cProfile.set({
              "inherited-id": ""
            });
          }
          if (status.container && !nodeConverter.isNonDCTMNode(status.container)) {
            cProfile.set({
              "link-id": status.container.get("id")
            });
          }
          CreationUtils.mapProfileModelToProfileData(cProfile, profileData);
          node.profileData = profileData;
          node.templateInfo = undefined;
          if (preset) {
            if (preset.get("contentless-object-allowed") === true) {
              node.templateInfo = {
                contentLess: true,
                preset_profile_value_config_id: preset.get("id")
              };
            } else if (preset.get("template-id")) {
              node.templateInfo = {
                templatedId: preset.get("template-id"),
                preset_profile_value_config_id: preset.get("id")
              };
              var url = RestLinkrels.getLink(preset.get("links"), RestLinkrels.D2_DOCUMENT_TEMPLATE);
              if (url) {
                node.templateInfo["templateUrl"] = url;
              }
            }
          }
          return cProfile;
        }
        function decideAndRunStepAfterImplicitProfileSelection(deferred, wizard) {
          action._announceOperationStart(wizard, status);
          if (CreationUtils.hasPropertyPage(profileData)) {
            action._announceOperationEnd(wizard, status);
            if (wizard) {
              wizard.gotoStep(action.STEPS.PROPERTIES);
            } else {
              showWizard(action.STEPS.PROPERTIES);
            }
          } else {
            action.createFile(node, templatesCollection, status).then(function() {
              if (action.done === true) {
                action.showSuccessAndClose(node, status);
                deferred && deferred.resolve();
              } else {
                action._announceOperationEnd(wizard, status);
                if (wizard) {
                  wizard.gotoStep(action.stepId);
                } else {
                  showWizard(action.stepId);
                }
              }
            }, function(error) {
              action._announceOperationEnd(wizard, status);
              deferred && deferred.reject(error);
            });
          }
        }
        function fetchProfileAndRunStep(deferred, wizard) {
          action._announceOperationStart(wizard, status);
          profileCollection.ensureFetched().then(function() {
            if (profileCollection.length === 1 && profileCollection.at(0).get("inheritanceHidden")) {
              configCollection.profile = profileCollection.at(0);
              configCollection.fetch().then(function() {
                if (configCollection.length === 1) {
                  updateProfileDataAndAttachToNodeModel(profileCollection.at(0), configCollection.at(0), sourceContentNode);
                  action._announceOperationEnd(wizard, status);
                  decideAndRunStepAfterImplicitProfileSelection(deferred, wizard);
                } else {
                  action._announceOperationEnd(wizard, status);
                  if (wizard) {
                    wizard.gotoStep(action.STEPS.CREATE_TYPE);
                  } else {
                    showWizard(action.STEPS.CREATE_TYPE);
                  }
                }
              }, function(error) {
                action._announceOperationEnd(wizard, status);
                action.showErrorAndReject(undefined, error, deferred);
              });
            } else {
              action._announceOperationEnd(wizard, status);
              if (wizard) {
                wizard.gotoStep(action.STEPS.CREATE_TYPE);
              } else {
                showWizard(action.STEPS.CREATE_TYPE);
              }
            }
          }, handleDataFetchFailure);
        }
        function deleteCreatedNode(callback) {
          if (node._tokenId) {
            CreationUtils.finishCreateOperation([ node ], RestLinkrels.ABORT_ACTION).always(function() {
              node.clear({
                silent: true
              });
              templatesCollection.reset();
              _.isFunction(callback) && callback();
            });
          } else {
            _.isFunction(callback) && callback();
          }
        }
        function handleNextButtonClickAfterProfileSelection(wizard) {
          var onNext = function() {
            if (!CreationUtils.hasPropertyPage(profileData)) {
              createObjectAndNext(wizard);
            } else {
              wizard && wizard.nextStep();
            }
          };
          var tokenId = node._tokenId;
          if (action.profileDataChanged === true) {
            action.profileDataChanged = false;
            node.profileData = _.clone(profileData);
            node.trigger("refresh:form:model");
            if (tokenId) {
              deleteCreatedNode(onNext);
              return;
            } else {
              if (node.has("properties")) {
                node.unset("properties");
              }
            }
          }
          onNext();
        }
        var stepOptions = {
          steps: [ {
            id: action.STEPS.SELECT_TYPE,
            viewClass: SelectTypeView.extend({
              onActionCreateCustom: function() {
                var wizard = this.wizard;
                deleteCreatedNode(function() {
                  fetchProfileAndRunStep(deferred, wizard);
                });
              },
              onActionEditPreset: function(preset) {
                if (preset) {
                  var profileInUse = SelectTypeView.prototype.onActionEditPreset.apply(this, arguments);
                  updateProfileDataAndAttachToNodeModel(profileInUse, preset.valueConfig, preset.sourceContent, true, preset);
                  this.wizard && this.wizard.gotoStep(action.STEPS.EDIT_TYPE);
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
              if (!CreationUtils.hasPropertyPage(profileData)) {
                return action.stepId;
              }
              return action.STEPS.PROPERTIES;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return !this.selectedModel;
              },
              clickHandler: function() {
                var view = this, wizard = view.wizard, preset = view.selectedModel;
                if (preset) {
                  preset.isEdited = false;
                  updateProfileDataAndAttachToNodeModel(preset.profile, preset.valueConfig, preset.sourceContent, undefined, preset);
                  handleNextButtonClickAfterProfileSelection(wizard);
                }
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.EDIT_TYPE,
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
              if (!this.hasPropertyPage()) {
                return action.stepId;
              }
              return action.STEPS.PROPERTIES;
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
                  handleNextButtonClickAfterProfileSelection(wizard);
                }
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.CREATE_TYPE,
            viewClass: CustomProfileView.extend({
              onStepBeforeActive: function() {
                this.showCustomNameField = createTypeScreenHasCustomNameField;
                return CustomProfileView.prototype.onStepBeforeActive && CustomProfileView.prototype.onStepBeforeActive.apply(this, arguments);
              }
            }),
            title: function() {
              return this.getTitle();
            },
            subTitle: subTitle,
            viewOptions: {
              inheritableSourceNode: sourceContentNode,
              profileCollection: profileCollection,
              configCollection: configCollection
            },
            nextStepId: function() {
              if (!this.hasPropertyPage()) {
                return action.stepId;
              }
              return action.STEPS.PROPERTIES;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.isNextButtonDisabled;
              },
              clickHandler: function() {
                var view = this, wizard = view.options.wizard;
                if (view.validate()) {
                  handleNextButtonClickAfterProfileSelection(wizard);
                }
                node.templateInfo = undefined;
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.PROPERTIES,
            viewClass: MetadataPropertiesView,
            title: function() {
              return this.getTitle();
            },
            subTitle: subTitle,
            viewOptions: {
              action: mode,
              formMode: mode,
              operationType: mode
            },
            nextStepId: function() {
              return action.stepId;
            },
            isPropertyPageType: true,
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                var view = this, wizard = view.parent;
                view.validate().done(function(isValid) {
                  if (isValid) {
                    if (view.updateModelData) {
                      view.updateModelData(config.fullForm);
                    }
                    var tokenId = node._tokenId;
                    if (tokenId) {
                      if (!_.isEmpty(node._changedFormValuesMap.properties)) {
                        CreationUtils.finishCreateOperation([ node ], RestLinkrels.ABORT_ACTION).then(function() {
                          node.clear({
                            silent: true
                          });
                          templatesCollection.reset();
                          view.updateModelData(config.fullForm);
                          createObjectAndNext(wizard);
                        }, function() {});
                      } else {
                        wizard.nextStep();
                      }
                    } else {
                      createObjectAndNext(wizard);
                    }
                  }
                });
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.TEMPLATE,
            viewClass: TemplatesView,
            title: function() {
              return this.getTitle();
            },
            subTitle: subTitle,
            viewOptions: {
              templates: templatesCollection
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                var view = this, wizard = view.options.wizard;
                action._announceOperationStart(wizard, status);
                if (view.validate()) {
                  if (action._checkSelectedDocTemplateIsVD(view._template) || action._isVDStructureInherited(node)) {
                    action.editModelOrMoveToNextStep(node, view._template, status).then(function() {
                      if (action.done === true) {
                        action.showSuccessAndClose(node, status, wizard);
                      } else {
                        action._announceOperationEnd(wizard, status);
                        wizard.gotoStep(action.stepId);
                      }
                    }, function(error) {
                      action.showErrorAndReject(node, error);
                      wizard.close({
                        success: false,
                        error: error
                      });
                    });
                  } else {
                    action.editNodeModel(node, view._template).then(function() {
                      if (action.done === true) {
                        action.showSuccessAndClose(node, status, wizard);
                      } else {
                        action._announceOperationEnd(wizard, status);
                        wizard.gotoStep(action.stepId);
                      }
                    }, function(error) {
                      action.showErrorAndReject(node, error);
                      wizard.close({
                        success: false,
                        error: error
                      });
                    });
                  }
                }
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.VDOC_TEMPLATE,
            viewClass: VdocTemplateView,
            title: function() {
              return this.getTitle();
            },
            subTitle: subTitle,
            viewOptions: {
              templates: templatesCollection
            },
            nextStepId: function() {
              return action.stepId;
            },
            buttons: [ {
              id: "next",
              disabled: function() {
                return this.nextButtonDisabled;
              },
              clickHandler: function() {
                var view = this, wizard = view.options.wizard;
                action._announceOperationStart(wizard, status);
                if (view.validate()) {
                  action.editNodeModel(node, action.selectedDocTemplate, view._vdocTemplate, status).then(function() {
                    if (action.done === true) {
                      action.showSuccessAndClose(node, status, wizard);
                    } else {
                      action._announceOperationEnd(wizard, status);
                      wizard.nextStep();
                    }
                  }, function(error) {
                    action.showErrorAndReject(node, error);
                    wizard.close({
                      success: false,
                      error: error
                    });
                    action._announceOperationEnd(wizard, status);
                  });
                }
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.ASYNC_OPERATION,
            viewClass: VDOCAsyncView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              if (node.linkDocConfig) {
                return action.STEPS.LINKED_DOC;
              } else if (CreationUtils.canEditContent(node.profileData)) {
                return action.STEPS.EDIT_FILE;
              }
              action.showSuccessAndClose(node, status, this.options.wizard);
              return "";
            },
            viewOptions: {},
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
                return action.isLinkedDoc || !(status.context instanceof PerspectiveContext && this.options.wizard.isMinimizable());
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return action.onCancel();
              }
            }
          }, {
            id: action.STEPS.LINKED_DOC,
            viewClass: LinkDocumentView,
            title: function() {
              return this.getTitle();
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
                var view = this, wizard = view.options.wizard;
                if (CreationUtils.canEditContent(node.profileData)) {
                  wizard.gotoStep(action.STEPS.EDIT_FILE);
                } else {
                  action.showSuccessAndClose(node, status, wizard);
                }
              }
            } ],
            onCancel: function() {
              return action.onCancel();
            }
          }, {
            id: action.STEPS.EDIT_FILE,
            viewClass: EditContentView,
            viewOptions: {
              action: action,
              status: status,
              downloadHelper: dlHelper
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return this.getNextStep();
            },
            buttons: [ {
              id: "previous",
              hidden: true
            }, {
              id: "next",
              hidden: true
            }, {
              id: "cancel",
              label: function() {
                return this.getCancelLabel();
              }
            }, {
              id: "Edit",
              isPrimary: true,
              disabled: function() {
                return this.isEditButtonDisabled;
              },
              label: function() {
                return this.getEditButtonLabel();
              },
              clickHandler: function() {
                this.onClickEditNow();
              }
            } ]
          }, {
            id: action.STEPS.DOWNLOADING_CONTENT,
            viewClass: CreatedContentProcessingView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return action.STEPS.ADD_VERSION;
            },
            viewOptions: {
              action: action,
              status: status,
              downloadHelper: dlHelper,
              mode: "DOWNLOAD"
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
                return action.isLinkedDoc || !(status.context instanceof PerspectiveContext && this.options.wizard.isMinimizable());
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return action.onCancel();
              }
            }
          }, {
            id: action.STEPS.ADD_VERSION,
            viewClass: CreateAddVersionView,
            viewOptions: {
              action: action,
              status: status,
              downloadHelper: dlHelper
            },
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return this.getNextStep();
            },
            buttons: [ {
              id: "previous",
              hidden: true
            }, {
              id: "next",
              hidden: true
            }, {
              id: "cancel",
              label: function() {
                return this.getCancelLabel();
              }
            }, {
              id: "Upload",
              isPrimary: true,
              label: function() {
                return this.getUploadButtonLabel();
              },
              clickHandler: function() {
                this.onClickAddVersionNow();
              }
            } ]
          }, {
            id: action.STEPS.UPLOADING_CONTENT,
            viewClass: CreatedContentProcessingView,
            transient: true,
            title: function() {
              return this.getTitle();
            },
            nextStepId: function() {
              return this.getNextStepId();
            },
            viewOptions: {
              action: action,
              status: status,
              downloadHelper: dlHelper,
              mode: "UPLOAD"
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
                return action.isLinkedDoc || !(status.context instanceof PerspectiveContext && this.options.wizard.isMinimizable());
              },
              clickHandler: function() {
                this.minimize();
              }
            } ],
            onCancel: function() {
              if (!this.isCancellable()) {
                return action.onCancel();
              }
            }
          } ],
          data: {
            profileData: profileData,
            node: node,
            context: status.context,
            container: status.container,
            mode: mode,
            isLinkedDoc: action.isLinkedDoc,
            linkedNodes: {},
            checkinData: {}
          },
          className: "d2-create-file-wizard",
          size: status?.data?.panelsize || config.dialogSize
        };
        profileCollection.ensureFetched().done(function() {
          if (profileCollection.length === 0) {
            GlobalMessage.showMessage("error", lang.addNotPermitted);
            logger.info("Create profile data is empty") && console.log(logger.last);
            logger.info(JSON.stringify(profileCollection)) && console.log(logger.last);
          } else {
            action.wizard = new StepperWizard(stepOptions);
            if (action.isLinkedDoc || options.ignorePresetRetreival) {
              if (options.presetProfilesApplicable !== true) {
                createTypeScreenHasCustomNameField = false;
                delete profileData.recentProfileCollection;
              }
              fetchProfileAndRunStep(deferred);
            } else {
              if (statusPresetModel) {
                var profileInUse = updateProfileDataAndAttachToNodeModel(statusPresetModel.profile, statusPresetModel.valueConfig, statusPresetModel.sourceContent, undefined, statusPresetModel);
                if (options.ignorePresetEditCheck || !statusPresetModel.isEditable() || profileInUse.get("inheritanceHidden")) {
                  decideAndRunStepAfterImplicitProfileSelection(deferred);
                } else {
                  editPresetProfileCollection.reset([ profileInUse ]);
                  editPresetProfileCollection.fetched = true;
                  editPresetConfigCollection.profile = profileInUse;
                  editPresetConfigCollection.reset([ statusPresetModel.valueConfig ]);
                  editPresetConfigCollection.fetched = true;
                  profileInUse.set("custom_name", statusPresetModel.get("name"));
                  showWizard(action.STEPS.EDIT_TYPE);
                }
              } else {
                action._announceOperationStart(undefined, status);
                presetCollection.fetch().done(function() {
                  if (presetCollection.length) {
                    var preset = presetCollection.at(0);
                    presetConfigCollection.preset = preset;
                    presetConfigCollection.fetch().done(function() {
                      recentConfigCollection.preset = preset;
                      if (presetConfigCollection.length > 0) {
                        if (presetConfigCollection.length === 1 && !presetConfigCollection.at(0).isEditable() && !preset.isCustomAllowed()) {
                          var presetModel = presetConfigCollection.at(0);
                          if (preset.isRecentAllowed()) {
                            recentConfigCollection.fetch().done(function() {
                              if (recentConfigCollection.length === 0) {
                                updateProfileDataAndAttachToNodeModel(presetModel.profile, presetModel.valueConfig, presetModel.sourceContent, undefined, presetModel);
                                action._announceOperationEnd(undefined, status);
                                decideAndRunStepAfterImplicitProfileSelection(deferred);
                              } else {
                                action._announceOperationEnd(undefined, status);
                                showWizard(action.STEPS.SELECT_TYPE);
                              }
                            }).fail(handleDataFetchFailure);
                          } else {
                            updateProfileDataAndAttachToNodeModel(presetModel.profile, presetModel.valueConfig, presetModel.sourceContent, undefined, presetModel);
                            action._announceOperationEnd(undefined, status);
                            decideAndRunStepAfterImplicitProfileSelection(deferred);
                          }
                        } else {
                          action._announceOperationEnd(undefined, status);
                          showWizard(action.STEPS.SELECT_TYPE);
                        }
                      } else {
                        if (preset.isCustomAllowed() || !preset.isRecentAllowed()) {
                          action._announceOperationEnd(undefined, status);
                          fetchProfileAndRunStep(deferred);
                        } else {
                          recentConfigCollection.fetch().done(function() {
                            action._announceOperationEnd(undefined, status);
                            if (recentConfigCollection.length) {
                              showWizard(action.STEPS.SELECT_TYPE);
                            } else {
                              fetchProfileAndRunStep(deferred);
                            }
                          }).fail(handleDataFetchFailure);
                        }
                      }
                    }).fail(handleDataFetchFailure);
                  } else {
                    createTypeScreenHasCustomNameField = false;
                    delete profileData.recentProfileCollection;
                    action._announceOperationEnd(undefined, status);
                    fetchProfileAndRunStep(deferred);
                  }
                }).fail(handleDataFetchFailure);
              }
            }
          }
        }).fail(deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },
    showErrorAndReject: function(node, error, promise) {
      if (node) {
        CreationUtils.finishCreateOperation([ node ], RestLinkrels.ABORT_ACTION);
      }
      if (_.isString(error)) {
        GlobalMessage.showMessage("error", error);
      } else if (error.message) {
        GlobalMessage.showMessage("error", error.message);
      } else {
        error.responseJSON = error.responseJSON || {};
        GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
      }
      if (promise) {
        promise.reject(error);
      }
    },
    _getCreatedNodes: function(node, status, wizard) {
      var list = [];
      if (wizard && wizard.data) {
        var linkedNodes = wizard.data.linkedNodes;
        if (!_.isEmpty(linkedNodes)) {
          list = linkedNodes[node.get("id")];
        }
      }
      var index = _.findIndex(list, {
        id: node.get("id")
      });
      if (index === -1) {
        list.push(node);
      }
      return list;
    },
    _getLinkedNodes: function(node, wizard) {
      var list = [];
      if (wizard && wizard.data) {
        var linkedNodes = wizard.data.linkedNodes;
        if (!_.isEmpty(linkedNodes)) {
          list = linkedNodes[node.get("id")];
        }
      }
      return list;
    },
    addNodeInDocList: function(item, status) {
      delete item.propertiesSource;
      var collection = status.originatingView.collection;
      item.isLocallyCreated = true;
      item.collection = collection;
      collection.unshift(item);
    },
    trackAsync: function(node, status, wizard) {
      var intermediate;
      var start = new Date().getTime();
      var deferred = $.Deferred();
      var vdocModel = new FileUploadModel({
        name: node.get("name"),
        iconClass: "csui-icon mime_folder",
        state: "pending",
        count: 0,
        total: 1,
        context: status.context,
        status: status
      }, {
        node: node
      });
      var vDocCol = new UploadFileCollection([ vdocModel ], {
        connector: node.connector
      });
      var progressPanel = GlobalMessage.showProgressPanel(vDocCol, {
        oneFilePending: lang.vdocAsyncProcessingLabel,
        oneFileSuccess: lang.vdocAsyncProcessingLabel,
        oneFileFailure: lang.vdocAsyncProcessingLabel,
        originatingView: status.originatingView,
        configOptions: {
          enhancePanel: false
        },
        actionType: "VD"
      });
      if (wizard) {
        wizard.close({
          success: true,
          async: true
        });
      }
      var fn = function() {
        CreationUtils.pollAsyncVNodeStatus(node).done(function(response) {
          if (response.properties.status === "SUCCESS") {
            vDocCol.set({
              count: 99,
              total: 100,
              state: "processing"
            });
            vDocCol.trigger("change");
            deferred.resolve(progressPanel);
          } else if (response.properties.status === "FAILED") {
            vDocCol.set({
              count: 1,
              total: 1,
              state: "rejected"
            });
            vDocCol.trigger("change");
            deferred.reject(response.errors, progressPanel);
          } else if (response.properties.status === "NOT_STARTED") {
            vDocCol.set({
              count: 0,
              total: 1,
              state: "processing"
            });
            vDocCol.trigger("change");
            intermediate = new Date().getTime();
            if (intermediate - start > 12e4) {
              deferred.reject(lang.vdocAsyncObjectTimeout, false);
            } else {
              setTimeout(fn, 10);
            }
          } else if (response.properties.status === "RUNNING") {
            vDocCol.set({
              count: response.properties.complete_count,
              total: response.properties.total_count,
              state: "processing"
            });
            vDocCol.trigger("change");
            intermediate = new Date().getTime();
            if (intermediate - start > 3e5) {
              deferred.reject(lang.vdocAsyncObjectTimeout, false);
            } else {
              setTimeout(fn, 500);
            }
          } else {
            vDocCol.set({
              count: 1,
              total: 1,
              state: "rejected"
            });
            vDocCol.trigger("change");
            deferred.reject(lang.vdocAsyncObjectFailed, progressPanel);
          }
        }).fail(function(error) {
          vDocCol.set({
            count: 1,
            total: 1,
            state: "rejected"
          });
          vDocCol.trigger("change");
          deferred.reject(error, progressPanel);
        });
      };
      fn();
      return deferred.promise();
    },
    getProgressPanelOptions(status, node) {
      const doneCommand = this.getDoneCommand();
      return {
        oneFileSuccess: lang.ContentUploadSuccessLabel,
        oneFilePending: _.str.sformat(lang.ContentUploadProcessingLabel, node.get("name")),
        oneFileFailure: _.str.sformat(lang.ContentUploadFailedLabel, node.get("name")),
        originatingView: status.originatingView,
        context: status.context,
        actionType: "UPLOAD_CONTENT",
        link_command_signature: doneCommand.signature,
        gotoLocationLinkLabel: doneCommand.label,
        configOptions: {
          enhancePanel: this.uploadObjectCollection.length > 1
        }
      };
    },
    uploadContentForObject: function(node, status, wizard) {
      var deferred = $.Deferred(), fileUploaderOptions = wizard.data.checkinData.fileUploaderOptions, file = fileUploaderOptions.file, uploadObjectModel = new FileUploadModel({
        name: node.get("name"),
        state: "pending",
        count: 0,
        total: ctfBridge.isCtfEnabled() ? 100 : file.size,
        context: status.context,
        status: status,
        targetLocation: true
      }, {
        node: node
      });
      this.uploadObjectCollection = new UploadFileCollection([ uploadObjectModel ], {
        connector: node.connector
      });
      var progressPanel = GlobalMessage.showProgressPanel(this.uploadObjectCollection, this.getProgressPanelOptions(status, node, wizard));
      this.uploadContentUsingFileUploader(node, wizard.data.checkinData.fileUploaderOptions).done(function() {
        deferred.resolve(progressPanel);
      }).fail(function(error) {
        deferred.reject(error, progressPanel);
      }).progress(function(progressData) {
        if (progressData && progressData.count <= uploadObjectModel.get("total")) {
          uploadObjectModel.set("count", progressData.count);
        }
      });
      return deferred.promise();
    },
    uploadContentUsingFileUploader: function(node, options) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/add.version/file.uploader", "d2/ctf/ctfBridge" ], function(FileUploader, ctfBridge) {
        var fileUploader = new FileUploader(options);
        if (ctfBridge.isCtfEnabled()) {
          fileUploader.uploadUsingCtf(function(data) {
            var pref = RestResources.getCurrentUser().get("preferences"), checkoutPath = pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
            ctfBridge.publishRemoveFileFromCheckout(checkoutPath, node.get("id"));
            deferred.resolve(data);
          }, deferred.reject, function(progressData) {
            deferred.notify({
              total: progressData.total,
              count: progressData.loaded,
              done: progressData.loaded
            });
          });
        } else {
          fileUploader.upload().progress(function(progressData) {
            deferred.notify({
              total: progressData.total,
              count: progressData.count,
              done: progressData.count
            });
          }).done(deferred.resolve).fail(deferred.reject);
        }
      });
      return deferred.promise();
    },
    commitFile: function(node, wizard) {
      var nodeList = [ node ];
      var linkedNodes = this._getLinkedNodes(node, wizard);
      if (linkedNodes && linkedNodes.length > 0) {
        nodeList = nodeList.concat(linkedNodes);
      }
      return CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION);
    },
    handleUploadObjModel: function(uploadObjModelOptions) {
      var uploadObjModel = this.uploadObjectCollection && this.uploadObjectCollection.at(0);
      if (uploadObjModel && uploadObjModel.get("state") === "resolved") {
        uploadObjModel = undefined;
      }
      if (uploadObjModel) {
        uploadObjModel.set({
          name: uploadObjModelOptions.node.get("name"),
          count: uploadObjModel.get("total"),
          state: uploadObjModelOptions.isSuccess ? "resolved" : "rejected",
          targetLocation: !uploadObjModelOptions.inSameContainer
        });
        if (!uploadObjModelOptions.inSameContainer && uploadObjModelOptions.isSuccess && uploadObjModelOptions.parent) {
          uploadObjModel.set("resolvedToastMessage", _.str.sformat(lang.ContentUploadSuccessWithLink, uploadObjModelOptions.node.get("name"), uploadObjModelOptions.parent.get("name")));
        }
      } else {
        var msg;
        if (uploadObjModelOptions.inSameContainer) {
          msg = this.getSuccessToastMessage(uploadObjModelOptions.node, uploadObjModelOptions.linkedNodes);
        } else {
          uploadObjModelOptions.node._foldername = uploadObjModelOptions?.fallBackToOverview ? lang.CreateItemSuccessUnknownParentFolder : uploadObjModelOptions.parent.get("name");
          if (uploadObjModelOptions.node.contentCreatedBeforeEdit === true && uploadObjModelOptions.node.contentUpdatedAfterEdit === true) {
            msg = lang.ContentUploadSuccessWithLink;
          } else if (uploadObjModelOptions.nodeList.length > 1) {
            msg = lang.CreateItemSuccessMessageFormatFolderWithLink;
          } else {
            msg = lang.CreateItemSuccessMessageFormatFolder;
          }
        }
        if (msg) {
          this._showMsg(uploadObjModelOptions.status, uploadObjModelOptions.node, msg, !uploadObjModelOptions.inSameContainer, uploadObjModelOptions.isSuccess, uploadObjModelOptions.err, uploadObjModelOptions.fallBackToOverview);
        }
      }
    },
    showSuccessAndClose: function(node, status, wizard) {
      var me = this;
      me._announceOperationEnd(wizard, status);
      var onSuccess = function(progressPanel, afterAsync) {
        var nodeList = [ node ];
        var linkedNodes = me._getLinkedNodes(node, wizard);
        if (linkedNodes && linkedNodes.length > 0) {
          nodeList = nodeList.concat(linkedNodes);
        }
        if (node.contentCreatedBeforeEdit !== true) {
          CreationUtils.finishCreateOperation(nodeList, RestLinkrels.FINISH_ACTION);
          if (wizard && !wizard.isDestroyed && afterAsync !== true) {
            wizard.close({
              success: true,
              newNode: node
            });
          }
        }
        me._announceOperationStart(undefined, status);
        var parentIds, inSameContainer, uploadObjModelOptions = {}, widgetConfig = {};
        if (status.container && status.container.get("id") && status.collection && status.collection.options) {
          widgetConfig.widgetType = status.collection.widgetType;
          widgetConfig.widgetName = status.collection.options.widgetName;
        }
        CommandHelper.refreshNode(node, widgetConfig).done(function() {
          var promises = [];
          parentIds = node.get("i_folder_id");
          inSameContainer = status.container ? _.contains(parentIds, status.container.get("id")) : false;
          uploadObjModelOptions = {
            inSameContainer: inSameContainer,
            status: status,
            linkedNodes: linkedNodes,
            nodeList: nodeList,
            node: node
          };
          if (status.container && inSameContainer) {
            me.addNodeInDocList(node, status);
            uploadObjModelOptions.isSuccess = true;
            me.handleUploadObjModel(uploadObjModelOptions);
            if (linkedNodes.length > 0) {
              _.each(linkedNodes, function(item) {
                var p = $.Deferred();
                promises.push(p);
                parentIds = item.get("i_folder_id");
                if (_.contains(parentIds, status.container.get("id"))) {
                  CommandHelper.refreshNode(item, widgetConfig).done(function() {
                    me.addNodeInDocList(item, status);
                    p.resolve();
                  }).fail(function() {
                    p.reject();
                  });
                } else {
                  p.resolve();
                }
              });
              $.whenAll.apply($, promises).always(function() {
                me._announceOperationEnd(undefined, status);
              });
            } else {
              me._announceOperationEnd(undefined, status);
            }
          } else {
            CommandHelper.findValidParentForNode({
              node: node,
              context: status.context
            }).done(function(validParent) {
              uploadObjModelOptions.isSuccess = true;
              if (validParent !== undefined) {
                uploadObjModelOptions.parent = validParent;
                node.parent = validParent;
              } else {
                uploadObjModelOptions.parent = node.parent;
                uploadObjModelOptions.fallBackToOverview = true;
              }
              me.handleUploadObjModel(uploadObjModelOptions);
            }).always(() => {
              me._announceOperationEnd(undefined, status);
            });
          }
        }).fail(function(xhr, status, err) {
          me._announceOperationEnd(undefined, status);
          uploadObjModelOptions.isSuccess = false;
          uploadObjModelOptions.err = err;
          this.handleUploadObjModel(uploadObjModelOptions);
        });
      };
      me.checkProcessingPanel(node, status, wizard).done(function(progressPanel, afterAsync) {
        onSuccess(progressPanel, afterAsync);
      }).fail(function(xhr, status, err) {
        GlobalMessage.showMessage("error", lang.ObjectFetchFailed, err);
      });
    },
    getSuccessToastMessage: function(node, linkedNodes) {
      var msg;
      if (node.contentCreatedBeforeEdit === true && node.contentUpdatedAfterEdit !== true) {
        msg = "";
      } else if (node.contentCreatedBeforeEdit === true && node.contentUpdatedAfterEdit === true) {
        msg = lang.ContentUploadSuccessLabel;
      } else if (linkedNodes.length > 0) {
        msg = lang.CreateItemSuccessMessageFormatWithLink;
      } else {
        msg = lang.CreateItemSuccessMessageFormat;
      }
      return msg;
    },
    checkProcessingPanel: function(node, status, wizard) {
      var me = this, deferred = $.Deferred();
      if (node.contentUpdatedAfterEdit && wizard.data.checkinData && wizard.data.checkinData.fileUploaderOptions) {
        me.uploadContentForObject(node, status, wizard).done(function(progressPanel) {
          deferred.resolve(progressPanel, false);
        }).fail(function(error, progressPanel) {
          deferred.reject(progressPanel, error);
        });
      } else if (node.asyncURL) {
        me.trackAsync(node, status, wizard).done(function(progressPanel) {
          deferred.resolve(progressPanel, true);
        }).fail(function(error, progressPanel) {
          deferred.reject(progressPanel, error, node);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _showMsg: function(status, node, msg, showLink, isSuccess, err, fallBackToOverview) {
      if (isSuccess) {
        const doneCommand = this.getDoneCommand(fallBackToOverview);
        GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
          showLink: showLink,
          node: node,
          context: status.context,
          successMessageFormat: msg,
          linkLabel: doneCommand.label,
          link_command_signature: doneCommand.signature
        });
      } else {
        GlobalMessage.showMessage("error", lang.ObjectFetchFailed, err);
      }
    },
    getDoneCommand: function(fallBackToOverview) {
      return {
        signature: RestResources.getD2Options().go_to_location_enabled && !fallBackToOverview ? "D2-GoToLocation" : "Browse",
        label: RestResources.getD2Options().go_to_location_enabled && !fallBackToOverview ? lang.GoToLocationCommandLabel : lang.ImportItemDoneCommandLabel
      };
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
    _isContentInherited: function(node) {
      return (node.profileData && node.profileData.get("inherit-content") === true) === true;
    },
    _isVDStructureInherited: function(node) {
      return (node.profileData && node.profileData.get("inherit-vd") === true) === true;
    },
    _getVdocStructureInheritedId: function(node, template) {
      if (node && this._isVDStructureInherited(node)) {
        return node.profileData.get("inherited-id");
      } else if (this._checkSelectedDocTemplateIsVD(template)) {
        return template.get("id");
      }
    },
    _checkSelectedDocTemplateIsVD: function(template) {
      return (template && template.has("a_content_type") && template.get("a_content_type") === "vd") === true;
    },
    _getSourceContentNode: CreationUtils.getSourceContentNode,
    _getLandingPageInheritedNode: CreationUtils.getLandingPageInheritedNode
  });
});