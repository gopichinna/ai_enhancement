/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "i18n", "csui/utils/base", "csui/utils/commonconfig.util", "hbs!csui/controls/thumbnail/content/thumbnail.icon/util/gallery", "hbs!csui/controls/thumbnail/content/thumbnail.icon/util/gallery.item", "hbs!csui/controls/thumbnail/content/thumbnail.icon/util/filmstrip.item", "css!csui/controls/thumbnail/content/thumbnail.icon/util/gallary", "csui/lib/jquery.touchSwipe" ], function(module, _, $, i18n, base, CommonConfig, GalleryTemplate, GalleryItemTemplate, FlimStripItemTemplate) {
  "use strict";
  var data, galleryContent, galleryItems, galleryFilmItems, totalItems, currentItem, currentItemName, filmStripActiveItem, filmStripWidth, nextFocusIndex, leadingView, angle = 0, img, zoom = 1, cursor, mouseMoveForPan, pointX, pointY, x_prev, y_prev;
  let config = module.config();
  _.defaults(config, {
    enableZoomAndRotation: CommonConfig.enableFeatureInSmartView() || false
  });
  function createGalleryContainer(args) {
    var galleryData = args.galleryData, currentItemIndex = args.currentItemIndex, lang = args.lang, onlyVideos = args.onlyVideos, view = args.view;
    zoom = 1;
    data = galleryData;
    totalItems = galleryData.length;
    currentItem = galleryData[currentItemIndex];
    currentItemName = currentItem.name;
    nextFocusIndex = 0;
    leadingView = view || {};
    mouseMoveForPan = false;
    pointX = 0;
    pointY = 0;
    x_prev = 0;
    y_prev = 0;
    galleryContent = $("<div />", {
      class: "binf-gallery-container",
      html: GalleryTemplate({
        enableZoomAndRotation: config.enableZoomAndRotation,
        totalItems: galleryData.length,
        currentItem: currentItem.index + 1,
        currentItemName: currentItemName,
        lang: lang,
        onlyVideos: onlyVideos
      })
    });
    galleryItems = $("<div />", {
      class: "binf-carousel-inner",
      html: GalleryItemTemplate({
        data: galleryData
      })
    });
    galleryFilmItems = $("<div />", {
      class: "csui-carousel-film-strip-inner",
      html: FlimStripItemTemplate({
        data: galleryData
      })
    });
    galleryContent.find(".csui-carousel-film-strip .binf-carousel").html(galleryFilmItems);
    galleryContent.find(".csui-preview-carousal").html(galleryItems);
    _.each(galleryData, function(data, index) {
      var originalImageContainer = galleryContent.find(".binf-item-" + data.model.cid).find(".csui-gallery-original-icon");
      if (data.model.flipRight) {
        originalImageContainer.find("img").css({
          "-webkit-transform": "scaleX(-1)",
          "-moz-transform": "scaleX(-1)",
          "-o-transform": "scaleX(-1)",
          transform: "scaleX(-1)",
          filter: "FlipH",
          "-ms-filter": "FlipH"
        });
      }
      originalImageContainer.find("img").css({
        "-webkit-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-moz-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-ms-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-o-transform": "rotate(" + data.model.transformDegrees + "deg)",
        transform: "rotate(" + data.model.transformDegrees + "deg)"
      });
      originalImageContainer.find("img").attr({
        "aria-label": lang.OpenTitle,
        title: lang.OpenTitle
      });
    }, this);
    if (data.length < 2) {
      galleryContent.find("#binf-carousel").children(".binf-left").hide();
      galleryContent.find("#binf-carousel").children(".binf-right").hide();
    }
    filmStripWidth = 74;
    var carouselFilmStripWidth = filmStripWidth * data.length;
    if ($(window).width() < carouselFilmStripWidth) {
      galleryContent.find(".csui-carousel-film-strip-inner").css("width", carouselFilmStripWidth + "px");
      galleryContent.find(".csui-carousel-film-strip-inner").addClass("csui-film-strip-adjust");
    }
    galleryContent.find("#binf-carousel").on("slid.binf.carousel", updateSlide);
    galleryContent.find(".cs-close.csui-thumbcarousel-dialog-close").on("click keydown", closeDialog);
    galleryContent.find(".csui-thumb-toggle-control").on("click", {
      lang: lang
    }, thumbToggle);
    galleryContent.find(".csui-download-gallery").on("click keydown", downloadItem);
    galleryContent.find(".csui-preview-carousal-container .binf-carousel-control").on("keydown", onKeyInPreviewCarouselControl);
    galleryFilmItems.find(".binf-item").on("keydown", onKeyInGalleryFilmStrip);
    const container = galleryContent.find(".csui-gallery-original-icon>img");
    if (config.enableZoomAndRotation) {
      galleryContent.find("#binf-carousel .binf-left").on("click keydown", {
        lang: lang
      }, resetImg);
      galleryContent.find("#binf-carousel .binf-right").on("click keydown", {
        lang: lang
      }, resetImg);
      galleryContent.find(".csui-rotate-gallery").on("click keydown", rotateItem);
      galleryContent.find(".csui-zoom-gallery").on("click keydown", {
        lang: lang
      }, zoomItem);
      container.on("keydown", {
        lang: lang
      }, executeDefaultAction);
      container.on("click", {
        lang: lang
      }, clickHandler(executeDefaultAction, mouseDblClickHandler));
      container.on("mousewheel wheel", {
        lang: lang
      }, mouseWheelHandler);
      container.on("pointerdown", mouseDownHandler);
      container.on("pointerup", mouseUpHandler);
      container.on("pointermove", mouseMoveHandler);
    } else {
      container.on("keydown click", executeDefaultAction);
    }
    if (!base.isMSBrowser()) {
      galleryContent.find("#binf-carousel").swipe({
        swipe: function(event, direction, distance, duration, fingerCount, fingerData) {
          if (zoom === 1) {
            if (direction == "left") {
              $(this).binf_carousel("next");
              zoom = 1;
            }
            if (direction == "right") {
              $(this).binf_carousel("prev");
              zoom = 1;
            }
          }
        },
        allowPageScroll: "vertical"
      });
    }
    return galleryContent;
  }
  $(window).on("resize", function() {
    if (base.isTouchBrowser()) {
      $(".csui-thumbcarousel-dialog").addClass("csui-adjust-gallery-backdrop");
    }
    if (!config.enableZoomAndRotation) return;
    img = galleryContent && galleryContent.find(".csui-preview-carousal .binf-active img");
    const parentPosition = document.querySelector(".binf-carousel-inner .binf-active")?.getBoundingClientRect(), imgPosition = document.querySelector(".binf-active .csui-img-box img")?.getBoundingClientRect();
    if (!img || !parentPosition || !imgPosition) return;
    let transformMatrix = img.css("transform"), x, y;
    if (transformMatrix && transformMatrix != "" && transformMatrix.search("matrix") != -1) {
      const arrValues = transformMatrix.replace("matrix(", "").replace(")", "").split(",");
      x = parseFloat(arrValues[4]);
      y = parseFloat(arrValues[5]);
    }
    const newTopVal = (imgPosition.height - parentPosition.height) / 2, newLeftVal = (imgPosition.width - parentPosition.width) / 2;
    if (newTopVal > 0 && parseInt(Math.abs(y)) >= parseInt(newTopVal)) y = y < 0 ? newTopVal * -1 : newTopVal;
    if (newTopVal < 0) y = 0;
    if (newLeftVal > 0 && parseInt(Math.abs(x)) >= parseInt(newLeftVal)) x = x < 0 ? newLeftVal * -1 : newLeftVal;
    if (newLeftVal < 0) x = 0;
    $(img).css("transform", `translateX(${x}px) translateY(${y}px) scale(${zoom})`);
  });
  function resetImg(e) {
    if (e.type === "keydown" && e.keyCode === 13 || e.type === "click") {
      img = galleryContent.find(".csui-preview-carousal .binf-active img");
      if (!img) return;
      img.attr({
        "aria-label": e.data.lang.OpenTitle,
        title: e.data.lang.OpenTitle
      });
      $(img).css("transform-origin", "center");
      $(img).css("transform", "");
      $(img).css("aspect-ratio", "auto");
    }
  }
  function clickHandler(singleClk, doubleClk) {
    return function() {
      let alreadyclicked = false;
      let alreadyclickedTimeout;
      return function(e) {
        if (alreadyclicked) {
          alreadyclicked = false;
          alreadyclickedTimeout && clearTimeout(alreadyclickedTimeout);
          doubleClk && doubleClk(e);
        } else {
          alreadyclicked = true;
          alreadyclickedTimeout = setTimeout(function() {
            alreadyclicked = false;
            singleClk && singleClk(e);
          }, 300);
        }
      };
    }();
  }
  function mouseDblClickHandler(e) {
    img = galleryContent.find(".csui-preview-carousal .binf-active img");
    if (!img) return;
    const zoomOutButton = document.querySelector("#zoomOutButton"), zoomInButton = document.querySelector("#zoomInButton");
    if (zoom >= 3) {
      zoom = 1;
      addInactiveClass(zoomOutButton);
      removeInactiveClass(zoomInButton);
      img.attr({
        "aria-label": e.data.OpenTitle || e.data.lang.OpenTitle,
        title: e.data.OpenTitle || e.data.lang.OpenTitle
      });
      cursor = "pointer";
    } else {
      zoom = 3;
      addInactiveClass(zoomInButton);
      removeInactiveClass(zoomOutButton);
      img.removeAttr("aria-label title");
      cursor = "move";
    }
    angle = 0;
    $(img).css("aspect-ratio", "auto");
    $(img).css({
      transform: "scale(" + zoom + ")",
      cursor: cursor
    });
  }
  function mouseWheelHandler(e) {
    img = galleryContent.find(".csui-preview-carousal .binf-active img");
    if (!img) return;
    e.preventDefault();
    const zoomOutButton = document.querySelector("#zoomOutButton"), zoomInButton = document.querySelector("#zoomInButton");
    if (e.originalEvent.wheelDelta > 0) {
      if (zoom >= 3) return false;
      removeInactiveClass(zoomOutButton);
      img.removeAttr("aria-label title");
      zoom += .1;
      if (zoom >= 3) addInactiveClass(zoomInButton);
      cursor = "move";
    } else {
      if (zoom <= 1) return false;
      removeInactiveClass(zoomInButton);
      zoom = Math.max(zoom - .1, 1);
      if (zoom <= 1) {
        cursor = "pointer";
        addInactiveClass(zoomOutButton);
        img.attr({
          "aria-label": e.data.lang.OpenTitle,
          title: e.data.lang.OpenTitle
        });
      }
    }
    angle = 0;
    $(img).css("aspect-ratio", "auto");
    $(img).css({
      transform: "scale(" + zoom + ")",
      cursor: cursor
    });
  }
  function mouseDownHandler(e) {
    mouseMoveForPan = true;
  }
  function mouseMoveHandler(e) {
    e.preventDefault();
    if (!mouseMoveForPan) return;
    img = galleryContent.find(".csui-preview-carousal .binf-active img");
    if (!img) return;
    let containerDiv = $(".csui-preview-carousal .binf-item.binf-active .csui-img-box");
    let parentOffset = containerDiv.offset();
    let left = parentOffset.left;
    let top = parentOffset.top;
    pointX = e.clientX - left;
    pointY = e.clientY - top;
    $(img).css("transform-origin", `${pointX}px ${pointY}px`);
    $(img).css("transform", `scale${zoom}`);
  }
  function mouseUpHandler(e) {
    e.preventDefault();
    mouseMoveForPan = false;
  }
  function downloadItem(event) {
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
      currentItem.downloadItem(event);
    }
  }
  function rotateItem(event) {
    img = galleryContent.find(".csui-preview-carousal .binf-active img");
    if (!img) return;
    let containerDiv = $(".csui-preview-carousal .binf-item.binf-active .csui-img-box");
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
      zoom = 1;
      const zoomOutButton = document.querySelector("#zoomOutButton"), zoomInButton = document.querySelector("#zoomInButton");
      addInactiveClass(zoomOutButton);
      removeInactiveClass(zoomInButton);
      $(img).css("transform-origin", "center");
      $(img).css("transform", "scale 1");
      if (event.target.id == "leftRotation") {
        angle = angle - 90;
      } else {
        angle = (angle + 90) % 360;
      }
      if (angle % 90 === 0 && angle % 180 != 0) {
        if (img.width() > containerDiv.height()) {
          $(img).css({
            "aspect-ratio": "1"
          });
        }
      } else {
        $(img).css({
          "aspect-ratio": "auto"
        });
      }
      $(img).css({
        transform: `rotate(${angle}deg)`
      });
    }
  }
  function removeInactiveClass(element) {
    element.classList.remove("inactive");
    element.tabIndex = 0;
  }
  function addInactiveClass(element) {
    element.classList.add("inactive");
    element.tabIndex = -1;
  }
  function zoomItem(event) {
    img = galleryContent.find(".csui-preview-carousal .binf-active img");
    if (!img) return;
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
      const zoomOutButton = document.querySelector("#zoomOutButton"), zoomInButton = document.querySelector("#zoomInButton");
      if (event.target.id == "zoomOutButton") {
        if (zoom <= 1) return false;
        removeInactiveClass(zoomInButton);
        zoom -= .1;
        if (zoom <= 1) {
          cursor = "pointer";
          addInactiveClass(zoomOutButton);
          img.attr({
            "aria-label": event.data.lang.OpenTitle,
            title: event.data.lang.OpenTitle
          });
        }
      } else {
        if (zoom >= 3) return false;
        removeInactiveClass(zoomOutButton);
        img.removeAttr("aria-label title");
        zoom += .1;
        if (zoom >= 3) addInactiveClass(zoomInButton);
        cursor = "move";
      }
      angle = 0;
      $(img).css("aspect-ratio", "auto");
      $(img).css({
        transform: "scale(" + zoom + ")",
        cursor: cursor
      });
    }
  }
  function executeDefaultAction(event) {
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
      if (zoom > 1) {
        event.type === "keydown" && mouseDblClickHandler({
          data: event.data.lang
        });
      } else {
        leadingView && (leadingView.model = currentItem.model);
        currentItem.executeDefaultAction(event);
      }
    }
  }
  function onKeyDownOnImage(event) {
    const keyCode = event.keyCode;
    if (keyCode >= 37 && keyCode <= 40) {
      if (zoom === 1) return;
      event.preventDefault();
      event.stopPropagation();
      let pixelsToMoveOnX = 0, pixelsToMoveOnY = 0, width = img.width(), height = img.height();
      const parentPosition = document.querySelectorAll(".binf-carousel-inner .binf-active")[0].getBoundingClientRect(), imgPosition = document.querySelectorAll(".binf-active .csui-img-box img")[0].getBoundingClientRect(), left = parentPosition.left - imgPosition.left, right = parentPosition.right - imgPosition.right, top = parentPosition.top - imgPosition.top, bottom = parentPosition.bottom - imgPosition.bottom;
      let x, y, transformMatrix = img.css("transform"), toPrevX = false, toPrevY = false;
      if (transformMatrix && transformMatrix != "" && transformMatrix.search("matrix") != -1) {
        let scale, arrValues;
        arrValues = transformMatrix.replace("matrix(", "").replace(")", "").split(",");
        scale = arrValues[3];
        x = parseFloat(arrValues[4]);
        y = parseFloat(arrValues[5]);
        width = scale * width;
        height = scale * height;
      }
      switch (keyCode) {
       case 37:
        {
          pixelsToMoveOnX = 50;
          const newLeftVal = left + x;
          x = left > pixelsToMoveOnX ? x + pixelsToMoveOnX : newLeftVal <= 0 ? 0 : newLeftVal;
          break;
        }

       case 39:
        {
          pixelsToMoveOnX = -50;
          const newRightVal = right + x;
          x = right < pixelsToMoveOnX ? x + pixelsToMoveOnX : newRightVal < 0 ? newRightVal : 0;
          break;
        }

       case 38:
        {
          pixelsToMoveOnY = 50;
          const newTopVal = top + y;
          y = top > pixelsToMoveOnY ? y + pixelsToMoveOnY : newTopVal <= 0 ? 0 : newTopVal;
          break;
        }

       case 40:
        {
          pixelsToMoveOnY = -50;
          const newBottomVal = bottom + y;
          y = bottom < pixelsToMoveOnY ? y + pixelsToMoveOnY : newBottomVal < 0 ? newBottomVal : 0;
          break;
        }
      }
      if (keyCode === 37 && left <= pixelsToMoveOnX || keyCode === 39 && right >= pixelsToMoveOnX) {
        toPrevX = true;
      } else if (keyCode === 38 && top <= pixelsToMoveOnY || keyCode === 40 && bottom >= pixelsToMoveOnY) {
        toPrevY = true;
      }
      if (x === 0 && toPrevX && imgPosition.width > parentPosition.width) {
        x = x_prev;
      }
      if (y === 0 && toPrevY && imgPosition.height > parentPosition.height) {
        y = y_prev;
      }
      x_prev = x;
      y_prev = y;
      $(img).css("transform", `translateX(${x}px) translateY(${y}px) scale(${width / img.width()},${height / img.height()})`);
    }
  }
  function closeDialog(event) {
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) || event.type === "click") {
      currentItem.closeDialog(event);
    }
  }
  function updateSlide(e, el) {
    const itemName = galleryContent[0].querySelector(".binf-widgets .csui-active-item-name .item-name"), iconsList = galleryContent[0].querySelectorAll(".csui-image-icons");
    var activeThumbnail;
    if (e.type === "click" || e.type === "keyup") {
      activeThumbnail = el;
    } else {
      activeThumbnail = e.relatedTarget;
    }
    filmStripWidth = $(galleryContent.find(".csui-carousel-film-strip-inner .binf-thumb-img")[0]).width() + 10;
    filmStripActiveItem = galleryContent.find(".csui-carousel-film-strip-inner").find(".binf-item").removeClass("binf-active");
    var filmStripActiveElement = $(filmStripActiveItem[$(activeThumbnail).index()]);
    filmStripActiveElement.addClass("binf-active");
    if (currentItem && currentItem.index >= 0) {
      currentItem = data[$(activeThumbnail).index()];
      img = galleryContent.find(".csui-preview-carousal .binf-active img");
      if (!currentItem?.isVideo) {
        zoom = 1;
        angle = 0;
        $(img).css({
          cursor: "pointer"
        });
        img.on("keydown", onKeyDownOnImage);
        if (config.enableZoomAndRotation) img.on("load", {
          iconsList: iconsList,
          itemName: itemName
        }, onLoadImage);
        galleryContent.find(".binf-item img:not(.binf-hidden)").css("transform", "");
      }
      if (!currentItem.model.contentFetched || currentItem?.isVideo) {
        iconsList.forEach(function(icon) {
          icon.classList.remove("csui-icons-display");
          icon.classList.add("binf-hidden");
        });
        itemName.classList.remove("csui-icons-display-item-name");
      } else {
        img.trigger("load");
      }
      if (data[currentItem.index].model && data[currentItem.index].model.contentURL && !data[currentItem.index].model.addedOriginalImage) {
        $(activeThumbnail).addClass("csui-item-original");
        data[currentItem.index].addedOriginalImage = true;
        if ($(activeThumbnail).find("img").length > 0) {
          $(activeThumbnail).find("img").attr("src", data[currentItem.index].model.contentURL);
        }
        if ($(activeThumbnail).find("video").length > 0) {
          $(activeThumbnail).find("video").attr("src", data[currentItem.index].model.contentURL);
          $(activeThumbnail).find(".outer-border").addClass("binf-hidden");
        }
      }
      $(this).find("video").trigger("pause");
      currentItemName = currentItem.name;
      galleryContent.find(".csui-current-total-items").html(currentItem.index + 1 + " / " + totalItems);
      galleryContent.find(".csui-active-item-name .item-name").html(currentItemName);
      currentItem.updateScroll(filmStripActiveElement, currentItem);
    }
  }
  function onLoadImage(e) {
    e.data.iconsList.forEach(function(icon) {
      icon.classList.add("csui-icons-display");
      icon.classList.remove("binf-hidden");
    });
    e.data.itemName.classList.add("csui-icons-display-item-name");
    const zoomOutButton = document.querySelector("#zoomOutButton"), zoomInButton = document.querySelector("#zoomInButton");
    addInactiveClass(zoomOutButton);
    removeInactiveClass(zoomInButton);
  }
  function thumbToggle(event) {
    galleryContent.find(".csui-carousel-film-strip .binf-carousel").slideToggle();
    galleryContent.find(".binf-glyphicon-menu-down").toggleClass("binf-glyphicon-menu-up");
    if (galleryContent.find(".binf-glyphicon-menu-up").length > 0) {
      galleryContent.find(".binf-glyphicon-menu-up").attr("title", event.data.lang.showTitle);
    } else {
      galleryContent.find(".binf-glyphicon-menu-down").attr("title", event.data.lang.hideTitle);
    }
  }
  function onKeyInPreviewCarouselControl(event) {
    if (event.type === "keydown" && event.keyCode === 32) {
      $(event.currentTarget).trigger("click");
    }
    if (event.type === "keydown" && event.keyCode === 9 && !event.shiftKey) {
      $(galleryFilmItems.find(".binf-item")[0]).attr("tabindex", 0);
    }
    nextFocusIndex = 0;
  }
  function onKeyInGalleryFilmStrip(event) {
    var focusableElements = galleryFilmItems.find(".binf-item");
    switch (event.keyCode) {
     case 9:
      if (!event.shiftKey) {
        galleryContent.parents(".binf-modal-content").find(".cs-close").trigger("focus");
        event.preventDefault();
        event.stopPropagation();
      } else {
        $(focusableElements[0]).attr("tabindex", -1);
      }
      break;

     case 13:
     case 32:
      $(event.currentTarget) && $(event.currentTarget).find(".binf-thumb").trigger("click");
      break;

     case 39:
      nextFocusIndex < focusableElements.length - 1 && ++nextFocusIndex;
      $(focusableElements[nextFocusIndex]).trigger("focus");
      break;

     case 37:
      nextFocusIndex > 0 && --nextFocusIndex;
      $(focusableElements[nextFocusIndex]).trigger("focus");
      break;
    }
    nextFocusIndex = nextFocusIndex;
  }
  return {
    createGalleryContainer: createGalleryContainer,
    updateSlide: updateSlide,
    thumbToggle: thumbToggle,
    downloadItem: downloadItem,
    rotateItem: rotateItem,
    zoomItem: zoomItem,
    executeDefaultAction: executeDefaultAction
  };
});