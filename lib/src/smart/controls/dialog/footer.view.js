/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/underscore", "smart/dialogs/impl/button/button.view" ], function(Backbone, Marionette, _, SmartButtonView) {
  var DialogFooterView = Marionette.CollectionView.extend({
    childView: SmartButtonView,
    childViewOptions: function() {
      return {
        footerTabableRegionBehavior: this.options?.footerTabableRegionBehavior
      };
    },
    constructor: function DialogFooterView(options = {}) {
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
        this?.children?.findByModel(button)?.updateButton(attributes);
      } else {
        SmartButtonView.updateButton(this.$('[data-cs-id="' + id + '"]'), attributes);
      }
    }
  });
  return DialogFooterView;
});