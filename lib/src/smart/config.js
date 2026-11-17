/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
(function() {
  "use strict";
  let csui = window.csui || (window.csui = {});
  if (!csui.requirejs && window.requirejs) {
    csui.requirejs = window.requirejs;
    csui.require = window.require;
    csui.define = window.define;
  }
  let currentScript = document.currentScript || function() {
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  }();
  if (!currentScript) {
    throw new Error("Cannot detect the CS UI path");
  }
  let smartPath = currentScript.getAttribute("data-smart-path") || currentScript.getAttribute("data-csui-path");
  if (!smartPath) {
    smartPath = currentScript.src;
    const queryStart = smartPath.indexOf("?");
    if (queryStart > 0) {
      smartPath = smartPath.substring(0, queryStart);
    }
    const anchorStart = smartPath.indexOf("#");
    if (anchorStart > 0) {
      smartPath = smartPath.substring(0, anchorStart);
    }
    const lastSlash = smartPath.lastIndexOf("/");
    smartPath = lastSlash > 0 ? smartPath.substring(0, lastSlash) : ".";
  }
  csui.require.config({
    paths: {
      smart: smartPath
    },
    rename: {
      "esoc/widgets/userprofile/tab.extension": "smart/controls/user/tab.extension"
    },
    waitSeconds: 30
  });
})();