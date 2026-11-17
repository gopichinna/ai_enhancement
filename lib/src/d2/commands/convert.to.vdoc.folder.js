/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/models/creation.profile", "csui/models/command", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "nuc/utils/url", "nuc/models/nodes", "d2/dialogs/new.file/create/template", "i18n!d2/commands/nls/localized.strings", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/creation.utils", "d2/utils/vdoc.creation.utils", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "d2/utils/constants", "csui/utils/commandhelper" ], function(require, _, $, Backbone, CreationProfileModel, CommandModel, NodeModel, NodeChildren2Collection, GlobalMessage, NodeCommand, Url, NodesCollection, Template, lang, NodeCreationSuccessMessageView, RestResources, utils, CreationUtils, VdocCreationUtils, nodeConverter, RestLinkrels, constants, CommandHelper) {
  "use strict";
  var ConvertToVDocFolder = CommandModel.extend({
    defaults: {
      signature: "D2-ConvertToVDocFolder",
      command_key: "D2-ConvertToVDocFolder",
      name: lang.CommandNameConvertToVDoc,
      verb: lang.CommandNameConvertToVDoc,
      scope: "single"
    },
    STEPS: Object.freeze({
      CREATE_TYPE: "custom_type",
      PROPERTIES: "properties"
    }),
    enabled: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      if (node && (node.get("rIsVirtualDoc") === false || node.get("r_is_virtual_doc") === 0)) {
        return NodeCommand.prototype.enabled.call(this, status, options);
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
      if (_.isUndefined(status.node)) {
        me.openWizard(status, options).done(function(data) {
          deferred.resolve(data);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        this.createFile(status.node, status).done(deferred.resolve).fail(deferred.reject);
      }
      return deferred.promise();
    },
    createFile: function(nodeModel, status) {
      var me = this;
      var dfd = $.Deferred();
      var folderNode = CommandHelper.getJustOneNode(status);
      CreationUtils.createObject(nodeModel, "create").done(function() {
        VdocCreationUtils.convertToVDoc(nodeModel, me.get("signature"), folderNode).done(function() {
          me.done = true;
          dfd.resolve(nodeModel);
        }).fail(function(error) {
          dfd.reject(error);
        });
      }).fail(function(error) {
        dfd.reject(error);
      });
      return dfd.promise();
    },
    openWizard: function(status, options) {
      var deferred = $.Deferred();
      var me = this;
      options.action = this;
      options.mode = "create";
      require([ "d2/dialogs/convert.vdoc.folder/vdoc.creation.dialog" ], function(VdocCreationDialog) {
        var dialog = new VdocCreationDialog(status, options);
        dialog.showWizard().done(function(data) {
          var node = data;
          me.refreshNodeList(data, status).done(function() {
            me._showMsg(status, node, lang.ConvertToVirtualDocumentFolderSuccessMessage, !me.isNodePresentInCurrentContainer(node, status));
            if (me.isNodePresentInCurrentContainer(node, status)) {
              node.isLocallyCreated = true;
              node.collection = status.collection;
              status.collection && status.collection.unshift(node);
            }
            deferred.resolve();
          }).fail(function(error) {
            me._errorMessage(new Error(lang.ConvertToVirtualDocumentErrorRefreshMessage));
            deferred.reject(error);
          });
        }).fail(function(error) {
          if (!error.isCancelled) {
            me._errorMessage(error);
          }
          deferred.reject(error);
        });
      });
      deferred.promise();
    },
    _errorMessage: function(err) {
      if (!err.message) {
        GlobalMessage.showMessage("error", lang.ConvertToVirtualDocumentErrorMessage, err.responseJSON ? err.responseJSON.message ? err.responseJSON.message : err.responseJSON.details : undefined);
      } else {
        GlobalMessage.showMessage("error", err.message, err.responseJSON ? err.responseJSON.details : undefined);
      }
    },
    _showMsg: function(status, node, msg, showLink) {
      GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
        showLink: showLink,
        node: node,
        context: status.context,
        successMessageFormat: msg,
        linkLabel: lang.ConvertToVirtualDocumentFolderDoneCommandLabel,
        originatingView: status.originatingView,
        link_command_signature: "D2-GoToLocation"
      });
    },
    isNodePresentInCurrentContainer: function(node, status) {
      var parentIds = node.get("i_folder_id");
      return status.container && _.contains(parentIds, status.container.get("id"));
    },
    refreshNodeList: function(node, status) {
      var widgetConfig = {};
      var deferred = $.Deferred();
      if (status.collection && status.collection.options) {
        widgetConfig.widgetType = status.collection.widgetType;
        widgetConfig.widgetName = status.collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = status.collection.options.isDisableLocationColumn;
      }
      CommandHelper.refreshNode(node, widgetConfig).done(function() {
        deferred.resolve();
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    }
  });
  return ConvertToVDocFolder;
});