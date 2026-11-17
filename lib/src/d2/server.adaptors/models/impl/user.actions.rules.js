/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return [ {
    command_key: "D2-UserSettings",
    equals: {
      action: "D2_ACTION_PREFERENCES_SHOW"
    }
  }, {
    command_key: "SwitchToClassic",
    equals: {
      action: "D2_ACTION_SWITCH_CLIENT"
    }
  }, {
    command_key: "D2-BrowseHelp",
    equals: {
      action: "D2_ACTION_ALTERNATE_HELP"
    }
  }, {
    command_key: "D2-OpenUrl",
    equals: {
      action: "D2_ACTION_OPEN_URL"
    }
  }, {
    command_key: "D2-About",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && (item.actionParameters === undefined || item.actionParameters.DIALOG_NAME === "AboutDialog");
    }
  }, {
    command_key: "D2-ShowDialog",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && item.actionParameters["DIALOG_NAME"] !== "AboutDialog";
    },
    prioritisePluginImpl: true
  }, {
    command_key: "SignOut",
    decides: function(item) {
      return item.actionParameters && item.actionParameters["action-message"] === "LOGOUT";
    }
  }, {
    command_key: "separator",
    equals: {
      id: "separator"
    }
  }, {
    command_key: "placeholder",
    decides: function(item) {
      return item.action === "DEFAULT" && item.actionParameters && item.actionParameters.type === "placeholder" && item.actionParameters.dynamic === "true";
    }
  }, {
    command_key: "D2-SwitchLandingPage",
    equals: {
      action: "D2_ACTION_SWITCH_LANDING_CONFIG"
    }
  }, {
    command_key: "D2-ShowExternal",
    equals: {
      action: "D2_ACTION_SHOW_EXTERNAL_WIDGET"
    }
  } ];
});