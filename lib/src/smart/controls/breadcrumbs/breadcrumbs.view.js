/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/breadcrumbs/breadcrumb.view", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "i18n!smart/controls/breadcrumbs/impl/nls/lang", "smart/themes/theming", "smart/lib/binf/js/binf", "css!smart/controls/breadcrumbs/impl/breadcrumbs" ], function(_, $, Backbone, Marionette, BreadCrumbItemView, TabableRegionBehavior, lang, theming) {
  var BreadCrumbCollectionView = Marionette.CollectionView.extend({
    tagName: "ol",
    className: function() {
      return "binf-breadcrumb binf-breadcrumb-" + this.options.theme;
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    childView: BreadCrumbItemView,
    childViewOptions: function(model, index) {
      let isLastChild = index === (model.get("showAsLink") ? this.collection.size() : this.collection.size() - 1);
      let textColor = (isLastChild && !!this.options.textColorForLastItem ? this.options.textColorForLastItem : this.options.textColor) || "";
      return {
        textColor: textColor,
        childIndex: index,
        theme: this.options.theme,
        isLastChild: isLastChild,
        honorCustomizations: this.options?.honorCustomizations
      };
    },
    constructor: function BreadcrumbCollectionView(options = {}) {
      options.enableHome ??= false;
      this.completeCollection = options.collection;
      options.collection = new Backbone.Collection();
      options.theme ||= "light";
      Marionette.CollectionView.call(this, options);
      this.listenTo(this, "readjust:breadcrumbs", this.refresh);
    },
    is: "BreadcrumbCollectionView",
    initialize: function(options) {
      this.listenTo(this.completeCollection, "update reset", this.synchronizeCollections);
      this.listenTo(this, "sync:collection", this.synchronizeCollections);
      this.stop = this.options.stop || {};
      this.options.noOfItemsToShow = parseInt(this.options.noOfItemsToShow, 10);
      this._startSubCrumbs = this.options.startSubCrumbs !== undefined ? parseInt(this.options.startSubCrumbs, 10) : 1;
      this._startSubCrumbs === 0 && this.options.enableHome && (this._startSubCrumbs = 1);
      this._subCrumbsLength = 0;
      this.accLastBreadcrumbElementFocused = false;
      this.accNthBreadcrumbElementFocused = 0;
      this.resizeTimer = undefined;
      $(window).on("resize." + this.cid, {
        view: this
      }, this._onWindowResize);
    },
    _onWindowResize: function(event) {
      if (event?.data?.view) {
        var self = event.data.view;
        if (self.resizeTimer) {
          clearTimeout(self.resizeTimer);
        }
        self.resizeTimer = setTimeout(function() {
          self._adjustToFit();
        }, 200);
      }
    },
    events: {
      keydown: "onKeyInView"
    },
    _breadcrumbSelector: "a.csui-acc-focusable:visible, otc-link.csui-acc-focusable:visible, otc-button.csui-acc-focusable:visible",
    isTabable: function() {
      return this.collection.models.length > 1;
    },
    currentlyFocusedElement: function() {
      if (this.isTabable()) {
        if (this.accLastBreadcrumbElementFocused) {
          return this.$(this._breadcrumbSelector + ":last");
        } else {
          var breadcrumbElements = this.$(this._breadcrumbSelector);
          return $(breadcrumbElements[this.accNthBreadcrumbElementFocused]);
        }
      } else {
        return $();
      }
    },
    onKeyInView: function(event) {
      var allBreadcrumbElements, allSubcrumbsElements;
      switch (event.keyCode) {
       case 37:
        if (this.$el.find("otc-menu[isopen]").length === 1) {
          this.hideSubCrumbs();
        }
        allBreadcrumbElements = this.$(this._breadcrumbSelector);
        if (this.accLastBreadcrumbElementFocused) {
          if (allBreadcrumbElements.length > 1) {
            this.accLastBreadcrumbElementFocused = false;
            this.accNthBreadcrumbElementFocused = allBreadcrumbElements.length - 2;
          }
        } else {
          if (this.accNthBreadcrumbElementFocused > 0) {
            this.accNthBreadcrumbElementFocused--;
          }
        }
        this.trigger("changed:focus", this);
        this.currentlyFocusedElement().trigger("focus");
        break;

       case 40:
        if (document.activeElement === this.$el.find(".csui-subcrumb")[0]) {
          let dropdownItems = document.querySelectorAll("otc-menuitem.csui-breadcrumb");
          dropdownItems[0].focus();
        }
        break;

       case 39:
        if (this.$el.find("otc-menu[isopen]").length === 1) {
          this.hideSubCrumbs();
        }
        if (!this.accLastBreadcrumbElementFocused) {
          allBreadcrumbElements = this.$(this._breadcrumbSelector);
          if (this.accNthBreadcrumbElementFocused < allBreadcrumbElements.length - 1) {
            this.accNthBreadcrumbElementFocused++;
            this.trigger("changed:focus", this);
            this.currentlyFocusedElement().trigger("focus");
          }
        }
        break;

       case 13:
        let dropdown = this.el?.querySelectorAll("li.binf-dropdown");
        if (dropdown?.length && dropdown[0].querySelector("otc-menu").getAttribute("isopen") === null && document.activeElement.classList.contains("csui-breadcrumb")) {
          document.activeElement.click();
        }
        break;
      }
    },
    synchronizeCollections: function(skipAdjustToFit) {
      this._getUpdatedCollection(this.completeCollection);
      this.trigger("before:synchronized");
      var excerpt = this.completeCollection.last(this.completeCollection.length) || [];
      if (this?.stop?.id) {
        this._removeAncestorsFromStopPoint(excerpt, this.stop.id);
      }
      this._removeAncestorsToNumItemsToShow(excerpt);
      this._subCrumbsLength = 0;
      this.currentIndex = 0;
      this._refreshBreadCrumbsDisplay();
      if (typeof skipAdjustToFit === "boolean") {
        if (!skipAdjustToFit) {
          this._adjustToFit();
        }
      } else {
        this._adjustToFit();
      }
      this.trigger("after:synchronized");
    },
    _getUpdatedCollection: function(collection) {
      if (this.options.enableHome && collection.length) {
        var homeModel = new Backbone.Model({
          id: "home",
          name: lang.homeIconAria,
          parent_id: undefined,
          type: undefined,
          type_name: "Landing page",
          volume_id: undefined,
          hrefSrc: "/"
        });
        collection.add(homeModel, {
          at: 0,
          silent: true
        });
      }
    },
    _refreshBreadCrumbsDisplay: function() {
      var subCrumbs, subCrumbsMenu, displayArr = this.completeCollection.last(this.completeCollection.length) || [];
      if (this?.stop?.id) {
        this._removeAncestorsFromStopPoint(displayArr, this.stop.id);
      }
      this._removeAncestorsToNumItemsToShow(displayArr);
      if (this._subCrumbsLength > 0) {
        subCrumbs = _.range(this._startSubCrumbs, this._startSubCrumbs + this._subCrumbsLength).map(function(rangeVal) {
          return displayArr[rangeVal];
        });
        subCrumbsMenu = {
          id: -1,
          name: "...",
          subcrumbs: subCrumbs
        };
        displayArr.splice(this._startSubCrumbs, this._subCrumbsLength, subCrumbsMenu);
      }
      displayArr.length && this.collection.reset(displayArr);
    },
    refresh: function() {
      this._adjustToFit();
      this.triggerMethod("dom:refresh");
    },
    _adjustToFit: function() {
      this.$el && this.$el.addClass("smart-loading-breadcrumbs");
      var maxDisplayWidth = this._getMaxDisplayWidth(), childElementsWidthArray = this._getDisplayWidth(), eleWidth = childElementsWidthArray[childElementsWidthArray.length - 1];
      if (eleWidth > maxDisplayWidth) {
        this._shrinkToFit(maxDisplayWidth);
      } else if (eleWidth < maxDisplayWidth) {
        this._expandToFit(maxDisplayWidth);
      }
      var tabEvent = $.Event("tab:content:field:changed");
      this.trigger(tabEvent);
      this.$el && this.$el.removeClass("smart-loading-breadcrumbs");
    },
    _shrinkToFit: function(maxDisplayWidth) {
      this._startSubCrumbs = this._startSubCrumbs > this.collection.length - 3 ? 1 : this._startSubCrumbs;
      var shrinkableItems = this.collection.length - this._startSubCrumbs - 1, subCrumbs;
      if (maxDisplayWidth > 0) {
        var displayWidth = this._getDisplayWidth(), childrenTotalWidth = displayWidth[displayWidth.length - 1];
        if (childrenTotalWidth > maxDisplayWidth && (shrinkableItems > 0 || shrinkableItems === 0 && window.devicePixelRatio === 2 && this._subCrumbsLength === 0)) {
          this.currentIndex = this.currentIndex || 0;
          var i;
          for (i = 0; i <= displayWidth.length - 1; i++) {
            if (maxDisplayWidth > childrenTotalWidth - displayWidth[i] + 32) {
              var idx = i + 1;
              this._startSubCrumbs = this._startSubCrumbs >= this.collection.length - idx ? 1 : this._startSubCrumbs;
              shrinkableItems = this.completeCollection.length - this._startSubCrumbs - 1;
              if (this._subCrumbsLength + idx - this.currentIndex <= shrinkableItems) {
                subCrumbs = idx - this.currentIndex;
                this.currentIndex = idx;
              } else {
                subCrumbs = shrinkableItems - this.currentIndex;
                this.currentIndex = shrinkableItems;
              }
              this._adjustSubCrumbsLengthBy(subCrumbs);
              break;
            }
          }
          if (i >= displayWidth.length - 1) {
            this._adjustSubCrumbsLengthBy(shrinkableItems - this.currentIndex);
            this.currentIndex = shrinkableItems;
          }
        }
      }
    },
    _expandToFit: function(maxDisplayWidth) {
      var shrinkableItems = this.collection.size() - this._startSubCrumbs - 2;
      if (maxDisplayWidth > 0) {
        var displayWidth = this._getDisplayWidth(), childrenTotalWidth = displayWidth[displayWidth.length - 1];
        if (this._subCrumbsLength > 0 && childrenTotalWidth < maxDisplayWidth) {
          this._adjustSubCrumbsLengthBy(0 - this.currentIndex);
          this.currentIndex = 0;
        } else if (shrinkableItems > 0 && childrenTotalWidth > maxDisplayWidth) {
          this._adjustSubCrumbsLengthBy(1);
        }
      }
    },
    _adjustSubCrumbsLengthBy: function(amt) {
      this._subCrumbsLength += amt;
      this._subCrumbsLength = Math.min(this._subCrumbsLength, this.completeCollection.size() - this._startSubCrumbs);
      this._refreshBreadCrumbsDisplay();
    },
    _getMaxDisplayWidth: function() {
      return this.el.offsetWidth * .9;
    },
    _getDisplayWidth: function() {
      if (this.displayWidth && this.displayWidth.length !== 0 && this.completeCollection.length === this.displayWidth.length) {
        return this.displayWidth;
      }
      this.displayWidth = [];
      var childs = this.el.children, displayWidth = 0;
      for (let child of childs) {
        if ($(child) && $(child).is(":visible")) {
          displayWidth += child.offsetWidth;
          this.displayWidth.push(displayWidth);
        }
      }
      return this.displayWidth;
    },
    hide: function(hideBreadcrumb) {
      this.el.classList[hideBreadcrumb ? "add" : "remove"]("binf-hidden");
      return true;
    },
    hideSubCrumbs: function() {
      var $subCrumb = this.el.querySelector("li.binf-dropdown");
      if ($subCrumb?.querySelector("otc-menu").getAttribute("isopen") !== null) {
        this.el.querySelector(".csui-subcrumb").click();
      }
    },
    updateStopId: function(newId) {
      this.stop.id = newId;
    },
    _removeAncestorsFromStopPoint: function(collection, stopId) {
      for (const [ i, model ] of collection.entries()) {
        if (model.get("id") === stopId) {
          collection.splice(0, i);
          break;
        }
      }
    },
    _removeAncestorsToNumItemsToShow: function(collection) {
      if (this.options?.noOfItemsToShow >= 0) {
        var limit = this.options.noOfItemsToShow >= collection.length ? 0 : collection.length - this.options.noOfItemsToShow;
        collection.splice(0, limit);
      }
    },
    onBeforeDestroy: function() {
      $(window).off("resize." + this.cid, this._onWindowResize);
    }
  });
  return BreadCrumbCollectionView;
});