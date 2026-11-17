/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/widgets/widgettile/widgettile.view", "d2/widgets/widgettile.group.list/impl/group.content.view" ], function(_, $, Marionette, WidgetTileView, GroupPanelListView) {
  "use strict";
  return WidgetTileView.extend({
    constructor: function WidgetTileGroupView(options) {
      WidgetTileView.prototype.constructor.call(this, options);
    },
    childView: GroupPanelListView,
    childViewOptions: function(model) {
      return {
        context: this.context,
        name: model.get("name"),
        contentView: this.options.contentView,
        node: model,
        contentViewOptions: this.options.contentViewOptions,
        enableHeaderIcon: this.options.enableHeaderIcon
      };
    },
    getFactoryParam: function() {
      var factoryProp = this.options.collectionFactory && this.options.collectionFactory.prototype.propertyPrefix;
      return factoryProp;
    }
  });
});