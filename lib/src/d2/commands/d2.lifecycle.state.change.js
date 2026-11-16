/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "csui/models/fileuploads", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "csui/utils/command.error", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/taskqueue", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "d2/commands/node.progress.command", "d2/commands/mixin/multiple.progress.command.mixin", "d2/dialogs/lifecycle/impl/validation.dialog/lifecycle.validation.dialog", "d2/models/virtual.document.children", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/vdoc.utils", "d2/utils/node.utils", "d2/utils/concurrency.manager", "d2/widgets/checkout/checkout.model", "i18n!d2/commands/nls/localized.strings" ], function(module, require, $, _, Backbone, Url, NodeModel, NodeChildren2Collection, UploadFileCollection, ConnectorFactory, CommandHelper, CommandError, ApplicationScopeModelFactory, TaskQueue, GlobalMessage, ModalAlert, NodeProgressCommand, MultipleProgressCommandMixin, ValidationDialog, VirtualDocumentChildren, constants, RestLinkrels, RestResources, utils, vdocUtils, nodeUtils, ConcurrencyManager, CheckedOutCollection, lang) {
  "use strict";
  var config = _.extend({
    dialogSize: constants.WizardSize.SMALL
  }, module.config());
  var D2LifeCycleStateChange = NodeProgressCommand.extend({
    PROPERTIES: Object.freeze({
      SIGNOFF_REQUIRED: "signoff_required",
      SIGNOFF_EACH_DOCUMENT: "signoff_each_document",
      INTENTION_REQUIRED: "is_intention_required",
      CONFIRMATION_MESSAGE: "confirmation_message",
      ESIGN_CONFIRMATION_MESSAGE: "esign_confirmation_message",
      INTENTION_DICTIONARY_NAME: "intention_dictionary_name"
    }),
    defaults: {
      signature: "D2-LifeCycleStateChange",
      command_key: "D2-LifeCycleStateChange",
      name: lang.CommandD2LifecycleStateChange,
      scope: "multiple"
    },
    preProcess: function(status, options) {
      var dfd = $.Deferred(), me = this;
      me.performPreCheckForInProgressItems(status, {
        modalAlertHeader: lang.LifecycleStateChangeProcessingTitle,
        multiFileErrorMessage: lang.LifecycleStateChangeProcessingMessage,
        singleFileErrorMessage: lang.LifecycleStateChangeProcessingOneMessage,
        multiFileAddnlMessage: lang.LifecycleStateChangeProcessingAddnlMessage
      }).done(function() {
        me.preProcessForLCStateChange(status, options).always(function() {
          me._unblockActions(status.originatingView);
        }).done(dfd.resolve).fail(function() {
          me.unsetInProgressNodes(status);
          dfd.reject.apply(dfd, arguments);
        });
      }).fail(dfd.reject);
      return dfd.promise();
    },
    preProcessForLCStateChange: function(status, options) {
      if (utils.isMobile()) {
        options.suppressProgress = true;
      }
      options.hideSuccessMessage = true;
      options.doneCommand = {
        signature: "D2-GoToLocation",
        label: lang.LifecycleStateChangeDoneCommandLabel
      };
      var me = this, targetState = status.data && status.data.targetState, node = CommandHelper.getJustOneNode(status) || status.nodes.at(0), action = CommandHelper.getOriginalAction(node, me.get("signature"), status.data), isDirect = action && !action.get("dynamic"), actionMenuLabel = action.get("actionProperties") ? action.get("actionProperties").name : undefined;
      status["actionMenuLabel"] = actionMenuLabel;
      var id = status.nodes.at(0).parent ? status.nodes.at(0).parent.get("id") : status.originatingView.container ? status.originatingView.container.get("id") : status.originatingView.containerCollection?.node.get("id");
      if (id) {
        options.commandContainer = new NodeModel({
          id: id
        });
      }
      options.model = node;
      return me.showValidationDialog(status, targetState).then(function(validDocuments) {
        status.nodes.reset(validDocuments);
        return me.getLifeCycleConfigForNodes(status);
      }).then(function() {
        return me.showConfirmationDialog(status, isDirect);
      }).then(function() {
        return me.showLifecycleStateChangeDialog(status, options, isDirect);
      }).catch(function(xhr, message, statusText) {
        if (xhr !== "close") {
          return $.Deferred().reject(xhr, message, statusText).promise();
        } else {
          return $.Deferred().reject().promise();
        }
      });
    },
    enabled: function(status) {
      if (status.nodes) {
        if (utils.isMobile() && status.nodes.length !== 1) {
          return false;
        }
        return NodeProgressCommand.prototype.enabled.call(this, status);
      }
      return false;
    },
    execute: function(status) {
      status.d2SelectedNodes = status.nodes;
      status.nodes = status.nodes.clone();
      status.d2SelectedNodeDataList = status.nodes.map(function(node) {
        return JSON.parse(JSON.stringify(node.attributes));
      });
      status.commandPromise = $.Deferred();
      NodeProgressCommand.prototype.execute.apply(this, arguments).done(status.commandPromise.resolve).fail(status.commandPromise.reject);
      return status.commandPromise;
    },
    doAction: function(node, options) {
      var dfd = $.Deferred(), me = this, targetState = options && options.data && options.data.targetState;
      function performActionForLCStateChange() {
        var lcStateChangeData = me.getLifecycleStateChangeData(node, options);
        if (!utils.isMobile() && lcStateChangeData) {
          if (lcStateChangeData.data) {
            return $.Deferred().resolve(lcStateChangeData.data).promise();
          } else if (lcStateChangeData.error) {
            return $.Deferred().reject(lcStateChangeData.error).promise();
          }
        } else {
          return me.changeObjectLifecycleState(node, targetState, options);
        }
      }
      performActionForLCStateChange().done(function(data) {
        if (data && data.content.status === 200) {
          if (options.selectedNodesRefreshed === true) {
            dfd.resolve();
          } else {
            var vdocNode, vdocNodeLink;
            if (options.collection && options.collection instanceof VirtualDocumentChildren) {
              vdocNode = options.collection.findWhere({
                id: node.get("id")
              });
              if (vdocNode) {
                vdocNodeLink = vdocNode.get("links");
              }
            }
            me.refreshNode(node, options).done(function() {
              if (vdocNode && vdocNodeLink) {
                vdocNodeLink = _.uniq(_.union(vdocNodeLink, vdocNode.get("links")), "rel");
                vdocNode.set("links", vdocNodeLink, {
                  silent: true
                });
              }
              dfd.resolve();
            }).fail(function() {
              me.checkObjectPermission(node, "read").done(isObjectHasPermission => {
                if (!isObjectHasPermission) {
                  options.originatingView.clearAllSelectedNodes();
                  me.removeObjectFromCollection(node, options);
                  dfd.resolve();
                }
              }).fail(() => {
                dfd.reject(lang.LifeCycleStateChangePermissionFailure);
              });
            });
          }
        } else {
          var errorMsg = data && data.content && data.content["rest-errors"] && data.content["rest-errors"][0].message;
          dfd.reject(errorMsg);
        }
      }).fail(function(error) {
        if (error.responseJSON && error.responseJSON.entries) {
          me.handleErrorMessage(node, error);
        }
        dfd.reject(error);
      });
      return dfd.promise();
    },
    checkObjectPermission: function(node, permissionLevel) {
      var url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "objects-specific-permission"), deferred = $.Deferred();
      url = Url.appendQuery(url, Url.combineQueryString({
        "permission-level": permissionLevel,
        "object-ids": node.get("id")
      }));
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        method: "GET",
        success: function(response) {
          var basePermissions = response.entries[0].content["base-permission"];
          deferred.resolve(basePermissions[permissionLevel]);
        },
        error: function() {
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    handleErrorMessage: function(node, error) {
      var errorEntry = _.find(error.responseJSON.entries, function(entry) {
        return node.get("id") === entry.content["r_object_id"];
      });
      if (errorEntry && errorEntry.content["rest-errors"]) {
        var errorObj = {
          code: errorEntry.content["rest-errors"][0]["status"],
          details: errorEntry.content["rest-errors"][0]["details"],
          message: errorEntry.content["rest-errors"][0]["message"]
        };
        error.responseText = JSON.stringify(errorObj);
        error.responseJSON = errorObj;
      }
    },
    handleResults: function(results, options, collection) {
      var me = this;
      options.hideSuccessMessage = false;
      var actualResultsCount = results.length;
      results = _.filter(results, function(result) {
        return result instanceof Backbone.Model;
      });
      var failedCnt = actualResultsCount - results.length, inSameContainer;
      function checkAndRemoveNodeFromList(result) {
        if (options.collection instanceof NodeChildren2Collection && options.data.refreshWidget === "true") {
          options.originatingView.removeNodesFromSelection && options.originatingView.removeNodesFromSelection([ result ]);
          me.removeObjectFromCollection(result, options);
        }
      }
      function showSuccessMessage(results, messageOptions) {
        if (failedCnt === 0) {
          NodeProgressCommand.prototype._showSuccessMessage.call(me, results, messageOptions);
          inSameContainer = me._isNodeInContainer(results[0], options.commandContainer);
          inSameContainer && collection.at(0).set("targetLocation", undefined);
        }
      }
      function handleObjectLocationChange(ids) {
        require([ "csui/utils/contexts/factories/ancestors", "csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view", "d2/widgets/virtual.document/virtual.document.view", "d2/widgets/virtual.document.explorer/virtual.document.table.view", "d2/widgets/document.overview/document.overview.view" ], function(AncestorCollectionFactory, MetadataNavigationView, VirtualDocumentView, VirtualDocumentTableView, D2DocumentOverview) {
          options.context.trigger("d2:objects:deleted", ids);
          if (options.originatingView instanceof D2DocumentOverview) {
            var ancestors = options.context.getCollection(AncestorCollectionFactory);
            ancestors.fetch();
            showSuccessMessage(results, options);
          } else if (options.originatingView instanceof MetadataNavigationView) {
            options.context.viewStateModel.restoreLastFragment();
            NodeProgressCommand.prototype._showSuccessMessage.call(me, results, options);
          } else if ((options.originatingView instanceof VirtualDocumentView || options.originatingView instanceof VirtualDocumentTableView) && vdocUtils.isRootNode(results[0])) {
            var node = results[0];
            me.refreshVdocNode(node, options).done(function() {
              showSuccessMessage(results, options);
            });
          } else {
            showSuccessMessage(results, options);
          }
        });
      }
      if (results.length === 1 && failedCnt === 0) {
        this.refreshResults(results, options).always(function() {
          if (!NodeProgressCommand.prototype._isNodeInContainer.call(me, results[0], options.commandContainer)) {
            checkAndRemoveNodeFromList(results[0]);
            handleObjectLocationChange([ results[0].get("id") ]);
          } else {
            showSuccessMessage(results, options);
          }
        });
      } else {
        if (results.length !== 0) {
          if (utils.isMobile()) {
            results[0].parent._expanded = false;
            if (options.originatingView && !options.originatingView.context) {
              options.originatingView.context = options.context;
            }
          }
          me.refreshResults(results, options).always(function() {
            if (options.collection instanceof VirtualDocumentChildren) {
              var clonedResults = results;
              _.forEach(clonedResults, function(result, index) {
                var newModel = options.collection.findWhere({
                  id: result.get("id")
                });
                if (newModel) {
                  results[index] = newModel;
                }
              });
            }
            var ids = _.compact(_.map(results, function(result) {
              if (!NodeProgressCommand.prototype._isNodeInContainer.call(me, result, options.commandContainer)) {
                checkAndRemoveNodeFromList(result);
                return result.get("id");
              }
            }));
            if (options.data && options.data.locateAndRefresh === "false") {
              options.commandContainer = undefined;
            }
            if (ids.length > 0 && !utils.isMobile()) {
              handleObjectLocationChange(ids);
            } else {
              showSuccessMessage(results, options);
            }
            if (options.data.refreshWidget === "true") {
              checkAndRemoveNodeFromList(results);
              CommandHelper.postCommandOperation(_.extend({
                selectedNodes: new Backbone.Collection(results)
              }, {
                refreshWidget: true,
                collection: options.collection
              })).done(() => checkAndRemoveNodeFromList(results));
            }
          });
        }
      }
    },
    refreshVdocNode: function(node, options) {
      var dfd = $.Deferred();
      require([ "csui/utils/commands" ], function(commands) {
        var newStatus = {
          nodes: new Backbone.Collection([ node ]),
          context: options.context
        };
        commands.get("D2-OpenVDoc").execute(newStatus, {
          replaceLastUrl: true
        }).always(function() {
          dfd.resolve();
        });
      });
      return dfd.promise();
    },
    removeObjectFromCollection: function(deletedNode, options) {
      var collection = options.collection, deletedNodeIndexInAllModels = collection.allModels ? collection.allModels.indexOf(deletedNode) : -1, deletedNodeIndexInFilteredSortedModels = collection.lastFilteredAndSortedModels ? collection.lastFilteredAndSortedModels.indexOf(deletedNode) : -1;
      if (_.contains(collection.models, deletedNode)) {
        collection.remove(deletedNode);
      }
      if (deletedNodeIndexInAllModels > -1) {
        collection.allModels.splice(deletedNodeIndexInAllModels, 1);
        collection.totalCount--;
      }
      if (deletedNodeIndexInFilteredSortedModels > -1) {
        collection.lastFilteredAndSortedModels.splice(deletedNodeIndexInFilteredSortedModels, 1);
        collection.filteredCount--;
      }
    },
    refreshResults: function(results, options) {
      var collection = options.collection, promises = [], unreservedIds = [];
      if (collection instanceof VirtualDocumentChildren) {
        var vdmList = _.uniq(_.map(results, function(result) {
          if (result instanceof Backbone.Model && result.get("reserved")) {
            unreservedIds.push(vdocUtils.isVirtualDoc(result) ? vdocUtils.getVDMNumber(result) : vdocUtils.getParentVDMNumber(result));
          }
          if (result instanceof Backbone.Model) {
            return vdocUtils.isVirtualDoc(result) ? vdocUtils.getVDMNumber(result) : vdocUtils.getParentVDMNumber(result);
          }
        }));
        unreservedIds = _.uniq(unreservedIds);
        if (vdmList.length > 0) {
          promises.push(collection.refresh({
            vdmNumber: vdmList
          }));
        }
      } else {
        _.each(results, function(result) {
          if (result instanceof Backbone.Model) {
            if (result.get("reserved")) {
              unreservedIds.push(result.get("id"));
            }
          }
        });
      }
      if (unreservedIds.length > 0) {
        options.context.trigger("d2:objects:unreserved", unreservedIds);
      }
      return $.whenAll.apply($, promises);
    },
    getMessageOptions: function(options) {
      if (utils.isMobile()) {
        return {
          oneFileSuccess: _.str.sformat(lang.MobileSingleFileLifecycleStateTransitionSuccessMsg, options.model.get("name"), options.data.targetState),
          oneFileFailure: _.str.sformat(lang.MobileSingleFileLifecycleStateTransitionFailureMsg, options.model.get("name"), options.data.targetState)
        };
      }
      var msgOpts = {
        oneFilePending: lang.SingleFileLifecycleStateTransitionPendingMsg,
        oneFileSuccess: lang.SingleFileLifecycleStateTransitionSuccessMsg,
        oneFileFailure: lang.SingleFileLifecycleStateTransitionFailureMsg,
        multiFilePending: lang.MultiFileLifecycleStateTransitionPendingMsg,
        multiFileSuccess: lang.MultiFileLifecycleStateTransitionSuccessMsg,
        multiFileOneFailure: lang.MultiFileLifecycleStateTransitionOneFailureMsg,
        multiFileFailure: lang.MultiFileLifecycleStateTransitionMultiFailureMsg,
        link_command_signature: "D2-GoToLocation",
        gotoLocationLinkLabel: lang.LifecycleStateChangeDoneCommandLabel,
        configOptions: {
          enhancePanel: false
        }
      };
      if (options.nodes.length === 1) {
        _.extend(msgOpts, {
          hideProgressBar: true
        });
      } else if (options.nodes.length > 1) {
        _.extend(msgOpts, {
          hideProgressBar: true,
          enableCancel: false,
          multiFilePending: lang.MultiFileLifecycleStateTransitionFinalizeMsg
        });
      }
      return msgOpts;
    },
    showLifecycleStateChangeDialog: function(status, options, directState) {
      var dep, me = this, dfd = $.Deferred();
      me._unblockActions(status.originatingView);
      if (status.isHomogeneousConfig === undefined && status.lifeCycleStateConfigExist !== true && directState) {
        dep = "d2/dialogs/lifecycle/lifecycle.state.change.dialog";
      } else {
        if (status.nodes.length > 1) {
          dep = status.isHomogeneousConfig ? "d2/dialogs/lifecycle/bulk.lifecycle.state.change.dialog" : "d2/dialogs/lifecycle/heterogeneous.lifecycle.dialog";
        } else {
          dep = "d2/dialogs/lifecycle/lifecycle.state.change.dialog";
        }
      }
      require([ dep ], function(LCDialogClass) {
        var dialog = new LCDialogClass({
          status: status,
          options: options,
          command: me,
          directState: directState,
          dialogSize: config.dialogSize
        });
        dialog.show().done(dfd.resolve).fail(dfd.reject);
      });
      return dfd.promise();
    },
    showValidationDialog: function(status, targetState) {
      var validationDialog = new ValidationDialog({
        status: status,
        nodeModels: CommandHelper.getAtLeastOneNode(status).models,
        targetState: targetState,
        className: "d2-lifecycle-validation-dialog",
        command: this
      });
      return validationDialog.show();
    },
    changeObjectLifecycleState: function(node, targetState, status) {
      var me = this, dfd = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, me.get("signature"), RestLinkrels.D2_OBJECT_LIFECYCLE_STATE, null);
      if (!url) {
        return dfd.reject();
      }
      var queryMap = {
        inline: true
      };
      var parent_id = node.getParentId({
        status: status
      });
      if (parent_id) {
        queryMap["parent-id"] = parent_id;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        data: me.getData(node, targetState),
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          dfd.resolve(response && response.entries && response.entries[0]);
        },
        error: dfd.reject
      }));
      return dfd.promise();
    },
    _performActions: function(status, options) {
      var dfd = $.Deferred(), me = this;
      if (status.lifecycleStateChangeError) {
        var errorMessage = utils.parseAjaxErrorAsString(status.lifecycleStateChangeError);
        me.unsetInProgressNodes(status);
        GlobalMessage.showMessage("error", errorMessage);
        dfd.reject(status.lifecycleStateChangeError);
      }
      if (status.nodes.length === 0) {
        me.unsetInProgressNodes(status);
        GlobalMessage.showMessage("error", lang.LifeCycleStateChangeFilesNotExist);
        dfd.reject();
      } else if (status.lifeCycleStateConfig && status.lifeCycleStateConfig["skip-ui-processing"] === true && status.nodes.length > 1) {
        me.unsetInProgressNodes(status);
        GlobalMessage.showMessage("success", _.str.sformat(lang.MultiFileLifecycleStateTransitionSubmitSuccessMsg, status.nodes.length));
        dfd.resolve();
      } else {
        me.updateSelectedNodes(status, options).always(function() {
          options.targetLocation = true;
          NodeProgressCommand.prototype._performActions.call(me, status, options).always(function() {
            me.unsetInProgressNodes(status);
          }).done(dfd.resolve).fail(dfd.reject);
        });
      }
      return dfd.promise();
    },
    performBulkLifeCycleChangeState: function(status, targetState) {
      var dfd = $.Deferred(), nodes = status.nodes, firstNode = nodes.at(0), url = CommandHelper.getOriginalActionLink(firstNode, this.get("signature"), RestLinkrels.D2_OBJECT_LIFECYCLE_STATE, null), queryMap = {
        inline: true
      };
      var parent_id = nodeUtils.getParentId(status.nodes, {
        status: status
      });
      if (parent_id) {
        queryMap["parent-id"] = parent_id;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      var payload = {
        "target-state": targetState
      };
      if (status.bulkLCStateChangeData["object-ids"]) {
        payload["object-ids"] = status.bulkLCStateChangeData["object-ids"];
      }
      if (status.bulkLCStateChangeData["properties-list"]) {
        payload["properties-list"] = status.bulkLCStateChangeData["properties-list"];
      }
      if (status.lifeCycleStateConfig.esign) {
        var intentions = [];
        _.forEach(nodes.models, function(node) {
          intentions.push({
            r_object_id: node.get("id"),
            intention: node.lifeCycleStateConfig.esign.signoff_intention
          });
        });
        _.extend(payload, {
          "signoff-inputs": {
            signoff_login: status.lifeCycleStateConfig.esign.signoff_login,
            signoff_password: status.lifeCycleStateConfig.esign.signoff_password,
            signoff_intentions: intentions
          }
        });
        if (status.lifeCycleStateConfig["external-esign-off"]) {
          payload["signoff-inputs"]["nonce_token"] = status.lifeCycleStateConfig["external-esign-off"]["nonce_token"];
        }
      }
      ConcurrencyManager.push(status.bulkLCStateChangeData["object-ids"]);
      $.ajax(firstNode.connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        data: JSON.stringify(payload),
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          var promises = [];
          status.lifecycleStateChangeMap = {};
          nodes.each(function(node) {
            var nodeId = node.get("id"), data = response && response.entries && _.find(response.entries, function(entry) {
              return entry && entry.content && entry.content["r_object_id"] === nodeId;
            }), promise = $.Deferred();
            promises.push(promise);
            status.lifecycleStateChangeMap[nodeId] = {
              data: data
            };
            promise.resolve();
          });
          $.whenAll.apply($, promises).always(function() {
            ConcurrencyManager.pop(status.bulkLCStateChangeData["object-ids"]);
            dfd.resolve();
          });
        },
        error: function(error) {
          status.lifecycleStateChangeError = error;
          ConcurrencyManager.pop(status.bulkLCStateChangeData["object-ids"]);
          dfd.reject(error);
        }
      }));
      return dfd.promise();
    },
    performMultiFileLifeCycleChangeState: function(status, targetState) {
      var me = this, dfd = $.Deferred(), nodes = status.nodes, promises = [], doneCount = 0, taskQueue = new TaskQueue({
        parallelism: 5
      });
      status.lifecycleStateChangeMap = {};
      ConcurrencyManager.push(nodes.pluck("id"));
      nodes.each(function(node) {
        var nodeId = node.get("id"), promise = $.Deferred();
        promises.push(promise);
        taskQueue.pending.add({
          worker: function() {
            me.changeObjectLifecycleState(node, targetState, status).always(function() {
              doneCount++;
              dfd.notify({
                done: doneCount,
                total: nodes.length
              });
              promise.resolve();
            }).done(function(data) {
              status.lifecycleStateChangeMap[nodeId] = {
                data: data
              };
            }).fail(function(error) {
              status.lifecycleStateChangeMap[nodeId] = {
                error: error
              };
            });
            return promise.promise();
          }
        });
      });
      $.whenAll.apply($, promises).always(function() {
        dfd.resolve();
        ConcurrencyManager.pop(nodes.pluck("id"));
      });
      return dfd.promise();
    },
    refreshNode: function(node, options) {
      let refreshState = false;
      if (options.data && options.data.locateAndRefresh === "false") {
        options.commandContainer = undefined;
      } else {
        refreshState = true;
      }
      return CommandHelper.postCommandOperation(_.extend({
        refreshWidget: options.data.refreshWidget === "true",
        refreshCheckoutState: refreshState || options.data.refreshCheckoutState === "true",
        locateAndRefresh: false,
        selectedNodes: new Backbone.Collection([ node ])
      }, options));
    },
    getData: function(node, targetState) {
      var payload = {
        "object-ids": [ node.get("id") ],
        "target-state": targetState
      };
      if (node.lifeCycleStateConfig) {
        if (node.lifeCycleStateConfig.esign) {
          var esign = node.lifeCycleStateConfig.esign;
          _.extend(payload, {
            "signoff-inputs": {
              signoff_login: esign.signoff_login,
              signoff_password: esign.signoff_password,
              signoff_intentions: [ {
                r_object_id: node.get("id"),
                intention: esign.signoff_intention
              } ]
            }
          });
          if (node.lifeCycleStateConfig["external-esign-off"]) {
            payload["signoff-inputs"]["nonce_token"] = node.lifeCycleStateConfig["external-esign-off"]["nonce_token"];
          }
        }
        if (node.lifeCycleStateConfig.properties) {
          _.extend(payload, {
            properties: node.lifeCycleStateConfig.properties
          });
        }
      }
      return JSON.stringify(payload);
    },
    customModalAlertDialog: function(msg, title, buttonOptions) {
      var dfd = $.Deferred();
      require([ "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "dctmw/dialogs/modal.alert.message/modal.alert.message.dialog.view" ], function(CustomModalAlert, ModalAlertMessageDialogView) {
        var messageBodyView = new ModalAlertMessageDialogView({
          message: msg
        });
        CustomModalAlert.confirmQuestion(function(result) {
          if (result) {
            dfd.resolve();
          } else {
            dfd.reject();
          }
        }, "", title, {
          buttons: buttonOptions,
          contentView: messageBodyView,
          modalClass: "confirmation-message-dialog"
        });
      });
      return dfd.promise();
    },
    modalAlertDialog: function(msg, title, buttonOptions) {
      var dfd = $.Deferred();
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, msg, title, {
        buttons: buttonOptions
      });
      return dfd.promise();
    },
    onCancel: function() {
      var deferred = $.Deferred(), me = this, buttonOptions = {
        labelYes: lang.LifecycleStateChangeStopLabel,
        showNo: false,
        showCancel: true
      };
      me.modalAlertDialog(lang.LifecycleStateChangeCancelConfirmMessage, lang.LifecycleStateChangeCancelConfirmTitle, buttonOptions).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    showConfirmationDialog: function(status, isDirect) {
      var deferred = $.Deferred(), me = this, node = status.nodes.at(0), buttonOptions = {
        labelYes: lang.LifecycleConfirmationDialogContinueButton,
        showNo: false,
        showCancel: true
      }, message = node.lifeCycleStateConfig && node.lifeCycleStateConfig[me.PROPERTIES.CONFIRMATION_MESSAGE];
      if (message && message.length > 0 && (status.nodes.length === 1 || status.isHomogeneousConfig) && !isDirect) {
        var title = node.lifeCycleStateConfig && node.lifeCycleStateConfig["menu-label"] || status.actionMenuLabel;
        me.customModalAlertDialog(message, title, buttonOptions).done(deferred.resolve).fail(deferred.reject);
      } else if (status.nodes.length > 1 && status.isHomogeneousConfig === false && !isDirect) {
        message = lang.LifecycleStateChangeHetrogeniousConfirmation;
        me.customModalAlertDialog(message, lang.LifecycleStateChangeHetrogeniousConfirmationTitle, buttonOptions).done(deferred.resolve).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    getLifeCycleConfigForNodes: function(status) {
      var waitForLifeCyleConfigs = $.Deferred(), me = this;
      var allNodesIds = status.nodes.pluck("id");
      var ajaxPayload = JSON.stringify({
        "object-ids": allNodesIds,
        "target-state": status.data.targetState
      });
      var firstNode = status.nodes.at(0);
      var link = CommandHelper.getOriginalActionLink(firstNode, this.get("signature"), RestLinkrels.D2_OBJECTS_LIFECYCLE_CONFIG, null, status.data);
      link = Url.appendQuery(link, Url.combineQueryString({
        inline: true
      }));
      link = allNodesIds.length > 1 ? Url.appendQuery(link, Url.combineQueryString({
        "evaluate-config-homogeneity": true
      })) : link;
      $.ajax(firstNode.connector.extendAjaxOptions({
        url: link,
        type: "POST",
        data: ajaxPayload,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          me.processLifeCycleConfig(response, status);
          waitForLifeCyleConfigs.resolve();
        },
        error: function(xhr) {
          var error = utils.parseAjaxError(xhr);
          waitForLifeCyleConfigs.reject(error);
        }
      }));
      return waitForLifeCyleConfigs.promise();
    },
    processLifeCycleConfig: function(response, status) {
      if (status.nodes.length > 1) {
        if (response["is_config_homogeneous"] && response.entries && response.entries[0].content["allow-bulk-processing"]) {
          status.isHomogeneousConfig = true;
        } else if (response["is_config_homogeneous"] === false) {
          status.isHomogeneousConfig = false;
        }
      }
      if (response.entries) {
        _.each(response.entries, function(entry) {
          var targetNode = status.nodes.findWhere({
            id: entry.content["r_object_id"]
          });
          targetNode.lifeCycleStateConfig = _.clone(entry.content);
        }, this);
        status.lifeCycleStateConfigExist = true;
      } else {
        status.nodes.each(function(node) {
          delete node.lifeCycleStateConfig;
        });
      }
    },
    getLifecycleStateChangeData: function(node, options) {
      var nodeId = node.get("id"), lcStateChangeData = options.lifecycleStateChangeMap && options.lifecycleStateChangeMap[nodeId];
      if (!lcStateChangeData) {
        var previousNodeData = _.find(options.d2SelectedNodeDataList, function(nodeData) {
          return nodeData["i_chronicle_id"] === node.get("i_chronicle_id");
        }), previousNodeId = previousNodeData && previousNodeData["id"];
        if (previousNodeId) {
          lcStateChangeData = options.lifecycleStateChangeMap && options.lifecycleStateChangeMap[previousNodeId];
        }
      }
      return lcStateChangeData;
    },
    updateSelectedNodes: function(status, options) {
      var me = this, deferred = $.Deferred(), selectedNodes = CommandHelper.getAtLeastOneNode(status), collection = status.collection || status.originatingView.collection;
      if (selectedNodes && selectedNodes.length === 1) {
        options.selectedNodesRefreshed = false;
        return $.Deferred().resolve().promise();
      }
      var nodes = selectedNodes.filter(function(node) {
        var lcStateChangeData = me.getLifecycleStateChangeData(node, options);
        return !utils.isMobile() && lcStateChangeData && lcStateChangeData.data && lcStateChangeData.data.content && lcStateChangeData.data.content.status === 200;
      });
      this._blockActions(options.originatingView);
      if (options.data && options.data.locateAndRefresh === "false") {
        options.commandContainer = undefined;
      }
      if (options.data.refreshCheckoutState === "true") {
        CommandHelper.refreshNodes(nodes, {
          connector: options.context.getObject(ConnectorFactory),
          widgetType: options.collection.widgetType,
          widgetName: options.collection && options.collection.options && options.collection.options.widgetName,
          collection: collection,
          selectedNodes: options.d2SelectedNodes || options.nodes,
          mergeOldAttributes: true
        }).always(function() {
          me._unblockActions(options.originatingView);
        }).done(function(data) {
          if (data) {
            options.selectedNodesRefreshed = data.nodesRefreshed;
          }
          deferred.resolve();
        }).fail(deferred.reject);
      } else {
        me._unblockActions(options.originatingView);
        deferred.resolve();
      }
      return deferred.promise();
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    }
  });
  MultipleProgressCommandMixin.mixin(D2LifeCycleStateChange.prototype);
  return D2LifeCycleStateChange;
});