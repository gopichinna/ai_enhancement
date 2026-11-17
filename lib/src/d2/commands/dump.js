/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "nuc/utils/url", "nuc/utils/base", "csui/utils/command.error", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/controls/globalmessage/globalmessage", "dctmw/server.adaptors/converters/node", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, CommandModel, Url, base, CommandError, ConnectorFactory, CommandHelper, RestLinkrels, RestResources, GlobalMessage, nodeConverter, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Dump",
      command_key: "D2-Dump",
      name: lang.CommandNameDump,
      scope: "single"
    },
    enabled: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      if (!this.doesUserHavePermission()) {
        return false;
      }
      if (nodes && nodes.length > 1) {
        return false;
      }
      return CommandModel.prototype.enabled.call(this, status, options);
    },
    doesUserHavePermission: function() {
      return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_DUMP);
    },
    execute: function(status) {
      var me = this, deferred = $.Deferred(), connector = status.context.getObject(ConnectorFactory), fail = function(error) {
        me._unblockActions();
        if (error) {
          error = new base.Error(error);
          GlobalMessage.showMessage("error", error.message, error.errorDetails);
        }
        deferred.reject();
      };
      this._blockActions(status);
      me._loadDumpData({
        url: me.getUrl(status),
        connector: connector
      }).done(function(data) {
        require([ "d2/dialogs/dump/dump.dialog.view" ], function(DumpDialogView) {
          var dialog = new DumpDialogView({
            data: data,
            status: status
          });
          dialog.on("render", function() {
            me._unblockActions(status);
            deferred.resolve();
          });
          dialog.show();
        }, fail);
      }).fail(fail);
      return deferred.promise();
    },
    _loadDumpData: function(options) {
      var deferred = $.Deferred();
      $.ajax(options.connector.extendAjaxOptions({
        url: options.url,
        success: function(response) {
          var output = {
            data: {}
          };
          if (response) {
            output.data = _.omit(response, "links");
          }
          deferred.resolve(output);
        },
        error: function(xhr, status, error) {
          deferred.reject(xhr, status, error);
        }
      }));
      return deferred.promise();
    },
    getUrl: function(status) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_DUMP);
      var objectId = this.getObjectId(status);
      if (objectId) {
        var qParams = {
          "object-id": objectId,
          "include-d2config": true
        };
        if (url) {
          url = Url.appendQuery(url, Url.combineQueryString(qParams));
        }
      }
      return url;
    },
    getObjectId: function(status) {
      var objectId = "";
      var node = CommandHelper.getAtLeastOneNode(status).at(0);
      if (node && node.get("type") !== undefined && !nodeConverter.isNonDCTMNode(node)) {
        objectId = node.get("id");
      }
      return objectId;
    },
    _blockActions: function(status) {
      if (status && status.originatingView && status.originatingView.blockActions) {
        status.originatingView.blockActions();
      } else {
        $("div.load-container.csui-global").removeClass("binf-hidden");
      }
    },
    _unblockActions: function(status) {
      if (status && status.originatingView && status.originatingView.unblockActions) {
        status.originatingView.unblockActions();
      } else {
        $("div.load-container.csui-global").addClass("binf-hidden");
      }
    }
  });
});