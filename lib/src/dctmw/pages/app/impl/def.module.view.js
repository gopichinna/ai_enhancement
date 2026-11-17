/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/pages/common/module.base.view", "dctmw/utils/client.location", "dctmw/utils/authenticators/session" ], function(_, ModuleBaseView, clientLocation, Session) {
  "use strict";
  function getDefaultURLFragment(session) {
    let appPageUrl = session.connector.authenticator.getAppPageUrl();
    let hashIndex = appPageUrl.indexOf("#");
    if (hashIndex !== -1) {
      appPageUrl = appPageUrl.substring(hashIndex + 1);
    }
    return appPageUrl;
  }
  var ApplicationView = ModuleBaseView.extend({
    constructor: function ApplicationView(options) {
      options = options || {};
      this.session = Session.get();
      this.defaultUrlFragment = getDefaultURLFragment(this.session);
      ApplicationView.__super__.constructor.call(this, options);
      this.listenToOnce(this.session, "error", function() {
        this.ui.loaderIcon.remove();
      }.bind(this));
    },
    defaultViewState: function(fragment) {
      if (!fragment || _.isString(fragment) && fragment.startsWith(this.defaultUrlFragment)) {
        clientLocation.navigate(this.defaultUrlFragment, {
          trigger: true,
          replace: true
        });
      } else {
        clientLocation.navigate([ this.defaultUrlFragment, fragment ].join("/"), {
          trigger: true,
          replace: true,
          keepHashParams: true
        });
      }
    }
  });
  return ApplicationView;
});