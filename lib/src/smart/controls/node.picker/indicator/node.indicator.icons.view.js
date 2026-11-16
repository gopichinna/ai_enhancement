/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/controls/node.picker/indicator/node.indicator.icons", "smart/controls/node.picker/indicator/node.indicator.icons.collection.view", "hbs!smart/controls/node.picker/indicator/impl/node.indicator.icons", "css!smart/controls/node.picker/indicator/impl/node.indicator.icons" ], function(_, $, Marionette, Backbone, NodeIndicatorIcons, NodeIndicatorCollectionView, template) {
  "use strict";
  var NodeIndicatorView = Marionette.ItemView.extend({
    template: template,
    class: "smart-node-indicator-wrapper",
    constructor: function NodeIndicatorView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options?.collection?.length) {
        this.nodeIndicatorCollectionView = new NodeIndicatorCollectionView({
          collection: this.options.collection,
          ...this.options
        });
        new Marionette.Region({
          el: this.$el
        }).show(this.nodeIndicatorCollectionView);
      } else {}
    }
  }, {
    getEnabledNodeIndicatorIcons: function(opts) {
      let origModels = [ ...NodeIndicatorIcons.models ];
      let coll = new Backbone.Collection();
      origModels.length && origModels.map(function(model) {
        let enableFun = model?.attributes?.enabled || (o => {
          return false;
        });
        if (enableFun(opts)) {
          coll.push(model, {
            silent: true
          });
        }
      });
      return coll;
    }
  });
  return NodeIndicatorView;
});