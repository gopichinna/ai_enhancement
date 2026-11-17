/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "i18n" ], function(_, $, i18n) {
  "use strict";
  const $window = $(window);
  function findFocusables(element) {
    return $(element).find("a[href], area[href], input, select, textarea, button," + " iframe, object, embed, *[tabindex], *[contenteditable]").filter(":visible:not([disabled])");
  }
  function clearFocusables(element) {
    var ele = $(element), focusables = ele.attr("tabindex", -1).find("a[href], area[href], input, select, textarea, button," + " iframe, object, embed, *[tabindex], *[contenteditable]").filter(":not([tabindex=-1])");
    focusables.attr("tabindex", -1);
    isIE11() && ele.find("svg, svg *").attr("focusable", "false");
    isFirefox() && ele.find(".csui-normal-scrolling").attr("tabindex", -1);
  }
  function getLanguageObject(key) {
    var langCount = i18n && i18n.settings && i18n.settings[key] ? i18n.settings[key].length : 0, enabled = langCount > 1, langs = langCount > 0 ? i18n.settings[key] : [], defaultLang = langCount ? _.findWhere(i18n.settings[key], {
      default: true
    }).language_code : "";
    return {
      enabled: enabled,
      languages: langs,
      defaultLanguage: defaultLang
    };
  }
  function getLanguageInfo() {
    return getLanguageObject("languages");
  }
  function getMetadataLanguageInfo() {
    var metadataLangInfo = getLanguageObject("metadata_languages");
    return metadataLangInfo;
  }
  function getUserMetadataLanguageInfo() {
    return i18n && i18n.settings && i18n.settings.userMetadataLanguage ? i18n.settings.userMetadataLanguage : "en";
  }
  function isControlClick(event) {
    var returnValue = event && (event.ctrlKey || event.metaKey);
    returnValue = returnValue && (event.currentTarget.tagName.toLowerCase() === "a" || event.currentTarget.getElementsByTagName("a").length > 0);
    return returnValue;
  }
  function isTouchBrowser() {
    return !!("ontouchstart" in window || navigator.maxTouchPoints || navigator.msMaxTouchPoints);
  }
  function isHybrid() {
    return !!("ontouchstart" in window);
  }
  function isAppleMobile() {
    if (navigator && navigator.userAgent != null) {
      var appleMatches = navigator.userAgent.match(/(iPhone |iPad)/i);
      return appleMatches != null;
    }
    return true;
  }
  function isFirefox() {
    if (navigator && navigator.userAgent) {
      var isFirefox = /Firefox/.test(navigator.userAgent);
      return isFirefox;
    }
  }
  function isIE11() {
    if (navigator && navigator.userAgent) {
      var isInternetExplorer11 = /Trident.*11/i.test(navigator.userAgent);
      return isInternetExplorer11;
    }
  }
  function isEdge() {
    if (navigator && navigator.userAgent) {
      var isEdge = /Edge/.test(navigator.userAgent);
      return isEdge;
    }
  }
  function isElementVisibleInParent(el, parent, iPercentX, iPercentY) {
    if (el === undefined || parent === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var container = parent instanceof $ ? parent[0] : parent;
    if (!container || !container.getBoundingClientRect) {
      return false;
    }
    var tolerance = .01;
    var percentX = iPercentX !== undefined ? iPercentX : 100;
    var percentY = iPercentY !== undefined ? iPercentY : 100;
    var elemRect = elem.getBoundingClientRect();
    var contRect = container.getBoundingClientRect();
    var visiblePixelX = Math.min(elemRect.right, contRect.right) - Math.max(elemRect.left, contRect.left);
    var visiblePixelY = Math.min(elemRect.bottom, contRect.bottom) - Math.max(elemRect.top, contRect.top);
    var visiblePercentageX = visiblePixelX / elemRect.width * 100;
    var visiblePercentageY = visiblePixelY / elemRect.height * 100;
    return visiblePercentageX + tolerance > percentX && visiblePercentageY + tolerance > percentY;
  }
  function isElementVisibleInParents(el, levels, iPercentX, iPercentY) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var tolerance = .01;
    var percentX = iPercentX !== undefined ? iPercentX : 100;
    var percentY = iPercentY !== undefined ? iPercentY : 100;
    var elemRect = elem.getBoundingClientRect();
    var parentRects = [];
    var maxLevels = levels || 5;
    var curLevel = 0;
    while (elem.parentElement != null && curLevel < maxLevels) {
      parentRects.push(elem.parentElement.getBoundingClientRect());
      elem = elem.parentElement;
      curLevel++;
    }
    var visibleInAllParents = parentRects.every(function(parentRect) {
      var visiblePixelX = Math.min(elemRect.right, parentRect.right) - Math.max(elemRect.left, parentRect.left);
      var visiblePixelY = Math.min(elemRect.bottom, parentRect.bottom) - Math.max(elemRect.top, parentRect.top);
      var visiblePercentageX = visiblePixelX / elemRect.width * 100;
      var visiblePercentageY = visiblePixelY / elemRect.height * 100;
      return visiblePercentageX + tolerance > percentX && visiblePercentageY + tolerance > percentY;
    });
    return visibleInAllParents;
  }
  function isMSBrowser() {
    return isIE11() || isEdge();
  }
  function isVisibleInWindowViewport(el) {
    var $el = el instanceof $ ? el : $(el);
    if (!$el.is(":visible")) {
      return false;
    }
    var position = $el.offset(), offset = {
      left: window.pageXOffset,
      top: window.pageYOffset
    }, extents = {
      width: $window.width(),
      height: $window.height()
    };
    return position.left >= offset.left && position.left - offset.left < extents.width && position.top >= offset.top && position.top - offset.top < extents.height;
  }
  function isVisibleInWindowViewportHorizontally(el) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var elRect = elem.getBoundingClientRect();
    return elRect.left >= window.pageXOffset && elRect.right - window.pageXOffset < $window.width();
  }
  function isVisibleInWindowViewportVertically(el) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var elRect = elem.getBoundingClientRect();
    return elRect.top >= window.pageYOffset && elRect.bottom - window.pageYOffset < $window.height();
  }
  const isRTL = () => {
    return i18n.settings.rtl === true || document.documentElement.dir === "rtl";
  };
  var transitionEndListener = _.once(function() {
    var transitions = {
      transition: "transitionend",
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd otransitionend"
    }, element = document.createElement("div"), transition;
    for (transition in transitions) {
      if (typeof element.style[transition] !== "undefined") {
        return transitions[transition];
      }
    }
  });
  function onTransitionEnd(element, callback, context) {
    var timeoutRef, transitionEnded = function() {
      clearTimeout(timeoutRef);
      callback.call(context || element);
    };
    timeoutRef = setTimeout(transitionEnded, 2e3);
    element.one(transitionEndListener(), transitionEnded);
  }
  const transitionEnd = _.once(() => {
    let transitions = {
      transition: "transitionend",
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd otransitionend"
    }, element = document.createElement("div"), transition;
    for (transition in transitions) {
      if (typeof element.style[transition] !== "undefined") {
        return transitions[transition];
      }
    }
  });
  const smartDeepClone = obj => {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => smartDeepClone(item));
    }
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = smartDeepClone(obj[key]);
      }
    }
    return clonedObj;
  };
  const deepCloneBackboneCollection = originalCollection => {
    const clonedCollection = new originalCollection.constructor();
    originalCollection.each(function(model) {
      clonedCollection.add(model.clone());
    });
    return clonedCollection;
  };
  return {
    clearFocusables: clearFocusables,
    findFocusables: findFocusables,
    getLanguageInfo: getLanguageInfo,
    getMetadataLanguageInfo: getMetadataLanguageInfo,
    getUserMetadataLanguageInfo: getUserMetadataLanguageInfo,
    isControlClick: isControlClick,
    isTouchBrowser: isTouchBrowser,
    isHybrid: isHybrid,
    isAppleMobile: isAppleMobile,
    isFirefox: isFirefox,
    isIE11: isIE11,
    isEdge: isEdge,
    isMSBrowser: isMSBrowser,
    isElementVisibleInParent: isElementVisibleInParent,
    isElementVisibleInParents: isElementVisibleInParents,
    isVisibleInWindowViewport: isVisibleInWindowViewport,
    isVisibleInWindowViewportHorizontally: isVisibleInWindowViewportHorizontally,
    isVisibleInWindowViewportVertically: isVisibleInWindowViewportVertically,
    isRTL: isRTL,
    onTransitionEnd: onTransitionEnd,
    transitionEnd: transitionEnd,
    smartDeepClone: smartDeepClone,
    deepCloneBackboneCollection: deepCloneBackboneCollection
  };
});