/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "i18n!d2/commands/nls/localized.strings", "d2/widgets/d2collections.perspective/impl/d2collections.rename.view", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "nuc/utils/url", "csui/utils/commandhelper", "dctmw/utils/utils" ], function(require, _, $, CommandModel, lang, RenameCollectionView, RestLinkrels, RestResources, Url, CommandHelper, utils) {
  "use strict";
  var renameCollectionCommand = CommandModel.extend({
    defaults: {
      signature: "D2-rename-collection",
      command_key: "D2-rename-collection",
      name: lang.CommandNameRenameCollection,
      scope: "single"
    },
    execute: function(status) {
      status.originatingView.editingView = status.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("toolbarCaptionRegion").currentView;
      var options = {
        model: status.nodes.models[0],
        originatingView: status.originatingView
      };
      var renameCollectionView = new RenameCollectionView(options);
      renameCollectionView.listenTo(renameCollectionView, "confirm:rename", this.onUpdateCollectionName);
      renameCollectionView.listenTo(renameCollectionView, "cancel:rename", this.onCancelRename);
      renameCollectionView.listenTo(renameCollectionView, "collection:name:change", this.onCollectionNameChange);
      renameCollectionView.$(".confirm-rename").addClass("confirm-rename--disable");
      status.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("otherToolbarRegion").show(renameCollectionView);
      status.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("otherToolbarRegion").$el.addClass("editCollectionForm");
      status.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("toolbarCaptionRegion").$el.hide();
      return $.Deferred().resolve().promise();
    },
    onUpdateCollectionName: function() {
      this.options.originatingView.blockActions();
      var self = this;
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url + "/collections/" + this.model.get("id"));
      var newCollectionName = this.$(".new-collection-name-input").val().trim();
      var payload = {
        properties: {
          object_name: newCollectionName
        }
      };
      $.ajax(this.options.originatingView.connector.extendAjaxOptions({
        url: url,
        type: "PATCH",
        contentType: "application/vnd.emc.documentum+json",
        dataType: "json",
        data: JSON.stringify(payload),
        success: function() {
          self.model.set("name", newCollectionName);
          const leftPanelModel = self.options.originatingView.getRegion("listD2CollectionsPanel").currentView.myCollectionsListView.collection.findWhere({
            r_object_id: self.model.get("id")
          });
          leftPanelModel.set({
            name: newCollectionName
          });
          self.onCancelRename();
          self.options.originatingView.unblockActions();
        },
        error: function(xhr, message, statusText) {
          self.options.originatingView.unblockActions();
          CommandHelper.showErrorPanel(self.model, lang.D2CollectionRenameErrorMessage, utils.parseAjaxErrorAsString(xhr, statusText, message));
        }
      }));
    },
    onCancelRename: function() {
      this.options.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("otherToolbarRegion").empty();
      this.options.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("otherToolbarRegion").$el.removeClass("editCollectionForm");
      this.options.originatingView.getRegion("tableToolbarRegion").currentView.getRegion("toolbarCaptionRegion").$el.show();
    },
    onCollectionNameChange: function() {
      if (this.model.get("name") === this.$(".new-collection-name-input").val().trim()) {
        this.$(".confirm-rename").addClass("confirm-rename--disable");
      } else {
        this.$(".confirm-rename").removeClass("confirm-rename--disable");
      }
    }
  });
  return renameCollectionCommand;
});