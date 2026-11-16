/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "csui/widgets/metadata/metadata.view" ], function(require, _) {
  "use strict";
  require([ "csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view" ], function(CSMetadataDropdownMenuView) {
    var origOnRender = CSMetadataDropdownMenuView.prototype.onRender;
    CSMetadataDropdownMenuView.prototype.onRender = function() {
      var me = this;
      if (this.options.toolItems.collection.length && !this.collection.length && this.model.commands) {
        if (!this.model.get("csuiLazyActionsRetrieved")) {
          if (!this.model.commands.length) {
            this.model.commands.splice.apply(this.model.commands, [ 0, 0 ].concat(this.commands.getSignatures({
              ti: {
                getCollection: function() {
                  return me.options.toolItems.collection;
                }
              }
            })));
          }
          this.model.setNonPromotedActionsOptions({
            isNonPromoted: true
          });
          if (this.model.commands.length && this.model._requestRestActions) {
            this.collection.silentFetch = true;
            this.model.commands.length && this.model._requestRestActions(this.model, null, {});
            if (this.model.delayedActions.fetching) {
              this.model.delayedActions.fetching.always(function() {
                this._updateMenuItems();
              }.bind(this));
              return;
            }
          }
        } else if (this.model.get("d2ObjectDataFetched") === true && this.model.actions && this.model.actions.length > 0) {
          this._updateMenuItems();
          return;
        }
      }
      this.listenTo(this.model.actions, "update", updateToolbarCollection.bind(this));
      return origOnRender.apply(this, arguments);
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