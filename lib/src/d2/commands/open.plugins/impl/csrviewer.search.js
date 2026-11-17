/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/log" ], function(module, $, _, log) {
  "use strict";
  log = log(module.id);
  return {
    initialize: function(config) {
      this.searchServiceConfig = config;
    },
    makeSearchRegex: function(searchFor) {
      if (!searchFor) {
        return null;
      }
      if (this.regex !== true) {
        searchFor = searchFor.replace(/([.*+?^${}\(\)\|\[\]\/\\])/g, "\\$1");
        var tempString = searchFor.charAt(0);
        for (var i = 1; i < searchFor.length; i++) {
          if (searchFor.charAt(i - 1) === "\\") {
            tempString += searchFor.charAt(i);
          } else if (searchFor.charAt(i) === " ") {
            tempString += "[\\n\\s]*";
          } else {
            tempString += "(?:\\s*-\\s*)?" + searchFor.charAt(i);
          }
        }
        searchFor = tempString;
        searchFor = searchFor.replace(/"/g, '["“”]');
        searchFor = searchFor.replace(/'/g, "['`´‘’]");
      }
      if (this.wholeWord === true) {
        searchFor = "\\b" + searchFor + "\\b";
      }
      return new RegExp(searchFor, this.ignoreCase !== false ? "gi" : "g");
    },
    searchQuery: function(searchRegex, string) {
      if (!searchRegex || !string) {
        return 0;
      }
      var matches = string.match(searchRegex);
      if (matches) {
        return matches.length;
      }
      return 0;
    },
    loadSearchXML: function() {
      var me = this;
      return new Promise(function(resolve, reject) {
        if (me.searchXMLRequested) {
          resolve();
        } else {
          me.searchXMLRequested = true;
        }
        var acsURL = me.searchServiceConfig.searchInfoUrl;
        var fallbackURL = me.searchServiceConfig.searchInfoFallbackUrl;
        return me.fetchSearchData(acsURL, false).then(resolve, function() {
          return me.fetchSearchData(fallbackURL, false).then(resolve, function() {
            log.debug("Failed to load search metadata") && console.log(log.last);
            reject();
          });
        });
      });
    },
    fetchSearchData: function(url, withCredentials) {
      var me = this;
      var deferred = $.Deferred();
      if (url === "") {
        log.debug("Failed to load search metadata. URL is blank" && console.log(log.last));
      }
      $.ajax({
        url: url,
        timeout: 3e4,
        method: "GET",
        xhrFields: {
          withCredentials: withCredentials
        },
        success: function(response) {
          me.textData = {};
          var xmlData = response.documentElement.outerHTML;
          if (xmlData === "") {
            log.debug("Failed to load search metadata using URL: " + url) && console.log(log.last);
          }
          var pgNum;
          var xmlDoc = $.parseXML(xmlData), $xml = $(xmlDoc), allPages = $xml.find("page");
          allPages.each(function(index, value) {
            var pageData = value.outerHTML;
            pgNum = index + 1;
            var pageDoc = $.parseXML(pageData), $page = $(pageDoc);
            var textNodes = $page.find("t");
            var pageText = "";
            textNodes.each(function(i, v) {
              pageText += v.textContent + " ";
            });
            me.textData[pgNum] = pageText;
          });
          log.debug("Search metadata loaded successfully using URL: " + url) && console.log(log.last);
          deferred.resolve();
        },
        error: function() {
          log.debug("Failed to load search metadata using URL: " + url) && console.log(log.last);
          deferred.reject();
        }
      });
      return deferred.promise();
    },
    search: function(searchRequest) {
      var me = this;
      me.ignoreCase = !searchRequest.matchCase;
      me.wholeWord = searchRequest.wholeWord;
      me.regex = searchRequest.regex;
      return new Promise(function(resolve) {
        me.loadSearchXML(searchRequest).then(function() {
          log.debug("Searching text data for:" + searchRequest.searchPhrase) && console.log(log.last);
          var searchRegex = me.makeSearchRegex(searchRequest.searchPhrase);
          var hit = false;
          var matches = [];
          for (var i in me.textData) {
            if (Object.prototype.hasOwnProperty.call(me.textData, i)) {
              var res = me.searchQuery(searchRegex, me.textData[i]);
              if (res > 0) {
                matches[i - 1] = res;
                hit = true;
              } else {
                matches[i - 1] = 0;
              }
            }
          }
          if (hit) {
            resolve(matches);
          } else {
            resolve();
          }
        });
      });
    }
  };
});