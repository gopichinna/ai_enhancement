/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/controls/landingpage.dnd/landingpage.dnd.view", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/widgets/shortcut/impl/action.tiles.shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(LandingPageDndView, RestResources, widgetConstants, ActionTilesShortcutBehavior, lang) {
  "use strict";
  var UploadFolderShortcutBehavior = ActionTilesShortcutBehavior.extend({
    constructor: function UploadFolderShortcutBehavior(options) {
      UploadFolderShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      var action = this._fetchImportCreateLabel("D2-ImportFolder");
      options.data.title = action ? action.get("name") : lang.shortcutUploadFolder;
      this.viewModel.set({
        icon: "icon-upload-folder",
        name: options.data.title
      });
      this.view.widgetType = widgetConstants.D2.DOCLIST;
      this.view.widgetName = RestResources.getCurrentUser().get("defaultWidgets")[widgetConstants.DEFAULT.DOCLIST];
      this.view.type = "uploadFolder";
    },
    onRender: function() {
      UploadFolderShortcutBehavior.__super__.onRender.apply(this, arguments);
      if (this.viewModel.get("enabled")) {
        this._setDragAndDrop();
      }
    },
    _getActionSignature: function() {
      return "D2-ImportFolder";
    },
    _setDragAndDrop: function() {
      if (!this.draganddrop) {
        this.draganddrop = new LandingPageDndView({
          container: this.$el,
          originatingView: this.view,
          landingPageId: this.options.data.landingPageId,
          context: this.options.context,
          model: this.model
        });
      }
    }
  });
  return UploadFolderShortcutBehavior;
});