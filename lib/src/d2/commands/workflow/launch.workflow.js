/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/moment", "d2/controls/globalmessage/globalmessage", "csui/models/command", "csui/models/fileuploads", "csui/utils/commandhelper", "d2/dialogs/launch.workflow/impl/documents.validation/launch.workflow.validation.dialog", "d2/models/workflow/workflow", "d2/models/virtual.document.children", "d2/utils/constants", "d2/utils/vdoc.utils", "d2/utils/server.query.utils", "d2/widgets/metadata/utils/form.converter", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, moment, GlobalMessage, CommandModel, UploadFileCollection, CommandHelper, WfDocumentValidationDialog, WorkFlowModel, VirtualDocumentChildren, constants, VdocUtils, serverQueryUtils, MetadataConverter, RestLinkrels, RestResources, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-LaunchWorkflow",
      command_key: "D2-LaunchWorkflow",
      name: lang.CommandNameLaunchWorkflow,
      scope: "multiple"
    },
    _checkEntryCondition: function(node, status) {
      var ids = node.workingFiles && _.map(node.workingFiles, function(workingFile) {
        return workingFile.get("id");
      });
      if (!(ids && ids.length)) {
        return $.Deferred().reject("No working files to continue command execution").promise();
      }
      var dialog = new WfDocumentValidationDialog({
        status: status,
        node: node,
        fileTypes: "working",
        nodeModels: node.workingFiles,
        command: this,
        multipck: node.get("multipackage")
      });
      return dialog.show();
    },
    _fetchWorkflowConfig: function(node, status) {
      return $.ajax(node.connector.extendAjaxOptions({
        url: CommandHelper.getOriginalActionLink(CommandHelper.getAtLeastOneNode(status).first(), this.get("signature"), RestLinkrels.D2_WORKFLOW_CONFIG, null, status.data)
      }));
    },
    _fetchProcessVariableConfig: function(node) {
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_PROCESS_VARIABLE_CONFIG);
      if (url) {
        var workingDocumentIds = node.get("working_document_ids");
        if (!_.isEmpty(workingDocumentIds) && Array.isArray(workingDocumentIds)) {
          var documentId = workingDocumentIds.length > 1 ? workingDocumentIds[0] : workingDocumentIds;
          url = serverQueryUtils.appendQueryParams(url, {
            scope: this,
            extraParams: {
              "document-id": documentId
            }
          });
          return $.ajax(node.connector.extendAjaxOptions({
            url: url
          }));
        }
      }
    },
    execute: function(status, options) {
      options = options || {};
      var deferred = $.Deferred(), me = this;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      this._blockActions(status.originatingView);
      this._initiateWorkflow(status, options).done(function() {
        var successMessage = !_.isEmpty(status.node.get("workflow_launch_date")) ? lang.launchWorkflowScheduleMessage : lang.launchWorkflowSuccessMessage;
        GlobalMessage.showMessage("success", _.str.sformat(successMessage, status.node.get("workflow_name")));
        status.context.trigger("d2:workflow:started");
        deferred.resolve();
      }).fail(function(xhr, message, statusText) {
        if (xhr !== "close") {
          var errorMessage = xhr && xhr.responseText ? utils.parseAjaxErrorAsString(xhr, statusText, message) : typeof xhr === "string" ? xhr : "";
          me._showErrorMessage(status, errorMessage);
        }
        deferred.reject();
      }).always(function() {
        me._unblockActions(status.originatingView);
      });
      return deferred.promise();
    },
    _initiateWorkflow: function(status, options) {
      var me = this, connector = status.context.getObject("connector"), node = new WorkFlowModel({}, {
        context: status.context,
        connector: connector
      });
      node.workingFiles = this._getNodesByScope(status, this.get("scope"));
      status.node = node;
      return me._fetchWorkflowConfig(node, status).then(function(config) {
        _.extend(node, config);
        node.set("links", config.links);
        node.set("workflow_config_id", config.r_object_id);
        node.set("wf_sv_disable_supporting_files", config.wf_sv_disable_supporting_files);
        node.set("wf_packages", config.packages);
        var isMultiPackage = config.packages && config.packages.length >= 2;
        if (node.workingFiles.length > config.packages.length && isMultiPackage) {
          GlobalMessage.showMessage("failure", lang.CheckPackageCount);
        }
        node.set("multipackage", isMultiPackage);
        return me._checkEntryCondition(node, status);
      }).then(function(validDocuments) {
        node.workingFiles = validDocuments && validDocuments.length ? validDocuments : node.workingFiles;
        node.set("valid_documents", validDocuments);
        node.set("wf_working_documents_count", node.workingFiles.length);
        node.set("wf_supporting_documents_count", 0);
        node.set("working_document_ids", _.map(node.workingFiles, function(workingFile) {
          return workingFile.get("id");
        }));
        return me._fetchProcessVariableConfig(node);
      }).then(function(config) {
        if (config) {
          var pageContent = config["page-content"];
          var form = MetadataConverter.convertConfig(pageContent);
          var pv = form.propertiesConfig[0].data.contentProcessVariables;
          if (Object.keys(pv).length > 0) {
            node.set("process-variables-dialog", config);
          }
        }
        return me._launchWizard(status, options);
      });
    },
    _launchWizard: function(status) {
      var deferred = $.Deferred(), action = this;
      require([ "d2/dialogs/launch.workflow/launch.workflow.dialog" ], function(LaunchWorkflowDialog) {
        var options = {
          command: action,
          node: status.node,
          status: status,
          connector: status.node.connector
        };
        var dialog = new LaunchWorkflowDialog(options);
        dialog.show().done(function() {
          action._blockActions(status.originatingView);
          action.performLaunchWorkflowAction(status, action, dialog).done(function() {
            action.refreshNodes(status).done(deferred.resolve).fail(deferred.reject);
          }).fail(deferred.reject);
        }).fail(deferred.reject);
      });
      return deferred.promise();
    },
    performLaunchWorkflowAction: function(status) {
      return $.ajax(status.node.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_WORKFLOWS),
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: this.getData(status)
      }));
    },
    refreshNodes: function(status) {
      var deferred = $.Deferred(), promises = [], widgetConfig = {};
      if (!utils.isMobile()) {
        if (status.collection && status.collection.options) {
          widgetConfig.widgetType = status.collection.widgetType;
          widgetConfig.widgetName = status.collection.options.widgetName;
          widgetConfig.isDisableLocationColumn = status.collection.options.isDisableLocationColumn;
        }
        _.each(status.node.workingFiles, function(workingFile) {
          var node = status.collection && status.collection.findWhere({
            id: workingFile.get("id")
          });
          if (!node) {
            node = status.nodes && status.nodes.findWhere({
              id: workingFile.get("id")
            });
          }
          if (status.collection instanceof VirtualDocumentChildren) {
            if (node) {
              const vdmList = VdocUtils.isVirtualDoc(node) ? VdocUtils.getVDMNumber(node) : VdocUtils.getParentVDMNumber(node);
              promises.push(status.collection.refresh({
                vdmNumber: vdmList
              }));
            }
          } else {
            node && promises.push(CommandHelper.refreshNode(node, widgetConfig));
          }
        });
      }
      if (promises.length) {
        $.whenAll.apply($, promises).always(deferred.resolve);
      } else {
        return deferred.resolve();
      }
      return deferred.promise();
    },
    getData: function(status) {
      var payload = {
        workflow_config_id: status.node.get("workflow_config_id"),
        supporting_document_ids: status.node.get("supporting_document_ids"),
        workflow_name: status.node.get("workflow_name"),
        workflow_note: status.node.get("workflow_note"),
        performer_aliases: status.node.get("performer_aliases"),
        process_variables: status.node.get("process_variables_form"),
        workflow_launch_date: status.node.get("workflow_launch_date"),
        workflow_launch_notification: status.node.get("workflow_launch_notification"),
        workflow_follow_up_date: status.node.get("workflow_follow_up_date"),
        packages: status.node.get("wf_packages")
      };
      payload = _.chain(payload).omit(_.isUndefined).omit(_.isNull).omit(function(value) {
        if (typeof value === "string") {
          return _.isEmpty(value);
        } else {
          return false;
        }
      }).value();
      return JSON.stringify(payload);
    },
    _showErrorMessage: function(status, errorMessage) {
      var originalAction = CommandHelper.getOriginalAction(status.node.workingFiles[0], this.get("signature"), status.data), actionWorkflowLabel = originalAction.get("commandData").dynamic === "true" ? originalAction.get("actionProperties").name : originalAction.get("commandData").config, workflowName = !_.isEmpty(status.node.get("workflow_name")) ? status.node.get("workflow_name") : _.str.sformat("{0} {1}", actionWorkflowLabel, new moment().format("D MMM YYYY HH:mm:ss")), nodes = [ status.node ], queueItems = nodes.map(function(item) {
        return {
          name: workflowName,
          state: "rejected",
          errorMessage: errorMessage,
          count: 1,
          total: 1,
          node: item
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: this.connector
      });
      nodeCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      GlobalMessage.showProgressPanel(nodeCollection, {
        oneFileFailure: lang.launchWorkflowFailMessage
      });
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    }
  });
});