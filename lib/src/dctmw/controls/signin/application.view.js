/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette" ], function(Marionette) {
  "use strict";
  var ApplicationItemView = Marionette.ItemView.extend({
    tagName: "option",
    className: "signin-option",
    template: false,
    onRender: function() {
      var name = this.model.get("applicationName"), label = this.model.get("applicationLabel");
      this.$el.text(label || name);
      this.$el.val(name);
    }
  });
  return ApplicationItemView;
});