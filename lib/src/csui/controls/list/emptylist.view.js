/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/emptylist/emptylist.view" ], function(SmartEmptyListView) {
  var EmptyListView = SmartEmptyListView.extend({
    constructor: function EmptyListView(options) {
      SmartEmptyListView.prototype.constructor.call(this, options);
    }
  });
  return EmptyListView;
});