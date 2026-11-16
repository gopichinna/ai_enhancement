/**
 * @preserve
 * http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
 *
 * Copyright © 2010-2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

define(["module", "csui/lib/jquery", 'smart/lib/binf/js/binf' ], function (module, $) {
  var scrollbarWidth = {};
  function scrollWidth (className) {
    var parent,
      child;

    if (scrollbarWidth[className] === undefined) {
      parent = $("<div></div>").css({
        width: "50px",
        height: "50px",
        overflow: "auto",
        position: "absolute",
        visibility: "hidden"
      }).appendTo($.fn.binf_modal.getDefaultContainer());
      child = $("<div></div>");
      var classAttr = className ? ' class="'+className+'"' : '';
      $("<div"+classAttr+"></div>").css($.extend({
        width: "100%",
        height: "100%"
      },className?{}:{overflow:"auto"})).append(child).appendTo(parent);
      scrollbarWidth[className] = child.innerWidth() - child.height(99).innerWidth();
      parent.remove();
    }

    return scrollbarWidth[className];
  }

  $.scrollbarWidth = function () {
    return scrollWidth("csui-normal-scrolling");
  };

  // See http://stackoverflow.com/a/15432281/623816
  $.inScrollRange = function (event) {
    var x = event.pageX,
      y = event.pageY,
      e = $(event.target),
      hasY = e.hasScroll(),
      hasX = e.hasScroll("x"),
      rX,
      rY,
      bInX,
      bInY,
      scrollSize = scrollWidth("");
    if (hasY) {
      rY = new Rectangle();
      rY.top = e.offset().top;
      rY.right = e.offset().left + e.width();
      rY.bottom = rY.top + e.height();
      rY.left = rY.right - scrollSize;

      //if (hasX) rY.bottom -= scrollSize;
      bInY = rY.contains(x, y);
    }
    if (hasX) {
      rX = new Rectangle();
      rX.bottom = e.offset().top + e.height();
      rX.left = e.offset().left;
      rX.top = rX.bottom - scrollSize;
      rX.right = rX.left + e.width();

      // if(hasY) rX.right -= scrollSize;
      bInX = rX.contains(x, y);
    }
    return bInX || bInY;
  }

  $.fn.hasScroll = function (axis) {
    var firstElement = this.get(0);
    if (!firstElement) {
      return false;
    }
    var overflow, bShouldScroll;
    if ( typeof axis === "undefined" || axis === "y") {
      overflow = window.getComputedStyle(firstElement)["overflow-y"],
      bShouldScroll = firstElement.scrollHeight > firstElement.clientHeight;
    } else {
      overflow = window.getComputedStyle(firstElement)["overflow-x"],
      bShouldScroll = firstElement.scrollWidth > firstElement.clientWidth;
    }
    var bAllowedScroll = overflow === "visible" || overflow === "auto" || overflow === "overlay",
      bOverrideScroll = overflow === "scroll";
    return bShouldScroll && bAllowedScroll || bOverrideScroll;
  };

  function Rectangle() {
    this.top = 0;
    this.left = 0;
    this.bottom = 0;
    this.right = 0;
  }

  Rectangle.prototype.contains = function (x, y) {
    return y >= this.top && y <= this.bottom &&
           x >= this.left && x <= this.right;
  }

  $.scrollbarWidth.version = "1.1";
});
