/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/behaviors/default.action/default.action.behavior", "csui/controls/list/behaviors/list.view.keyboard.behavior", "csui/controls/list/list.view", "csui/controls/node-type.icon/node-type.icon.view", "dctmw/controls/behaviors/clientside.infinite.scrolling.behavior", "d2/widgets/task.details/impl/task.files.list/task.files.list.item.view", "i18n!d2/widgets/task.details/impl/nls/lang", "hbs!d2/widgets/task.details/impl/task.files.list/task.files.list", "css!d2/widgets/task.details/impl/task.files.list/task.files.list" ], function(_, $, Backbone, DefaultActionBehavior, ListViewKeyboardBehavior, ListView, NodeTypeIconView, ClientSideInfiniteScrollingBehavior, TaskFilesListItem, lang, template) {
  "use strict";
  var oldrefreshTabableElements = ListViewKeyboardBehavior.prototype.refreshTabableElements;
  var TaskFilesListView = ListView.extend({
    className: "d2-task-files-list cs-list tile content-tile",
    template: template,
    childView: TaskFilesListItem,
    behaviors: {
      InfiniteScrolling: {
        behaviorClass: ClientSideInfiniteScrollingBehavior,
        contentParent: "> .tile-content",
        content: ".d2-task-files-list-item",
        fetchMoreItemsThreshold: 95,
        fetchMoreItemLength: 15
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    childViewOptions: function() {
      var multipackage = this.collection.node.get("packages") && this.collection.node.get("packages").length > 1 ? true : false;
      var pcks = this.collection.node.get("packages");
      return {
        filesListView: this,
        checkDefaultAction: true,
        toolbarData: {
          toolbaritems: this.toolbarItems,
          toolbarItemsMasks: this.toolbarItemsMasks
        },
        context: this.context,
        parentModel: this.collection.node || this.originatingView.collection.node,
        tabModel: this.originatingView.model,
        originatingView: this.originatingView,
        templateHelpers: function() {
          var ismandatory = false;
          var me = this;
          if (this.model && this.model.get("package-obj") && pcks) {
            var selpck = pcks.filter(function(pck) {
              return pck.name === me.model.get("package-obj").name;
            });
            ismandatory = selpck[0]["is_mandatory"];
          }
          return {
            enableIcon: true,
            name: this.model.get("name") || this.model.get("object_name"),
            showRelationCount: this.model.get("relations_count"),
            relation: lang.labelRelations,
            text: lang.emptyFilesListLabel,
            pckNode: !this.model.get("name") && this.model.get("package-obj") ? true : false,
            packageName: this.model.get("package-obj") && this.model.get("package-obj").name,
            pckName: this.model.get("name") && this.model.get("package"),
            multipackage: multipackage,
            ismandatory: ismandatory
          };
        }
      };
    },
    childEvents: {
      "selection:changed": "nodeSelectionUpdated",
      "click:item": "onClickItem",
      render: "onRenderItem"
    },
    constructor: function TaskFilesListView(options) {
      options = options || {};
      this.context = options.context;
      this.collection = options.collection || new Backbone.Collection();
      this.selectedNodes = new Backbone.Collection();
      this.additionalPanelsView = options.additionalPanelsView;
      this.originatingView = options.originatingView;
      this.toolbarItems = options.toolbarItems;
      this.toolbarItemsMasks = options.toolbarItemsMasks;
      ListView.prototype.constructor.apply(this, arguments);
      this._onTabKey = function() {
        return;
      };
      this.keyboardBehavior.refreshTabableElements = function() {
        oldrefreshTabableElements.apply(this, arguments);
        this.view.selectedIndex = 0;
      };
      this.listenTo(this, "collection:scroll:fetch", _.bind(function() {
        this.$el.find(".tile-content").perfectScrollbar("update");
        this._loadMoreItemsAvailableIfNoScroll();
      }, this));
      this.listenTo(this.additionalPanelsView, "activate:tab", _.bind(this._resetScroll, this));
      this.listenTo(this.additionalPanelsView, "d2:refresh:task:attachment", _.bind(this._refreshNodes, this));
      this.listenTo(this.context, "d2:objects:deleted", _.bind(this._onDeleteTaskDocuments, this));
      this.listenTo(this.context, "d2:objects:unreserved", _.bind(this._triggerRefreshOnNodeIds, this));
      this.listenTo(this.collection, "d2:add:relation", _.bind(this._triggerRefreshOnNodeIds, this));
      $(window).on("resize", _.bind(this._loadMoreItemsAvailableIfNoScroll, this));
    },
    nodeSelectionUpdated: function(childView, isChecked) {
      var id = childView.model.get("id");
      if (isChecked) {
        if (!this.selectedNodes.get(id)) {
          this.selectedNodes.add(childView.model);
        }
      }
      if (isChecked == false) {
        var nodeToRemove = this.selectedNodes.findWhere({
          id: id
        });
        if (nodeToRemove) {
          this.selectedNodes.remove(nodeToRemove);
        }
      }
      this.trigger("selectedNodes");
    },
    getSelectedChildren: function() {
      return this.selectedNodes.models;
    },
    _refreshNodes: function(originatingView, refreshNodeIds) {
      if (this !== originatingView && this.collection) {
        this.collection.each(function(node) {
          if (_.contains(refreshNodeIds, node.get("id"))) {
            node._expanded = false;
            node.fetch({
              force: true
            });
          }
        });
      }
    },
    _triggerRefreshOnNodeIds: function(nodeIds) {
      this._refreshNodes(null, nodeIds);
    },
    onShow: function() {
      this._loadMoreItemsAvailableIfNoScroll();
    },
    _loadMoreItemsAvailableIfNoScroll: function() {
      if (this.collection.length < this.collection.totalCount) {
        var contentParent = this.$el.find(".tile-content");
        contentParent && contentParent.trigger && contentParent.trigger("scroll");
      }
    },
    _onDeleteTaskDocuments: function() {
      if (!this.originatingView) {
        return;
      }
      this.originatingView.trigger("highlight", false);
      this.selectedIndex >= 0 && (this.selectedIndex = -1);
      this.getElementByIndex(0) && this.getElementByIndex(0).prop("tabindex", "0");
      this.originatingView.collection && this.originatingView.collection.fetch({
        reload: true
      });
    },
    onClickItem: function(target) {
      if (this.options.isTaskDetailsWithContent) {
        this.options.originatingView?.options?.originatingView?.taskDetailsView?.trigger("add:mini:viewer", target.model);
      } else {
        this.triggerMethod("execute:defaultAction", target.model);
      }
    },
    onRender: function() {
      var firstItem = this.getElementByIndex(0);
      firstItem && firstItem.prop("tabindex", "0");
      this.selectedIndex !== -1 && (this.selectedIndex = -1);
      this.$el.find(".tile-content").on("scroll", _.bind(function() {
        this.trigger("d2:files:list:scroll");
      }, this));
    },
    onRenderItem: function(childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$(".csui-type-icon").get(0),
        node: childView.model
      });
      childView._nodeIconView.render();
      childView.model.on("sync delayed:data:update", function() {
        if (!childView.isDestroyed) {
          childView.render();
        }
      });
    },
    _resetScroll: function(tabContent, tabPane) {
      if (tabPane.content === this.originatingView) {
        this.$el.find(".tile-content").scrollTop(0);
        this.originatingView && this.originatingView.trigger("highlight", false);
        var resetflag = false;
        if (tabPane.content && tabPane.content.model.get("name") === "working") {
          resetflag = true;
        }
        this.originatingView.additionalPanelsView.trigger("update:tab:header", this.model, _.str.sformat(lang.titleAdditionalPanelAttachments, length));
        this.originatingView && this.originatingView.collection.fetch({
          reset: resetflag
        });
        this._loadMoreItemsAvailableIfNoScroll();
      }
      this.trigger("activate:tab");
    }
  });
  return TaskFilesListView;
});