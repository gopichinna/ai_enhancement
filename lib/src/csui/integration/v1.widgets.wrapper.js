/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/connector", "csui/integration/folderbrowser/folderbrowser.widget", "csui/integration/target.picker/target.picker" ], function(_, Connector, FolderBrowserWidget, TargetPicker) {
  var csui = window.csui;
  _.extend(csui, {
    version: "2.0",
    util: {
      Connector: Connector
    },
    widget: {
      FolderBrowserWidget: FolderBrowserWidget,
      TargetPickerDialogWidget: TargetPicker
    },
    Connector: Connector,
    FolderBrowserWidget: FolderBrowserWidget
  });
  return csui;
});