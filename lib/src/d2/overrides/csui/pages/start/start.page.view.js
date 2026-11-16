/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/pages/start/start.page.view", "csui/utils/contexts/factories/connector", "d2/utils/contexts/context.controller", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/commands/dump", "d2/utils/show.dump/dump.keyboard.capture" ], function($, _, StartPageView, ConnectorFactory, D2ContextController, RestResources, utils, DumpCommand, DumpKeyboardCapture) {
  "use strict";
  var prototype = StartPageView.prototype, oldOnRender = prototype.onRender;
  _.extend(prototype, {
    onRender: function() {
      if (this.context) {
        D2ContextController.init(this.context);
        var dumpCommand = new DumpCommand();
        if (dumpCommand.doesUserHavePermission()) {
          DumpKeyboardCapture.init(this.context);
        }
        var connector = this.context.getObject(ConnectorFactory);
        connector.authenticator.off("loggedOut");
        connector.authenticator.on("loggedOut", function(args) {
          if (args.reason === "failed") {
            var redirectUrl = RestResources.getD2Options().logout_redirect_url;
            if (redirectUrl) {
              utils.openUrlInWindow(redirectUrl);
            } else {
              this._navigateToSignIn();
            }
          }
        }, this);
      }
      $(".d2-init-loader-container").remove();
      oldOnRender.apply(this, arguments);
    }
  });
});