/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "i18n", "csui/controls/form/pub.sub", "csui/behaviors/limiting/limiting.behavior", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/commands", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/controls/button.toolbar/button.toolbar.view", "dctmw/controls/list/list.view", "dctmw/controls/list/listitem.type.model.view", "d2/utils/contexts/factories/d2.mycollections.factory", "d2/utils/contexts/factories/d2.sharedcollections.factory", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems", "d2/widgets/d2collections.perspective/impl/d2collections.toolbaritems.mask", "d2/utils/event.utils", "dctmw/utils/client.location", "d2/utils/filter.utils", "dctmw/utils/utils", "i18n!d2/widgets/d2collections.perspective/d2collections.list/impl/nls/lang", "hbs!d2/widgets/d2collections.perspective/d2collections.list/impl/d2collections.list", "hbs!d2/widgets/d2collections.perspective/d2collections.list/impl/d2collections.list.header", "hbs!d2/widgets/d2collections.perspective/d2collections.list/impl/d2collections.list.item", "hbs!d2/widgets/d2collections.perspective/d2collections.list/impl/d2collections.list.wrapper", "css!d2/widgets/d2collections.perspective/d2collections.list/impl/d2collections.list" ], function(_, $, Backbone, Marionette, i18n, PubSub, LimitingBehavior, BlockingView, LayoutViewEventsPropagationMixin, commands, constants, widgetConstants, RestResources, ButtonToolbarView, D2ListView, D2CollectionsFilesListItem, CollectionWidgetCollectionFactory, SharedCollectionsWidgetFactory, d2collectionsToolbaritems, d2collectionsToolbarMasks, eventUtils, ClientLocation, FilterUtils, dctmUtils, lang, template, d2collectionHeaderTemplate, d2collectionItemTemplate, listWrapperTemplate) {
  "use strict";
  var listLoadCmpltCntr = 0;
  var D2CollectionListItemView = D2CollectionsFilesListItem.extend({
    template: d2collectionItemTemplate,
    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },
    onShowInlineMenu: function() {
      if (this.model && this.model.get("owner_name") === RestResources.getCurrentUser().get("properties").user_name) {
        D2CollectionsFilesListItem.prototype.onShowInlineMenu.apply(this, arguments);
        this.model.setNonPromotedActionsOptions && this.model.setNonPromotedActionsOptions({
          isNonPromoted: true
        });
      }
    },
    getAttributeValue: function(model, attributeName) {
      var value = model.get(attributeName);
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (value[i] !== undefined && value[i] !== null) {
            value = value[i];
            break;
          }
        }
      }
      return value !== undefined ? value : null;
    }
  });
  var CustomListView = D2ListView.extend({
    constructor: function CustomListView(options) {
      options = options || {};
      options.enableIcon = false;
      this.context = options.context;
      this.completeCollection = options.collection;
      this.selectedModel = new Backbone.Model();
      this.collection = Backbone.Collection.extend(options.completeCollection ? {
        model: options.completeCollection.model
      } : {});
      this.toolbarItems = {
        inlineActionbar: d2collectionsToolbaritems.collectionsInlineActionBar
      };
      this.toolbarItems.inlineActionbar.options = _.extend({
        toolItemsMask: new d2collectionsToolbarMasks().toolbars.collectionsInlineActionBar
      }, this.toolbarItems.inlineActionbar.options);
      options.toolbarItems = this.toolbarItems;
      options.isCollectionsListView = true;
      D2ListView.prototype.constructor.call(this, options);
    },
    childView: D2CollectionListItemView,
    childViewOptions: function() {
      return {
        filesListView: this,
        checkDefaultAction: true,
        toolbarData: {
          toolbaritems: this.toolbarItems
        },
        context: this.context,
        parentModel: this.options.parentNode,
        originatingView: this.originatingView,
        isSharedCollections: this.options.isSharedCollections,
        templateHelpers: function() {
          return {
            name: this.model.get("name") || this.model.get("object_name"),
            showInlineActionBar: this.options ? !this.options.isSharedCollections : !this.isSharedCollections,
            isSharedIconEnable: this.model.get("isSharedCollection")
          };
        }
      };
    },
    updateCollection(selectedModel, isNewlyAddedCollection = false) {
      let self = this;
      if (selectedModel) {
        let model = self.collection.find({
          id: selectedModel.get("id")
        });
        if (!model) {
          self.collection.unshift(selectedModel);
          model = selectedModel;
        }
        if (model) {
          if (isNewlyAddedCollection) {
            model.fetch();
          }
          this._parent?._parent?._parent?._onListViewClickItemModel(selectedModel);
          self._setCssItemSelected(self.children.findByModelCid(model.cid).$el);
        }
      }
    },
    scrollToCollection: function(collectionId = $.parseParams(window.location.hash)?.["collection-id"]) {
      let isInCollectionPerspective = window.location.href.indexOf("#d2/collection?") > -1;
      if (isInCollectionPerspective) {
        if (collectionId) {
          let model = this.collection.find({
            r_object_id: collectionId
          });
          if (model) {
            let parent = this.$el.find(".cs-list-group")[0];
            let target = this.children.findByModelCid(model.cid).$el[0];
            let offsetTop = target.offsetTop - parent.offsetTop;
            parent.scrollTop = offsetTop;
          }
        }
      }
    },
    _setCssItemSelected: function($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $(".d2-collections-wrapper .d2-listitem.binf-active");
      $active.removeClass("binf-active").removeAttr("data-csui-active").removeAttr("aria-current");
      $item.addClass("binf-active").attr("data-csui-active", "").attr("aria-current", "page");
      $item.siblings().prop("tabindex", "-1");
    },
    selectedIndexElem: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var nthChildSel = _.str.sformat("div.d2-listitem:nth-child({0})", index + 1);
      var $item = this.$(nthChildSel);
      return $($item[0]);
    }
  });
  var D2CollectionsListHeaderView = Marionette.LayoutView.extend({
    className: "d2-collection-simple-header-wrapper",
    template: d2collectionHeaderTemplate,
    ui: {
      createBtn: ".binf-btn-add",
      expandBtn: ".binf-btn-expand",
      collapseBtn: ".binf-btn-collapse"
    },
    events: {
      "click @ui.createBtn": "onCreateClicked",
      "click @ui.collapseBtn": "onExpandClicked",
      "click @ui.expandBtn": "onCollapseClicked"
    },
    templateHelpers: function() {
      var options = this.options;
      return {
        listTitle: options.listTitle,
        collectionLength: options.collection.length,
        expandTooltip: options.expandTooltip,
        collapseTooltip: options.collapseTooltip,
        createCollectionTooltip: lang.defaultTooltipCreateCollectionButton,
        isAddButtonEnabled: !options.isSharedCollections
      };
    },
    onCreateClicked: function(e) {
      e.stopPropagation();
      var collectionCmd = commands.get("D2-AddToCollections");
      collectionCmd.execute({
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.options.collection,
        data: {}
      }, {
        commandKey: "D2-AddToCollections"
      }, "createCollection");
    },
    onExpandClicked: function(e) {
      e.stopPropagation();
      $(".d2-collection-simple-list").removeClass("accordion-expand");
      this.options.parentListView.$el.addClass("accordion-expand");
    },
    onCollapseClicked: function(e) {
      e.stopPropagation();
      $(".d2-collection-simple-list").removeClass("accordion-expand");
    }
  });
  var D2CollectionsListView = Marionette.LayoutView.extend({
    className: "d2-collection-simple-list no-footer",
    template: template,
    ui: {
      listHeader: ".d2-collection-simple-list-header"
    },
    regions: {
      rgnHeader: ".d2-collection-simple-list-header",
      rgnListContainer: ".d2-collection-simple-list-container"
    },
    events: {
      "click @ui.listHeader": "onHeaderClick"
    },
    behaviors: {
      LimitedList: {
        behaviorClass: LimitingBehavior
      }
    },
    constructor: function D2CollectionsListView(options) {
      options = options || {};
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      this.showBackButton = _.isBoolean(options.showBackButton) ? options.showBackButton : false;
      this.cmdRefreshList = commands.get("D2-RefreshList");
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.namedLocalStorage = dctmUtils.getSessionStore(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.showSideBar === false) {
        return true;
      } else {
        return false;
      }
    },
    _setupListView: function() {
      if (!this.listView) {
        this.listView = new CustomListView(_.defaults({
          selectedModel: this.options.model
        }, _.omit(this.options, "model")));
        this.listenTo(this.listView, "search:filter", this.searchChange).listenTo(this.listView, "click:item", this._onListViewClickItem).listenTo(this.listView, "clear:selection", this._onListViewClearSelection);
      }
    },
    _setupHeaderView: function() {
      this.headerView = new D2CollectionsListHeaderView(_.defaults({
        parentListView: this
      }, this.options));
    },
    onRender: function() {
      this.collection.fetch({
        reload: true,
        skipSWCache: true,
        toolbarItems: {
          inlineActionbar: d2collectionsToolbaritems.collectionsInlineActionBar
        }
      }).done(function() {
        this._setupHeaderView();
        this._setupListView();
        this._renderChildrenViews();
        this._ensureDraggablePanel();
        this.updateTitleCount();
        this.options.callBack(this.collection.length);
        this.listenTo(this.collection, "update", function() {
          this.headerView.render();
        });
        this.listenTo(this.collection, "sync", function() {
          this.headerView.render();
        });
      }.bind(this));
    },
    _renderChildrenViews: function() {
      this.headerView && this.rgnHeader.show(this.headerView);
      this.listView && this.rgnListContainer.show(this.listView);
    },
    _onClickGoBack: function(e) {
      this.trigger("click:back", e);
    },
    _onListViewClickItem: function(item) {
      this._onListViewClickItemModel(item.model);
    },
    _onListViewClickItemModel: function(model) {
      if (this.originatingView && this.originatingView.loadTableView) {
        this.originatingView.loadTableView.call(this.originatingView, model);
      } else {
        const defaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), defaultCollectionWidget = defaultWidgets && defaultWidgets[widgetConstants.DEFAULT.COLLECTIONS], encodedD2COollectionUrl = encodeURIComponent(defaultCollectionWidget + "&filter={}"), collectionId = model.get("id");
        this.namedLocalStorage.set(constants.StorageKey.COLLECTIONS_NAVIGATIONS, this.collection.filters);
        ClientLocation.navigate(ClientLocation.modularizeFragment("#d2/collection?widget_name=" + encodedD2COollectionUrl + "&collection-id=" + collectionId), {
          trigger: true,
          reload: true
        });
      }
    },
    _onListViewClearSelection: function() {
      this.trigger("clear:selection", this.options.model);
    },
    onHeaderClick: function(e) {
      e.stopImmediatePropagation();
      if (this.options.isSharedCollections) {
        ClientLocation.navigate(ClientLocation.modularizeFragment("#d2/shared-collections"), {
          trigger: true
        });
      } else {
        ClientLocation.navigate(ClientLocation.modularizeFragment("#d2/my-collections"), {
          trigger: true
        });
      }
    },
    getWidgetTypeId: function() {
      return constants.WidgetId.COLLECTIONS;
    },
    _ensureDraggablePanel: function() {
      var me = this;
      var $d2CollectionListView = this.options.originatingView && this.options.originatingView.$el.find(".d2-collections-list-view");
      if ($d2CollectionListView && $d2CollectionListView.length > 0 && !$d2CollectionListView.hasClass("ui-resizable-handle")) {
        var SearchDragHandler = ".d2-collections-list-view .ui-resizable-handle";
        $d2CollectionListView.resizable({
          handles: i18n && i18n.settings.rtl ? "w" : "e",
          maxWidth: 400,
          minWidth: 300,
          stop: function() {
            me.options.originatingView.triggerMethod("dom:refresh");
          },
          resize: function() {}
        });
        eventUtils.enableTouchEventsByClass(SearchDragHandler);
      }
    },
    searchChange: function(searchStr) {
      if (searchStr && searchStr.length > 0) {
        this.collection.setFilter({
          name: searchStr
        });
      } else {
        this.collection.clearFilter();
      }
    },
    updateTitleCount: function() {
      this.ui.listHeader.find(".d2-collections-simple-list-header-label").html(_.str.sformat(this.options.listTitle, this.collection.length)).attr("title", _.str.sformat(this.options.listTitle, this.collection.length));
    }
  });
  var D2CollectionsListsWrapperView = Marionette.LayoutView.extend({
    className: "d2-collections-list-wrapper",
    template: listWrapperTemplate,
    ui: {
      searchInput: ".search",
      clearButton: ".i-close",
      listMyCollectionsPanel: ".d2-mycollections-list-view",
      listSharedCollectionsPanel: ".d2-sharedcollections-list-view"
    },
    regions: {
      listMyCollectionsPanel: ".d2-mycollections-list-view",
      listSharedCollectionsPanel: ".d2-sharedcollections-list-view"
    },
    events: {
      "keyup .csui-table-search-input": "filterChanged",
      "click @ui.clearButton": "clearInput"
    },
    constructor: function D2CollectionsListsWrapperView(options) {
      options.mycollection = options.context.getCollection(CollectionWidgetCollectionFactory, {
        attributes: {
          id: "COLLECTIONS_SIDE_PANEL"
        }
      });
      options.sharedCollection = options.context.getCollection(SharedCollectionsWidgetFactory, {
        attributes: {
          id: "COLLECTIONS_SIDE_PANEL"
        }
      });
      this.originatingView = options.originatingView;
      this.templateHelpers = {
        lang: lang,
        searchPlaceholder: lang.searchPlaceHolder,
        searchTitle: lang.searchTitle
      };
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.namedLocalStorage = dctmUtils.getSessionStore(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
    },
    onRender: function() {
      this.ui.searchInput.on("input", _.bind(this.searchInput, this));
      var me = this;
      FilterUtils.getD2FilterServerConfig({
        connector: me.options.mycollection.connector
      }).done(function(FilterConfigs) {
        me.options.mycollection.avaliableD2FilterConfigFacets = FilterConfigs;
        me.options.sharedCollection.avaliableD2FilterConfigFacets = FilterConfigs;
        me._createD2CollectionsListView();
        me._showD2CollectionsListView();
      });
    },
    _createD2CollectionsListView: function() {
      let self = this;
      this.myCollectionsListView = new D2CollectionsListView({
        context: this.options.context,
        collection: this.options.mycollection,
        completeCollection: {
          myCollection: this.options.mycollection,
          sharedCollection: this.options.sharedCollection
        },
        originatingView: this.originatingView,
        listTitle: lang.myCollections,
        isSharedCollections: false,
        expandTooltip: lang.expandMyCollections,
        collapseTooltip: lang.collapseMyCollections,
        callBack: function() {
          if (self.originatingView.updateTableEmptyViewVisibility) {
            self.originatingView.updateTableEmptyViewVisibility();
          }
          listLoadCmpltCntr++;
          self.selectCollection();
        },
        loadTableView: function(targetModel) {
          if (self.originatingView.loadTableView) {
            self.originatingView.loadTableView(targetModel);
          }
        }
      });
      this.sharedCollectionsListView = new D2CollectionsListView({
        context: this.options.context,
        collection: this.options.sharedCollection,
        completeCollection: {
          myCollection: this.options.mycollection,
          sharedCollection: this.options.sharedCollection
        },
        originatingView: this.options.originatingView,
        listTitle: lang.sharedCollections,
        expandTooltip: lang.expandSharedCollections,
        collapseTooltip: lang.collapseSharedCollections,
        isSharedCollections: true,
        callBack: function(collectionLength = 0) {
          if (collectionLength == 0) {
            self.sharedCollectionsListView.$el.hide();
          } else {
            self.sharedCollectionsListView.$el.show();
          }
          if (self.originatingView.updateTableEmptyViewVisibility) {
            self.originatingView.updateTableEmptyViewVisibility();
          }
          listLoadCmpltCntr++;
          self.selectCollection();
        },
        loadTableView: function(targetModel) {
          if (self.originatingView.loadTableView) {
            self.originatingView.loadTableView(targetModel);
          }
        }
      });
      if (this.originatingView.loadTableView) {
        this.listenTo(this.myCollectionsListView, "click:item", this.originatingView.loadTableView.bind(this.originatingView));
        this.listenTo(this.sharedCollectionsListView, "click:item", this.originatingView.loadTableView.bind(this.originatingView));
      }
    },
    selectCollection: function(collectionId = $.parseParams(window.location.hash)?.["collection-id"]) {
      let isInCollectionPerspective = window.location.href.indexOf("#d2/collection?") > -1;
      if (this.options.sharedCollection && this.options.sharedCollection.length > 0) {
        this.$el.has(".d2-mycollections-list-view").has(".d2-sharedcollections-list-view").addClass("d2-both-d2collections-exist");
      }
      if (listLoadCmpltCntr === 2 && isInCollectionPerspective) {
        if (collectionId) {
          let model = this.options.mycollection.find({
            r_object_id: collectionId
          });
          if (model) {
            this.myCollectionsListView.listView.onClickItem(this.myCollectionsListView.listView.children.findByModelCid(model.cid));
          } else {
            model = this.options.sharedCollection.find({
              r_object_id: collectionId
            });
            if (model) {
              this.sharedCollectionsListView.listView.onClickItem(this.sharedCollectionsListView.listView.children.findByModelCid(model.cid));
            }
          }
        } else if (this.options.mycollection && this.options.mycollection.length > 0) {
          this.myCollectionsListView.listView.onClickItem(this.myCollectionsListView.listView.children.first());
        } else if (this.options.sharedCollection && this.options.sharedCollection.length > 0) {
          this.sharedCollectionsListView.listView.onClickItem(this.sharedCollectionsListView.listView.children.first());
        }
        this.myCollectionsListView?.listView?.scrollToCollection();
        this.sharedCollectionsListView?.listView?.scrollToCollection();
      }
    },
    _showD2CollectionsListView: function() {
      this.listMyCollectionsPanel.show(this.myCollectionsListView);
      this.listSharedCollectionsPanel.show(this.sharedCollectionsListView);
      this.myCollectionsListView.$el.addClass("accordion-expand");
    },
    filterChanged: function(event) {
      if (event.target.value.length >= 3 && this.collection.hasMoreRecords) {
        this.fetchCollections(this.selectedModel);
      } else {
        let filters = {};
        filters[this.tableView.searchColumn] = event.target.value;
        this.collection.setFilter(filters);
      }
    },
    clearInput: function(event, looseFocusDeliberately) {
      if (looseFocusDeliberately) {
        $("body [tabindex]")[0].focus();
      } else {
        this.ui.searchInput.trigger("focus");
      }
      this.ui.searchInput.val("");
      this.ui.clearButton[0].style.display = "none";
      this.searchInput();
    },
    searchInput: function() {
      if (this.keyInputTimer) {
        clearTimeout(this.keyInputTimer);
      }
      this.keyInputTimer = setTimeout(_.bind(function() {
        this.keyInputTimer = undefined;
        this.searchFilterChanged();
      }, this), 300);
    },
    searchFilterChanged: function() {
      var filterValue = this.ui.searchInput.val();
      if (filterValue) {
        this.ui.clearButton[0].style.display = "block";
      } else {
        this.ui.clearButton[0].style.display = "none";
      }
      this.myCollectionsListView.listView.trigger("search:filter", filterValue);
      if (this.sharedCollectionsListView.listView) {
        this.sharedCollectionsListView.listView.trigger("search:filter", filterValue);
      }
      this.ui.searchInput.focus();
    },
    onDestroy: function() {
      listLoadCmpltCntr = 0;
    }
  });
  _.extend(D2CollectionsListView.prototype, LayoutViewEventsPropagationMixin);
  return D2CollectionsListsWrapperView;
});