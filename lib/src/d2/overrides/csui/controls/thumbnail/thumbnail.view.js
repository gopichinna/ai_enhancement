/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/thumbnail/thumbnail.view", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "d2/utils/constants" ], function(_, Backbone, ThumbnailView, WorkflowToolItems, WorkflowToolItemsMasks, constants) {
  "use strict";
  var origInitialize = ThumbnailView.prototype.initialize, origRender = ThumbnailView.prototype.render, origCreateChildViews = ThumbnailView.prototype._createChildViews, origOnRender = ThumbnailView.prototype.onRender, origUpdateRow = ThumbnailView.prototype.updateRow;
  ThumbnailView.prototype.initialize = function() {
    origInitialize.apply(this, arguments);
    this.listenTo(this.collection, "delayed:data:sync", function() {
      this.collection.models.filter(model => model.get("favorite")).forEach(model => {
        let child = this.resultsView.children.findByModel(model);
        child.isRendered && child.render();
      });
    });
  };
  ThumbnailView.prototype.updateRow = function() {
    var locallyCreatedRef = false;
    if (!this.thumbnailHeaderView) {
      this.thumbnailHeaderView = {};
      locallyCreatedRef = true;
    }
    origUpdateRow.apply(this, arguments);
    if (locallyCreatedRef) {
      this.thumbnailHeaderView = undefined;
    }
  };
  ThumbnailView.prototype.updateSelection = function(model) {
    if (this.resultsView && this.resultsView.children && this.resultsView.children._views && this.collection.length >= 1) {
      var itemViews = _.values(this.resultsView.children._views);
      _.each(itemViews, function(itemView) {
        var selectView = itemView.selectContentView;
        var $cbEl = selectView.$el.find('input[type="checkbox"]');
        if (itemView.model.cid === model.cid) {
          $cbEl.prop("checked", true);
          selectView.$el.attr("aria-checked", true);
          itemView.$el.addClass("csui-thumbnail-item-selected");
        } else {
          $cbEl.prop("checked", false);
          selectView.$el.attr("aria-checked", false);
          itemView.$el.removeClass("csui-thumbnail-item-selected");
        }
        itemView.selectContentRegion.$el.addClass("csui-checkbox");
      });
    }
  };
  ThumbnailView.prototype.render = function() {
    origRender.apply(this, arguments);
    if (this.options.selectionImpl === "d2_templates" && this.thumbnailHeaderView && this.thumbnailHeaderView.$el) {
      this.thumbnailHeaderView.$el.addClass("binf-hidden");
    }
  };
  ThumbnailView.prototype._createChildViews = function() {
    origCreateChildViews.call(this);
    var origShowInlineActionBar = this.resultsView._showInlineActionBar;
    this.resultsView._showInlineActionBar = function(args) {
      if (this.options.thumbnailView.options.d2IgnoreInlineActions === true) {
        return;
      }
      this.options.inlineBar.options._compareId = this.options.inlineBar.options._compareId || _.uniqueId("i_b_op_");
      this.options.thumbnailView.options.originatingView.options.origInlineBarOptions = this.options.thumbnailView.options.originatingView.options.origInlineBarOptions || _.clone(this.options.inlineBar.options);
      if (args.model.get("type") === constants.Types.WORKFLOW) {
        _.extend(this.options.inlineBar.options, _.extend({
          collection: WorkflowToolItems.thumbnailInlineActionbar,
          toolItemsMask: new WorkflowToolItemsMasks().toolbars.inlineActionbar
        }, WorkflowToolItems.thumbnailInlineActionbar.options));
      } else if (this.options.inlineBar.options._compareId === this.options.originatingView.options.origInlineBarOptions._compareId) {
        this.options.inlineBar.options = _.clone(this.options.thumbnailView.options.originatingView.options.origInlineBarOptions);
      }
      origShowInlineActionBar.call(this, args);
    };
    var namingColumn = this.options.columns && this.options.columns.findWhere({
      isNaming: true
    }), namingContent = namingColumn && this.resultsView.options && this.resultsView.options.thumbnailContent && this.resultsView.options.thumbnailContent.findWhere({
      key: namingColumn.get("key")
    });
    if (namingColumn && namingContent) {
      var namingColumnKey = namingContent.get("key");
      if (namingColumnKey.indexOf(".") > -1) {
        var originalNamingContentKey = namingColumnKey;
        namingColumnKey = namingColumnKey.replace(/\./g, "_");
        namingContent.set({
          key: namingColumnKey,
          original_key: originalNamingContentKey,
          d2_custom_name_column: true
        }, {
          silent: true
        });
        var customNameColumn = this.options.columns.findWhere({
          key: namingColumnKey
        });
        if (!customNameColumn) {
          var clonedNamingColumn = namingColumn.clone();
          clonedNamingColumn.set({
            column_key: namingColumnKey,
            d2_sort_key: namingColumnKey,
            filter_key: namingColumnKey,
            key: namingColumnKey,
            isNaming: false,
            d2_custom_name_column: true
          });
          this.options.columns.add(clonedNamingColumn, {
            silent: true
          });
        }
      }
    }
  };
  ThumbnailView.prototype.updateSelectAllCheckbox = function() {
    var selectAllRegion = this.thumbnail && this.thumbnail.headerRegion.currentView.selectAllRegion || this.options && this.options.thumbnailView.headerRegion && this.options.thumbnailView.headerRegion.currentView && this.options.thumbnailView.headerRegion.currentView.selectAllRegion, checkboxView = selectAllRegion && selectAllRegion.currentView;
    if (checkboxView) {
      var selected = this.collection.where({
        csuiIsSelected: true
      }).length;
      var checkboxValue = selected === 0 ? false : selected === this.collection.filter(function(model) {
        return model.get("selectable") !== false;
      }).length ? true : "mixed";
      checkboxView.setChecked(checkboxValue);
    }
  };
  ThumbnailView.prototype.onRender = function() {
    if (this.thumbnailHeaderView && this.thumbnailHeaderView.isDestroyed === true && this.resultsView && this.resultsView.isDestroyed === true) {
      this.initialize();
    }
    origOnRender.apply(this, arguments);
  };
  ThumbnailView.prototype.clearChildrenSelection = function() {
    this.thumbnailHeaderView && this.thumbnailHeaderView.trigger("selectOrUnselect.all", false, {});
  };
  require([ "csui/controls/thumbnail/content/text/text.view" ], function(ThumbnailTextContentView) {
    var origGetValueText = ThumbnailTextContentView.prototype.getValueText;
    ThumbnailTextContentView.prototype.getValueText = function() {
      if (this.options && this.options.column && this.options.column["d2_custom_name_column"] === true) {
        var columnName = this.options.column["original_key"];
        return this.model.get(columnName);
      }
      return origGetValueText.apply(this, arguments);
    };
  });
});