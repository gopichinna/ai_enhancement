/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "i18n!csui/controls/node.state/impl/nls/lang", "css!csui/controls/node.state/impl/node.states" ], function(_, $, Marionette, lang) {
  "use strict";
  var NodeStateCollectionView = Marionette.CollectionView.extend({
    tagName: "ul",
    className: "csui-node-states",
    attributes: {
      "aria-label": lang.stateListAria
    },
    getChildView: function(iconModel) {
      return iconModel.get("iconView");
    },
    childViewOptions: function(iconModel) {
      return _.extend({
        context: this.options.context,
        model: this.options.node,
        tableView: this.options.tableView
      }, iconModel.get("iconViewOptions"));
    }
  });
  return NodeStateCollectionView;
});