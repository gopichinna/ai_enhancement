/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/controls/version.control.dialog/impl/version.control.dialog.header", "smart/themes/theming", "csui/themes/csui.jato.status.icons", "css!csui/controls/version.control.dialog/impl/version.control.dialog" ], function(_, Marionette, VersionControlHeaderTemplate, theming, csuiStatusIcons) {
  "use strict";
  var VersionControlHeaderView = Marionette.ItemView.extend({
    template: VersionControlHeaderTemplate,
    templateHelpers: function() {
      return {
        title: this.options.title,
        isJATO: theming.isJATOTheme(),
        statusInfo: csuiStatusIcons.statusInfo
      };
    },
    constructor: function VersionControlHeaderView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return VersionControlHeaderView;
});