/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/behaviors/default.action/default.action.behavior", "csui/behaviors/default.action/impl/defaultaction", "csui/controls/thumbnail/content/select/select.view", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/controls/mixins/view.state/node.view.state.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/controls/thumbnail/thumbnail.header.view", "csui/controls/thumbnail/thumbnail.list.view", "hbs!csui/controls/thumbnail/impl/thumbnail", "css!csui/controls/thumbnail/thumbnail", "csui/lib/jquery.mousehover" ], function(module, _, $, Backbone, Marionette, DefaultActionBehavior, DefaultActionController, SelectContentView, LayoutViewEventsPropagationMixin, BlockingView, NodeViewStateMixin, FieldsV2Mixin, ThumbnailHeaderView, ThumbnailListView, thumbnailTemplate) {
  "use strict";
  var config = _.extend({}, module.config({
    forIntegration: false
  }));
  var ThumbnailView = Marionette.LayoutView.extend({
    className: "csui-thumbnail-container",
    template: thumbnailTemplate,
    regions: {
      headerRegion: "#csui-thumbnail-header",
      resultsRegion: "#csui-thumbnail-results"
    },
    childEvents: {
      "show:toolbar": "showToolBarActions"
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    constructor: function ThumbnailView(options) {
      options || (options = {});
      this._allSelectedNodes = options.allSelectedNodes || (this._allSelectedNodes = new Backbone.Collection());
      this.options = options;
      var defaultOptions = {
        selectThumbnails: "multiple"
      };
      _.defaults(this.options, defaultOptions);
      if (options.actionItems && options.commands) {
        this.defaultActionController = new DefaultActionController({
          actionItems: options.actionItems,
          commands: options.commands
        });
        this.checkModelHasAction = this.defaultActionController.hasAction.bind(this.defaultActionController);
      } else {
        this.checkModelHasAction = function() {
          return true;
        };
      }
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.collection = options.collection;
      var checkSelection = this.collection.where({
        csuiIsSelected: true
      });
      this.collection.itemchecked = false;
      if (checkSelection.length > 0) {
        this.collection.itemchecked = true;
      }
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "update", this._handleModelsUpdate);
      this.listenTo(this.collection, "change", this.updateRow);
      if (this.context) {
        this.listenTo(this.context, "request", this._handleContextRequest).listenTo(this.context, "sync error", this._handleContextFinish).listenTo(this.context, "sync", this._handleContextSync).listenTo(this.context, "request", this.blockActions).listenTo(this.context, "sync", this.unblockActions);
      }
      this.listenTo(this.collection, "request", this.blockActions).listenTo(this.collection, "sync", _.bind(function() {
        this._handleResponseSortBy();
        this.unblockActions();
      }, this)).listenTo(this.collection, "destroy", this.unblockActions).listenTo(this.collection, "error", this.unblockActions);
      if (this.options.enableViewState) {
        this.listenTo(this.context.viewStateModel, "change:state", this.onViewStateChanged);
      }
      this._ViewCollection = Backbone.Collection.extend({
        model: this.collection.model
      });
      this.selectedChildren = new this._ViewCollection();
      var self = this;
      this.listenTo(this.collection, "reset", this._updateSelectedChildren);
      this.listenTo(this.collection, "remove", this._updateSelectedChildren);
      this.listenTo(this.collection, "new:page", this.resetScrollToTop);
      this.listenTo(this.collection, "reset", function() {
        if (!this._isRendered) {
          return;
        }
        this.resetScrollToTop();
        this._handleResponseSortBy();
        if (this.thumbnailHeaderView && this.collection.filters && this.collection.filters.name) {
          this.thumbnailHeaderView.updateTotalCount();
          if (this.collection.length > 0) {
            this.thumbnailHeaderView.ui.selectAll.removeAttr("disabled");
          } else {
            this.thumbnailHeaderView.ui.selectAll.attr("disabled", "true");
          }
        } else {
          this.thumbnailHeaderView.render();
          if (this.thumbnailHeaderView && this.thumbnailHeaderView.isSortOrderClicked) {
            self.thumbnailHeaderView.sortRegion.$el.find(".csui-sort-arrow").trigger("focus");
          }
        }
      });
      this.listenTo(this, "dom:refresh", this._adjustThumbnailWidth).listenTo(this.collection, "filter:change", this._collectionFilterChanged);
      this.listenTo(this, "scroll", this._destroyInlineActionBar);
      this.listenTo(this.options.columns, "update reset", this._handleColumnsReset);
    },
    _handleResponseSortBy: function() {
      const sorting = this.collection.sorting;
      if (sorting && sorting.sort && sorting.sort.length > 0 && sorting.sort[0].value) {
        const sortValue = sorting.sort[0].value, markerIndex = sortValue.indexOf("_"), sortKey = sortValue.substring(markerIndex + 1), sortDirection = sortValue.substring(0, markerIndex), sortKeyName = this._getSortableColumnKey(sortKey);
        const orderDiff = !this.collection.selectedId && this.collection.setOrder(sortKeyName + " " + sortDirection, false);
        if (this.options.enableViewState && orderDiff && !this.collection.selectedId && !this.options.originatingView?.getContainerPrefs("orderBy")) {
          this.setViewStateOrderBy([ sortKeyName + "_" + sortDirection ], {
            default: true
          });
        }
      }
    },
    _getSortableColumnKey: function(name) {
      var key = name;
      name = name.toLowerCase();
      if (this.options?.originatingView?.tableView?.allColumns) {
        _.find(this.options.originatingView.tableView.allColumns, function(column, index) {
          if (column.attributes.sort_key === name || column.name.toLowerCase() === name || column.attributes.column_key === name) {
            key = column.attributes.column_key;
            return true;
          }
        });
      }
      return key;
    },
    _createChildViews: function() {
      this.thumbnailHeaderView = new ThumbnailHeaderView({
        columns: this.options.displayedColumns,
        context: this.context,
        columnsWithSearch: this.options.columnsWithSearch,
        filterBy: this.options.filterBy,
        collection: this.options.collection,
        thumbnailView: this,
        allColumns: this.options.allColumns,
        enableViewState: this.options.enableViewState
      });
      this.updateCollectionParameters();
      var thumbnailContentColumns = [];
      if (this.options.tableColumns) {
        thumbnailContentColumns = this.options.tableColumns.deepClone();
        var namingKey, namingKeyModel = _.filter(this.options.columns.models, function(model) {
          return model.get("isNaming");
        });
        namingKey = namingKeyModel.length ? namingKeyModel[0].get("column_key") : "name";
        var thumbnailContentColumnsHasNamingKey = _.filter(thumbnailContentColumns.models, function(model) {
          return model.get("key") === namingKey;
        });
        if (thumbnailContentColumnsHasNamingKey.length > 0 && thumbnailContentColumnsHasNamingKey[0].get("key") !== "name") {
          thumbnailContentColumnsHasNamingKey[0].attributes.isNaming = true;
          thumbnailContentColumns.remove(thumbnailContentColumns.findWhere({
            key: "name"
          }));
        } else if (!thumbnailContentColumnsHasNamingKey.length) {
          thumbnailContentColumns.remove(thumbnailContentColumns.findWhere({
            key: "name"
          }));
          thumbnailContentColumns.add({
            key: namingKey,
            sequence: 4
          });
        }
      }
      this.resultsView = new ThumbnailListView({
        context: this.options.context,
        collection: this.options.collection,
        thumbnailView: this,
        originatingView: this.options.originatingView,
        inlineBar: this.options.inlineBar,
        thumbnailHeaderView: this.thumbnailHeaderView,
        tableColumns: this.options.tableColumns,
        columns: this.options.columns,
        thumbnailContent: this.options.thumbnailContent || thumbnailContentColumns
      });
    },
    _destroyInlineActionBar: function() {
      var inlineToolbarContainer = this.$el.find(".csui-table-actionbar .binf-dropdown.binf-open");
      if (this.resultsView.inlineToolbarView && inlineToolbarContainer.length > 0) {
        inlineToolbarContainer.removeClass("binf-open");
      }
    },
    closeInlineForm: function() {
      var thumbnailView = this.thumbnail ? this.thumbnail : this, isLocallyCreated = thumbnailView.activeInlineForm && thumbnailView.activeInlineForm.model.isLocallyCreated, inlineFormParentContanier = thumbnailView.activeInlineForm && thumbnailView.activeInlineForm.$el.parents(".csui-thumbnail-item");
      if (thumbnailView.activeInlineForm && (!isLocallyCreated || isLocallyCreated && thumbnailView.activeInlineForm.model.fetched)) {
        if (thumbnailView.activeInlineForm.model.get("type") === 140) {
          thumbnailView.$el.find(".csui-new-thumbnail-item").removeClass("csui-new-thumbnail-item");
        }
        thumbnailView.lockedForOtherContols = false;
        delete thumbnailView.activeInlineForm.model.inlineFormView;
        thumbnailView.activeInlineForm.model.trigger("sync");
        delete thumbnailView.activeInlineForm;
        thumbnailView.$el.find(".csui-thumbnail-item-form").removeClass("csui-thumbnail-item-form");
        thumbnailView.cancelAnyExistingInlineForm({
          silent: true
        }, inlineFormParentContanier);
      }
    },
    _collectionFilterChanged: function() {
      this.options.enableViewState && this.setViewStateFilter(this.collection.getFilterAsObject());
    },
    _updateSelectedChildren: function() {
      if (!this._isRendered) {
        return;
      }
      if (this.options.selectedChildren && this.options.selectedChildren.enableNonPromotedCommands) {
        this.showToolBarActions();
      }
    },
    _handleContextRequest: function() {
      this._fetchingContext = true;
      this._columnsReset = false;
      this._collectionReset = false;
    },
    _handleContextSync: function() {
      if (!this._isRendered) {
        return;
      }
      if (this._columnsReset || this._collectionReset) {
        this.render();
      }
    },
    _handleContextFinish: function() {
      this._fetchingContext = false;
      this.unblockActions();
    },
    _handleColumnsReset: function() {
      if (config.forIntegration) return;
      if (!(this.options.allColumns && this.options.allColumns.length)) {
        this.options.originatingView.tableView._getColumns();
        this.options.allColumns = this.options.originatingView.tableView.allColumns;
      }
      if (this._fetchingContext) {
        this._columnsReset = true;
        if (this._collectionReset) {
          this._handleContextSync();
        } else {}
      } else {
        this.render();
      }
    },
    resetScrollToTop: function() {
      if (this._isRendered && this.resultsRegion) {
        this.resultsRegion.$el.scrollTop(0);
      }
    },
    onDestroy: function() {
      if (this._originalScope) {
        this.options.collection.setResourceScope(this._originalScope);
      }
    },
    _handleModelsUpdate: function(collection, options) {
      if (!this._isRendered) {
        return;
      }
      var models = options.changes.added, self = this;
      if (models.length > 0) {
        _.each(models, function(model) {
          model.unset(SelectContentView.isSelectedModelAttributeName);
        });
        this.triggerMethod("before:render", this);
        this.trigger("inlineFormCreation", models);
        this.resultsView.showOrHideZeroRecordsMessage();
        this._adjustThumbnailWidth();
        _.each(models, function(model) {
          if (model.isLocallyCreated && !model.inlineFormView) {
            self.$el.find(".csui-thumbnail-item-" + model.cid).find(".csui-thumbnail-content-container").addClass("csui-new-item");
          }
        });
      }
      if (this.thumbnailHeaderView) {
        this.thumbnailHeaderView.ui.selectAll.prop("disabled", this.collection.length === 0);
        this.thumbnailHeaderView.updateTotalCount();
        this.thumbnailHeaderView.trigger("selectOrUnselect.mixed");
      }
    },
    onViewStateChanged: function() {
      var viewStateModel = this.context.viewStateModel, filterAsString = viewStateModel.getViewState("filter", true);
      if (filterAsString) {
        if (JSON.stringify(this.collection.getFilterAsObject()) !== filterAsString) {
          this.applyFilter(this.getViewStateFilterAsObject(filterAsString));
        }
      } else if (this.collection.filters) {
        this.collection.clearFilter();
      }
    },
    updateSelectAllCheckbox: function() {
      var selectAllRegion = this.thumbnail && this.thumbnail.headerRegion.currentView.selectAllRegion || this.options && this.options.thumbnailView.headerRegion && this.options.thumbnailView.headerRegion.currentView && this.options.thumbnailView.headerRegion.currentView.selectAllRegion, checkboxView = selectAllRegion && selectAllRegion.currentView;
      if (checkboxView) {
        var selected = this.collection.where({
          csuiIsSelected: true
        }).length;
        var checkboxValue = selected === 0 ? false : selected === this.collection.length ? true : "mixed";
        if (checkboxValue === "mixed") {
          setTimeout(() => {
            checkboxView.setChecked(checkboxValue);
          });
        } else {
          checkboxView.setChecked(checkboxValue);
        }
        checkboxView.setDisabled(this.collection.length === 0);
      }
    },
    _maintainNodeState: function(model) {
      var nodeModel = model;
      if (model && !!model.inlineFormView) {
        this.activeInlineForm && this.activeInlineForm.destroy();
        this.activeInlineForm = new nodeModel.inlineFormView({
          model: nodeModel,
          originatingView: this.options.originatingView,
          context: this.context
        });
        this.$el.find(".csui-thumbnail-item-" + nodeModel.cid).addClass("csui-thumbnail-item-form");
        if (nodeModel.isLocallyCreated && !nodeModel.fetched || nodeModel.get("type") === 140) {
          this.$el.find(".csui-thumbnail-item-" + nodeModel.cid).addClass("csui-new-thumbnail-item");
        }
        var className = ".csui-thumbnail-name-" + nodeModel.cid;
        var divForInlineForm = this.$el.find(className);
        var inlineFormRegion = new Marionette.Region({
          el: divForInlineForm
        });
        this.activeInlineForm.listenTo(this.activeInlineForm, "destroy", () => {
          delete this.activeInlineForm;
          this.trigger("destroy:inlineform");
        });
        inlineFormRegion.show(this.activeInlineForm);
        return true;
      } else {
        return false;
      }
    },
    updateRow: function(collectionOrModel) {
      if (collectionOrModel.isLocallyCreated) {
        this.$el.find(".csui-thumbnail-item-form") && this.$el.find(".csui-thumbnail-item-form").find(".csui-thumbnail-content-container").addClass("csui-new-item");
      }
      this.isSelected = this.collection.where({
        csuiIsSelected: true
      }).length > 0;
      if (collectionOrModel.inlineFormView) {
        this.options.originatingView.updateRowIndex = this.collection.indexOf(collectionOrModel);
        var self = this;
        if (self.activeInlineForm && self.activeInlineForm.model !== collectionOrModel) {
          var id = self.activeInlineForm.model.cid, isLocallyCreated = self.activeInlineForm.model.isLocallyCreated, inlineFormParentContanier = self.activeInlineForm.$el.parents(".csui-thumbnail-item");
          this.$el.find(".csui-thumbnail-item-form").removeClass("csui-thumbnail-item-form");
          this.$el.find(".csui-thumbnail-item-form").removeClass("csui-thumbnail-item-rename-form");
          this.$el.find(".csui-new-thumbnail-item").removeClass("csui-new-thumbnail-item");
          this.activeInlineForm.model.trigger("sync");
          this.cancelAnyExistingInlineForm({
            silent: true
          });
          if (isLocallyCreated) {
            this.$el.find(".csui-thumbnail-item-" + id).find(".csui-thumbnail-content-container").addClass("csui-new-item");
          }
        }
        if (!collectionOrModel.changed.csuiInlineFormErrorMessage && !collectionOrModel.isLocallyCreated) {
          this.trigger("cancelInlineForm", {
            silent: true
          });
        }
        self.activeInlineForm = new collectionOrModel.inlineFormView({
          model: collectionOrModel,
          originatingView: self.options.originatingView,
          context: self.context
        });
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass("csui-thumbnail-item-rename-form");
        if (collectionOrModel.get("type") === 140) {
          this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass("csui-new-thumbnail-item");
        }
        var className = ".csui-thumbnail-name-" + collectionOrModel.cid;
        var divForInlineForm = this.$el.find(className);
        self.activeInlineForm.listenTo(self.activeInlineForm, "destroy", function() {
          self.lockedForOtherContols = false;
          self.activeInlineForm.model.trigger("sync");
          delete self.activeInlineForm;
          collectionOrModel.renamed = true;
          self.trigger("destroy:inlineform");
        });
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass("csui-thumbnail-item-apply-transition");
        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).addClass("csui-thumbnail-item-form");
        if (divForInlineForm.length > 0) {
          var inlineFormRegion = new Marionette.Region({
            el: divForInlineForm
          });
          inlineFormRegion.show(self.activeInlineForm);
          self.trigger("show:inlineform");
        }
        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).removeClass("csui-thumbnail-item-rename-form");
        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).find("div.csui-thumbnail-overview-icon").addClass("binf-hidden");
        const formElement = this.$el.find(".csui-thumbnail-item-form");
        if (formElement?.find(".csui-thumbnail-content-container .csui-inlineform-error")?.length > 0) {
          formElement.find(".csui-thumbnail-content-container.csui-new-item").addClass("csui-new-item-error");
          formElement?.find(".csui-thumbnail-item-container")?.addClass("csui-normal-scrolling");
        }
        if (self.activeInlineForm && divForInlineForm.length > 0) {
          self.activeInlineForm.triggerMethod("dom:refresh", self.activeInlineForm);
        }
      } else {
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass("csui-thumbnail-item-form");
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass("csui-thumbnail-item-apply-transition");
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass("csui-new-thumbnail-item");
        if (this.activeInlineForm && this.activeInlineForm.model.cid === collectionOrModel.cid) {
          this.activeInlineForm.model.trigger("sync");
          this.cancelAnyExistingInlineForm({
            silent: true
          });
          collectionOrModel.renamed = true;
        }
        this.trigger("updateItem", collectionOrModel);
        if (this.collection && this.collection.filters.name && this.thumbnailHeaderView.searchBoxes) {
          this.thumbnailHeaderView.searchBoxes.setFocus();
        }
        if (this.$el.find(".csui-thumbnail-content-container.csui-new-item.csui-new-item-error").length > 0) {
          this.$el.find(".csui-thumbnail-content-container.csui-new-item.csui-new-item-error").removeClass("csui-new-item-error");
        }
      }
    },
    onAfterShow: function() {
      this.thumbnailHeaderView.searchBoxes.setFocus();
    },
    onShow: function() {
      this.isShown = true;
    },
    _adjustThumbnailWidth: function() {
      var thumbnailViewItem = this.$el.find(".csui-thumbnail-item"), thumbnailViewItemWidth = 190, parentWidth = $(".csui-table-facetview .smart-facet-panel").length > 0 ? $(".csui-facet-table-container").width() - $(".csui-table-facetview").width() : $(".cs-thumbnail-wrapper").width(), spaceBetweenItems = 2, thumbnailViewItemWidthPercent = thumbnailViewItemWidth / parentWidth * 100;
      for (var i = 1; i <= thumbnailViewItem.length; i++) {
        var thumbnailViewItemTotalWidth = i * thumbnailViewItemWidthPercent;
        if (thumbnailViewItemTotalWidth > 100) {
          i = i - 1;
          thumbnailViewItemWidthPercent = 100 / i;
          break;
        }
      }
      thumbnailViewItem.css({
        maxWidth: "calc(" + thumbnailViewItemWidthPercent + "% - " + spaceBetweenItems * 2 + "px)",
        minWidth: "calc(" + thumbnailViewItemWidthPercent + "% - " + spaceBetweenItems * 2 + "px)"
      });
    },
    cancelAnyExistingInlineForm: function(options, parentContanier) {
      this.trigger("cancelInlineForm", options);
      if (this.activeInlineForm) {
        this.activeInlineForm.cancel(options);
      }
    },
    startCreateNewModel: function(newNode, inlineFormView) {
      this.cancelAnyExistingInlineForm();
      if (this.collection && this.collection.node) {
        newNode.set("parent_id", this.collection.node.get("id"));
        newNode.isLocallyCreated = true;
        newNode.inlineFormView = inlineFormView;
        this.collection.add(newNode, {
          at: 0
        });
        this._adjustThumbnailWidth();
      }
    },
    onRender: function() {
      this._createChildViews();
      this.headerRegion.show(this.thumbnailHeaderView);
      var self = this;
      self.listenTo(self, "thumbnailRowRendered", function(itemView) {
        self.trigger("thumbnailItemRendered", {
          sender: self,
          target: itemView.target,
          node: itemView.node
        });
      });
      this.showToolBarActions();
      this.resultsRegion.show(this.resultsView);
      this.listenTo(this.context, "maximize:widget", this._adjustThumbnailWidth);
      this.listenTo(this.context, "restore:widget:size", this._adjustThumbnailWidth);
      if (this.options.selectThumbnails === "single") {
        this.$el.addClass("single-select-ThumbnailView");
      } else {
        this.$el.removeClass("single-select-ThumbnailView");
      }
    },
    updateCollectionParameters: function() {
      var collection = this.options.collection, context = this.options.context, supportsFields = collection.makeFieldsV2, supportsExpand = collection.makeExpandableV2, fields = {}, expands = {};
      if (!this.options.collection.setFields) {
        return;
      }
      if ((supportsFields || supportsExpand) && collection.getResourceScope && collection.setResourceScope) {
        if (this._originalCollectionScope) {
          collection.setResourceScope(this._originalCollectionScope);
        } else {
          this._originalCollectionScope = collection.getResourceScope();
        }
      }
      _.each(this.options.allColumns, function(column) {
        var ColumnView = column.CellView;
        if (ColumnView) {
          if (supportsFields && ColumnView.getModelFields) {
            var field = ColumnView.getModelFields({
              collection: collection,
              context: context,
              column: column
            });
            if (field) {
              FieldsV2Mixin.mergePropertyParameters(fields, field);
            }
          }
          if (supportsExpand && ColumnView.getModelExpand) {
            var expand = ColumnView.getModelExpand({
              collection: collection,
              context: context,
              column: column
            });
            if (expand) {
              FieldsV2Mixin.mergePropertyParameters(expands, expand);
            }
          }
          if (ColumnView.updateCollectionParameters) {
            ColumnView.updateCollectionParameters({
              collection: collection,
              context: context,
              column: column
            });
          }
        }
      }, this);
      if (!_.isEmpty(fields)) {
        collection.setFields(fields);
      }
      if (!_.isEmpty(expands)) {
        collection.setExpand(expands);
      }
    },
    clearChildrenSelection: function() {
      this.thumbnailHeaderView && this.thumbnailHeaderView.trigger("selectOrUnselect.all", false, {});
    },
    showToolBarActions: function(e) {
      var selectedNodes = this.getSelectedChildren();
      selectedNodes = this.options.allSelectedNodes && this.options.allSelectedNodes.models || selectedNodes;
      this.thumbnailHeaderView.$el.find(".csui-thumbnail-select .csui-control").length && this.thumbnailHeaderView.$el.find(".csui-thumbnail-select .csui-control").trigger("focus");
    },
    getSelectedChildren: function() {
      var selectedNodes = [];
      this.options.collection.each(function(model) {
        if (!!model.get("csuiIsSelected")) {
          selectedNodes.push(model);
        }
      });
      return selectedNodes;
    }
  });
  _.extend(ThumbnailView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(ThumbnailView.prototype, NodeViewStateMixin);
  return ThumbnailView;
});