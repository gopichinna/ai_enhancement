/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "dctmw/utils/utils", "hbs!dctmw/pages/common/impl/module.base", "smart/bundles/otwc/icons_action" ], function(Marionette, TabablesBehavior, utils, template) {
  "use strict";
  var ModuleBaseView = Marionette.LayoutView.extend({
    className: function() {
      var clazz = "d2-init-loader-container";
      if (utils.isMobile()) {
        clazz += " d2-mob";
      }
      return clazz;
    },
    template: template,
    ui: {
      loaderIcon: ">.d2-init-loader-outer-border"
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },
    constructor: function ModuleBaseView(options) {
      options = options || {};
      ModuleBaseView.__super__.constructor.call(this, options);
    },
    defaultViewState: function() {}
  });
  return ModuleBaseView;
});