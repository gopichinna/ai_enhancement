/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "dctmw/pages/common/module.base.view", "dctmw/utils/authenticators/session" ], function($, ModuleBaseView, Session) {
  "use strict";
  var SignoutView = ModuleBaseView.extend({
    className: "module-signout-view",
    constructor: function SignoutView(options) {
      options = options || {};
      this.session = Session.get();
      SignoutView.__super__.constructor.call(this, options);
    },
    onActivated: function() {
      this.isActive = true;
      if (!this.loading) {
        this.loading = $.Deferred();
        var failureHandler = function(error) {
          this.loading && this.loading.reject();
          delete this.loading;
          this.session.trigger("error", error);
        }.bind(this);
        require([ "dctmw/overrides/overrides", "csui/utils/non-emptying.region/non-emptying.region", "dctmw/pages/signout/impl/signout.view" ], function(ov, NonEmptyingRegion, SignoutViewImpl) {
          this.signoutView = new SignoutViewImpl();
          new NonEmptyingRegion({
            el: this.el
          }).show(this.signoutView);
          this.ui.loaderIcon.remove();
          this.loading.resolve();
        }.bind(this), failureHandler);
      }
    },
    onDeactivated: function() {
      this.isActive = false;
    }
  });
  return SignoutView;
});