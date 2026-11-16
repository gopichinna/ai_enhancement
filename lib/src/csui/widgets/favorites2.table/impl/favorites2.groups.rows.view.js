/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/marionette", "csui/widgets/favorites2.table/impl/favorites2.group.view", "css!csui/widgets/favorites2.table/impl/favorites2.groups.rows.view" ], function(module, $, Marionette, FavoriteGroupView) {
  "use strict";
  var FavoriteGroupsRowsView = Marionette.CollectionView.extend({
    className: "csui-favorite-groups-rows csui-normal-scrolling",
    tagName: "ul",
    childView: FavoriteGroupView,
    childViewOptions: function() {
      return {
        parent: this,
        groupsView: this.options.parent,
        groupsViewStateModel: this.options.groupsViewStateModel,
        dragData: this.options.dragData,
        useEditMode: this._useEditMode,
        dragAndDropEnabled: this.options.dragAndDropEnabled
      };
    },
    initialize: function(options) {
      this._useEditMode = options && options.useEditMode;
    },
    events: {
      focusout: function(event) {
        if (event.relatedTarget) {
          if ($.contains(this.el, event.relatedTarget) == false) {
            this.trigger("groups:focusout");
          }
        }
      }
    }
  });
  return FavoriteGroupsRowsView;
});