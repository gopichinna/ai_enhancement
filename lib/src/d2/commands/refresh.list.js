/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandModel, GlobalMessage, utils, lang) {
  "use strict";
  var RefreshList = CommandModel.extend({
    defaults: {
      signature: "D2-RefreshList",
      name: lang.CommandNameRefreshList,
      scope: "single"
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      if (status.toolItem && status.toolItem.get("suppressFailMessage")) {
        status.suppressFailMessage = true;
      }
      status.originatingView && status.originatingView.trigger("before:refresh:list:data");
      status.collection.fetch(_.extend({}, options, {
        reload: true,
        skipSWCache: true
      })).done(function() {
        status.originatingView && status.originatingView.trigger("refresh:list:data");
        deferred.resolve();
      }).fail(function(error) {
        if (status.suppressFailMessage !== true) {
          var msg = error.message || error;
          if (error && error.responseText) {
            msg = utils.parseAjaxErrorAsString(error);
          }
          if (msg) {
            GlobalMessage.showMessage("error", msg);
          }
        }
        deferred.reject();
      });
      return deferred.promise();
    }
  });
  return RefreshList;
});