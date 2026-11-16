/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "module", "smart/controls/facet.panel/impl/facet/facet.card.view", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/facet.panel/impl/facet.panel.key.navigation", "smart/controls/progressblocker/blocker", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "hbs!smart/controls/facet.panel/impl/facet.panel", "i18n!smart/controls/facet.panel/impl/nls/lang", "css!smart/controls/facet.panel/impl/facet.panel" ], function(_, $, Marionette, module, FacetCardView, TabableRegionBehavior, KeyEventNavigation, BlockingView, ViewEventsPropagationMixin, template, lang) {
  "use strict";
  var config = module.config() || {};
  var FacetPanelView = Marionette.CompositeView.extend({
    template: template,
    className: "smart-facet-panel csui-normal-scrolling",
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    childView: FacetCardView,
    childViewContainer: ".cs-list-group",
    childViewOptions: function() {
      return {
        blockingParentView: this.options.blockingParentView,
        context: this.options.context,
        facetOptions: this.options,
        parentView: this
      };
    },
    childEvents: {
      "apply:filter": "applyFilter",
      "remove:filter": "removeFilter",
      "activate:facet": "setActiveFacet",
      "escape:focus": "resetFacetFocus",
      "fetch:more:facets": "fetchFacets"
    },
    events: {
      keydown: "onKeyInView",
      "click .smart-all-facet-toggler": "_onExpandAllBtnClick"
    },
    ui: {
      listPanel: ".smart-facet-list-panel",
      noResultsPanel: ".smart-facet-noresults-panel",
      loadingPanel: ".smart-facet-loading-panel"
    },
    templateHelpers: function() {
      var showTitle = this.options.data.showTitle;
      var title = this.options.data.title;
      var regionAria = this.options.data.regionAria;
      var showAllAria = this.options.data.showAllAria;
      var hideAllAria = this.options.data.hideAllAria;
      return {
        showTitle: showTitle,
        title: title,
        regionAria: regionAria,
        showAllAria: showAllAria,
        hideAllAria: hideAllAria,
        noResultsFound: lang.emptyFacetMessage,
        loadingFacetMessage: lang.loadingFacetMessage
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
      this.propagateEventsToViews(childView);
    },
    constructor: function FacetPanelView(options) {
      options || (options = {});
      options.data || (options.data = {});
      this.originatingView = options.originatingView;
      this.showButtonsInEachFacet = config.showButtonsInEachFacet ?? options.showButtonsInEachFacet ?? true;
      this.maxFacetSelection = config.maxFacetSelection ?? options.maxFacetSelection ?? 5;
      options.showButtonsInEachFacet = this.showButtonsInEachFacet;
      options.maxFacetSelection = this.maxFacetSelection <= 0 ? 1 : this.maxFacetSelection;
      Marionette.CompositeView.call(this, options);
      this.options.data.title = options?.facetPanelTitle || lang.facetsTitle;
      this.options.data.regionAria = lang.facetsRegionAria;
      this.options.data.showAllAria = lang.showAllAria;
      this.options.data.hideAllAria = lang.hideAllAria;
      this.options.data.showTitle = this.options.showTitle === undefined ? true : this.options.showTitle;
      this._onRemoveKeyboardFocus = _.bind(this._removeKeyboardFocus, this);
      if (this.options.blockingParentView && !this.options.blockingLocal) {
        BlockingView.delegate(this, this.options.blockingParentView);
        this.listenTo(this.facets, "request", this._blockActions).listenTo(this.facets, "sync", this._unblockActions).listenTo(this.facets, "reset", this._unblockActions).listenTo(this.facets, "error", this._unblockActions);
      } else {
        BlockingView.imbue({
          parent: this,
          local: this.options.blockingLocal
        });
      }
      this.listenTo(this, "data:requested", this._blockActions);
      this.listenTo(this, "data:synced data:reset", this._unblockActions);
      this.listenTo(this, "data:error", this._unblockActionsWithError);
      this.listenTo(this.collection, "request", this._blockActions);
      this.listenTo(this.collection, "update reset sync", this._unblockActions);
      this.listenTo(this.collection, "error", this._unblockActionsWithError);
      this.expandAll = true;
      this.listenTo(this, "toggle:expand:all", this._toggleExpandAll);
    },
    _toggleExpandAll: function(event) {
      if (!this.expandAll) {
        this.el.querySelector(".smart-all-facet-open")?.classList.remove("binf-hidden");
        event && this.el.querySelector(".smart-all-facet-open")?.focus();
        this.el.querySelector(".smart-all-facet-close")?.classList.add("binf-hidden");
      } else {
        this.el.querySelector(".smart-all-facet-open")?.classList.add("binf-hidden");
        this.el.querySelector(".smart-all-facet-close")?.classList.remove("binf-hidden");
        event && this.el.querySelector(".smart-all-facet-close")?.focus();
      }
    },
    _onExpandAllBtnClick: function(event) {
      this.expandAll = !this.expandAll;
      this.trigger("toggle:expand:all", event);
    },
    _blockActions: function() {
      this.blockActions();
      this.ui.listPanel.addClass("binf-hidden");
      this.ui.noResultsPanel.addClass("binf-hidden");
      this.ui.loadingPanel.removeClass("binf-hidden");
    },
    _unblockActions: function() {
      if (this.facets.fetched === undefined && this.isRendered || this.facets.fetched) {
        this.unblockActions();
        this.ui.listPanel[this.collection.length > 0 ? "removeClass" : "addClass"]("binf-hidden");
        this.ui.noResultsPanel[this.collection.length === 0 ? "removeClass" : "addClass"]("binf-hidden");
        this.ui.loadingPanel.addClass("binf-hidden");
      }
    },
    _unblockActionsWithError: function() {
      this._unblockActions();
    },
    _toggleNoResultPanel: function() {
      if (this.collection?.length || this.collection?.error) {
        this.ui.noResultsPanel.addClass("binf-hidden");
      } else {
        this.ui.noResultsPanel.removeClass("binf-hidden");
      }
      this.ui.loadingPanel.addClass("binf-hidden");
    },
    isTabable: function() {
      return !(this.$el.parent().hasClass("binf-hidden") || this.$el.parent().hasClass("csui-facetview-hidden"));
    },
    onRenderCollection: function() {
      this.trigger("refresh:tabindexes");
      this._toggleNoResultPanel();
      this._toggleExpandAll();
    },
    onBeforeDestroy: function() {
      $(document).off("mousedown", this._onRemoveKeyboardFocus);
    },
    applyFilter: function(facet) {
      this.trigger("apply:filter", facet.newFilter);
    },
    removeFilter: function(facet) {
      this.trigger("remove:filter", facet.newFilter);
    },
    setActiveFacet: function(facet) {
      if (facet.selectItems.length > 0 && this.showButtonsInEachFacet) {
        this.children.each(function(view) {
          if (view.getIndex() !== facet.getIndex()) {
            view.$el.find(".csui-facet-content").addClass("facet-disabled");
            view.$el.find(".csui-facet-footer").addClass("facet-disabled");
          }
        });
      } else {
        this.$el.find(".csui-facet-content").removeClass("facet-disabled");
        this.$el.find(".csui-facet-footer").removeClass("facet-disabled");
      }
    },
    fetchFacets: function(childview) {
      this.trigger("fetch:more:facets", childview);
    }
  });
  _.extend(FacetPanelView.prototype, KeyEventNavigation);
  _.extend(FacetPanelView.prototype, ViewEventsPropagationMixin);
  return FacetPanelView;
});