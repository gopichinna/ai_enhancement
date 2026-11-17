/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commands", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "d2/widgets/widgettable/widgettable.view", "d2/utils/server.query.utils", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/models/d2collections/d2collections.items.collection", "d2/models/d2collections/d2.mycollections.model", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems.mask", "d2/widgets/d2collections.perspective/d2collections.list/d2collections.list.view", "i18n!d2/widgets/d2collections.perspective/impl/nls/lang", "d2/utils/constants", "dctmw/utils/utils", "i18n!csui/widgets/nodestable/impl/nls/lang", "hbs!d2/widgets/d2collections.perspective/impl/d2collections.perspective", "css!d2/widgets/d2collections.perspective/impl/d2collections.perspective" ], function($, _, commands, PubSub, BlockingView, NodesTableViewImpl, serverQueryUtils, RestResources, widgetConstants, D2CollectionItemsCollection, D2collectionModel, d2collectionsToolbaritems, d2collectionsToolbarMasks, D2CollectionsListsWrapperView, lang, constants, dctmUtils, nodestableLang, template) {
  "use strict";
  var _oldCompleteFilterCommand = NodesTableViewImpl.prototype._completeFilterCommand;
  var _oldAfterExecuteCommand = NodesTableViewImpl.prototype._afterExecuteCommand;
  var CollectionWidgetView = NodesTableViewImpl.extend({
    constructor: function CollectionWidgetView(options) {
      this.context = options.context;
      options = options || {};
      options.cssClass = "d2-widget-collectionwidget";
      options.isInCollectionPerspective = true;
      options.collectionClass = D2CollectionItemsCollection;
      this.templateHelpers = _.extend(this.templateHelpers || {}, {
        lang: lang
      });
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      options.toolbarItems = d2collectionsToolbaritems;
      options.toolbarItemsMasks = new d2collectionsToolbarMasks();
      options.headermenuItems = {
        headerMenuToolbar: d2collectionsToolbaritems.headerMenuToolbar
      };
      options.headermenuItemsMask = new d2collectionsToolbarMasks().toolbars.headerMenuToolbar;
      this.ui = _.extend(this.ui || {}, {
        createCollectionButton: ".create-collection-btn",
        tableContainer: ".csui-facet-table-container",
        emptyView: ".collections-empty-view"
      });
      this.regions = _.extend(this.regions || {}, {
        rgnPanelContainer: ".d2-widget-collectionwidget",
        listD2CollectionsPanel: ".d2-collections-wrapper",
        rgnCollectionItemsPanel: ".csui-outertablecontainer"
      });
      this.events = _.extend(this.events || {}, {
        "click .create-collection-btn": "onClickingCreateCollection"
      });
      CollectionWidgetView.__super__.constructor.call(this, options);
    },
    initialize: function() {
      CollectionWidgetView.__super__.initialize.apply(this, arguments);
      var resizeTimeout;
      var view = this;
      $(window).on("resize", function() {
        resizeTimeout = setTimeout(function() {
          view.addBtnToEmptyItemView();
          clearTimeout(resizeTimeout);
        }, 100);
      });
      this.listenTo(this.collection, "orderBy:change", function() {
        this.fetchCollections(this.selectedModel);
      });
      this.listenTo(this.collection, "sync", () => {
        this._setFilterDefaultValue();
        if (this.getPreference("isFacetOpen")) {
          this._setFilterActiveState(true);
        }
      });
      this.listenTo(this.tableView, "render", () => {
        this.addBtnToEmptyItemView();
      });
      this.listenTo(this.collection, "d2:clearSelection", function(args) {
        if (this.options.showSelectionCounter && this.allSelectedNodes) {
          var unselectedNodes = args.nodes;
          _.each(unselectedNodes, function(unselectedNode) {
            this.allSelectedNodes().remove(unselectedNode, {
              silent: true
            });
          }, this);
          this.allSelectedNodes().reset(_.clone(this.allSelectedNodes().models));
        }
        this.addBtnToEmptyItemView();
      });
      this.listenTo(PubSub, "d2:updateToolbar", function(model) {
        if (this.tableToolbarView.container.get("id") == model.get("id")) {
          this.tableToolbarView.container.set("isSharedCollection", model.get("isSharedCollection"));
        }
      });
      this.facetFilters = this.collection.nodeFacets;
    },
    template: template,
    onRender: function() {
      CollectionWidgetView.__super__.onRender.apply(this, arguments);
      this.renderD2CollectionListView();
    },
    renderD2CollectionListView() {
      this.d2CollectionsListsWrapperView = new D2CollectionsListsWrapperView({
        context: this.options.context,
        collection: this.options.mycollection,
        originatingView: this
      });
      this.listD2CollectionsPanel.show(this.d2CollectionsListsWrapperView);
      this.$el.find(".d2-collections-list-wrapper").addClass("d2-collections-wrapper-hidden");
    },
    className: function() {
      var superClassName = CollectionWidgetView.__super__.className, className = "";
      if (_.isFunction(superClassName)) {
        className += " " + superClassName.call(this);
      } else if (_.isString(superClassName)) {
        className += superClassName;
      }
      return className + " " + this.options.cssClass;
    },
    getTitle: function() {
      var widgetName = this.getViewStateWidgetName();
      var widgetConfig = widgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.COLLECTIONS, widgetName);
      return widgetConfig && widgetConfig.label_value || lang.defaultTitle;
    },
    fetchCollections: function(model) {
      if (this.collection.hasMoreRecords) {
        this.collection.fetch({
          reload: true,
          skipSWCache: true,
          filters: this.tableView.searchColumn,
          parentNode: model
        });
      }
    },
    getContainerNode: function() {
      return new D2collectionModel(_.extend({
        id: constants.WidgetId.COLLECTIONS,
        name: this.getTitle()
      }, this.getExtraIconConfig()), {
        connector: this.connector
      });
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.COLLECTIONS;
    },
    loadTableView: function(model) {
      this.allSelectedNodes().reset();
      this._updateTitleInHeader(model);
      this.tableView.options.inlineBar.options.container = model;
      this.context.viewStateModel.setDefaultViewState("collection-id", "");
      this.context.viewStateModel.setViewState("collection-id", model?.get("r_object_id"));
      if (this.context.viewStateModel.attributes.urlParams.indexOf("collection-id") === -1) {
        this.context.viewStateModel.attributes.urlParams.push("collection-id");
      }
      this.selectedModel = model;
      this.collection.resetLimit(false);
      this.collection.fetch({
        reload: true,
        skipSWCache: true,
        parentNode: model
      }).done(() => {
        this.context.viewStateModel.set(this.context.viewStateModel.CONSTANTS.BACK_TO_TITLE, model.get("name"));
        this.addBtnToEmptyItemView();
        if (_.isEmpty(this.collection?.columnPreference?.get("d2sv_widget_state")?.filter)) {
          if (this.collection.avaliableD2FilterConfigFacets) {
            var defaultFilter = _.filter(this.collection.avaliableD2FilterConfigFacets.topics, function(topic) {
              return topic.default === true;
            });
            if (defaultFilter.length > 0) {
              this.collection.nodeD2FilterConfig = defaultFilter[0];
              this._saveFilterPreferences(true);
            }
          }
        }
        $(".csui-nodestable.d2-widget-table-view .load-container").addClass("binf-hidden");
        const namedLocalStorage = dctmUtils.getSessionStore(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
        if (namedLocalStorage && namedLocalStorage.get(constants.StorageKey.COLLECTIONS_NAVIGATIONS)) {
          this.d2CollectionsListsWrapperView.ui.searchInput.val(namedLocalStorage.get(constants.StorageKey.COLLECTIONS_NAVIGATIONS)["name"]);
          this.d2CollectionsListsWrapperView.ui.clearButton.show();
          this.d2CollectionsListsWrapperView.myCollectionsListView.listView.trigger("search:filter", this.d2CollectionsListsWrapperView.ui.searchInput.val());
          namedLocalStorage.remove(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
        }
      });
      const d2CollectionsWrapper = this.$el.find(".d2-collections-list-wrapper");
      if (this.getPreference("isFacetOpen")) {
        d2CollectionsWrapper && d2CollectionsWrapper.addClass("d2-collections-wrapper-hidden");
      } else {
        d2CollectionsWrapper && d2CollectionsWrapper.removeClass("d2-collections-wrapper-hidden");
      }
    },
    addBtnToEmptyItemView() {
      if (this.collection.length == 0) {
        $(".csui-no-result-message").html(lang.collectionEmptyLabel);
        $(".addItems").remove();
        if (this.selectedModel && this.selectedModel.get("owner_name") === RestResources.getCurrentUser().get("properties").user_name) {
          $(".csui-table-empty .csui-no-result-message").after(`<div class='addItems'>
              <div class='add-items-label'>${lang.addItemLabel}</div>
              <otc-button class="d2-otc-btn form-btn search addItemIcon" type="primary" button-id="search"
                ariaLabel="d2-otc-btn" title="Add item" tabindex="0">${lang.addItemBtnLabel}</otc-button>
              </div>`);
          $(".addItemIcon").on("click", () => {
            this.triggerCollectionCmd("browser");
          });
        }
      }
    },
    triggerCollectionCmd: function(from) {
      var collectionCmd = commands.get("D2-AddToCollections");
      collectionCmd.execute({
        context: this.options.context,
        nodes: this.options && this.options.mycollection && this.options.mycollection.length > 0 ? this.selectedModel : undefined,
        originatingView: this,
        collection: this.d2CollectionsListsWrapperView.options.mycollection
      }, {
        commandKey: "D2-AddToCollections"
      }, from);
    },
    updateTableEmptyViewVisibility() {
      if (this.d2CollectionsListsWrapperView?.options.mycollection?.totalCount === 0 && this.d2CollectionsListsWrapperView?.options.sharedCollection?.length === 0) {
        this.ui.tableContainer.addClass("csui-facet-table-empty-container");
        this.ui.emptyView.addClass("collections-empty-view--show");
      } else {
        this.ui.tableContainer.removeClass("csui-facet-table-empty-container");
        this.ui.emptyView.removeClass("collections-empty-view--show");
      }
    },
    onClickingCreateCollection: function() {
      this.triggerCollectionCmd("createCollection");
    },
    _updateTitleInHeader: function(model) {
      if (!model) {
        return false;
      }
      this.tableToolbarView.getRegion("otherToolbarRegion").empty();
      this.tableToolbarView.getRegion("otherToolbarRegion").$el.removeClass("editCollectionForm");
      this.tableToolbarView.getRegion("toolbarCaptionRegion").$el.show();
      this.tableToolbarView.container.set("id", model.get("r_object_id"));
      this.tableToolbarView.container.set("chronicle_id", model.get("i_chronicle_id"));
      this.tableToolbarView.container.set("name", model.get("name"));
      this.tableToolbarView.container.set("links", model.get("links"));
      this.tableToolbarView.container.set("isSharedCollection", model.get("isSharedCollection"));
      this.tableToolbarView.container.set("type", constants.Types.COLLECTIONS);
      this.tableToolbarView.container.fetch({
        reload: true,
        skipSWCache: true
      });
    },
    resetTableTitleHeader() {
      this.tableToolbarView.captionView.menuRegion.empty();
      var tContainer = this.tableToolbarView && this.tableToolbarView.container;
      if (tContainer) {
        tContainer.clear({
          silent: true
        });
        tContainer.set(_.extend({
          id: this.getWidgetTypeId(),
          name: this.getTitle()
        }, this.getExtraIconConfig()));
      }
    },
    _completeFilterCommand: function() {
      _oldCompleteFilterCommand.apply(this, arguments);
      if (this.showFilter === true) {
        if (this.showSidePanel === true) {
          this._toggleSidePanel("sidePanel", false).done(function() {
            this.triggerMethod("dom:refresh");
          }.bind(this));
          this.showSidePanel = false;
          this.setPreference("isSidePanel", this.showSidePanel);
        }
        if (this.facetFilters?.models[0]?.topics?.length === 0) {
          this.collection.fetch({
            reload: true,
            skipSWCache: true
          });
        }
      }
      this._setFilterActiveState(this.showFilter);
    },
    _setFilterActiveState: function(active) {
      var facetPanelToggleIconSelector = '.csui-toolbar li[data-csui-command="filter"] svg.csui-icon-v2', facetPanelToggleIconActiveStateClassName = "csui-icon-v2-on";
      var title = active ? nodestableLang.filterCollapseTooltip : nodestableLang.filterExpandTooltip;
      this.$('.csui-toolbar li[data-csui-command="filter"] .csui-toolitem').attr({
        title: title,
        "aria-label": title
      });
      if (active) {
        this.$(facetPanelToggleIconSelector).addClass(facetPanelToggleIconActiveStateClassName);
      } else {
        this.$(facetPanelToggleIconSelector).removeClass(facetPanelToggleIconActiveStateClassName);
      }
    },
    _toolbarActionTriggered: function(args) {
      switch (args.commandSignature) {
       case "Filter":
        this.filterToolItemModel = args.toolItem;
        this._completeFilterCommand();
        this.filterToolItemModel.set("stateIsOn", this.showFilter);
        this._toggleSidePanel("sidepanel", false);
        break;
      }
    },
    _afterExecuteCommand: function(args) {
      _oldAfterExecuteCommand.apply(this, args);
      switch (args.commandSignature) {
       case "D2-split-view":
        this.splitPanelToolItemModel = args.toolItem;
        this._completeFilterCommand();
        this._toggleSidePanel("facet", false);
        this.setPreference("isFacetOpen", false);
        this._setFilterActiveState(false);
        this.showFilter = false;
        break;
      }
    },
    _toggleSidePanel: function(panelName, flag) {
      var me = this, deferred = $.Deferred(), view, className, iconEl, activeCls, isViewHidden;
      if (panelName === "facet") {
        var facetPanelToggleIconSelector = '.csui-toolbar li[data-csui-command="filter"] svg.csui-icon-v2', facetPanelToggleIconActiveStateClassName = "csui-icon-v2-on";
        view = me.ui.facetView;
        className = "csui-facetview-hidden";
        iconEl = me.$(facetPanelToggleIconSelector);
        activeCls = facetPanelToggleIconActiveStateClassName;
      } else if (panelName === "sidepanel") {
        view = me.d2CollectionsListsWrapperView.$el;
        className = "d2-collections-wrapper-hidden";
        iconEl = me.$('.csui-toolbar li[data-csui-command="d2-split-view"] span');
        activeCls = "left_panel_open";
      } else {
        return deferred.reject();
      }
      isViewHidden = view.hasClass(className);
      function afterTransition() {
        if (panelName === "sidepanel") {
          iconEl.addClass("left_panel_open");
          iconEl.removeClass("left_panel_close");
        } else {
          iconEl[flag ? "addClass" : "removeClass"](activeCls);
        }
        deferred.resolve();
      }
      if (isViewHidden) {
        view[flag ? "removeClass" : "addClass"](className);
        afterTransition();
      } else {
        view.on(me._transitionEnd(), function() {
          afterTransition();
          !!me.thumbnailViewState && me.thumbnail._adjustThumbnailWidth();
        })[flag ? "removeClass" : "addClass"](className);
      }
      return deferred.promise();
    }
  });
  return CollectionWidgetView;
});