/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/pub.sub", "csui/controls/list/list.view", "csui/controls/listitem/listitemstandard.view", "csui/controls/listitem/simpletreelistitem.view", "csui/controls/list/behaviors/list.view.keyboard.behavior", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/progressblocker/blocker", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/collection.state/collection.state.behavior", "csui/utils/commands", "dctmw/controls/behaviors/defer.dataload.until.visible.behavior", "d2/controls/query.form/query.form.dialog", "dctmw/controls/list/list.state.view", "d2/widgets/savedsearch/savedsearch.factory", "d2/widgets/savedsearch/savedsearch.groups.factory", "d2/widgets/savedsearch/savedsearch.model", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/utils/constants", "d2/widgets/widgettile/widgettile.view", "i18n!d2/widgets/savedsearch/impl/nls/lang", "css!d2/widgets/savedsearch/impl/savedsearch" ], function($, _, Backbone, Marionette, PubSub, ListView, StandardListItem, SimpleTreeListView, ListViewKeyboardBehavior, NodeTypeIconView, BlockingView, DefaultActionBehavior, TabableRegionBehavior, CollectionStateBehavior, commands, DeferredDataLoadBehavior, QueryFormDialog, ListStateView, SavedSearchCollectionFactory, SavedSearchGroupsCollectionFactory, SavedSearchCollection, RestResources, RestLinkRels, utils, constants, WidgetTileView, lang) {
  "use strict";
  return WidgetTileView.extend({
    getChildView: function() {
      return SimpleTreeListView;
    },
    childViewOptions: {
      templateHelpers: function() {
        return {
          icon: "csui-icon d2-icon-search-group",
          name: this.model.get("name"),
          ariaName: lang.savedSearchGroupAria + " " + this.model.get("name"),
          expand: this.model.searchMode
        };
      },
      childViewTemplateHelpers: function() {
        return {
          icon: this.model.get("icon"),
          enableIcon: true,
          name: this.model.get("name"),
          text: lang.emptyGroupDefaultText
        };
      },
      checkDefaultAction: true
    },
    childEvents: {
      "click:item": "_onClickItem",
      "click:tree:item": "_onClickTreeItem",
      "click:tree:header": "_onClickTreeHeader",
      render: "onRenderItem",
      "before:destroy": "onBeforeDestroyItem"
    },
    constructor: function SavedSearchView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options.showTitleIcon = options.data.showTitleIcon;
      options.lang = lang;
      this.completeCollection = options.collection || options.context.getCollection(SavedSearchGroupsCollectionFactory, {
        detached: true,
        permanent: true
      });
      this.listenTo(PubSub, "d2:savedsearch:collection:sync", _.bind(function() {
        this.completeCollection.fetch({
          reload: true,
          skipSWCache: true
        }).done(_.bind(this._synchronizeCollections, this));
      }, this));
      var ViewCollection = Backbone.Collection.extend({
        model: this.completeCollection.model
      });
      options.collection = new ViewCollection();
      options.cssClass = "cs-savedsearch";
      this.behaviors = _.extend({}, _.omit(WidgetTileView.prototype.behaviors, "LimitedList"));
      this.disableAppScopeBehavior = true;
      WidgetTileView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.completeCollection, "update sync", _.bind(this._synchronizeCollections, this));
      var me = this;
      var restoreOrigFetch = false;
      var namedSessionStorage = utils.getSessionStore(constants.StorageKey.WIDGET_CONTEXT);
      if (namedSessionStorage.get("WidgetReload")) {
        restoreOrigFetch = true;
      }
      this.completeCollection.fetch({
        reload: true,
        skipSWCache: true,
        restoreOrigFetch: restoreOrigFetch
      }).done(function() {
        me._synchronizeCollections();
        namedSessionStorage.remove("WidgetReload");
      });
      this.listenTo(this, "render", this._onRender);
      this.listenTo(this, "change:filterValue", this._synchronizeCollections);
      BlockingView.imbue(this);
      this.disableItemClick = false;
    },
    onClickOpenPerspective: function() {
      this.context.viewStateModel.setViewState("widget_name", this.options.widgetName);
      this.context.viewStateModel.set("enabled", true);
      this.applicationScopeModel.set("id", this.options.applicationScope);
    },
    _onRender: function() {
      this._updateAccAttributes();
    },
    _updateAccAttributes: function() {
      this.$el.find(".tile-content").removeAttr("role aria-expanded");
      this.$el.find(".tile-content > .binf-list-group").removeAttr("role");
      this.$el.find(".tile-content").attr("aria-label", this.options.data.title || lang.dialogTitle);
      this.$el.find(".tile-content").attr("role", "tree").attr("aria-expanded", "true");
      this.$el.find(".tile-content > .binf-list-group").attr("role", "group");
    },
    onRenderCollection: function() {
      this._updateAccAttributes();
    },
    _executeSearch: function(src) {
      if (this.disableItemClick === true) {
        return;
      }
      this.disableItemClick = true;
      var savedSearchLabel = src.model.get("label");
      var savedSearchId = src.model.get("r_object_id");
      var isQueryFormSearch = src.model.get("r_object_type") === "d2_queryform_config";
      var links = src.model.get("links");
      if (isQueryFormSearch) {
        this._openQueryFormDialog(savedSearchId, savedSearchLabel, links);
      } else {
        this._executeSavedSearch(src.model);
      }
    },
    _onClickItem: function(target, src) {
      this._executeSearch(src);
    },
    _onClickTreeItem: function(target, src) {
      this._executeSearch(src);
    },
    _executeSavedSearch: function(savedSearchNode) {
      var runSavedSearchCommand = commands.get("D2-RunSavedSearch");
      runSavedSearchCommand.execute({
        nodes: new Backbone.Collection([ savedSearchNode ]),
        context: this.options.context
      });
    },
    _openQueryFormDialog: function(savedSearchId, savedSearchName, links) {
      delete this.options.context.queryform;
      var options = {
        savedSearchName: savedSearchName,
        savedSearchId: savedSearchId,
        context: this.options.context,
        connector: this.completeCollection.connector,
        links: links
      };
      var self = this;
      var qdialog = new QueryFormDialog(options);
      qdialog.show().finally(function() {
        self.disableItemClick = false;
      });
    },
    _onClickTreeHeader: function() {
      this.trigger("update:scrollbar");
    },
    _synchronizeCollections: function() {
      var self = this;
      var connector = this.completeCollection.connector;
      var savedSearchCollection;
      var filterObj = {
        name: this.options.filterValue
      };
      var searchMode = this.isSearchOpen();
      var groups = new Backbone.Collection();
      var promises = [];
      _.each(this.completeCollection.models, function(group) {
        savedSearchCollection = new SavedSearchCollection(undefined, {
          connector: connector
        });
        savedSearchCollection.reset(group.savedsearch.models);
        savedSearchCollection.setFilter(filterObj);
        var groupModel = new Backbone.Model(group.attributes);
        groupModel.childrenCollection = savedSearchCollection;
        groupModel.searchMode = searchMode;
        (groupModel.get("tab_id") === -1 || groupModel.get("tab_id") === 0) && groupModel.set("flatten", true);
        groups.add(groupModel);
        if (self.options.filterValue && self.options.filterValue.length > 0) {
          var deferred = $.Deferred();
          promises.push(deferred.promise());
          self.listenTo(savedSearchCollection, "sync", function() {
            if (groupModel.childrenCollection.length === 0) {
              groups.remove(groupModel);
            }
            deferred.resolve();
          });
        }
      });
      if (self.options.filterValue && self.options.filterValue.length > 0) {
        $.when.apply($, promises).then(function() {
          self.collection.reset(groups.models);
        });
      } else {
        self.collection.reset(groups.models);
      }
    },
    getElementByIndex: function(index, event) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var childView = this.children.findByIndex(index);
      if (childView && childView.currentlyFocusedElement) {
        return childView.currentlyFocusedElement(event);
      } else {
        return null;
      }
    }
  });
});