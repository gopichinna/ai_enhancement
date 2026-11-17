/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/facet.bar/impl/facet.bar.item.view", "smart/controls/facet.bar/impl/facet.bar.dropdown.item.view", "smart/mixins/generic.utilities/footerview.responsiveness.mixin", "i18n!smart/controls/facet.bar/impl/nls/lang", "css!smart/controls/facet.bar/impl/facet.bar" ], function(_, $, Backbone, Marionette, FacetBarItemView, FacetBarDropDownItemsView, FooterViewResponsiveMixin, lang) {
  var FacetBarItemsView = Marionette.CollectionView.extend({
    childView: FacetBarItemView,
    childViewOptions: function() {
      return {
        parentView: this
      };
    },
    tagName: "ol",
    className: "csui-facet-list",
    events: {
      keydown: "onKeydown",
      focusout: "onFocusout"
    },
    constructor: function FacetBarItemsView(options) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.completeCollection = new Backbone.Collection();
      this.completeCollection.add(this.collection.toJSON(), {
        silent: true
      });
      this.listenTo(this.collection, "reset", this._collectionResetCb);
      this.listenTo(this, "adjust:facetbar", _.bind(function() {
        this.collectionFlag = false;
        this._checkOverflow();
        this.render();
      }, this));
      this.listenTo(this.collection, "change", this._checkOverflow);
      this.listenTo(this.collection, "add", this._checkOverflow);
      this.listenTo(this.collection, "remove", this._checkOverflow);
      this.listenTo(this, "on:collection:change", _.bind(function(newCollection) {
        if (newCollection.length === 0) {
          this.collectionFlag = false;
        }
        this.completeCollection.reset(newCollection.toJSON());
        this.collection.reset(newCollection.toJSON());
      }, this));
      this.paddingVal = 8;
      this.currentFocusIndex = options?.currentFocusIndex || 0;
      $(document).on("click." + this.cid, _.bind(this._handleDocumentClick, this));
      this.listenToOnce(this, "destroy", _.bind(function() {
        $(document).off("click." + this.cid);
      }, this));
    },
    _handleDocumentClick: function(event) {
      let activeElement = document.activeElement ?? document.body, currentFocusedElement = $(activeElement);
      this.trigger("collapse:normal:facetbar:menu", {
        event: event,
        currentFocusedElement: currentFocusedElement
      });
    },
    _collectionResetCb: function() {
      if (!this.collectionFlag) {
        let self = this;
        setTimeout(() => {
          self._checkOverflow();
          self.collectionFlag = false;
        }, 10);
      }
    },
    onRender: function() {
      this.$el.attr("aria-label", lang.filterListAria);
      if (this.dropdownCollection?.length) {
        if (this.dropdownView?.isRendered) {
          this.dropdownView.collection?.reset(this.dropdownCollection);
        } else {
          this.dropdownView = new FacetBarDropDownItemsView({
            ...this.options,
            collection: new Backbone.Collection(this.dropdownCollection),
            parentView: this
          });
          this._addChildView(this.dropdownView, this.collection.length);
        }
      } else {
        this.dropdownView?.trigger("destroy");
      }
    },
    onKeydown: function(e) {
      const keyCode = e.keyCode, target = e.target;
      if (keyCode === 9 || keyCode === 13 || keyCode === 32 || keyCode === 27 || keyCode === 46) {
        return;
      }
      const focusableElements = this._getListfocusableElements();
      switch (keyCode) {
       case 39:
       case 40:
        this.currentFocusIndex++;
        this._focusListItem(e);
        break;

       case 37:
       case 38:
        this.currentFocusIndex--;
        this._focusListItem(e);
        break;

       case 35:
        this.currentFocusIndex = focusableElements?.length - 1;
        this._focusListItem(e);
        break;

       case 33:
        this.currentFocusIndex = 0;
        this._focusListItem(e);
        break;

       case 34:
        this.currentFocusIndex = focusableElements?.length - 1;
        this._focusListItem(e);
        break;

       default:
        if (focusableElements?.includes(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      return true;
    },
    onFocusout: function(e) {
      const focusableElements = this._getListfocusableElements();
      focusableElements.forEach(element => {
        element.setAttribute("tabindex", -1);
      });
      if (!focusableElements.includes(e.relatedTarget) && !e.relatedTarget?.classList?.contains("csui-facet-item-topic")) {
        focusableElements[0]?.setAttribute("tabindex", 0);
        this.currentFocusIndex = 0;
      }
    },
    _focusListItem: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const listFocusableElements = this._getListfocusableElements();
      listFocusableElements.forEach((listItem, index) => {
        listItem.setAttribute("tabindex", -1);
        if (index === this.currentFocusIndex) {
          listItem.setAttribute("tabindex", 0);
          listItem.focus();
        }
      });
      if (this.currentFocusIndex < 0) {
        this.currentFocusIndex = 0;
      } else if (this.currentFocusIndex >= listFocusableElements.length) {
        this.currentFocusIndex = listFocusableElements.length - 1;
      }
      this.trigger("update:active:facet:index", this.currentFocusIndex, listFocusableElements[this.currentFocusIndex]);
    },
    _getListfocusableElements: function() {
      let focusableEls = Array.from(this.el?.querySelectorAll(".csui-facet-item .smart-facet-item-collapsed *[tabindex]")).filter(ele => ele.tagName.toLowerCase() !== "otc-button");
      if (this.el?.querySelector(".csui-facet-dropdown")) {
        focusableEls.push(this.el?.querySelector(".csui-facet-dropdown .binf-dropdown-toggle"));
      }
      return focusableEls;
    },
    onDomRefresh: function() {
      this._setInitialTabIndex();
    },
    _setInitialTabIndex: function() {
      const listItemView = this?.children?._views[Object.keys(this?.children?._views)[this.currentFocusIndex]];
      listItemView?.trigger("set:tab:index", 0);
    },
    _checkOverflow: function() {
      if (this.$el.length) {
        var el = this.$el[0];
        var sw = el.scrollWidth;
        var ow = this.availableWidth - (16 + 10);
        if (!this.el?.closest(".smart-facet-bar")?.querySelector(".csui-clear-all")?.classList?.contains("binf-hidden")) {
          ow -= 85 + 16;
        }
        if (this.$el.is(":visible") && this.availableWidth != 0 && ow < sw) {
          this._getDisplayWidth(this);
          var length = this.displayWidth.length;
          var lastEle = this.displayWidth[0];
          for (var i = length - 1; i >= 0; i--) {
            if (ow >= lastEle - this.displayWidth[i] + 32 && this.completeCollection) {
              this.dropdownCollection = this.completeCollection.slice(i, length);
              this.collectionFlag = true;
              this.collection.reset(this.completeCollection.slice(0, i));
              break;
            }
          }
        } else {
          this.displayWidth = [];
          this.collectionFlag = true;
          this.collection.reset(this.completeCollection.models);
          this.dropdownCollection = [];
          this.dropdownView?.trigger("destroy");
        }
      }
    }
  });
  _.extend(FacetBarItemsView.prototype, FooterViewResponsiveMixin);
  return FacetBarItemsView;
});