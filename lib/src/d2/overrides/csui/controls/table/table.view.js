/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/table/table.view", "csui/lib/jquery.dataTables.tableTools/js/dataTables.tableTools", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/utils/constants", "i18n!d2/overrides/csui/controls/table/impl/nls/lang", "css!d2/dialogs/target.browse/impl/target.browse" ], function(_, $, TableView, TableTools, WorkflowToolItems, WorkflowToolItemsMasks, TaskToolItems, TaskToolItemsMasks, constants, lang1) {
  "use strict";
  var prototype = TableView.prototype;
  var origInitialize = prototype.initialize;
  var origRender = prototype.render;
  var origGetColumns = prototype._getColumns;
  var origOnRender = prototype.onRender;
  var origShowInlineBar = prototype._showInlineBar;
  var origCurrentlyFocusedElement = prototype.currentlyFocusedElement;
  var origAdjustColumnsInNoWrapMode = prototype._adjustColumnsInNoWrapMode;
  TableView.prototype.initialize = function() {
    _.isFunction(origInitialize) && origInitialize.apply(this, arguments);
    this.listenTo(this.collection, "delayed:data:sync", function() {
      this.updateRow(this.collection.at(0));
    });
  };
  TableView.prototype._getColumns = function() {
    if (this.options.columns) {
      var fixedClientColumns = [];
      this.options.columns.each(column => {
        var clientColumn = {};
        if (column.has("customization_resizeable")) {
          clientColumn["customization_resizeable"] = column.get("customization_resizeable");
        }
        if (column.has("customization_resize_span")) {
          clientColumn["customization_resize_span"] = column.get("customization_resize_span");
        }
        if (column.has("customization_min_width")) {
          clientColumn["customization_min_width"] = column.get("customization_min_width");
        }
        if (column.has("customization_pinned")) {
          clientColumn["customization_pinned"] = column.get("customization_pinned");
        }
        if (_.keys(clientColumn).length > 0) {
          clientColumn["d2FixedCustomColumn"] = true;
          clientColumn["permanentColumn"] = true;
          clientColumn["key"] = column.get("key");
          if (column.has("d2ColumnSequence")) {
            clientColumn["sequence"] = column.get("d2ColumnSequence");
          }
          fixedClientColumns.push(clientColumn);
        }
      });
      if (this.options.tableColumns && fixedClientColumns.length > 0) {
        this.options.tableColumns = this.options.tableColumns.deepClone();
        var d2FixedColumns = this.options.tableColumns.filter(clientColumn => {
          return clientColumn.has("d2FixedCustomColumn");
        });
        this.options.tableColumns.remove(d2FixedColumns);
        this.options.tableColumns.add(fixedClientColumns);
      }
    }
    origGetColumns.apply(this, arguments);
    if (this.options.isTargetBrowse) {
      var models = this.columns.models;
      for (var colno = 0; colno < models.length; colno++) {
        var column = models[colno];
        var key = column.attributes["column_key"];
        if (key === "name") {
          column.attributes["widthFactor"] = 1.2;
        }
      }
    }
  };
  TableView.prototype._adjustColumnsInNoWrapMode = function(columnModel) {
    if (!columnModel) {
      return;
    }
    origAdjustColumnsInNoWrapMode.apply(this, arguments);
  };
  TableView.prototype.onRender = function() {
    var me = this;
    var disableSearchBox = function(sb, title) {
      sb._disabled = true;
      sb.$el.css({
        opacity: "0.34",
        cursor: "default"
      });
      sb.ui.searchInput.attr("disabled", "disabled");
      sb.ui.clearer.attr("disabled", "disabled");
      sb.ui.searchGlassContainer._oldTitle = sb.ui.searchGlassContainer.attr("title");
      sb.ui.searchGlassContainer.attr("title", title);
      sb.ui.searchGlassContainer.attr("aria-label", title);
    };
    var enableSearchBox = function(sb) {
      if (sb._disabled === true) {
        delete sb._disabled;
        sb.$el.css({
          opacity: "",
          cursor: ""
        });
        sb.ui.searchInput.prop("disabled", false);
        sb.ui.clearer.attr("disabled", false);
        sb.ui.searchGlassContainer.attr("title", sb.ui.searchGlassContainer._oldTitle);
        sb.ui.searchGlassContainer.attr("aria-label", sb.ui.searchGlassContainer._oldTitle);
        delete sb.ui.searchGlassContainer._oldTitle;
      }
    };
    if (me._serverSearchBox) {
      me.stopListening(me._serverSearchBox, "change:filterValue");
      delete me._serverSearchBox;
    }
    if (me.searchBoxes && me.searchBoxes.length > 0) {
      if (me.collection.hasMoreRecords === true || me.collection.hadMoreRecords === true) {
        var searchBox;
        if (!_.isEmpty(me.collection.serverFilterColumn)) {
          searchBox = _.find(me.searchBoxes, function(sb) {
            return sb.options.column === me.collection.serverFilterColumn;
          }, me);
          if (searchBox) {
            me.listenTo(searchBox, "change:filterValue", function() {
              _.each(me.searchBoxes, function(sb) {
                if (sb.options.column !== searchBox.options.column) {
                  if (sb.ui.searchInput.val().length) {
                    sb.ui.searchInput.val("");
                    sb.triggerMethod("closed");
                  }
                  sb.lastFilterValue = undefined;
                }
              });
            });
            me._serverSearchBox = searchBox;
          }
        }
        var f = searchBox ? searchBox.getValue() : "";
        var title = _.str.sformat(lang1.searchDisabledTooltip, me.collection.totalCount);
        if (!_.isEmpty(f) && me.collection.hasMoreRecords === true) {
          _.each(me.searchBoxes, function(sb) {
            if (sb.options.column !== me.collection.serverFilterColumn) {
              disableSearchBox(sb, title);
            }
          }, me);
        } else {
          if (me.collection.node) {
            var info = me.collection.node.get("widgetPreference");
            if (info) {
              _.each(me.searchBoxes, function(sb) {
                var colName = sb.options.column;
                var col = _.find(info.clientColumns, function(col) {
                  return col.column_key === colName;
                });
                if (me.collection.hasMoreRecords === true && col && col.hasMappedDictionary === true) {
                  disableSearchBox(sb, title);
                } else {
                  enableSearchBox(sb);
                }
              }, me);
            }
          }
        }
      } else {
        _.each(me.searchBoxes, function(sb) {
          enableSearchBox(sb);
        });
      }
    }
    origOnRender.apply(this, arguments);
  };
  TableView.prototype.render = function() {
    var me = this;
    if (me.collection && me.collection._idLess === true) {
      me.options.selectAllColumnHeader = false;
      me.options.selectColumn = false;
    }
    me.stopListening(me, "tableHeaderRendered");
    me.listenTo(me, "tableHeaderRendered", function() {
      var isMultiple = this.options.selectMultiple === undefined || this.options.selectMultiple;
      if (!isMultiple && !me.$el.find(".csui-checkbox-view").hasClass("binf-hidden")) {
        me.$el.find(".csui-checkbox-view").addClass("binf-hidden");
      }
      var backArrow = me.$el.find(".arrow_back");
      if (this.options.showBackArrow) {
        if (backArrow.length === 0) {
          me.$el.find(".csui-table-cell-_select").append("<a class='csui-focusable-table-column-header csui_table_header_back'><span title='" + lang1.backArrowTooltip + '\' class="icon arrow_back_target_browse arrow_back "  role="link"</span></a>');
          me.$el.find(".arrow_back").on("click", function() {
            me.triggerMethod("click");
          });
          me.$el.find(".csui_table_header_back").on("keydown", function(event) {
            if (event.originalEvent.keyCode === 13 || event.originalEvent.keyCode === 32) {
              me.triggerMethod("click");
            }
          });
        } else {
          backArrow.removeClass("binf-hidden");
        }
      } else {
        if (me.$el.find(".arrow_back").length > 0) {
          backArrow.addClass("binf-hidden");
        }
      }
    });
    origRender.apply(this, arguments);
  };
  TableView.prototype._canMeasureTableSize = function() {
    var isVisible = document.body.contains(this.el);
    return isVisible;
  };
  TableView.prototype.updateSelection = function(model) {
    if (!(this.isRendered && this.table)) {
      return;
    }
    var idx = this.collection.indexOf(model);
    if (this.childWithBlockingView) {
      this.childWithBlockingView.updateRowIndex = idx;
    }
    if (idx === undefined) {
      return;
    }
    var tt = this.tableTools || TableTools.fnGetInstance(this.table.table().node());
    if (tt) {
      var trNode = this.table.row(idx).node();
      tt.fnSelect(trNode);
    }
  };
  TableView.prototype._setEmptyViewText = function() {
    this.emptyTableText = "";
    if (this._showEmptyViewText) {
      var labels = this.options.customLabels ? this.options.customLabels : this.localizableLabels;
      if (this.options.customLabels && labels.emptyTableText) {
        this.emptyTableText = labels.emptyTableText;
      } else {
        this.emptyTableText = this.addItemsPermissions ? labels.zeroRecords : lang1.noPermissions;
        this.emptyTableText = this.canAddItemsToContainer ? this.emptyTableText : labels.zeroRecords;
        var filterLength = _.size(_.compact(this.collection.filters));
        if (filterLength > 0) {
          this.emptyTableText = labels.emptySearchTable;
        }
      }
    }
  };
  TableView.prototype._showInlineBar = function(args) {
    this.options.inlineBar.options._compareId = this.options.inlineBar.options._compareId || _.uniqueId("i_b_op_");
    this.options.inlineBar.options.addGroupSeparators = true;
    this.options.originatingView.options.origInlineBarOptions = this.options.originatingView.options.origInlineBarOptions || _.clone(this.options.inlineBar.options);
    if (args.node.get("type") === constants.Types.WORKFLOW) {
      _.extend(this.options.inlineBar.options, _.extend({
        collection: WorkflowToolItems.inlineActionbar,
        toolItemsMask: new WorkflowToolItemsMasks().toolbars.inlineActionbar
      }, WorkflowToolItems.inlineActionbar.options));
    } else if (args.node.get("type") === constants.Types.TASK && this.isTreeMode) {
      _.extend(this.options.inlineBar.options, _.extend({
        collection: TaskToolItems.auditInlineActionbar,
        toolItemsMask: new TaskToolItemsMasks().toolbars.auditInlineActionbar
      }, TaskToolItems.auditInlineActionbar.options));
    } else if (this.options.inlineBar.options._compareId === this.options.originatingView.options.origInlineBarOptions._compareId) {
      this.options.inlineBar.options = _.clone(this.options.originatingView.options.origInlineBarOptions);
    }
    origShowInlineBar.call(this, args);
  };
  TableView.prototype.currentlyFocusedElement = function() {
    var focusedElement = origCurrentlyFocusedElement.apply(this, arguments);
    if (focusedElement && focusedElement.attr("disabled") === "disabled") {
      return;
    }
    return focusedElement;
  };
  TableView.prototype.onViewStateChanged = function() {
    var viewStateModel = this.context.viewStateModel, filterAsString = viewStateModel.getViewState("filter", true);
    if (this.enableViewState) {
      if (filterAsString && !_.isEmpty(filterAsString)) {
        const filter = JSON.parse(filterAsString);
        if (!_.isEqual(this.collection.filter, filter)) {
          this.applyFilter(filter);
        }
      } else if (this.collection.filters) {
        this.collection.clearFilter();
      }
    }
  };
});