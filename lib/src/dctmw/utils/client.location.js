/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery.parse.param", "nuc/utils/url" ], function(module, require, _, Backbone, parseParams, Url) {
  "use strict";
  var config = _.defaults({}, module.config(), {
    location: window.location,
    baseFragment: require.moduleConfig("dctmw/utils/authenticators/base.authenticator")["applicationPageUrl"]
  }), location = config.location, baseFragment = config.baseFragment;
  function reload() {
    _.isFunction(location.reload) && location.reload();
  }
  function compactObject(obj) {
    return _.chain(_.pairs(obj)).reject(pair => {
      return pair[1] === undefined || pair[1] === null || pair[1] === "";
    }).object().value();
  }
  function navigate(fragment, options) {
    if (_.isObject(fragment) && !_.isEmpty(fragment)) {
      options = fragment;
      fragment = null;
    }
    options = options || {};
    let opts = _.defaults({}, options, {
      trigger: false,
      replace: false,
      keepHashParams: false,
      hashParams: {}
    }), requestedRawFragmentPath = _.isString(fragment) ? fragment.match(/[^\?]*/)[0] : "", requestedFragmentPath = requestedRawFragmentPath.replace("#", ""), existingRawHashPath = location.hash.match(/[^\?]*/)[0], hashPath = existingRawHashPath.replace("#", ""), existingHashParams = location.hash.substring(existingRawHashPath.length + 1), keptHashParams = opts.keepHashParams === true ? existingHashParams : "", areHashParamsSame = false;
    if (_.isString(fragment)) {
      const fragmentParams = fragment.substring(requestedRawFragmentPath.length + 1);
      _.extend(opts.hashParams, parseParams(fragmentParams));
    }
    opts.hashParams = compactObject(opts.hashParams);
    areHashParamsSame = _.isEqual(compactObject(parseParams(existingHashParams)), opts.hashParams);
    if (!opts.replace) {
      opts.replace = _.isBoolean(this.isHashChangeEventHandlingInProgress) ? this.isHashChangeEventHandlingInProgress : opts.replace;
      if (!opts.replace && hashPath === requestedFragmentPath) {
        opts.replace = areHashParamsSame;
        if (!opts.replace) {
          opts.replace = !_.isEmpty(opts.hashParams);
        }
      }
    }
    const url = Url.appendQuery(fragment === null || fragment === undefined ? hashPath : requestedFragmentPath, areHashParamsSame ? existingHashParams : Url.combineQueryString(keptHashParams, opts.hashParams || {}));
    const isNavigable = Backbone.history.navigate(url, {
      trigger: opts.trigger,
      replace: opts.replace
    });
    if (!_.isBoolean(isNavigable) && opts.trigger === true) {
      Backbone.history.loadUrl(url);
    }
    return isNavigable;
  }
  function getHashParams() {
    const hashParamIndex = location.hash.indexOf("?"), hashParams = hashParamIndex !== -1 ? parseParams(location.hash.substring(hashParamIndex)) : {};
    return hashParams;
  }
  function getQueryParams() {
    return location.search && parseParams(location.search.substring(1));
  }
  function modularizeFragment(fragment) {
    if (!fragment.startsWith(baseFragment)) {
      if (fragment.startsWith("#")) {
        fragment = fragment.substring(1);
      }
      fragment = [ baseFragment, fragment ].join("/").replace(/\/$/, "");
    }
    if (!fragment.startsWith("#")) {
      fragment = "#" + fragment;
    }
    return fragment;
  }
  function demodularizeFragment(fragment = "") {
    fragment = fragment.replace("#", "");
    const baseFrag = baseFragment.replace("#", "");
    if (fragment.startsWith(baseFrag)) {
      fragment = fragment.substring(baseFrag.length + 1);
    }
    return fragment;
  }
  function getCurrentFragment(isDemodularized = true) {
    const fragment = location.hash.match(/[^\?]*/)[0].replace("#", "");
    return isDemodularized === true ? demodularizeFragment(fragment) : fragment;
  }
  return {
    reload: reload,
    navigate: navigate,
    getHashParams: getHashParams,
    getQueryParams: getQueryParams,
    modularizeFragment: modularizeFragment,
    demodularizeFragment: demodularizeFragment,
    getCurrentFragment: getCurrentFragment
  };
});