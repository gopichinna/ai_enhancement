/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/base", "i18n" ], function($, _, Backbone, base, i18n) {
  "use strict";
  var origAlignDropDownSubMenus = base.alignDropDownSubMenus;
  function autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser) {
    if (!inputElement.is(":visible")) {
      return false;
    }
    dropdownContainer.css({
      left: 0,
      top: 0
    });
    var hasPerspective = !!inputElement.closest(".cs-perspective-panel").length, isRtl = i18n && i18n.settings.rtl, elTop = inputElement.offset().top, elPositionX = hasPerspective ? inputElement.offset().left : inputElement[0].getBoundingClientRect().left, scrollSelector = inputElement.closest(".csui-perfect-scrolling").length > 0 ? ".csui-perfect-scrolling" : ".csui-normal-scrolling", form = inputElement.closest(scrollSelector), modalContentElem = isIEBrowser ? [] : form.length > 0 ? form.parents(".binf-modal-content, .csui-sidepanel-container") : inputElement.closest(".binf-modal-content, .csui-sidepanel-container"), modalContentPositionX = modalContentElem.length > 0 ? isRtl ? modalContentElem.outerWidth() + modalContentElem.offset().left : modalContentElem.offset().left : isRtl ? $(document).width() : 0, modalContentTop = modalContentElem.length > 0 ? modalContentElem.offset().top : 0, controlheight = inputElement.outerHeight(), dropdownWidth = inputElement.outerWidth(), perspectivePanel = $(".cs-perspective-panel"), closestPerspectivePan = inputElement.closest(".cs-perspective-panel"), perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : inputElement.closest(".cs-perspective"), perspectiveHeight = perspective.length > 0 ? perspective.outerHeight() : $(document).height(), perspectiveTop = perspective.length > 0 ? perspective.offset().top : 0, perspectiveLeft = perspective.length > 0 ? perspective.offset().left : 0, elemBoundingRect = inputElement[0].getBoundingClientRect(), contextBottom, contextTop;
    if (applyWidth) {
      dropdownContainer.css({
        width: dropdownWidth
      });
    }
    if (scrollSelector !== ".csui-normal-scrolling") {
      inputElement.parents(".csui-normal-scrolling").css("overflow", "hidden");
    }
    var perspectivePanelClientTop = perspectivePanel.length > 0 ? perspectivePanel[0].getBoundingClientRect().top : 0;
    if (perspectivePanelClientTop < 0) {
      perspectivePanelClientTop = perspectivePanel.offset().top;
    }
    var perspectiveTopSpace = perspectiveTop > 0 ? perspectiveTop : perspectivePanelClientTop, spaceOnTop = elemBoundingRect.top - perspectiveTopSpace, spaceOnBottom = window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height), isDropdownShownOnTop = spaceOnTop > spaceOnBottom;
    if (scrollableDropdownContainer) {
      scrollableDropdownContainer.css({
        "max-height": Math.abs((isDropdownShownOnTop ? spaceOnTop : spaceOnBottom) * .9) + "px"
      });
      var visibleSiblings = scrollableDropdownContainer.siblings(":visible");
      var siblingsTotalHeight = 0;
      visibleSiblings.each(function(index, sib) {
        siblingsTotalHeight = siblingsTotalHeight + $(sib).outerHeight();
      });
      isDropdownShownOnTop = scrollableDropdownContainer.outerHeight() + siblingsTotalHeight > spaceOnBottom;
    }
    if (isDropdownShownOnTop) {
      if (isIEBrowser) {
        if (perspective.length > 0) {
          contextBottom = perspectiveHeight + perspectiveTop - elemBoundingRect.top;
        } else {
          contextBottom = document.documentElement.offsetHeight + document.documentElement.scrollTop - elTop;
        }
      } else {
        if (modalContentElem.length > 0) {
          contextBottom = modalContentElem.outerHeight() + modalContentTop - elTop;
        } else {
          if (perspective.length > 0 || this.isSafari()) {
            contextBottom = perspectiveHeight + perspectiveTop - elTop;
          } else {
            contextBottom = hasPerspective ? document.documentElement.offsetHeight - elTop : window.innerHeight - inputElement[0].getBoundingClientRect().top;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: "fixed",
          right: modalContentPositionX - (elPositionX + dropdownWidth),
          top: "auto",
          bottom: contextBottom,
          left: "auto"
        });
      } else {
        dropdownContainer.css({
          position: "fixed",
          left: elPositionX - modalContentPositionX - perspectiveLeft,
          top: "auto",
          bottom: contextBottom
        });
      }
      if (dropdownContainer.hasClass("binf-datetimepicker-widget")) {
        dropdownContainer.addClass("binf-top").removeClass("binf-bottom");
      }
    } else {
      if (isIEBrowser) {
        contextTop = elTop + controlheight - document.documentElement.scrollTop;
      } else {
        if (modalContentElem.length > 0) {
          contextTop = elTop + controlheight - modalContentTop;
        } else {
          if (perspective.length > 0) {
            contextTop = elTop + controlheight - perspectiveTop;
          } else {
            contextTop = elemBoundingRect.top + elemBoundingRect.height - perspectiveTop;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: "fixed",
          right: modalContentPositionX - (elPositionX + dropdownWidth),
          top: contextTop,
          bottom: "auto",
          left: "auto"
        });
      } else {
        dropdownContainer.css({
          position: "fixed",
          left: elPositionX - modalContentPositionX - perspectiveLeft,
          top: contextTop,
          bottom: "auto"
        });
      }
      if (dropdownContainer.hasClass("binf-datetimepicker-widget")) {
        dropdownContainer.addClass("binf-bottom").removeClass("binf-top");
      }
    }
  }
  let origIsAppleMobile = base.isAppleMobile;
  function isAppleMobile() {
    return origIsAppleMobile.apply(this, arguments) || this.isMacintosh() && this.isTouchBrowser();
  }
  function alignDropDownSubMenus(options) {
    origAlignDropDownSubMenus(options);
    var $dropdown = options.dropdownMenu, $targetEl = options.targetEl;
    var scrollHeight = document.body.getBoundingClientRect().top, currentElementTop = $targetEl.offset().top + scrollHeight, currentElementHeight = $targetEl.innerHeight(), screenHeight = $(window).outerHeight(), bottom = 0;
    if ($targetEl.hasClass("binf-dropup")) {
      bottom = Math.max(screenHeight - currentElementTop - currentElementHeight, bottom);
      $dropdown.css("bottom", bottom + "px");
      $dropdown.css("top", "auto");
    }
  }
  _.extend(base, {
    autoAlignDropDowns: autoAlignDropDowns,
    isAppleMobile: isAppleMobile,
    alignDropDownSubMenus: alignDropDownSubMenus
  });
});