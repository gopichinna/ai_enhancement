/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function() {
  "use strict";
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function mergeArrays(target, source) {
    if (!source) {
      return target && (target.slice ? target.slice() : target) || [];
    }
    if (!target) {
      return source && (source.slice ? source.slice() : source) || [];
    }
    target = target.slice ? target.slice() : target;
    for (var i = 0, l = source.length; i < l; ++i) {
      var item = source[i];
      if (target.indexOf(item) < 0) {
        target.push(item);
      }
    }
    return target;
  }
  function mergeExtraData(objects) {
    if (!Array.isArray(objects)) {
      objects = Array.prototype.slice.call(arguments);
    }
    var merged = {};
    for (var i = 0, l = objects.length; i < l; ++i) {
      var object = objects[i];
      if (!object) {
        continue;
      }
      for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
          merged[key] = mergeArrays(object[key], merged[key]);
        }
      }
    }
    return merged;
  }
  return mergeExtraData;
});