/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(Backbone, lang) {
  "use strict";
  var ShortcutViewModel = Backbone.Model.extend({
    defaults: {
      icon: "icon-default",
      name: lang.loadingText,
      error: ""
    },
    constructor: function ShortcutViewModel(attr, options) {
      return Backbone.Model.prototype.constructor.call(this, attr, options);
    }
  });
  return ShortcutViewModel;
});