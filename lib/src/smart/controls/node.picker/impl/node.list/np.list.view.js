/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/controls/node.picker/impl/node.list/list.item.view", "smart/controls/progressblocker/blocker", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/behaviors/infinite.scrolling/scrollbar.behavior", "nuc/models/node/node.model", "smart/controls/emptylist/emptylist.view", "hbs!smart/controls/node.picker/impl/node.list/node.list", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/node.picker/impl/node.list/node.list" ], function(_, $, Marionette, Backbone, ListItem, BlockingView, TabableRegion, ScrollBarBehavior, NodeModel, EmptyListView, listTemplate, npLang) {
  "use strict";
  var NodeListView = Marionette.CompositeView.extend({
    className: "cs-list",
    template: listTemplate,
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: npLang.noSearchResultMessage
      };
    },
    templateHelpers: function() {
      var name = this.collection.node && this.collection.node.get("name");
      return {
        searchView: this.options.searchView,
        nodePickerChoices: name ? _.str.sformat(npLang.nodePickerChoicesIn, name) : npLang.nodePickerChoices,
        nodeItemRole: this.options?.treeView ? "tree" : "listbox"
      };
    },
    childViewContainer: ".binf-list-group",
    childView: ListItem,
    childViewOptions: function() {
      return {
        searchView: this.options.searchView,
        locationEle: this.ui.location,
        resolveShortcuts: this.options.resolveShortcuts,
        commandType: this.commandType,
        context: this.options.context,
        getNodeTypeIconView: this.options.getNodeTypeIconView,
        getNodeTypeIconInfo: this.options.getNodeTypeIconInfo,
        nodeLinks: this.options.nodeLinks,
        isMultiSelect: this.commandType.multiSelect,
        isMlDataEnabled: this.options?.isMlDataEnabled,
        multiLingualPopoverMixin: this.options?.multiLingualPopoverMixin,
        metadataLanguages: this.options?.metadataLanguages,
        nodeIndicators: this.options?.nodeIndicators,
        hasTableToolbarView: this.options?.hasTableToolbarView,
        masterView: this.options.masterView,
        secTextAttribute: this.options?.secTextAttribute,
        showInlineActionBar: this.options?.showInlineActionBar,
        toolbarData: this.options?.toolbarData,
        getInlinMenuView: this.options.getInlinMenuView
      };
    },
    childEvents: {
      "before:add:child": "onBeforeAddChild",
      "change:child": "onChangeChild",
      "select:item": "onSelectItem",
      "browse:item": "onBrowseItem",
      "click:location": "onClickLocation"
    },
    ui: {
      listParent: ".list-content",
      list: ".binf-list-group",
      location: ".binf-search-location-group"
    },
    events: {
      keydown: "onKeyInView"
    },
    onBeforeAddChild: function(child) {
      var childModel = child.model, validTarget = this.commandType.validateTarget(childModel), childId = childModel.get("id");
      if (!!this.commandType.multiSelect && this.selectedCountList[childId]) {
        child.selected = true;
      }
      validTarget = validTarget && _.every(this.commandType.unselectableNodes, function(unselectableId) {
        return childId !== unselectableId;
      });
      if (_.isFunction(child.setValidity)) {
        child?.setValidity(validTarget);
      }
    },
    onChangeChild: function(childModel) {
      if (childModel === this.collection) {
        return;
      }
      var child = this.children.findByModel(childModel);
      child.render();
      this.validateAndUpdateChild(child);
    },
    onAddChild: function(child) {
      if (child instanceof ListItem) {
        var id = child.model.get("id");
        if (!this.commandType.multiSelect && this.selectItems[id]) {
          this.selectItems[id] = child;
          this.toggleSelectedChild(child);
        }
        this.validateAndUpdateChild(child);
        if (this.browsedChild && this.browsedChild.model.get("id") === id) {
          this.browsedChild = child;
          this.toggleBrowsedChild(child);
        }
        return true;
      }
    },
    _getTreeNodeForSelectionUpdate: function(nodeId) {
      const treeModel = _.filter(this?.collection?.models, function(node) {
        return node?.childrenCollection?.findWhere({
          id: nodeId
        });
      });
      const childModel = _.filter(treeModel[0]?.childrenCollection?.models, function(childModel) {
        return childModel?.get("id") === nodeId;
      });
      let childView;
      this.children?.each(function(view) {
        if (!!view?.children?.findByModel(childModel[0])) {
          childView = view?.children?.findByModel(childModel[0]);
        }
      });
      return childView;
    },
    toggleNodeSelection: function(nodeId) {
      let child;
      if (this.options?.treeView && this.el?.querySelector(".cs-left-item-" + nodeId)) {
        child = this._getTreeNodeForSelectionUpdate(nodeId);
      } else {
        var model = this.collection.findWhere({
          id: nodeId
        });
        child = model && this.children.findByModel(model);
      }
      child && this.toggleSelectedChild(child);
    },
    shouldDisable: function(node, browsingNode) {
      if (node === undefined) {
        return true;
      }
      if (this.commandType.isActionNode(node)) {
        return true;
      }
      if (this.options.resolveShortcuts && node.get("type") === 1 && node.original !== undefined) {
        return this.shouldDisable(node.original, node);
      }
      return !this.commandType.isSelectable(node) && !this._isBrowsable(browsingNode || node);
    },
    validateAndUpdateChild: function(child) {
      child.$el.addClass("csui-acc-focusable");
      var disable = this.shouldDisable(child.model);
      child.setEnable(!disable);
    },
    collectionEvents: {
      sync: "syncUpdate",
      change: "onChangeChild"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      },
      ScrollBarBehavior: {
        behaviorClass: ScrollBarBehavior
      }
    },
    isTabable: function() {
      return this.children.find(function(view) {
        var $el = view.$el;
        return $el.is(":visible") && !$el.is(":disabled");
      });
    },
    currentlyFocusedElement: function() {
      const focusables = this._getFocusables();
      if (focusables.length) {
        this.focusIndex = $(focusables[this.focusIndex]).length ? this.focusIndex : 0;
        var currentFocusedElement = $(focusables[this.focusIndex]);
        if (currentFocusedElement[0]?.classList?.contains("csui-disabled")) {
          currentFocusedElement[0].setAttribute("aria-disabled", true);
        }
        return currentFocusedElement;
      }
    },
    setFocus: function(focusIndex, checkActiveEl = true) {
      if (this.options?.masterView?.isKeyEvent && !this.options.masterView.options.searchActionPerformed && !this.options.searchOpenedInTreeView) {
        const focusables = this._getFocusables();
        var focusableEle;
        if (!focusables.length) {
          this.options?.masterView?.trigger("focus:in:emptyview");
        }
        if (checkActiveEl && !Array.from(focusables).includes(document.activeElement)) {
          return;
        }
        this.trigger("changed:focus");
        if (focusables[focusIndex || this.focusIndex]) {
          if (focusables[this.focusIndex]?.classList.contains("csui-has-inlineform")) {
            focusableEle = focusables[this.focusIndex]?.querySelector(".smart-edit-input-name");
          } else {
            focusableEle = focusables[focusIndex || this.focusIndex];
          }
          if (focusableEle?.classList?.contains("csui-disabled")) {
            focusableEle.setAttribute("aria-disabled", true);
          }
          focusableEle?.focus();
          if (this.options?.showInlineActionBar && focusableEle.classList.contains("smart-item-standard")) {
            this.$el.find($(focusableEle)).trigger("mouseenter");
          }
        }
      }
    },
    _getFocusables: function() {
      return this.el?.querySelectorAll(".binf-list-group-item.csui-acc-focusable");
    },
    _onFocusinListView: function({
      event,
      element
    }) {
      const listRegion = this.ui.list;
      var self = this;
      this.ui.list.off("focusin").on("focusin", function(e) {
        self.setFocus(self.focusIndex);
      });
      this.ui.list.off("focusout").on("focusout", function(e) {
        if (listRegion[0].contains(element[0])) {
          $(element).trigger("mouseleave");
        }
      });
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, focusables = this._getFocusables(), moved = false;
      $(document.activeElement).trigger("mouseleave");
      switch (keyCode) {
       case 9:
        if (this.options?.showInlineActionBar) {
          this._onFocusinListView({
            event: event,
            element: $(document.activeElement)
          });
        }
        this.$el.trigger("tabNextRegion");
        break;

       case 38:
       case 40:
        if (document.activeElement.closest(".csui-has-inlineform")) {
          moved = false;
          event.preventDefault();
        } else {
          if (keyCode === 38) {
            this.focusIndex > 0 && --this.focusIndex;
          } else {
            this.focusIndex < focusables.length - 1 && ++this.focusIndex;
          }
          moved = true;
        }
        break;

       case 35:
        this.focusIndex = this.collection.length - 1;
        moved = true;
        break;

       case 36:
        this.focusIndex = 0;
        moved = true;
        break;
      }
      if (moved) {
        event.preventDefault();
        this.trigger("changed:focus");
        var focusableEle;
        if (focusables[this.focusIndex]?.classList.contains("csui-has-inlineform")) {
          focusableEle = focusables[this.focusIndex].querySelector(".smart-edit-input-name");
        } else {
          focusableEle = focusables[this.focusIndex];
        }
        focusableEle.focus();
        if (this.options?.showInlineActionBar) {
          $(focusableEle).trigger("mouseenter");
        }
      }
    },
    constructor: function NodeListView(options = {}) {
      this.options = options;
      _.defaults(options, {
        pageSize: 30
      });
      this.selectedCountList = options.selectedCountList;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.jQuery = $;
      BlockingView.imbue(this);
      this.selectItems = _.extend({}, options.selection, options.masterView.selectedItems);
      this.blockScroll = true;
      this.notFetching = true;
      this.init = true;
      this.nextCollectionPage = _.bind(this.addNextCollectionPage, this);
      this.commandType = options.commandType;
      this.focusIndex = 0;
      this.selectException = options.selectException;
      this.listenTo(this.collection, "sync reset", this.syncCollectionState);
      this.listenTo(this.collection, "request", this.setBlocker);
      this.listenTo(this.collection, "error", this.stopBlocker);
      this.listenTo(this.collection, "reset", this.setBlocker);
      this.listenTo(this.options?.masterView, "update:checkbox", this.updateCheckboxes);
      this.listenTo(this.options?.masterView, "browse:complete", function() {
        this.notFetching = true;
      });
      this.listenTo(this.options.selectView, "selection:change", _.bind(this._handleSelectionChange, this));
      this.listenTo(this.options?.masterView, "toggle:collection:state", this.syncCollectionState);
    },
    _handleSelectionChange: function(args) {
      if (this.options?.searchView) {
        this.ui?.list[0]?.setAttribute("aria-label", _.str.sformat(npLang.nodePickerChoicesIn, _.str.sformat(npLang.searchResults, this.options?.searchTitleName) || ""));
      } else {
        this.ui?.list[0]?.setAttribute("aria-label", _.str.sformat(npLang.nodePickerChoicesIn, args?.containerName || ""));
      }
    },
    onRender: function() {
      if (this.collection?.length && this.commandType?.multiSelect) {
        this.$el.find(".list-content .binf-list-group")?.attr("aria-multiselectable", true);
        this.options?.masterView?.trigger("update:checkbox", {
          modelId: ""
        });
      }
      this.setFocus();
    },
    syncCollectionState: function() {
      const showAllTypes = this?.options?.showAllTypes ?? false;
      if (!this?.options?.searchView && !showAllTypes) {
        this.filterSelectables();
      }
      if (this.collection.length === 0) {
        this.$el.find(".binf-list-group").addClass("csui-no-results");
        this.$el.find(".list-content")[0]?.classList.remove("csui-normal-scrolling");
        this.$el.find(".list-content")[0]?.classList.add("smart-list-empty");
        this.updateSearchHeaderAnnouncement();
      } else {
        this.$el.find(".binf-list-group").removeClass("csui-no-results");
        this.$el.find(".list-content")[0]?.classList.add("csui-normal-scrolling");
        this.$el.find(".list-content")[0]?.classList.remove("smart-list-empty");
        this.updateSearchHeaderAnnouncement();
        this.setFocus(this.focusIndex, false);
      }
      if (this.commandType.multiSelect) {
        this.$el.find(".list-content .binf-list-group").attr("aria-multiselectable", true);
        this.options?.masterView?.trigger("update:checkbox", {
          modelId: ""
        });
      }
    },
    getResolvedModel: function(model) {
      if (this?.options?.resolveShortcuts && model?.get("type") === 1 && model?.original !== undefined) {
        model = model.original;
      }
      return model;
    },
    filterSelectables: function() {
      const initialCollection = this?.collection?.models;
      const unselectableCollection = initialCollection.filter(model => {
        if (model?.childrenCollection) {
          const childCollection = model?.childrenCollection?.models;
          const unselectableChildColl = childCollection.filter(childModel => {
            if (!this?.options?.commandType?.validateNode(this?.getResolvedModel(childModel))) {
              return childModel;
            }
          });
          model?.childrenCollection?.remove(unselectableChildColl);
        } else {
          if (!this?.options?.commandType?.validateNode(this?.getResolvedModel(model))) {
            return model;
          }
        }
      });
      this?.collection?.remove(unselectableCollection);
    },
    updateSearchHeaderAnnouncement: function() {
      this.options?.searchView && this.options?.masterView?.searchHeaderView.trigger("update:header:text");
    },
    updateCheckboxes: function({
      modelId
    }) {
      var startLocations, slideMidLeft;
      !!modelId && this.toggleNodeSelection(modelId);
      if (this.$el.parents(".cs-start-locations").find(".smart-icon-checkbox-selected").length) {
        startLocations = true;
      }
      if (this.$el.parents(".cs-start-locations").find(".smart-icon-checkbox-selected").length || startLocations && this.collection?.filters?.name) {
        this.$el.parents(".cs-start-locations").find(".cs-list .csui-selectable").addClass("csui-show-checkbox");
      } else {
        startLocations = false;
        this.$el.parents(".cs-start-locations").find(".cs-list .csui-selectable").removeClass("csui-show-checkbox");
      }
      if (this.$el.parents(".csui-slideMidLeft").find(".smart-icon-checkbox-selected").length) {
        slideMidLeft = true;
      }
      if (this.$el.parents(".csui-slideMidLeft").find(".smart-icon-checkbox-selected").length || slideMidLeft && this.collection.filters.name) {
        this.$el.parents(".csui-slideMidLeft").find(".cs-list .csui-selectable").addClass("csui-show-checkbox");
      } else {
        slideMidLeft = false;
        this.$el.parents(".csui-slideMidLeft").find(".cs-list .csui-selectable").removeClass("csui-show-checkbox");
      }
    },
    onClickLocation: function(listItem) {
      this.options?.masterView.trigger("open:location", listItem?.model?.parent);
    },
    syncUpdate: function() {
      this.nextTriggerSetting = this.options.pageSize / 2;
      this.blockScroll = true;
      this.notFetching = true;
      this.init = true;
      if (this.browsedChild && !this.collection.findWhere({
        id: this.browsedChild.model.get("id")
      })) {
        this.browsedChild = undefined;
      }
      this.unblockActions();
      this.confirmSelectionList();
      this.trigger("dom:refresh");
    },
    reset: function() {
      this.init = true;
    },
    stopBlocker: function() {
      this.unblockActions();
      return true;
    },
    setBlocker: function() {
      if (this.blockScroll) {
        this.blockScroll = false;
        this.blockActions();
      }
      return true;
    },
    addNextCollectionPage: function(event, args) {
      var collectionLength = this.collection.length, scrollableHeight = this.ui.list.height() - this.ui.listParent.height(), scrollRelativePos = this.ui.listParent.scrollTop() / scrollableHeight, nextJump = (collectionLength - this.nextTriggerSetting) / collectionLength;
      if (collectionLength < this.collection.totalCount && scrollRelativePos >= nextJump) {
        var self = this;
        if (this.notFetching) {
          this.notFetching = false;
          this.options?.fetchCollectionOnScroll(this)?.done(function() {
            if (self.options.resolveShortcuts) {
              var nodesToResolve = self.collection.filter(function(node, index) {
                return index >= collectionLength && self.commandType.shouldResolveShortcut(node);
              });
              self.resolveShortcuts(nodesToResolve);
            }
          });
        }
        if (scrollRelativePos > .98 && this.init) {
          this.setBlocker();
          this.init = false;
        }
      }
    },
    resolveShortcuts: function(collection) {
      var self = this, shortcutDeferreds = [];
      if (!self.options.resolveShortcuts) {
        return $.Deferred().resolve();
      }
      collection.filter(self.commandType.shouldResolveShortcut).forEach(function(node) {
        var originalId = node.original !== undefined ? node.original.get("id") : node.original_id;
        var original = new NodeModel({
          id: originalId
        }, {
          connector: node.connector
        });
        shortcutDeferreds.push(original.fetch().done(function() {
          node.original = original;
          node.trigger("change", node);
        }));
      });
      return $.whenAll.apply($, shortcutDeferreds);
    },
    onDomRefresh: function() {
      if (!this.scrollBar) {
        this.scrollBar = this.ui.listParent;
        this.scrollBar.on("scroll", this.nextCollectionPage);
      }
      this.setFocus();
    },
    onSelectItem: function(child) {
      var selectable = this.commandType.isSelectable(child.getResolvedModel());
      Backbone.trigger("closeToggleAction");
      this.selectItem = true;
      if (child.$el.hasClass("csui-disabled")) {
        return;
      }
      if (this.options.searchView) {
        this.childView = ListItem;
      } else {
        this.options.searchView = false;
        child.options.searchView = false;
      }
      if (this.notFetching) {
        this.notFetching = false;
        if (selectable) {
          this._targetSelection(child);
        } else {
          this.notFetching = true;
        }
      }
      if (this.options?.masterView?.isKeyEvent) {
        var clickedFocusables = this._getFocusables();
        this.focusIndex = $(clickedFocusables)?.index(child.el);
        this.trigger("changed:focus");
        $(clickedFocusables[this.focusIndex])?.trigger("focus");
      }
      if (this.commandType.multiSelect) {
        this.options?.masterView?.trigger("update:checkbox", {
          modelId: ""
        });
      }
    },
    onBrowseItem: function(child) {
      Backbone.trigger("closeToggleAction");
      if (child.$el.hasClass("csui-disabled")) {
        return;
      }
      if (this.options.searchView) {
        this.childView = ListItem;
        if (child.getResolvedModel().get("container")) {
          this.el.querySelectorAll(".csui-node-picker .smart-location-group").forEach(el => {
            el?.classList.add("binf-hidden");
          });
          this.el.closest(".csui-node-picker")?.querySelectorAll(".csui-search-item-right-panel")?.forEach(el => {
            el?.classList.add("binf-hidden");
          });
        }
      } else {
        this.options.searchView = false;
        child.options.searchView = false;
        child.options.treeView = false;
      }
      var browseable = this._isBrowsable(child.model);
      if (this.notFetching) {
        if (browseable && !child.browsed) {
          if (!this.commandType.multiSelect && (!child.selected || child.selected && child.browsed)) {
            if (child === this.browsedChild) {
              this.onSelectItem(child);
            }
          }
          this.notFetching = false;
          if (this.options?.searchView) {
            this.options.masterView.setGrid = true;
            this.options.masterView?.trigger("enable:grid", true);
          }
          this._browseSelection(child);
        } else {
          this.notFetching = true;
        }
        child.$el.trigger("blur");
      }
      this.$el.trigger("setCurrentTabFocus");
      return true;
    },
    clearSelect: function() {
      var self = this;
      _.each(this.selectItems, function(item) {
        item.model.isSelected = false;
        self.toggleSelectedChild(item);
      });
      this.selectItems = {};
      return true;
    },
    toggleSelectedChild: function(child) {
      if (this.commandType.isSelectable(child.getResolvedModel())) {
        child.toggleSelect();
      }
    },
    toggleBrowsedChild: function(child) {
      child && child.toggleBrowse();
    },
    confirmSelectionList: function() {
      _.each(this.selectItems, function(node, id) {
        var itemModel = _.find(this.collection.models, function(model) {
          return model.get("id").toString() === id;
        });
        if (!itemModel && !this.commandType.multiSelect) {
          delete this.selectItems[id];
          this.trigger("selection:change", {
            node: this._getNodeForSelection(node),
            add: false
          });
        }
      }, this);
    },
    _isBrowsable: function(node) {
      return this.commandType.browseAllowed(node);
    },
    _targetSelection: function(child) {
      var model = this._getNodeForSelection(child), childId = model.get("id"), prevSelected = child.isSelected();
      if (prevSelected) {
        this.toggleSelectedChild(child);
        delete this.selectItems[childId];
      } else {
        if (!this.commandType.multiSelect) {
          this.clearSelect();
        }
        this.selectItems[childId] = child;
        this.toggleSelectedChild(child);
      }
      this.trigger("selection:change", {
        node: model,
        add: !prevSelected,
        targetEl: child.$el
      });
      this.notFetching = true;
    },
    _browseSelection: function(child) {
      var node = child.getResolvedModel(), browsable = this.commandType.browseAllowed(child.model), selectable = this.commandType.isSelectable(node), alreadyBrowsed = child.isBrowsed(), alreadySelected = child.isSelected(), addToSelection = false;
      if (browsable) {
        this._browseItem(child);
      } else {
        this.toggleBrowsedChild(child);
      }
      this.options.searchView = false;
      child.options.searchView = false;
      this._browse(child, addToSelection);
    },
    _browse: function(child, addToSelection) {
      if (child === this.browsedChild) {
        this.notFetching = true;
        return;
      }
      var self = this;
      this.browsedChild && this.browsedChild.toggleBrowse();
      this.browsedChild = child;
      this.trigger("browse:select", {
        node: child.getResolvedModel(),
        add: addToSelection
      });
    },
    _SelectItem: function(child) {
      var childId = this._getNodeForSelection(child).get("id");
      if (!this.commandType.multiSelect) {
        this.clearSelect();
      }
      this.selectItems[childId] = child;
      child.assignedSelect();
    },
    _browseItem: function(child) {
      child.assignedBrowse();
    },
    _getNodeForSelection: function(child) {
      var node = child.model;
      if (this.options.resultOriginalNode && child.model.original != null) {
        node = child.model.original;
      }
      return node;
    }
  });
  return NodeListView;
});