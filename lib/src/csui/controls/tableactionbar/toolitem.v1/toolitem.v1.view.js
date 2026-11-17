/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "csui/controls/mixins/view.state/toolitems.state.mixin", "hbs!csui/controls/tableactionbar/toolitem.v1/impl/toolitem.v1.template", "css!csui/controls/tableactionbar/toolitem.v1/impl/toolitem.v1" ], function(_, Marionette, ToolItemsStateMixin, template) {
  "use strict";
  const ToolItemV1View = Marionette.View.extend({
    tagName: "div",
    className: "csui-toolitem csui-toolitem-v1-container",
    attributes: function() {
      const toolItemName = this.model.get("name");
      const signature = (this.model.get("signature") || "").toLowerCase();
      const attrs = {
        title: toolItemName,
        "aria-label": toolItemName,
        "data-csui-command": signature
      };
      if (signature === "add") {
        attrs["data-csui-addtype"] = this.model.get("commandData").type;
      }
      return attrs;
    },
    template: template,
    templateContext: function() {
      return {
        iconClass: this.model.get("icon")
      };
    },
    events: {
      click: "_handleClick",
      keydown: "onKeyInView"
    },
    initialize: function(options) {
      this.options = options || {};
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this._handleClick(event, true);
        return false;
      }
    }
  });
  _.extend(ToolItemV1View.prototype, ToolItemsStateMixin);
  return ToolItemV1View;
});