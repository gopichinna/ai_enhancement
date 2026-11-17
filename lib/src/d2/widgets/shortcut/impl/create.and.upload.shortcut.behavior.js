/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/widgets/shortcut/impl/action.tiles.shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(ActionTilesShortcutBehavior, lang) {
  "use strict";
  var CreateAndUploadShortcutBehavior = ActionTilesShortcutBehavior.extend({
    constructor: function CreateAndUploadShortcutBehavior() {
      CreateAndUploadShortcutBehavior.__super__.constructor.apply(this, arguments);
      this.viewModel.set({
        icon: "icon-action-tile-combined",
        name: lang.shortcutNewContent
      });
    },
    _getActionSignature: function() {
      return "D2-CreateContent";
    }
  });
  return CreateAndUploadShortcutBehavior;
});