/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "nuc/utils/errormessage", "nuc/utils/messagehelper", "nuc/utils/types/date", "nuc/utils/types/number", "nuc/utils/types/member", "nuc/utils/types/localizable", "i18n", "smart/utils/smart.base" ], function(_, $, Url, Message, MessageHelper, date, number, member, localizable, i18n, smartBase) {
  "use strict";
  var messageHelper = MessageHelper.getInstance();
  var escapeHtmlHelper = $("<p></p>");
  function escapeHtml(text, preserveLineBreaks) {
    var html = escapeHtmlHelper.text(text).html();
    if (preserveLineBreaks) {
      html = html.replace(/\r?\n/g, "\r\n<br>");
    }
    return html;
  }
  function isBackbone(value) {
    return value && value.once;
  }
  function isPlaceholder(value) {
    return value && (_.isString(value) || _.isElement(value) || value instanceof $);
  }
  function isMacintosh() {
    return navigator.platform.indexOf("Mac") > -1;
  }
  function isIOSBrowser() {
    return navigator.userAgent.indexOf("Mac") > -1;
  }
  function isLandscape() {
    return smartBase.isAppleMobile() && window.matchMedia("(orientation: landscape)").matches;
  }
  function isPortrait() {
    return smartBase.isAppleMobile() && window.matchMedia("(orientation: portrait)").matches;
  }
  function isMozilla() {
    if (navigator && navigator.userAgent) {
      var isMozilla = /Mozilla/.test(navigator.userAgent);
      return isMozilla;
    }
  }
  function isChrome() {
    var isChromium = window.chrome, winNav = window.navigator, vendorName = winNav.vendor, isOpera = winNav.userAgent.indexOf("OPR") > -1, isIEedge = winNav.userAgent.indexOf("Edge") > -1, isIOSChrome = winNav.userAgent.match("CriOS"), retVal = false;
    if (isIOSChrome || isChromium != null && vendorName === "Google Inc." && isOpera === false && isIEedge === false) {
      retVal = true;
    }
    return retVal;
  }
  function isSafari() {
    if (navigator && navigator.userAgent) {
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      return isSafari;
    }
  }
  function px2em(pxContainerWidth, pxElemWidth) {
    var pxInEms = 0;
    if (pxElemWidth > 0) {
      pxInEms = Math.floor(2 * pxContainerWidth / pxElemWidth);
    }
    return pxInEms;
  }
  function checkAndScrollElemToViewport(elem) {
    var $elem = $(elem), scrollSelector = $elem.closest(".csui-perfect-scrolling").length > 0 ? ".csui-perfect-scrolling" : ".csui-normal-scrolling", elemScrollParent = $elem.closest(scrollSelector), stickyHeader = elemScrollParent.siblings(".csui-tab-contents-header-wrapper");
    if (stickyHeader[0]) {
      var elemTop = $elem.offset().top, viewportTop = elemScrollParent[0].getBoundingClientRect().top + stickyHeader.height(), isElemVisible = elemTop > viewportTop;
      if (!isElemVisible) {
        var currScrollTop = elemScrollParent.scrollTop();
        elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
      }
    }
  }
  function setScrollHandler(e) {
    var eventArg = e.data;
    var inputElement = eventArg.inputElement, view = eventArg.view, dropdownContainer = eventArg.dropdownContainer, callback = eventArg.callback;
    inputElement.parents(".csui-normal-scrolling").css("overflow", "auto");
    if (dropdownContainer.length > 0 && dropdownContainer[0] !== e.target && dropdownContainer.is(":visible") && callback) {
      callback(view);
    }
  }
  function adjustDropDownField(inputElement, dropdownContainer, applyWidth, view, callback, scrollableDropdownContainer) {
    var scrollEl;
    var eventArg = {
      inputElement: inputElement,
      view: view,
      dropdownContainer: dropdownContainer,
      callback: callback
    };
    var isIEBrowser = smartBase.isIE11(), isTouchBrowser = smartBase.isTouchBrowser();
    if (isTouchBrowser && !inputElement.closest(".csui-scrollable-writemode").hasClass("csui-dropdown-open")) {
      inputElement.closest(".csui-scrollable-writemode").addClass("csui-dropdown-open");
    }
    if (inputElement.parents(".csui-scrollablecols").length > 0 && inputElement.parents(".cs-form-set-container").length > 0) {
      scrollEl = inputElement.parents(".csui-scrollablecols").parents(".cs-form-set-container").find(".ps-container.ps-active-x");
      var isRtl = i18n && i18n.settings.rtl, inputElementLeft = inputElement.offset().left, leftShadow = inputElement.parents(".csui-scrollablecols").siblings(".csui-lockedcols").find(".csui-shadowleft-container"), leftShadowLeft = leftShadow.offset().left, currentLeft, scrollUpdate;
      if (isRtl) {
        var inputElementRight = inputElementLeft + inputElement.outerWidth();
        scrollUpdate = inputElementRight - leftShadowLeft;
      } else {
        var leftShadowRight = leftShadowLeft + leftShadow.outerWidth();
        scrollUpdate = leftShadowRight - inputElementLeft;
      }
      if (scrollUpdate > 0) {
        var that = this;
        scrollEl.off("scroll", this.setScrollHandler);
        scrollEl.one("set:scrolled", function() {
          if (scrollEl) {
            scrollEl.on("scroll", eventArg, that.setScrollHandler);
          }
          that.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser);
          that.hideDropDowns(inputElement, dropdownContainer, view, callback);
        });
        if (isRtl) {
          currentLeft = scrollEl.scrollLeftRtl();
          scrollEl.scrollLeftRtl(currentLeft + scrollUpdate);
        } else {
          currentLeft = scrollEl.scrollLeft();
          scrollEl.scrollLeft(currentLeft - scrollUpdate);
          setTimeout(function() {
            if (smartBase.isTouchBrowser && !inputElement.closest(".csui-scrollable-writemode").hasClass(".csui-dropdown-open")) {
              inputElement.closest(".csui-scrollable-writemode").addClass("csui-dropdown-open");
            }
          }, 100);
        }
        return;
      }
    }
    if (scrollEl) {
      scrollEl.off("scroll", this.setScrollHandler).on("scroll", eventArg, this.setScrollHandler);
    }
    this.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser);
    this.hideDropDowns(inputElement, dropdownContainer, view, callback);
  }
  var I = new DOMMatrix();
  function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  Point.prototype.transformBy = function(matrix) {
    var tmp = matrix.multiply(I.translate(this.x, this.y, this.z));
    return new Point(tmp.m41, tmp.m42, tmp.m43);
  };
  function getTransformStyle(element) {
    var computedStyle = window.getComputedStyle(element);
    var transform = computedStyle.transform;
    var display = computedStyle.display;
    if (transform && transform !== "none" && display !== "inline") {
      return transform;
    }
    var contain = computedStyle.contain;
    if (contain === "layout") {
      return I;
    }
  }
  function getTransformInfo(target) {
    for (var parent = target; parent; parent = parent.parentElement) {
      var transform = getTransformStyle(parent);
      if (transform) {
        return {
          element: parent,
          transform: transform
        };
      }
    }
  }
  function getTransformParentInfo(target) {
    return getTransformInfo(target.parentElement);
  }
  function getElementToPageTransformationMatrix(element) {
    var transform = getTransformStyle(element);
    var transformationMatrix = transform ? new DOMMatrix(transform) : I;
    for (var x = getTransformParentInfo(element); x; x = getTransformParentInfo(x.element)) {
      transformationMatrix = transformationMatrix.multiply(new DOMMatrix(x.transform));
    }
    var w = element.offsetWidth;
    var h = element.offsetHeight;
    var p1 = new Point(0, 0, 0).transformBy(transformationMatrix);
    var p2 = new Point(w, 0, 0).transformBy(transformationMatrix);
    var p3 = new Point(w, h, 0).transformBy(transformationMatrix);
    var p4 = new Point(0, h, 0).transformBy(transformationMatrix);
    var left = Math.min(p1.x, p2.x, p3.x, p4.x);
    var top = Math.min(p1.y, p2.y, p3.y, p4.y);
    var rect = element.getBoundingClientRect();
    transformationMatrix = I.translate(window.scrollX + rect.left - left, window.scrollY + rect.top - top, 0).multiply(transformationMatrix);
    return transformationMatrix;
  }
  function getPageToElementTransformationMatrix(element) {
    return getElementToPageTransformationMatrix(element).inverse();
  }
  function getOffsetsForFixedPosition(target, dropdown, differentParents) {
    var transformParentInfo = getTransformParentInfo(differentParents ? dropdown : target);
    var offsets;
    if (transformParentInfo) {
      var transformParent = transformParentInfo.element;
      var pageToTrans = getPageToElementTransformationMatrix(transformParent).translate(transformParent.scrollLeft, transformParent.scrollTop, 0);
      var targetToPage = getElementToPageTransformationMatrix(target);
      var targetTopLeft = new Point(0, 0, 0).transformBy(targetToPage).transformBy(pageToTrans);
      var targetBottomRight = new Point(target.offsetWidth, target.offsetHeight, 0).transformBy(targetToPage).transformBy(pageToTrans);
      var borderTopWidth = +(window.getComputedStyle(transformParent)["border-top-width"] || "") || 0;
      var borderLeftWidth = +(window.getComputedStyle(transformParent)["border-left-width"] || "") || 0;
      offsets = {
        top: targetTopLeft.y - borderTopWidth,
        left: targetTopLeft.x - borderLeftWidth,
        bottom: targetBottomRight.y - borderTopWidth,
        right: targetBottomRight.x - borderLeftWidth,
        height: transformParent.clientHeight,
        width: transformParent.clientWidth
      };
    } else {
      var display = dropdown.style["display"];
      dropdown !== target && $(dropdown).css({
        display: "none"
      });
      var targetRect = target.getBoundingClientRect();
      offsets = {
        top: targetRect.top,
        left: targetRect.left,
        bottom: targetRect.bottom,
        right: targetRect.right,
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth
      };
      dropdown !== target && $(dropdown).css({
        display: display
      });
    }
    return offsets;
  }
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
    if (scrollSelector != ".csui-normal-scrolling") {
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
      isDropdownShownOnTop = scrollableDropdownContainer.outerHeight() > spaceOnBottom;
    }
    var offsets = getOffsetsForFixedPosition(inputElement[0], dropdownContainer[0]);
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
          if (perspective.length > 0 || isSafari()) {
            contextBottom = perspectiveHeight + perspectiveTop - elTop;
          } else {
            contextBottom = hasPerspective ? document.documentElement.offsetHeight - elTop : window.innerHeight - inputElement[0].getBoundingClientRect().top;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: "fixed",
          right: offsets.width - offsets.right,
          top: "auto",
          bottom: offsets.height - offsets.top,
          left: "auto"
        });
      } else {
        dropdownContainer.css({
          position: "fixed",
          left: offsets.left,
          top: "auto",
          bottom: offsets.height - offsets.top
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
          right: offsets.width - offsets.right,
          top: offsets.bottom,
          bottom: "auto",
          left: "auto"
        });
      } else {
        dropdownContainer.css({
          position: "fixed",
          left: offsets.left,
          top: offsets.bottom,
          bottom: "auto"
        });
      }
      if (dropdownContainer.hasClass("binf-datetimepicker-widget")) {
        dropdownContainer.addClass("binf-bottom").removeClass("binf-top");
      }
    }
  }
  function alignDropDownMenu(options) {
    var $targetEl = options.targetEl, $dropdownMenu = options.dropdownMenu || $targetEl.nextAll(".binf-dropdown-menu"), hAlignment = options.hAlignment || "left", vAlignment = options.vAlignment || "bottom", isRtl = i18n && i18n.settings.rtl;
    if (!$targetEl.length || !$targetEl.is(":visible") || !$dropdownMenu.length) {
      return false;
    }
    $dropdownMenu.css({
      maxHeight: "",
      maxWidth: "",
      top: "",
      left: "",
      right: "",
      bottom: ""
    });
    $dropdownMenu.removeClass("binf-dropdown-align-left-top binf-dropdown-align-left-bottom" + " binf-dropdown-align-right-top binf-dropdown-align-right-bottom");
    var dropdownHeight = $dropdownMenu.outerHeight(), dropdownWidth = $dropdownMenu.outerWidth();
    $dropdownMenu.addClass("binf-hidden");
    var documentWidth = options.width ?? $(window).width(), documentHeight = $(window).height(), maxWidthAllowed = parseInt($dropdownMenu.css("maxWidth"), 10) || 224, viewportOffset = $targetEl[0].getBoundingClientRect(), top = viewportOffset.bottom, left = viewportOffset.left, right = documentWidth - viewportOffset.right, bottom = documentHeight - viewportOffset.top, scrollLeft = window.pageXOffset || document.documentElement.scrollLeft, scrollTop = window.pageYOffset || document.documentElement.scrollTop, spaceTop = viewportOffset.top - 10, spaceBottom = documentHeight - viewportOffset.bottom - 10, spaceLeft = viewportOffset.right - 10, spaceRight = documentWidth - viewportOffset.left - 10;
    if (vAlignment === "bottom" && spaceBottom <= dropdownHeight) {
      if (spaceTop > dropdownHeight || spaceTop > spaceBottom) {
        vAlignment = "top";
      }
    } else if (vAlignment === "top" && spaceTop <= dropdownHeight) {
      if (spaceBottom > dropdownHeight || spaceBottom > spaceTop) {
        vAlignment = "bottom";
      }
    }
    hAlignment = isRtl ? hAlignment === "left" ? "right" : "left" : hAlignment;
    if (hAlignment === "left" && spaceRight <= dropdownWidth) {
      if (spaceLeft > dropdownWidth || spaceLeft > spaceRight) {
        hAlignment = "right";
      }
    } else if (hAlignment === "right" && spaceLeft <= dropdownWidth) {
      if (spaceRight > dropdownWidth || spaceRight > spaceLeft) {
        hAlignment = "left";
      }
    }
    $dropdownMenu.addClass("binf-dropdown-align-" + hAlignment + "-" + vAlignment);
    if (!smartBase.isIE11()) {
      var closestPerspectivePan = $targetEl.closest(".cs-perspective-panel"), modelContent = $targetEl.parents(".binf-modal-content"), $transformParent = closestPerspectivePan.length ? closestPerspectivePan : $targetEl.closest(".cs-perspective");
      $transformParent = $transformParent.length ? $transformParent : modelContent;
      if ($transformParent.length > 0) {
        var transParentOffset = $transformParent.offset(), $elDocOffset = $targetEl.offset();
        top += scrollTop - transParentOffset.top;
        left += scrollLeft - transParentOffset.left;
        right = $transformParent.outerWidth() + transParentOffset.left - $elDocOffset.left - $targetEl.outerWidth();
        bottom = $transformParent.outerHeight() + transParentOffset.top - $elDocOffset.top;
      }
    }
    const dropdownParent = $dropdownMenu.parent()[0];
    const differentParents = dropdownParent && $targetEl.parent()[0] !== dropdownParent;
    var offsets = getOffsetsForFixedPosition($targetEl[0], $dropdownMenu[0], differentParents);
    var styles = {
      position: "fixed"
    };
    if (hAlignment === "left") {
      styles = _.extend(styles, {
        left: offsets.left
      });
      if (isRtl) {
        styles = _.extend(styles, {
          right: "auto"
        });
      }
      if (spaceRight < maxWidthAllowed) {
        styles.maxWidth = spaceRight;
      }
    } else {
      styles = _.extend(styles, {
        right: offsets.width - offsets.right
      });
    }
    if (vAlignment === "bottom") {
      styles = _.extend(styles, {
        top: offsets.bottom
      });
    } else {
      styles = _.extend(styles, {
        bottom: offsets.height - offsets.top
      });
    }
    $dropdownMenu.css(styles);
    $dropdownMenu.removeClass("binf-hidden");
    if (differentParents) {
      const csswid = $dropdownMenu.attr("csswid") || $dropdownMenu.attr("csswid", _.uniqueId("cssw")).attr("csswid");
      if (!$dropdownMenu.attr("csswid-listening")) {
        const visited = startListenToScrollEvents(csswid, $targetEl, $dropdownMenu, () => {
          if ($dropdownMenu.parent().hasClass("binf-open")) {
            const topelement = visited[0];
            const elements = getElementsCoveringToggle($targetEl[0], vAlignment, topelement);
            const elementsAreInBetweenLayer = elements ? isDropdownCoveringElements($dropdownMenu[0], elements, vAlignment, hAlignment, $targetEl[0], topelement) : undefined;
            if (elementsAreInBetweenLayer || elementsAreInBetweenLayer === undefined) {
              $dropdownMenu.binf_dropdown("toggle");
            } else {
              alignDropDownMenu({
                targetEl: $targetEl,
                dropdownMenu: $dropdownMenu
              });
            }
          }
        });
        $dropdownMenu.attr("csswid-listening", true);
        $dropdownMenu.parent().one("hidden.binf.dropdown", () => {
          $dropdownMenu.attr("csswid-listening", null);
          stopListenToScrollEvents(csswid, visited);
        });
      }
    }
    return;
  }
  function startListenToScrollEvents(csswid, targetEl, dropdownMenu, listener) {
    var inListener;
    const eventName = "scroll." + csswid;
    const debounce = _.debounce(() => {
      inListener = true;
      listener();
      inListener = false;
    }, 10);
    const visited = traverseParents(targetEl[0], dropdownMenu[0], el => {
      $(el).off(eventName).on(eventName, function() {
        if (!inListener) {
          debounce();
        }
      });
    });
    return visited;
  }
  function stopListenToScrollEvents(csswid, visited) {
    visited.forEach(el => $(el).off("scroll." + csswid));
  }
  function getClosestCommonParent(startNode, endNode) {
    if (startNode.contains(endNode)) return startNode;
    if (endNode.contains(startNode)) return endNode;
    const range = new Range();
    range.setStartBefore(startNode);
    range.setEndAfter(endNode);
    if (range.collapsed) {
      range.setStartBefore(endNode);
      range.setEndAfter(startNode);
    }
    return range.commonAncestorContainer;
  }
  function traverseParents(toggle, dropdown, callback) {
    const common = getClosestCommonParent(toggle, dropdown);
    const transform = getTransformInfo(common);
    const topelement = transform ? transform.element : document;
    const visited = [ topelement ];
    const nodes = [ toggle, dropdown ];
    for (let ii = 0; ii < nodes.length; ii++) {
      for (let parent = nodes[ii].parentNode; parent; parent = parent.parentNode) {
        if (visited.includes(parent)) {
          break;
        }
        visited.push(parent);
        callback(parent);
      }
    }
    callback(topelement);
    return visited;
  }
  function getElementsCoveringToggle(toggle, vAlign, topelement) {
    const toggleRect = toggle.getBoundingClientRect();
    var result = [];
    const checks = [];
    checks.push(document.elementsFromPoint(toggleRect.left + 1, vAlign === "bottom" ? toggleRect.bottom - 1 : toggleRect.top));
    checks.push(document.elementsFromPoint(toggleRect.right - 1, vAlign === "bottom" ? toggleRect.bottom - 1 : toggleRect.top));
    let resultValid;
    checks.forEach(elems => {
      let checkValid;
      const checked = [];
      for (let ll = 0; ll < elems.length; ll++) {
        if (topelement === elems[ll]) {
          break;
        }
        if (toggle === elems[ll] || toggle.contains(elems[ll])) {
          checkValid = true;
          break;
        }
        if (elems[ll].contains(toggle)) {
          continue;
        }
        if (result.includes(elems[ll])) {
          continue;
        }
        checked.push(elems[ll]);
      }
      if (checkValid) {
        resultValid = true;
        result = result.concat(checked);
      }
    });
    return resultValid ? result : undefined;
  }
  function isDropdownCoveringElements(dropdown, toggleCoveringElements, vAlign, hAlign, toggle, topelement) {
    if (toggleCoveringElements.length > 0) {
      const toggleRect = toggle.getBoundingClientRect();
      const menuRect = dropdown.getBoundingClientRect();
      const checks = [];
      dropdown.style["border-radius"] = 0;
      checks.push(document.elementsFromPoint(hAlign === "left" ? menuRect.left + 1 : menuRect.right - toggleRect.width, vAlign === "bottom" ? menuRect.top + 1 : menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop();
      }
      checks.push(document.elementsFromPoint(hAlign === "left" ? menuRect.left + toggleRect.width : menuRect.right - 1, vAlign === "bottom" ? menuRect.top + 1 : menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop();
      }
      dropdown.style["border-radius"] = null;
      if (checks.length === 0) {
        return undefined;
      }
      let coveringPointsCount = 0;
      for (let cc = 0; cc < checks.length; cc++) {
        let dropdownPointElements = checks[cc];
        let underDropdown = false;
        let includeCount = 0;
        for (let ll = 0; ll < dropdownPointElements.length; ll++) {
          if (topelement === dropdownPointElements[ll]) {
            break;
          }
          if (dropdownPointElements[ll] === dropdown) {
            underDropdown = true;
            continue;
          }
          let included = toggleCoveringElements.includes(dropdownPointElements[ll]);
          if (included) {
            if (underDropdown) {
              coveringPointsCount += 1;
              break;
            }
            includeCount += 1;
            if (includeCount === toggleCoveringElements.length) {
              break;
            }
          }
        }
      }
      return coveringPointsCount === checks.length;
    }
    return false;
  }
  function alignDropDownSubMenus(options) {
    var $dropdown = options.dropdownMenu, $targetEl = options.targetEl, $childEl = $targetEl.children(), isRtl = i18n && i18n.settings.rtl, viewportWidth = window.innerWidth || document.documentElement.clientWidth, bounding = $targetEl[0].getBoundingClientRect(), childBounding = $childEl[0].getBoundingClientRect(), dropdownBounding = $dropdown[0].getBoundingClientRect(), isPullDown = $targetEl.hasClass("binf-pull-down"), isLandingTileView = $targetEl.parents().hasClass("csui-tileview-more-btn"), startPosition = isPullDown === isRtl ? bounding.right : bounding.left, rightSpaceAvailable = isRtl ? startPosition : viewportWidth - startPosition, leftSpaceAvailable = isRtl ? viewportWidth - bounding.right : bounding.left;
    $targetEl.removeClass("binf-dropdown-menu-left binf-dropdown-menu-right");
    $dropdown.css({
      left: "",
      right: "",
      top: "",
      bottom: "",
      position: ""
    });
    $dropdown.removeAttr("style");
    $dropdown.removeClass("csui-fixed-submenu csui-perfect-scrolling csui-normal-scrolling csui-no-scroll-x");
    if (Math.floor(rightSpaceAvailable) <= dropdownBounding.width || $targetEl.parent().closest(".binf-dropdown-submenu").hasClass("binf-dropdown-menu-left") && leftSpaceAvailable > dropdownBounding.width) {
      $targetEl.addClass("binf-dropdown-menu-left");
    }
    $targetEl.removeClass("binf-dropup");
    var ulOffset = $dropdown.offset();
    var spaceUp = ulOffset.top - $dropdown.outerHeight() - $(window).scrollTop();
    var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $dropdown.outerHeight());
    if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown) || $targetEl.parent().closest(".binf-dropdown-submenu").hasClass("binf-dropup") && spaceUp > spaceDown) {
      $targetEl.addClass("binf-dropup");
    }
    var scrollOffset = $targetEl.parent().scrollTop(), perspectiveOffsetTop = 0;
    $targetEl.parent().css("overflow", "visible");
    var offsets = getOffsetsForFixedPosition($dropdown[0], $dropdown[0]);
    var viewportOffset = $dropdown[0].getBoundingClientRect(), top = viewportOffset.top, left = viewportOffset.left;
    $targetEl.parent().css("overflow", "");
    if (!smartBase.isIE11()) {
      var modalContentElem = $targetEl.parents(".binf-modal-content"), closestPerspectivePan = $targetEl.closest(".cs-perspective-panel"), landingPerspective = $targetEl.closest(".cs-perspective"), perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : landingPerspective;
      if (modalContentElem.length > 0) {
        var modalOffset = modalContentElem.offset();
        top = top - modalOffset.top - scrollOffset;
        left = left - modalOffset.left;
      } else if (perspective.length > 0) {
        var perspectiveOffset = perspective.offset(), perspectiveBounding = landingPerspective[0].getBoundingClientRect();
        perspectiveOffsetTop = isLandingTileView ? perspectiveBounding.top : perspectiveOffset.top;
        top = top - perspectiveOffsetTop - scrollOffset;
        left = left - perspectiveOffset.left;
      }
    }
    $targetEl.parent().css("overflow", "visible");
    if ($targetEl.hasClass("binf-dropdown-menu-left")) {
      left += !isPullDown ? $targetEl.width() - $dropdown.width() : 0;
      offsets.left = offsets.left + (!isPullDown ? $targetEl.width() - $dropdown.width() : 0);
    }
    if (isPullDown) {
      top = top - (bounding.bottom - childBounding.bottom);
      offsets.top = offsets.top - (bounding.bottom - childBounding.bottom);
    }
    var scrollHeight = document.body.getBoundingClientRect().top, currentElementTop = $targetEl.offset().top + scrollHeight, currentElementHeight = $targetEl.innerHeight(), screenHeight = $(window).outerHeight(), bottom = 0;
    $targetEl.parent().css("overflow", "");
    $dropdown.addClass("csui-fixed-submenu");
    var subMenuCSS = {
      position: "fixed",
      left: offsets.left
    };
    if ($targetEl.parents().hasClass("csui-nodestable") && !smartBase.isIE11()) {
      top = top + window.scrollY;
    }
    if ($targetEl.hasClass("binf-dropup")) {
      bottom = screenHeight - currentElementTop - currentElementHeight;
      bottom = bottom < 0 ? 0 : bottom;
      if (smartBase.isIE11()) {
        _.extend(subMenuCSS, {
          bottom: offsets.top,
          top: "auto",
          maxHeight: screenHeight - bottom
        });
      } else {
        _.extend(subMenuCSS, {
          bottom: "auto",
          top: offsets.top + $targetEl.height() / 2,
          maxHeight: screenHeight - bottom
        });
      }
    } else {
      _.extend(subMenuCSS, {
        top: offsets.top,
        bottom: "auto",
        maxHeight: screenHeight - (top + perspectiveOffsetTop)
      });
    }
    $dropdown.css(subMenuCSS);
    require([ "csui/controls/tile/behaviors/perfect.scrolling.behavior" ], function(PerfectScrollingBehavior) {
      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        $dropdown.addClass("csui-perfect-scrolling");
        $dropdown.perfectScrollbar({
          suppressScrollX: true,
          includePadding: true
        });
      } else {
        $dropdown.addClass("csui-normal-scrolling csui-no-scroll-x");
      }
      var $scrollParent = $targetEl.closest(".binf-dropdown-menu");
      $scrollParent.off("scroll.csui.submenu").on("scroll.csui.submenu", _.bind(function(event) {
        !$dropdown.is(":hidden") && $targetEl.binf_dropdown_submenu("hide");
        $scrollParent.off("scroll.csui.inline.actions");
      }, this));
    });
  }
  function hideDropDowns(inputElement, dropdownContainer, view, callback) {
    var scrollSelector = inputElement.closest(".csui-perfect-scrolling").length > 0 ? ".csui-perfect-scrolling" : ".csui-normal-scrolling", eventArg = {
      inputElement: inputElement,
      view: view,
      dropdownContainer: dropdownContainer,
      callback: callback
    };
    this.getParentScrollViews(inputElement[0], scrollSelector).forEach(scrollView => {
      $(scrollView).off("scroll", this.setScrollHandler).on("scroll", eventArg, this.setScrollHandler);
    });
    $(window).off("scroll", this.setScrollHandler).on("scroll", eventArg, this.setScrollHandler);
    $(window).off("resize", this.setScrollHandler).on("resize", eventArg, this.setScrollHandler);
  }
  function getParentScrollViews(inputElement, scrollSelector, scrollParents = []) {
    if (!inputElement || inputElement === document.documentElement) {
      return scrollParents;
    }
    if (inputElement.matches(scrollSelector)) {
      scrollParents.push(inputElement);
    }
    return this.getParentScrollViews(inputElement.parentElement, scrollSelector, scrollParents);
  }
  function stringifyDate(date) {
    return JSON.stringify(date);
  }
  function dateToLocalIsoString(dateStr, format) {
    if (format === "YYYY-MM-DD" || format === "MM/DD/YYYY" || format === "DD/MM/YYYY") {
      return date.serializeDate(dateStr);
    }
    return date.serializeDateTime(dateStr);
  }
  function applyEllipsis(element, numberOfLines) {
    var measure, text, lineWidth, lineStart, lineCount, wordStart, line, lineText, wasNewLine, updatedFirstLineWidth = false, createElement = document.createElement.bind(document), createTextNode = document.createTextNode.bind(document);
    if (typeof element === "object" && element.length > 0) {
      element = element[0];
    }
    measure = createElement("span");
    $(measure).css({
      position: "absolute",
      whiteSpace: "pre",
      visibilty: "hidden"
    });
    if (!(element.ownerDocument || element.ownerDocument === document)) {
      return;
    }
    lineStart = wordStart = 0;
    lineCount = 1;
    wasNewLine = false;
    lineWidth = element.clientWidth;
    text = (element.textContent || element.innerText).trim().replace(/\n/g, " ");
    while (element.firstChild !== null) {
      element.removeChild(element.firstChild);
    }
    element.appendChild(measure);
    function checkLine(pos) {
      if (lineCount === numberOfLines) {
        return;
      }
      measure.appendChild(createTextNode(text.substr(lineStart, pos + 1 - lineStart)));
      if (lineWidth < measure.clientWidth) {
        if (wasNewLine) {
          lineText = text.substr(lineStart, pos + 1 - lineStart);
          lineStart = pos + 1;
        } else {
          lineText = text.substr(lineStart, wordStart - lineStart);
          lineStart = wordStart;
        }
        line = createElement("span");
        line.appendChild(createTextNode(lineText));
        element.appendChild(line);
        wasNewLine = true;
        lineCount++;
      } else {
        wasNewLine = false;
      }
      wordStart = pos + 1;
      measure.removeChild(measure.firstChild);
    }
    text.replace(/\W|_/g, function(m, pos) {
      checkLine(pos);
    });
    checkLine(text.substr(lineStart).length);
    element.removeChild(measure);
    line = createElement("span");
    $(line).css({
      display: "inline-block",
      overflow: "hidden",
      whiteSpace: "nowrap",
      width: "100%"
    });
    if (lineCount > 1) {
      $(line).css({
        textOverflow: "ellipsis"
      });
    }
    line.appendChild(createTextNode(text.substr(lineStart)));
    element.appendChild(line);
  }
  function filterUnSupportedWidgets(widget, config, skipFilter) {
    if (widget && config && config.unSupportedWidgets && !skipFilter) {
      var extWidgets = _.chain(config.unSupportedWidgets).values().flatten()._wrapped;
      if (extWidgets && extWidgets.length > 0) {
        if (_.contains(extWidgets, widget.type)) {
          return undefined;
        }
      }
    }
    return widget;
  }
  function getOffset(element) {
    return element.is(":visible") ? element.offset() : {
      top: 0,
      left: 0
    };
  }
  return {
    MessageHelper: messageHelper,
    ErrorHandler: messageHelper,
    MessageType: Message.Type,
    Message: Message.Message,
    RequestErrorMessage: Message.RequestErrorMessage,
    ErrorStatus: Message.Type,
    ErrorToShow: Message.Message,
    ErrorMessage: Message.ErrorMessage,
    Error: Message.RequestErrorMessage,
    exactDateFormat: date.exactDateFormat,
    exactTimeFormat: date.exactTimeFormat,
    exactDateTimeFormat: date.exactDateTimeFormat,
    parseDate: date.deserializeDate,
    stringifyDate: stringifyDate,
    dateToLocalIsoString: dateToLocalIsoString,
    deserializeDate: date.deserializeDate,
    serializeDate: date.serializeDate,
    serializeDateTime: date.serializeDateTime,
    formatDate: date.formatDate,
    formatDateTime: date.formatDateTime,
    formatExactDate: date.formatExactDate,
    formatExactTime: date.formatExactTime,
    formatExactDateTime: date.formatExactDateTime,
    formatFriendlyDate: date.formatFriendlyDate,
    formatFriendlyDateTime: date.formatFriendlyDateTime,
    formatFriendlyDateTimeNow: date.formatFriendlyDateTimeNow,
    formatISODateTime: date.formatISODateTime,
    formatISODate: date.formatISODate,
    getReadableFileSizeString: number.formatFileSize,
    formatFileSize: number.formatFileSize,
    formatFriendlyFileSize: number.formatFriendlyFileSize,
    formatExactFileSize: number.formatExactFileSize,
    formatInteger: number.formatInteger,
    formatIntegerWithCommas: number.formatIntegerWithCommas,
    formatMemberName: member.formatMemberName,
    getClosestLocalizedString: localizable.getClosestLocalizedString,
    localeCompareString: localizable.localeCompareString,
    localeContainsString: localizable.localeContainsString,
    localeEndsWithString: localizable.localeEndsWithString,
    localeIndexOfString: localizable.localeIndexOfString,
    localeStartsWithString: localizable.localeStartsWithString,
    formatMessage: localizable.formatMessage,
    escapeHtml: escapeHtml,
    isBackbone: isBackbone,
    isPlaceholder: isPlaceholder,
    Url: Url,
    isTouchBrowser: smartBase.isTouchBrowser,
    isHybrid: smartBase.isHybrid,
    isAppleMobile: smartBase.isAppleMobile,
    isMacintosh: isMacintosh,
    isIOSBrowser: isIOSBrowser,
    isIE11: smartBase.isIE11,
    isEdge: smartBase.isEdge,
    isMozilla: isMozilla,
    isFirefox: smartBase.isFirefox,
    isSafari: isSafari,
    isLandscape: isLandscape,
    isPortrait: isPortrait,
    isMSBrowser: smartBase.isMSBrowser,
    isChrome: isChrome,
    px2em: px2em,
    isVisibleInWindowViewport: smartBase.isVisibleInWindowViewport,
    isVisibleInWindowViewportHorizontally: smartBase.isVisibleInWindowViewportHorizontally,
    isVisibleInWindowViewportVertically: smartBase.isVisibleInWindowViewportVertically,
    isElementVisibleInParents: smartBase.isElementVisibleInParents,
    isElementVisibleInParent: smartBase.isElementVisibleInParent,
    checkAndScrollElemToViewport: checkAndScrollElemToViewport,
    setScrollHandler: setScrollHandler,
    adjustDropDownField: adjustDropDownField,
    autoAlignDropDowns: autoAlignDropDowns,
    hideDropDowns: hideDropDowns,
    findFocusables: smartBase.findFocusables,
    clearFocusables: smartBase.clearFocusables,
    applyEllipsis: applyEllipsis,
    filterUnSupportedWidgets: filterUnSupportedWidgets,
    onTransitionEnd: smartBase.onTransitionEnd,
    getOffset: getOffset,
    alignDropDownMenu: alignDropDownMenu,
    alignDropDownSubMenus: alignDropDownSubMenus,
    getLanguageInfo: smartBase.getLanguageInfo,
    getMetadataLanguageInfo: smartBase.getMetadataLanguageInfo,
    getUserMetadataLanguageInfo: smartBase.getUserMetadataLanguageInfo,
    isControlClick: smartBase.isControlClick,
    getParentScrollViews: getParentScrollViews
  };
});