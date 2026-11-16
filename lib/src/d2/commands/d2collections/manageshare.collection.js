/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/commands/d2collections/share.collection", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function(ShareD2CollectionsCommand, CommandHelper, localLang) {
  "use strict";
  return ShareD2CollectionsCommand.extend({
    sharedUserIds: [],
    defaults: {
      signature: "D2-manageshare-collection",
      command_key: "D2-manageshare-collection",
      name: localLang.ShareCollectionToUsersorGroups,
      scope: "single"
    },
    enabled: function(status) {
      let model = CommandHelper.getJustOneNode(status);
      if (model && model.get("isSharedCollection") === true && model["actions"]?.models?.some(action => action.id === this.defaults.signature)) {
        return true;
      }
      return false;
    }
  });
});