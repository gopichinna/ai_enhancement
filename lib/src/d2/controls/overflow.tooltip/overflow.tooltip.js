/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery" ], function($) {
  "use strict";
  var JQ_EVENTS = "mouseenter.d2_overflow_tooltip mouseleave.d2_overflow_tooltip", DATA_ATTR_NAME = "data-d2-overflow-tooltip", EL_SELECTOR = "[" + DATA_ATTR_NAME + "], .d2-overflow-tooltip, .d2-overflow-tooltip>*";
  function showOrHideDefaultTooltipIfTextOverflows(event) {
    var $el = $(event.target), el = $el[0], tooltipValue = $el.attr(DATA_ATTR_NAME) || $el.text(), title = $el.attr("title");
    if (!title && event.type === "mouseenter") {
      if (el.offsetWidth < el.scrollWidth) {
        var attrs = {
          title: tooltipValue
        };
        attrs[DATA_ATTR_NAME] = tooltipValue;
        $el.attr(attrs);
        $el.data("d2OverflowTooltip", true);
      }
    } else if ((event.type === "mouseleave" || el.offsetWidth >= el.scrollWidth) && title === tooltipValue && $el.data("d2OverflowTooltip") === true) {
      $el.removeAttr("title");
    }
  }
  $(document).off(JQ_EVENTS).on(JQ_EVENTS, EL_SELECTOR, showOrHideDefaultTooltipIfTextOverflows);
});