/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette" ], function(Marionette) {
  "use strict";
  var RepositoryItemView = Marionette.ItemView.extend({
    tagName: "option",
    className: "signin-option",
    template: false,
    onRender: function() {
      var name = this.model.get("name"), docbaseDescription = this.model.get("description");
      if (this.model.has("repository")) {
        const repo = this.model.get("repository");
        name = repo.repositoryName;
        docbaseDescription = repo.docbaseDescription;
      }
      this.$el.text(docbaseDescription || name);
      this.$el.val(name);
    }
  });
  return RepositoryItemView;
});