/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/node-type.icon/node-type.icon.view", "dctmw/controls/list/listitem.type.model.view" ], function(_, NodeTypeIconView, ListItemTypeModelView) {
  "use strict";
  var ListItemTypeNodeView = ListItemTypeModelView.extend({
    constructor: function ListItemTypeNodeView(options) {
      options = options || {};
      ListItemTypeNodeView.__super__.constructor.call(this, options);
      this.model && this.listenTo(this.model, "sync", this.updateObjectTitle);
    },
    onRender: function() {
      var supOnRender = ListItemTypeNodeView.__super__.onRender;
      _.isFunction(supOnRender) && supOnRender.apply(this, arguments);
      if (!this._nodeIconView) {
        this._nodeIconView = new NodeTypeIconView({
          el: this.$(".csui-type-icon").get(0),
          node: this.model
        });
        this.listenTo(this.model, "sync", function() {
          if (this._nodeIconView && !this._nodeIconView.isDestroyed) {
            this._nodeIconView.model._updateModelFromNode();
            this._nodeIconView?.render();
          }
        });
      }
      this._nodeIconView.render();
    },
    onBeforeDestroy: function() {
      var supOnBeforeDestroy = ListItemTypeNodeView.__super__.onBeforeDestroy;
      _.isFunction(supOnBeforeDestroy) && supOnBeforeDestroy.apply(this, arguments);
      if (this._nodeIconView) {
        this._nodeIconView.model.stopListening(this.model);
        this._nodeIconView.destroy();
        delete this._nodeIconView;
      }
    },
    updateObjectTitle: function() {
      var title = this.model.get("name");
      this.$(".list-item-title").text(title);
      this.$(".list-item-title").attr("title", title).attr("aria-label", title);
    }
  });
  return ListItemTypeNodeView;
});