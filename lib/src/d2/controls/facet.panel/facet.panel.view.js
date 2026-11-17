/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/facets", "csui/lib/jquery.ui/js/jquery-ui", "csui/controls/list/simplelist.view", "csui/controls/progressblocker/blocker", "csui/behaviors/collection.state/collection.state.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/utils/event.utils", "d2/utils/facet.utils", "dctmw/utils/utils", "d2/controls/facet.panel/impl/facet/facet.view", "d2/controls/facet.panel/impl/facet.panel.key.navigation", "hbs!d2/controls/facet.panel/impl/facet.panel", "i18n!d2/controls/facet.panel/impl/nls/lang", "css!d2/controls/facet.panel/impl/facet.panel" ], function(i18n, _, $, FacetCollection, jqueryui, SimpleListView, BlockingView, CollectionStateBehavior, TabableRegionBehavior, eventUtils, facetUtils, utils, FacetView, KeyEventNavigation, template, lang) {
  "use strict";
  var FacetPanelView = SimpleListView.extend({
    template: template,
    className: "cs-simplelist csui-facet-panel",
    behaviors: {
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        stateMessages: function() {
          return {
            loading: lang.loadingFacetMessage,
            failed: lang.failedFacetMessage
          };
        }
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      serverFilterMessage: ".d2-facet-serverfilter",
      noResultsPanel: ".d2-facet-noresults-panel"
    },
    childView: FacetView,
    childEvents: {
      "apply:filter": "applyFilter",
      "apply:d2:filter": "applyD2Filter",
      "remove:filter": "removeFilter",
      "activate:facet": "setActiveFacet",
      "facet:size:change": "_updateScrollbar",
      "escape:focus": "resetFacetFocus",
      "update:last:selected": "updateLastSelected"
    },
    events: {
      keydown: "onKeyInView"
    },
    templateHelpers: function() {
      var showTitle = this.options.data.showTitle;
      var title = this.options.data.title;
      return {
        show_input: true,
        showTitle: showTitle,
        title: title,
        noResultsFound: lang.emptyFacetMessage
      };
    },
    onAddChild: function(childView) {
      var $child = childView.$el, self = this;
      if (childView.getIndex() === this.collection.length - 1) {
        $child.css("border-bottom", "0px");
      }
      $child.on("focus", function() {
        self.onSetNextChildFocus(childView);
      });
    },
    updateLastSelected: function(childView, id) {
      this.lastSelectedItem = childView.model.get("id") + "_" + id.replace(/ /g, "_").toLowerCase();
    },
    constructor: function FacetPanelView(options) {
      this.facets = options.collection;
      options.collection = this._getAvailableFacets();
      SimpleListView.prototype.constructor.apply(this, arguments);
      this.addedFilters = {};
      this.removedFilters = [];
      this.addedD2FilterConfig = {};
      this.lastSelectedItem = "";
      this.options.data.title = lang.facetsTitle;
      this.options.data.showTitle = this.options.showTitle === undefined ? true : this.options.showTitle;
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue({
          parent: this,
          local: this.options.blockingLocal
        });
      }
      this.collpasedFacets = [];
      this.listenTo(this.collection, "change:collapsed", this._registerCollapsedFacets);
      this.reset = false;
    },
    _registerCollapsedFacets: function(model) {
      if (model.get("collapsed")) {
        this.collpasedFacets.push(model.get("id"));
      } else {
        var index = this.collpasedFacets.indexOf(model.get("id"));
        if (index > -1) {
          this.collpasedFacets.splice(index, 1);
        }
      }
    },
    onShow: function() {
      var facetDragHandler, $leftPanel = $(".csui-search-left-panel"), $d2TableTaskView = this.options.originatingView && this.options.originatingView.$el.find(".csui-table-facetview");
      if ($leftPanel.length > 0) {
        facetDragHandler = ".csui-search-left-panel .ui-resizable-handle";
        $leftPanel.resizable({
          alsoResize: "#facetview",
          handles: i18n && i18n.settings.rtl ? "w" : "e",
          maxWidth: 400,
          minWidth: 208,
          stop: function() {
            $(this).css("height", "");
            $("#facetview").css("height", "");
          }
        });
      } else if ($d2TableTaskView.length > 0 && !$d2TableTaskView.hasClass("ui-resizable-handle")) {
        facetDragHandler = ".csui-table-facetview .ui-resizable-handle";
        $d2TableTaskView.resizable({
          alsoResize: ".csui-facet-panel",
          handles: i18n && i18n.settings.rtl ? "w" : "e",
          maxWidth: 400,
          minWidth: 208,
          stop: function() {
            $(this).css("height", "");
            $(".csui-facet-panel").css("height", "");
          }
        });
      }
      eventUtils.enableTouchEventsByClass(facetDragHandler);
    },
    _getAvailableFacets: function() {
      var availableFacets = this.facets.getAvailableFacets();
      this.listenTo(this.facets, "reset", function() {
        this.reset = true;
        var availableFacets = this.facets.getAvailableFacets();
        this._setCollapsedState(availableFacets);
        this.collection.reset(availableFacets);
        if (!availableFacets || !availableFacets.length) {
          this.ui.noResultsPanel.removeClass("binf-hidden");
        } else {
          this.ui.noResultsPanel.addClass("binf-hidden");
        }
        if (this.facets.hasMoreRecords) {
          this.ui.serverFilterMessage.find(".d2-facet-serverfilter-message").text(_.str.sformat(lang.serverSideFilteringMessage, this.facets.serverLimit));
          this.ui.serverFilterMessage.removeClass("binf-hidden");
        } else {
          this.ui.serverFilterMessage.addClass("binf-hidden");
        }
      });
      return new FacetCollection(availableFacets);
    },
    _setCollapsedState: function(availableFacets) {
      availableFacets.forEach(function(facet) {
        facet.collapsed = _.contains(this.collpasedFacets, facet.id);
      }, this);
    },
    isTabable: function() {
      return !(this.$el.parent().hasClass("binf-hidden") || this.$el.parent().hasClass("csui-facetview-hidden"));
    },
    onRenderCollection: function() {
      this.trigger("refresh:tabindexes");
      if (this.lastSelectedItem) {
        var lastSelectedTopic = $('input[itemid="' + facetUtils.escape(this.lastSelectedItem) + '"]');
        lastSelectedTopic.closest(".d2-facet").trigger("focus");
      }
      this.ui.noResultsPanel.addClass("binf-hidden");
    },
    applyFilter: function(facet) {
      var id = facet.newFilter.id;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.addedFilters[id] = facet.newFilter;
      var addedValues = facet.newFilter.values;
      if (this.removedFilters[id]) {
        var removedValues = this.removedFilters[id].values;
        var modifiedRemovedValues = _.reject(removedValues, function(data) {
          return !!_.find(addedValues, {
            id: data.id
          });
        });
        this.removedFilters[id] = {
          id: id,
          values: modifiedRemovedValues
        };
      }
      this.startTimer(this.triggerModify);
    },
    applyD2Filter: function(filter) {
      var id = filter.newFilter.id;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.addedD2FilterConfig[id] = filter.newFilter;
      this._clearFacets();
      this.triggerD2FilterModify();
    },
    _clearFacets: function() {
      this.facets.filters = [];
      var filtersArr = this.facets.models.filter(model => {
        return model.get("id") === "filter";
      });
      this.facets.reset(filtersArr);
    },
    triggerD2FilterModify: function() {
      var addfilterArr = [];
      if (this.addedD2FilterConfig["filter"]) {
        addfilterArr.push(this.addedD2FilterConfig["filter"]["values"][0]);
      }
      if (addfilterArr.length) {
        this.trigger("modify:d2:filters", addfilterArr);
      }
    },
    removeFilter: function(facet) {
      var id = facet.newFilter.id;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      var shouldPopulateRemoveFilters = false;
      var removedValues = facet.newFilter.values;
      if (this.addedFilters[id]) {
        var addedValues = this.addedFilters[id].values;
        var modifiedaddedValues = _.reject(addedValues, function(data) {
          return !!_.find(removedValues, {
            id: data.id
          });
        });
        if (addedValues.length === modifiedaddedValues.length) {
          shouldPopulateRemoveFilters = true;
        } else {
          this.addedFilters[id] = {
            id: id,
            values: modifiedaddedValues
          };
        }
      } else {
        shouldPopulateRemoveFilters = true;
      }
      if (shouldPopulateRemoveFilters) {
        if (this.removedFilters[id]) {
          this.removedFilters[id].values = this.removedFilters[id].values.concat(removedValues);
        } else {
          this.removedFilters[id] = facet.newFilter;
        }
      }
      this.startTimer(this.triggerModify);
    },
    startTimer: function(triggerFunction) {
      var fn = triggerFunction.bind(this);
      this.timeout = setTimeout(fn, 1e3);
    },
    triggerModify: function() {
      var removedfilterArr = [];
      var addfilterArr = [];
      for (var key in this.removedFilters) {
        if (Object.prototype.hasOwnProperty.call(this.removedFilters, key)) {
          removedfilterArr.push(this.removedFilters[key]);
        }
      }
      for (key in this.addedFilters) {
        if (Object.prototype.hasOwnProperty.call(this.addedFilters, key)) {
          addfilterArr.push(this.addedFilters[key]);
        }
      }
      if (addfilterArr.length || removedfilterArr.length) {
        this.trigger("modify:filters", addfilterArr, removedfilterArr);
      }
      this.addedFilters = [];
      this.removedFilters = [];
      clearInterval(this.interval);
    },
    _updateScrollbar: function() {
      this.triggerMethod("update:scrollbar", this);
    }
  });
  _.extend(FacetPanelView.prototype, KeyEventNavigation);
  return FacetPanelView;
});