/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/facet.bar/facet.bar.items.view", "hbs!smart/controls/facet.bar/impl/facet.bar", "i18n!smart/controls/facet.bar/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/facet.bar/impl/facet.bar" ], function($, _, Backbone, Marionette, FacetBarItemsView, template, lang, theming, jatoIcons) {
  "use strict";
  var FacetBarView = Marionette.LayoutView.extend({
    className: "csui-facet-bar csui-facet-bar-hidden smart-facet-bar",
    template: template,
    ui: {
      facetListArea: "> .csui-facet-list-bar > .csui-facet-list-area",
      facetList: "> .csui-facet-list-bar > .div.csui-facet-list-area > .csui-facet-list",
      clearAll: ".csui-clear-all",
      leftFader: ".csui-mover.csui-overflow-left > .csui-facet-list-fade",
      rightFader: ".csui-mover.csui-overflow-right > .csui-facet-list-fade",
      moreFacetDropdown: "> .csui-facet-list-bar > .csui-facet-list-area .csui-facet-dropdown .csui-facet-bar-dropdown"
    },
    regions: {
      facetBarItemsRegion: ".csui-facet-list-area",
      clearAllRegion: ".csui-clear-all"
    },
    triggers: {
      "click .csui-clear-all": "remove:all"
    },
    events: {
      "click .csui-facet-item .smart-facet-close": "onRemoveFilter",
      keydown: "onKeyInView"
    },
    constructor: function FacetBarView(options = {}) {
      options.scrollableParentEle ||= "body.binf-wigets";
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.allTopicsCollection = new Backbone.Collection(this._getAllTopics(this.collection.filters));
      this.listenTo(this.collection, "reset", this._filtersUpdated, this);
      this.listenTo(this.collection, "set:readonly", this._filtersUpdated, this);
      this.listenTo(this.allTopicsCollection, "change update", this.onCollectionChange);
      this.listenTo(this.allTopicsCollection, "reset", this.onCollectionChange);
      this.listenTo(this.allTopicsCollection, "add", this.onCollectionChange);
      this.listenTo(this.allTopicsCollection, "remove", this.onCollectionChange);
      const lazyOnWinResize = _.debounce(this.onWinResize, 300);
      $(window).on("resize.facetview", lazyOnWinResize.bind(this));
      this.listenTo(this, "adjustFacetBarOnSaveAs", function() {
        if (!this.isDestroyed) {
          this.render();
        }
        this._adjustMoreDropdownDirection();
      });
    },
    onWinResize: function() {
      if (!this.isDestroyed) {
        this.render();
      }
      this._adjustMoreDropdownDirection();
    },
    _adjustMoreDropdownDirection: function() {
      if (this.ui.facetListArea[0]?.offsetWidth < 193) {
        this.$el.find(".csui-facet-bar-dropdown").addClass("smart-open-right");
      } else {
        this.$el.find(".csui-facet-bar-dropdown").removeClass("smart-open-right");
      }
    },
    _adjustFacetBarOverflow: function() {
      this.facetBarItemsView.availableWidth = this.$el.width();
      this.facetBarItemsView.trigger("adjust:facetbar");
    },
    onCollectionChange: function() {
      this.facetBarItemsView.trigger("on:collection:change", this.getCollectionCopy());
      this.render();
    },
    getCollectionCopy: function() {
      var newCollection = new Backbone.Collection();
      newCollection.add(this.allTopicsCollection.toJSON(), {
        silent: true
      });
      return newCollection;
    },
    onKeyInView: function(event) {
      let keyCode = event.keyCode, retVal = true, $target = $(event.target);
      switch (keyCode) {
       case 9:
        const facetItemsList = this.facetBarItemsView?._getListfocusableElements();
        if (event.shiftKey) {
          if ($target[0] === this.ui?.clearAll[0]) {
            this.ui?.clearAll[0]?.setAttribute("tabindex", -1);
            this.facetBarItemsView.currentFocusIndex = 0;
            facetItemsList[0]?.setAttribute("tabindex", 0);
            facetItemsList[0]?.focus();
            event.preventDefault();
            event.stopPropagation();
          }
        } else {
          if (this.ui?.clearAll[0] && !this.ui?.clearAll[0].classList?.contains("binf-hidden") && $target[0] !== this.ui?.clearAll[0]) {
            $target[0].setAttribute("tabindex", -1);
            this.ui?.clearAll[0]?.setAttribute("tabindex", 0);
            this.ui?.clearAll[0]?.focus();
            event.preventDefault();
            event.stopPropagation();
          }
        }
        retVal = true;
        break;

       case 46:
        if ($target.parent().hasClass("smart-facet-item-collapsed smart-facet-item-single-value") || $target.parent().hasClass("smart-multi-value-facets") || $target.parent().hasClass("csui-facet-topic")) {
          this._triggerRemoveFilter($target.find(".smart-facet-close")[0]);
          retVal = false;
        }
        break;

       case 13:
        if ($target.parent().hasClass("smart-facet-item-collapsed smart-facet-item-single-value") || $target.parent().hasClass("smart-multi-value-facets") || $target.parent().hasClass("csui-facet-topic")) {
          this._triggerRemoveFilter($target.find(".smart-facet-close")[0]);
          retVal = false;
        }
        if ($target.hasClass("csui-clear-all")) {
          this.trigger("remove:all");
          retVal = false;
        }
        break;

       case 32:
        retVal = false;
        break;
      }
      return retVal;
    },
    onDestroy: function() {
      $(window).off("resize.facetview", this.onWinResize);
    },
    onRender: function() {
      this.facetBarItemsView = new FacetBarItemsView({
        ...this.options,
        collection: this.getCollectionCopy(),
        currentFocusIndex: this.activeFacetItemIndex
      });
      this.listenTo(this.facetBarItemsView, "update:active:facet:index", function(activeIndex, element) {
        this.activeFacetItemIndex = activeIndex;
      });
      this.facetBarItemsRegion.show(this.facetBarItemsView);
      this._handleClearAllVisibility();
      this._adjustFacetBarOverflow();
    },
    initialize: function() {
      this.removeFilterTimer = null;
      this.topicsToBeRemoved = [];
    },
    _getAllTopics: function() {
      var allTopics = [];
      var filters = this.collection.filters;
      for (var i = 0; i < filters.length; i++) {
        var filter = filters[i], values = filter.values, facetId = filter.id, readOnlyFilter = filter.readOnlyFilter, facet = this.collection.get(facetId), topicId;
        if (facet) {
          var facetName = facet.get("name");
          var topicMap = {};
          for (var j = 0; j < values.length; j++) {
            var value = values[j];
            topicId = value.id;
            var topic = !!facet.topics && facet.topics.get(topicId);
            if (topic) {
              var topicName = topic.get("name");
              var childlist = topicMap[facetName];
              var child = {
                topicId: topicId,
                facetId: facetId,
                topicName: topicName,
                topicLabel: facetName,
                clearTitle: lang.clearTitle,
                isJATO: theming.isJATOTheme(),
                jatoCloseIconSvg: jatoIcons.actionCloseSmall,
                ariaLabel: _.str.sformat(readOnlyFilter ? lang.facetItemAriaReadOnly : lang.clearFacetItemAria, topicName, facetName)
              };
              if (!childlist) {
                topicMap[facetName] = [ child ];
              } else {
                childlist.push(child);
              }
            }
          }
          var keys = Object.keys(topicMap);
          for (var k in topicMap) {
            if (topicMap.hasOwnProperty(k)) {
              var children = topicMap[k], modifiedChildren = [], uniqueids = "";
              _.each(children, function(childTopic) {
                if (keys.indexOf(childTopic.topicId) === -1) {
                  modifiedChildren.push(childTopic);
                  uniqueids += childTopic.topicId + "~";
                }
              });
              uniqueids = uniqueids.substring(0, uniqueids.length - 1);
              topicMap[k] = modifiedChildren;
              const topicnames = _.pluck(modifiedChildren, "topicName"), facetItemAria = readOnlyFilter ? lang.facetItemAriaReadOnly : topicMap[k].length > 1 ? lang.facetItemMultivalueAria : lang.facetItemAria;
              if (topicMap[k].length > 0) {
                allTopics.push({
                  id: facetId + "~" + uniqueids,
                  facetName: topicMap[k][0].topicLabel || facetName,
                  topics: topicMap[k],
                  facetId: facetId,
                  topicId: topicId,
                  facetItemAria: _.str.sformat(facetItemAria, facetName, topicnames.join()),
                  readOnlyFilter: readOnlyFilter
                });
              }
            }
          }
        }
      }
      this.collection.trigger("mask:facetPanel:facetBar", {
        maskFacetPanel: false
      });
      return allTopics;
    },
    _handleClearAllVisibility: function() {
      if (this.allTopicsCollection.length > 0) {
        this.el?.classList?.remove("csui-facet-bar-hidden");
        const hideClearAll = this.allTopicsCollection?.some(topic => !!topic.readOnlyFilter || !!topic.get("readOnlyFilter"));
        hideClearAll || this.options.hideClearAll ? this.ui.clearAll[0]?.classList?.add("binf-hidden") : this.ui.clearAll[0]?.classList?.remove("binf-hidden");
        this.trigger("facet:bar:visible");
      } else {
        this.el?.classList?.add("csui-facet-bar-hidden");
        this.ui.clearAll[0]?.classList?.add("binf-hidden");
        this.trigger("facet:bar:hidden");
      }
    },
    _filtersUpdated: function() {
      const allTopics = this._getAllTopics(this.collection.filters);
      this.allTopicsCollection.reset(allTopics);
      this._handleClearAllVisibility();
      this.trigger("filters:updated");
      this?.facetBarItemsView?.trigger("dom:refresh");
      if (this.facetBarItemsView?._getListfocusableElements()[this.activeFacetItemIndex]) {
        this.facetBarItemsView?._getListfocusableElements()[this.activeFacetItemIndex]?.setAttribute("tabindex", 0);
      } else {
        this.facetBarItemsView?._getListfocusableElements()[0]?.setAttribute("tabindex", 0);
      }
    },
    templateHelpers: function() {
      return {
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
        hideClearAll: this.options.hideClearAll
      };
    },
    onClearAll: function() {
      this.trigger("remove:all");
    },
    onRemoveFilter: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const facetItemTopic = e.target?.closest(".csui-facet-item-topic");
      const targetedParent = facetItemTopic ?? e.target?.closest(".smart-facet-item-single-value")?.querySelector(".csui-facet-item-content");
      targetedParent?.classList.add("smart-disabled-facet-chip");
      this.collection.trigger("mask:facetPanel:facetBar", {
        maskFacetPanel: true
      });
      this._triggerRemoveFilter(e.target);
    },
    applyFilter: function(facet) {
      this.trigger("apply:filter", facet.newFilter);
    },
    _triggerRemoveFilter: function(target) {
      if (target) {
        let filter;
        if (target.classList?.contains("smart-facet-close")) {
          filter = target;
        } else {
          filter = target.closest(".smart-facet-close");
        }
        if (filter) {
          const facetId = filter.getAttribute("data-csui-facet"), topicId = filter.getAttribute("data-csui-topic");
          const filterModel = this.allTopicsCollection?.findWhere({
            facetId: facetId
          });
          if (filterModel && !filterModel.get("readOnlyFilter")) {
            this.topicsToBeRemoved.push({
              facetId: facetId,
              id: topicId
            });
            this._triggerRemoveMultipleFilter();
          }
        }
      }
    },
    _triggerRemoveMultipleFilter: function(facetId) {
      if (this.removeFilterTimer) {
        clearTimeout(this.removeFilterTimer);
        this.removeFilterTimer = null;
      }
      this.removeFilterTimer = setTimeout(() => {
        this._removeFilters();
        this.removeFilterTimer = null;
      }, 1500);
    },
    _removeFilters: function(facetId) {
      this.newFilter = this.formatFilterArray(this.topicsToBeRemoved);
      this.topicsToBeRemoved = [];
      this.trigger("remove:filter", this.newFilter);
    },
    formatFilterArray: function(preFromattedFilterArray) {
      let grouped = {};
      preFromattedFilterArray.forEach(item => {
        if (!grouped[item.facetId]) {
          grouped[item.facetId] = [];
        }
        grouped[item.facetId].push({
          id: item.id
        });
      });
      this.finalFilterObject = Object.entries(grouped).map(([ facetId, values ]) => ({
        id: facetId,
        values: values
      }));
      return this.finalFilterObject;
    }
  });
  return FacetBarView;
});