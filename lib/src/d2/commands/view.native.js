/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commandhelper", "d2/commands/open", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandHelper, OpenCommand, RestLinkrels, lang) {
  "use strict";
  var ViewNativeCommand = OpenCommand.extend({
    defaults: {
      signature: "D2-ViewNative",
      command_key: "D2-ViewNative",
      name: lang.CommandNameViewNativeContent,
      scope: "single"
    },
    getDownloadLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature"));
    },
    fetchDownloadUrls: function() {
      var deferred = $.Deferred(), cdStr = "&content_disposition=inline";
      OpenCommand.prototype.fetchDownloadUrls.apply(this, arguments).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount) {
        var updatedUrls = _.map(downloadUrls, function(url) {
          if (url.indexOf(cdStr) < 0) {
            url += cdStr;
          }
          return url;
        });
        deferred.resolve(updatedUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount);
      }).fail(function() {
        deferred.reject.apply(deferred, arguments);
      });
      return deferred.promise();
    }
  });
  return ViewNativeCommand;
});