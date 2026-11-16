/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui-ext!csui/utils/permissions/permissions.subtypesForFolders" ], function(extraSubTypes) {
  "user strict";
  const permissionsSubtypesForFolders = [ 0, 136 ];
  return extraSubTypes ? [ ...permissionsSubtypesForFolders, ...extraSubTypes.flat() ] : permissionsSubtypesForFolders;
});