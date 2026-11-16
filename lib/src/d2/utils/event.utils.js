/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/base" ], function($, _, base) {
  "use strict";
  return {
    enableTouchEventsByClass: function(elementIdentifier) {
      if (base.isTouchBrowser() && elementIdentifier) {
        _.each($(elementIdentifier), function(item) {
          $(item).on("touchstart touchmove touchend", function(event) {
            var touches = event.originalEvent.changedTouches;
            var element = touches[0];
            var type = "";
            switch (event.type) {
             case "touchstart":
              type = "mousedown";
              break;

             case "touchmove":
              type = "mousemove";
              break;

             case "touchend":
              type = "mouseup";
              break;

             default:
              return;
            }
            var mouseEventInit = {
              bubbles: true,
              cancelable: true,
              view: window,
              screenX: element.screenX,
              screenY: element.screenY,
              clientX: element.clientX,
              clientY: element.clientY
            };
            var mouseEvent = new MouseEvent(type, mouseEventInit);
            element.target.dispatchEvent(mouseEvent);
          });
        });
      }
    }
  };
});