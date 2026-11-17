/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/node.links/node.links", "dctmw/utils/authenticators/auth.storage", "d2/utils/constants", "d2/utils/node.utils", "dctmw/utils/utils" ], function(module, $, parseParams, _, Url, nodeLinks, authStorage, constants, nodeUtils, utils) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    embedMode: false,
    linkSeparator: "\n"
  });
  function filterFalsyNonBooleanFromObject(obj) {
    return _.object(_.filter(_.pairs(obj), function(kvPair) {
      return !(_.isUndefined(kvPair[1]) || _.isNull(kvPair[1]) || _.isEmpty(kvPair[1]));
    }));
  }
  function injectAuthInfo(links) {
    var currTabData = authStorage.getCurrTabData();
    var authData = {};
    authData[constants.UrlParams.REPOSITORY] = currTabData[constants.AuthStorage.REPOSITORY];
    authData[constants.UrlParams.APPLICATION] = currTabData[constants.AuthStorage.APPLICATION];
    authData[constants.UrlParams.NETWORK_LOCATION] = currTabData[constants.AuthStorage.NETWORK_LOCATION];
    authData = filterFalsyNonBooleanFromObject(authData);
    return _.map(links, function(link) {
      if (_.isString(link) && !_.isEmpty(link)) {
        var fragment = "", fragmentIndex = link.indexOf("#");
        if (fragmentIndex >= 0) {
          fragment = link.substring(fragmentIndex);
          link = link.substring(0, fragmentIndex);
        }
        var query = new Url(link).getQuery();
        if (_.isString(query) && !_.isEmpty(query)) {
          var params = parseParams(query);
          _.extend(params, authData);
          return link.substring(0, link.indexOf(query)) + Url.combineQueryString(params) + fragment;
        } else {
          return Url.appendQuery(link, Url.combineQueryString(authData)) + fragment;
        }
      }
      return link;
    });
  }
  return {
    injectAuthInfoInURL: function(listOfUrl, linkSeparator) {
      if (_.isArray(listOfUrl) && !_.isEmpty(listOfUrl)) {
        return injectAuthInfo(listOfUrl);
      } else if (_.isString(listOfUrl) && !_.isEmpty(listOfUrl)) {
        linkSeparator = _.isString(linkSeparator) && !_.isEmpty(linkSeparator) ? linkSeparator : config.linkSeparator;
        var links = injectAuthInfo(listOfUrl.split(linkSeparator));
        return _.compact(links).join(linkSeparator);
      }
      return listOfUrl;
    },
    getUrl: function(node, options) {
      var prefix = node.get("type") === constants.Types.TASK ? "tasks/" : "nodes/", url = Url.combine(prefix, node.get("id"));
      return this.completeUrl(node, url, options);
    },
    completeUrl: function(node, url, options) {
      if (!url) {
        return location.href;
      }
      var connector = node.connector || options && options.connector;
      var serverUrl = new Url(connector && connector.connection.url || location.href);
      return nodeLinks._getApplicationUrlPrefix(serverUrl) + url;
    },
    getNodeUrl: function(node) {
      var url = this.getUrl(node);
      if (node && node.connector && node.connector.authenticator) {
        var appPageUrl, absoluteUrl;
        if (utils.isAppworks()) {
          absoluteUrl = node.connector.connection.url;
          appPageUrl = node.connector.authenticator.getAppPageUrl();
          if (absoluteUrl.lastIndexOf("/") !== absoluteUrl.length - 1) {
            absoluteUrl = absoluteUrl + "/";
          }
          absoluteUrl = new URL(appPageUrl, absoluteUrl);
        } else {
          appPageUrl = node.connector.authenticator.getAppPageUrl();
          absoluteUrl = $("<a>").prop("href", appPageUrl).prop("href");
        }
        url = absoluteUrl + "/" + url.substr(url.indexOf("#") + 1);
      }
      if (config.embedMode === true) {
        url = url.replace("/embed", "");
      }
      return url;
    }
  };
});