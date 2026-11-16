/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/utils/contexts/factories/connector", "csui/models/perspective/perspective.collection/perspective.collection", "csui/perspective.manage/impl/top.ribbon/top.ribbon.item.view", "css!csui/perspective.manage/impl/top.ribbon/top.ribbon" ], function(Marionette, ConnectorFactory, PerspectiveCollection, TopRibbonItemView) {
  "use strict";
  let TopRibbonView = Marionette.CollectionView.extend({
    className: "csui-top-ribbon",
    tagName: "ul",
    childView: TopRibbonItemView,
    childViewOptions: function() {
      return {
        originatingView: this.options.parentView
      };
    },
    constructor: function TopRibbonView(options = {}) {
      this.options = options;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    initialize: function() {
      this.collection = new PerspectiveCollection({
        connector: this.options.context.getObject(ConnectorFactory)
      });
    },
    onRender: function() {
      this.collection.fetch();
    }
  });
  return TopRibbonView;
});