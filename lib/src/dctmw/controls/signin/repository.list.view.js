/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "dctmw/controls/signin/repository.view" ], function(Marionette, RepositoryItemView) {
  "use strict";
  var RepositoryListView = Marionette.CollectionView.extend({
    tagName: "select",
    tabindex: "0",
    childView: RepositoryItemView,
    className: "repository-select",
    attributes: {
      "aria-label": "Select a repository",
      required: "required"
    },
    getRepositoryById: function(id) {
      var repository;
      this.collection.models.some(function(model) {
        model = model.has("repository") ? model.get("repository") : model;
        if (model.id === id) {
          repository = model;
          return true;
        }
      });
      return repository;
    },
    getRepositoryIndex: function(id) {
      var result = 0;
      var index = 1;
      this.collection.models.some(function(model) {
        var modelRepo = model.get("repository");
        if (modelRepo.id === id) {
          result = index;
          return true;
        }
        index += 1;
      });
      return result;
    }
  });
  return RepositoryListView;
});