/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "d2/integration/folderbrowser/embed.folder.browser", "d2/integration/search/embed.search.widget", "d2/integration/commands/embed.command.dialog.widget", "d2/integration/viewer/embed.viewer", "d2/integration/adapter/embed.wsctf.import", "d2/integration/adapter/embed.wsctf.checkin", "d2/integration/adapter/embed.wsctf.create.folder", "d2/integration/adapter/embed.wsctf.import.folder", "d2/integration/metadata/embed.metadata.widget" ], function(module, _, EmbedFolderBrowser, EmbedSearchWidget, EmbedCommandDialogWidget, EmbedViewer, EmbedWsctfImportAdapter, EmbedWsctfCheckinAdapter, EmbedWsctfCreateFolderAdapter, EmbedWsctfImportFolderAdapter, EmbedMetadataWidget) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPluginMode: "thin"
  });
  return [ {
    handlerClass: EmbedFolderBrowser,
    headerKey: "folderbrowser",
    equals: {
      mode: "folderbrowser"
    }
  }, {
    handlerClass: EmbedSearchWidget,
    headerKey: "search",
    equals: {
      mode: "search"
    }
  }, {
    handlerClass: EmbedViewer,
    headerKey: "viewer",
    equals: {
      mode: "viewer"
    }
  }, {
    handlerClass: EmbedCommandDialogWidget,
    adapterClass: EmbedWsctfImportAdapter,
    headerKey: "import",
    decides: function(item) {
      return config && config.defaultPluginMode === "wsctf" && item && item.commandEvent && item.commandEvent === "D2_ACTION_CONTENT_IMPORT";
    }
  }, {
    handlerClass: EmbedCommandDialogWidget,
    adapterClass: EmbedWsctfCheckinAdapter,
    headerKey: "checkin",
    decides: function(item) {
      return config && config.defaultPluginMode === "wsctf" && item && item.commandEvent && item.commandEvent === "D2_ACTION_CONTENT_CHECKIN";
    }
  }, {
    handlerClass: EmbedCommandDialogWidget,
    adapterClass: EmbedWsctfCreateFolderAdapter,
    headerKey: "createfolder",
    decides: function(item) {
      return config && config.defaultPluginMode === "wsctf" && item && item.commandEvent && item.commandEvent === "D2_ACTION_FOLDER_CREATE";
    }
  }, {
    handlerClass: EmbedCommandDialogWidget,
    adapterClass: EmbedWsctfImportFolderAdapter,
    headerKey: "importFolder",
    decides: function(item) {
      return config && config.defaultPluginMode === "wsctf" && item && item.commandEvent && item.commandEvent === "D2_ACTION_CONTENT_IMPORT_STRUCTURE";
    }
  }, {
    handlerClass: EmbedMetadataWidget,
    headerKey: "properties",
    decides: function(item) {
      return item && item.commandEvent && item.commandEvent === "D2_ACTION_DISPLAY_DIALOG" && item.dialogType && item.dialogType === "METADATA";
    }
  } ];
});