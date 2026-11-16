/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/commands/create.file", "nuc/models/node/node.model", "d2/controls/globalmessage/globalmessage", "nuc/utils/url", "nuc/models/nodes", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/creation.utils", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "d2/models/creation.profile" ], function(require, _, $, Backbone, CreateFileCommand, NodeModel, GlobalMessage, Url, NodesCollection, CommandHelper, lang, NodeCreationSuccessMessageView, RestResources, utils, CreationUtils, nodeConverter, RestLinkrels, CreationProfileModel) {
  "use strict";
  var CommandLinkedDocCreate = CreateFileCommand.extend({
    defaults: {
      signature: "D2-CreateLinkedDoc",
      scope: "single"
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this;
      me.done = false;
      options = options || {};
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      me.linkConfig = status.linkConfig;
      me.parentNode = status.parentNode;
      me.isLinkedDoc = true;
      var profile = new CreationProfileModel({
        links: me.linkConfig.get("links")
      }, {
        connector: status.parentNode.connector
      });
      profile.fetch().done(function() {
        profile.set({
          inheritanceHidden: true
        });
        status.profile = profile;
        me.openWizard(status, options).done(deferred.resolve).fail(deferred.reject);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    onCancel: function() {
      return CreationUtils.showCancelAlertForImport.call(this, lang.CreateLinkedDocCancelAlertMessage, "", lang.CreateCancelAlertButtonLabelYes);
    },
    showSuccessAndClose: function(node, status, wizard) {
      var me = this;
      me._announceOperationEnd(wizard, status);
      node.linkedDocument = true;
      CreationUtils.createLinkDocumentRelations(me.parentNode, node, me.linkConfig).done(function() {
        var linkRels = node.get("links");
        CommandHelper.refreshNode(node).done(function() {
          node.set("links", linkRels);
          status.linkConfig.set("node", node);
          if (wizard && !wizard.isDestroyed) {
            wizard.close({
              success: true,
              newNode: node
            });
          }
        }).fail(function(xhr, status, err) {
          GlobalMessage.showMessage("error", lang.ObjectFetchFailed, err);
        });
      }).fail(function(error) {
        error.responseJSON = error.responseJSON || {};
        GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
        if (wizard && !wizard.isDestroyed) {
          wizard.close({
            success: false,
            error: error
          });
        }
      });
    },
    _getSourceContentNode: function() {
      return undefined;
    }
  });
  return CommandLinkedDocCreate;
});