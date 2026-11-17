/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "smart/controls/node.picker/impl/select.views/select.views", "smart/controls/node.picker/impl/start.location.selector/start.location.selector.view", "smart/controls/node.picker/impl/toggler.button/toggler.button.view", "smart/controls/breadcrumbs/breadcrumbs.view", "hbs!smart/controls/node.picker/impl/node.picker", "i18n!smart/controls/node.picker/impl/nls/lang", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/controls/node.picker/impl/search.list/header/search.result.header.view" ], function($, _, Marionette, SelectViews, StartLocationCollectionView, TogglerButtonView, BreadcrumbsView, template, lang, LayoutViewEventsPropagationMixin, SearchResultsHeaderView) {
  var NodePicker = Marionette.LayoutView.extend({
    template: template,
    className: "csui-node-picker",
    regions: {
      startLocations: ".smart-start-locations ",
      breadcrumbRegion: "#csui-np-breadcrumbs > div.breadcrumb-inner",
      searchHeaderRegion: "#csui-np-breadcrumbs > div.searchheader-inner",
      selectViewRegion: "#csui-np-selectviews",
      selectedCountRegion: ".csui-selected-count-parent",
      togglerButtonRegion: ".smart-view-toggler"
    },
    ui: {
      breadcrumb: "#csui-np-breadcrumbs",
      breadcrumbContent: ".breadcrumb-inner",
      searchHeaderContent: ".searchheader-inner",
      selectViews: "#csui-np-selectviews",
      viewToggler: ".smart-view-toggler",
      nodePickerAnnouncementEle: ".smart-np-anouncement-text"
    },
    templateHelpers: function() {
      var options = this.options;
      return {
        breadcrumbAria: lang.breadcrumbAria,
        locationSelector: options.locationSelector,
        showLocationBar: options.showBreadCrumbs || options.locationSelector || options.searchView || options.enableGrid,
        togglerAria: lang.switchToThumbnailAria,
        togglerTitle: lang.switchToThumbnailTitle
      };
    },
    constructor: function NodePicker(options = {}) {
      this.options = options;
      this.options.nodePickerView = this;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      var showBreadCrumbs = this.options.showBreadCrumbs ?? true;
      this.setViews(options);
      showBreadCrumbs && this.setBreadcrumbs(options);
      if (options.searchView) {
        this.updatedBreadcrumbId = options.locationID;
        this.setSearchResultsHeader(options);
      }
      if (options.locationSelector) {
        this.startLocationView = new StartLocationCollectionView({
          collection: this.options.locations,
          title: this.options.dialogTitle,
          selected: this.options.initialLocation
        });
      }
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
      this.listenTo(this.options?.masterView, "enable:grid", _.bind(this.initiateToggler, this));
      this.listenTo(this.options.masterView, "make:anouncement", this.makeAnnouncement);
    },
    makeAnnouncement: function({
      message = ""
    }) {
      this.ui.nodePickerAnnouncementEle[0].innerText = message;
    },
    showStartLocations: function() {
      this.startLocationView && this.startLocationView.$el.removeClass("binf-hidden");
    },
    hideStartLocations: function() {
      this.startLocationView && this.startLocationView.$el.addClass("binf-hidden");
    },
    windowRefresh: function() {
      var breadCrumb = $(".cs-breadcrumb"), breadCrumbHeight = breadCrumb.is(":visible") ? breadCrumb.height() : 0, viewHeight = this.$el.height() - breadCrumbHeight;
      if (!!window.chrome && viewHeight > 0) {
        this.selectViews.$el.css("height", viewHeight + "px");
      }
      this.selectViews.triggerMethod("dom:refresh", this.selectViews);
      if (this.breadcrumbs) {
        this.breadcrumbs.refresh();
      }
    },
    onDestroy: function() {
      this.stopListening(this.options.masterView, "make:anouncement");
      $(window).off("resize.app", this.onWinRefresh);
    },
    onRender: function() {
      let self = this;
      if (this.startLocationView) {
        this.startLocations.show(this.startLocationView);
        this._enableGrid(this?.options?.enableGrid ?? false);
        this.listenTo(this, "before:destoy", function() {
          self.startLocationView.trigger("destroy");
        });
      }
      if (this.options.searchView) {
        this.searchHeaderRegion.show(this.searchHeaderView);
        this.ui.breadcrumbContent[0]?.classList?.add("binf-hidden");
        this._enableGrid(false);
        this.listenTo(this, "before:destoy", function() {
          self.searchHeaderView.trigger("destroy");
        });
      }
      if (this.breadcrumbs && !this.options.searchView) {
        this.breadcrumbRegion.show(this.breadcrumbs);
        this.ui.breadcrumbContent[0]?.classList?.remove("binf-hidden");
        this.ui.searchHeaderContent[0]?.classList?.add("binf-hidden");
        this.listenTo(this, "before:destoy", function() {
          self.breadcrumbs.trigger("destroy");
        });
      }
      this.selectViews.options.navigateFromHistory = this.options.navigateFromHistory;
      this.selectViewRegion.show(this.selectViews);
      this.initiateToggler(this.options?.enableGrid);
    },
    initiateToggler: function(enable) {
      this.options.enableGrid = enable;
      if (this.options?.enableGrid && this.options?.masterView?.enableGridFeature) {
        this.ui?.viewToggler?.removeClass("binf-hidden");
        this.togglerButtonView = new TogglerButtonView(this.options);
        this.togglerButtonRegion?.show(this?.togglerButtonView);
        this.listenTo(this, "before:destoy", function() {
          this?.togglerButtonView?.trigger("destroy");
        });
      } else {
        this.ui?.viewToggler?.addClass("binf-hidden");
      }
    },
    _enableGrid: function(enable = false) {
      this.ui.viewToggler[enable ? "removeClass" : "addClass"]("binf-hidden");
    },
    onDomRefresh: function() {
      if (this.startLocationView) {
        this.startLocationView.trigger("dom:refresh");
      }
      this.windowRefresh();
    },
    hideStartLocationLabel: function(node) {
      this.startLocationView?.hideDropDownLabel(node, this.options);
    },
    reset: function() {
      this.startLocationView.reset();
    },
    onShow: function() {
      _.each(this.regionManager.regions, function(region) {
        if (region.currentView) {
          region.currentView.trigger("show");
        }
      });
      if (!this.options.container && !this.options.searchView) {
        if (!this.options.commandType.multiSelect) {
          this.ui.selectViews.addClass("csui-full-height");
        } else {
          this.ui.searchHeaderContent[0]?.classList?.add("binf-hidden");
        }
      }
    },
    onClickBackFromSearchToNode: function() {
      this.options?.masterView.trigger("change:location:properties", this.options?.initLocation);
      this.el.querySelector(".searchheader-inner").classList.add("binf-hidden");
    },
    setViews: function(options) {
      var views = this.selectViews = new SelectViews(options);
      let self = this;
      this.listenTo(this.options?.masterView, "changed", this.updateBreadcrumbs);
      this.listenTo(views, "update:searchHeader", this.updateSearchResultHeader);
      this.listenTo(views, "search:tonode", this.onClickBackFromSearchToNode);
      this.listenTo(views, "close", this.close);
      this.listenTo(views, "toggle:breadcrumbs", this.updateBreadcrumbs);
      this.listenTo(this.options?.masterView, "save:form", function(node) {
        this.trigger("save:form", node);
      });
      this.listenTo(this, "before:destoy", function() {
        self.selectViews.trigger("destroy");
      });
    },
    getSelection: function() {
      return this.options.commandType.multiSelect ? _.values(this.options.selectedCountList) : _.values(this.selectViews.getSelection());
    },
    getNumberOfSelectItems: function() {
      return this.options.commandType.multiSelect ? _.size(this.options.selectedCountList) : this.selectViews.getNumberOfSelectItems();
    },
    close: function() {
      this.trigger("close");
    },
    updateBreadcrumbs: function({
      browsedModelId
    }) {
      var ancestors;
      this.updatedBreadcrumbId = undefined;
      if (this.breadcrumbNode) {
        this.breadcrumbNode.set("id", browsedModelId);
      } else if (browsedModelId) {
        var self = this;
        this.getAncestors(browsedModelId).fetch();
      }
      this.listenTo(this.breadcrumbs, "after:synchronized", this.onAfterBreadcrumbsSynchronized);
      return true;
    },
    onAfterShow: function() {
      this.options?.addEventHandlers(this);
    },
    getAncestors: function(nodeId) {
      var newAncestors = this.options.getAncestorsCollection(nodeId);
      this.breadcrumbs = new BreadcrumbsView({
        node: newAncestors.node,
        collection: newAncestors.ancestorColl,
        ...this.options?.breadcrumb
      });
      this.breadcrumbs.synchronizeCollections();
      this.breadcrumbs.listenTo(this.breadcrumbs, "childview:click:ancestor", this.options.onClickAncestor);
      if (!this.breadcrumbNode) {
        this.breadcrumbNode = newAncestors.node;
      }
      return newAncestors.ancestorColl;
    },
    setBreadcrumbs: function(options) {
      var container = options.container || options.initialContainer, id = container ? container.get("id") : 0;
      if (!id || id === 0) {
        this.getAncestors(0);
        this.setBreadcrumbEvents();
        return;
      }
      if (options.container) {
        var self = this;
        this.getAncestors(id).fetch();
      } else {
        this.getAncestors(0);
        this.setBreadcrumbEvents();
      }
      this.setBreadcrumbEvents();
      return true;
    },
    showBackButton: function() {
      this.selectViews.showBackButton();
    },
    setBreadcrumbEvents: function() {
      this.listenTo(this.breadcrumbs, "before:defaultAction", function(args) {
        var selectViews = this.selectViews, self = this;
        selectViews.newLeftView(args.node, undefined, true).done(function(view) {
          selectViews.setParentNodeAsTarget(view.container);
          self.options?.masterView?.trigger("change:complete", view.container);
        });
      });
      this.listenTo(this.breadcrumbs, "after:synchronized", this.onAfterBreadcrumbsSynchronized);
    },
    onAfterBreadcrumbsSynchronized: function() {
      if (this.isRendered && this.ui.breadcrumb.hasClass("cs-breadcrumb")) {
        if (this.options.searchView) {
          const locationGroupEl = this.selectViews?.leftView?.headerView?.el?.querySelector(".csui-search-item-right-panel");
          if (!this.breadcrumbs?.isRendered && (locationGroupEl?.classList?.contains("binf-hidden") || this.selectViews?.rightView)) {
            this.breadcrumbRegion.show(this.breadcrumbs);
          }
          if (locationGroupEl?.classList?.contains("binf-hidden") || this.selectViews?.rightView) {
            this.ui.searchHeaderContent[0]?.classList?.add("binf-hidden");
          }
        }
        this.ui.breadcrumb[0]?.classList?.remove("binf-hidden");
        if (this.ui.breadcrumbContent[0].childNodes.length > 0) {
          this.ui.breadcrumbContent[0]?.classList?.remove("binf-hidden");
        }
        this.ui.selectViews.removeClass("csui-full-height");
        if (this.breadcrumbs.collection.length === 1) {
          this.options.targetBrowseHistory = [];
        }
        this.windowRefresh();
      }
    },
    setSearchResultsHeader: function(options) {
      this.searchHeaderView = new SearchResultsHeaderView({
        collection: this.collection,
        searchTitleName: options?.searchTitleName,
        masterView: this.options.masterView
      });
      this.options.masterView.searchHeaderView = this.searchHeaderView;
      return true;
    },
    updateSearchResultHeader: function() {
      if (this.options.searchView) {
        if (!this.options.container) {
          this.ui.searchHeaderContent.addClass("csui-non-container-padding");
        } else {
          this.ui.searchHeaderContent.removeClass("csui-non-container-padding");
        }
        this.ui.breadcrumbContent[0]?.classList?.add("binf-hidden");
        this.ui.searchHeaderContent[0]?.classList?.remove("binf-hidden");
        if (this.options?.masterView?.isKeyEvent) {
          this.el?.querySelector(".csui-item-standard.binf-list-group-item")?.focus();
        }
      }
    }
  });
  _.extend(NodePicker.prototype, LayoutViewEventsPropagationMixin);
  return NodePicker;
});