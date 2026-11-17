csui.define('csui/utils/contexts/factories/application.scope.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var ApplicationScopeModel = Backbone.Model.extend({});

  var ApplicationScopeModelFactory = ModelFactory.extend({

    propertyPrefix: 'applicationScope',

    constructor: function ApplicationScopeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var applicationScope = this.options.applicationScope || {};
      if (!(applicationScope instanceof Backbone.Model)) {
        var config = module.config();
        applicationScope = new ApplicationScopeModel(applicationScope.models, _.extend({},
            applicationScope.options, config.options));
      }
      this.property = applicationScope;
    }

  });

  return ApplicationScopeModelFactory;

});


csui.define('csui/utils/base',[
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/utils/url',
  'nuc/utils/errormessage',
  'nuc/utils/messagehelper',
  'nuc/utils/types/date',
  'nuc/utils/types/number',
  'nuc/utils/types/member',
  'nuc/utils/types/localizable',
  'i18n',
  'smart/utils/smart.base'
], function (_, $, Url, Message, MessageHelper, date, number, member, localizable, i18n, smartBase) {
  'use strict';

  // handler as singleton, bind dialog to handler
  var messageHelper = MessageHelper.getInstance();

  var escapeHtmlHelper = $('<p></p>');

  function escapeHtml(text, preserveLineBreaks) {
    // There's no HTML escaping function which would return a text to be
    // concatenated with the rest of the raw HTML markup so that the text
    // value would be the same and not interpreted as HTML markup.
    // Let's use an artificial DOM element for this, wrapped with jQuery.
    var html = escapeHtmlHelper.text(text).html();
    if (preserveLineBreaks) {
      html = html.replace(/\r?\n/g, '\r\n<br>');
    }
    return html;
  }

  function isBackbone(value) {
    // descendant of Backbone.Events
    return value && value.once;
  }

  function isPlaceholder(value) {
    // string selector, DOM object or jQuery object
    return value && (_.isString(value) || _.isElement(value) || value instanceof $);
  }

  function isMacintosh() {
    return navigator.platform.indexOf('Mac') > -1;
  }

  /**
   * returns true if the current browser is accessed from any iOS device
   * @returns Boolean.
   **/
  function isIOSBrowser() {
    return navigator.userAgent.indexOf('Mac') > -1;
  }

  function isLandscape() {
    return smartBase.isAppleMobile() && window.matchMedia('(orientation: landscape)').matches;
  }

  function isPortrait() {
    return smartBase.isAppleMobile() && window.matchMedia('(orientation: portrait)').matches;
  }

  function isMozilla() {
    if (navigator && navigator.userAgent) {
      var isMozilla = /Mozilla/.test(navigator.userAgent);
      return isMozilla;
    }
  }

  function isChrome() {
    // please note,
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf('OPR') > -1,
      isIEedge = winNav.userAgent.indexOf('Edge') > -1,
      isIOSChrome = winNav.userAgent.match('CriOS'),
      retVal = false;
    if (
      isIOSChrome ||
      (isChromium != null && vendorName === 'Google Inc.' && isOpera === false && isIEedge === false)
    ) {
      retVal = true;
    }
    return retVal;
  }

  function isSafari() {
    if (navigator && navigator.userAgent) {
      //it excludes Chrome and all Android browsers that include the Safari name in their user agent.
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      return isSafari;
    }
  }

  // This shared function is used to compute the number characters can fit in a container.
  // Input:
  // - container width in pixels
  // - element width in pixels
  // Return:
  // - number of elements to fill the container
  function px2em(pxContainerWidth, pxElemWidth) {
    var pxInEms = 0;
    if (pxElemWidth > 0) {
      pxInEms = Math.floor((2 * pxContainerWidth) / pxElemWidth);
    }
    return pxInEms;
  }

  function checkAndScrollElemToViewport(elem) {
    var $elem = $(elem),
      scrollSelector =
        $elem.closest('.csui-perfect-scrolling').length > 0 ? '.csui-perfect-scrolling' : '.csui-normal-scrolling',
      elemScrollParent = $elem.closest(scrollSelector),
      stickyHeader = elemScrollParent.siblings('.csui-tab-contents-header-wrapper');
    if (stickyHeader[0]) {
      var elemTop = $elem.offset().top,
        viewportTop = elemScrollParent[0].getBoundingClientRect().top + stickyHeader.height(),
        isElemVisible = elemTop > viewportTop;
      if (!isElemVisible) {
        var currScrollTop = elemScrollParent.scrollTop();
        elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
      }
    }
  }

  function setScrollHandler(e) {
    var eventArg = e.data;
    var inputElement = eventArg.inputElement,
      view = eventArg.view,
      dropdownContainer = eventArg.dropdownContainer,
      callback = eventArg.callback;
    //When dropdown is closed
    inputElement.parents('.csui-normal-scrolling').css('overflow', 'auto');
    //close respective drop-downs using callback
    if (
      dropdownContainer.length > 0 &&
      dropdownContainer[0] !== e.target &&
      dropdownContainer.is(':visible') &&
      callback
    ) {
      callback(view);
    }
  }

  /* eslint-disable no-unused-vars */
  function adjustDropDownField(
    inputElement,
    dropdownContainer,
    applyWidth,
    view,
    callback,
    scrollableDropdownContainer
  ) {
    var scrollEl;
    var eventArg = {
      inputElement: inputElement,
      view: view,
      dropdownContainer: dropdownContainer,
      callback: callback
    };

    var isIEBrowser = smartBase.isIE11(),
      isTouchBrowser = smartBase.isTouchBrowser();

    if (isTouchBrowser && !inputElement.closest('.csui-scrollable-writemode').hasClass('csui-dropdown-open')) {
      inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
    }

    // for scrollable set
    if (
      inputElement.parents('.csui-scrollablecols').length > 0 &&
      inputElement.parents('.cs-form-set-container').length > 0
    ) {
      scrollEl = inputElement
        .parents('.csui-scrollablecols')
        .parents('.cs-form-set-container')
        .find('.ps-container.ps-active-x');
      var isRtl = i18n && i18n.settings.rtl,
        inputElementLeft = inputElement.offset().left,
        leftShadow = inputElement
          .parents('.csui-scrollablecols')
          .siblings('.csui-lockedcols')
          .find('.csui-shadowleft-container'),
        leftShadowLeft = leftShadow.offset().left,
        currentLeft,
        scrollUpdate;
      if (isRtl) {
        var inputElementRight = inputElementLeft + inputElement.outerWidth();
        scrollUpdate = inputElementRight - leftShadowLeft;
      } else {
        var leftShadowRight = leftShadowLeft + leftShadow.outerWidth();
        scrollUpdate = leftShadowRight - inputElementLeft;
      }
      // for partially visible dropdownfield
      if (scrollUpdate > 0) {
        var that = this;
        scrollEl.off('scroll', this.setScrollHandler);
        scrollEl.one('set:scrolled', function () {
          if (scrollEl) {
            scrollEl.on('scroll', eventArg, that.setScrollHandler);
          }
          that.autoAlignDropDowns(
            inputElement,
            dropdownContainer,
            applyWidth,
            scrollableDropdownContainer,
            isIEBrowser
          );
          that.hideDropDowns(inputElement, dropdownContainer, view, callback);
        });
        if (isRtl) {
          currentLeft = scrollEl.scrollLeftRtl();
          scrollEl.scrollLeftRtl(currentLeft + scrollUpdate);
        } else {
          currentLeft = scrollEl.scrollLeft();
          scrollEl.scrollLeft(currentLeft - scrollUpdate);
          setTimeout(function () {
            if (
              smartBase.isTouchBrowser &&
              !inputElement.closest('.csui-scrollable-writemode').hasClass('.csui-dropdown-open')
            ) {
              inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
            }
          }, 100);
        }
        return;
      }
    }

    if (scrollEl) {
      scrollEl.off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    }
    this.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser);
    this.hideDropDowns(inputElement, dropdownContainer, view, callback);
  }
  /* eslint-ensable no-unused-vars */

  var I = new DOMMatrix();

  function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  Point.prototype.transformBy = function (matrix) {
    var tmp = matrix.multiply(I.translate(this.x, this.y, this.z));
    return new Point(tmp.m41, tmp.m42, tmp.m43);
  };

  function getTransformStyle(element) {
    var computedStyle = window.getComputedStyle(element);
    var transform = computedStyle.transform;
    var display = computedStyle.display;
    if (transform && transform !== 'none' && display !== 'inline') {
      return transform;
    }
    var contain = computedStyle.contain;
    if (contain === 'layout') {
      return I;
    }
  }

  function getTransformInfo(target) {
    for (var parent = target; parent; parent = parent.parentElement) {
      var transform = getTransformStyle(parent);
      if (transform) {
        return { element: parent, transform: transform };
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
    transformationMatrix = I.translate(
      window.scrollX + rect.left - left,
      window.scrollY + rect.top - top,
      0
    ).multiply(transformationMatrix);

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
      var pageToTrans = getPageToElementTransformationMatrix(transformParent).translate(
        transformParent.scrollLeft,
        transformParent.scrollTop,
        0
      );
      var targetToPage = getElementToPageTransformationMatrix(target);
      var targetTopLeft = new Point(0, 0, 0).transformBy(targetToPage).transformBy(pageToTrans);
      var targetBottomRight = new Point(target.offsetWidth, target.offsetHeight, 0)
        .transformBy(targetToPage)
        .transformBy(pageToTrans);
      var borderTopWidth = +(window.getComputedStyle(transformParent)['border-top-width'] || '') || 0;
      var borderLeftWidth = +(window.getComputedStyle(transformParent)['border-left-width'] || '') || 0;

      offsets = {
        top: targetTopLeft.y - borderTopWidth,
        left: targetTopLeft.x - borderLeftWidth,
        bottom: targetBottomRight.y - borderTopWidth,
        right: targetBottomRight.x - borderLeftWidth,
        height: transformParent.clientHeight,
        width: transformParent.clientWidth
      };
    } else {
      // In this state the dropdown is already created, consumes space and possibly causes temporary
      // scrollbars, which at the end are not there, and thus the offsets do not fit anymore. To avoid
      // this, we hide the dropdown, get the coordinates of the target and window and restore the display
      // style. Not needed for sub menus as there these temp scrollbars appear in the parent menu.
      var display = dropdown.style['display'];
      dropdown !== target && $(dropdown).css({ display: 'none' });
      var targetRect = target.getBoundingClientRect();
      offsets = {
        top: targetRect.top,
        left: targetRect.left,
        bottom: targetRect.bottom,
        right: targetRect.right,
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth
      };
      dropdown !== target && $(dropdown).css({ display: display });
    }
    return offsets;
  }

  //This function is used to display drop-downs either top or bottom based on available space
  function autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer, isIEBrowser) {
    // return the control if inputElement is not available in dom.
    if (!inputElement.is(':visible')) {
      return false;
    }
    dropdownContainer.css({
      left: 0,
      top: 0
    });
    var hasPerspective = !!inputElement.closest('.cs-perspective-panel').length,
      isRtl = i18n && i18n.settings.rtl,
      elTop = inputElement.offset().top,
      elPositionX = hasPerspective ? inputElement.offset().left : inputElement[0].getBoundingClientRect().left,
      scrollSelector =
        inputElement.closest('.csui-perfect-scrolling').length > 0
          ? '.csui-perfect-scrolling'
          : '.csui-normal-scrolling',
      form = inputElement.closest(scrollSelector),
      modalContentElem = isIEBrowser
        ? []
        : form.length > 0
        ? form.parents('.binf-modal-content, .csui-sidepanel-container')
        : inputElement.closest('.binf-modal-content, .csui-sidepanel-container') /*For
         IE, left & top position is calculated with respect to document*/,
      modalContentPositionX =
        modalContentElem.length > 0
          ? isRtl
            ? modalContentElem.outerWidth() + modalContentElem.offset().left
            : modalContentElem.offset().left
          : isRtl
          ? $(document).width()
          : 0,
      modalContentTop = modalContentElem.length > 0 ? modalContentElem.offset().top : 0,
      controlheight = inputElement.outerHeight(),
      dropdownWidth = inputElement.outerWidth(),
      perspectivePanel = $('.cs-perspective-panel'),
      closestPerspectivePan = inputElement.closest('.cs-perspective-panel'),
      perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : inputElement.closest('.cs-perspective'),
      perspectiveHeight = perspective.length > 0 ? perspective.outerHeight() : $(document).height(),
      perspectiveTop = perspective.length > 0 ? perspective.offset().top : 0,
      perspectiveLeft = perspective.length > 0 ? perspective.offset().left : 0,
      elemBoundingRect = inputElement[0].getBoundingClientRect(),
      contextBottom,
      contextTop;

    if (applyWidth) {
      dropdownContainer.css({
        width: dropdownWidth
      });
    }
    //When dropdown is opened
    if (scrollSelector != '.csui-normal-scrolling') {
      inputElement.parents('.csui-normal-scrolling').css('overflow', 'hidden');
    }

    var perspectivePanelClientTop = perspectivePanel.length > 0 ? perspectivePanel[0].getBoundingClientRect().top : 0;
    if (perspectivePanelClientTop < 0) {
      perspectivePanelClientTop = perspectivePanel.offset().top;
    }
    var perspectiveTopSpace = perspectiveTop > 0 ? perspectiveTop : perspectivePanelClientTop,
      spaceOnTop = elemBoundingRect.top - perspectiveTopSpace,
      spaceOnBottom = window.innerHeight - (elemBoundingRect.top + elemBoundingRect.height),
      isDropdownShownOnTop = spaceOnTop > spaceOnBottom;

    if (scrollableDropdownContainer) {
      scrollableDropdownContainer.css({
        'max-height': Math.abs((isDropdownShownOnTop ? spaceOnTop : spaceOnBottom) * 0.9) + 'px'
      });
      // Check if whole dropdown can fit in bottom since bottom is prefferable if it can fit in bottom
      isDropdownShownOnTop = scrollableDropdownContainer.outerHeight() > spaceOnBottom;
    }
    var offsets = getOffsetsForFixedPosition(inputElement[0], dropdownContainer[0]);
    // below code used to display dropdown at top of the field.
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
            contextBottom = hasPerspective
              ? document.documentElement.offsetHeight - elTop
              : window.innerHeight - inputElement[0].getBoundingClientRect().top;
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          position: 'fixed',
          right: offsets.width - offsets.right,
          top: 'auto',
          bottom: offsets.height - offsets.top,
          left: 'auto'
        });
      } else {
        dropdownContainer.css({
          position: 'fixed',
          left: offsets.left,
          top: 'auto',
          bottom: offsets.height - offsets.top
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-top').removeClass('binf-bottom');
      }
      // below code used to display dropdown at bottom of the field.
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
          position: 'fixed',
          right: offsets.width - offsets.right,
          top: offsets.bottom,
          bottom: 'auto',
          left: 'auto'
        });
      } else {
        dropdownContainer.css({
          position: 'fixed',
          left: offsets.left,
          top: offsets.bottom,
          bottom: 'auto'
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-bottom').removeClass('binf-top');
      }
    }
  }

  /**
   * Options:
   *  - targetEl  # Required. Element (usually anchor) which triggers the dropdown
   *  - dropdownMenu # Optional. Element "binf-dropdown-menu" that is opened by `targetEl`. Default to sibling of `targetEl`.
   *  - hAlignment # Optional. Default to `left` aligned.
   *  - vAlignment # Optional. Default to `bottom`.
   *
   * @param {*} options
   */
  function alignDropDownMenu(options) {
    var $targetEl = options.targetEl,
      $dropdownMenu = options.dropdownMenu || $targetEl.nextAll('.binf-dropdown-menu'),
      hAlignment = options.hAlignment || 'left',
      vAlignment = options.vAlignment || 'bottom',
      isRtl = i18n && i18n.settings.rtl;

    if (!$targetEl.length || !$targetEl.is(':visible') || !$dropdownMenu.length) {
      // return the control if inputElement is not available in dom.
      return false;
    }

    $dropdownMenu.css({
      maxHeight: '',
      maxWidth: '',
      top: '',
      left: '',
      right: '',
      bottom: ''
    }); // Reset all inline styles
    $dropdownMenu.removeClass(
      'binf-dropdown-align-left-top binf-dropdown-align-left-bottom' +
        ' binf-dropdown-align-right-top binf-dropdown-align-right-bottom'
    );

    var dropdownHeight = $dropdownMenu.outerHeight(),
      dropdownWidth = $dropdownMenu.outerWidth();
    // Hide to dropdown to avoid window scrolls due to overflow of dropdown beyond visible area.
    $dropdownMenu.addClass('binf-hidden');
    
    var documentWidth = options.width ?? $(window).width(),
      documentHeight = $(window).height(),
      maxWidthAllowed = parseInt($dropdownMenu.css('maxWidth'), 10) || 224 /** UX Suggested */,
      viewportOffset = $targetEl[0].getBoundingClientRect(),
      top = viewportOffset.bottom,
      left = viewportOffset.left,
      right = documentWidth - viewportOffset.right,
      bottom = documentHeight - viewportOffset.top,
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop,
      spaceTop = viewportOffset.top - 10,
      spaceBottom = documentHeight - viewportOffset.bottom - 10,
      spaceLeft = viewportOffset.right - 10,
      spaceRight = documentWidth - viewportOffset.left - 10;

    if (vAlignment === 'bottom' && spaceBottom <= dropdownHeight) {
      // Requested to place at bottom, but insufficient space at bottom.
      if (spaceTop > dropdownHeight || spaceTop > spaceBottom) {
        vAlignment = 'top';
      }
    } else if (vAlignment === 'top' && spaceTop <= dropdownHeight) {
      // Requested to place at top, but insufficient space at top.
      if (spaceBottom > dropdownHeight || spaceBottom > spaceTop) {
        vAlignment = 'bottom';
      }
    }

    // Flip the horizontal position incase of RTL
    hAlignment = isRtl ? (hAlignment === 'left' ? 'right' : 'left') : hAlignment;
    if (hAlignment === 'left' && spaceRight <= dropdownWidth) {
      // Requested to align left, but insufficient space towards right.
      if (spaceLeft > dropdownWidth || spaceLeft > spaceRight) {
        hAlignment = 'right';
      }
    } else if (hAlignment === 'right' && spaceLeft <= dropdownWidth) {
      // Requested to align right, but insufficient space towards left.
      if (spaceRight > dropdownWidth || spaceRight > spaceLeft) {
        hAlignment = 'left';
      }
    }
    $dropdownMenu.addClass('binf-dropdown-align-' + hAlignment + '-' + vAlignment);

    if (!smartBase.isIE11()) {
      // Since perspectives and model dialogs styles with "transform" in which "position: fixed" relative to these container (not viewport).
      var closestPerspectivePan = $targetEl.closest('.cs-perspective-panel'),
        modelContent = $targetEl.parents('.binf-modal-content'),
        $transformParent = closestPerspectivePan.length ? closestPerspectivePan : $targetEl.closest('.cs-perspective');
      /** Check if inside perspective */
      // If not perspective MODEL dialog?
      $transformParent = $transformParent.length ? $transformParent : modelContent;

      if ($transformParent.length > 0) {
        // To counter the transform
        var transParentOffset = $transformParent.offset(),
          $elDocOffset = $targetEl.offset(); // Includes top, left scrolls with viewport position;
        top += scrollTop - transParentOffset.top;
        left += scrollLeft - transParentOffset.left;
        right = $transformParent.outerWidth() + transParentOffset.left - $elDocOffset.left - $targetEl.outerWidth();
        bottom = $transformParent.outerHeight() + transParentOffset.top - $elDocOffset.top;
      }
    }

    const dropdownParent = $dropdownMenu.parent()[0]
    const differentParents = dropdownParent && $targetEl.parent()[0] !== dropdownParent;
    var offsets = getOffsetsForFixedPosition($targetEl[0], $dropdownMenu[0], differentParents);
    var styles = { position: 'fixed' };
    if (hAlignment === 'left') {
      styles = _.extend(styles, {
        left: offsets.left
      });
      if (isRtl) {
        styles = _.extend(styles, {
          right: 'auto'
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

    if (vAlignment === 'bottom') {
      styles = _.extend(styles, {
        top: offsets.bottom
      });
    } else {
      styles = _.extend(styles, {
        bottom: offsets.height - offsets.top
      });
    }

    $dropdownMenu.css(styles);
    $dropdownMenu.removeClass('binf-hidden');
    // if toggle and dropdown have different parents (typically when data-binf-target is used)
    if (differentParents) {
      // generate a unique csui scroll watch id.
      const csswid = $dropdownMenu.attr('csswid') || $dropdownMenu.attr('csswid', _.uniqueId("cssw")).attr('csswid');
      if (!$dropdownMenu.attr('csswid-listening')) {
        const visited = startListenToScrollEvents(csswid, $targetEl, $dropdownMenu, () => {
          if ($dropdownMenu.parent().hasClass('binf-open')) {
            const topelement = visited[0];
            const elements = getElementsCoveringToggle($targetEl[0], vAlignment, topelement);
            const elementsAreInBetweenLayer = elements
              ? isDropdownCoveringElements($dropdownMenu[0], elements, vAlignment, hAlignment, $targetEl[0], topelement)
              : undefined;
            if (elementsAreInBetweenLayer || elementsAreInBetweenLayer === undefined) {
              // when toggle and dropdown have different parents, it can happen due to the z layering of the elements,
              // that after scrolling, the toggle is covered by a dom element which in turn is covered by the dropdown.
              // if this is the case or if it was not possible to determine this => close dropdown
              $dropdownMenu.binf_dropdown('toggle');
            } else {
              // reposition the dropdown only as long as the toggle is not covered.
              alignDropDownMenu({targetEl: $targetEl, dropdownMenu: $dropdownMenu});
            }
          }
        });
        $dropdownMenu.attr('csswid-listening', true);
        $dropdownMenu.parent().one('hidden.binf.dropdown', () => {
          $dropdownMenu.attr('csswid-listening', null);
          stopListenToScrollEvents(csswid, visited);
        })
      }
    }
    return
  }

  function startListenToScrollEvents(csswid, targetEl, dropdownMenu, listener) {
      var inListener;
      const eventName = 'scroll.' + csswid;
      const debounce = _.debounce( () => {
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
    visited.forEach(el => $(el).off('scroll.' + csswid));
  }

  function getClosestCommonParent (startNode, endNode) {
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
 };

  function traverseParents(toggle, dropdown, callback) {
    const common = getClosestCommonParent(toggle, dropdown);
    const transform = getTransformInfo(common);
    const topelement = transform ? transform.element : document;
    const visited = [topelement];
    const nodes = [toggle, dropdown];
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

  /**
   * get all elements that cover the toggle at its corners near to the dropdown
   */
  function getElementsCoveringToggle(toggle, vAlign, topelement){
    const toggleRect = toggle.getBoundingClientRect();
    var result = [];
    const checks = [];
    checks.push(document.elementsFromPoint(toggleRect.left + 1, vAlign === 'bottom' ? toggleRect.bottom - 1 : toggleRect.top));
    checks.push(document.elementsFromPoint(toggleRect.right - 1, vAlign === 'bottom' ? toggleRect.bottom - 1 : toggleRect.top));
    let resultValid;
    checks.forEach(elems => {
      let checkValid;
      const checked = [];
      for (let ll = 0; ll < elems.length; ll++) {
        if (topelement === elems[ll]) {
          break;
        }
        if (toggle === elems[ll] || toggle.contains(elems[ll])) {
          // result of elementsFromPoint is valid for this check only if toggle is such an element.
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
        // result is valid only if at least one check is valid
        resultValid = true;
        result = result.concat(checked);
      }
    })
    // return found elements, but return undefined, if toggle was not element of any call to elementsFromPoint.
    return resultValid ? result : undefined;
  }

  /**
   * check if elements are covered by the dropdown at its points nearest to the toggle
   */
  function isDropdownCoveringElements(dropdown, toggleCoveringElements, vAlign, hAlign, toggle, topelement){
    // each element in toggleCoveringElements covers the toggle at a point.
    if (toggleCoveringElements.length >0) {
      const toggleRect = toggle.getBoundingClientRect();
      const menuRect = dropdown.getBoundingClientRect();
      const checks = [];
      // remove border-radius to make the points really be part of the display area element.
      dropdown.style['border-radius'] = 0;
      checks.push(document.elementsFromPoint(
        hAlign === 'left' ? menuRect.left + 1 : menuRect.right - toggleRect.width,
        vAlign === 'bottom' ? menuRect.top + 1 : menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop(); // dropdown not listed as point => cannot compute layering
      }
      checks.push(document.elementsFromPoint(
        hAlign === 'left' ? menuRect.left + toggleRect.width : menuRect.right - 1,
        vAlign === 'bottom' ? menuRect.top + 1: menuRect.bottom - 1));
      if (!checks.at(-1).includes(dropdown)) {
        checks.pop(); // dropdown not listed as point => cannot compute layering
      }
      // restore border-radius.
      dropdown.style['border-radius'] = null;
      if (checks.length === 0) {
        // return undefined, if dropdown, was not listed by elementsFromPoint
        return undefined;
      }
      let coveringPointsCount = 0;
      // for each point from above, check, if there is one from toggleCoveringElements between toggle and dropdown
      for (let cc = 0; cc < checks.length; cc++) {
        let dropdownPointElements = checks[cc]; // contains all elements on one of the above points of the dropdown
        let underDropdown = false; // indicates if dropdownPointElements[ll] is under the dropdown
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
              // this means, that the element from toggleCoveringElements is covered by the dropdown
              coveringPointsCount += 1;
              break;
            }
            includeCount += 1;
            if (includeCount === toggleCoveringElements.length) {
              // if we already have seen all elements of toggleCoveringElements in dropdownPointElements
              // we can stop this loop here
              break;
            }
          }
        }
      }
      // if for each checked point there exists an element between toggle and dropdown
      // only then consider dropdown as covering the toggleCoveringElements.
      return coveringPointsCount === checks.length;
    }
    return false;
  }

  function alignDropDownSubMenus(options) {
    var $dropdown = options.dropdownMenu,
      $targetEl = options.targetEl,
      $childEl = $targetEl.children(),
      isRtl = i18n && i18n.settings.rtl,
      viewportWidth = window.innerWidth || document.documentElement.clientWidth,
      bounding = $targetEl[0].getBoundingClientRect(),
      childBounding = $childEl[0].getBoundingClientRect(),
      dropdownBounding = $dropdown[0].getBoundingClientRect(),
      isPullDown = $targetEl.hasClass('binf-pull-down'),
      isLandingTileView = $targetEl.parents().hasClass('csui-tileview-more-btn'),
      startPosition = isPullDown === isRtl ? bounding.right : bounding.left,
      rightSpaceAvailable = isRtl ? startPosition : viewportWidth - startPosition,
      leftSpaceAvailable = isRtl ? viewportWidth - bounding.right : bounding.left;

    // Reset positions / styles to DEFAULTs
    $targetEl.removeClass('binf-dropdown-menu-left binf-dropdown-menu-right');
    $dropdown.css({ left: '', right: '', top: '', bottom: '', position: '' });
    $dropdown.removeAttr('style');
    $dropdown.removeClass('csui-fixed-submenu csui-perfect-scrolling csui-normal-scrolling csui-no-scroll-x');

    // Assess horizontal position
    if (
      Math.floor(rightSpaceAvailable) <= dropdownBounding.width ||
      ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass('binf-dropdown-menu-left') &&
        leftSpaceAvailable > dropdownBounding.width)
    ) {
      $targetEl.addClass('binf-dropdown-menu-left');
    }
    // Assess vertical position position
    $targetEl.removeClass('binf-dropup'); // Default toward down

    var ulOffset = $dropdown.offset();
    // how much space would be left on the top if the dropdown opened that direction
    var spaceUp = ulOffset.top - $dropdown.outerHeight() - $(window).scrollTop();
    // how much space is left at the bottom
    var spaceDown = $(window).scrollTop() + $(window).height() - (ulOffset.top + $dropdown.outerHeight());
    // switch to dropup only if there is no space at the bottom AND
    // there is space at the top, or there isn't either but it would be still better fit
    if (
      (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) ||
      ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass('binf-dropup') && spaceUp > spaceDown)
    ) {
      $targetEl.addClass('binf-dropup');
    }

    // TODO Make submenu "position: fixed" only when overflowed by perfect scrollbar
    var scrollOffset = $targetEl.parent().scrollTop(),
      perspectiveOffsetTop = 0;
    $targetEl.parent().css('overflow', 'visible');
    var offsets = getOffsetsForFixedPosition($dropdown[0], $dropdown[0]);
    var viewportOffset = $dropdown[0].getBoundingClientRect(),
      top = viewportOffset.top,
      left = viewportOffset.left;
    $targetEl.parent().css('overflow', '');
    if (!smartBase.isIE11()) {
      var modalContentElem = $targetEl.parents('.binf-modal-content'),
        closestPerspectivePan = $targetEl.closest('.cs-perspective-panel'),
        landingPerspective = $targetEl.closest('.cs-perspective'),
        perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : landingPerspective;
      if (modalContentElem.length > 0) {
        var modalOffset = modalContentElem.offset();
        top = top - modalOffset.top - scrollOffset;
        left = left - modalOffset.left;
      } else if (perspective.length > 0) {
        var perspectiveOffset = perspective.offset(),
          perspectiveBounding = landingPerspective[0].getBoundingClientRect();
        perspectiveOffsetTop = isLandingTileView ? perspectiveBounding.top : perspectiveOffset.top;
        top = top - perspectiveOffsetTop - scrollOffset;
        left = left - perspectiveOffset.left;
      }
    }
    $targetEl.parent().css('overflow', 'visible');

    if ($targetEl.hasClass('binf-dropdown-menu-left')) {
      left += !isPullDown ? $targetEl.width() - $dropdown.width() : 0;
      offsets.left = offsets.left + (!isPullDown ? $targetEl.width() - $dropdown.width() : 0);
    }

    if (isPullDown) {
      top = top - (bounding.bottom - childBounding.bottom);
      offsets.top = offsets.top - (bounding.bottom - childBounding.bottom);
    }

    //Set the css of the submenu based on its horizontal orientation.
    var scrollHeight = document.body.getBoundingClientRect().top,
      currentElementTop = $targetEl.offset().top + scrollHeight,
      currentElementHeight = $targetEl.innerHeight(),
      screenHeight = $(window).outerHeight(),
      bottom = 0;

    $targetEl.parent().css('overflow', '');
    $dropdown.addClass('csui-fixed-submenu');

    var subMenuCSS = {
      position: 'fixed',
      left: offsets.left
    };
    // This condition is required only for Node Browsing Table widget
    if ($targetEl.parents().hasClass('csui-nodestable') && !smartBase.isIE11()) {
      top = top + window.scrollY;
    }
    if ($targetEl.hasClass('binf-dropup')) {
      bottom = screenHeight - currentElementTop - currentElementHeight;
      // Making bottom to default value if its negative
      bottom = bottom < 0 ? 0 : bottom;
      if (smartBase.isIE11()) {
        _.extend(subMenuCSS, {
          bottom: offsets.top,
          top: 'auto',
          maxHeight: screenHeight - bottom
        });
      } else {
        _.extend(subMenuCSS, {
          bottom: 'auto',
          top: offsets.top + $targetEl.height() / 2,
          maxHeight: screenHeight - bottom
        });
      }
    } else {
      _.extend(subMenuCSS, {
        top: offsets.top,
        bottom: 'auto',
        maxHeight: screenHeight - (top + perspectiveOffsetTop)
      });
    }

    $dropdown.css(subMenuCSS);
    csui.require(['csui/controls/tile/behaviors/perfect.scrolling.behavior'], function (PerfectScrollingBehavior) {
      // Apply perfect scrollbar
      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        $dropdown.addClass('csui-perfect-scrolling');
        $dropdown.perfectScrollbar({
          suppressScrollX: true,
          includePadding: true
        });
      } else {
        $dropdown.addClass('csui-normal-scrolling csui-no-scroll-x');
      }

      // Hide submenu on scroll of its parent (dropdown menu).
      var $scrollParent = $targetEl.closest('.binf-dropdown-menu');
      $scrollParent.off('scroll.csui.submenu').on(
        'scroll.csui.submenu',
        _.bind(function (event) {
          !$dropdown.is(':hidden') && $targetEl.binf_dropdown_submenu('hide');
          $scrollParent.off('scroll.csui.inline.actions');
        }, this)
      );
    });
  }

  function hideDropDowns(inputElement, dropdownContainer, view, callback) {
    var scrollSelector =
        inputElement.closest('.csui-perfect-scrolling').length > 0
          ? '.csui-perfect-scrolling'
          : '.csui-normal-scrolling',
      eventArg = {
        inputElement: inputElement,
        view: view,
        dropdownContainer: dropdownContainer,
        callback: callback
      };

    // called when the parent view is scrolled.
    this.getParentScrollViews(inputElement[0], scrollSelector).forEach((scrollView) => {
      $(scrollView).off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    });

    // called when the window is scrolled.
    $(window).off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);

    // called when the window is resized.
    $(window).off('resize', this.setScrollHandler).on('resize', eventArg, this.setScrollHandler);
  }

  function getParentScrollViews(inputElement, scrollSelector, scrollParents = []) {
    if (!inputElement || inputElement === document.documentElement) {
      return scrollParents; // Base case: Stop when reaching the root element
    }
  
    if (inputElement.matches(scrollSelector)) {
      scrollParents.push(inputElement); // Add to the result if it matches the selector
    }
  
    return this.getParentScrollViews(inputElement.parentElement, scrollSelector, scrollParents);
  }

  // TODO: Deprecate and remove this method
  function stringifyDate(date) {
    return JSON.stringify(date);
  }

  // TODO: Deprecate and remove this method
  function dateToLocalIsoString(dateStr, format) {
    if (format === 'YYYY-MM-DD' || format === 'MM/DD/YYYY' || format === 'DD/MM/YYYY') {
      return date.serializeDate(dateStr);
    }
    return date.serializeDateTime(dateStr);
  }

  /**
   * The parent div for the span element in which we have to apply ellipsis
   * The number of lines we have to apply ellipses
   * @param element
   * @param numberOfLines
   * Limitation of Multiline text with ellipsis:
   * If there is a single lengthy word then the word is displayed in single line with ellipsis at the end of the line ex: 'Counterproductiveness'
   * If there are 2 lengthy words, where none of them will fit in the line then the first word is displayed with ellipsis in a single line ex:  'Methylenedioxymethamphetamine chemical'
   * If the first word is very short and the 2nd word is longer, then the single line is displayed and ellipsis are displayed at the end of 2nd word ex: 'Digital Transformation'
   */
  function applyEllipsis(element, numberOfLines) {
    var measure,
      text,
      lineWidth,
      lineStart,
      lineCount,
      wordStart,
      line,
      lineText,
      wasNewLine,
      updatedFirstLineWidth = false,
      createElement = document.createElement.bind(document),
      createTextNode = document.createTextNode.bind(document);
    if (typeof element === 'object' && element.length > 0) {
      element = element[0];
    }
    // measurement element is made a child of the element to get it's style
    measure = createElement('span');

    $(measure).css({
      position: 'absolute', // prevent page reflow
      whiteSpace: 'pre', // cross-browser width results
      visibilty: 'hidden' // prevent drawing});
    });

    // make sure the element belongs to the document
    if (!(element.ownerDocument || element.ownerDocument === document)) {
      return;
    }

    // reset to safe starting values
    lineStart = wordStart = 0;
    lineCount = 1;
    wasNewLine = false;
    lineWidth = element.clientWidth;
    // get all the text, remove any line changes
    text = (element.textContent || element.innerText).trim().replace(/\n/g, ' ');
    // remove all content
    while (element.firstChild !== null) {
      element.removeChild(element.firstChild);
    }
    // add measurement element within so it inherits styles
    element.appendChild(measure);
    function checkLine(pos) {
      // ignore any further processing if we have total lines
      if (lineCount === numberOfLines) {
        return;
      }
      // create a text node and place it in the measurement element
      measure.appendChild(createTextNode(text.substr(lineStart, pos + 1 - lineStart)));
      // have we exceeded allowed line width?
      if (lineWidth < measure.clientWidth) {
        if (wasNewLine) {
          // we have a long word so it gets a line of it's own
          lineText = text.substr(lineStart, pos + 1 - lineStart);
          // next line start position
          lineStart = pos + 1;
        } else {
          // grab the text until this word
          lineText = text.substr(lineStart, wordStart - lineStart);
          // next line start position
          lineStart = wordStart;
        }
        // create a line element
        line = createElement('span');
        // add text to the line element
        line.appendChild(createTextNode(lineText));
        // add the line element to the container
        element.appendChild(line);
        // yes, we created a new line
        wasNewLine = true;
        lineCount++;
      } else {
        // did not create a new line
        wasNewLine = false;
      }
      // remember last word start position
      wordStart = pos + 1;
      // clear measurement element
      measure.removeChild(measure.firstChild);
    }

    // http://ejohn.org/blog/search-and-dont-replace/
    text.replace(/\W|_/g, function (m, pos) {
      checkLine(pos);
    });
    checkLine(text.substr(lineStart).length);
    // remove the measurement element from the container
    element.removeChild(measure);
    // create the last line element
    line = createElement('span');
    // give styles required for text-overflow to kick in
    $(line).css({
      display: 'inline-block',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%'
    });
    if (lineCount > 1) {
      $(line).css({
        textOverflow: 'ellipsis'
      });
    }
    // add all remaining text to the line element
    line.appendChild(createTextNode(text.substr(lineStart)));
    // add the line element to the container
    element.appendChild(line);
  }

  /**
   * This method is used to filter out unsupported widgets based on the config
   *
   * @param widget  widget json : {type:"<widget-path>",options:{<widget-options>}}
   * @param config  configuration json:
   *                {"unSupportedWidgets":{"<module>":["<widget1-path>","<widget2-path>"]}
   * @param skipFilter type: boolean, enhancing perspective to allow loading unSupportedWidgets
   *                in perspective edit mode
   * @returns {*}   returns the widget only if it is not listed in the 'UnSupportedWidgets' list
   *                else returns undefined
   */
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
    return element.is(':visible') ? element.offset() : { top: 0, left: 0 };
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


csui.define('csui/utils/contexts/factories/global.error',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {
  'use strict';

  var GlobalError = Backbone.Model.extend({
    defaults: {
      message: null,
      details: null
    }
  });

  var GlobalErrorFactory = ModelFactory.extend({
    propertyPrefix: 'globalError',

    constructor: function GlobalErrorModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var globalError = this.options.globalError || {};
      if (!(globalError instanceof Backbone.Model)) {
        var config = module.config();
        globalError = new GlobalError(globalError.attributes, _.extend({},
            globalError.options, config.options));
        // The default global error model should be permanent to
        // survive a perspective switch to the error perspective.
        this.options.permanent = true;
      }
      this.property = globalError;
    }
  });

  return GlobalErrorFactory;
});


csui.define('csui/behaviors/keyboard.navigation/tabables.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base'
], function (module, _, $, Marionette, log, base) {
  'use strict';

  log = log(module.id);

  // Default static options for the behaviour object
  var config = module.config();

  var accessibilityRegionClass = 'csui-acc-tab-region';
  var accessibilityActiveRegionClass = 'csui-acc-tab-region-active';

  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  // This behavior implements a controller for one or more views with the tabable.region.behavior
  // applied.
  var TabablesBehavior = Marionette.Behavior.extend({

        constructor: function TabablesBehavior(options, view) {
          Marionette.Behavior.prototype.constructor.apply(this, arguments);

          var self = this;

          this.view = view;
          this._pushTabableHandler();

          this.tabableRegions = [];
          this.mustSortTabableRegions = false;

          // Backbone/Marionette events (are removed in destroy)
          this.listenTo(view, 'render', this._registerEventHandlers);
          this.listenTo(view, 'destroy', this._popTabableHandler);
          this.listenTo(view, 'dom:refresh', this.setFocusInActiveTabableRegion);

          //In order to prevent tab from going outside a contained area (i.e. dialog),
          //keydown is monitored on the behavioral view. The event listener will only prevent
          //tab outside the behavior view if parameter "containTabFocus' is set to true.
          // LPAD-54770, Make sure that keydown event is registered only once after view creation
          setTimeout(function () {
            view.$el.on('keydown.csui-tabables', function (event) {
              if (event.keyCode === 9 && getOption.call(self, 'containTabFocus')) {
                return self._maintainTabFocus(event);
              }
            });
          });

          //Used for cases where focus should be removed from the active behavior region
          //and placed in the text focusable region. For example when 'escape' is used to
          //to move focus outside of a textbox area to the next tabable region.
          this.listenTo(view, 'changed:focus', this._setFocusToNextRegion);
          this.listenTo(view, 'switch:view', function () {
            TabablesBehavior.switchViewDialog();
          });
        }, // constructor

        registerTabableRegion: function (tabableRegion) {
          if ($.contains(this.view.el, tabableRegion.view.el)) {
            this.unregisterTabableRegionBehavior(tabableRegion);
            this.tabableRegions.push(tabableRegion);
            this.mustSortTabableRegions = true;
            return true;
          } else {
            log.debug('registerTabableRegion: not registering non descendant view ' +
                      tabableRegion.view.constructor.name) &&
            console.log(log.last);
            return false;
          }
        },

        unregisterTabableRegionBehavior: function (tabableRegion) {
          if (tabableRegion) {
            if (_.contains(this.tabableRegions, tabableRegion)) {
              // remove that tabableRegionBehavior from the tabableRegions array
              log.debug('unregisterTabableRegion for view' + tabableRegion.view.constructor.name) &&
              console.log(log.last);

              this.tabableRegions = _.reject(this.tabableRegions,
                  function (trb) { return trb === tabableRegion; });

              // log.debug("Unsorted tabable regions:") && console.log(log.last);
              // _.each(this.tabableRegions, function (tabableRegionBehavior) {
              //   log.debug(" " + tabableRegionBehavior.view.constructor.name) &&
              //   console.log(log.last);
              // });

            }
          }
        },

        _pushTabableHandler: function () {
          log.debug('_pushTabableHandler in view ' + this.view.constructor.name) &&
          console.log(log.last);
          if (TabablesBehavior.tabablesHandlers.length > 0) {
            var topTabablesHandler = _.last(TabablesBehavior.tabablesHandlers);

            /*
                        var activeIdx = this._getActiveIndex();
                        if (activeIdx !== undefined) {
                          this.activeTabableRegionIndexBeforePush = activeIdx;
                          var activeTabableRegion = this.tabableRegions[activeIdx];
                          this.focusedElementBeforePush = activeTabableRegion.getCurrentlyFocusedElementFromView();
                        } else {
                          delete this.focusedElementBeforePush;
                          delete this.activeTabableRegionIndexBeforePush;
                        }
            */

            // invalidate all tabindexes in the current tabable regions before adding the new
            // "layer" of tabable regions at the top of the stack.
            // This prevents navigating by tab to any of this tabable regions.
            _.each(topTabablesHandler.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
              topTabablesHandler._clearTabIndexes.call(topTabablesHandler, tabableRegion.view);
            }, this);

          }
          TabablesBehavior.tabablesHandlers.push(this);

          // log.debug("Tabables after Push:");
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name);
          // });
        },

        _popTabableHandler: function () {
          if (TabablesBehavior.tabablesHandlers.length > 0) {

            var tabableHandlerToPop = _.last(TabablesBehavior.tabablesHandlers);

            log.debug('_popTabableHandler in view ' + tabableHandlerToPop.view.constructor.name) &&
            console.log(log.last);

            _.each(tabableHandlerToPop.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
            });

            // LPAD-54770. Remove keydown listener
            tabableHandlerToPop.view.$el.off('keydown.csui-tabables');

            tabableHandlerToPop.stopListening(tabableHandlerToPop.view);
            TabablesBehavior.tabablesHandlers.pop();

            // after removing the tabables handler from the stack let the tabable regions, that
            // are now on top of the stack re-set its tabindex values to make it keyboard
            // navigable again
            if (TabablesBehavior.tabablesHandlers.length > 0) {
              var topTabableHandler = _.last(TabablesBehavior.tabablesHandlers);
              _.each(topTabableHandler.tabableRegions, function (tabableRegion) {
                tabableRegion.setInitialTabIndex.call(tabableRegion);
                tabableRegion._registerEventHandlers.call(tabableRegion);
              });

              topTabableHandler._setFocusInActiveTabableRegion();
            }
          }
          // log.debug("Tabables after Pop:") && console.log(log.last);
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name) &&
          //   console.log(log.last);
          // });
        },

        _sortTabableRegions: function () {
          var tabableRegions = this.tabableRegions;
          var sortedTabableRegions = [];
          var tabableRegionElements = this.view.$el.find('.' + accessibilityRegionClass);
          tabableRegionElements.each(function (index, el) {
            var trb = _.find(tabableRegions, function (tabableRegion) {
              return tabableRegion.view.el === el;
            });
            if (trb) {
              sortedTabableRegions.push(trb);
            }
          });
          this.tabableRegions = sortedTabableRegions;
          this.mustSortTabableRegions = false;

          // log.debug("Sorted tabable regions:") && console.log(log.last);
          // _.each(this.tabableRegions, function (tabableRegion) {
          //   log.debug("    " + tabableRegion.view.constructor.name) && console.log(log.last);
          // });
        },

        //Get the next tabable region with an accessible focusable element.
        _getNextActiveRegion: function (shiftTab, recursiveNavigate) {
          var regions = this.tabableRegions, i, tabableRegion;

          // don't select regions for tabable which are hidden.
          regions = _.filter(regions, function (region) {
            return !region.$el.hasClass('binf-hidden');
          });

          var lastIndex   = regions.length - 1,
              activeIndex = this._getActiveIndex(regions);

          if (recursiveNavigate) {
            i = shiftTab ? (activeIndex === 0 ? lastIndex : activeIndex - 1) :
                (activeIndex === lastIndex ? 0 : activeIndex + 1);
          } else {
            i = shiftTab ? (activeIndex === 0 ? 0 : activeIndex - 1) :
                (activeIndex === lastIndex ? lastIndex : activeIndex + 1);
          }

          // return tabableRegion if it has only one tabable element.
          if (regions.length === 1) {
            tabableRegion = regions[0];
            return tabableRegion;
          }

          while (i != activeIndex) {
            tabableRegion = regions[i];
            var elToFocus = tabableRegion.getCurrentlyFocusedElementFromView(shiftTab);
            if (tabableRegion.view.isTabable() && elToFocus &&
                base.isVisibleInWindowViewport(elToFocus)) {
              // Do not focus elements out of the visible viewport rectangle;
              // it brings them to the visible screen, ignoring the absolute
              // positioning or transforms, if they were applied earlier
              return tabableRegion;
            }

            if (shiftTab) {
              if (i === 0) {
                i = recursiveNavigate ? lastIndex : activeIndex;
              }
              else if (i > 0) {
                --i;
              }
            }
            else {
              if (i === lastIndex) {
                i = recursiveNavigate ? 0 : activeIndex;
              }
              else if (i < lastIndex) {
                ++i;
              }
            }
          }
        },
        //Due to cases (like the target browser where regions are added and removed throughout a dialog
        //display) where regions may be placed out of order due to views being dynamically added and removed
        //throughout the life cycle of the parent container, sort order is reset on every index request.
        _getActiveIndex: function (regions) {
          if (this.currentlyActiveTabableRegion) {
            this._sortTabableRegions();
            var currentlyActive = this.currentlyActiveTabableRegion,
              tabableRegions  = this.tabableRegions;
            if (!!regions) {
              tabableRegions = regions;
            }
            for (var i = 0; i < tabableRegions.length; i++) {
              if (currentlyActive.view.cid === tabableRegions[i].view.cid) {
                return i;
              }
            }
          }
        },

        _deactivateCurrentActiveTabableRegion: function () {
          var activeIdx = this._getActiveIndex();

          if (activeIdx !== undefined && !!this.tabableRegions[activeIdx]) {
            this._setCurrentlyActiveTabableRegionInactive(this.tabableRegions[activeIdx]);
          }
          return activeIdx;
        },

        _setCurrentlyActiveTabableRegionInactive: function (tabableRegion) {
            var activeView = tabableRegion.view;
            var tabRegionEl = activeView.$el;

            tabRegionEl.removeClass(accessibilityActiveRegionClass);
            delete this.currentlyActiveTabableRegion;
            if (activeView.accDeactivateTabableRegion) {
              log.debug('deactivating tabable region ' + activeView.constructor.name) &&
              console.log(log.last);

              tabableRegion.ignoreFocusEvents = true;
              activeView.accDeactivateTabableRegion.call(activeView);
              tabableRegion.ignoreFocusEvents = false;
            }
        },

        _setTabableRegionActive: function (tabableRegion, shiftTab) {
          log.debug('activating ' + tabableRegion.view.constructor.name + ' as active tabable' +
                    ' region') && console.log(log.last);

          this._deactivateCurrentActiveTabableRegion();
          tabableRegion.view.$el.addClass(accessibilityActiveRegionClass);
          this.currentlyActiveTabableRegion = tabableRegion;
          if (tabableRegion.view.accActivateTabableRegion) {
            tabableRegion.ignoreFocusEvents = true;
            tabableRegion.view.accActivateTabableRegion.call(tabableRegion.view, shiftTab);
            tabableRegion.ignoreFocusEvents = false;
          }
        },

        _setFocusInActiveTabableRegion: function (shiftTab) {
          if (this.currentlyActiveTabableRegion && 
                document.body.contains(this.currentlyActiveTabableRegion.el)) {
            // this._setTabableRegionActive(this.currentlyActiveTabableRegion);
            this.currentlyActiveTabableRegion.setFocus(shiftTab);
          } else {
            // try to focus on a preferred region if no one is known as the active region, but
            // don't store it as the currently active one. This must be actively done by a
            // tabable region.
            var tabableRegionsByWeight = _.sortBy(this.tabableRegions, function (tabableRegion) {
              return tabableRegion.view.options.initialActivationWeight;
            });
            //var preferredRegion = _.last(tabableRegionsByWeight);

            var preferredRegion;
            tabableRegionsByWeight.reverse().some(function(region) {
              if (!region.options.notSetFocus) {
                preferredRegion = region;
                return true;
              }
            });

            if (preferredRegion && preferredRegion.view.options.initialActivationWeight > 0) {
              log.debug("setFocus: " + preferredRegion.view.constructor.name) && console.log(log.last);
              var didFocus = preferredRegion.setFocus(shiftTab);

              if (didFocus && document.activeElement) {
                if (document.activeElement.tagName === 'BODY') {
                  log.debug("setFocus Failed: " + preferredRegion.view.constructor.name) && console.log(log.last);
                }
                log.debug("document.activeElement: " + document.activeElement.tagName) && console.log(log.last);
              }
            }
          }
        },

        _clearTabIndexes: function (view) {
          // log.debug('_clearTabIndexes in view ' + view.constructor.name) && console.log(log.last);
          // find tabable/focusable elements including the view.$el element
          var focusables = view.$el.find(TabablesBehavior.focusablesSelector).addBack(
              TabablesBehavior.focusablesSelector);
          if (focusables.length) {
            // log.debug('set tabindex=-1 on ' + focusables.length + ' elements') && console.log(log.last);
            focusables.prop('tabindex', -1);
          } else {
            log.debug('_clearTabIndexes: no focusables found in ' + view.constructor.name) &&
            console.log(log.last);
          }
        },

        _maintainTabFocus: function (event) {
          var shiftTab    = event.shiftKey,
              activeIndex = this._getActiveIndex();
          //If an activeIndex is not available it is because regional focus has not
          //been set yet and this is the first tab request.
          if (activeIndex !== undefined) {
            var activeRegion = this.tabableRegions[activeIndex];
            var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
            if (!!activeRegion && activeRegion.onLastTabElement(shiftTab, event)) {
              var nextActiveRegion = this._getNextActiveRegion(shiftTab, false);
              if (!nextActiveRegion) {
                nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);

              }
              if (nextActiveRegion) {
                this._setTabableRegionActive(nextActiveRegion, shiftTab);
                this._setFocusInActiveTabableRegion(shiftTab);
              }
              return false;
            }
          }
          return true;
        },

        _setFocusToNextRegion: function setFocusToNextRegion(shiftTab) {
          var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
          var nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);
          if (nextActiveRegion) {
            this._setTabableRegionActive(nextActiveRegion);
            this._setFocusInActiveTabableRegion();
          }
        }
      },
      {
        // array with all TabablesBehavior instances
        tabablesHandlers: [],

        focusablesSelector: 'a[href], area[href], input, select, textarea, button,' +
                            ' iframe, object, embed, *[tabindex], *[contenteditable]',

        clearTabIndexes: function (view) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, view.el)) {
            if (view.clearTabIndexes) {
              view.clearTabIndexes();
            } else {
              tabablesBehavior._clearTabIndexes.call(tabablesBehavior, view);
            }
          }
        },

        setTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, tabableRegion.view.el)) {
            tabablesBehavior._setTabableRegionActive.call(tabablesBehavior, tabableRegion);
          }
        },

        isTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.currentlyActiveTabableRegion?.view.cid === tabableRegion.view.cid;
          }
        },

        setTabableRegionInactive: function (tabableRegion) {
          _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
            if (tabablesBehavior.currentlyActiveTabableRegion?.view.cid === tabableRegion.view.cid) {
              TabablesBehavior.prototype._setCurrentlyActiveTabableRegionInactive.call(tabablesBehavior, tabableRegion);
            }
          });
        },

        registerTabableRegion: function (tabableRegion) {
          log.debug('registerTabableRegion for view ' + tabableRegion.view.constructor.name) &&
          console.log(log.last);

          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.registerTabableRegion.call(tabablesBehavior, tabableRegion);
          }
        },

        unregisterTabableRegion: function (tabableRegion) {
          if (tabableRegion) {
            // make it simple: don't search for the tabables behavior instance. Just remove it
            // from everyone.
            _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
              tabablesBehavior.unregisterTabableRegionBehavior.call(tabablesBehavior,
                  tabableRegion);
            });
          }
        },

        // Activate (set focus) of the region that has the highest weight value in the tabable
        // region behavior options.
        //  This should be called when regions are actually shown in the dom.
        //  If a region is already active, skip initial activation.

        setFocusInActiveTabableRegion: function activateInitialTabableRegion() {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          }
        },

        popTabableHandler: function () {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._popTabableHandler();
          }
        },
        switchViewDialog: function(){
        

        var self = this;
        var tabablesBehaviorRemove = 
        self.tabablesHandlers[TabablesBehavior.tabablesHandlers.length-1];
       
        
        tabablesBehaviorRemove.view.$el.off('keydown.csui-tabables');

        tabablesBehaviorRemove.stopListening(tabablesBehaviorRemove.view);

        if(TabablesBehavior.tabablesHandlers.length>1){ // to avoid the removal of parent of dialog
          TabablesBehavior.tabablesHandlers.pop();
        }



          // re-register
          var tabablesBehavior = 
          this.tabablesHandlers[this.tabablesHandlers.length-1];

         tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          _.each(tabablesBehavior.tabableRegions, function (tabableRegion) {
           
            tabableRegion.setInitialTabIndex.call(tabableRegion);
            tabableRegion._registerEventHandlers.call(tabableRegion);
            setTimeout(function () {
              tabableRegion.view.$el.on('keydown.csui-tabables', function (event) {
                if (event.keyCode === 9 && getOption.call(tabablesBehavior, 'containTabFocus')) {
                  return tabablesBehavior._maintainTabFocus(event);
                }
              });
            });
          });
         
        }

      });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return TabablesBehavior;
});


csui.define('csui/behaviors/keyboard.navigation/tabable.region.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabables.behavior'
], function (module, _, $, Marionette, log, base, TabablesBehavior) {
  'use strict';


  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  var TabableRegionBehavior = Marionette.Behavior.extend({

      defaults: {
        initialActivationWeight: 0
      },

      constructor: function TabableRegionBehavior(options, view) {
        Marionette.Behavior.prototype.constructor.apply(this, arguments);

        this.view = view;
        view.tabableRegionBehavior = this;

        // merge behavior defaults into view
        _.extend(view, this.defaults);

        // add default implementation to view if it does not have one
        _.defaults(view, {
            // TODO remove use of isTabable because there is no code that gets called when the user
            // presses the tab key
            isTabable: function () {
              return true;  // default: this view can be reached by tab
            },
            onLastTabElement: function () {
              return true;  //most regions will only have one tab, with further navigation handled through arrow keys
            }
          }
        );

        if (view.options && !view.options.initialActivationWeight) {
          view.options.initialActivationWeight = this.options.initialActivationWeight;
        }

        this._registerEventHandlers();

      },

      _registerEventHandlers: function () {
        if (!this._eventsRegistered) {
          var view = this.view;
          var self = this;

          // log.debug('_registerEventHandlers ' + view.constructor.name) && console.log(log.last);

          this.listenTo(view, 'render', this._applyClasses);
          this.listenTo(view, 'dom:refresh', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              self.isRegistered = true;
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'refresh:tabindexes', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (self.isRegistered) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });

          this.listenTo(view, 'destroy', function () {
            this.currentlyFocusedElement?.off('focus.' + this.view.cid);
            TabablesBehavior.setTabableRegionInactive(this);
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            self.isRegistered = false;
          });
          this.listenTo(view, 'tabable', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'tabable:not', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            this.isRegistered = false;
          });

          this.listenTo(view, 'changed:focus', function () {
            if (self.isRegistered) {
              this.moveTabIndex();
            }
          });

          this.listenTo(view, 'escaped:focus', function () {
            TabablesBehavior.setFocusInActiveTabableRegion();
          });
          this._eventsRegistered = true;
        }
      },

      _unregisterEventHandlers: function () {
        var view = this.view;
        // log.debug('_unregisterEventHandlers ' + view.constructor.name) && console.log(log.last);

        this.stopListening(view);
        this._eventsRegistered = false;
      },

      getCurrentlyFocusedElementFromView: function (shiftTab) {
        if (_.isFunction(this.view.currentlyFocusedElement)) {
          var focusEl = this.view.currentlyFocusedElement({shiftKey: shiftTab});
          return (focusEl instanceof $ ? focusEl : $(focusEl));
        } else {
          if (_.isString(this.view.currentlyFocusedElement)) {
            return this.view.$(this.view.currentlyFocusedElement);
          } else {
            log.debug('setInitialTabIndex: ' + this.view.constructor.name + ' does not have' +
              ' currentlyFocusedElement -> not setting tabindex in that view ') &&
            console.log(log.last);
            return $();
          }
        }
      },

      onLastTabElement: function (shiftTab, event) {
        return this.view.onLastTabElement(shiftTab, event);
      },

      setFocus: function (shiftTab) {
        // Not set focus if the view is requested so that the behavior is not stealing the focus.
        // After rendering, the view is setting focus on element at same location by itself.
        if (this.options.notSetFocus) {
          return;
        }

        var elToFocus = this.getCurrentlyFocusedElementFromView(shiftTab);
        // Do not focus elements out of the visible viewport rectangle;
        // it brings them to the visible screen, ignoring the absolute
        // positioning or transforms, if they were applied earlier
        if (elToFocus && base.isVisibleInWindowViewport(elToFocus)) {
          this.ignoreFocusEvents = true;
          elToFocus[0].focus();
          this.ignoreFocusEvents = false;
          return true;
        }
      },

      setInitialTabIndex: function () {
        // TabablesBehavior.clearTabIndexes(this.view);
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
        }
        if (this.view.isTabable()) {
          try {
            this.currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
            if (this.currentlyFocusedElement && this.currentlyFocusedElement.length > 0) {
              var self = this;
              this.currentlyFocusedElement.prop('tabindex', 0);
              this.currentlyFocusedElement.addClass(
                TabableRegionBehavior.accessibilityActiveElementClass);
              this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
                if (!self.ignoreFocusEvents) {
                  TabablesBehavior.setTabableRegionActive(self);
                }
              });
            }
          } catch (e) {
            console.warn('Could not set as active element: ', this.view.cid, e.message);
          }

        } else {
          this.currentlyFocusedElement = $();
        }
      },

      moveTabIndex: function () {
        var self = this;
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
          this.currentlyFocusedElement.prop('tabindex', -1);
          this.currentlyFocusedElement.removeClass(
            TabableRegionBehavior.accessibilityActiveElementClass);
          this.currentlyFocusedElement = $();

        }
        var newlyFocusedElement = this.getCurrentlyFocusedElementFromView();
        newlyFocusedElement.prop('tabindex', 0);
        this.currentlyFocusedElement = newlyFocusedElement;
        this.currentlyFocusedElement.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
          if (!self.ignoreFocusEvents) {
            TabablesBehavior.setTabableRegionActive(self);
          }
        });
      },

      isActive: function() {
        return TabablesBehavior.isTabableRegionActive(this);
      },

      _applyClasses: function () {
        this.$el.addClass(TabableRegionBehavior.accessibilityRegionClass);
      }
    },
    {
      accessibilityRegionClass: 'csui-acc-tab-region',
      accessibilityActiveRegionClass: 'csui-acc-tab-region-active',
      accessibilityFocusableClass: 'csui-acc-focusable',
      accessibilityActiveElementClass: 'csui-acc-focusable-active'
    }
  );

  return TabableRegionBehavior;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/error.global/impl/error.global',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " aria-describedby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":5,"column":92},"end":{"line":5,"column":101}}}) : helper)))
    + "\" ";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='server-error-message-wrapper'>\n          <div class='server-error-message horizontal-center-align'>\n            <span id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":12,"column":22},"end":{"line":12,"column":31}}}) : helper)))
    + "\" class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":12,"column":60},"end":{"line":12,"column":71}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='navigation-control-container' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"noHistory") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":20,"column":50},"end":{"line":20,"column":97}}})) != null ? stack1 : "")
    + ">\n          <a class='go-back-button circle-border horizontal-center-align' href=\"#\"\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":19},"end":{"line":22,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":48},"end":{"line":22,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\n              <span class='icon icon-back'></span>\n          </a>\n          <div class='go-back-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":25,"column":79},"end":{"line":25,"column":94}}}) : helper)))
    + "'>\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backText") || (depth0 != null ? lookupProperty(depth0,"backText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backText","hash":{},"loc":{"start":{"line":26,"column":20},"end":{"line":26,"column":32}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n        <div class='navigation-control-container'>\n          <a class='go-home-button circle-border horizontal-center-align' href=\"#\"\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":19},"end":{"line":31,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":48},"end":{"line":31,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\n              <span class='icon icon-home'></span>\n          </a>\n          <div class='go-home-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":34,"column":79},"end":{"line":34,"column":94}}}) : helper)))
    + "'>\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeText") || (depth0 != null ? lookupProperty(depth0,"homeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeText","hash":{},"loc":{"start":{"line":35,"column":20},"end":{"line":35,"column":32}}}) : helper)))
    + "</span>\n          </div>\n        </div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return " style='display:none;' ";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showCloseButton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":39,"column":8},"end":{"line":43,"column":15}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class='navigation-control-container'>\n            <button type=\"submit\" class=\"close-button highlighted-btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeText") || (depth0 != null ? lookupProperty(depth0,"closeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeText","hash":{},"loc":{"start":{"line":41,"column":71},"end":{"line":41,"column":84}}}) : helper)))
    + "</button>\n          </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='main-area-container' role='region' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"regionAria") || (depth0 != null ? lookupProperty(depth0,"regionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"regionAria","hash":{},"loc":{"start":{"line":1,"column":59},"end":{"line":1,"column":73}}}) : helper)))
    + "'>\n  <div class='main-area-group'>\n    <div class='error-message-area'>\n      <div class='error-message-wrapper'>\n        <h2 class='error-message horizontal-center-align' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":58},"end":{"line":5,"column":110}}})) != null ? stack1 : "")
    + " >\n          <span class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorMessage") || (depth0 != null ? lookupProperty(depth0,"errorMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorMessage","hash":{},"loc":{"start":{"line":6,"column":43},"end":{"line":6,"column":59}}}) : helper)))
    + "</span>\n        </h2>\n      </div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":6},"end":{"line":15,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n\n    <div class='navigation-area horizontal-center-align'>\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hideNavigationButtons") : depth0),{"name":"unless","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(8, data, 0),"loc":{"start":{"line":19,"column":6},"end":{"line":44,"column":17}}})) != null ? stack1 : "")
    + "    </div>\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('csui_widgets_error.global_impl_error.global', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('csui/widgets/error.global/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});


csui.define('csui/widgets/error.global/impl/nls/root/lang',{

  errorMessage: 'There was a problem serving the requested page.',
  backText: 'Go back',
  backTooltip: 'Navigate back to previous URL',
  homeText: 'Home',
  homeTooltip: 'Navigate to landing page',
  closeText: 'Close',
  closeTooltip: 'Close the error page',
  globalErrorRegionAria: 'Global error'

});




csui.define('css!csui/widgets/error.global/impl/error.global',[],function(){});

csui.define('csui/widgets/error.global/error.global.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/utils/contexts/factories/global.error', 'csui/utils/contexts/factories/application.scope.factory',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/error.global/impl/error.global',
  'i18n!csui/widgets/error.global/impl/nls/lang',
  'csui/utils/log',
  'module',
  'css!csui/widgets/error.global/impl/error.global'
], function (_, $, Marionette, base, GlobalErrorModelFactory,
    ApplicationScopeModelFactory, TabableRegionBehavior, template, lang, log, module) {
  'use strict';
  log = log(module.id);

  var GlobalErrorView = Marionette.ItemView.extend({
    className: 'csui-global-error',

    template: template,
    templateHelpers: function () {
      return {
        errorMessage: lang.errorMessage,
        backText: lang.backText,
        backTooltip: lang.backTooltip,
        homeText: lang.homeText,
        homeTooltip: lang.homeTooltip,
        closeText: lang.closeText,
        closeTooltip: lang.closeTooltip,
        msgId: _.uniqueId('msg'),
        regionAria: lang.globalErrorRegionAria,
        noHistory: this.noHistory
      };
    },

    TabableRegion: {
      behaviorClass: TabableRegionBehavior,
      initialActivationWeight: 100
    },

    ui: {
      errorMessage: '.error-message > span',
      closebutton: '.close-button'
    },

    events: {
      'keydown': 'onKeyInView',
      'click .go-home-button': 'onClickHome',
      'click .go-home-text': 'onClickHome',
      'click .go-back-button': 'onClickBack',
      'click .go-back-text': 'onClickBack',
      'click @ui.closebutton': 'onClickClose'
    },

    constructor: function GlobalErrorView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      if (!this.model) {
        this.model = options.context.getModel(GlobalErrorModelFactory, options);
      }

      this.noHistory = options.context &&
                       options.context.viewStateModel &&
                       options.context.viewStateModel.getHistory().length < 1;

      // IE11 fails to update CSS center styling correctly on window resize
      if (base.isIE11()) {
        var self = this;
        var resizeHandler = function () {
          self.render();
        };
        $(window).on('resize', resizeHandler);
        this.once('before:destroy', function () {
          $(window).off('resize', resizeHandler);
        });
      }
    },

    currentlyFocusedElement: function (event) {
      return this.ui.errorMessage;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger('click');
      }
    },

    onClickHome: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel,
          start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      if (start_id) {
        var nextNode = context.getModel('nextNode');
        nextNode.set('id', start_id);
      } else {
        var applicationScope = context.getModel(ApplicationScopeModelFactory);
        applicationScope.set('id', '');
      }
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.history.back();
    },

    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      // destroy view, the caller should listen to 'destroy' and 'childview:destroy'
      // to get informed about closing this view
      this.destroy();
    }

  });

  return GlobalErrorView;
});


csui.define('csui/utils/non-attaching.region/non-attaching.region',['csui/lib/marionette'], function (Marionette) {
  'use strict';

  var NonAttachingRegion = Marionette.Region.extend({

    constructor: function NonAttachingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {}

  });

  return NonAttachingRegion;

});


csui.define('css!csui/pages/error.page/impl/error.page',[],function(){});

// Places the error page view to the page body
csui.define('csui/pages/error.page/error.page.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/error.global/error.global.view',
  'csui/utils/url',
  'csui/utils/non-attaching.region/non-attaching.region',
  'css!csui/pages/error.page/impl/error.page'
], function (_, $, Marionette, PageContext, ApplicationScopeModelFactory,
    GlobalErrorView, Url, NonAttachingRegion) {

  var ErrorPageView = Marionette.ItemView.extend({

    template: false,

    constructor: function ErrorPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.ItemView.prototype.constructor.call(this, options);

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets csui-error-page-container');

      this.context = new PageContext();
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:id', this._onChangeId);
      this.globalErrorView = new GlobalErrorView({
        model: options.model,
        context: this.context
      });
    },

    onRender: function () {
      this.globalErrorView.render();
      this.$el.empty().append(this.globalErrorView.el);

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));
    },

    _onChangeId: function () {
	    location.href = Url.combine(new Url(new Url(location.pathname).getCgiScript()), 'app');
    }

  });

  return ErrorPageView;
});


csui.define('bundles/csui-error',[
  // Pages
  'csui/pages/error.page/error.page.view',
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-error', true);
});

//# sourceMappingURL=csui-error.js.map