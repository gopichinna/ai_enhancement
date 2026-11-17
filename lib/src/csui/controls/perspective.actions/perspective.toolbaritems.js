/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/controls/perspective.actions/impl/nls/lang" ], function(lang) {
  const dropdownItems = [ {
    actionName: lang.CommandRename,
    signature: "PerspectiveRename"
  }, {
    actionName: lang.CommandDuplicate,
    signature: "PerspectiveDuplicate",
    serialize: true
  }, {
    actionName: lang.CommandDelete,
    signature: "PerspectiveDelete"
  }, {
    actionName: lang.CommandEnable,
    signature: "PerspectiveEnable"
  }, {
    actionName: lang.CommandDisable,
    signature: "PerspectiveDisable"
  } ];
  return dropdownItems;
});