/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "d2/controls/group.panel/impl/group.content.view" ], function(_, Marionette, Backbone, GroupContentView) {
  "use strict";
  return Marionette.CollectionView.extend({
    className: "d2-group-panel",
    childView: GroupContentView,
    childViewOptions: function(model) {
      return _.extend({}, model.attributes, {
        groupPanelView: this,
        groupData: this.options.groupData,
        context: this.options.context
      });
    },
    constructor: function GroupPanelView(options) {
      options = options || {};
      if (!options.groups) {
        throw Error("Groups are needed as part of options!");
      }
      options.collection = this._buildCollection(options.groups);
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    _buildCollection: function(groups) {
      var collection = new Backbone.Collection(groups);
      collection.each(function(model) {
        model.set("id", _.uniqueId("d2-group"));
      });
      return collection;
    },
    getContentViewByType: function(groupType) {
      var model = this.collection.findWhere({
        groupType: groupType
      }), contentView = model && this.children.findByModel(model);
      return contentView && contentView.getContentView();
    }
  });
});