/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui-ext!csui/utils/permissions/permissions.subtypesWithFolder" ], function(extraSubTypesWithFolder) {
  "user strict";
  const permissionsSubtypesWithFolder = [ 0, 136, 204, 207, 215, 298, 3030202 ];
  return extraSubTypesWithFolder ? [ ...permissionsSubtypesWithFolder, ...extraSubTypesWithFolder.flat() ] : permissionsSubtypesWithFolder;
});