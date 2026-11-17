/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/marionette", "csui/widgets/metadata/metadata.view" ], function(require, _, Marionette) {
  "use strict";
  require([ "csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view" ], function(CSMetadataDropdownMenuView) {
    var origOnRender = CSMetadataDropdownMenuView.prototype.onRender, origRenderChildren = CSMetadataDropdownMenuView.prototype._renderChildren;
    CSMetadataDropdownMenuView.prototype.onRender = function() {
      if (this.options.toolItems.collection.length && !this.collection.length && this.model.commands) {
        if (this.model.get("d2ObjectDataFetched") === true && this.model.actions && this.model.actions.length > 0) {
          this._updateMenuItems();
          return;
        }
      }
      this.listenTo(this.model.actions, "update", updateToolbarCollection.bind(this));
      return origOnRender.apply(this, arguments);
    };
    CSMetadataDropdownMenuView.prototype._renderChildren = function() {
      let childViewContainer = Marionette.getOption(this, "childViewContainer");
      if (childViewContainer && this.$el?.find(childViewContainer).length === 0) {
        return;
      }
      return origRenderChildren.apply(this, arguments);
    };
    function updateToolbarCollection() {
      if (this.fetchingNonPromotedActions === false) {
        var me = this;
        setTimeout(function() {
          me.collection.refilter && me.collection.refilter();
        }, 301);
      } else {
        setTimeout(updateToolbarCollection.bind(this));
      }
    }
  });
});