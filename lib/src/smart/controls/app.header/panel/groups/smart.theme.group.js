/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "smart/themes/theming", "css!smart/controls/app.header/panel/groups/impl/smart.theme.groups" ], function(module, theming) {
  const applyStyling = (method, className, timeOut) => {
    setTimeout(function() {
      document.body.classList[method](className);
    }, timeOut);
  };
  const processItem = (newTheme, args) => {
    let currentTheme = theming.getTheme();
    const isSwitchBetweenJatoAndNonJato = currentTheme === "cf" || newTheme === "cf";
    const clsName = isSwitchBetweenJatoAndNonJato ? "smart-fade-out-and-in-long-time" : "smart-fade-out-and-in";
    if (currentTheme !== newTheme) {
      applyStyling("add", clsName, 0);
      setTimeout(function() {
        theming.saveTheme(newTheme);
        theming.applyTheme();
        if (isSwitchBetweenJatoAndNonJato) {
          args.context?.navigationHeaderView?.render();
          args.context?.trigger("exit:edit:perspective", newTheme);
        }
        args.context?.trigger("theme:switched", newTheme);
      }, 500);
      applyStyling("remove", clsName, 2500);
    } else {
      return false;
    }
  };
  const checkActive = theme => {
    let data = theming.getTheme();
    return data === theme;
  };
  const groups = [ {
    id: "smartThemePanel",
    name: "Select theme (Experimental feature):",
    sequence: 9999
  } ];
  const items = [ {
    groupBy: "smartThemePanel",
    sequence: 1,
    name: "Carbonfibre (Default)",
    signature: "cf",
    execute: args => {
      processItem("cf", args);
    },
    isActive: () => {
      return checkActive("cf");
    }
  }, {
    groupBy: "smartThemePanel",
    sequence: 2,
    name: "Dark (JATO)",
    signature: "dark",
    execute: args => {
      processItem("dark", args);
    },
    isActive: () => {
      return checkActive("dark");
    }
  }, {
    groupBy: "smartThemePanel",
    sequence: 3,
    name: "Light (JATO)",
    signature: "light",
    execute: args => {
      processItem("light", args);
    },
    isActive: () => {
      return checkActive("light");
    }
  } ];
  return {
    groups: groups,
    items: items
  };
});