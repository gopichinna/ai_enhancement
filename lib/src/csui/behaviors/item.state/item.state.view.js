/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/behaviors/item.state/impl/item.state" ], function(_, Marionette, template) {
  "use strict";
  var ItemStateView = Marionette.ItemView.extend({
    className: "csui-item-state",
    template: template,
    constructor: function ItemStateView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change:state", this.render).listenTo(this, "render", this._updateClasses);
    },
    serializeData: function() {
      return _.extend(this.model.toJSON(), {
        message: this.options.stateMessages[this.model.get("state")]
      });
    },
    _updateClasses: function() {
      this.$el.removeClass("csui-state-loading csui-state-failed").addClass("csui-state-" + this.model.get("state"));
    }
  });
  return ItemStateView;
});