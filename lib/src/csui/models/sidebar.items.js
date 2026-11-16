/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/sidebar.item" ], function(Backbone, SideBarItemModel) {
  "use strict";
  var SidebarItemCollection = Backbone.Collection.extend({
    model: SideBarItemModel,
    constructor: function SidebarItemCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  return SidebarItemCollection;
});