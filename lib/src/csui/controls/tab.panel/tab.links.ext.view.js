/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/tab.panel/tab.links.ext.view" ], function(SmartTabLinkCollectionViewExt) {
  "use strict";
  var TabLinkCollectionViewExt = SmartTabLinkCollectionViewExt.extend({
    constructor: function TabLinkCollectionViewExt(options) {
      this.options = options || {};
      SmartTabLinkCollectionViewExt.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "metadata:schema:updated", function(model) {
        this.children.findByModel(model).render();
      }, this);
    }
  });
  return TabLinkCollectionViewExt;
});