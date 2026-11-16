/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/application.scope.factory", "csui/utils/contexts/perspective/perspective.context.plugin" ], function(_, Backbone, ApplicationScopeModelFactory, PerspectiveContextPlugin) {
  "use strict";
  var supportedPerspectives = {
    myassignments: "myassignmentstable",
    recentlyaccessed: "recentlyaccessedtable",
    favorites: "favorites2.table",
    recycleitems: "recycleitems.table"
  };
  var RootPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function RootPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory).on("change:id", this.onApplicationScopeChanged, this);
    },
    onApplicationScopeChanged: function() {
      var scope = this.applicationScope.id;
      if (!supportedPerspectives[scope] || this.loadingPerspective) {
        return;
      }
      this.context.loadPerspective("json!csui/utils/contexts/perspective/impl/perspectives/" + supportedPerspectives[scope] + ".json");
    }
  });
  return RootPerspectiveContextPlugin;
});