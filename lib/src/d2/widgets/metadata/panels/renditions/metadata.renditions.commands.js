/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/commands", "d2/commands/doc.preview", "d2/commands/open", "d2/commands/rendition.delete", "d2/commands/download", "d2/commands/open.url", "d2/commands/show.dialog" ], function(_, CommandCollection, DocPreviewCommand, OpenCommand, RenditionDeleteCommand, DownloadCommand, OpenUrlCommand, ShowDialog) {
  "use strict";
  return new CommandCollection([ new DocPreviewCommand(), new OpenCommand(), new RenditionDeleteCommand(), new DownloadCommand(), new OpenUrlCommand(), new ShowDialog() ]);
});