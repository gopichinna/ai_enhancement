/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/lib/backbone" ], function(_, $, Marionette, Backbone) {
  var DragAndDropItemBehaviour = Marionette.Behavior.extend({
    constructor: function DragAndDropItemBehaviour(options, view) {
      this.view = view;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this._registerListeners();
    },
    _registerListeners: function() {
      this.listenTo(this.view, "render", this._initDnD);
    },
    _initDnD: function() {
      this.$el.addClass(DragAndDropItemBehaviour.DRAGGABLE_CLASSNAME);
      this.$el.attr(DragAndDropItemBehaviour.DRAGGABLE_DATA_ATTR, this.view.model.cid);
    }
  }, {
    DRAGGABLE_CLASSNAME: "csui-draggable-item",
    DRAGGABLE_DATA_ATTR: "data-csui-draggable-item"
  });
  return DragAndDropItemBehaviour;
});