/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/controls/landingpage.dnd/landingpage.dnd.view", "d2/widgets/shortcut/impl/action.tiles.shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(LandingPageDndView, ActionTilesShortcutBehavior, lang) {
  "use strict";
  var UploadFileShortcutBehavior = ActionTilesShortcutBehavior.extend({
    constructor: function UploadFileShortcutBehavior(options) {
      UploadFileShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      var presetModel = this._getPresetModel(options, "import");
      if (presetModel) {
        this.model = presetModel;
        this.viewModel.set("icon", "icon-upload-file-preset");
      } else {
        var action = this._fetchImportCreateLabel("D2-ImportFile");
        options.data.title = action ? action.get("name") : lang.shortcutUploadContent;
        this.viewModel.set({
          icon: "icon-upload-file",
          name: options.data.title
        });
      }
      this.view.type = "uploadContent";
    },
    onRender: function() {
      UploadFileShortcutBehavior.__super__.onRender.apply(this, arguments);
      if (this.viewModel.get("enabled")) {
        if (this.model) {
          if (this.model.get("id")) {
            this._setDragAndDrop();
          }
        } else {
          this._setDragAndDrop();
        }
      }
    },
    _getInvalidPrivilegeErrorTitle: function() {
      return lang.invalidImportPrivilege;
    },
    _getActionSignature: function() {
      return "D2-ImportFile";
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
  return UploadFileShortcutBehavior;
});