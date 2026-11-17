/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "csui/utils/url", "csui/utils/commandhelper", "csui/models/command", "json!csui/utils/commands/open.types.json", "i18n!csui/utils/commands/nls/localized.strings" ], function(require, module, _, $, base, Url, CommandHelper, CommandModel, openMimeTypes, lang) {
  "use strict";
  var config = _.extend({
    forceDownloadMimeTypes: [ "text/html" ],
    mimeTypesForOpen: openMimeTypes.mimeTypesForOpen,
    officeMimeTypes: openMimeTypes.officeMimeTypes,
    forceDownloadForAll: false
  }, require.moduleConfig("csui/utils/commands/open"));
  config.mimeTypesForOpen = _.invoke(config.mimeTypesForOpen, "toLowerCase");
  config.officeMimeTypes = _.invoke(config.officeMimeTypes, "toLowerCase");
  config.forceDownloadForMimeTypes = _.invoke(config.forceDownloadForMimeTypes, "toLowerCase");
  config.mimeTypesForOpen = _.chain(config.mimeTypesForOpen).unique().invoke("toLowerCase").value();
  var OpenDocumentInBrowser = CommandModel.extend({
    defaults: {
      signature: "OpenInBrowser",
      command_key: [ "OpenInBrowser" ],
      scope: "single",
      name: lang.CommandNameBrowserDefaultAction
    },
    enabled: function(status) {
      var node = CommandHelper.getJustOneNode(status), mimeType = node && node.get("mime_type");
      if (node && node.get("openable") !== false && mimeType) {
        mimeType = mimeType.toLowerCase();
        const isForceDownloadDisabled = config.forceDownloadForMimeTypes.indexOf(mimeType) === -1;
        if (node.get("rendition_type") && isForceDownloadDisabled) {
          return true;
        }
        return base.isAppleMobile() || config.mimeTypesForOpen.indexOf(mimeType) >= 0 && isForceDownloadDisabled;
      }
    },
    execute: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      return this._openDocument(node);
    },
    _openDocument: function(node) {
      var connector = node.connector, cgiUrl = new Url(connector.connection.url).getCgiScript(), openTarget = "_self";
      var query = {
        func: "doc.fetchcsui",
        nodeid: node.get("id")
      };
      var versionNumber = node.get("version_number");
      if (!!versionNumber) {
        query.vernum = versionNumber;
      }
      if (_.indexOf(config.forceDownloadMimeTypes, node.get("mime_type")) === -1) {
        openTarget = "_blank";
      }
      var downloadUrl = Url.appendQuery(cgiUrl, Url.combineQueryString(query));
      var deferred = $.Deferred();
      var content = config.openInNewTab === false ? window : window.open("");
      require([ "csui/utils/open.authenticated.page" ], function(openAuthenticatedPage) {
        openAuthenticatedPage(connector, downloadUrl, {
          window: content,
          openInNewTab: config.openInNewTab
        }).then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    }
  });
  return OpenDocumentInBrowser;
});