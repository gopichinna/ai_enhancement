/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/behaviors/resizable/resizable.behavior" ], function(_, $, Backbone, Marionette, ResizableBehavior) {
  "use strict";
  var MetadataNavigationListBehavior = Marionette.Behavior.extend({
    constructor: function MetadataNavigationListBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      _.extend(view, {
        onBeforeShow: function() {
          this._showChildViews();
        },
        onShow: function() {
          this._showScrollPosition();
        },
        onBeforeDestroy: function() {
          if (this.mdv && this.mdv.internal) {
            this.mdv.destroy();
          }
          if (this.mdn) {
            this.mdn.destroy();
          }
        },
        _showChildViews: function() {
          this.navigationRegion.show(this.mdn);
          let self = this;
          this.triggerMethod("dynamicDomLoaded", this.navigationRegion.$el, this);
          if (this.model && (this.model.get("type") === 2 || this.model.get("generationNode") || (this.model.get("type") === 1 || this.model.get("shortcutNode")))) {
            this.mdv.options.actionsPromise.always(function() {
              self.contentRegion.show(self.mdv);
            });
          } else {
            this.contentRegion.show(this.mdv);
          }
        },
        _showScrollPosition: function() {
          if (this.initiallySelected instanceof Backbone.Model) {
            var index = this.mdn.collection.findIndex({
              id: this.initiallySelected.get("id")
            });
            (index < 0 || index > this.mdn.collection.length - 1) && (index = 0);
            return this.mdn.setSelectedIndex(index);
          } else if (this.initiallySelected && this.initiallySelected.length > 0) {
            var firstSelected = this.initiallySelected.models[0];
            var selIndex = this.mdn.collection.indexOf(firstSelected);
            if (selIndex === -1) {
              selIndex = this.mdn.collection.findIndex({
                id: firstSelected.get("id")
              });
            }
            this.mdn.setSelectedIndex(selIndex);
          } else {
            if (this.mdn.collection.models.length > 0) {
              this.mdn.setSelectedIndex(0);
            }
          }
        }
      });
    }
  });
  return MetadataNavigationListBehavior;
});