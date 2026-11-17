/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/behaviors/keyboard.navigation/tabables.behavior", "dctmw/pages/common/module.base.view", "dctmw/utils/authenticators/session" ], function($, TabablesBehavior, ModuleBaseView, Session) {
  "use strict";
  var D2EmbeddedView = ModuleBaseView.extend({
    className: "module-d2-embed-view",
    ui: {
      loaderIcon: ">.d2-init-loader-outer-border"
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },
    constructor: function D2EmbeddedView(options) {
      options = options || {};
      this.session = Session.get();
      D2EmbeddedView.__super__.constructor.call(this, options);
    },
    defaultViewState: function() {
      this.embedder && this.embedder.reload();
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
        require([ "dctmw/overrides/overrides", "dctmw/utils/startup" ], function(ov, startup) {
          require([ "d2/integration/embedder" ], function(embedder) {
            require([ "d2/overrides/d2.core.overrides", "d2/overrides/d2.desktop.overrides" ], function() {
              embedder.init().done(function() {
                startup.beforeStartup(this.options).done(function() {
                  this.ui.loaderIcon.remove();
                  this.loading.resolve();
                  this.$el.append('<div class="d2-embed-container"></div>');
                  this.embedder = embedder;
                  if (this.isActive) {
                    embedder.embed();
                  }
                }.bind(this)).fail(failureHandler);
              }.bind(this)).fail(failureHandler);
            }.bind(this), failureHandler);
          }.bind(this), failureHandler);
        }.bind(this), failureHandler);
      }
    },
    onDeactivated: function() {
      this.isActive = false;
    }
  });
  return D2EmbeddedView;
});