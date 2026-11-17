/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/url", "csui/models/command", "csui/utils/commandhelper", "csui/utils/node.links/node.links", "smart/controls/icons.v2/icons.v2", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, _, $, Url, CommandModel, CommandHelper, NodeLinks, IconRegistry, lang) {
  "use strict";
  var config = _.extend({}, module.config());
  var CopyLinkCommand = CommandModel.extend({
    defaults: {
      signature: "CopyLink",
      name: lang.CommandNameCopyLink
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status);
      return !!node;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), self = this;
      require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        self._copyToClipboard(status, options).done(function() {
          deferred.resolve();
          GlobalMessage.showMessage("success", lang.CopyLinkSuccessMessage);
        }).fail(function() {
          deferred.reject();
          GlobalMessage.showMessage("error", lang.CopyLinkFailMessage);
        });
      }, deferred.reject);
      return deferred.promise();
    },
    _copyToClipboard: function(status, options) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), connector = node.connector || options.connector, classicUrl = new Url(connector.connection.url).getCgiScript(), urlOptions = {
        context: status.context
      }, nodeLink = status.url ? NodeLinks.completeUrl(node, status.url, urlOptions) : NodeLinks.getUrl(node, urlOptions), nodeLinkHtml;
      var downloadHtml = node.get("type") !== 144 || !config.enableDownload ? "" : ' | <a href="' + classicUrl + "?func=doc.fetchcsui&nodeid=" + node.get("id") + '&action=download">' + lang.CommandNameDownload + "</a>";
      function listener(e) {
        try {
          e.clipboardData.setData("text/plain", nodeLink);
          if (config.enableRichText) {
            e.clipboardData.setData("text/html", nodeLinkHtml + downloadHtml);
          }
          deferred.resolve();
        } catch (err) {
          deferred.reject(err);
        }
        e.preventDefault();
      }
      if (window.clipboardData) {
        window.clipboardData.setData("Text", nodeLink);
        return deferred.resolve();
      } else {
        nodeLinkHtml = '<a href="' + nodeLink + '">' + node.get("name") + "</a>";
        if (config.disableClipboardAPI || window.ClipboardItem === undefined || navigator.clipboard === undefined) {
          const sel = document.getSelection();
          let range = document.createRange();
          let cellNode = document.querySelector(".csui-table-cell-name") || document.querySelector(".list-item-title");
          if (cellNode) {
            range.selectNodeContents(cellNode);
            sel.addRange(range);
          }
          document.addEventListener("copy", listener);
          try {
            document.execCommand("copy");
          } catch (err) {
            deferred.reject(err);
          }
          document.removeEventListener("copy", listener);
        } else {
          if (config.enableRichText) {
            const clipboardItem = new ClipboardItem({
              "text/plain": new Blob([ nodeLink ], {
                type: "text/plain"
              }),
              "text/html": new Blob([ nodeLinkHtml + downloadHtml ], {
                type: "text/html"
              })
            });
            navigator.clipboard.write([ clipboardItem ]).then(function() {
              deferred.resolve();
            }, function(err) {
              deferred.reject(err);
            });
          } else {
            navigator.clipboard.writeText(nodeLink).then(function() {
              deferred.resolve();
            }, function(err) {
              deferred.reject(err);
            });
          }
        }
        return deferred.promise();
      }
    }
  });
  return CopyLinkCommand;
});