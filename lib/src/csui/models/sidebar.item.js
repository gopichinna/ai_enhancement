/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/widgets/error/error.view" ], function(Backbone, ErrorView) {
  "use strict";
  var SidebarItemModel = Backbone.Model.extend({
    idAttribute: "signature",
    constructor: function SidebarItemModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    isEnabled: function() {
      return true;
    },
    getPanelView: function() {
      return new ErrorView();
    },
    getPanelTitle: function() {
      return this.get("panelTitle") || this.get("name");
    }
  });
  return SidebarItemModel;
});