/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// This file contains module paths and the default configuration.
(function () {
  'use strict';

  // Support development pages loading single files not built together yet.
  // Duplicated from helper.js so that that needs not to be included also:
  //   <script src=".../lib/require.js"></script>
  //   <script src=".../config.js"></script>
  var csui = window.csui || (window.csui = {});
  if (!csui.requirejs && window.requirejs) {
    csui.requirejs = window.requirejs;
    csui.require = window.require;
    csui.define = window.define;
  }
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
  if (!currentScript) {
    throw new Error('Cannot detect the CS UI path');
  }
  var nucPath = currentScript.getAttribute('data-nuc-path') || currentScript.getAttribute('data-csui-path');
  if (!nucPath) {
    nucPath = currentScript.src;
    var queryStart = nucPath.indexOf('?');
    if (queryStart > 0) {
      nucPath = nucPath.substring(0, queryStart);
    }
    var anchorStart = nucPath.indexOf('#');
    if (anchorStart > 0) {
      nucPath = nucPath.substring(0, anchorStart);
    }
    var lastSlash = nucPath.lastIndexOf('/');
    nucPath = lastSlash > 0 ? nucPath.substring(0, lastSlash) : '.';
  }

  csui.require.config({
    paths: {
      nuc: nucPath,
      css: nucPath + '/lib/css',
      'csui-ext': nucPath + '/utils/load-extensions/load-extensions',
      hbs: nucPath + '/lib/hbs',
      i18n: nucPath + '/lib/i18n',
      json: nucPath + '/lib/json',
      less: nucPath + '/lib/less',
      txt: nucPath + '/lib/text'
    },

    // This plugin has no abbreaviation and was moved from csui, but it is used
    // in the require.config statement before any requirejs module is loaded.
    rename: {
      'csui/lib/require.config': 'nuc/lib/require.config'
    },

    // Empty for debugging, when packaged, this will be replaced by a cache
    //-busting parameter uniquely identifying the build by r.js
    urlArgs: '',

    hbs: {
      disableI18n: true,
      disableHelpers: true,
      templateExtension: 'hbs'
    },

    less: {
      sourceMap: { sourceMapFileInline: true }
    },

    waitSeconds: 30
  });
})();
