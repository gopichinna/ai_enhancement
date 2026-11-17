/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/models/commands", "i18n!dctmw/commands/nls/lang", "dctm-ext!dctmw/commands/open.delegates" ], function(_, $, CommandModel, CommandCollection, lang, extOpenDelegates) {
  "use strict";
  const delegates = new CommandCollection();
  if (extOpenDelegates) {
    delegates.add(_.chain(extOpenDelegates).flatten(true).map(Command => new Command()).value());
  }
  const CMDOpen = CommandModel.extend({
    defaults: {
      signature: "D4-Open",
      command_key: [ "default", "open", "D4-Open" ],
      name: lang.CommandNameOpen,
      scope: "single"
    },
    enabled(status, options) {
      let retVal = CommandModel.prototype.enabled.call(this, status, options);
      if (retVal) {
        retVal = delegates.any(d => d.enabled(status, options));
      }
      return retVal;
    },
    execute(status, options) {
      const delegate = delegates.find(d => d.enabled(status, options));
      if (delegate) {
        return delegate.execute(status, options);
      }
      return $.Deferred().reject("No appropriate delegate").promise();
    }
  });
  return CMDOpen;
});