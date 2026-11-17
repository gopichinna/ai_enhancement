/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/utils/commands/open.specific.node.perspective", "csui/utils/commands/open", "csui/utils/commands/download", "csui/utils/commands/open.in.browser" ], function(module, _, OpenSpecificNodePerspectiveCommand, OpenDocumentContentCommand, DownloadCommand, OpenInBrowser) {
  "use strict";
  var config = _.extend({
    allowViewContent: true,
    allowPerspective: false,
    isFileActionEnabled: false
  }, module.config());
  var commandsList = [ {
    sequence: 500,
    command: OpenSpecificNodePerspectiveCommand,
    decides: function(node, options) {
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
    command: OpenSpecificNodePerspectiveCommand
  } ];
  if (config.isFileActionEnabled) {
    commandsList.push({
      sequence: 1050,
      command: DownloadCommand
    }, {
      sequence: 1150,
      command: OpenInBrowser
    });
  } else {
    commandsList.push({
      sequence: 1e3,
      command: OpenDocumentContentCommand,
      decides: () => config.allowViewContent
    });
  }
  return commandsList;
});