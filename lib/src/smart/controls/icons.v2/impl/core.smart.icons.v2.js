/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/themes/carbonfiber/smart.mimetype.icons", "smart/themes/carbonfiber/smart.mimetype.colorschema.icons", "smart/themes/carbonfiber/smart.action.icons" ], function(MimeTypeIcons, MimeTypeColorSchemaIcons, ActionIcons) {
  "use strict";
  var coreSmartIcons = [];
  MimeTypeIcons && coreSmartIcons.push(MimeTypeIcons);
  MimeTypeColorSchemaIcons && coreSmartIcons.push(MimeTypeColorSchemaIcons);
  ActionIcons && coreSmartIcons.push(ActionIcons);
  return coreSmartIcons;
});