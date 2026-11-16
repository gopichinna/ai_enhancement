/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/base", "d2/commands/download", "d2/utils/rest.linkrels", "json!csui/utils/commands/open.types.json" ], function(_, $, base, DownloadCommand, RestLinkrels, openMimeTypes) {
  "use strict";
  var config = window.csui.requirejs.s.contexts._.config.config["csui/utils/commands/open"] || {}, mimeTypesFromPlugins = _.chain(navigator.plugins || []).map(function(plugin) {
    return _.chain(plugin).map(function(mimeType) {
      return mimeType.type;
    }).value();
  }).flatten().compact().invoke("toLowerCase").value();
  config = _.extend({
    mimeTypesForOpen: openMimeTypes.mimeTypesForOpen,
    forceDownloadForMimeTypes: [ "text/html", "text/xml", "application/xml" ]
  }, config);
  config.mimeTypesForOpen = _.invoke(config.mimeTypesForOpen, "toLowerCase");
  config.forceDownloadForMimeTypes = _.invoke(config.forceDownloadForMimeTypes, "toLowerCase");
  config.mimeTypesForOpen = _.chain(config.mimeTypesForOpen).concat(mimeTypesFromPlugins).unique().invoke("toLowerCase").value();
  function BrowserPlugin() {}
  BrowserPlugin.prototype.getUrl = function(node, options) {
    var deferred = $.Deferred();
    if (!options || !options.downloadLink) {
      deferred.reject("Missing download link");
    } else {
      deferred.resolve(options.downloadLink);
    }
    return deferred.promise();
  };
  BrowserPlugin.isSupported = function(node) {
    var mimeType = node.get("mime_type");
    if (base.isAppleMobile()) {
      return mimeType ? config.forceDownloadForMimeTypes.indexOf(mimeType) < 0 : true;
    }
    if (mimeType) {
      mimeType = mimeType.toLowerCase();
      if (base.isSafari() && (mimeType.indexOf("audio/") === 0 || mimeType.indexOf("video/") === 0)) {
        return false;
      }
      return config.mimeTypesForOpen.indexOf(mimeType) >= 0 && config.forceDownloadForMimeTypes.indexOf(mimeType) < 0;
    }
  };
  return BrowserPlugin;
});