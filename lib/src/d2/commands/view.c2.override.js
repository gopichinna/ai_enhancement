/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commandhelper", "d2/commands/open", "d2/utils/constants", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandHelper, OpenCommand, constants, RestLinkrels, lang) {
  "use strict";
  return OpenCommand.extend({
    defaults: {
      signature: "D2-ViewC2Override",
      command_key: "D2-ViewC2Override",
      name: lang.CommandNameViewC2Override,
      scope: "single",
      skipPreview: true
    },
    enabled: function(status) {
      if (!OpenCommand.prototype.enabled.apply(this, arguments)) {
        return false;
      }
      var node = CommandHelper.getJustOneNode(status);
      return _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL ], node.get("type"));
    },
    getDownloadLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature")) + "?c2_override=true";
    },
    fetchDownloadUrls: function() {
      var deferred = $.Deferred(), cdStr = "&content_disposition=inline";
      OpenCommand.prototype.fetchDownloadUrls.apply(this, arguments).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
        var updatedUrls = _.map(downloadUrls, function(url) {
          if (url.indexOf(cdStr) < 0) {
            url += cdStr;
          }
          return url;
        });
        deferred.resolve(updatedUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath);
      }).fail(function() {
        deferred.reject(arguments);
      });
      return deferred.promise();
    }
  });
});