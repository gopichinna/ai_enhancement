/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/log", "nuc/utils/base", "nuc/models/node/node.model", "nuc/models/nodechildren", "csui/utils/contexts/factories/ancestors", "nuc/models/nodeancestors", "d2/dialogs/target.browse/impl/select.views/select.views", "hbs!d2/dialogs/target.browse/impl/target.browse", "i18n!d2/dialogs/target.browse/impl/nls/lang", "csui/controls/breadcrumbs/breadcrumbs.view", "d2/utils/constants", "csui/controls/selected.count/selected.count.view", "d2/dialogs/target.browse/impl/search.list/header/search.result.header.view", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/utils/node.utils", "d2/utils/contexts/factories/node.navigation", "css!d2/dialogs/target.browse/impl/target.browse" ], function(module, $, _, Marionette, log, base, NodeModel, NodeChildrenCollection, AncestorCollectionFactory, NodeAncestorCollection, SelectViews, template, lang, BreadcrumbsView, constants, SelectedCountView, SearchResultsHeaderView, LayoutViewEventsPropagationMixin, nodeUtils, NodeNavigationFactory) {
  var NodePicker = Marionette.LayoutView.extend({
    template: template,
    className: "d2-node-picker",
    regions: {
      breadcrumbRegion: "#csui-np-breadcrumbs > div.tb-breadcrumb-inner",
      searchHeaderRegion: "#csui-np-breadcrumbs > div.searchheader-inner",
      selectViewRegion: "#csui-np-selectviews",
      selectedCountRegion: ".csui-selected-count-parent"
    },
    ui: {
      breadcrumb: "#csui-np-breadcrumbs",
      breadcrumbContent: ".tb-breadcrumb-inner",
      searchHeaderContent: ".searchheader-inner",
      selectViews: "#csui-np-selectviews"
    },
    events: {},
    templateHelpers: function() {
      return {
        breadcrumbAria: lang.breadcrumbAria,
        nodePickerChoices: lang.nodePickerChoices
      };
    },
    constructor: function NodePicker(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      if (!options.favoritesView && !options.searchView && !options.relatedFilesView && !options.workflowTemplatesView) {
        this.setBreadcrumbs(options);
      }
      this.setViews(options);
      this.$el.on("click." + this.cid + " keydown." + this.cid, this, this._onClick);
      if (options.searchView || options.favoritesView || options.relatedFilesView || options.workflowTemplatesView) {
        this.updatedBreadcrumbId = options.locationID;
        this.setSearchResultsHeader(options);
      }
      this.propagateEventsToRegions();
      if (this.options.selectMultiple) {
        this._selectedCountView = new SelectedCountView({
          collection: this.selectViews.getAllSelectedNodes(),
          showOnlyOnSelection: true
        });
      }
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
    },
    windowRefresh: function() {
      if (this.breadcrumbs) {
        this.breadcrumbs.refresh();
      }
      this.selectViews.triggerMethod("dom:refresh", this.selectViews);
    },
    onBeforeDestroy: function() {},
    onDestroy: function() {
      $(window).off("resize.app", this.onWinRefresh);
    },
    onRender: function() {
      if (this.options.searchView || this.options.favoritesView || this.options.relatedFilesView || this.options.workflowTemplatesView) {
        this.searchHeaderRegion.show(this.searchHeaderView);
      }
      if (this.breadcrumbs) {
        this.breadcrumbRegion.show(this.breadcrumbs);
      }
      this.selectViews.options.navigateFromHistory = this.options.navigateFromHistory;
      this.selectViewRegion.show(this.selectViews);
      if (this.options.selectMultiple) {
        this.selectedCountRegion.show(this._selectedCountView);
      }
    },
    onDomRefresh: function() {
      this.windowRefresh();
    },
    onShow: function() {
      _.each(this.regionManager.regions, function(region) {
        if (region.currentView) {
          region.currentView.trigger("show");
        }
      });
      if (!this.options.container && !this.options.searchView) {
        this.ui.breadcrumb.hide();
        this.ui.selectViews.addClass("csui-full-height");
      }
    },
    setViews: function(options) {
      var views = this.selectViews = this.getSelectViewInstance(options);
      this.listenTo(views, "changed", this.updateBreadcrumbs);
      this.listenTo(this.collection, "reset", this.collectionChange);
      this.listenTo(views.getAllSelectedNodes(), "reset", this._handleSelectionChange);
      this.listenTo(views.getAllSelectedNodes(), "update", this._handleSelectionChange);
      this.listenTo(views, "update:searchHeader", this.updateSearchResultHeader);
      this.listenTo(views, "sync:perspective", _.bind(this.trigger, this, "sync:perspective"));
      this.listenTo(views, "change:localScope", _.bind(this.trigger, this, "change:localScope"));
      this.listenTo(views, "change:complete", _.bind(this.trigger, this, "change:complete"));
      this.listenTo(views, "click:location", _.bind(this.trigger, this, "open:location"));
      this.listenTo(views, "hide:dropdownAndClearText", _.bind(this.trigger, this, "hide:dropdownAndClearText"));
      this.listenTo(views, "collection:updated", _.bind(this.trigger, this, "collection:updated"));
      this.listenTo(views, "close", this.close).listenTo(views, "toggle:breadcrumbs", this.updateBreadcrumbs);
    },
    getSelectViewInstance: function(options) {
      return new SelectViews(options);
    },
    getSelection: function() {
      return this.selectViews.getSelection() && this.selectViews.getSelection().models;
    },
    getNumberOfSelectItems: function() {
      return this.selectViews.getNumberOfSelectItems();
    },
    close: function() {
      this.destroy();
      this.trigger("close");
    },
    _onClick: function(event) {
      var that = event.data;
      that.trigger("hide:dropdown");
    },
    updateBreadcrumbs: function(objId, objName, objType, cabinetId) {
      this.updatedBreadcrumbId = undefined;
      if (objId === "repository") {
        var nodeNavigationCollection = this.options.connector.context && this.options.connector.context.getCollection(NodeNavigationFactory);
        nodeNavigationCollection.reset([]);
      }
      if (this.breadcrumbNode) {
        this.breadcrumbNode.set("id", objId);
        this.breadcrumbNode.set("name", objName);
        if (objType === constants.Types.CABINET) {
          this.breadcrumbNode.set("type", objType);
        }
        if (objId !== nodeUtils.getHomeCabinetId()) {
          this.breadcrumbNode.set("_is_home_cabinet", false);
        }
        this.breadcrumbNode.set("i_cabinet_id", cabinetId);
      }
      if (!this.selectViews.options.searchView && this.selectViews.options.exitingFromSearch) {
        this.ui.searchHeaderContent.hide();
        this.onRender();
      }
      return true;
    },
    getAncestors: function(nodeId, nodeName, nodeType, nodeCabinetId) {
      var node = new NodeModel({
        id: nodeId,
        name: nodeName,
        type: nodeType,
        i_cabinet_id: nodeCabinetId
      }, {
        connector: this.options.connector
      }), ancestorOptions = {
        node: node,
        autofetch: true,
        isTargetBrowse: true
      }, newAncestors = new NodeAncestorCollection(undefined, ancestorOptions);
      if (nodeId === constants.NodeId.REPOSITORY) {
        newAncestors = new NodeAncestorCollection(node, ancestorOptions);
      }
      node["_is_target_browse"] = true;
      this.breadcrumbs = new BreadcrumbsView({
        node: node,
        collection: newAncestors,
        context: this.options.connector.context
      });
      this.breadcrumbs.synchronizeCollections();
      if (!this.breadcrumbNode) {
        this.breadcrumbNode = node;
      }
      return newAncestors;
    },
    setBreadcrumbs: function(options) {
      var container = options.container || options.initialContainer, id = container ? container.get("id") : 0, name = container ? container.get("name") : 0, type = container ? container.get("type") : 0, cabinetId = container ? container.get("i_cabinet_id") : 0;
      if (!id || id === 0) {
        this.getAncestors(id, name, type, cabinetId);
        this.setBreadcrumbEvents();
        return;
      }
      if (options.container) {
        this.getAncestors(id, name, type, cabinetId).fetch();
      } else {
        this.getAncestors(id, name, type, cabinetId);
      }
      if (options.ancestors) {
        this.resetBreadCrumbs(options.ancestors);
      }
      this.listenTo(this.breadcrumbs, "after:synchronized", this.onAfterBreadcrumbsSynchronized);
      this.setBreadcrumbEvents();
      return true;
    },
    setBreadcrumbEvents: function() {
      this.listenTo(this.breadcrumbs, "before:defaultAction", function(args) {
        var selectViews = this.selectViews;
        selectViews.changeLocation(args.node);
      });
    },
    onAfterBreadcrumbsSynchronized: function() {
      if (this.ui.breadcrumb.show) {
        this.ui.breadcrumb.show();
        if (this.breadcrumbs.collection.length === 1) {
          this.options.targetBrowseHistory = [];
        }
        this.windowRefresh();
      }
    },
    setSearchResultsHeader: function() {
      this.searchHeaderView = new SearchResultsHeaderView({
        collection: this.collection
      });
      return true;
    },
    collectionChange: function() {
      this.trigger("collection:updated", this.collection);
    },
    _handleSelectionChange: function(currentModels) {
      this.trigger("change:complete", currentModels);
    },
    updateSearchResultHeader: function() {
      if (this.options.searchView) {
        if (!this.options.container) {
          this.ui.searchHeaderContent.addClass("csui-non-container-padding");
        } else {
          this.ui.searchHeaderContent.removeClass("csui-non-container-padding");
        }
        this.ui.breadcrumbContent.hide();
        this.ui.searchHeaderContent.show();
        this.searchHeaderView.render();
      }
    },
    resetBreadCrumbs: function(ancestors) {
      this.breadcrumbs.collection.reset(ancestors);
    }
  });
  _.extend(NodePicker.prototype, LayoutViewEventsPropagationMixin);
  return NodePicker;
});