/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/controls/list/list.view" ], function(_, Backbone, D2ListView) {
  "use strict";
  var ListViewWithHighlight = D2ListView.extend({
    constructor: function ListViewWithHighlight(options) {
      options = options || {};
      this.context = options.context;
      D2ListView.prototype.constructor.call(this, options);
      this.mergeAttributesFromSelectedModelOnIDChange = false;
      this.attributesUsedForEqualityComparison.push("i_chronicle_id");
      this.context && this.listenTo(this.context, "d2:object:versionadded", function(oldId) {
        if (this.collection.findWhere({
          id: oldId
        })) {
          this.collection.fetched = false;
        }
      });
      this.listenTo(this.collection, "sync", this._onCollectionSync).listenTo(this.collection, "clear:highlights", this._clearHighlights);
    },
    _adjustSelection: function() {
      D2ListView.prototype._adjustSelection.call(this);
    },
    _onCollectionSync: function() {
      var selectedChild = this.getSelectedItem();
      selectedChild && this.onClickItem(selectedChild);
    },
    _isModelToBeConsideredNew: function(model) {
      return this.collection.keepOnlyPriorityModels && _.isArray(this.options.selectedNodeId) && !_.contains(this.options.selectedNodeId, model.get("id"));
    },
    _onChildRender: function(childView) {
      D2ListView.prototype._onChildRender.apply(this, arguments);
      var model = childView.model, collection = this.collection, priorityModelIds = collection.priorityModelIds;
      if (_.isArray(priorityModelIds) && priorityModelIds.length) {
        var index = _.indexOf(priorityModelIds, model.get("id"));
        if (index === -1) {
          index = _.indexOf(priorityModelIds, model.get("i_chronicle_id"));
        }
        if (index !== -1) {
          model.set("highlight", model.get("highlight") || collection.priorityModelsHighlighted || this._isModelToBeConsideredNew(model), {
            silent: true
          });
        }
      }
      if (model.get("highlight")) {
        childView.$el.addClass("new-file-highlight");
      } else {
        childView.$el.removeClass("new-file-highlight");
      }
    },
    _clearHighlights: function() {
      this.collection.each(function(model) {
        model.set("highlight", false, {
          silent: true
        });
      });
      this.$(".binf-list-group-item").removeClass("new-file-highlight");
    }
  });
  return {
    mixin: function(prototype) {
      var zuper = prototype.constructor.__super__;
      return _.extend(prototype, {
        applyFileListMixin: function(options) {
          options = options || {};
          this.collection.setLimit(0, 0, false);
          if (_.isArray(options.selectedNodeId)) {
            this.initiallySelectedNodeId = options.selectedNodeId[0];
            if (options.selectedNodeId.length > 1) {
              this.collection.priorityModelIds = [].concat(options.selectedNodeId);
              this.collection.keepOnlyPriorityModels = true;
            } else {
              this.collection.priorityModelIds = [];
            }
          } else {
            this.initiallySelectedNodeId = options.selectedNodeId;
          }
          return this;
        },
        className: function() {
          var className = _.isString(this.ownClassName) ? this.ownClassName : "";
          var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
          className += " " + clazz;
          if (this.options && this.options.className) {
            className += " " + _.result(this.options, "className");
          }
          return className;
        },
        _setupToolbarView: function() {},
        _updateToolbar: function() {
          this.toolbarRegion.$el.addClass("binf-hidden");
        },
        _setupFilesListView: function() {
          if (!this.filesListView) {
            this.selectedModel = new Backbone.Model();
            this.filesListView = new ListViewWithHighlight({
              context: this.context,
              collection: this.collection,
              selectedModel: this.selectedModel,
              selectedNodeId: this.options.selectedNodeId
            });
            this.listenTo(this.filesListView, "click:item", this._onListClickItem).listenTo(this.filesListView, "clear:selection", this._onListClearSelection);
          }
        },
        _showFilesListView: function() {
          var me = this;
          me.blockActions();
          me.collection.ensureFetched().always(function() {
            me.filesListRegion.show(me.filesListView);
            me.unblockActions();
          });
        },
        _onListClickItem: function(item) {
          this.additionalPanelsView && this.additionalPanelsView.trigger("select:item", this, item.model);
        },
        _onListClearSelection: function() {
          this.selectDefaultItem();
        },
        hasSelectedItem: function() {
          return this.filesListView && !!this.filesListView.getSelectedItem();
        },
        selectDefaultItem: function() {
          if (this.filesListView) {
            this._setSelectedItem(this.filesListView.children.findByIndex(0));
          }
        },
        _setSelectedItem: function(item) {
          !!item && item.$el.trigger("click");
        },
        onActivateSelf: function() {
          if (this.collection.fetching) {
            this.filesListView && this.filesListView.once("render:collection", this.onActivateSelf.bind(this));
            return;
          } else if (!this.collection.fetched) {
            this.blockActions();
            this.collection.fetch({
              reload: true
            }).always(function() {
              this.unblockActions();
              this.onActivateSelf();
            }.bind(this));
            return;
          }
          if (this.hasSelectedItem()) {
            this._setSelectedItem(this.filesListView.getSelectedItem());
          } else if (this.selectedModel.get("id") || this.initiallySelectedNodeId) {
            var selId = this.selectedModel.get("id") || this.initiallySelectedNodeId;
            this.selectedModel.unset("id", {
              silent: true
            });
            this.selectedModel.set("id", selId);
            if (this.filesListView.$el.is(":visible")) {
              this._setSelectedItem(this.filesListView.getSelectedItem());
            } else {
              this.filesListView.once("dom:refresh", this.onActivateSelf.bind(this));
            }
          } else {
            this.selectDefaultItem();
          }
        },
        onDeactivateSelf: function() {
          var needToReset = this.resetCollectionOnDeactivate === true || _.isArray(this.collection.priorityModelIds) && this.collection.priorityModelIds.length;
          this.collection.priorityModelIds = [];
          this.collection.keepOnlyPriorityModels = false;
          this.collection.priorityModelsHighlighted = false;
          this.collection.trigger("clear:highlights");
          if (needToReset) {
            this.resetCollectionOnDeactivate = false;
            this.collection.fetch({
              reset: true
            });
          }
        }
      });
    }
  };
});