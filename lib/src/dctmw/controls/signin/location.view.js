/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette" ], function(Marionette) {
  "use strict";
  var LocationItemView = Marionette.ItemView.extend({
    tagName: "option",
    className: "signin-option",
    template: false,
    onRender: function() {
      var locationName = this.model.get("network_name"), locationId = this.model.get("id");
      this.$el.text(locationName);
      this.$el.val(locationId);
    }
  });
  return LocationItemView;
});