/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/shortcut/impl/action.tiles.shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(ActionTilesShortcutBehavior, lang) {
  "use strict";
  var CreateFileShortcutBehavior = ActionTilesShortcutBehavior.extend({
    constructor: function CreateFileShortcutBehavior(options) {
      CreateFileShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      var presetModel = this._getPresetModel(options, "create");
      if (presetModel) {
        this.model = presetModel;
        this.viewModel.set("icon", "icon-new-preset");
      } else {
        var action = this._fetchImportCreateLabel("D2-CreateFile");
        options.data.title = action ? action.get("name") : lang.shortcutNewContent;
        this.viewModel.set({
          icon: "icon-new",
          name: options.data.title
        });
      }
    },
    _getInvalidPrivilegeErrorTitle: function() {
      return lang.invalidCreatePrivilege;
    },
    _getActionSignature: function() {
      return "D2-CreateFile";
    }
  });
  return CreateFileShortcutBehavior;
});