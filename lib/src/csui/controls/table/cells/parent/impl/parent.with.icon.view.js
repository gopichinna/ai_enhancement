/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/node.links/node.links", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/table/cells/parent/impl/parent.base.view", "hbs!csui/controls/table/cells/parent/impl/parent.with.icon", "css!csui/controls/table/cells/parent/impl/parent.with.icon" ], function(_, nodeLinks, NodeTypeIconView, ParentBaseView, template) {
  "use strict";
  var ParentIconView = ParentBaseView.extend({
    template: template,
    className: "csui-parent-location",
    triggers: {
      "click a.csui-parent-name": "cell:node:request"
    },
    events: {
      "click span.csui-icon-group": "_triggerEvent"
    },
    _triggerEvent: function() {
      this.trigger("cell:node:request");
    },
    templateHelpers: function() {
      var name = this.model.get("name");
      var defaultActionUrl = nodeLinks.getUrl(this.model);
      var type_name = this.model.get("type_name");
      return {
        name: name,
        defaultActionUrl: defaultActionUrl,
        link_label: `${name}, ${type_name}`
      };
    },
    constructor: function ParentIconView(options) {
      options || (options = {});
      ParentBaseView.prototype.constructor.apply(this, arguments);
      this.iconView = new NodeTypeIconView({
        node: this.model,
        size: options.size
      });
    },
    onRender: function() {
      if (this.model.get("name")) {
        this.iconView.render();
        this.$el.prepend(this.iconView.$el);
      }
      if (this.options.inactive) {
        this.$el.addClass("csui-inactive ").css("cursor", "default");
      }
    }
  });
  return ParentIconView;
});