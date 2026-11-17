/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/node.picker/impl/node.list/np.list.view", "smart/controls/listitem/simpletreelistitem.view", "smart/controls/node.picker/impl/node.list/list.item.view", "smart/controls/emptylist/emptylist.view", "smart/controls/progressblocker/blocker", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/node.picker/impl/node.list/node.tree.list" ], function(_, $, Backbone, Marionette, NPListView, SimpleTreeListView, ListItemView, EmptyListView, BlockingView, theming, jatoIcons, lang) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  var TreeView = SimpleTreeListView.extend({
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: lang.emptyGroupDefaultText
      };
    },
    templateHelpers: function() {
      var ariaName;
      var name = this.model.get("name"), locName = this.options?.groupsLocationName;
      if (this.model?.childrenCollection && this.model?.childrenCollection.length === 0) {
        ariaName = _.str.sformat(lang.emptyGroupAria, name, locName);
      } else {
        ariaName = _.str.sformat(lang.groupAria, name, locName);
      }
      const jatoGrpIcon = this?.options?.jatoGroupIcon;
      const jatoGroupIcon = isJato() && jatoGrpIcon;
      return {
        isJATO: theming.isJATOTheme(),
        expandSVGContent: jatoIcons.actionChevronSmallDown,
        collapseSVGContent: jatoIcons.actionChevronSmallUp,
        icon: this?.options?.groupIconName,
        jatoIcon: jatoGroupIcon,
        jatoGroupIcon: jatoGroupIcon,
        name: name,
        ariaName: ariaName,
        expand: this?.options?.expandOnSearch && this?.options?.isSearchOpen
      };
    },
    childViewOptions: function() {
      return {
        resolveShortcuts: this.options?.resolveShortcuts,
        commandType: this.options?.commandType,
        context: this.options?.context,
        getNodeTypeIconView: this.options?.getNodeTypeIconView,
        nodeLinks: this.options?.nodeLinks,
        isMultiSelect: this.options?.commandType?.multiSelect,
        isMlDataEnabled: this.options?.isMlDataEnabled,
        multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
        metadataLanguages: this.options?.metadataLanguages,
        nodeIndicators: this.options?.nodeIndicators,
        hasTableToolbarView: this.options?.hasTableToolbarView,
        treeView: this.options?.treeView,
        groupsLocationName: this.options?.groupsLocationName,
        nameAttribute: this.options?.nameAttribute
      };
    },
    childView: ListItemView,
    events: {
      keydown: "onKeyInView"
    },
    childEvents: {
      "before:add:child": "onBeforeAddChild",
      "change:child": "onChangeChild",
      "select:item": "onSelectItem",
      "browse:item": "onBrowseItem"
    },
    onBeforeAddChild: function(listItem) {
      this.trigger("before:add:tree:listitem", listItem);
    },
    onChangeChild: function(listItem) {
      this.trigger("change:tree:listitem", listItem);
    },
    onSelectItem: function(listItem) {
      this.trigger("select:tree:listitem", listItem);
    },
    onBrowseItem: function(listItem) {
      this.trigger("browse:tree:listitem", listItem);
    },
    onAddChild: function(listItem) {
      this.trigger("add:tree:listitem", listItem);
    },
    constructor: function TreeView(options) {
      options || (options = {});
      SimpleTreeListView.prototype.constructor.apply(this, arguments);
    },
    getResolvedModel: function(model) {
      if (this.options.resolveShortcuts && model.get("type") === 1 && model.original !== undefined) {
        model = model.original;
      }
      return model;
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var nthChildSel = _.str.sformat("div li:nth-child({0})", index + 1);
      var $item = this.$(nthChildSel);
      return $($item[0]);
    },
    onKeyInView: function(event) {
      var continueEvent = true;
      switch (event?.keyCode) {
       case 13:
       case 32:
        this?._clickTargetByKeyboard(event);
        continueEvent = false;
        break;
      }
      return continueEvent;
    }
  });
  var NodeTreeListView = NPListView.extend({
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: lang.noSearchResultMessage
      };
    },
    getChildView: function(item) {
      if (this.options?.showFlatList) {
        return ListItemView;
      } else {
        return TreeView;
      }
    },
    childViewOptions: function() {
      return {
        resolveShortcuts: this.options?.resolveShortcuts,
        commandType: this.options?.commandType,
        context: this.options?.context,
        getNodeTypeIconView: this.options?.getNodeTypeIconView,
        nodeLinks: this.options?.nodeLinks,
        isMultiSelect: this.options?.commandType?.multiSelect,
        isMlDataEnabled: this.options?.isMlDataEnabled,
        multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
        metadataLanguages: this.options?.metadataLanguages,
        nodeIndicators: this.options?.nodeIndicators,
        hasTableToolbarView: this.options?.hasTableToolbarView,
        groupsLocationName: this.options?.groupsLocationName,
        nameAttribute: this.options?.nameAttribute,
        groupIconName: this?.options?.groupIconName,
        isSearchOpen: this?.options?.isSearchOpen,
        expandOnSearch: this?.options.expandOnSearch,
        showAllTypes: this.options?.showAllTypes,
        treeView: this.options?.treeView,
        jatoGroupIcon: this.options.jatoGroupIcon
      };
    },
    childEvents: {
      "before:add:tree:listitem": "onBeforeAddTreeListItem",
      "change:tree:listitem": "onChangeTreeListItem",
      "select:tree:listitem": "onSelectTreeListItem",
      "browse:tree:listitem": "onBrowseTreeListItem",
      "before:add:child": "onBeforeAddChild",
      "change:child": "onChangeChild",
      "select:item": "onSelectItem",
      "browse:item": "onBrowseItem",
      "add:tree:listitem": "onAddTreeListItem"
    },
    constructor: function NodeTreeListView(options = {}) {
      this.groupsCollection = options?.groupsCollection;
      BlockingView.imbue(this);
      var ViewCollection = Backbone.Collection.extend({
        model: this?.groupsCollection?.model
      });
      options.collection = new ViewCollection(options);
      NPListView.prototype.constructor.apply(this, arguments);
      this.options?.synchronizeTreeCollection(options, this);
      this.listenTo(this.groupsCollection, "update sync", function() {
        this.options?.synchronizeTreeCollection(options, this);
        this.unblockActions();
        this._updateCollectionState();
      });
      this.listenTo(this.groupsCollection, "reset", function() {
        this._updateCollectionState();
      });
      this.listenTo(this, "change:filterValue", this.options.synchronizeTreeCollection);
      this.listenTo(this, "search:clicked", this._isSearchOpen);
      this.groupsCollection.length && this.unblockActions();
    },
    _isSearchOpen: function(isSearchOpen) {
      this.options.isSearchOpen = isSearchOpen;
      this.options?.synchronizeTreeCollection(this.options, this);
      this.options.searchOpenedInTreeView = true;
    },
    _updateCollectionState: function() {
      if (!this.collection.length) {
        this.el.querySelector(".binf-list-group")?.classList?.add("csui-no-results");
        this.el.querySelector(".list-content")[0]?.classList.remove("csui-normal-scrolling");
        this.el.querySelector(".list-content")[0]?.classList.add("smart-list-empty");
      } else {
        this.el.querySelector(".binf-list-group")?.classList?.remove("csui-no-results");
        this.el.querySelector(".list-content")[0]?.classList.add("csui-normal-scrolling");
        this.el.querySelector(".list-content")[0]?.classList.remove("smart-list-empty");
        this?.setFocus(this.focusIndex, false);
      }
      if (this.options.commandType.multiSelect) {
        this.$el.find(".list-content .binf-list-group").attr("aria-multiselectable", true);
        this.options?.masterView?.trigger("update:checkbox", {
          modelId: ""
        });
      }
    },
    onRenderCollection: function() {
      !this.options.masterView.options.searchActionPerformed && this.setFocus(this.focusIndex, false);
      this.trigger("refresh:tabindexes");
    },
    onBeforeAddTreeListItem: function(child, listItem) {
      this.onBeforeAddChild(listItem);
    },
    onChangeTreeListItem: function(child, listItem) {
      this.onChangeChild(listItem);
    },
    onSelectTreeListItem: function(child, listItem) {
      this.onSelectItem(listItem);
      child?.el?.querySelector(".cs-content")?.classList?.remove("binf-hidden");
    },
    onAddTreeListItem: function(child, listItem) {
      this.onAddChild(listItem);
    },
    onBrowseTreeListItem: function(child, item) {
      this.options.masterView.setGrid = true;
      this.options?.masterView?.trigger("enable:grid", true);
      this.onBrowseItem(item);
      child?.el?.querySelector(".cs-content")?.classList?.remove("binf-hidden");
    },
    onRender: function() {
      var self = this;
      this?.groupsCollection?.ensureFetched().then(() => {
        self.el?.closest(".cs-start-locations")?.classList?.add("smart-np-tree-View");
        if (self.options?.selectView?.options?.leftSelection && self.$el.find(".cs-left-item-" + self?.options?.selectView?.options?.leftSelection).length > 0) {
          self.$el.find(".cs-left-item-" + self.options?.selectView?.options?.leftSelection + " " + ".csui-list-item-title").trigger("click");
          self.options.selectView.options.selectException = undefined;
        }
        this._updateCollectionState();
      });
    },
    _getFocusables: function() {
      var focusables = [];
      let treeitems = this.el?.querySelectorAll(".cs-simpletreelistitem");
      for (var i = 0; i < treeitems?.length; i++) {
        if (!treeitems[i]?.classList?.contains("flatten-tree")) {
          focusables?.push(treeitems[i]);
        }
        focusables?.push(...$(treeitems[i])?.find("li:visible"));
      }
      return focusables;
    }
  });
  return NodeTreeListView;
});