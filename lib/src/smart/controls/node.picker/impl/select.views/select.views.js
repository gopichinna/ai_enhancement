/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "i18n!smart/controls/node.picker/impl/nls/lang", "nuc/models/node/node.model", "smart/controls/node.picker/impl/select.view/select.view", "smart/controls/globalmessage/globalmessage", "hbs!smart/controls/node.picker/impl/select.views/selectviews", "smart/mixins/view.events.propagation/view.events.propagation.mixin", "smart/lib/binf/js/binf", "css!smart/controls/node.picker/impl/select.views/selectviews", "css!smart/controls/node.picker/impl/select.views/slider" ], function($, _, Marionette, lang, NodeModel, SelectView, GlobalMessage, template, ViewEventsPropagationMixin) {
  "use strict";
  var SelectViews = Marionette.ItemView.extend({
    className: "csui-select-lists",
    template: template,
    constructor: function SelectViews(options) {
      options || (options = {});
      _.defaults(options, {
        pageSize: 30
      });
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.selectedCountList = options.selectedCountList;
      this.commandType = options.commandType;
      this.selectableTypes = this.commandType.getSelectableNodeTypes();
      this.listTypes = _.isEmpty(this.selectableTypes) ? [] : _.contains(this.selectableTypes, -1) ? this.selectableTypes : _.union(this.selectableTypes, [ -1 ]);
      this.leftView = this.rightView = null;
      this.invalidNodes = [];
      this.connector = options.connector;
      this.listenTo(this.options?.masterView, "toggle:thumbnail:view", this._toggleGridView);
      let self = this;
      this.listenTo(this, "before:destroy", function() {
        self.rightView && self.rightView.trigger("destroy");
        self.leftView && self.leftView.trigger("destroy");
      });
    },
    onRender: function() {
      var self = this;
      this.updateModelState();
      this.setLeftOnly().done(function() {
        if (self.options.leftSelection && self.$el.find(".cs-left-item-" + self.options.leftSelection).length > 0) {
          self.$el.find(".cs-left-item-" + self.options.leftSelection + " " + ".csui-list-item-title").trigger("click");
          self.options.selectException = undefined;
        }
      });
      if (this.leftView) {
        this.leftView.render();
      }
      if (this.rightView) {
        this.rightView.render();
      }
    },
    onDomRefresh: function() {
      this.leftView && this.leftView.triggerMethod("dom:refresh", this.leftView);
      if (this.rightView) {
        this.rightView.triggerMethod("dom:refresh", this.rightView);
      }
    },
    onDestroy: function() {
      this.leftView && this.leftView.destroy();
      this.rightView && this.rightView.destroy();
    },
    onShow: function() {
      this.leftView.triggerMethod("show");
      if (this.rightView) {
        this.rightView.triggerMethod("show");
      }
    },
    setParentNodeAsTarget: function(node) {
      var self = this;
      node.on("sync", function() {
        self.setParentNodeAsTarget(node);
        self.options?.masterView?.trigger("change:complete", node);
      });
      var selectable = this.commandType.isSelectable(node);
      this.rightView && this.rightView.clearSelect();
      if (!this.commandType.multiSelect) {
        this.leftView && this.leftView.setNewSelect(node, true);
      }
      return selectable;
    },
    getSelection: function() {
      var retVal = {}, rightSelection = this.rightView ? this.rightView.selectList : {}, leftSelection = this.leftView.selectList;
      _.extend(retVal, leftSelection, rightSelection);
      return retVal;
    },
    getNumberOfSelectItems: function() {
      var totalCount = this.leftView?.getNumberOfSelectItems();
      if (this.rightView) {
        totalCount += this.rightView.getNumberOfSelectItems() || 0;
      }
      return totalCount;
    },
    leftNodeId: function() {
      var container = this.leftView.container;
      return container ? container.get("id") : -1;
    },
    setLeftOnly: function() {
      var left = this._setView(-1, "cs-start-locations left-only", this.options.searchView, false, this.options), node = left.view.container, self = this;
      left.promise.done(function() {
        if (node && !self.commandType.multiSelect) {
          self.leftView.addFolderSelection(node);
        }
        if (self.options.searchView) {
          self.trigger("update:searchHeader", this);
        }
        if (self.options.targetBrowseHistory.length === 0 && self.options.searchView) {
          self.options.targetBrowseHistory.push([ "location", self.options.previousLocation.id ]);
        }
        if (self.options.targetBrowseHistory.length > 0) {
          self.showBackButton();
        } else if (self.options.targetBrowseHistory.length > 1 || self.options.targetBrowseHistory.length === 1 && self.options.navigateFromHistory) {
          self.showBackButton();
        }
      }).fail(function(resp) {
        self.forceClose(resp);
      });
      if (this.options?.masterView?.isGridView()) {
        left.view.el.classList.add("smart-np-gridview");
        this.leftView = left.view;
      } else {
        this.leftView = left.view;
      }
      return left.promise;
    },
    forceClose: function(resp) {
      this._displayAlert(resp);
      this.trigger("close");
    },
    newLeftView: function(node, pageSize) {
      var newId = node.get("id"), self = this;
      this.options.pageSize = pageSize;
      return this._drillUp(newId).done(function(view) {
        if (self.options?.masterView?.isGridView()) {
          view.el.classList.add("smart-np-gridview");
        }
        self.leftView = view;
        if (!self.commandType.multiSelect) {
          self.leftView.addFolderSelection(node);
        }
        self.onDomRefresh();
        if (self.options.targetBrowseHistory.length === 0) {
          var page = Math.floor((self.leftView.collection.skipCount || 0) / self.leftView.collection.topCount) + 1, pageSize = parseInt(self.leftView.collection.topCount) * parseInt(page);
          var nodeObj = {
            leftId: self.leftView && self.leftView.container ? self.leftView.container.get("id") : node.parent ? node.parent.get("id") : undefined,
            rightId: self.rightView && self.rightView.container ? self.rightView.container.get("id") : undefined,
            pageSize: pageSize
          };
        }
      }).fail(function(resp) {
        self._displayAlert(resp);
      });
    },
    onSelectionChange: function(args, view) {
      var isRightView = view && this._isRightView(view);
      if (args && args.add && !this.commandType.multiSelect) {
        if (isRightView) {
          this.leftView?.clearSelect();
        } else {
          this.rightView && this.rightView?.clearSelect();
        }
      }
      if (view.options.searchView) {
        if (args.node.get("container") && args.add) {
          this.trigger("update:searchHeader", args.node);
          this.options?.masterView?.trigger("change:complete", args.node, args.add);
        } else {
          this.options?.masterView?.trigger("change:complete", args.node, args.add);
        }
      } else {
        this.options?.masterView?.trigger("change:complete", args.node, args.add);
      }
      return true;
    },
    onBrowse: function(view, args) {
      var isRightView = this._isRightView(view), promise = null;
      this.options?.masterView?.trigger("changing:selection");
      if (!this.options?.masterView?.isGridView()) {
        if (isRightView) {
          promise = this.selectRight(args);
        } else {
          promise = this.selectLeft(args);
        }
      } else {
        promise = this.selectGrid(args);
      }
      promise.done(function() {
        view.options?.masterView?.trigger("browse:complete");
      }).fail(function() {
        view.clearSelect();
      });
      return promise;
    },
    selectLeft: function(args, view) {
      var self = this, replaceView = "right";
      if (this.options.searchView) {
        this.options.targetBrowseHistory.push([ "search", this.options.query.clone() ]);
      }
      return this._runSelection(args, ".cs-pane-view", replaceView).done(function(view) {
        if (view) {
          self.rightView = view;
          self.onDomRefresh();
        }
      });
    },
    selectRight: function(args, view) {
      var self = this, replaceView = "left", page = Math.floor((this.leftView.collection.skipCount || 0) / this.leftView.collection.topCount) + 1, pageSize = parseInt(this.leftView.collection.topCount) * parseInt(page), browsedChild = this.leftView.listView.browsedChild;
      if (this.options.targetBrowseHistory.length === 0) {
        var locationObj = {
          leftId: this.options.previousLocation.id,
          rightId: browsedChild ? browsedChild.model.get("id") : undefined,
          pageSize: pageSize
        };
        this.options.targetBrowseHistory.push([ "location", locationObj ]);
      } else if (this.options?.targetBrowseHistory[this.options?.targetBrowseHistory?.length - 1][0] !== "search") {
        var nodeObj = {
          leftId: browsedChild ? browsedChild.model.parent.get("id") : undefined,
          rightId: browsedChild ? browsedChild.model.get("id") : undefined,
          pageSize: pageSize
        };
        this.options.targetBrowseHistory.push([ "node", nodeObj ]);
      }
      return this._runSelection(args, ".csui-panel.cs-start-locations", replaceView).done(function(newView) {
        if (newView) {
          self.leftView = self.rightView;
          self.rightView = newView;
          self.onDomRefresh();
          self.showBackButton();
        }
      });
    },
    selectGrid: function(args, view) {
      var self = this, replaceView = "left", page = Math.floor((this.rightView?.collection.skipCount || 0) / this.rightView?.collection.topCount) + 1, pageSize = parseInt(this.rightView?.collection.topCount) * parseInt(page), browsedChild = this.rightView?.listView.browsedChild ? this.rightView?.listView.browsedChild : this.leftView?.listView.browsedChild;
      if (this.options.targetBrowseHistory.length === 0) {
        var locationObj = {
          leftId: this.options.previousLocation.id,
          rightId: browsedChild ? browsedChild.model.get("id") : undefined,
          pageSize: pageSize
        };
        this.options.targetBrowseHistory.push([ "location", locationObj ]);
      } else if (this.options.searchView) {
        this.options.targetBrowseHistory.push([ "search", this.options.query.clone() ]);
      } else {
        var nodeObj = {
          leftId: browsedChild ? browsedChild.model.parent.get("id") : undefined,
          rightId: browsedChild ? browsedChild.model.parent.get("id") : undefined,
          pageSize: pageSize
        };
        this.options.targetBrowseHistory.push([ "node", nodeObj ]);
      }
      return this._runSelection(args, ".csui-panel.cs-start-locations", replaceView).done(function(newView) {
        if (newView) {
          self.leftView = self.rightView;
          self?.leftView?.destroy();
          self.rightView = newView;
          self.onDomRefresh();
          self.showBackButton();
        }
      });
    },
    showBackButton: function() {
      if (this.leftView && !this.leftView.isDestroyed && this.options.targetBrowseHistory.length >= 1) {
        this.leftView.headerView && this.leftView.headerView.ui.backBtn.show();
      }
    },
    hideBackButton: function() {
      if (this.leftView && this.options.targetBrowseHistory.length < 1) {
        this.leftView.headerView && this.leftView.headerView.ui.backBtn.hide();
      }
    },
    _runSelection: function(args, shiftViewClass, replaceView) {
      var node = args.node, self = this, deferred = $.Deferred();
      this._drillDown(node, shiftViewClass).done(function(view) {
        if (replaceView === "left") {
          self.onClearLeftViewSelectList();
        } else if (replaceView === "right") {
          self.onClearRightViewSelectList();
        }
        var browsedModel;
        if (!self.options?.masterView?.isGridView()) {
          browsedModel = (replaceView === "left" ? self.rightView : self.leftView)?.listView.browsedChild.model;
        } else {
          browsedModel = self.rightView?.listView?.browsedChild ? self.rightView?.listView?.browsedChild?.model : self.leftView?.listView?.browsedChild?.model;
        }
        self.options?.masterView?.trigger("changed", {
          browsedModelId: browsedModel.get("id")
        });
        self.options?.masterView?.trigger("change:complete", node);
        deferred.resolve(view);
      }).fail(function(resp) {
        self._displayAlert(resp);
        self.options?.masterView?.trigger("change:complete");
        deferred.reject();
      });
      return deferred;
    },
    _drillUp: function(nodeId, rightFlag) {
      this.trigger("drill:up", nodeId);
      var newView = this._setView(nodeId, "csui-new-view left-only binf-hidden", this.options.searchView, "prepend"), view = newView.view, self = this, deferred = $.Deferred();
      view.$el.addClass("zeroWidth").removeClass("binf-hidden");
      view.render();
      if (!rightFlag) {
        self._removeRightView(newView.promise).done(function() {
          deferred.resolve(newView.view);
        }).fail(function(resp) {
          deferred.reject(resp);
        });
      }
      return deferred;
    },
    _drillDown: function(node, removeClass) {
      var newView = this._setView(node, "csui-new-view", false), panelPromise = null, view = newView.view;
      view.render();
      if (view.options.searchView && this.rightView == null) {
        view.options.searchView = false;
        $(".binf-list-group").removeClass("search-left-item");
        if ($(".csui-search-item-left-panel").is(":visible")) {
          $(".binf-list-group").addClass("search-left-folder-right");
        }
        panelPromise = this._addRightView(newView.promise, view);
      } else {
        panelPromise = this._replaceView(newView.promise, view, removeClass);
      }
      return panelPromise;
    },
    _removeRightView: function(fetchPromise) {
      var newView = this.$el.find(".csui-new-view"), leftView = this.$el.find(".csui-panel.cs-start-locations"), rightView = this.$el.find(".cs-pane-view"), deferred = $.Deferred(), self = this, animatedEle = self.$el;
      animatedEle.addClass("csui-fadeOut");
      leftView.hide();
      rightView.hide();
      newView[0].className = "csui-panel cs-start-locations left-only";
      fetchPromise.done(function() {
        self._finishRightRemove(newView, leftView, rightView);
        deferred.resolve();
      }).fail(function(resp) {
        self._removeNewView(newView, leftView, rightView);
        deferred.reject(resp);
      });
      return deferred;
    },
    _removeNewView: function(newView, leftView, rightView) {
      newView || (newView = this.$el.find(".csui-new-view"));
      var selectView = newView[0].selectView;
      this.cancelEventsToViewsPropagation(selectView);
      selectView.destroy();
      newView.remove();
      leftView && leftView.show();
      rightView && rightView.show();
    },
    _finishRightRemove: function(newView, leftView, rightView) {
      var selectView, self = this;
      if (rightView.length > 0) {
        selectView = rightView[0].selectView;
        this.cancelEventsToViewsPropagation(selectView);
        this.rightView = null;
      }
      if (leftView.length > 0) {
        selectView = leftView[0].selectView;
        this.cancelEventsToViewsPropagation(selectView);
        selectView.destroy();
        leftView.remove();
        this.leftView = null;
      }
      setTimeout(function() {
        self.$el.removeClass("csui-fadeOut");
        selectView.destroy();
        rightView.remove();
      }, 150);
      return true;
    },
    _addRightView: function(fetchPromise, selectView) {
      var leftView = this.$el.find(".csui-panel.cs-start-locations"), newView = this.$el.find(".csui-new-view"), deferred = $.Deferred(), self = this;
      leftView[0].className = "csui-panel cs-start-locations";
      newView[0].className = "csui-panel cs-pane-view csui-slideMidLeft";
      this.options?.masterView?.isGridView() && (newView[0].className += " csui-slideRight2Left");
      fetchPromise.done(function() {
        deferred.resolve(selectView);
      }).fail(function(resp) {
        self._removeNewView(newView);
        leftView.animate({
          width: "100%"
        }, {
          duration: 200,
          complete: function() {
            leftView.addClass("left-only").css("width", "");
          }
        });
        self.leftView.clearSelect();
        self.leftView.refresh();
        deferred.reject(resp);
      });
      return deferred;
    },
    _replaceView: function(fetchPromise, selectView, removeClass) {
      var view = this.$el.find(removeClass), newView = this.$el.find(".csui-new-view"), rightView = this.$el.find(".cs-pane-view"), deferred = $.Deferred(), self = this;
      switch (removeClass) {
       case ".csui-panel.cs-start-locations":
        if (rightView[0]) {
          rightView[0].className = "csui-panel cs-start-locations csui-slideLeft";
          this.options?.masterView?.isGridView() && (rightView[0].className += " smart-np-gridview csui-slideRight2Left");
        }
        newView[0].className = "csui-panel cs-pane-view csui-slideMidLeft";
        this.options?.masterView?.isGridView() && (newView[0].className += " smart-np-gridview csui-slideRight2Left");
        break;

       case ".cs-pane-view":
        if (this.backBtnClicked) {
          newView[0].className = "csui-panel cs-pane-view csui-slideMidLeft smart-back-anime";
        } else {
          newView[0].className = "csui-panel cs-pane-view csui-slideMidLeft";
          this.options?.masterView?.isGridView() && (newView[0].className += " smart-np-gridview csui-slideRight2Left");
        }
        this.backBtnClicked = false;
      }
      this.$el.find(".left-only").removeClass("left-only");
      fetchPromise.done(function() {
        deferred.resolve(selectView);
        setTimeout(function() {
          self._removeView(view);
        }, 200);
      }).fail(function(resp) {
        self._reverseRemoveView(newView, removeClass, rightView);
        if (removeClass === ".csui-panel.cs-start-locations") {
          view.show();
        }
        deferred.reject(resp);
      });
      return deferred;
    },
    _reverseRemoveView: function(domView, className, rightView) {
      this._removeNewView(domView);
      switch (className) {
       case ".csui-panel.cs-start-locations":
        rightView[0].className = "csui-panel cs-pane-view csui-slideRight";
        this.rightView.refresh();
        break;

       case ".cs-pane-view":
        this._removeView(rightView);
        this.leftView.$el[0].className = "csui-panel cs-start-locations left-only";
        this.leftView.clearSelect();
        this.leftView.refresh();
      }
      return true;
    },
    _removeView: function(domView) {
      if (domView.length) {
        var selectView = domView[0].selectView;
        this.cancelEventsToViewsPropagation(selectView);
        selectView.destroy();
        domView.remove();
        return true;
      } else {
        return false;
      }
    },
    updateModelState: function() {
      this.collection.filter(function(node) {
        if (node?.newlyAddedNode) {
          node.newlyAddedNode = false;
        }
      });
    },
    _maintainSeletionStateonToggle: function() {
      if (!_.isEmpty(this.rightView?.listView?.selectItems)) {
        this.options.masterView.selectedItems = this.rightView.listView.selectItems;
        this.rightView.listView.selectItems = {};
      } else if (!_.isEmpty(this.leftView?.listView?.selectItems)) {
        this.options.masterView.selectedItems = this.leftView.listView.selectItems;
        this.leftView.listView.selectItems = {};
      }
    },
    _toggleGridView: function(flag) {
      var viewopts = this._setViewOptions;
      this.fetchData = false;
      this.leftView?.destroy();
      this.rightView?.destroy();
      this.fetchedCollection = this?.rightView?.collection ?? this?.leftView?.collection;
      if (this.options?.masterView?.isGridView()) {
        var page = Math.floor((this.leftView?.collection.skipCount || 0) / this.leftView?.collection.topCount) + 1, pageSize = parseInt(this.leftView?.collection.topCount) * parseInt(page), browsedChild = this.leftView?.listView?.browsedChild;
        if (browsedChild) {
          if (this.options.targetBrowseHistory.length === 0) {
            var locationObj = {
              leftId: this.options.previousLocation.id,
              rightId: undefined,
              pageSize: pageSize
            };
            this.options.targetBrowseHistory.push([ "location", locationObj ]);
          } else if (this.options?.targetBrowseHistory[this.options?.targetBrowseHistory?.length - 1][0] !== "search") {
            var nodeObj = {
              leftId: browsedChild?.model?.parent?.get("id") ?? undefined,
              rightId: undefined,
              pageSize: pageSize
            };
            this.options.targetBrowseHistory.push([ "node", nodeObj ]);
          }
        }
        viewopts[1] = "cs-start-locations smart-np-gridview left-only";
        this._maintainSeletionStateonToggle();
        var gView = this._setView(...viewopts);
        this.leftView = gView?.view;
        this.leftView?.render();
      } else {
        viewopts[1] = "cs-start-locations left-only";
        this._maintainSeletionStateonToggle();
        var llview = this._setView(...viewopts);
        this.leftView = llview?.view;
        this.leftView?.render();
      }
      this.options?.masterView?.trigger("update:npv:ontoggle");
      this.options?.masterView?.trigger("toggle:collection:state");
    },
    _setView: function(nodeOrId, className, searchView, appendAction, viewOptions) {
      this._setViewOptions = [ nodeOrId, className, searchView, appendAction, viewOptions ];
      viewOptions || (viewOptions = this.options?.getViewOptions(nodeOrId, this.connector));
      this.options.searchView = searchView;
      this.options.treeView = viewOptions?.treeView || false;
      _.defaults(viewOptions, this.options, {
        invalidNodes: this.invalidNodes,
        fetchContainer: true
      });
      appendAction || (appendAction = "append");
      var view = this._newView(viewOptions, className), promise = this._fetchView(view, viewOptions);
      if (searchView) {
        this.options.fromSearch = true;
      } else {
        this.options.fromSearch = false;
      }
      view.el.selectView = view;
      this.$el[appendAction](view.el);
      return {
        view: view,
        promise: promise
      };
    },
    _fetchView: function(view, viewOptions) {
      if (viewOptions.fetchContainer) {
        this.options?.fetchContainer(view);
      }
      let fetchAgain = this?.fetchData ?? true;
      if (fetchAgain) {
        return this.options?.fetchCollection(view);
      } else {
        this.fetchData = true;
        view?.collection?.reset(this?.fetchedCollection?.models, {
          silent: true
        });
        var deferred = $.Deferred().resolve(view?.collection);
        return deferred.promise();
      }
    },
    _newView: function(args, className) {
      var self = this, options = _.extend({
        listTypes: this.listTypes,
        className: className + " csui-panel",
        parentEl: this.$el
      }, args);
      var selectView = new SelectView(options);
      this.propagateEventsToViews(selectView);
      this.listenTo(selectView, "selection:change", this.onSelectionChange);
      this.listenTo(selectView, "search:failed", this._searchFailed);
      this.listenTo(selectView, "backbutton:click", this._onClickBackButton);
      this.listenTo(selectView, "clear:selectList", this.onClearLeftViewSelectList);
      this.listenTo(selectView, "browse:select", _.bind(this.onBrowse, this));
      var getDirection = function(targetEl) {
        return !!targetEl.closest(".csui-slideMidLeft").length ? "right" : "left";
      };
      this.listenTo(selectView, "add:to:collection", _.bind(function(options) {
        var dir = getDirection(options.targetEl), browsable = this.commandType.browseAllowed(options.node);
        this._toggleSelectionSameNode(options.id, dir, browsable);
        this.options?.masterView?.trigger("add:to:collection", {
          id: options.id,
          node: options.node
        });
      }, this));
      this.listenTo(selectView, "remove:from:collection", _.bind(function(options) {
        var dir = getDirection(options.targetEl);
        this._toggleSelectionSameNode(options.id, dir);
        this.options?.masterView?.trigger("remove:from:collection", {
          id: options.id,
          node: options.node
        });
      }, this));
      this.listenTo(selectView, "save:form", function(node) {
        this.trigger("save:form", node);
      });
      return selectView;
    },
    _toggleSelectionSameNode: function(id, direction, browsable) {
      var targetView = direction === "right" ? this.leftView : this.rightView;
      if (direction !== "left" || !browsable) {
        targetView && targetView.collection.findWhere({
          id: id
        }) && targetView.listView.toggleNodeSelection(id);
      }
    },
    onClearLeftViewSelectList: function() {
      if (!!this.leftView) {
        this.leftView.selectList = {};
      }
    },
    onClearRightViewSelectList: function() {
      if (!!this.rightView) {
        this.rightView.selectList = {};
      }
    },
    clearSelect: function() {
      this.onClearLeftViewSelectList();
      this.onClearRightViewSelectList();
    },
    _onClickBackButton: function(args) {
      var self = this;
      var lastVisited = this.options.targetBrowseHistory.length > 0 ? this.options.targetBrowseHistory.pop() : undefined;
      if (this.options.targetBrowseHistory.length === 1) {
        this.options.navigateFromHistory = true;
      } else {
        this.options.navigateFromHistory = false;
      }
      this.backBtnClicked = this.options.targetBrowseHistory?.length > 0 ? true : false;
      if (lastVisited && lastVisited[0] === "search") {
        this.requestedQueryModel = lastVisited[1];
        this.options?.masterView?.trigger("back:toSearch", this);
        if (this.options.targetBrowseHistory.length > 0) {
          this.showBackButton();
        }
      } else if (lastVisited && lastVisited[0] === "location") {
        this.onClearLeftViewSelectList();
        this.onClearRightViewSelectList();
        this.options?.masterView.trigger("change:location:from:back", lastVisited);
      } else if (lastVisited && lastVisited[0] === "node") {
        this.trigger("search:tonode", this);
        var leftNode = new NodeModel({
          id: lastVisited[1].leftId
        }, {
          connector: this.connector
        }), rightNode = new NodeModel({
          id: lastVisited[1].rightId
        }, {
          connector: this.connector
        });
        if (!!this.commandType.multiSelect) {
          this.options.selectException = lastVisited[1].rightId;
        }
        if (this.options?.searchView) {
          this._showNPViewonBackFromSearch(leftNode, rightNode);
        } else {
          this.newLeftView(leftNode, lastVisited[1].pageSize).done(function(view) {
            self._updateHeaderEleofSelectViews(lastVisited, leftNode, rightNode);
          });
        }
      }
      this.options.backBtn = true;
    },
    _updateHeaderEleofSelectViews: function(lastVisited, leftNode, rightNode) {
      var self = this;
      self.setParentNodeAsTarget(leftNode);
      self.options?.masterView?.trigger("change:complete");
      self.trigger("toggle:breadcrumbs", {
        browsedModelId: self.leftNodeId()
      });
      if (self.options.targetBrowseHistory) {
        self.hideBackButton();
      }
      if (self.options?.targetBrowseHistory?.length > 0 && rightNode && rightNode.get("id")) {
        if (self?.el?.querySelector(".cs-left-item-" + rightNode.get("id"))) {
          self?.el?.querySelector(".cs-left-item-" + rightNode.get("id") + " .csui-list-item-title")?.click();
          self.options.selectException = undefined;
        }
        self.showBackButton();
      } else {
        self.hideBackButton();
      }
    },
    _showNPViewonBackFromSearch: function(leftNode, rightNode) {
      this.options?.masterView?.trigger("back:from:search:to:grid", {
        leftNode: leftNode,
        rightNode: rightNode
      });
      this.options.searchView = false;
    },
    _searchFailed: function(args) {
      var isRightView = this._isRightView(args.view);
      if (!isRightView) {
        this.forceClose(args.resp);
      } else {
        this._displayAlert(args.resp);
      }
    },
    _isRightView: function(view) {
      var viewClasses = view.$el[0].className.split(" ");
      return _.contains(viewClasses, "cs-pane-view");
    },
    _displayAlert: function(resp) {
      var msg = _.str.sformat(lang.serverError, "unknown");
      if (this.options.globalMessage) {
        msg = this.options.globalMessage;
      } else {
        if (resp) {
          if (resp instanceof SelectView) {
            msg = _.str.sformat(lang.ViewDenied, resp.node.get("name"));
          } else {
            if (resp.responseJSON) {
              msg = resp.responseJSON.error;
            }
          }
        }
      }
      return GlobalMessage.showMessage("info", msg);
    }
  });
  _.extend(SelectViews.prototype, ViewEventsPropagationMixin);
  return SelectViews;
});