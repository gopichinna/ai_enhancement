/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/behaviors/collection.state/collection.state.view", "hbs!csui/controls/list/impl/emptylist" ], function(CollectionStateView, emptyListTemplate) {
  "use strict";
  var ListStateView = CollectionStateView.extend({
    constructor: function ListStateView() {
      CollectionStateView.prototype.constructor.apply(this, arguments);
    },
    className: "cs-emptylist-container " + CollectionStateView.prototype.className,
    template: emptyListTemplate,
    serializeData: function() {
      var data = CollectionStateView.prototype.serializeData.apply(this, arguments);
      return {
        text: data.state === "loading" ? "" : data.message
      };
    }
  });
  return ListStateView;
});