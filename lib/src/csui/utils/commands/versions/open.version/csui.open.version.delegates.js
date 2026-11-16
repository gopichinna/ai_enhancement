/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/underscore", "csui/utils/commands/versions/open.version.perspective", "csui/utils/commands/versions/open", "csui/utils/commands/download", "csui/utils/commands/open.in.browser" ], function(require, _, OpenVersionPerspectiveCommand, OpenVersionContentCommand, DownloadCommand, OpenInBrowser) {
  "use strict";
  var config = _.extend({
    allowViewContent: true,
    allowPerspective: false,
    isFileActionEnabled: false
  }, require.moduleConfig("csui/utils/commands/open.document/csui.open.document.delegates"));
  var versionCommandsList = [ {
    sequence: 500,
    command: OpenVersionPerspectiveCommand,
    decides: function(version, options) {
      var context = options && options.context;
      if (!(context && context.perspective)) {
        return false;
      }
      if (config.isFileActionEnabled) {
        return true;
      }
      return config.allowPerspective;
    }
  }, {
    sequence: 1e4,
    command: OpenVersionPerspectiveCommand
  } ];
  if (config.isFileActionEnabled) {
    versionCommandsList.push({
      sequence: 1050,
      command: OpenInBrowser
    }, {
      sequence: 1150,
      command: DownloadCommand
    });
  } else {
    versionCommandsList.push({
      sequence: 1e3,
      command: OpenVersionContentCommand,
      decides: () => config.allowViewContent
    });
  }
  return versionCommandsList;
});