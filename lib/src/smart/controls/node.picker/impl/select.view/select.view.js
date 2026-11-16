/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/node.picker/impl/node.list/node.list.view", "smart/controls/node.picker/impl/node.list/node.tree.list.view", "smart/controls/node.picker/impl/node.list/node.grid.view", "smart/controls/node.picker/impl/select.view/impl/header/header.view", "hbs!smart/controls/node.picker/impl/select.view/impl/select.view", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/progressblocker/blocker", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/list/impl/list", "css!smart/controls/node.picker/impl/select.view/impl/select.view" ], function(module, $, _, Backbone, Marionette, NodeListView, NodeTreeListView, NodeGridView, HeaderView, template, LayoutViewEventsPropagationMixin, TabableRegionBehavior, BlockingView, lang) {
  var SelectView = Marionette.LayoutView.extend({
    template: template,
    templateHelpers: function() {
      var langtext, tooltiptext = "";
      if (this.options.targetBrowseHistory.length) {
        langtext = this.options.targetBrowseHistory[this.options.targetBrowseHistory.length - 1];
        if (langtext[0] === "search") {
          tooltiptext = lang.backToSearchAria;
        } else if (langtext[0] === "location") {
          tooltiptext = lang.backToFolderView;
        } else if (langtext[0] === "node") {
          tooltiptext = lang.backToFolderView;
        } else {
          tooltiptext = "";
        }
      }
      return {
        backButtonTooltip: lang.backButtonTooltip,
        backButtonAria: tooltiptext != "" ? tooltiptext : lang.backToFolderView
      };
    },
    regions: {
      viewHeaderRegion: ".csui-np-header",
      viewContentRegion: ".csui-np-content"
    },
    ui: {
      backSearchButton: ".csui-targetbrowse-arrow-back"
    },
    events: {
      tabNextRegion: "tabNextRegion",
      "click @ui.backSearchButton": "onClickFolderBack",
      "keydown @ui.backSearchButton": "selectFolderBack"
    },
    constructor: function SelectView(options = {}) {
      this.options = options;
      _.defaults(options, {
        pageSize: 30
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
      this.search = false;
      this.rendered = false;
      this.selectList = {};
      this.collection = options.collection;
      this.container = options.container;
      if (this.container) {
        this.container.nameAttribute = options?.nameAttribute ?? "name";
      }
      this.propagateEventsToRegions();
      this.listenTo(this.collection, "sync", this._handlePendingFilter);
      this.setHeader(options);
      this.setListView(options);
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
      let self = this;
      this.listenTo(this, "before:destroy", function() {
        self.headerView && self.headerView.trigger("destroy");
        self.listView && self.listView.trigger("destroy");
      });
    },
    tabNextRegion: function(event) {
      if (this.listView.currentlyFocusedElement()) {
        event.preventDefault();
        event.stopPropagation();
        this.listView.setFocus();
      }
    },
    windowRefresh: function() {
      var parentHeight = this.options.parentEl.height();
      if (parentHeight > 0) {
        this.$el.css("height", "calc(100% - 36px)");
      }
    },
    onDestroy: function() {
      this.$el.off();
      $(window).off("resize.app", this.onWinRefresh);
    },
    onRender: function() {
      var self = this, contentList = self.$el.find(".csui-np-content");
      this.viewHeaderRegion.show(this.headerView);
      this.viewContentRegion.show(this.listView);
      this.$el.on("hover", function() {
        contentList.addClass("binf-focus");
      }, function() {
        contentList.removeClass("binf-focus");
      });
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        var target = $(this);
        self.focusedElement && self.focusedElement.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        target.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        self.focusedElement = target;
      });
      this.rendered = true;
      this.trigger("dom:refresh");
    },
    onDomRefresh: function() {
      this.windowRefresh();
    },
    onShow: function() {
      if (!this.rendered) {
        this.render();
      }
      _.each(this.regionManager._regions, function(region) {
        if (region.currentView) {
          region.currentView.trigger("show");
        }
      });
    },
    getNumberOfSelectItems: function() {
      return _.size(this.selectList);
    },
    setNewSelect: function(node, silent) {
      this.clearSelect();
      this._setSelection({
        node: node,
        add: true,
        silent: silent
      });
    },
    isTabable: function() {
      return this.$("*[tabindex]").length > 0;
    },
    currentlyFocusedElement: function(event) {
      var focusables = this.$el.find("*[tabindex=-1]");
      if (focusables.length) {
        focusables.prop("tabindex", 0);
      }
      if (this.$el.find(".csui-folder-name.binf-hidden").length) {
        return this.$el.find("input");
      } else if (this.$el.find(".csui-targetbrowse-arrow-back .cs-go-back:visible").length && !event.shiftKey) {
        return this.$el.find(".csui-targetbrowse-arrow-back .cs-go-back");
      } else {
        return this.$el.find(".csui-folder-name .icon-sv-search");
      }
    },
    onLastTabElement: function(shiftTab) {
      var tabItems = this.$("[data-cstabindex=-1]"), lastItem = tabItems.length - 1;
      if (tabItems.length) {
        var focusElement = shiftTab ? tabItems[0] : tabItems[lastItem];
        this.$(".csui-focus").removeClass("csui-focus");
        return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass);
      }
      return true;
    },
    clearSelect: function() {
      this.listView.clearSelect();
      this.selectList = {};
    },
    setListView: function(options) {
      options || (options = {});
      var self = this, args = {
        collection: this.collection,
        container: this.container,
        commandType: options.commandType,
        pageSize: options.pageSize,
        searchView: options.searchView,
        treeView: options?.treeView,
        groupsLocationName: options?.groupsLocationName,
        nameAttribute: options?.nameAttribute,
        secTextAttribute: options?.secTextAttribute,
        groupIconName: options?.groupIconName,
        resolveShortcuts: options.resolveShortcuts,
        resultOriginalNode: options.resultOriginalNode,
        context: options.context,
        selectedCountList: options.selectedCountList,
        selectItems: options.selectedItems,
        selectException: options.selectException,
        getNodeTypeIconView: options?.getNodeTypeIconView,
        getNodeTypeIconInfo: options?.getNodeTypeIconInfo,
        nodeLinks: options?.nodeLinks,
        fetchCollectionOnScroll: options?.fetchCollectionOnScroll,
        selectView: this,
        getAddableTypes: options?.getAddableTypes,
        isMlDataEnabled: options?.isMlDataEnabled,
        multiLingualPopoverMixin: options?.multiLingualPopoverMixin,
        metadataLanguages: options?.metadataLanguages,
        nodeIndicators: options?.nodeIndicators,
        hasTableToolbarView: options?.hasTableToolbarView,
        requestLazyAddableTpes: options?.requestLazyAddableTpes,
        showCustomInlineForm: options?.showCustomInlineForm,
        groupsCollection: options?.groupsCollection,
        groupChildrenCollection: options?.groupChildrenCollection,
        expandOnSearch: options?.expandOnSearch,
        synchronizeTreeCollection: options.synchronizeTreeCollection,
        enableGrid: options.enableGrid ?? false,
        treeViewOptions: {
          ...options
        },
        nodePickerView: options.nodePickerView,
        showAllTypes: options?.showAllTypes,
        masterView: options?.masterView,
        searchTitleName: options?.searchTitleName
      };
      var listView;
      if (typeof this.options?.treeView === "boolean" && this.options?.treeView === true) {
        listView = this.listView = new NodeTreeListView(args);
      } else if (this.options?.masterView?.isGridView() && this.options?.searchView === false) {
        listView = this.listView = new NodeGridView(args);
      } else {
        listView = this.listView = new NodeListView(args);
      }
      this.listenTo(listView, "selection:change", this._setSelection).listenTo(listView, "browse:select", this._onBrowse);
    },
    selectFolderBack: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.trigger("backbutton:click", this);
      }
    },
    onClickFolderBack: function(event) {
      this.trigger("backbutton:click", this);
    },
    setHeader: function(options) {
      var title = !!this.container?.get(this.container?.nameAttribute) ? this.container?.get(this.container?.nameAttribute) : this.container?.get("name");
      title = title == null ? this.options.locationName : title;
      this.headerView = new HeaderView({
        title: title,
        container: this.container,
        searchView: options.searchView,
        collection: this.collection,
        context: this.options.context,
        selectableTypes: this.options.selectableTypes,
        addableTypes: this.options.addableTypes,
        targetBrowseHistory: this.options.targetBrowseHistory,
        getAddableTypes: this.options?.getAddableTypes,
        isMlDataEnabled: this.options?.isMlDataEnabled,
        multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
        metadataLanguages: this.options?.metadataLanguages,
        requestLazyAddableTpes: this.options?.requestLazyAddableTpes,
        showCustomInlineForm: this.options?.showCustomInlineForm,
        hasTableToolbarView: this.options?.hasTableToolbarView,
        initializeToolbar: this.options?.initializeToolbar,
        creationToolItemsMask: this.options.creationToolItemsMask,
        masterView: this.options.masterView
      });
      this.listenTo(this.headerView, "change:filterValue", this.applyFilter);
      this.listenTo(this.headerView, "save:form", function(node) {
        this.blockActions();
        this.trigger("save:form", node);
      });
      this.listenTo(this.headerView, "search:clicked", this.isSearchOpen);
    },
    cancelInlineForms: function(model) {
      if (!model) {
        model = this.options.collection.filter(function(model) {
          return !!model.inlineFormView;
        });
      }
      this.collection.remove(model);
    },
    isSearchOpen: function() {
      var isSearchOpen = this?.headerView?.ui?.searchInput?.is(":visible");
      this.listView.trigger("search:clicked", isSearchOpen);
    },
    applyFilter: function(searchInfo) {
      if (this.options?.treeView) {
        this.listView.options.filterValue = searchInfo.name;
        this.listView?.trigger("change:filterValue", this?.options);
      } else {
        _.extend(searchInfo, {
          type: this.options.listTypes
        });
        if (this.collection.fetching) {
          this.filterValuePending = searchInfo;
        } else {
          this.options?.resetCollStartPosition(this, searchInfo);
        }
      }
    },
    refresh: function() {
      this.options?.selectViewRefresh(this);
    },
    addFolderSelection: function(node) {
      this._setSelection({
        browse: true,
        add: true,
        node: node
      });
    },
    _handlePendingFilter: function() {
      if (!_.isEmpty(this.filterValuePending)) {
        this.collection.setFilter(this.filterValuePending);
        this.filterValuePending = {};
      }
    },
    _onBrowse: function(args) {
      this.headerView?.el?.querySelector("otc-menu.smart-addable-types-menu")?.removeAttribute("isopen");
      this.trigger("browse:select", this, args);
      this.cancelInlineForms();
    },
    _setSelection: function(args) {
      var id = args.node.get("id"), commandType = this.options.commandType;
      args.containerName = this?.container?.get("name");
      !commandType.multiSelect && (this.selectList = {});
      if (args.add && commandType.isSelectable(args.node)) {
        if (!!commandType.multiSelect) {
          var self = this;
          this.trigger("add:to:collection", {
            id: id,
            node: args.node,
            targetEl: args.targetEl
          });
        }
        this.selectList[id] = args.node;
      } else {
        delete this.selectList[id];
        if (!commandType.multiSelect) {
          this.trigger("clear:selectList", args, this);
        } else {
          this.trigger("remove:from:collection", {
            id: id,
            node: args.node,
            targetEl: args.targetEl
          });
        }
      }
      if (!args.silent) {
        this.trigger("selection:change", args, this);
        this.cancelInlineForms();
      }
    }
  });
  _.extend(SelectView.prototype, LayoutViewEventsPropagationMixin);
  return SelectView;
});