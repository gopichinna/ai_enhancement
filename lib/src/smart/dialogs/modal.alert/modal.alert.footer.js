/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/underscore", "smart/dialogs/impl/button/button.view", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior" ], (Backbone, Marionette, _, SmartButtonView, TabableRegion) => {
  const ButtonView = SmartButtonView.extend({
    onRender: function() {
      let button = this.$el, attributes = this.model?.attributes || {};
      button.text(attributes.label || "");
      if (attributes.toolTip) {
        button.attr("title", attributes.toolTip);
      }
      if (attributes.id) {
        button.attr("id", attributes.id);
      }
      if (attributes.size) {
        button.attr("size", attributes.size);
      }
      this.updateButton(attributes);
    }
  });
  const ModalAlertFooterView = Marionette.CollectionView.extend({
    childView: ButtonView,
    constructor: function ModalAlertFooterView(options = {}) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.completeCollection = new Backbone.Collection();
      if (this.collection && this.collection.length) {
        this.completeCollection.add(this.collection.toJSON(), {
          silent: true
        });
      }
    },
    onDomRefresh: function() {
      this.children.each(function(buttonView) {
        buttonView.trigger("dom:refresh");
      });
    },
    getButtons: function() {
      return this.children.toArray();
    },
    updateButton: function(id, attributes) {
      var button = this.collection.get(id), completeCollectionButton = this.completeCollection.get(id);
      if (completeCollectionButton) {
        completeCollectionButton.set(attributes);
      }
      if (button) {
        this.children.findByModel(button).updateButton(attributes);
      }
    }
  });
  return ModalAlertFooterView;
});