/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "d2/commands/create.folder", "d2/controls/table/inlineforms/folder/folder.view.mixin", "i18n!d2/commands/nls/localized.strings" ], function($, CreateFolderCommand, FolderViewMixin, lang) {
  var EmbedCreateFolder = CreateFolderCommand.extend({
    defaults: {
      signature: "D2-EmbedCreateFolder",
      command_key: "D2-EmbedCreateFolder",
      name: lang.CommandNameCreateFolder,
      scope: "single",
      verb: lang.CommandNameCreateFolder
    },
    execute: function(status, options) {
      options = options || {};
      var me = this, dfd = $.Deferred();
      options.skipRefreshSelection = true;
      CreateFolderCommand.prototype.execute.apply(this, arguments).done(function(node) {
        me.newNode = node;
        me._performAction(false, true, status).done(dfd.resolve).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    }
  });
  FolderViewMixin.mixin(EmbedCreateFolder.prototype);
  return EmbedCreateFolder;
});