/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "nuc/utils/types/date", "csui/models/facets", "csui/models/facettopics", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/controls/facet.bar/facet.bar.items.view", "d2/controls/facet.bar/impl/facet.bar.task.date.item.view", "dctmw/utils/utils", "hbs!d2/controls/facet.bar/impl/facet.bar", "i18n!d2/controls/facet.bar/impl/nls/lang", "css!d2/controls/facet.bar/impl/facet.bar" ], function($, _, Backbone, Marionette, base, dateUtils, FacetCollection, FacetTopicCollection, TabableRegionBehavior, FacetBarItemsView, FacetBarDateItemView, utils, template, lang) {
  "use strict";
  var FacetBarView = Marionette.LayoutView.extend({
    className: "d2-facet-bar  d2-facet-bar-hidden",
    template: template,
    ui: {
      facetListArea: "> .d2-facet-list-bar > .d2-facet-list-area",
      facetList: "> .d2-facet-list-bar > .div.d2-facet-list-area > .d2-facet-list",
      clearAll: ".d2-clear-all",
      moveLeft: ".d2-overflow-left",
      moveRight: ".d2-overflow-right",
      movers: ".d2-mover",
      leftFader: ".d2-mover.d2-overflow-left > .d2-facet-list-fade",
      rightFader: ".d2-mover.d2-overflow-right > .d2-facet-list-fade"
    },
    regions: {
      facetBarItemsRegion: ".d2-facet-list-area",
      clearAllRegion: ".d2-clear-all"
    },
    triggers: {
      "click .d2-clear-all": "clear:all"
    },
    events: {
      "click @ui.moveLeft": "onMoveLeft",
      "click @ui.moveRight": "onMoveRight",
      "click .d2-facet-item .d2-icon-chiclet-close": "onRemoveFilter",
      keydown: "onKeyInView"
    },
    constructor: function FacetBarView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.allTopicsCollection = new Backbone.Collection(this._getAllTopics(this.collection.filters));
      this._showHideFilter();
      this.listenTo(this.collection, "reset", this._filtersUpdated, this);
      this.listenTo(this.collection, "change", this._filtersUpdated, this);
      this.onWinResize = _.bind(function() {
        this.render();
        this._filtersUpdated();
        if (base.isIE11()) {
          $(".csui-facet-table-container .csui-search-left-panel-content .csui-facetview").addClass("dragged");
        }
      }, this);
      $(window).on("resize.facetview", this.onWinResize);
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, retVal = true, $target = $(event.target);
      switch (keyCode) {
       case 46:
        if ($target.parent().hasClass("d2-facet-item")) {
          this._triggerRemoveFilter($target.find(".d2-icon-chiclet-close"));
          retVal = false;
        }
        break;

       case 13:
        if ($target.parent().hasClass("d2-facet-item")) {
          this._triggerRemoveFilter($target.find(".d2-icon-chiclet-close"));
          retVal = false;
        }
        if ($target.hasClass("d2-clear-all")) {
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
      this.visibleItemIndex = 0;
      this.facetBarItemsView = new FacetBarItemsView({
        collection: this.allTopicsCollection
      });
      this.listenTo(this.facetBarItemsView, "overflow", this._makeSlideable);
      this.listenTo(this.facetBarItemsView, "scrolled", this._updateFading);
      this.facetBarItemsRegion.show(this.facetBarItemsView);
    },
    onMoveLeft: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.facetBarItemsView.scrollRight();
    },
    onMoveRight: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.facetBarItemsView.scrollLeft();
    },
    onClearAll: function() {
      this.trigger("remove:all");
    },
    onRemoveFilter: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this._triggerRemoveFilter($(e.target));
    },
    _makeSlideable: function(hasOverflow) {
      if (hasOverflow) {
        this.ui.facetListArea.addClass("d2-facet-list-overflowed");
        this.ui.movers.removeClass("binf-hidden");
      } else {
        this.ui.facetListArea.removeClass("d2-facet-list-overflowed");
        this.ui.movers.addClass("binf-hidden");
      }
    },
    _updateFading: function(options) {
      if (options.currentScrollLeft === 0) {
        this.ui.leftFader.addClass("binf-hidden");
        this.ui.rightFader.removeClass("binf-hidden");
      } else {
        if (options.currentScrollLeft === options.maxScrollLeft) {
          this.ui.leftFader.removeClass("binf-hidden");
          this.ui.rightFader.addClass("binf-hidden");
        } else {
          this.ui.leftFader.removeClass("binf-hidden");
          this.ui.rightFader.removeClass("binf-hidden");
        }
      }
    },
    _getAllTopics: function() {
      var allTopics = [];
      var filters = this.collection.filters;
      function getAncestorArray(topics, topicid, ancestors) {
        var ftopics = topics.filter(function(topic) {
          return topic.id === topicid;
        });
        if (ftopics[0]) {
          var pid = ftopics[0].get("parent-id");
          ancestors.push(ftopics[0].get("name"));
          if (pid) {
            getAncestorArray(topics, pid, ancestors);
          } else {
            return;
          }
        }
      }
      if (this.collection.length > 0) {
        for (var i = 0; i < filters.length; i++) {
          var filter = filters[i], values = filter.values, facetId = filter.id, facet = this.collection.get(facetId), facetName = facet.get("name");
          var topicMap = {};
          for (var j = 0; j < values.length; j++) {
            var value = values[j], topicId = value.id, topic = facet.topics.get(topicId);
            if (topic) {
              var topicName = topic.get("name");
              var parentId = topic.get("parent-id");
              var ancestors = [];
              getAncestorArray(facet.topics.models, topicId, ancestors);
              var ancestorsStr = ancestors.reverse().join(" > ");
              var childlist = topicMap[parentId];
              var child = {
                topicId: topicId,
                topicName: topicName,
                topicParent: parentId,
                topicTitle: ancestorsStr,
                topicValue: value.facetvalue,
                topicLabel: topic.get("label")
              };
              if (facet.get("facet-bar-item-view") === "date_bar_item_view") {
                child.topicValue = dateUtils.formatExactDate(child.topicValue);
              }
              if (!childlist) {
                topicMap[parentId] = [ child ];
              } else {
                childlist.push(child);
              }
            }
          }
          var keys = Object.keys(topicMap);
          for (var k in topicMap) {
            if (Object.prototype.hasOwnProperty.call(topicMap, k)) {
              var children = topicMap[k], modifiedChildren = [], uniqueids = "", barItemView = undefined;
              _.each(children, function(topic) {
                if (keys.indexOf(topic.topicId) === -1 || utils.isMobile()) {
                  modifiedChildren.push(topic);
                  uniqueids += topic.topicId + "~";
                }
              });
              uniqueids = uniqueids.substring(0, uniqueids.length - 1);
              topicMap[k] = modifiedChildren;
              var topicnames = _.pluck(modifiedChildren, "topicName");
              if (topicMap[k].length > 0) {
                if (facet.get("facet-bar-item-view") === "date_bar_item_view") {
                  barItemView = FacetBarDateItemView;
                }
                allTopics.push({
                  id: facetId + "~" + uniqueids,
                  facetName: topicMap[k][0].topicLabel || facetName,
                  facetId: facetId,
                  topics: topicMap[k],
                  facetBarItemView: barItemView,
                  facetItemAria: _.str.sformat(lang.facetItemAria, facetName, topicnames.join())
                });
              }
            }
          }
        }
      }
      return allTopics;
    },
    _filtersUpdated: function() {
      this.allTopicsCollection.reset(this._getAllTopics(this.collection.filters));
      this._showHideFilter();
    },
    _showHideFilter: function() {
      if (this.allTopicsCollection.length > 0) {
        this.$el.removeClass("d2-facet-bar-hidden");
        setTimeout(function() {
          $(".d2-facet-bar .d2-clear-all").removeClass("binf-hidden");
        }, 0);
        this.trigger("facet:bar:visible");
      } else {
        this.$el.addClass("d2-facet-bar-hidden");
        setTimeout(function() {
          $(".d2-facet-bar .d2-clear-all").addClass("binf-hidden");
        }, 0);
        this.trigger("facet:bar:hidden");
      }
    },
    templateHelpers: function() {
      return {
        clearAll: lang.clearAll,
        previous: lang.previous,
        next: lang.next,
        clearAllAria: lang.clearAllAria
      };
    },
    _triggerRemoveFilter: function($target) {
      this.trigger("remove:filter", {
        id: $target.attr("data-d2-facet"),
        values: [ {
          id: $target.attr("data-d2-topic")
        } ]
      });
    }
  });
  return FacetBarView;
});