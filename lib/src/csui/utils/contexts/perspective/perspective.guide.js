/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore" ], function(_) {
  function PerspectiveGuide() {}
  PerspectiveGuide.prototype = {
    isNew: function(oldPerspective, newPerspective) {
      var attributeA = sortKeys(_.omit(newPerspective, [ "showWidgetInMaxMode", "id", "canEditPerspective" ]));
      var attributeB = sortKeys(_.omit(oldPerspective, [ "showWidgetInMaxMode", "id", "canEditPerspective" ]));
      return !_.isEqual(attributeA, attributeB);
    }
  };
  function sortKeys(a) {
    var keysA = Object.keys(a).sort();
    return keysA.reduce(function(result, item) {
      result[item] = a[item];
      return result;
    }, {});
  }
  return PerspectiveGuide;
});