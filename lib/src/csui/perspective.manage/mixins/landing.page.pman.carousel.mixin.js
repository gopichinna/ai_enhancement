/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n" ], function(i18n) {
  "use strict";
  let LandingPagePmanMixin = {
    mixin: function(prototype) {
      return Object.assign(prototype, {
        slide: function(event) {
          let isRtl = i18n && i18n.settings.rtl;
          const direction = this.getSlideDirection(event);
          const topRibbonWidth = this.topRibbonRegion.el.clientWidth;
          const track = this.topRibbonView.el;
          const items = track.querySelectorAll(".csui-top-ribbon-item");
          const moreActionItems = track.querySelectorAll(".csui-perspective-actions-dropdown-view");
          const itemWidth = items[0].clientWidth;
          const slidesPerPage = 1;
          const visibleSlides = Math.round(topRibbonWidth / itemWidth * 100) / 100;
          let activeSlide;
          let moreOptionDropdownPosition;
          if (event === undefined) {
            activeSlide = this.onClickPerspective(items);
          } else if (event.type === "shown") {
            moreOptionDropdownPosition = this.onClickMoreActions(event, moreActionItems, visibleSlides);
          }
          this.currentSlide = activeSlide ? activeSlide : this.currentSlide ? this.currentSlide : 0;
          const newSlide = this.currentSlide + (direction === "left" ? -slidesPerPage : slidesPerPage);
          const lastSlide = newSlide + visibleSlides;
          if (newSlide <= 0) {
            this.currentSlide = 0;
            this.slideControlsdisabled("prev");
          } else if (lastSlide >= items.length) {
            this.currentSlide = items.length - visibleSlides;
            this.slideControlsdisabled("next");
          } else {
            this.slideControlsdisabled();
            this.currentSlide = newSlide;
          }
          this.currentSlide = this.isTopRibbonCarouselDisabled ? 0 : this.currentSlide;
          moreOptionDropdownPosition = Math.min(moreOptionDropdownPosition, this.currentSlide);
          if (isRtl) {
            if (event?.type === "shown") {
              track.style.transform = `translateX(${moreOptionDropdownPosition * itemWidth}px)`;
            } else {
              track.style.transform = `translateX(${this.currentSlide * itemWidth}px)`;
            }
          } else {
            if (event?.type === "shown") {
              track.style.transform = `translateX(-${moreOptionDropdownPosition * itemWidth}px)`;
            } else {
              track.style.transform = `translateX(-${this.currentSlide * itemWidth}px)`;
            }
          }
        },
        getSlideDirection: function(event) {
          let direction;
          if (event === undefined) {
            direction = "left";
          } else if (event.type === "click") {
            direction = event.currentTarget?.id;
          } else if (event.type === "shown") {
            direction = event.data?.direction;
          } else if (event.type === "keydown") {
            if (event.key === "ArrowLeft") {
              direction = "left";
            } else if (event.key === "ArrowRight") {
              direction = "right";
            } else if (event.key === "Tab") {
              direction = "left";
            }
          }
          return direction;
        },
        slideControlsdisabled: function(button) {
          if (this.isTopRibbonCarouselDisabled) {
            this.ui.nextButton[0].disabled = true;
            this.ui.prevButton[0].disabled = true;
          } else if (button === "prev") {
            this.ui.prevButton[0].disabled = true;
            this.ui.nextButton[0].disabled = false;
          } else if (button === "next") {
            this.ui.nextButton[0].disabled = true;
            this.ui.prevButton[0].disabled = false;
          } else {
            this.ui.nextButton[0].disabled = false;
            this.ui.prevButton[0].disabled = false;
          }
        },
        toggleCarousel: function(event) {
          const items = this.topRibbonView.el.querySelectorAll(".csui-top-ribbon-item");
          const topRibbonCarousel = this.ui.topRibbonCarousel[0];
          if (items.length == 0) return;
          const className = "csui-top-ribbon-carousel-disabled";
          this.enableCarousel(items);
          if (this.isTopRibbonCarouselDisabled) {
            topRibbonCarousel.classList?.add(className);
            this.currentSlide = 0;
            this.slide(event);
          } else {
            topRibbonCarousel.classList?.remove(className);
            if (event?.type === "shown" && event.data?.direction === "left") return;
            this.slide(event);
          }
        },
        enableCarousel: function(items) {
          const topRibbonWidth = this.topRibbonRegion.el.clientWidth;
          const itemWidth = items[0].clientWidth;
          this.isTopRibbonCarouselDisabled = false;
          if (!!(items.length * itemWidth <= topRibbonWidth)) {
            this.isTopRibbonCarouselDisabled = true;
          }
        },
        onClickPerspective: function(items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].classList.contains("binf-active")) {
              return i + 1;
            }
          }
        },
        onClickMoreActions(event, moreActionItems, visibleSlides) {
          const index = [ ...moreActionItems ].indexOf(event.currentTarget);
          const isLastItem = index + 1 === moreActionItems.length;
          return isLastItem ? moreActionItems.length - visibleSlides : this.currentSlide + 1;
        }
      });
    }
  };
  return LandingPagePmanMixin;
});