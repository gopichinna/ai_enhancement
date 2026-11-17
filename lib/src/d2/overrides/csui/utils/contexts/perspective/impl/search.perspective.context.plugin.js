/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require" ], function(require) {
  "use strict";
  require([ "csui/utils/contexts/perspective/impl/search.perspective.context.plugin", "csui/utils/contexts/perspective/search.perspectives" ], function(SearchPerspectiveContextPlugin, searchPerspectives) {
    var oldSearchQueryChanged = SearchPerspectiveContextPlugin.prototype.onSearchQueryChanged;
    SearchPerspectiveContextPlugin.prototype.onCreate = function() {
      this.searchQuery.off("change", this.onSearchQueryChanged, this);
      this.searchForm.off("change", this.onSearchQueryChanged, this);
      this.searchQuery.on("change", onSearchQueryChanged, this);
      this.searchForm.on("change", onSearchQueryChanged, this);
    };
    function onSearchQueryChanged() {
      var currentPerspective = searchPerspectives.findByQuery(this.searchQuery);
      if (this.searchQuery.get("by-id") || this.searchQuery.get("queryform")) {
        this.searchQuery.set("query_id", this.searchQuery.get("by-id") || this.searchQuery.get("queryform"), {
          silent: true
        });
      } else if (this.lastPerspective !== currentPerspective.get("module")) {
        this.searchQuery.set("query_id", this.searchQuery.get("where"), {
          silent: true
        });
      }
      oldSearchQueryChanged.apply(this, arguments);
      this.searchQuery.unset("query_id", {
        silent: true
      });
      this.lastPerspective = searchPerspectives.findByQuery(this.searchQuery);
      this.lastPerspective = this.lastPerspective.get("module");
    }
  });
});