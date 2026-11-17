/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "i18n!dctmw/pages/app/impl/nls/lang", "hbs!dctmw/pages/app/impl/module.error", "css!dctmw/pages/app/impl/module.error" ], function(_, Marionette, lang, template) {
  "use strict";
  var ModuleErrorView = Marionette.LayoutView.extend({
    className: "module-error",
    template: template,
    constructor: function ModuleErrorView(options) {
      options = options || {};
      ModuleErrorView.__super__.constructor.call(this, options);
    },
    templateHelpers: function() {
      return _.defaults({}, this.options, {
        errorMsg: lang.defaultModuleErrorMessage
      });
    }
  });
  return ModuleErrorView;
});