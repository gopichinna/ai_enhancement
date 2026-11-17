/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/list/simpletreelist.view" ], function(SmartSimpleTreeListView) {
  var SimpleTreeListView = SmartSimpleTreeListView.extend({
    constructor: function SimpleTreeListView(options = {}) {
      SmartSimpleTreeListView.prototype.constructor.call(this, options);
    }
  });
  return SimpleTreeListView;
});