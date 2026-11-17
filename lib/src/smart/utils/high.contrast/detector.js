/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function() {
  "use strict";
  var highContrast;
  function detectHighContrast() {
    var testBackgroundColor = "rgb(127, 127, 127)";
    var lightBackgroundColor = "rgb(255, 255, 255)";
    var div = document.createElement("div");
    var style = div.style;
    style.backgroundColor = testBackgroundColor;
    style.borderWidth = "1px";
    style.borderStyle = "solid";
    style.borderTopColor = "#ff0000";
    style.borderRightColor = "#00ffff";
    style.position = "absolute";
    style.left = "-9999px";
    style.width = div.style.height = "2px";
    var body = document.body;
    body.appendChild(div);
    style = window.getComputedStyle(div);
    var backgroundColor = style.backgroundColor;
    if (backgroundColor === testBackgroundColor) {
      highContrast = 0;
    } else {
      if (backgroundColor === lightBackgroundColor) {
        highContrast = 2;
      } else {
        highContrast = 1;
      }
    }
    body.removeChild(div);
    var method = highContrast ? "add" : "remove", hcMode = highContrast === 2 ? "csui-highcontrast-dark-on-light" : "csui-highcontrast-light-on-dark";
    document.documentElement.classList[method]("csui-highcontrast");
    document.documentElement.classList[method](hcMode);
  }
  return {
    load: function(name, _require, onLoad, config) {
      function ensureHighContrastDetection() {
        if (document.readyState === "complete") {
          if (highContrast === undefined) {
            detectHighContrast();
          }
          onLoad(highContrast);
          return true;
        }
      }
      if (config.isBuild) {
        onLoad(null);
      } else {
        if (!ensureHighContrastDetection()) {
          document.addEventListener("readystatechange", ensureHighContrastDetection);
        }
      }
    }
  };
});