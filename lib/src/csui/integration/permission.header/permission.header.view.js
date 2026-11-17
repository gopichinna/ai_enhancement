/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "i18n!csui/integration/permission.header/impl/nls/lang", "hbs!csui/integration/permission.header/impl/permission.header", "css!csui/integration/permission.header/impl/permission.header" ], function(module, _require, $, _, Marionette, lang, template) {
  "use strict";
  var PermissionHeaderView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        lblSecurityClearance: lang.lblSecurityClearance,
        lblSupplementalMarkings: lang.lblSupplementalMarkings
      };
    },
    constructor: function PermissionHeaderView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
  return PermissionHeaderView;
});