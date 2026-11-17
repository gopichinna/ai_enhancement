/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/base", "nuc/utils/log", "nuc/utils/connector", "dctmw/utils/utils" ], function(module, _, $, base, log, Connector, utils) {
  "use strict";
  log = log(module.id);
  function fixUrlContentDisposition(url) {
    var cdStr = "&content_disposition=inline";
    if (url.indexOf(cdStr) >= 0) {
      url = url.replace(cdStr, "");
    }
    return url;
  }
  var DownloadManager = {
    iFrameContainer: document.body,
    nextIFrameId: 1,
    downloadFile: function(downloadUrls, errCallback, win) {
      if (!downloadUrls) {
        return false;
      }
      var url = downloadUrls;
      if (typeof downloadUrls !== "string") {
        url = downloadUrls[0];
      }
      if (!url || url.length === 0) {
        return false;
      }
      if (win) {
        utils.openUrlInWindow(url, win, true);
        return true;
      }
      var iframe = this._newIFrame();
      var remainingUrls = typeof downloadUrls === "string" ? [ downloadUrls ] : downloadUrls;
      var hostsTried = [];
      var onloadContext = {
        iframe: iframe,
        remainingUrls: remainingUrls,
        hostsTried: hostsTried,
        errCallback: errCallback
      };
      var me = this;
      iframe.onload = function(event) {
        _.bind(me._onloadIFrame, me, event, onloadContext)();
      };
      hostsTried.push(this._getHostName(url));
      log.debug("Attempting to download file using url: " + url);
      iframe.src = fixUrlContentDisposition(url);
      return true;
    },
    _newIFrame: function() {
      var id = "download_iframe_" + this.nextIFrameId++, iframe = $("<iframe></iframe>").hide().attr("id", id).attr("name", id).attr("title", "Download").appendTo($(this.iFrameContainer));
      var delay = Math.min(Connector.prototype.connectionTimeout || 60 * 1e3, 60 * 1e3);
      setTimeout(function() {
        iframe.remove();
      }, delay);
      return iframe[0];
    },
    _onloadIFrame: function(event, context) {
      log.warn("Download attempt with previous url failed");
      if (context.remainingUrls.length > 1) {
        context.remainingUrls = context.remainingUrls.slice(1);
        var url = context.remainingUrls[0];
        context.hostsTried.push(this._getHostName(url));
        log.debug("Attempting to download file using url: " + url);
        context.iframe.src = fixUrlContentDisposition(url);
      } else {
        if (context.errCallback) {
          context.errCallback(event, context.iframe.contentDocument, context.hostsTried.join("\n"));
        }
        this._disposeIFrame(context.iframe);
      }
    },
    _disposeIFrame: function(iframe) {
      try {
        this.iFrameContainer.removeChild(iframe);
      } catch (ex) {
        log.warn("_disposeIFrame: " + iframe.id + " no longer in DOM");
      }
    },
    _getHostName: function(url) {
      return $("<a>").prop("href", url).prop("host");
    }
  };
  return DownloadManager;
});