/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/lib/jquery.dataTables.bootstrap/js/dataTables.bootstrap", "csui/lib/jquery.dataTables.tableTools/js/dataTables.tableTools", "i18n!csui/controls/table/impl/nls/lang", "csui/utils/log", "csui/utils/base", "csui/controls/table/cells/cell.factory", "csui/models/nodechildrencolumn", "csui/controls/progressblocker/blocker", "csui/utils/contexts/factories/connector", "csui/behaviors/default.action/impl/defaultaction", "csui/controls/checkbox/checkbox.view", "csui/controls/disclosure/disclosure.view", "csui/controls/table/cells/select/select.view", "csui/controls/table/cells/searchbox/searchbox.view", "csui/controls/table/cells/searchbox/otcsearchbox.view", "csui/controls/table/cells/searchbox/typeahead.searchbox.view", "csui/controls/table/inlineforms/inlineform.factory", "csui/controls/table/rows/metadata/metadatarow.view", "csui/controls/table/rows/error/errorrow.view", "csui/controls/table/impl/table.header.view", "csui/controls/table/impl/table.body.view", "csui/utils/accessibility", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/controls/mixins/view.state/node.view.state.mixin", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/toolbar/toolbar.command.controller", "csui/controls/table/impl/column.menu/column.header.menu.view", "csui/models/mixins/v2.fields/v2.fields.mixin", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "i18n", "i18n!csui/controls/table/cells/toggledetails/impl/nls/lang", "css!csui/controls/table/impl/table.css-vars", "css!csui/controls/table/impl/table", "csui/lib/jquery.mousehover", "csui/lib/jquery.scrollbarwidth", "csui/lib/jquery.renametag" ], function(module, $, _, Backbone, Marionette, DataTables, TableTools, lang, log, base, cellViewFactory, NodeChildrenColumnModel, BlockingView, ConnectorFactory, DefaultActionController, CheckboxView, DisclosureView, SelectCellView, SearchBoxView, OtcSearchBoxView, TypeaheadSearchBoxView, inlineFormViewFactory, MetadataRowView, ErrorRowView, TableHeaderView, TableBodyView, Accessibility, ViewEventsPropagationMixin, NodeViewStateMixin, FilteredToolItemsCollection, ToolbarCommandController, ColumnHeaderMenuView, FieldsV2Mixin, theming, jatoIcons, i18n, toggleDetailsLang) {
  "use strict";
  log = log(module.id);
  var config = module.config();
  var accessibleTable = Accessibility.isAccessibleTable();
  const useOtcSearch = new URLSearchParams(window.location.search).get("useOtcSearch");
  var TableView = Marionette.View.extend({
    className: function() {
      var className = "csui-nodetable";
      if (accessibleTable) {
        className += " csui-wrap-text";
      }
      return className;
    },
    constructor: function TableView(options) {
      options || (options = {});
      _.defaults(config, {
        minNumberOfToolbarItems: options.minNumberOfToolbarItems
      });
      _.defaults(config, {
        minNumberOfToolbarItems: 2
      });
      this.tableColumnsWrappingOn = !options.tableColumnsWrappingOff;
      var focusView = options.focusView ? options.focusView : "tableBody";
      this.accFocusedState = {
        focusView: focusView,
        headerColumn: 0,
        body: {
          column: 0,
          row: 0
        }
      };
      this.context = options.context;
      this.enableViewState = options.enableViewState && this.context && this.context.viewStateModel.get("enabled");
      this.orderByFromServer = "";
      this._allSelectedNodes = options.allSelectedNodes || new Backbone.Collection();
      this.expandedDetailRows = {};
      this._showEmptyViewText = true;
      this.columnHeadersVisible = true;
      this.columnsWithSearch = options.columnsWithSearch || [];
      _.each(this.columnsWithSearch, _.bind(function(c, i) {
        this.columnsWithSearch[i] = this.columnsWithSearch[i].toLowerCase();
      }, this));
      this.columnMenus = [];
      this.columnsWithTypeaheadSearchbox = _.keys(options.columnsWithTypeaheadSearchbox) || [];
      _.each(this.columnsWithTypeaheadSearchbox, _.bind(function(c, i) {
        this.columnsWithTypeaheadSearchbox[i] = this.columnsWithTypeaheadSearchbox[i].toLowerCase();
      }, this));
      this.searchBoxes = [];
      if (options.filterBy) {
        _.each(options.filterBy, _.bind(function(val, key) {
          if (options.collection.filters) {
            options.collection.filters[key] = val;
          }
        }, this));
      }
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
      this.additionalColumns = options.additionalColumns || [];
      if (!options.collection) {
        throw new Error("table.view options require a collection to be set");
      }
      Marionette.View.prototype.constructor.apply(this, arguments);
      var defaultOptions = {
        enableSorting: true,
        selectColumn: true,
        haveToggleAllDetailsRows: this.tableColumnsWrappingOn && !accessibleTable,
        haveDetailsRowExpandCollapseColumn: this.tableColumnsWrappingOn && !accessibleTable,
        selectRows: "multiple",
        selectAllColumnHeader: true,
        nameEdit: true,
        maxColumnsDisplayed: 25,
        pinnedAreaMaxFactor: .6,
        spacing: "medium"
      };
      _.defaults(this.options, defaultOptions);
      switch (this.options.selectRows) {
       case "single":
        this.options.selectAllColumnHeader = false;
        break;

       case "multiple":
        break;

       default:
        this.options.selectRows = "none";
        this.options.selectAllColumnHeader = false;
        this.options.selectColumn = false;
      }
      if (this.options.orderBy || this.enableViewState) {
        this.collection.setOrder(this.options.orderBy, false);
        delete this.options.orderBy;
      } else if (!this.options.collection.orderBy) {
        this.collection.setOrder("name asc", false);
      }
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.connector = this.options.connector;
      if (!this.connector) {
        this.connector = this.context.getObject(ConnectorFactory);
      }
      this.columns = this.options.columns;
      if (!this.columns) {
        this.columns = this.collection.columns;
        if (!this.columns) {
          throw new Error("table.view options require columns or collection.columns to be set");
        }
      }
      this._ViewCollection = Backbone.Collection.extend({
        model: this.collection.model
      });
      this.selectedChildren = new this._ViewCollection();
      this.listenTo(this.selectedChildren, "reset", function() {
        this._showOrHideAlternativeHeaderView();
      });
      this.listenTo(this.collection, "reset", this._handleResponseSortBy).listenTo(this.collection, "reset", this._handleModelsReset).listenTo(this.collection, "update", this._handleModelsUpdate).listenTo(this.collection, "remove", this._handleModelRemove).listenTo(this.collection, "change", this.updateRow).listenTo(this.collection, "request", this.blockActions).listenTo(this.collection, "sync", this.unblockActions).listenTo(this.collection, "sync", this._handlePendingFilter).listenTo(this.collection, "new:page", this.resetScrollToTop).listenTo(this.collection, "reset", this._updateSelectedChildren).listenTo(this.collection, "remove", this._updateSelectedChildren).listenTo(this.collection, "destroy", this.unblockActions).listenTo(this.collection, "error", this.unblockActions).listenTo(this.columns, "update reset remain", this._handleColumnsReset);
      if (this.enableViewState) {
        this.listenTo(this.context.viewStateModel, "change:state", this.onViewStateChanged);
      }
      this.listenTo(this.collection, "orderBy:change", this._collectionOrderByChanged).listenTo(this.collection, "filter:change", this._collectionFilterChanged).listenTo(this.collection, "filter:clear", this._collectionFilterCleared);
      if (this.options.tableColumns) {
        this.listenTo(this.options.tableColumns, "reset update", this._handleTableColumnsReset);
      }
      if (this.context) {
        this.listenTo(this.context, "request:perspective", this._handlePerspectiveContextRequest).listenTo(this.context, "request request:perspective", this._handleContextRequest).listenTo(this.context, "sync", this._handleContextSync).listenTo(this.context, "sync error error:perspective", this._handleContextFinish).listenTo(this.context, "request", this.blockActions).listenTo(this.context, "sync", this.unblockActions);
      }
      this.listenTo(this.collection, "reset", function() {
        if (!this.isRendered) {
          return;
        }
        if (!this.table) {
          return;
        }
        updateSelectAllCheckbox.call(this);
      });
      this.listenTo(this.collection, "reset", this.setFocusToFirstRow).listenTo(this.collection, "add", this.setFocusToFirstRow).listenTo(this.collection, "remove", this.setFocusToFirstRow).listenTo(this.collection, "destroy", this.setFocusToFirstRow);
      if (this.collection.fetching) {
        this.blockActions();
        this.disableEmptyViewText();
      }
      this.disableEmptyViewText();
      this.listenTo(this, "dom:refresh", this._handleDomRefresh);
      this.listenTo(this, "show:descriptions", this.showDetailRowDescriptions);
      this.listenTo(this, "clickDefaultPreAction", function(event) {
        this.triggerMethod("execute:defaultAction", event.node);
      });
      if (this.collection.node) {
        this.listenTo(this.collection.node, "change:id", this.setFocusToFirstRow);
        this.listenTo(this.collection.node, "change:id", this._clearSearchBoxes);
        this.listenTo(this.collection.node, "change:id", this._clearExpandedRows);
        this.listenTo(this.collection.node, "change:id", function() {});
      }
      this._nowrapTableResizeObserver = new ResizeObserver(() => {
        this._saveBrowserColumnWidthsInNoWrapMode();
        this._adjustInlineFormWidthInNoWrapMode();
        if (this._el_lastPinnedHeader) {
          var pinnedWidths = getPinnedWidths.call(this);
          if (pinnedWidths.areaWidth > pinnedWidths.maxWidth) {
            var pinnedResizeIndex = getPinnedResizeIndex.call(this);
            if (pinnedResizeIndex >= 0) {
              const resizeColumn = this.displayedColumns[pinnedResizeIndex];
              const resizeHeader = this._el_headerCells[pinnedResizeIndex];
              const resizeRect = resizeHeader.getBoundingClientRect();
              const newWidth = Math.max(resizeRect.width - (pinnedWidths.areaWidth - pinnedWidths.maxWidth), resizeColumn.columnMinWidth);
              log.debug("table do resize: {0} area: {1}->{2} column: {3} {4}->{5}", pinnedWidths.maxWidth, pinnedWidths.areaWidth, pinnedWidths.areaWidth - (resizeColumn.columnWidth - newWidth), pinnedResizeIndex, resizeColumn.columnWidth, newWidth) && console.log(log.last);
              if (this._lastColumnWidths) {
                this._lastColumnWidths[pinnedResizeIndex] = newWidth;
              }
              setColumnsWidthAndOffset.call(this, pinnedResizeIndex, {
                value: newWidth
              });
              this._adjustColumnsInNoWrapMode();
              if (this.hoveredRow) {
                this._destroyOldAndCreateNewInlineBar({
                  sender: this,
                  target: this.hoveredRow,
                  node: this.table.row(this.hoveredRow).data()
                });
              }
            } else {
              log.debug("table no resize: {0} area: {1}", pinnedWidths.maxWidth, pinnedWidths.areaWidth) && console.log(log.last);
            }
          }
        }
        if (this._el_verticalStickyDivider) {
          var dividerHeight = Math.min(this._el_wrapper.clientHeight, this._el_table.clientHeight);
          this._el_verticalStickyDivider.style.height = `${dividerHeight}px`;
        }
      });
      this._nowrapHeaderResizeObserver = new ResizeObserver(entries => {
        this._saveBrowserColumnWidthsInNoWrapMode();
        if (entries && entries.length) {
          const spacingNumbers = entries.map(entry => +entry.target.getAttribute("csui-resize-spacing")).filter(Boolean);
          [ ...new Set(spacingNumbers) ].forEach(spacingNumber => {
            const spacingColumn = this.displayedColumns[spacingNumber - 1];
            const spacingHeader = this._el_headerCells[spacingNumber - 1];
            if (spacingHeader) {
              var handleIndex;
              for (var ii = spacingNumber; ii < this.displayedColumns.length; ++ii) {
                if (this.displayedColumns[ii].hasResizeHandle) {
                  handleIndex = ii;
                  break;
                }
              }
              const resizeHandleHeader = this._el_headerCells[handleIndex];
              const resizeHandleElement = resizeHandleHeader?.querySelector(".csui-column-resize-handle");
              if (resizeHandleElement) {
                let isEnoughSpaceForResizeHandle;
                if (i18n.settings.rtl) {
                  isEnoughSpaceForResizeHandle = spacingHeader.getBoundingClientRect().left > resizeHandleElement.getBoundingClientRect().right;
                } else {
                  isEnoughSpaceForResizeHandle = spacingHeader.getBoundingClientRect().right < resizeHandleElement.getBoundingClientRect().left;
                }
                if (isEnoughSpaceForResizeHandle) {
                  spacingHeader.classList.remove("csui-resize-handle-padding");
                  spacingHeader.classList.remove("csui-resize-handle-spacing");
                } else {
                  spacingHeader.classList.add(spacingColumn.filterable ? "csui-resize-handle-padding" : "csui-resize-handle-spacing");
                  spacingHeader.classList.remove(spacingColumn.filterable ? "csui-resize-handle-spacing" : "csui-resize-handle-padding");
                }
              }
            }
          });
        }
      });
      if (this.tableColumnsWrappingOn && !accessibleTable) {
        this.resizeHandler = _.debounce(_.bind(this._adjustColumnsIfViewResized, this), 50);
        addEventListener("resize", this.resizeHandler);
      }
      this.listenTo(this, "before:destroy", function() {
        this._nowrapTableResizeObserver.disconnect();
        this._nowrapHeaderResizeObserver.disconnect();
        if (this.tableColumnsWrappingOn && !accessibleTable) {
          removeEventListener("resize", this.resizeHandler);
        }
        if (!this.tableColumnsWrappingOn && this._tableScrollHandler) {
          this._el_wrapper.removeEventListener("scroll", this._tableScrollHandler);
          delete this._tableScrollHandler;
        }
        destroyTable.call(this);
      });
      if (this.options.inlineBar) {
        this._setInlineBarEvents();
      }
      this._tableColumnsResetTime = this._columnsResetTime = 1;
      this._columnsComputeTime = 0;
      this._isResizing = false;
    },
    events: {
      keydown: "onKeyInView",
      "pointerdown thead": "_clearTextSelection"
    },
    _clearTextSelection: function(event) {
      if (event.button !== 0) {
        return;
      }
      document.getSelection().empty();
    },
    render: function() {
      if (this._renderingTableDelayedAsync) {
        log.debug("render: currently in async render -> skip") && console.log(log.last);
        return;
      }
      this._initializeLocalizableLabels();
      if (!(this.columns && this.columns.length)) {
        if (this.collection && this.collection.length) {
          log.debug("No columns -> skip render") && console.log(log.last);
          this._renderFake();
        } else {
          log.debug("No columns and no rows -> render empty text") && console.log(log.last);
          this._renderEmpty();
        }
        return;
      }
      log.debug("render") && console.log(log.last);
      this._startTableRendering = new Date();
      if (performance && performance.mark) {
        performance.mark("start_table_render");
      }
      this._ensureViewIsIntact();
      this._inlineBarShouldDestroy();
      if (this.table) {
        saveStateBeforeRebuild.call(this);
        if (this._toggleExpandAllRegion) {
          this._toggleExpandAllRegion.destroy();
          delete this._toggleExpandAllRegion;
        }
        destroyTable.call(this);
      }
      if (!this.tableColumnsWrappingOn || this._canMeasureTableSize()) {
        this._renderTableDelayed = false;
        this._beforeRenderTable();
        this._preRenderTable();
        this._renderTable();
      } else {
        this._renderTableDelayed = true;
        this._renderingTableDelayedAsync = false;
        this._beforeRenderTable();
        this._renderFake();
      }
    },
    onBeforeRender: function() {
      this._startBeforeTableRendering = new Date();
    },
    onRender: function() {
      var endTableRendering = new Date();
      var diff = endTableRendering - this._startBeforeTableRendering;
      if (this._startTableRendering) {
        var diffTotal = endTableRendering - this._startTableRendering;
        log.debug("TIMINGS: rendering totally " + diffTotal + "ms. beforeRender...render " + diff + "ms") && console.log(log.last);
        if (performance && performance.mark) {
          performance.mark("end_table_render");
          performance.measure("table_render", "start_table_render", "end_table_render");
        }
      } else {
        log.debug("TIMINGS: beforeRender...render took " + diff + "ms") && console.log(log.last);
      }
      delete this._startTableRendering;
    },
    _saveBrowserColumnWidthsInNoWrapMode: function() {
      if (!this._inlineFormInfo) {
        this._lastColumnWidths = Array.from(this._el_table.querySelectorAll(":scope>thead>tr>th"), el => el.offsetWidth);
      }
    },
    _adjustInlineFormWidthInNoWrapMode: function(table) {
      const inlineFormInfo = this._inlineFormInfo;
      if (inlineFormInfo) {
        const wrapperRect = this._el_wrapper.getBoundingClientRect();
        const inlineRect = inlineFormInfo.td.getBoundingClientRect();
        const otherWidth = i18n.settings.rtl ? wrapperRect.right - inlineRect.right : inlineRect.x - wrapperRect.x;
        const maxWidth = this._el_wrapper.clientWidth - otherWidth;
        const children = inlineFormInfo.td.querySelectorAll(":scope>.csui-inline-editform");
        children.forEach(child => child.style.maxWidth = `${maxWidth}px`);
      }
    },
    _adjustColumnsInNoWrapMode: function(table, fittingIndex) {
      const tableEl = (!table || table.querySelectorAll ? table : table[0]) || this._el_table;
      tableEl.querySelectorAll(":scope>thead>tr:not(.csui-details-row)").forEach(row => {
        row.querySelectorAll(":scope>th").forEach((el, thIndex) => {
          this._adjustCellInNoWrapMode(el, undefined, thIndex, fittingIndex);
        });
      });
      tableEl.querySelectorAll(":scope>tbody>tr:not(.csui-details-row)").forEach((row, trIndex) => {
        row.querySelectorAll(":scope>td").forEach((el, tdIndex) => {
          this._adjustCellInNoWrapMode(el, trIndex, tdIndex, fittingIndex);
        });
      });
    },
    _adjustCellInNoWrapMode: function(el, trIndex, tdIndex, fittingIndex) {
      const inlineFormInfo = this._inlineFormInfo;
      if (inlineFormInfo && trIndex === inlineFormInfo.trIndex && tdIndex === 0) {
        inlineFormInfo.stickyOffset = [];
        inlineFormInfo.columnWidth = [];
        inlineFormInfo.columnMinWidth = [];
      }
      let stickyOffset;
      let columnWidth;
      let columnMinWidth;
      const setStickyOffsetInInlineRow = tdIndex => {
        if (fittingIndex != null && tdIndex > fittingIndex) {
          stickyOffset = "";
        } else if (tdIndex === 0) {
          stickyOffset = 0;
        } else {
          stickyOffset = inlineFormInfo.stickyOffset[tdIndex - 1] + inlineFormInfo.columnWidth[tdIndex - 1];
        }
      };
      const setColumnWidthInInlineRow = columnIndex => {
        const column = this.displayedColumns[columnIndex];
        if (columnIndex !== fittingIndex) {
          columnWidth = this._lastColumnWidths ? this._lastColumnWidths[columnIndex] : column.columnWidth;
        }
        columnMinWidth = column.columnMinWidth;
      };
      if (inlineFormInfo && trIndex === inlineFormInfo.trIndex && inlineFormInfo.tdIndex <= inlineFormInfo.lastPinnedIndex && tdIndex >= inlineFormInfo.tdIndex) {
        if (tdIndex === inlineFormInfo.tdIndex) {
          setStickyOffsetInInlineRow(tdIndex);
          columnWidth = 0;
          for (let index = inlineFormInfo.tdIndex; index <= inlineFormInfo.lastPinnedIndex; index++) {
            const column = this.displayedColumns[index];
            if (index !== fittingIndex) {
              columnWidth += this._lastColumnWidths ? this._lastColumnWidths[index] : column.columnWidth || column.columnMinWidth || 0;
            } else {
              columnWidth += column.columnMinWidth || 0;
            }
          }
        } else {
          const index = tdIndex + inlineFormInfo.lastPinnedIndex - inlineFormInfo.tdIndex;
          setColumnWidthInInlineRow(index);
        }
      } else if (inlineFormInfo && trIndex === inlineFormInfo.trIndex && inlineFormInfo.tdIndex > inlineFormInfo.lastPinnedIndex && tdIndex > inlineFormInfo.lastPinnedIndex) {
        if (tdIndex <= inlineFormInfo.tdIndex) {
          setStickyOffsetInInlineRow(tdIndex);
        }
        setColumnWidthInInlineRow(tdIndex);
      } else {
        const column = this.displayedColumns[tdIndex];
        if (column.attributes.customization_pinned) {
          if (fittingIndex != null && tdIndex > fittingIndex) {
            stickyOffset = "";
          } else {
            stickyOffset = column.stickyOffset;
          }
        }
        if (tdIndex !== fittingIndex) {
          if (inlineFormInfo && trIndex === inlineFormInfo.trIndex && column.columnWidth == null) {
            columnWidth = this._lastColumnWidths ? this._lastColumnWidths[tdIndex] : column.columnWidth;
          } else {
            columnWidth = column.columnWidth;
          }
        }
        columnMinWidth = column.columnMinWidth;
      }
      if (inlineFormInfo && trIndex === inlineFormInfo.trIndex) {
        inlineFormInfo.stickyOffset[tdIndex] = stickyOffset;
        inlineFormInfo.columnWidth[tdIndex] = columnWidth;
        inlineFormInfo.columnMinWidth[tdIndex] = columnMinWidth;
      }
      if (columnWidth != null) {
        el.classList.remove("csui-column-adapt");
        el.classList.add("csui-column-sized");
      } else {
        el.classList.remove("csui-column-sized");
        el.classList.add("csui-column-adapt");
      }
      if (stickyOffset != null) {
        const stickyOffsetStyle = stickyOffset || stickyOffset === 0 ? _.str.sformat("{0}px", stickyOffset) : "";
        if (i18n.settings.rtl) {
          el.style.right = stickyOffsetStyle;
        } else {
          el.style.left = stickyOffsetStyle;
        }
      }
      if (columnWidth != null) {
        var widthStyle = _.str.sformat("{0}px", columnWidth);
        el.style.width = "unset";
        el.style.minWidth = widthStyle;
        el.style.maxWidth = widthStyle;
      } else if (columnMinWidth != null) {
        var minWidthStyle = _.str.sformat("{0}px", columnMinWidth);
        el.style.minWidth = minWidthStyle;
      }
    },
    _handleDomRefresh: function() {
      if (!this.tableColumnsWrappingOn) {
        log.debug("onDomRefresh: column wrapping off -> skip handling delayed rendering") && console.log(log.last);
        if (this.activeInlineForm) {
          this.activeInlineForm.triggerMethod("dom:refresh", this.activeInlineForm);
        }
        this.columnMenus.forEach(cm => {
          cm.triggerMethod("dom:refresh", cm);
        });
        return;
      }
      if (this._renderingTableDelayedAsync) {
        log.debug("_handleDomRefresh: currently in async render -> skip") && console.log(log.last);
      } else {
        if (this._renderTableDelayed) {
          log.debug("_handleDomRefresh -> need to render table delayed") && console.log(log.last);
          this._startTableRendering = new Date();
          if (this._canMeasureTableSize()) {
            this._renderingTableDelayedAsync = true;
            log.debug("_handleDomRefresh: el is visible -> start rendering (async)") && console.log(log.last);
            var self = this;
            self._renderTableDelayed = false;
            self._renderingTableDelayedAsync = false;
            self._beforeRenderTable();
            self._preRenderTable();
            self._renderTable();
          } else {
            if (document.body.contains(this.el)) {
              log.debug("_handleDomRefresh: el is in DOM but still not measurable -> skip render") && console.log(log.last);
            } else {
              log.warn("WARNING: _handleDomRefresh: el is not in DOM and therefore not measurable ->" + " skip render (dom:refresh should not be triggered on table.view if" + " table.view is not attached to the DOM)") && console.log(log.last);
            }
          }
        } else {
          log.debug("_handleDomRefresh -> checking if columns must be adjusted") && console.log(log.last);
          this._adjustColumnsIfViewResized();
        }
        if (this.activeInlineForm) {
          this.activeInlineForm.triggerMethod("dom:refresh", this.activeInlineForm);
        }
      }
    },
    _canMeasureTableSize: function() {
      var isVisible = document.body.contains(this.el) && (this.el.offsetWidth || this.el.offsetHeight || this.el.getClientRects().length);
      return isVisible;
    },
    _renderFake: function() {
      log.debug("_renderFake") && console.log(log.last);
      this.isRendered = true;
      this.triggerMethod("render", this);
    },
    _renderEmpty: function() {
      log.debug("_renderEmpty") && console.log(log.last);
      this.triggerMethod("before:render", this);
      this.showOrHideZeroRecordsMessage();
      this.isRendered = true;
      this.triggerMethod("render", this);
    },
    _beforeRenderTable: function() {
      log.debug("_beforeRenderTable") && console.log(log.last);
      this.isRendered = false;
      this.triggerMethod("before:render", this);
      this._ensureFreshColumns();
      this.updateCollectionParameters();
    },
    _preRenderTable: function() {
      log.debug("_preRenderTable") && console.log(log.last);
      if (this._extraWidthForToolbarItems === undefined) {
        this._extraWidthForToolbarItems = 0;
        if (this.options.inlineBar && this.options.inlineBar.viewClass) {
          var inlineActionBarViewClass = this.options.inlineBar.viewClass;
          if (inlineActionBarViewClass.estimateWidthForToolbarItems) {
            var minNumberOfToolbarItems = config.minNumberOfToolbarItems;
            var fontSize = 13;
            this._extraWidthForToolbarItems = Math.floor(inlineActionBarViewClass.estimateWidthForToolbarItems(minNumberOfToolbarItems, fontSize));
          }
        }
      }
      if (this.tableColumnsWrappingOn) {
        var tableWidth = this.$el.outerWidth();
        tableWidth -= $.scrollbarWidth();
        this.maxColumnsDisplayed = this._calculateMaxColumnsDisplayed(tableWidth);
        log.debug("Table width is " + tableWidth + ". Displaying max. " + this.maxColumnsDisplayed + " columns") && console.log(log.last);
        this._setColumnsWrappedByAvailableWidth();
        log.debug("Columns displayed: " + this.displayedColumns.length + ", wrapped: " + this.wrappedColumns.length) && console.log(log.last);
      }
    },
    _renderTable: function() {
      log.debug("_renderTable") && console.log(log.last);
      this.$el.addClass("csui-nodetable");
      if (this._isSingleSelectionEnabled()) {
        this.$el.addClass("csui-single-select");
      }
      createTable.call(this);
      this.accFocusedState.body.row = 0;
      this.accFocusedState.body.column = TableBodyView.getNameColumnIndex(this.displayedColumns) || 0;
      this.showOrHideZeroRecordsMessage();
      const scrollContainer = this._getScrollContainer();
      scrollContainer.addClass("csui-normal-scrolling");
      this.tableColumnsWrappingOn && scrollContainer.addClass("csui-no-scroll-x");
      if (this.$el.parent().length > 0) {
        var displayStyle = this.$el.parent().css("display");
        if (displayStyle.indexOf("flex") < 0) {
          this.$el.addClass("csui-not-in-flex-container");
        }
      }
      this.$el.removeClass("csui-not-ready");
      if (this.tableColumnsWrappingOn) {
        this._adjustColumns();
        this._previousViewWidth = this._calculateActualTableWidth();
      }
      if (!this.tableColumnsWrappingOn && this._el_wrapper) {
        this._tableScrollHandler = _.bind(this._handleScrollEvent, this);
        this._el_wrapper.addEventListener("scroll", this._tableScrollHandler);
        this._el_wrapper.addEventListener("touchmove", this._tableScrollHandler);
      }
      this.isRendered = true;
      this.triggerMethod("render", this);
    },
    _handleScrollEvent: function(event) {
      if (this.inlineBarView) {
        var nRow = this.inlineBarView.el.closest("tr");
        if (headerRowOverlap.call(this, nRow)) {
          this._inlineBarShouldDestroy();
        }
      } else if (this.hoveredRow) {
        this._destroyOldAndCreateNewInlineBar({
          sender: this,
          target: this.hoveredRow,
          node: this.table.row(this.hoveredRow).data()
        });
      }
      if (event.target.scrollLeft > 0) {
        this._el_table.classList.add("csui-table-horizontally-scrolled");
      } else {
        this._el_table.classList.remove("csui-table-horizontally-scrolled");
      }
      this._hidePopovers();
    },
    _hidePopovers: function() {
      const popoverTarget = $("body").find(".binf-popover");
      if (popoverTarget) {
        popoverTarget.binf_popover("destroy");
      }
      this.$("otc-menu[usepopover][isopen]").attr("isopen", null);
      this.$("otc-flyout[isopen]").each((index, flyout) => {
        var nRow = flyout.closest("tr");
        if (headerRowOverlap.call(this, nRow)) {
          flyout.isOpen = false;
        }
      });
    },
    _drawTable: function() {
      if (this.table) {
        this._inlineBarShouldDestroy();
        this.triggerMethod("before:render", this);
        this.table.draw();
        this._adjustColumns();
        this.triggerMethod("render", this);
      } else {
        this.render();
      }
    },
    _calculateMaxColumnsDisplayed: function(maxWidth) {
      var averageWidth = 90;
      var maxColumnsDisplayed = 0, usedWidth = 0, widthFactor, width;
      _.each(this.allColumns, function(column) {
        if (column.attributes) {
          if (column.attributes.permanentColumn === true) {
            widthFactor = column.attributes && column.attributes.widthFactor;
            width = widthFactor ? averageWidth * widthFactor : averageWidth;
            if (column.isNaming) {
              width += this._extraWidthForToolbarItems;
            }
            usedWidth += width;
            maxColumnsDisplayed++;
          }
        }
      }, this);
      for (var colno = 0; colno < this.allColumns.length; colno++) {
        var column = this.allColumns[colno], selectorWidth, childrenInNthColumn;
        if (column.attributes) {
          if (!column.attributes.permanentColumn) {
            widthFactor = column.attributes && column.attributes.widthFactor;
            selectorWidth = averageWidth;
            width = widthFactor ? selectorWidth * widthFactor : selectorWidth;
            usedWidth += width;
            if (usedWidth > maxWidth) {
              break;
            }
            maxColumnsDisplayed++;
          }
        }
      }
      if (maxColumnsDisplayed > this.options.maxColumnsDisplayed) {
        maxColumnsDisplayed = this.options.maxColumnsDisplayed;
      }
      if (maxColumnsDisplayed < 1) {
        maxColumnsDisplayed = 1;
      }
      return maxColumnsDisplayed;
    },
    _ensureFreshColumns: function() {
      if (this._tableColumnsResetTime > this._columnsComputeTime || this._columnsResetTime > this._columnsComputeTime || columnsWereResetSilently.call(this)) {
        this._getColumns();
      }
    },
    _getColumns: function() {
      this.trigger("buildingColumnDefinitions", {
        sender: this
      });
      const customizationKeysReadOnly = [ "customization_resizeable", "customization_resize_span", "customization_min_width" ];
      const clientColumnsByKey = this.options.tableColumns?.reduce((obj, col) => (obj[col.get("key")] = col, 
      obj), {}) || {};
      var cols = [];
      if (this.options.tableColumns) {
        var tableColumns = this.options.tableColumns.deepClone();
        this._columnModelsByKey = Object.fromEntries(this.columns.map(column => [ column.get("column_key"), column ]));
        var clientNamingKey, serverNamingKey;
        const displayableColumns = this.getDisplayableColumns();
        displayableColumns.forEach(function(nodeColumnModel) {
          var key = nodeColumnModel.get("column_key");
          if (nodeColumnModel.get("isNaming") === true) {
            serverNamingKey = key;
            nodeColumnModel.unset("isNaming", {
              silent: true
            });
          }
          var tableColumnToMergeWithServerColumn = tableColumns.findWhere({
            key: key
          });
          var order = getColumnSequence(tableColumnToMergeWithServerColumn, nodeColumnModel, {
            withCustomizations: true
          });
          if (tableColumnToMergeWithServerColumn) {
            if (order !== tableColumnToMergeWithServerColumn.get("sequence")) {
              tableColumnToMergeWithServerColumn.set("sequence", order);
              tableColumns.remove(tableColumnToMergeWithServerColumn, {
                silent: true
              });
              tableColumns.add(tableColumnToMergeWithServerColumn, {
                silent: true
              });
            }
            if (tableColumnToMergeWithServerColumn.get("isNaming") === true) {
              clientNamingKey = tableColumnToMergeWithServerColumn.get("key");
            }
          } else {
            tableColumns.add({
              key: key,
              sequence: order
            });
          }
        }, this);
        var namingKey = clientNamingKey || serverNamingKey || "name";
        var sortedColumns = [];
        if (!this.tableColumnsWrappingOn) {
          addSelectColumn(this, displayableColumns, this._columnModelsByKey);
        }
        const displayColumnsByKey = Object.fromEntries(displayableColumns.map(column => [ column.get("column_key"), column ]));
        function prepareColumn(tableColumn) {
          if (tableColumn.get("onlyIfNoWrapTableMode") && this.tableColumnsWrappingOn) {
            return;
          }
          var column_key = tableColumn.get("key");
          if (column_key === namingKey) {
            tableColumn.set("isNaming", true);
          }
          if (displayColumnsByKey[column_key]) {
            var colDef = this._columnModelsByKey[column_key];
            if (column_key === namingKey) {
              colDef.set("isNaming", true);
            }
            var CellView = cellViewFactory.getCellView(colDef);
            var propertiesToMerge = [ "permanentColumn", "noTitleInHeader", "titleIconInHeader", "titleSvgInHeader", "title", "align", "widthFactor", "isNaming", "is_default_column" ];
            const useAsDefaultOnly = colDef.get("type") && colDef.get("definitions_order");
            const weakDefaults = _.extend({}, tableColumn.attributes, colDef.attributes);
            const propValues = useAsDefaultOnly ? weakDefaults : tableColumn.attributes;
            _.each(propertiesToMerge, function(propName) {
              var propToMerge = propValues[propName];
              if (propToMerge != null) {
                colDef.set(propName, propToMerge, {
                  silent: true
                });
              } else {
                if (CellView[propName]) {
                  colDef.set(propName, CellView[propName], {
                    silent: true
                  });
                }
              }
            });
            _.each(TableView.columnCustomizationKeys, function(key) {
              var modelAttributeName = "customization_" + key;
              var propToMerge = tableColumn.get(modelAttributeName);
              var targetProp = colDef.get(modelAttributeName);
              if (customizationKeysReadOnly.includes(modelAttributeName) || propToMerge !== undefined && targetProp === undefined) {
                colDef.set(modelAttributeName, propToMerge, {
                  silent: true
                });
              }
            }, this);
            sortedColumns.push(colDef);
          } else {
            log.warn("Client side column with key '" + column_key + "' is not part of server columns") && console.log(log.last);
          }
        }
        tableColumns.each(prepareColumn.bind(this));
        if (sortedColumns.length > 0) {
          if (this.tableColumnsWrappingOn) {
            addSelectColumn(this, sortedColumns, this._columnModelsByKey);
          } else if (this.options.selectColumn && sortedColumns[0].get("column_key") !== "_select") {
            clientColumnsByKey["_select"] = new Backbone.Model({
              key: "_select",
              sequence: 1,
              permanentColumn: true,
              customization_resizeable: false,
              customization_width: 32
            });
            prepareColumn.call(this, clientColumnsByKey["_select"]);
            sortedColumns.unshift(sortedColumns.pop());
          }
          sortedColumns = getAdditionalColumns(this, sortedColumns, this._columnModelsByKey);
        }
        var sortedNotPinnedColumns = [];
        var sortedPinnedColumns = [];
        if (this.tableColumnsWrappingOn) {
          sortedNotPinnedColumns = sortedColumns;
        } else {
          const selectColumn = sortedColumns.length > 0 && sortedColumns[0].get("column_key") === "_select" && sortedColumns.shift();
          _.each(sortedColumns, function(sColumn) {
            var custPinned = sColumn.get("customization_pinned");
            if (custPinned) {
              sortedPinnedColumns.push(sColumn);
            } else {
              sortedNotPinnedColumns.push(sColumn);
            }
          }, this);
          if (selectColumn) {
            if (sortedPinnedColumns.length > 0) {
              selectColumn.set("customization_pinned", true, {
                silent: true
              });
            }
            if (selectColumn.get("customization_pinned")) {
              sortedPinnedColumns.unshift(selectColumn);
            } else {
              sortedNotPinnedColumns.unshift(selectColumn);
            }
          }
        }
        var lastPinned = sortedPinnedColumns.length > 0 ? sortedPinnedColumns.length - 1 : undefined;
        cols = _.map(sortedPinnedColumns.concat(sortedNotPinnedColumns), function(definition) {
          var propertyName = definition.get("column_key"), CellView = cellViewFactory.getCellView(definition), accessibleText = definition.get("title") || definition.get("name");
          if (!accessibleText && propertyName !== "_toggledetails") {
            log.warn("No accessible text for column header " + propertyName) && console.log(log.last);
          }
          const tableColumn = clientColumnsByKey[propertyName];
          var column = {
            CellView: CellView,
            name: propertyName,
            attributes: {},
            defaultCustomizationWidth: tableColumn && tableColumn.get("default_customization_width"),
            noTitleInHeader: definition.get("noTitleInHeader"),
            titleIconInHeader: definition.get("titleIconInHeader"),
            titleSvgInHeader: definition.get("titleSvgInHeader"),
            isNaming: definition.get("isNaming"),
            title: accessibleText,
            titleAttr: definition.get("titleAttr"),
            orderable: !!definition.get("sort"),
            filterable: !!definition.get("filter") || _.indexOf(this.columnsWithSearch, propertyName.toLowerCase()) > -1,
            className: CellView.columnClassName,
            defaultAction: definition.get("default_action"),
            contextualMenu: definition.get("contextual_menu"),
            customHeader: definition.get("customHeader"),
            data: function(source, type) {
              if (type === "orderBy") {
                return definition.get("sort_key") || definition.get("column_key");
              }
              if (type === "filterBy") {
                return definition.get("filter_key") || definition.get("column_key");
              }
              if (type === "set") {
                throw new Error("Setting column value not implemented");
              } else {
                return CellView.getValue(source, column);
              }
            },
            render: function() {
              return "";
            }
          };
          var alignment = definition.get("align");
          if (alignment) {
            if (window.csui && window.csui.rtl) {
              alignment === "left" && (alignment = "right") || alignment === "right" && (alignment = "left");
            }
            column.className += " csui-align-" + alignment;
          }
          _.extend(column.attributes, definition.attributes);
          return column;
        }, this);
      } else {
        log.warn("No client side columns defined in this.options.tableColumns") && console.log(log.last);
      }
      this.allColumns = cols;
      this.displayedColumns = [];
      this.wrappedColumns = [];
      if (this.tableColumnsWrappingOn) {
        this.allColumns = cols = cols.filter(colDef => !colDef.attributes || isColumnVisible(colDef.attributes));
        _.each(cols, function(colDef) {
          if (colDef.attributes && colDef.attributes.permanentColumn === true) {
            colDef.columnWrapped = false;
            this.displayedColumns.push(colDef);
          }
        }, this);
      } else {
        var merging;
        _.each(cols, colDef => {
          if (isColumnVisible(colDef.attributes)) {
            const columnIndex = this.displayedColumns.length;
            this.displayedColumns.push(colDef);
            var columnNumber = this.displayedColumns.length;
            colDef.lastPinned = columnIndex === lastPinned;
            colDef.resizeable = colDef.attributes.customization_resizeable == null || colDef.attributes.customization_resizeable === true;
            colDef.isResizeColumn = colDef.hasResizeHandle = colDef.isSpacingColumn = colDef.resizeable;
            if (colDef.resizeable) {
              colDef.resizeNumber = columnNumber;
            } else {
              colDef.attributes.customization_width = clientColumnsByKey[colDef.name]?.get("customization_width");
            }
            var resize_span = colDef.attributes.customization_resize_span;
            if (resize_span) {
              merging = {
                startColumn: colDef,
                startIndex: columnIndex,
                resizeNumber: undefined,
                resizeColumn: undefined,
                includedColumns: [],
                endKey: resize_span
              };
            }
            if (merging) {
              merging.includedColumns.push(colDef);
              if (!merging.resizeColumn && colDef.resizeable) {
                merging.resizeColumn = colDef;
                merging.resizeNumber = columnNumber;
              }
              if (merging.resizeColumn && colDef.filterable) {
                merging.paddingColumn = colDef;
                merging.paddingNumber = columnNumber;
              }
              if (merging.endKey === colDef.name) {
                if (merging.startColumn !== colDef) {
                  merging.includedColumns.forEach((col, idx) => {
                    const spacingNumber = merging.paddingNumber || merging.resizeNumber;
                    col.spacingNumber = merging.startIndex + idx >= spacingNumber ? spacingNumber : undefined;
                    col.isSpacingColumn = merging.paddingNumber ? col === merging.paddingColumn : col === merging.resizeColumn;
                    col.resizeSpan = true;
                    col.resizeStart = col === merging.startColumn;
                    col.resizeEnd = col.name === merging.endKey;
                    col.resizeNumber = merging.resizeNumber;
                    col.isResizeColumn = col === merging.resizeColumn;
                    col.hasResizeHandle = merging.resizeColumn && col.name === merging.endKey;
                    if (!col.isResizeColumn) {
                      col.attributes.customization_width = clientColumnsByKey[col.name]?.get("customization_width");
                    }
                  });
                }
                merging = undefined;
              }
            }
            if (colDef.lastPinned) {
              merging = undefined;
            }
          }
        }, this);
        setColumnsWidthAndOffset.call(this);
      }
      this._columnsComputeTime = new Date().getTime();
      this.trigger("columnDefinitionsBuilt", {
        sender: this,
        columns: cols
      });
    },
    _setColumnsWrappedByAvailableWidth: function() {
      if (this.allColumns.length && (this.maxColumnsDisplayed || this.options.maxColumnsDisplayed)) {
        var maxColumnsDisplayed = this.maxColumnsDisplayed || this.options.maxColumnsDisplayed;
        this.displayedColumns = [];
        this.wrappedColumns = [];
        var colCount = 0;
        _.each(this.allColumns, function(colDef) {
          if (colDef.attributes && colDef.attributes.permanentColumn === true) {
            colDef.columnWrapped = false;
            colCount++;
          }
        }, this);
        if (accessibleTable) {
          this.displayedColumns = _.clone(this.allColumns);
          this.wrappedColumns = [];
        } else {
          _.each(this.allColumns, function(colDef) {
            if (!colDef.attributes || colDef.attributes.permanentColumn !== true) {
              colCount++;
              if (maxColumnsDisplayed) {
                colDef.columnWrapped = colCount > maxColumnsDisplayed;
              } else {
                colDef.columnWrapped = false;
              }
            }
          }, this);
          this.displayedColumns = _.where(this.allColumns, {
            columnWrapped: false
          });
          this.wrappedColumns = _.where(this.allColumns, {
            columnWrapped: true
          });
        }
      }
    },
    _calculateActualTableWidth: function() {
      var actualWidth = this.$el.outerWidth();
      if (this._el_tableBody) {
        var h1 = this._el_tableBody.scrollHeight;
        var h2 = $(this._el_tableBody).innerHeight();
        if (h1 > h2) {
          actualWidth -= $.scrollbarWidth();
        }
      }
      return actualWidth;
    },
    _adjustColumnsIfViewResized: function() {
      if (this.isRendered && this.columns && this.columns.length > 0) {
        var actualWidth = this._calculateActualTableWidth();
        if (actualWidth !== this._previousViewWidth) {
          var upperLimit = this._previousViewWidth + 100;
          var lowerLimit = this._previousViewWidth - 100;
          if (actualWidth > upperLimit || actualWidth < lowerLimit) {
            var maxColumns = this._calculateMaxColumnsDisplayed(actualWidth);
            if (maxColumns !== this.maxColumnsDisplayed) {
              log.debug("adjust columns if view resized: maxColumnsDisplayed differ -> render new" + " table") && console.log(log.last);
              this.render();
            } else {
              log.debug("adjust columns if view resized: maxColumnsDisplayed equal -> adjust" + " columns") && console.log(log.last);
              this._adjustColumns();
            }
            this._previousViewWidth = actualWidth;
          } else {
            log.debug("adjust columns if view resized: table width changed minimally -> adjust" + " columns") && console.log(log.last);
            this._adjustColumns();
          }
        } else {
          log.debug("adjust columns if view resized: width not changed -> skip") && console.log(log.last);
        }
      }
    },
    enableEmptyViewText: function() {
      this._showEmptyViewText = true;
    },
    disableEmptyViewText: function() {
      this._showEmptyViewText = false;
    },
    _updateSelectedChildren: function() {
      if (!this.isRendered) {
        return;
      }
      if (this.deletingNodes) {
        return;
      }
      if (!this.table) {
        return;
      }
      var selectedChildren = this.getSelectedChildren();
      this.selectedChildren.reset(selectedChildren);
    },
    _setInlineBarEvents: function() {
      this.listenTo(this, "closeOther", this._inlineBarShouldDestroy);
      if (this.options.inlineBar.options.forceInlineBarOnClick) {
        this.listenTo(this, "row:clicked", function(args) {
          if (this.inlineBarView) {
            var oldModelId = this.inlineBarView.model.get("id");
            var newModelId = args.node.get("id");
            if (oldModelId === newModelId) {
              return;
            }
          }
          if (this.options.inlineBar.viewClass) {
            this._destroyOldAndCreateNewInlineBar(args);
          }
        });
      } else {
        if (this.options.inlineBar.options.showInlineBarOnHover) {
          this.listenTo(this, "enterTableRow", this._destroyOldAndCreateNewInlineBar);
          this.listenTo(this, "leaveTableRow", this._inlineBarShouldDestroy);
        }
      }
      this.listenTo(this.collection, "reset", this._destroyInlineBar);
      if (this.collection.node) {
        this.listenTo(this.collection.node, "change:id", this._destroyInlineBar);
      }
    },
    _showInlineBar: function(args) {
      var showInlineActionBar = this._allSelectedNodes.length === 0 && this.getSelectedChildren().length === 0;
      if (!showInlineActionBar) {
        return;
      }
      if (this.inlineBarView) {
        this._savedHoverEnterArgs = args;
      } else {
        this._savedHoverEnterArgs = null;
        if (!this.tableColumnsWrappingOn && headerRowOverlap.call(this, args.target)) {
          return;
        }
        this.inlineBarView = new this.options.inlineBar.viewClass(_.extend({
          context: this.options.context,
          originatingView: this.options.originatingView,
          commands: this.defaultActionController.commands,
          model: args.node
        }, this.options.inlineBar.options));
        this.listenToOnce(this.inlineBarView, "destroy", function() {
          if (this.inlineBarView) {
            this.stopListening(this.inlineBarView);
          }
          if (this._savedHoverEnterArgs) {
            this._destroyOldAndCreateNewInlineBar(this._savedHoverEnterArgs);
          }
        }, this);
        var nameCell = this.getNameCell(args.target);
        if (nameCell && nameCell.length === 1) {
          var inlineBarDiv = nameCell.find(".csui-table-cell-name-appendix");
          var inlineBarRegion = new Marionette.Region({
            el: inlineBarDiv
          });
          inlineBarRegion.show(this.inlineBarView);
          if (this.inlineBarView.$el.parent().length > 0) {
            nameCell.addClass("csui-table-actionbar-shown");
          }
        }
      }
    },
    _inlineBarShouldDestroy: function() {
      this._destroyInlineBar();
    },
    _destroyOldAndCreateNewInlineBar: function(args) {
      this._inlineBarShouldDestroy();
      if (!this.lockedForOtherContols) {
        this._showInlineBar.call(this, args);
      }
    },
    _destroyInlineBar: function() {
      if (this.inlineBarView) {
        var inlineBarEl = this.inlineBarView.$el.parent();
        inlineBarEl.closest(".csui-table-actionbar-shown").removeClass("csui-table-actionbar-shown");
        this.inlineBarView.destroy();
        this.inlineBarView = null;
      }
    },
    _clearExpandedRows: function() {
      if (!this.isRendered) {
        return;
      }
      this.expandedDetailRows = {};
    },
    onKeyInView: function(event) {
      if (event.keyCode === 9) {
        if (this.activeInlineForm) {
          event.preventDefault();
          event.stopPropagation();
          if ($(document.activeElement).parents(".csui-inline-editform").length === 0) {
            var inlineInput = this.$el.find(".csui-inline-editform input")[0];
            inlineInput && inlineInput.focus();
          }
          return;
        }
      }
    },
    currentlyFocusedElement: function() {
      if (_.isFunction(this.activeInlineForm?.currentlyFocusedElement)) {
        return this.activeInlineForm.currentlyFocusedElement();
      }
      if (this.accFocusedState.focusView === "tableHeader") {
        if (this.tableCaptionView) {
          return this.tableCaptionView.currentlyFocusedElement();
        }
      } else {
        if (this.tableBodyView) {
          return this.tableBodyView.currentlyFocusedElement();
        }
      }
      return $();
    },
    setFocusToFirstRow: function() {
      if (!this.isRendered) {
        return;
      }
      this.accFocusedState.body.row = 0;
      this.accFocusedState.body.column = TableBodyView.getNameColumnIndex(this.displayedColumns) || 0;
    },
    renderError: function() {
      if (!this.table) {
        cleanPlaceholder.call(this);
        $("<div></div>", {
          id: "message"
        }).html(base.MessageHelper.toHtml()).appendTo(this.$el);
      }
    },
    _plugHeaderBodyViews: function() {
      const isHeaderActive = this.tableCaptionView?.tabableRegionBehavior.isActive();
      this._destroyTableHeaderAndBodyViews();
      var self = this;
      this.tableCaptionView = new TableHeaderView({
        el: this.$("thead"),
        displayedColumns: this.displayedColumns,
        searchBoxes: this.searchBoxes,
        _getActiveInlineForm: _.bind(function() {
          return this.activeInlineForm;
        }, this),
        accFocusedColumn: this.accFocusedState.headerColumn,
        accSearchFocused: this.accFocusedState.accSearchFocused,
        accMenuFocused: this.accFocusedState.accMenuFocused,
        tableView: this
      });
      this.propagateEventsToViews(this.tableCaptionView);
      this.tableCaptionView.listenTo(this.tableCaptionView, "closeOtherControls", function() {
        self.trigger("closeOther");
      });
      this.tableCaptionView.listenTo(this.tableCaptionView, "sorting:toggle", function(columnIndex) {
        if (self.displayedColumns[columnIndex].orderable) {
          var direction = getSortingFromTable(self.table, columnIndex).direction === "asc" ? "desc" : "asc";
          self.table.order([ columnIndex, direction ]).draw();
        }
      });
      this.tableCaptionView.$el.off("focusin." + self.cid).on("focusin." + self.cid, function() {
        self.accFocusedState.focusView = "tableHeader";
      });
      this.tableCaptionView.render();
      Marionette.triggerMethodOn(this.tableCaptionView, "before:show");
      Marionette.triggerMethodOn(this.tableCaptionView, "show");
      if (isHeaderActive) {
        $(this.tableCaptionView.currentlyFocusedElement()).trigger("focus");
      }
      this.tableBodyView = new TableBodyView({
        el: $(this._el_tableBody),
        collection: this.collection,
        displayedColumns: this.displayedColumns,
        _getActiveInlineForm: _.bind(function() {
          return this.activeInlineForm;
        }, this),
        startInlineFormForEdit: _.bind(this.startInlineFormForEdit, this),
        accFocusedCell: this.accFocusedState.body,
        tableView: this
      });
      this.propagateEventsToViews(this.tableBodyView);
      this.tableBodyView.listenTo(this.tableBodyView, "closeOtherControls", function() {
        self.trigger("closeOther");
      });
      this.tableBodyView.$el.off("focusin." + self.cid).on("focusin." + self.cid, function() {
        self.accFocusedState.focusView = "tableBody";
      });
      this.tableBodyView.render();
      Marionette.triggerMethodOn(this.tableBodyView, "before:show");
      this.tableBodyView.triggerMethod("show");
    },
    _destroyTableHeaderAndBodyViews: function() {
      if (this.tableCaptionView) {
        this.accFocusedState.headerColumn = this.tableCaptionView.accFocusedColumn;
        this.accFocusedState.accSearchFocused = this.tableCaptionView.accSearchFocused;
        this.accFocusedState.accMenuFocused = this.tableCaptionView.accMenuFocused;
        this.tableCaptionView.destroy();
        this.tableCaptionView = null;
      }
      if (this.tableBodyView) {
        this.tableBodyView.destroy();
        this.tableBodyView = null;
      }
    },
    setDeletingNodesState: function(state) {
      this.deletingNodes = state;
    },
    _handleContextRequest: function() {
      if (!this._fetchingContext) {
        this._fetchingContext = true;
        this._columnsReset = false;
        this._collectionReset = false;
        if (this.context.perspective && !this._fetchingPerspectiveContext) {
          this._columnsReset = this.columns.length > 0;
        }
      }
    },
    _handlePerspectiveContextRequest: function() {
      this._fetchingPerspectiveContext = true;
    },
    _handleContextSync: function() {
      if (!this._fetchingContext) {
        return;
      }
      this._fetchingContext = false;
      if (this._columnsReset) {
        log.debug("_handleContextSync: columns reset -> full render") && console.log(log.last);
        this.render();
      } else if (this._collectionReset && this.isRendered) {
        log.debug("_handleContextSync: collection reset -> draw") && console.log(log.last);
        this._drawTable();
      }
    },
    _handleContextFinish: function() {
      this._fetchingContext = false;
      this._fetchingPerspectiveContext = false;
      this.unblockActions();
    },
    _handleTableColumnsReset: function() {
      this._tableColumnsResetTime = new Date().getTime();
      if (this._fetchingContext) {
        this._columnsReset = true;
        log.debug("_handleTableColumnsReset: fetching -> skip") && console.log(log.last);
      } else {
        log.debug("_handleTableColumnsReset -> full render") && console.log(log.last);
        this.render();
      }
    },
    _handleColumnsReset: function() {
      this._columnsResetTime = new Date().getTime();
      if (this._fetchingContext) {
        this._columnsReset = true;
        if (this._collectionReset) {
          log.debug("_handleColumnsReset: fetching -> collection was reset -> handleContextSync") && console.log(log.last);
          this._handleContextSync();
        } else {
          log.debug("_handleColumnsReset: fetching -> skip") && console.log(log.last);
        }
      } else {
        log.debug("_handleColumnsReset -> full render") && console.log(log.last);
        this.render();
      }
    },
    _dataTablesOrderNeutral: function() {
      var orderBy = this.collection && this.collection.orderBy;
      if (this.table && orderBy && orderBy.length > 0) {
        orderBy = orderBy.split(" ");
        var columnName = orderBy[0], columnIndex = this._getColumnIndexFromColumnName(columnName);
        if (columnIndex === -1) {
          columnIndex = this._getColumnIndexFromSortKey(columnName);
        }
        if (columnIndex === -1) {
          this.table.orderNeutral();
        }
      }
    },
    _handleModelsReset: function() {
      this._dataTablesOrderNeutral();
      this.enableEmptyViewText();
      if (this._fetchingContext) {
        this._collectionReset = true;
        if (this._columnsReset) {
          log.debug("ModelsReset: fetching and columns reset -> handleContextSync") && console.log(log.last);
          this._handleContextSync();
        } else {
          log.debug("ModelsReset: fetching -> skip") && console.log(log.last);
        }
      } else {
        if (this.isRendered) {
          log.debug("ModelsReset: -> draw") && console.log(log.last);
          this._drawTable();
        } else {
          log.debug("ModelsReset: table not rendered -> full render") && console.log(log.last);
          this.render();
        }
      }
    },
    _handleModelsUpdate: function(collection, options) {
      if (!this.isRendered) {
        return;
      }
      var models = options.changes.added;
      if (models.length > 0 && this.table) {
        _.each(models, function(model) {
          model.unset(SelectCellView.isSelectedModelAttributeName);
        });
        log.debug("_handleModelsUpdate: -> draw") && console.log(log.last);
        this._drawTable();
        if (this.tableColumnsWrappingOn) {
          var descriptionAvailable = _.find(models, function(model) {
            if (model.get("description") && model.get("description").length > 0) {
              return true;
            }
          });
          if (descriptionAvailable) {
            this.trigger("refresh:rightTableToolbar");
          }
        }
      }
    },
    _handleModelRemove: function(model, collection, options) {
      if (!this.isRendered) {
        return;
      }
      if (collection.node && (collection.node.get("versionable") || collection.node.get("versionable") === null)) {
        collection.node.fetch({
          refreshCache: true
        });
      }
      if (this.deletingNodes === true) {
        if (model) {
          var targetIdx;
          this.table.rows(function(idx, data, node) {
            if (data.get("id") === model.get("id")) {
              targetIdx = idx;
              return true;
            } else {
              return false;
            }
          }).data();
          if (targetIdx !== undefined) {
            $(this.$el.find(this.table.row(targetIdx).node())).hide();
          }
        }
      } else {
        log.debug("_handleModelRemove: -> draw") && console.log(log.last);
        this._drawTable();
      }
    },
    updateRow: function(model) {
      if (!(this.isRendered && this.table)) {
        return;
      }
      var changedKeys = _.keys(model.changedAttributes());
      if (changedKeys.length === 1 && changedKeys[0] === "favorite") {
        return;
      }
      var idx = this.collection.indexOf(model);
      if (idx === undefined) {
        return;
      }
      if (this.table) {
        var $row = $(this.table.row(idx).node());
        var detailRows = this.table.row(idx).child();
        if (_.keys(model.changed).length === 1) {
          if (model.changed[SelectCellView.isSelectedModelAttributeName] != null) {
            var isSelected = model.get(SelectCellView.isSelectedModelAttributeName);
            if (isSelected) {
              $row.addClass("binf-active");
              _.each(detailRows, function(detailRow) {
                $(detailRow).addClass("binf-active");
              });
            } else {
              $row.removeClass("binf-active");
              _.each(detailRows, function(detailRow) {
                $(detailRow).removeClass("binf-active");
              });
            }
            updateSelectAllCheckbox.call(this);
            return;
          }
          if (model.changed.csuiDelayedActionsRetrieved != null) {
            return;
          }
        }
        if (model.get("isCut") === true) {
          $row && $row.addClass("csui-cut-row");
          detailRows && detailRows.addClass("csui-cut-row");
        } else {
          $row && $row.removeClass("csui-cut-row");
          detailRows && detailRows.removeClass("csui-cut-row");
        }
      }
      if (this.activeInlineForm && this.activeInlineForm.model !== model) {
        this.cancelAnyExistingInlineForm({
          silent: true
        });
      }
      var currentScrollPosition = this._getScrollContainer().scrollTop();
      log.debug("updateRow: -> draw") && console.log(log.last);
      this.triggerMethod("before:render");
      this.table.row(idx).invalidate();
      this.table.draw();
      this._getScrollContainer().scrollTop(currentScrollPosition);
      this.triggerMethod("render");
      if (!this.table) {
        return;
      }
      if (this.activeInlineForm) {
        this.activeInlineForm.triggerMethod("dom:refresh", this.activeInlineForm);
      }
      this._adjustColumns();
    },
    onAfterShow: function() {
      this._adjustColumns();
    },
    getNameCell: function(nRow) {
      var nameColumnIdx = TableBodyView.getNameColumnIndex(this.displayedColumns);
      if (nameColumnIdx === undefined) {
        return undefined;
      }
      var nameCell = $(nRow).children()[nameColumnIdx];
      return $(nameCell);
    },
    updateCollectionParameters: function() {
      var collection = this.collection, context = this.context, supportsFields = collection.makeFieldsV2, supportsExpand = collection.makeExpandableV2, fields = {}, expands = {};
      if (!this.collection.setFields) {
        return;
      }
      this._ensureFreshColumns();
      if ((supportsFields || supportsExpand) && collection.getResourceScope && collection.setResourceScope) {
        if (this._originalCollectionScope) {
          collection.setResourceScope(this._originalCollectionScope);
        } else {
          this._originalCollectionScope = collection.getResourceScope();
        }
      }
      _.each(this.allColumns, function(column) {
        var CellView = column.CellView;
        if (CellView) {
          if (supportsFields && CellView.getModelFields) {
            var field = CellView.getModelFields({
              collection: collection,
              context: context,
              column: column
            });
            if (field) {
              FieldsV2Mixin.mergePropertyParameters(fields, field);
            }
          }
          if (supportsExpand && CellView.getModelExpand) {
            var expand = CellView.getModelExpand({
              collection: collection,
              context: context,
              column: column
            });
            if (expand) {
              FieldsV2Mixin.mergePropertyParameters(expands, expand);
            }
          }
          if (CellView.updateCollectionParameters) {
            CellView.updateCollectionParameters({
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
    clearFilter: function(refresh, filter) {
      if (this.table) {
        if (filter && !$.isEmptyObject(this.options.filter)) {
          this.options.filter = _.omit(this.options.filter, filter.split(","));
        }
        if (this.options.filter) {
          delete this.options.filter.name;
        }
        this.table.search("").columns().search("").draw();
      }
      return this;
    },
    setFilter: function(filter) {
      if (this.table) {
        if ($.isEmptyObject(this.options.filter)) {
          this.options.filter = filter;
        } else {
          this.options.filter = _.extend(this.options.filter, filter);
        }
        this._drawTable();
      }
    },
    resetOrder: function(refresh) {
      this.collection.resetOrder();
      return this;
    },
    getScreenRowCount: function(filter) {
      var tableTools = this.table && getTableTools.call(this);
      if (tableTools) {
        var jqTable = $("#" + tableTools.dom.table.id);
        var tbodyH = jqTable && jqTable[0].childNodes[1] && jqTable[0].childNodes[1].clientHeight || 0;
        var rows = jqTable && jqTable.dataTable().$("tbody tr");
        var rowH = rows[0] && rows[0].clientHeight || 0;
        return rowH > 0 ? Math.floor(tbodyH / rowH) : 0;
      }
      return 0;
    },
    getSelectedChildren: function() {
      var crit = {};
      crit[SelectCellView.isSelectedModelAttributeName] = true;
      return this.collection.where(crit);
    },
    clearChildrenSelection: function() {
      var tableTools = this.table && getTableTools.call(this);
      tableTools && tableTools.fnSelectNone();
    },
    getFocusedChild: function() {
      if (this.accFocusedState.body.row) {
        return this.collection.at(this.accFocusedState.body.row);
      } else {
        return undefined;
      }
    },
    cancelFetch: function() {
      if (this.table) {
        this.table.clear();
      }
    },
    showDetailRowDescriptions: function(show) {
      if (this.tableColumnsWrappingOn && this.options.descriptionRowView) {
        this.options.descriptionRowViewOptions.showDescriptions = show;
        _.each(this._detailRowsDescriptionTRs, function(description) {
          if (show) {
            description.rowEl.removeClass("binf-hidden");
          } else {
            description.rowEl.addClass("binf-hidden");
          }
          description.view.trigger("dom:refresh");
        });
        this.trigger("dom:refresh");
      }
    },
    enableLocationColumn: function(enable) {
      if (this.options.locationColumn !== enable) {
        this.options.locationColumn = enable;
      }
    },
    enableRefresh: function(enabled) {
      this.refreshEnabled = enabled;
    },
    applyFilter: function(data) {
      if (this.options.clientSideDataOperation) {
        this.clientSideSearch(data.column);
      } else {
        var filterObj = {};
        if (_.keys(data).indexOf("column") === -1) {
          filterObj = data;
        } else {
          filterObj[data.column] = data.keywords;
        }
        if (this.collection.fetching) {
          this.filterValuePending = filterObj;
        } else {
          if (this.collection.setFilter(filterObj, false)) {
            this.collection.resetLimit(false);
            this.fetchCollection({
              reset: true
            });
          }
        }
      }
    },
    cancelAnyExistingInlineForm: function(options) {
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
      }
    },
    startInlineFormForEdit: function(model) {
      if (this.collection.contains(model)) {
        this.cancelAnyExistingInlineForm();
        var inlineFormView = inlineFormViewFactory.getInlineFormView(model.get("type"));
        if (!inlineFormView) {
          inlineFormView = inlineFormViewFactory.getInlineFormView(-1);
        }
        if (inlineFormView) {
          model.inlineFormView = inlineFormView;
          model.set("csuiInlineFormErrorMessage", "dummy", {
            silent: true
          });
          model.unset("csuiInlineFormErrorMessage");
        }
      }
    },
    showOrHideZeroRecordsMessage: function() {
      this.$el.find("div.csui-table-empty").remove();
      if (this.collection.length === 0) {
        $(this._el_tableBody).empty();
        this.$el.addClass("csui-table-empty");
        this._setEmptyViewText();
        var classNameToBeAdd = "csui-table-empty csui-table-empty-default" + (!!this.canAddItemsToContainer && !!this.addItemsPermissions ? " csui-can-add-items" : ""), emptyEl = $("<div class='" + classNameToBeAdd + "'><p class='csui-no-result-message' role='status'>" + this.emptyTableText + "</p></div>");
        emptyEl.attr("title", this.emptyTableText);
        if (!this._showEmptyViewText) {
          emptyEl.addClass("csui-state-loading");
        }
        this.$el.append(emptyEl);
        this.trigger("refresh:rightTableToolbar");
      } else {
        this.$el.removeClass("csui-table-empty");
        if (this._renderedEmptyTable) {
          this._previousViewWidth = 0;
        }
      }
      this._renderedEmptyTable = this.collection.length === 0;
    },
    _setEmptyViewText: function() {
      this.emptyTableText = "";
      if (this._showEmptyViewText) {
        var labels = this.options.customLabels ? this.options.customLabels : this.localizableLabels;
        if (this.options.customLabels && labels.emptyTableText) {
          this.emptyTableText = labels.emptyTableText;
        } else {
          this.emptyTableText = !!this.addItemsPermissions ? labels.zeroRecords : lang.emptyListText;
          var filterLength = _.size(this.collection.filters);
          if (filterLength > 1) {
            this.emptyTableText = labels.emptySearchTable;
          } else if (filterLength === 1) {
            if (!!this.collection.filters.name) {
              this.emptyTableText = labels.emptySearchTable;
            }
          }
        }
      }
    },
    setCustomLabels: function(otherLabels) {
      var customLabels = this.getOption("customLabels") || this.getOption("tableTexts") || {};
      if (_.isFunction(customLabels)) {
        customLabels = customLabels.call(this);
      }
      this.options.customLabels = this._fillDefaultLocalizableLabels(otherLabels, customLabels);
      function mergeCustomLabels(customLabels, oLanguage) {
        return _.reduce(_.keys(customLabels), function(result, labelKey) {
          var customLabel = customLabels[labelKey];
          if (_.isObject(customLabel)) {
            var originalLabels = oLanguage[labelKey] || (oLanguage[labelKey] = {});
            return result || mergeCustomLabels(customLabel, originalLabels);
          }
          var differs = oLanguage[labelKey] != customLabel;
          oLanguage[labelKey] = customLabel;
          return result || differs;
        }, false);
      }
      if (this.table) {
        var hungarianLabels = _.deepClone(this.options.customLabels);
        DataTables.camelToHungarian(DataTables.defaults.oLanguage, hungarianLabels);
        var differs = mergeCustomLabels(hungarianLabels, this.table.settings()[0].oLanguage);
        if (differs && this.collection.length === 0) {
          this._drawTable();
        }
      }
    },
    _fillDefaultLocalizableLabels: function() {
      var customLabels = Array.prototype.slice.call(arguments), completeLabels = {
        paginate: {},
        aria: {},
        tooltip: {}
      };
      _.each(customLabels, function(customLabels) {
        if (customLabels.zeroRecordsMsg != null && customLabels.zeroRecords == null) {
          customLabels.zeroRecords = customLabels.zeroRecordsMsg;
          delete customLabels.zeroRecordsMsg;
        }
        _.defaults(completeLabels, customLabels);
        _.defaults(completeLabels.paginate, customLabels.paginate);
        _.defaults(completeLabels.aria, customLabels.aria);
      });
      function removeDefaultingLabels(completeLabels) {
        _.each(_.keys(completeLabels), function(labelKey) {
          var label = completeLabels[labelKey];
          if (_.isObject(label)) {
            removeDefaultingLabels(label);
          } else {
            if (label === false || label === null) {
              delete completeLabels[labelKey];
            }
          }
        });
      }
      removeDefaultingLabels(completeLabels);
      _.defaults(completeLabels, {
        emptyTable: lang.NodeTableNoItems,
        emptySearchTable: lang.NodeTableNoSearchResult,
        zeroRecords: lang.NodeTableNoItems,
        loadingRecords: lang.NodeTableLoadingItems,
        processing: lang.NodeTableProcessingItems,
        info: lang.NodeTablePageInfo,
        infoEmpty: lang.NodeTableEmptyPageInfo,
        infoFiltered: lang.NodeTableFilteredPageInfo,
        infoThousands: lang.NodeTablePageThousandsSeparator,
        infoPostFix: lang.NodeTablePageInfoSuffix,
        lengthMenu: lang.NodeTablePageSizeSelector,
        search: lang.NodeTablePageFilterLabel
      });
      _.defaults(completeLabels.paginate, {
        first: lang.NodeTablePagingFirst,
        last: lang.NodeTablePagingLast,
        previous: lang.NodeTablePagingPrevious,
        next: lang.NodeTablePagingNext
      });
      _.defaults(completeLabels.aria, {
        sortedDescending: lang.NodeTableSortedDescendingColumnAria,
        sortedAscending: lang.NodeTableSortedAscendingColumnAria
      });
      _.defaults(completeLabels.tooltip, {
        sortAscending: lang.NodeTableSortAscendingTooltip,
        sortDescending: lang.NodeTableSortDescendingTooltip,
        isUnsorted: lang.NodeTableIsUnsortedTooltip
      });
      return completeLabels;
    },
    _initializeLocalizableLabels: function() {
      var customLabels = this.getOption("customLabels") || this.getOption("tableTexts") || {};
      if (_.isFunction(customLabels)) {
        customLabels = customLabels.call(this);
      }
      this.localizableLabels = this._fillDefaultLocalizableLabels(customLabels);
    },
    _handlePendingFilter: function() {
      if (!this.isRendered) {
        return;
      }
      if (!_.isEmpty(this.filterValuePending)) {
        this.collection.resetLimit(false);
        this.collection.setFilter(this.filterValuePending);
        this.filterValuePending = {};
      }
    },
    _handleResponseSortBy: function() {
      var sorting = this.collection.sorting;
      if (sorting && sorting.sort && sorting.sort.length > 0 && sorting.sort[0].value) {
        var sortValue = sorting.sort[0].value, markerIndex = sortValue.indexOf("_"), sortKey = sortValue.substring(markerIndex + 1), sortDirection = sortValue.substring(0, markerIndex), columnIndex;
        var sortingColumnKey = this.collection.sortingColumnKey;
        var sortBy = !!sortingColumnKey && sortingColumnKey.lastIndexOf("_formatted") === -1 ? sortingColumnKey : this._getSortableColumnKey(sortKey);
        columnIndex = this._getColumnIndexFromColumnName(sortBy);
        if (columnIndex === -1) {
          columnIndex = this._getColumnIndexFromSortKey(sortBy);
        }
        if (this.table && columnIndex !== -1) {
          this.table.order([ parseInt(columnIndex), sortDirection ]);
        }
        var orderBy = sortBy + " " + sortDirection;
        if (!this.orderByFromServer) {
          this.orderByFromServer = orderBy;
        }
        var orderDiff = this.collection.setOrder(orderBy, false);
        this.table && ensureTableHeaderSortArrow.call(this, this.table, sortBy);
        if (sortingColumnKey && this.enableViewState && orderDiff) {
          var viewStateOrderBy = sortBy + " " + sortDirection;
          if (this.getViewStateOrderBy() !== viewStateOrderBy) {
            this.setViewStateOrderBy([ viewStateOrderBy ], {
              default: true
            });
          }
        }
      }
    },
    clientSideSearch: function(column) {
      var filterObj = {};
      _.each(this.searchBoxes, function(sb) {
        var col = sb.getColumn();
        var keywords = sb.getValue();
        if (keywords.length) {
          filterObj[col] = keywords;
        }
      });
      this.collection.resetLimit(false);
      this.collection.setFilter(filterObj);
    },
    resetScrollToTop: function() {
      if (!this.isRendered) {
        return;
      }
      this._getScrollContainer().scrollTop(0);
    },
    _getScrollContainer: function() {
      if (this.tableColumnsWrappingOn) {
        return $(this._el_tableBody);
      } else {
        return $(this._el_wrapper);
      }
    },
    _clearSearchBoxes: function() {
      if (!this.isRendered || this.collection.filters?.name) {
        return;
      }
      _.each(this.searchBoxes, function(sb) {
        sb.hideAndClear();
      });
    },
    _adjustColumns: function() {
      if (!this.tableColumnsWrappingOn || accessibleTable) {
        return;
      }
      if (!this.displayedColumns || !this.$el.is(":visible")) {
        return;
      }
      removeStyles("adjusted_colstyles_js_" + this.cid);
      var tableWidth = this.$el.width();
      if (this.$el.find(".csui-normal-scrolling").hasScroll()) {
        tableWidth -= $.scrollbarWidth();
      }
      var numberColumnsWithFixedWidth = 0;
      var sumFixedWidth = 0;
      var columnCells;
      var headerCells = $(this._el_headerCells);
      if (this.collection.length > 0) {
        if (this.activeInlineForm) {
          var firstRowModelId = this.collection.at(0).get("id");
          var inlineFormModelId = this.activeInlineForm.model.get("id");
          if (firstRowModelId === inlineFormModelId) {
            if (this.collection.length > 1) {
              var lastEle = $(this.$el.find("table>tbody>tr:not(.csui-table-row-shows-inlineform) .csui-table-cell-_select")[0]).closest("tr");
              columnCells = lastEle.children();
            } else {
              columnCells = headerCells;
              this.$el.find(".csui-inlineform-parent").addClass("csui-inline-form-full-width");
            }
          } else {
            columnCells = this.$el.find("table>tbody>tr:first-child").children();
          }
        } else {
          columnCells = this.$el.find("table>tbody>tr:first-child").children();
        }
      } else {
        columnCells = headerCells;
      }
      var widerCellIndexes = {};
      var normalCellIndexes = [];
      var displayedColumns = this.displayedColumns;
      var widthFactorSum = 0, widestColumnIndex, largestWidthFactor = 0, flexibleColumnWidth = 0, numberColumnsWithFlexibleWidth = 0;
      var extraWidthForToolbarItems = this._extraWidthForToolbarItems;
      var nameColumn = _.findWhere(displayedColumns, {
        isNaming: true
      });
      if (!nameColumn) {
        extraWidthForToolbarItems = 0;
      }
      columnCells.each(function(index) {
        if (index < displayedColumns.length) {
          var el = $(this), columnWidth = Math.max(el.outerWidth(), $(headerCells[index]).outerWidth());
          var column = displayedColumns[index];
          if (column.CellView.hasFixedWidth) {
            sumFixedWidth += columnWidth;
            numberColumnsWithFixedWidth++;
          } else {
            var widthFactor = column.attributes && column.attributes.widthFactor || 1;
            if (widthFactor && widthFactor !== 1) {
              widerCellIndexes[index] = widthFactor;
              widthFactorSum += widthFactor;
            } else {
              if (column.CellView && column.CellView.flexibleWidth) {
                flexibleColumnWidth += columnWidth;
                numberColumnsWithFlexibleWidth++;
              } else {
                normalCellIndexes.push(index);
                widthFactorSum += 1;
              }
            }
            if (widthFactor > largestWidthFactor) {
              largestWidthFactor = widthFactor;
              widestColumnIndex = index;
            }
          }
        }
      });
      var remainingWidth = tableWidth - sumFixedWidth - flexibleColumnWidth - extraWidthForToolbarItems, numberColumnsNonFixedWidth = displayedColumns.length - numberColumnsWithFixedWidth - numberColumnsWithFlexibleWidth, remainingWidthPerCell = numberColumnsNonFixedWidth > 0 ? remainingWidth / numberColumnsNonFixedWidth : 0, sumWidthOfWideCells = 0, averageWidthFactor = widthFactorSum / numberColumnsNonFixedWidth;
      _.each(widerCellIndexes, function(widthFactor, columnIndex) {
        var wf = widthFactor / averageWidthFactor, w = remainingWidthPerCell * wf;
        if (sumWidthOfWideCells + w > remainingWidth) {
          w = remainingWidth - sumWidthOfWideCells;
          if (w < 0) {
            w = 0;
          }
        }
        w = Math.floor(w);
        widerCellIndexes[columnIndex] = w;
        sumWidthOfWideCells += w;
      });
      var correctionWidth;
      if (normalCellIndexes.length > 0) {
        remainingWidthPerCell = (remainingWidth - sumWidthOfWideCells) / normalCellIndexes.length / averageWidthFactor;
        remainingWidthPerCell = Math.floor(remainingWidthPerCell);
        correctionWidth = remainingWidth - sumWidthOfWideCells - remainingWidthPerCell * normalCellIndexes.length;
      } else {
        remainingWidthPerCell = 0;
        correctionWidth = remainingWidth - sumWidthOfWideCells;
      }
      correctionWidth = Math.floor(correctionWidth);
      var cachedColumnWidths = {};
      var cssTextPattern = '#{0} [data-csui-attribute="{1}"] {2} \n';
      var cssTextAcc = "";
      var self = this;
      columnCells.each(function(index) {
        if (index >= displayedColumns.length) {
          return;
        }
        var el = $(this);
        var extraWidth = 0;
        var column = displayedColumns[index];
        if (column.isNaming) {
          extraWidth = extraWidthForToolbarItems;
        }
        var widthStyle;
        if (column.CellView.hasFixedWidth || column.CellView.flexibleWidth) {
          var colContentWidth = Math.max(el.outerWidth(), $(headerCells[index]).outerWidth()) + extraWidth;
          widthStyle = _.str.sformat("{width: {0}px; min-width: {0}px; max-width: {0}px}", colContentWidth);
        } else {
          var columnWidth;
          if (widerCellIndexes[index] && widerCellIndexes[index] > 0) {
            columnWidth = widerCellIndexes[index];
          } else {
            columnWidth = remainingWidthPerCell;
          }
          if (index === widestColumnIndex && correctionWidth) {
            columnWidth += correctionWidth;
          }
          columnWidth += extraWidth;
          widthStyle = _.str.sformat("{min-width: {0}px; max-width: {1}px}", columnWidth, columnWidth);
        }
        cssTextAcc += _.str.sformat(cssTextPattern, self.cid, column.attributes["column_key"], widthStyle);
        cachedColumnWidths[column.className] = widthStyle;
      });
      cssTextAcc += `#${self.cid} td.csui-details-row:only-child[colspan="${columnCells.length}"] > :only-child {width: ${tableWidth}px;}`;
      writeStyles("adjusted_colstyles_js_" + self.cid, cssTextAcc);
      this.cachedColumnWidths = cachedColumnWidths;
      if (this.accFocusedState.body.column > displayedColumns.length - 1) {
        this.accFocusedState.body.column = displayedColumns.length - 1;
      }
      function removeStyles(styleName) {
        var styleElement = document.getElementById(styleName);
        if (styleElement) {
          document.getElementsByTagName("head")[0].removeChild(styleElement);
        }
      }
      function writeStyles(styleName, cssText) {
        var styleElement = document.createElement("style");
        styleElement.type = "text/css";
        styleElement.id = styleName;
        styleElement.innerHTML = cssText;
        document.getElementsByTagName("head")[0].appendChild(styleElement);
      }
      this._showOrHideAlternativeHeaderView();
    },
    _showOrHideAlternativeHeaderView: function() {
      if (this._alternativeHeaderRegion) {
        if (this.selectedChildren.length > 0) {
          this._alternativeHeaderRegion.$el.addClass("csui-table-alternative-header-visible");
        } else {
          this._alternativeHeaderRegion.$el.removeClass("csui-table-alternative-header-visible");
        }
      }
    },
    _createAlternativeHeaderView: function() {
      var alternativeHeaderOptions = this.options.alternativeHeader.options;
      var toolItemFactoryOptions;
      var filteredCollection;
      if (alternativeHeaderOptions && alternativeHeaderOptions.toolbarItems && alternativeHeaderOptions.toolbarItems.tableHeaderToolbar) {
        var toolItemFactory = alternativeHeaderOptions.toolbarItems.tableHeaderToolbar;
        toolItemFactoryOptions = toolItemFactory ? toolItemFactory.options : undefined;
        var status = {
          nodes: this.selectedChildren,
          container: this.collection.node,
          context: this.context,
          collection: this.collection
        };
        this._alternativeHeaderCommandController = alternativeHeaderOptions.toolbarCommandController || new ToolbarCommandController({
          commands: alternativeHeaderOptions.commands
        });
        filteredCollection = new FilteredToolItemsCollection(toolItemFactory, {
          status: status,
          commands: this._alternativeHeaderCommandController.commands,
          delayedActions: this.collection.delayedActions,
          mask: alternativeHeaderOptions.toolbarItemsMask
        });
      }
      var alternativeHeaderView = new this.options.alternativeHeader.viewClass(_.extend({
        collection: filteredCollection,
        toolbarName: "tableHeader",
        originatingView: this.options.parentView,
        keyboardNavigationEnabled: true,
        selectedNodes: this.selectedChildren
      }, toolItemFactoryOptions));
      if (this._alternativeHeaderCommandController) {
        this.listenTo(this._alternativeHeaderCommandController, "before:execute:command", function(eventArgs) {
          log.debug("command " + eventArgs.commandSignature + " is starting") && console.log(log.last);
          this.lockedForOtherContols = true;
          this._destroyInlineBar();
          alternativeHeaderView.trigger("before:execute:command", eventArgs);
        });
        this.listenTo(this._alternativeHeaderCommandController, "after:execute:command", function(eventArgs) {
          log.debug("command is finished") && console.log(log.last);
          this.lockedForOtherContols = false;
          alternativeHeaderView.trigger("after:execute:command", eventArgs);
        });
      }
      return alternativeHeaderView;
    },
    _toolbarItemClicked: function(toolItemView, args) {
      var selectedNodes = this.getSelectedChildren();
      var executionContext = {
        context: this.context,
        nodes: new this._ViewCollection(selectedNodes),
        container: this.collection.node,
        collection: this.collection,
        originatingView: this.options.originatingView,
        toolItemView: toolItemView
      };
      this._alternativeHeaderCommandController.toolitemClicked(args.toolItem, executionContext);
    },
    _getSortableColumnKey: function(name) {
      var key = name;
      name = name.toLowerCase();
      _.find(this.displayedColumns, function(column, index) {
        if (column.attributes.sort_key === name || column.name.toLowerCase() === name || column.attributes.column_key === name) {
          key = column.attributes.column_key;
          return true;
        }
      });
      return key;
    },
    _getColumnIndexFromColumnName: function(columnName) {
      var columnIndex = -1;
      this.displayedColumns && this.displayedColumns.some(function(cellValue, index) {
        if (cellValue.name == columnName) {
          columnIndex = index;
          return true;
        }
      }, this);
      return columnIndex;
    },
    _getColumnIndexFromSortKey: function(sortKey) {
      var columnIndex = -1;
      this.displayedColumns && this.displayedColumns.some(function(cellValue, index) {
        if (cellValue.attributes["sort_key"] == sortKey) {
          columnIndex = index;
          return true;
        }
      }, this);
      return columnIndex;
    },
    _collectionOrderByChanged: function() {
      var orderBy = this.collection.orderBy;
      if (orderBy && this.table) {
        orderBy = orderBy.split(" ");
        var columnName = orderBy[0], direction = orderBy[1], columnIndex = this._getColumnIndexFromColumnName(columnName), currentOrder = this.table.order(), currentColumnIndex, currentDirection;
        if (columnIndex === -1) {
          columnIndex = this._getColumnIndexFromSortKey(columnName);
        }
        if (currentOrder && currentOrder.length > 0) {
          currentColumnIndex = currentOrder[0][0];
          currentDirection = currentOrder[0][1];
        }
        if (columnIndex !== -1 && (currentColumnIndex !== columnIndex || currentDirection !== direction)) {
          this.table.order([ parseInt(columnIndex), direction ]);
          this.fetchCollection();
        }
      }
    },
    _collectionFilterChanged: function() {
      if (!this.searchBoxes || this.searchBoxes.length === 0) {
        ensureAllSearchBox.call(this);
      }
      var filters = this.collection.filters;
      _.each(this.searchBoxes, function(searchbox) {
        var columnName = searchbox.getColumn();
        var filterValue = filters[columnName];
        if (filterValue !== undefined && filterValue !== "" || searchbox.showInputField) {
          if (!searchbox.getShown()) {
            searchbox.showSearchInput();
          }
          searchbox.setValue(filterValue);
        } else {
          if (searchbox.getShown()) {
            searchbox.hideAndClear();
          }
        }
      });
      if (this.enableViewState) {
        this.setViewStateFilter(this.collection.filters);
      }
    },
    _collectionFilterCleared: function() {
      _.each(this.searchBoxes, function(searchbox) {
        searchbox.hideAndClear();
      });
      if (this.enableViewState) {
        this.setViewStateFilter({});
      }
    },
    onViewStateChanged: function() {
      var viewStateModel = this.context.viewStateModel, filterAsString = viewStateModel.getViewState("filter", true);
      if (this.enableViewState) {
        if (filterAsString) {
          if (JSON.stringify(this.collection.filters) !== filterAsString) {
            const filterAsObject = JSON.parse(filterAsString);
            this.applyFilter(filterAsObject);
          }
        } else if (this.collection.filters) {
          this.collection.clearFilter();
        }
      }
    },
    _isSingleSelectionEnabled: function() {
      return this.options.selectRows === "single";
    },
    _setColumnToWidth: function(resizeIndex, newWidth) {
      const tableView = this;
      const columnCells = getColumnCells.call(this, tableView._el_table, resizeIndex);
      columnCells.forEach(function(cell) {
        cell.style.width = "unset";
        cell.style.minWidth = "";
        cell.style.maxWidth = "";
      });
      if (this._lastColumnWidths) {
        this._lastColumnWidths[resizeIndex] = newWidth;
      }
      this._saveNewWidthToLocalStorage(resizeIndex, newWidth);
    },
    _fitColumnToContent: function(resizeIndex) {
      const tableView = this;
      const columnCells = getColumnCells.call(this, tableView._el_table, resizeIndex);
      const headerCell = columnCells[0];
      columnCells.forEach(function(cell) {
        cell.style.width = "unset";
        cell.style.minWidth = "";
        cell.style.maxWidth = "";
      });
      tableView._adjustColumnsInNoWrapMode(undefined, resizeIndex);
      const newWidth = Math.ceil(headerCell.getBoundingClientRect().width);
      if (this._lastColumnWidths) {
        this._lastColumnWidths[resizeIndex] = newWidth;
      }
      this._saveNewWidthToLocalStorage(resizeIndex, newWidth);
    },
    _saveNewWidthToLocalStorage: function(resizeIndex, newWidth) {
      const tableView = this;
      const resizeColumn = tableView.displayedColumns[resizeIndex];
      const columnModel = tableView._columnModelsByKey[resizeColumn.name];
      columnModel.set({
        customization_width: newWidth
      });
      resizeColumn.attributes.customization_width = newWidth;
      setColumnsWidthAndOffset.call(tableView, resizeIndex);
      tableView._adjustColumnsInNoWrapMode();
    },
    getDisplayableColumns: function() {
      return getDisplayColumns.call(this, {
        withCustomizations: false
      });
    },
    getDisplayedColumns: function() {
      return getDisplayColumns.call(this, {
        withCustomizations: true
      });
    },
    fetchCollection: function(options) {
      return this.collection.fetch(options);
    }
  }, {
    columnCustomizationKeys: [ "resizeable", "resize_span", "min_width", "width", "pinned", "hidden", "order" ],
    columnCustomizationMinWidth: 137
  });
  TableView.version = "1.0";
  function columnsWereResetSilently() {
    if (this._columnModelsByKey && this.columns) {
      const aColumn = this.columns.at(0);
      if (aColumn && aColumn !== this._columnModelsByKey[aColumn.get("column_key")]) {
        return true;
      }
    }
  }
  function isColumnVisible(attributes) {
    const customization_hidden = attributes.customization_hidden;
    const isColVisible = customization_hidden == null ? attributes.is_default_column !== false : !customization_hidden;
    return isColVisible;
  }
  function getDisplayColumns(options) {
    const tableColumnsByKey = Object.fromEntries(this.options.tableColumns.map(column => [ column.get("key"), column ]));
    const displayColumns = this.columns.filter(column => {
      var display;
      const key = column.get("column_key");
      if (!options.withCustomizations || isColumnVisible(column.attributes)) {
        if (tableColumnsByKey[key] && tableColumnsByKey[key].get("sequence") !== null) {
          display = true;
        } else if (column.get("type") && column.get("definitions_order")) {
          display = !cellViewFactory.hasCellViewByOtherKey(key);
        }
      }
      return display;
    });
    const sortedColumns = _.sortBy(displayColumns, column => {
      return getColumnSequence(tableColumnsByKey[column.get("column_key")], column, options);
    });
    return sortedColumns;
  }
  function getColumnSequence(tableColumn, column, options) {
    let sequence = options.withCustomizations && column ? column.get ? column.get("customization_order") : column["customization_order"] : undefined;
    if (!sequence) {
      sequence = tableColumn ? tableColumn.get ? tableColumn.get("sequence") : tableColumn["sequence"] : undefined;
      if (sequence == null) {
        const order = column ? column.get ? column.get("definitions_order") : column["definitions_order"] : undefined;
        if (order) {
          sequence = order;
        }
      }
    }
    return sequence;
  }
  function _resolveDetailRowColspan(masterRow, detailsRow, options) {
    var colspan = 0;
    var allTh = this.displayedColumns;
    var allThLength = allTh.length;
    if (this.wrappedColumns.length === 0 && allThLength > 0 && allTh[allThLength - 1].name === "_toggledetails") {
      allThLength = allThLength - 1;
    }
    if (options && options.firstColumnIndex >= 0) {
      if (allThLength > 0 && options.firstColumnIndex < allThLength) {
        var detailTableCell = $(detailsRow.children()[0]);
        if (options.lastColumnIndex && options.lastColumnIndex >= options.firstColumnIndex) {
          colspan = options.lastColumnIndex - options.firstColumnIndex + 1;
          if (colspan > 1) {
            detailTableCell.attr("colspan", colspan);
          }
          detailsRow.attr("style", "");
        }
        for (var i = 0; i < options.firstColumnIndex; i++) {
          detailsRow.prepend("<td></td>");
        }
        var remainingTdCount = allThLength - options.firstColumnIndex - colspan;
        if (options.displayInEntireRow) {
          options.descriptionColspan = remainingTdCount + 1;
        } else if (remainingTdCount > 0) {
          for (var j = 0; j < remainingTdCount; j++) {
            detailsRow.append("<td></td>");
          }
        }
      }
    } else {
      var masterRowCells = $(masterRow).children();
      var detailsRowCells = detailsRow.children();
      if (detailsRowCells.length === 1 && masterRowCells.length > 1) {
        colspan = masterRowCells.length;
        if (this.wrappedColumns.length === 0 && colspan > 0) {
          colspan = colspan - 1;
        }
        detailsRowCells.attr("colspan", colspan);
      }
    }
  }
  function _rememberDetailRowViewByModel(model, view) {
    var id = model.id || model.get("id");
    var detailRowViews = this._detailRowViewsByModelId[id];
    if (!detailRowViews) {
      detailRowViews = {
        views: []
      };
      this._detailRowViewsByModelId[id] = detailRowViews;
    }
    detailRowViews.views.push(view);
  }
  function addDetailRow(table, iDataIndex, nRow, aData) {
    var childRows;
    var errorMessage = aData.get("csuiErrorMessage");
    if (errorMessage) {
      var errorRowView = new ErrorRowView({
        errorMessage: errorMessage
      });
      errorRowView.render();
      table.row(iDataIndex).child(errorRowView.el, "csui-details-row").show();
      $(nRow).addClass("csui-has-details-row");
      childRows = table.row(iDataIndex).child();
      if (aData.isLocallyCreated) {
        childRows.addClass("csui-new-item");
      }
      if (aData.get("id") !== undefined) {
        childRows.addClass("csui-saved-item");
      }
    } else {
      var detailRows = [];
      var trEl, tdEl;
      if (!this.tableColumnsWrappingOn || accessibleTable) {
        childRows = $();
      } else {
        if (this.options.descriptionRowView) {
          var descriptionAvailable = aData.get("description") && aData.get("description").length > 0;
          if (!descriptionAvailable && this.options.descriptionRowViewOptions.showSummary || this.options.descriptionRowViewOptions.showSummaryOnly) {
            descriptionAvailable = aData.get("summary") && aData.get("summary").length > 0;
          }
          if (descriptionAvailable) {
            var collapsedHeightIsOneLine = false;
            if (this.options.descriptionRowViewOptions && this.options.descriptionRowViewOptions.collapsedHeightIsOneLine) {
              collapsedHeightIsOneLine = true;
            }
            var descriptionRowView = new this.options.descriptionRowView({
              model: aData,
              collapsedHeightIsOneLine: collapsedHeightIsOneLine,
              tableView: this
            });
            descriptionRowView.render();
            tdEl = $('<td class="csui-details-row"></td>');
            trEl = $('<tr class="csui-details-row csui-details-row-description"></tr>');
            tdEl.appendTo(trEl);
            descriptionRowView.triggerMethod("before:show");
            descriptionRowView.$el.appendTo(tdEl);
            descriptionRowView.triggerMethod("show");
            _resolveDetailRowColspan.call(this, nRow, trEl, this.options.descriptionRowViewOptions);
            if (this.options.descriptionRowViewOptions) {
              if (this.options.descriptionRowViewOptions.displayInEntireRow && this.options.descriptionRowViewOptions.descriptionColspan) {
                tdEl.attr("colspan", this.options.descriptionRowViewOptions.descriptionColspan);
              }
              if (!this.options.descriptionRowViewOptions.showDescriptions) {
                trEl.addClass("binf-hidden");
              }
            }
            this._detailRowsDescriptionTRs.push({
              rowEl: trEl,
              view: descriptionRowView
            });
            _rememberDetailRowViewByModel.call(this, aData, descriptionRowView);
            detailRows.push(trEl[0]);
          }
        }
        if (this.wrappedColumns.length > 0) {
          var metadataRowView = new MetadataRowView({
            context: this.context,
            model: aData,
            columns: this.wrappedColumns
          });
          metadataRowView.render();
          tdEl = $('<td class="csui-details-row"></td>');
          trEl = $('<tr class="csui-details-row csui-details-row-metadata"></tr>');
          tdEl.appendTo(trEl);
          if (this.options.haveDetailsRowExpandCollapseColumn && this.options.haveToggleAllDetailsRows) {
            if (this.detailsRowsAreExpanded || this.expandedDetailRows[aData.id || aData.get("id")]) {
              trEl.addClass("binf-collapse binf-in");
            } else {
              trEl.addClass("binf-collapse");
            }
          } else {
            trEl.addClass("binf-collapse binf-in");
          }
          trEl.attr("id", "csui-details-row-" + aData.cid);
          metadataRowView.triggerMethod("before:show");
          metadataRowView.$el.appendTo(tdEl);
          metadataRowView.triggerMethod("show");
          _resolveDetailRowColspan.call(this, nRow, trEl);
          aData.set("hasMetadataRow", true, {
            silent: true
          });
          _rememberDetailRowViewByModel.call(this, aData, metadataRowView);
          detailRows.push(trEl[0]);
        } else {
          aData.set("hasMetadataRow", false, {
            silent: true
          });
        }
        table.row(iDataIndex).child(detailRows, "csui-details-row").show();
        childRows = table.row(iDataIndex).child();
      }
    }
    if (childRows.length > 0) {
      $(nRow).addClass("csui-has-details-row");
    }
    return childRows;
  }
  function createTable() {
    if (!this.allColumns.length) {
      return;
    }
    this.trigger("creatingTable", {
      sender: this
    });
    var self = this;
    self.hoveredRowDataId = undefined;
    this._detailRowsDescriptionTRs = [];
    this._detailRowViewsByModelId = {};
    var useServerSideProcessing = true;
    cleanPlaceholder.call(this);
    var originUrl = new base.Url(this.connector.connection.url).getOrigin(true);
    var supportUrl = base.Url.combine(originUrl, this.connector.connection.supportPath);
    var additionalCreationOptions = getCreationOptions.call(this);
    this.csuiDestroyRowCallbacks = [];
    var creationOptions = _.extend({
      columns: _.map(this.displayedColumns, function(column) {
        if (column.attributes.initialSortingDescending) {
          column.asSorting = [ "desc", "asc" ];
        }
        return column;
      }),
      jQueryUI: false,
      autoWidth: false,
      deferRender: useServerSideProcessing,
      serverSide: useServerSideProcessing,
      language: self.localizableLabels,
      ajax: function(aoData, fnCallback, oSettings) {
        if (this.refreshEnabled === false) {
          return;
        }
        var api = this.api();
        if (api.context.length > 0) {
          if (self.options.clientSideDataOperation) {
            clientSideUpdateData.call(self, api, aoData, oSettings, fnCallback);
          } else {
            fetchData.call(self, api, aoData, oSettings, fnCallback);
          }
        }
      },
      initComplete: function(oSettings, json) {
        self.trigger("tableFrameRendered", {
          sender: self,
          target: this[0]
        });
      },
      preDrawCallback: function() {
        if (self.activeInlineForm) {
          delete self._inlineFormInfo;
          self.activeInlineForm.destroy();
          delete self.activeInlineForm;
        }
        self._el_wrapper = this[0].parentElement;
        self._el_tableBody = this.find("tbody")[0];
      },
      drawCallback: function() {
        var $table = $(this);
        if (!self.tableColumnsWrappingOn) {
          self._adjustColumnsInNoWrapMode(this);
          self._adjustInlineFormWidthInNoWrapMode(this);
        }
        $table.addClass("csui-table-spacing-medium");
        if (self.collection) {
          if (self.collection.length === 0 || self.collection.length === 1 && self.collection.at(0).inlineFormView) {
            $table.addClass("csui-table-empty");
          } else {
            $table.removeClass("csui-table-empty");
          }
          self.showOrHideZeroRecordsMessage();
        }
        self.hoveredRowDataId = undefined;
        self.hoveredRow = undefined;
        if (self.options.haveDetailsRowExpandCollapseColumn && self.options.haveToggleAllDetailsRows) {
          if (!$table.find("td.csui-table-cell-_toggledetails >" + " .expand-details-row-toggle").length && self.collection.length) {
            self.displayedColumns = _.filter(self.displayedColumns, function(col) {
              return col.sName !== "_toggledetails";
            });
            var toggleDetailEls = $table.find(".csui-table-cell-_toggledetails");
            toggleDetailEls.remove();
          }
        }
        const sorting = getSortingFromTable(this.api());
        self._el_headerCells.each(function(index) {
          if (self.displayedColumns.length > index) {
            var column = self.displayedColumns[index];
            if (column.orderable) {
              const nextSortDir = $(this).attr("data-csui-column-next-sort-dir") || getNextSortingDirection(sorting, index, column);
              setSortingTooltipAndAriaLabel($(this), column, nextSortDir);
            }
          }
          var subElement = $(this).find("div.csui-focusable-table-column-header");
          if (subElement.hasClass("csui-empty")) {
            if (!subElement.hasClass("csui-iconButSorted")) {
              $(this).removeAttr("title");
              subElement.removeAttr("role");
            }
            subElement.removeClass("csui-iconButSorted");
          }
          $(this).removeAttr("data-csui-column-current-sort-dir");
          $(this).removeAttr("data-csui-column-next-sort-dir");
        });
        $table.find("tr:not(.csui-details-row)").each(function() {
          $(this).find("> *").last().addClass("csui-table-cell-last-visible");
        });
        self.trigger("tableBodyRendered", {
          sender: self,
          target: self._el_tableBody
        });
        self._plugHeaderBodyViews();
        if (!self.tableColumnsWrappingOn) {
          self._saveBrowserColumnWidthsInNoWrapMode();
        }
      },
      headerCallback: function(nHead, aData, iStart, iEnd, aiDisplay) {
        var $table = $(this);
        self._el_headerCells = $(">th", nHead);
        const orderIdx = getSortingFromTable(this.api()).index;
        const isJatoTheme = theming.isJATOTheme();
        if (_.find(self.searchBoxes, function(sb) {
          return sb.getShown();
        })) {
          if (self.collection.length && self._selectAllCheckboxRegion && !!self._selectAllCheckboxRegion.currentView.model.get("disabled")) {
            self._selectAllCheckboxRegion.currentView.model.set("disabled", false);
          }
          self._el_headerCells.each(function(index) {
            const thEl = $(this);
            if (orderIdx === index) {
              thEl.find(".csui-focusable-table-column-header .csui-table-header-icon").addClass("binf-hidden");
            } else {
              thEl.find(".csui-focusable-table-column-header .csui-table-header-icon").removeClass("binf-hidden");
            }
          });
          return;
        }
        var excludeTableHeaderCellsWithClass = [ SelectCellView.columnClassName, "csui-table-cell-_toggledetails" ];
        delete self._el_lastPinnedHeader;
        self._nowrapHeaderResizeObserver.disconnect();
        var zIndex = self._el_headerCells.length;
        self._el_headerCells.each(function(index) {
          var thEl = $(this);
          if (thEl.length > 0 && self.displayedColumns.length > index) {
            var column = self.displayedColumns[index];
            thEl.attr("data-csui-attribute", column.name);
            thEl.attr("aria-controls", null);
            thEl.removeClass("csui-column-highlight");
            if (!self.tableColumnsWrappingOn) {
              if (column.attributes.customization_pinned) {
                thEl.addClass("csui-nowrap-table__column_sticky");
              }
              if (column.lastPinned) {
                self._el_lastPinnedHeader = thEl[0];
                thEl.addClass("csui-nowrap-table__column_last-sticky");
              }
              if (!column.resizeSpan || column.resizeStart) {
                zIndex = self._el_headerCells.length - index;
              }
              thEl[0].style["z-index"] = zIndex;
            }
            if (_.find(excludeTableHeaderCellsWithClass, function(classToCheck) {
              return thEl.hasClass(classToCheck);
            }) === undefined) {
              $(this).empty();
              if (thEl.attr("aria-label") === undefined) {
                thEl.attr("aria-label", column.title ? column.title : lang[column.name]);
              }
              const titleSvg = isJatoTheme && column.titleSvgInHeader;
              const titleIcon = column.titleIconInHeader;
              if ((titleSvg || titleIcon) && thEl.attr("title") === undefined) {
                thEl.attr("title", column.title);
              }
              var contentWrapper = $('<div class="csui-focusable-table-column-header"></div>');
              var contentParent = contentWrapper;
              if (column.orderable) {
                var sortingToggle = thEl;
                thEl.addClass("data-table-custom-area");
                if (isJatoTheme) {
                  contentWrapper = $('<div class="csui-focusable-table-column-header csui-otc-button-wrapper"></div>');
                  sortingToggle = $('<otc-button type="subtle" size="small"></otc-button>').appendTo(contentWrapper);
                  contentParent = sortingToggle;
                }
                sortingToggle.addClass("csui-sorting-toggle");
                sortingToggle.off("click." + self.cid).on("click." + self.cid, e => {
                  if (sortingToggle === thEl) {
                    const skipElements = thEl.find(".data-table-custom-area");
                    const skipTarget = Array.prototype.find.call(skipElements, el => el === e.target || el.contains(e.target));
                    if (skipTarget) {
                      return;
                    }
                    const closest = $(e.target).closest("th, .csui-icon-v2__csui_action_search32, .csui-icon-v2__csui_action_close32, .data-table-custom-area");
                    if (closest.is(".csui-icon-v2__csui_action_search32, .csui-icon-v2__csui_action_close32, .data-table-custom-area:not(th)")) {
                      return;
                    }
                  }
                  const sorting = getSortingFromTable(self.table);
                  const sortDirection = getNextSortingDirection(sorting, index, column);
                  self.table.column(index).order(sortDirection).draw();
                });
              }
              var iconButSorted = (titleSvg || titleIcon) && orderIdx === index;
              var headerEmpty = column.noTitleInHeader === true && (!(titleSvg || titleIcon) || iconButSorted);
              if (accessibleTable) {
                headerEmpty = false;
              }
              if (headerEmpty) {
                contentWrapper.addClass("csui-empty");
                if (iconButSorted) {
                  contentWrapper.addClass("csui-iconButSorted");
                  !sortingToggle.is("otc-button") && contentWrapper.attr("role", "button");
                  if (titleSvg) {
                    contentParent.append(`<otc-icon class="csui-table-header-icon binf-hidden" ispresentation size="16" svg='${titleSvg}'></otc-icon>`);
                  } else if (titleIcon) {
                    contentParent.append('<span class="csui-icon csui-table-header-icon binf-hidden ' + titleIcon + '"></span>');
                  }
                }
              } else {
                if (column.attributes.sort) {
                  !sortingToggle.is("otc-button") && contentWrapper.attr("role", "button");
                }
                let contentEl;
                if (titleSvg) {
                  contentEl = $(`<otc-icon class="csui-table-header-icon" ispresentation size="16" svg='${titleSvg}'></otc-icon>`);
                } else if (titleIcon) {
                  contentEl = $('<span class="csui-icon csui-table-header-icon ' + titleIcon + '"></span>');
                } else {
                  contentEl = $('<div class="csui-table-column-text"></div>').text(column.title);
                }
                if (column.customHeader) {
                  column.customHeader.render();
                  contentEl.append(column.customHeader.$el);
                  column.customHeader.trigger("dom:added");
                }
                contentParent.append(contentEl);
              }
              if (!self.tableColumnsWrappingOn) {
                column.resizeSpan && thEl.addClass("csui-resize-span");
                column.resizeStart && thEl.addClass("csui-resize-start");
                column.resizeEnd && thEl.addClass("csui-resize-end");
                column.isResizeColumn && thEl.addClass("csui-column-resizing");
                column.hasResizeHandle && thEl.addClass("csui-column-resizable");
                if (column.resizeNumber) {
                  thEl.addClass("csui-resize-" + column.resizeNumber);
                  thEl.off("mouseenter." + self.cid).on("mouseenter." + self.cid, {
                    th: this,
                    resizeNumber: column.resizeNumber
                  }, mouseEnterResizableHeader);
                  thEl.off("mouseleave." + self.cid).on("mouseleave." + self.cid, {
                    th: this,
                    resizeNumber: column.resizeNumber
                  }, mouseLeaveResizableHeader);
                }
                column.isSpacingColumn && thEl.addClass(column.filterable ? "csui-resize-handle-padding" : "csui-resize-handle-spacing");
                if (column.spacingNumber) {
                  thEl.attr("csui-resize-spacing", column.spacingNumber);
                  self._nowrapHeaderResizeObserver.observe(thEl[0]);
                }
              }
              $(this).append(contentWrapper);
            }
          }
        });
        ensureExpandAllDetailRowsColumn.call(self, nHead);
        ensureSelectAllCheckbox.call(self, nHead);
        ensureTableHeaderSortArrow.call(self, this.api());
        ensureAllSearchBox.call(self);
        function wrapTableHeaderCellContent(cssClass, childrenSelector) {
          var cssClassTh = cssClass + "__cell-wrapper";
          $table.parent().addClass(cssClass);
          self._el_headerCells.each(function() {
            var header = $(this);
            if (header.find("> ." + cssClassTh).length === 0 && header.find(childrenSelector).length) {
              var wrapper = $("<div>", {
                class: cssClassTh
              });
              header.wrapInner(wrapper);
            }
          });
        }
        if (accessibleTable) {
          wrapTableHeaderCellContent("csui-accessibility-table", ".csui-table-column-search");
          wrapTableHeaderCellContent("csui-accessibility-table", ".csui-table-column-otcsearch");
        } else {
          if (!self.tableColumnsWrappingOn) {
            wrapTableHeaderCellContent("csui-nowrap-table", ".csui-table-column-search");
            wrapTableHeaderCellContent("csui-nowrap-table", ".csui-table-column-otcsearch");
          }
        }
        ensureAllColumnResizeHandle.call(self, this.api());
        self.trigger("tableHeaderRendered", {
          sender: self,
          target: nHead
        });
      },
      footerCallback: function(nFoot, aData, iStart, iEnd, aiDisplay) {
        self.trigger("tableFooterRendered", {
          sender: self,
          target: nFoot
        });
      },
      rowCallback: function(nRow, aData, iDataIndex) {
        var $row = $(nRow);
        var detailRows = addDetailRow.call(self, this.api(), iDataIndex, nRow, aData);
        var initiallySelected = self._allSelectedNodes.get(aData);
        if (initiallySelected) {
          aData.set(SelectCellView.isSelectedModelAttributeName, true);
        }
        var isSelected = aData.get(SelectCellView.isSelectedModelAttributeName);
        if (isSelected) {
          $row.addClass("binf-active");
          _.each(detailRows, function(detailRow) {
            $(detailRow).addClass("binf-active");
          });
        } else {
          $row.removeClass("binf-active");
          _.each(detailRows, function(detailRow) {
            $(detailRow).removeClass("binf-active");
          });
        }
        if (aData.isLocallyCreated) {
          $row.addClass("csui-new-item");
          detailRows.addClass("csui-new-item");
        }
        if (aData.get("id") !== undefined) {
          $row.addClass("csui-saved-item");
          detailRows.addClass("csui-saved-item");
          aData.set("inactive", !self.checkModelHasAction(aData), {
            silent: true
          });
        } else {
          aData.set("inactive", true, {
            silent: true
          });
        }
        if (aData.get("isCut") === true) {
          $row && $row.addClass("csui-cut-row");
          detailRows && detailRows.addClass("csui-cut-row");
        }
        var cellViews = [];
        var displayInlineForm = aData.inlineFormView !== undefined;
        if (displayInlineForm) {
          $row.addClass("csui-table-row-shows-inlineform");
        }
        var inlineFormColspan = 0;
        var tdForInlineForm;
        var tdForDeletion = [];
        self.csuiDestroyRowCallbacks.push(destroyCellViews, destroyRowViews);
        for (var index = 0; index < self.displayedColumns.length; index++) {
          var column = self.displayedColumns[index];
          if (column.CellView) {
            var $td = $($row.children()[index]);
            if ($td.length === 0) {
              continue;
            }
            if (self.tableColumnsWrappingOn && self.cachedColumnWidths && self.cachedColumnWidths[column.className] && !column.CellView.hasFixedWidth) {
              var widthStyle = self.cachedColumnWidths[column.className];
              $td.css(widthStyle);
            }
            if (column.isNaming) {
              $td.attr("role", "rowheader");
            }
            var cellViewOptions = {
              el: $td,
              tableView: self,
              column: column,
              model: aData,
              context: self.context,
              originUrl: originUrl,
              supportUrl: supportUrl,
              nameEdit: self.options.nameEdit,
              favoritesTableOptions: self.options.favoritesTableOptions,
              rowIndex: iDataIndex
            };
            if (column.name === "_toggledetails") {
              cellViewOptions.rowIsExpanded = self.detailsRowsAreExpanded || self.expandedDetailRows[aData.id || aData.get("id")];
            }
            var cellView = new column.CellView(cellViewOptions);
            if (column.name === "_toggledetails") {
              self.listenTo(cellView, "toggle:detailsrow", function(args) {
                self.expandedDetailRows[args.model.id || args.model.get("id")] = args.detailsRowIsExpanded;
              });
            }
            if (!self.tableColumnsWrappingOn && !displayInlineForm) {
              column.resizeSpan && cellView.el.classList.add("csui-resize-span");
              column.resizeStart && cellView.el.classList.add("csui-resize-start");
              column.resizeEnd && cellView.el.classList.add("csui-resize-end");
              column.isResizeColumn && cellView.el.classList.add("csui-column-resizing");
              column.hasResizeHandle && cellView.el.classList.add("csui-column-resizable");
              column.resizeNumber && cellView.el.classList.add("csui-resize-" + column.resizeNumber);
            }
            if (displayInlineForm) {
              if (column.name === "type") {
                cellView.render();
                self.listenTo(cellView, "type:clicked", function() {
                  self.triggerMethod("type:clicked");
                });
              } else {
                if ((column.isNaming || column.name === "name") && !tdForInlineForm) {
                  inlineFormColspan = 1;
                  tdForInlineForm = $td;
                } else {
                  if (column.name !== "_select" && column.name !== "order") {
                    inlineFormColspan++;
                    tdForDeletion.push($td);
                  }
                }
              }
            } else {
              cellView.render();
            }
            self.listenTo(cellView, "cellCloseOther", function() {
              self.cancelAnyExistingInlineForm();
              self.trigger("closeOther", cellView);
              self.lockedForOtherContols = true;
              _.each(cellViews, function(otherCellView) {
                if (otherCellView !== cellView) {
                  otherCellView.triggerMethod("closeOther");
                }
              });
            });
            self.listenTo(cellView, "cellAllowOther", function() {
              self.trigger("allowOther", cellView);
              self.lockedForOtherContols = false;
              _.each(cellViews, function(otherCellView) {
                if (otherCellView !== cellView) {
                  otherCellView.triggerMethod("allowOther");
                }
              });
            });
            self.listenTo(cellView, "cancelEdit", function() {
              var unsavedModel = self.collection.at(0);
              if (unsavedModel && unsavedModel.get("id") === undefined) {
                unsavedModel.csuiIsRemoved = true;
                self.collection.remove(unsavedModel);
              }
            });
            self.listenTo(cellView, "show:add:favorite:form", function() {
              self._destroyInlineBar();
              self.lockedForOtherContols = true;
            });
            self.listenTo(cellView, "close:add:favorite:form", function() {
              self.lockedForOtherContols = false;
            });
            if (iDataIndex >= 0) {
              var theFunc = function(colIndex, event) {
                self.trigger("clicked:cell", {
                  cellView: cellView,
                  rowIndex: iDataIndex,
                  colIndex: colIndex,
                  model: aData
                });
              };
              self.listenTo(cellView, "clicked:cell", theFunc.bind(null, index));
              self.listenTo(cellView, "clicked:checkbox", function(event) {
                if (aData.get("selectable") !== false) {
                  var tt = getTableTools.call(self);
                  if (event.checked === "false") {
                    if (self._isSingleSelectionEnabled()) {
                      self._allSelectedNodes.reset();
                    }
                    tt.fnSelect(nRow);
                  } else {
                    tt.fnDeselect(nRow);
                  }
                }
              });
            }
            cellViews.push(cellView);
          }
        }
        function destroyRowViews() {
          var allRowViews = self._detailRowViewsByModelId || {};
          Object.keys(allRowViews).forEach(function(rowViewId) {
            var itemRowViews = allRowViews[rowViewId].views;
            itemRowViews.forEach(function(rowView) {
              self.stopListening(rowView);
              rowView.destroy();
            });
          });
          self._detailRowsDescriptionTRs = [];
          self._detailRowViewsByModelId = {};
          self.hoveredRowDataId = undefined;
        }
        function destroyCellViews() {
          var a = cellViews;
          setTimeout(function() {
            for (var i = 0; i < a.length; i++) {
              self.stopListening(a[i]);
              a[i].destroy();
            }
          }, 0);
        }
        function handleRowHover(dtRow, detailRows) {
          if (detailRows === undefined) {
            detailRows = $();
          }
          var hoveredNodeChanged = true;
          var rowDataId = dtRow._DT_RowIndex;
          if (self.hoveredRowDataId && self.hoveredRowDataId === rowDataId) {
            hoveredNodeChanged = false;
          }
          self.hoveredRowDataId = rowDataId;
          if (hoveredNodeChanged) {
            if (self.hoveredRow) {
              $(self.hoveredRow).removeClass("csui-state-hover");
              var prevDetailRows = self.table.row(self.hoveredRow).child();
              if (prevDetailRows) {
                prevDetailRows.removeClass("csui-state-hover");
              }
            }
            var node = self.table.row(dtRow).data();
            if (node) {
              var nodeId = node.id || node.get("id");
              if (nodeId !== undefined) {
                var args = {
                  sender: self,
                  targets: [ dtRow ],
                  nodes: getNodes.call(self, [ dtRow ])
                };
                self.trigger("selectingTableRow", args);
                if (!args.cancel) {
                  self.hoveredRow = dtRow;
                  $(dtRow).addClass("csui-state-hover");
                  detailRows.addClass("csui-state-hover");
                }
              }
            }
          }
        }
        function handleRowHoverLeave(dtRow, detailRows) {
          if (detailRows === undefined) {
            detailRows = $();
          }
          $(dtRow).removeClass("csui-state-hover");
          detailRows.removeClass("csui-state-hover");
          self.hoveredRowDataId = undefined;
          self.hoveredRow = undefined;
        }
        if (displayInlineForm && tdForInlineForm) {
          _.each(tdForDeletion, function(el) {
            el.remove();
          });
          const inlineFormInfo = {};
          if (!self.tableColumnsWrappingOn) {
            const rowCells = $row.children();
            inlineFormInfo.lastPinnedIndex = self.displayedColumns.findIndex(column => column.lastPinned);
            inlineFormInfo.td = tdForInlineForm[0];
            inlineFormInfo.trIndex = iDataIndex;
            inlineFormInfo.tdIndex = rowCells.index(tdForInlineForm[0]);
            for (let index = 0; index <= inlineFormInfo.tdIndex; index++) {
              rowCells[index].classList.add("csui-nowrap-table__column_sticky");
            }
            inlineFormColspan = inlineFormInfo.tdIndex < inlineFormInfo.lastPinnedIndex ? inlineFormInfo.lastPinnedIndex - inlineFormInfo.tdIndex + 1 : 1;
            const inlineFormColumsConsumed = inlineFormInfo.tdIndex + inlineFormColspan;
            const tableColumnsRestCount = self.displayedColumns.length - inlineFormColumsConsumed;
            const inlineRowColumnsRestCount = rowCells.length - 1 - inlineFormInfo.tdIndex;
            const inlineRowColumnsMissing = tableColumnsRestCount - inlineRowColumnsRestCount;
            for (let index = 0; index < inlineRowColumnsMissing; index++) {
              const tdFirstNonSticky = document.createElement("td");
              $row[0].insertBefore(tdFirstNonSticky, tdForInlineForm[0].nextSibling);
            }
          }
          tdForInlineForm.addClass("csui-inlineform-parent");
          if (inlineFormColspan > 1) {
            tdForInlineForm.attr("colspan", inlineFormColspan);
          }
          self.trigger("closeOther");
          if (aData.inlineFormView) {
            if (self.activeInlineForm) {
              self.activeInlineForm.destroy();
            }
            self._inlineFormInfo = inlineFormInfo;
            self.activeInlineForm = new aData.inlineFormView({
              model: aData,
              originatingView: self.options.originatingView,
              context: self.context
            });
          }
          self.activeInlineForm.listenTo(self.activeInlineForm, "destroy", function() {
            self.lockedForOtherContols = false;
            if (self._inlineFormInfo && !!self.activeInlineForm.model.get("id")) {
              setTimeout(function() {
                self.accFocusedState.focusView = "tableBody";
                self.trigger("changed:focus");
                self.currentlyFocusedElement().trigger("focus");
              }, 1);
            }
            delete self._inlineFormInfo;
            delete self.activeInlineForm;
            self.trigger("destroy:inlineform");
          });
          var inlineFormRegion = new Marionette.Region({
            el: tdForInlineForm
          });
          inlineFormRegion.show(self.activeInlineForm);
          self.trigger("show:inlineform");
        } else {
          if (!self.tableColumnsWrappingOn) {
            $row.children().each((index, td) => {
              const column = self.displayedColumns[index];
              if (column.attributes.customization_pinned) {
                td.classList.add("csui-nowrap-table__column_sticky");
                column.lastPinned && td.classList.add("csui-nowrap-table__column_last-sticky");
              }
            });
          }
          $row.mousehover(function() {
            var args = {
              sender: self,
              target: nRow,
              node: self.table.row(nRow).data()
            };
            if (args.node && args.node === self.inlineBarView?.options.model) {
              return;
            }
            self.trigger("enterTableRow", args);
          }, function() {
            var args = {
              sender: self,
              target: nRow,
              node: self.table.row(nRow).data()
            };
            self.trigger("leaveTableRow", args);
          }, {
            namespace: self.cid
          });
          $row.mousehover(function() {
            handleRowHover.call(self, nRow, detailRows);
          }, function() {
            handleRowHoverLeave.call(self, nRow, detailRows);
          }, {
            namespace: self.cid
          });
          detailRows.mousehover(function() {
            handleRowHover.call(self, nRow, detailRows);
          }, function() {}, {
            namespace: self.cid
          });
        }
        self.trigger("tableRowRendered", {
          sender: self,
          target: nRow,
          node: aData,
          expandedRows: detailRows
        });
      }
    }, additionalCreationOptions);
    if (!useServerSideProcessing) {
      creationOptions.data = this.collection.models;
    }
    var tableEl = $("<table></table>").addClass("binf-table").attr("id", this.cid);
    this._el_table = tableEl[0];
    var tableAria = _.isFunction(this.options.tableAria) ? this.options.tableAria() : this.options.tableAria;
    tableAria && tableEl.attr("aria-label", tableAria);
    if (!accessibleTable && this.tableColumnsWrappingOn) {
      this.$el.addClass("csui-not-ready");
    }
    this._nowrapTableResizeObserver.disconnect();
    if (!this.tableColumnsWrappingOn) {
      tableEl.addClass("csui-nowrap-table");
    }
    tableEl.appendTo(this.el);
    this.table = tableEl.DataTable(creationOptions);
    if (!this.tableColumnsWrappingOn) {
      this._nowrapTableResizeObserver.observe(this._el_table);
      this._nowrapTableResizeObserver.observe(this._el_wrapper);
    }
    if (this._isSingleSelectionEnabled()) {
      selectTableRows.call(this, this._allSelectedNodes);
    }
    $(this.$el.children()[0]).attr("tabindex", "-1");
    selectRowsByNodeIds.call(this, additionalCreationOptions.selectedNodesById);
    if (this.collection.length > 0 && additionalCreationOptions.currentScollPosition !== undefined) {
      this._getScrollContainer().scrollTop(additionalCreationOptions.currentScollPosition);
    }
    this.table.off("click." + self.cid).on("click." + self.cid, ".csui-table-cell-default-action", function(event) {
      delegateClickAction.call(self, event, "DefaultPre");
    }).on("click." + self.cid, "a#parentAction", function(event) {
      delegateClickAction.call(self, event, "Parent");
    }).on("click." + self.cid, "a#menuAction", function(event) {
      delegateClickAction.call(self, event, "Menu");
    }).on("click." + self.cid, "input[id^='selectAction']", function(event) {
      event.stopPropagation();
      var target = $(event.target);
      var td = target.closest("td,th");
      td.trigger("click");
    }).off("processing." + self.cid).on("processing." + self.cid, function(event, oSettings, shown) {
      ensureProcessingPanel.call(self, oSettings, shown);
    }).off("destroy." + self.cid).on("destroy." + self.cid, function(event, oSettings) {}).off("preDraw." + self.cid).on("preDraw." + self.cid, function(event, oSettings) {
      if (!oSettings.oFeatures.bServerSide || oSettings.bDrawing) {
        cleanUpTableEventListeners.call(self);
        if (self.activeInlineForm) {
          self.activeInlineForm.destroy();
        }
      }
    });
    tableEl.off("order.dt." + self.cid).on("order.dt." + self.cid, function() {
      if (self.displayedColumns) {
        var orderBy = [];
        _.each(self.table.order(), function(orderinfo) {
          var sortColumnIndex = orderinfo[0];
          var sortColumnKey = self.displayedColumns[sortColumnIndex].attributes.column_key;
          if (sortColumnKey) {
            if (orderinfo[1]) {
              orderBy.push(sortColumnKey + " " + orderinfo[1]);
            } else {
              orderBy.push(sortColumnKey);
            }
          }
        });
        if (!(self.collection && self.collection.isSortOptionSelected)) {
          if (orderBy.length) {
            self.collection.setOrder(orderBy.join());
          }
        }
      }
    });
    if (this.options.alternativeHeader) {
      log.warn("Using of options.alternativeHeader with table.view is deprecated. Please use" + " csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view" + " instead and render this view ouside of table.view. The behavior" + " csui/behaviors/table.rowselection.toolbar/table.rowselection.toolbar.behavior" + " might help using it.") && console.log(log.last);
      this.$el.find(".csui-table-alternative-header").remove();
      var alternativeHeaderRegionEl = $('<div class="csui-table-alternative-header"></div>');
      this.$el.prepend(alternativeHeaderRegionEl);
      this._alternativeHeaderRegion = new Marionette.Region({
        el: alternativeHeaderRegionEl
      });
      var alternativeHeaderView = this._createAlternativeHeaderView();
      this._alternativeHeaderRegion.show(alternativeHeaderView);
      this.triggerMethod("alternativeHeader:show", alternativeHeaderView);
      this.listenTo(alternativeHeaderView, "childview:toolitem:action", this._toolbarItemClicked);
    }
    $(this._el_columnResizeIndicator).remove();
    delete this._el_columnResizeIndicator;
    if (!this.tableColumnsWrappingOn) {
      var columnResizeIndicator = $('<div class="csui-column-resize-indicator"></div>');
      this.$el.prepend(columnResizeIndicator);
      this._el_columnResizeIndicator = columnResizeIndicator[0];
    }
    this.trigger("tableCreated", {
      sender: this
    });
  }
  function setAriaAttr(el, attr, value) {
    if (el) {
      const tagName = el.tagName;
      if (tagName === "OTC-BUTTON" || tagName === "OTC-ICON") {
        attr = attr.replaceAll("-", "");
      }
      el.setAttribute(attr, value);
    }
  }
  function setSortingTooltipAndAriaLabel(thEl, column, nextSortDir) {
    const columnTitle = column.titleAttr || column.title;
    const langTooltip = nextSortDir === "desc" ? lang.NodeTableSortDescendingTooltip : lang.NodeTableSortAscendingTooltip;
    const titleAttr = _.str.sformat(langTooltip, columnTitle);
    var sortingToggle = thEl.find(".csui-sorting-toggle");
    let actualButtonElement;
    if (sortingToggle.length > 0) {
      thEl.attr("title", columnTitle);
      thEl.removeAttr("aria-label");
      actualButtonElement = sortingToggle;
    } else if (thEl.hasClass("csui-sorting-toggle")) {
      sortingToggle = thEl;
      actualButtonElement = thEl.find('div.csui-focusable-table-column-header[role="button"]');
    } else {
      return;
    }
    sortingToggle.attr("title", titleAttr);
    if (thEl.hasClass("sorting_asc")) {
      thEl[0].setAttribute("aria-label", _.str.sformat(lang.NodeTableSortedAscendingColumnAria, columnTitle));
    } else if (thEl.hasClass("sorting_desc")) {
      thEl[0].setAttribute("aria-label", _.str.sformat(lang.NodeTableSortedDescendingColumnAria, columnTitle));
    } else {
      thEl[0].setAttribute("aria-label", columnTitle);
    }
    if (nextSortDir === "desc") {
      setAriaAttr(actualButtonElement[0], "aria-label", _.str.sformat(lang.NodeTableSortDescendingButtonAria, columnTitle));
    } else if (nextSortDir === "asc") {
      setAriaAttr(actualButtonElement[0], "aria-label", _.str.sformat(lang.NodeTableSortAscendingButtonAria, columnTitle));
    }
  }
  function getNextSortingDirection(sorting, index, column) {
    var sortDirection;
    if (sorting.index === index) {
      if (sorting.direction === "asc") {
        sortDirection = "desc";
      } else if (sorting.direction === "desc") {
        sortDirection = "asc";
      }
    }
    if (!sortDirection) {
      sortDirection = column.asSorting ? column.asSorting[0] : "asc";
    }
    return sortDirection;
  }
  function getSortingFromTable(table, columnIndex) {
    var sortDirection;
    var sortColumnIndex;
    var order = table.order();
    if (order && order.length > 0 && order[0].length > 1) {
      var sortDefCol0 = order[0];
      if (columnIndex == null || sortDefCol0[0] === columnIndex) {
        sortColumnIndex = sortDefCol0[0];
        sortDirection = sortDefCol0[1];
      }
    }
    return {
      direction: sortDirection,
      index: sortColumnIndex
    };
  }
  function ensureProcessingPanel(oSettings, shown) {
    if (!this.disablingOverlay) {
      this.disablingOverlay = $("<div id='disabling_overlay'></div>").hide().prependTo(this.table);
    }
    if (shown) {
      this.disablingOverlay.show();
    } else {
      this.disablingOverlay.hide();
    }
  }
  function destroyProcessingPanel(oSettings) {
    if (this.disablingOverlay) {
      this.disablingOverlay.remove();
      this.disablingOverlay = undefined;
    }
  }
  function getTableTools() {
    return this.tableTools || (this.tableTools = TableTools.fnGetInstance(this.table.table().node()));
  }
  function getCreationOptions() {
    var options;
    switch (this.options.paginationStyle) {
     case "all_buttons":
      options = {
        pagingType: "full_numbers"
      };
      break;

     case "two_buttons":
      options = {
        pagingType: "two_button"
      };
      break;

     case "infinite_scrolling":
      options = {
        scrollCollapse: true,
        scrollY: this.options.pageSize ? this.options.pageSize * 25 - 1 + "px" : "249px"
      };
      break;

     default:
      options = {
        paging: false
      };
    }
    if (!this.recreated) {
      this.recreated = this.columns.length || this.columns.fetched;
    }
    options.order = getOrderFromOrderBy.call(this, this.collection.orderBy);
    options.ordering = getTableOrderingOption.call(this);
    var selectRows = this.options.selectRows;
    if (selectRows === "none") {
      options.dom = '<"H"lfr>t<"F"ip>';
    } else {
      options.dom = '<"H"lTfr>t<"F"ip>';
      var self = this;
      options.tableTools = {
        aButtons: [],
        sRowSelect: selectRows,
        fnPreRowSelect: function(ev, rows, selecting) {
          if (self._rebuildingTable) {
            return;
          }
          function triggerRowClickedEvent() {
            var node = self.table.row(rows[0]).data();
            if (!node.inlineFormView) {
              var rowClickedEventArgs = {
                sender: self,
                target: rows[0],
                node: node
              };
              self.triggerMethod("row:clicked", rowClickedEventArgs);
              return !rowClickedEventArgs.cancel;
            }
          }
          function triggerRowSelectingEvent() {
            var nodes = getNodes.call(self, rows);
            var args = {
              sender: self,
              targets: rows,
              nodes: nodes
            };
            self.trigger(selecting ? "selectingTableRow" : "unselectingTableRow", args);
            return !args.cancel;
          }
          Marionette.triggerMethodOn(self.tableBodyView, "before:render");
          if (rows && rows.length > 0) {
            var ok = triggerRowClickedEvent();
            if (ok) {
              if (self.options.selectColumn) {
                var selectByClick = ev && ev.target;
                var canSel = !selectByClick || $(ev.target).hasClass(SelectCellView.columnClassName);
                if (canSel) {
                  return triggerRowSelectingEvent();
                } else {
                  return false;
                }
              } else {
                return triggerRowSelectingEvent();
              }
            } else {
              return false;
            }
          } else {
            return true;
          }
        },
        fnRowSelected: function(rows) {
          if (self._rebuildingTable) {
            return;
          }
          if (_.isArray(rows) && rows.length > 0) {
            _.each(rows, function(r) {
              var node = self.table.row(r).data(), currentRow = $(r);
              node.set(SelectCellView.isSelectedModelAttributeName, true);
            });
            updateSelectAllCheckbox.call(self);
            Marionette.triggerMethodOn(self.tableBodyView, "render");
            self.trigger("closeOther");
            self.selectedChildren.reset(self.getSelectedChildren());
            self.trigger("tableRowSelected", {
              sender: self,
              targets: rows,
              nodes: getNodes.call(self, rows)
            });
          }
        },
        fnRowDeselected: function(rows) {
          if (self._rebuildingTable) {
            return;
          }
          if (_.isArray(rows) && rows.length > 0) {
            _.each(rows, function(r) {
              var node = self.table.row(r).data(), currentRow = $(r);
              node.set(SelectCellView.isSelectedModelAttributeName, false);
            });
            updateSelectAllCheckbox.call(self);
            Marionette.triggerMethodOn(self.tableBodyView, "render");
            self.selectedChildren.reset(self.getSelectedChildren());
            self.trigger("tableRowUnselected", {
              sender: self,
              targets: rows,
              nodes: getNodes.call(self, rows)
            });
          }
        }
      };
    }
    options.searching || options.lengthChange || (options.dom = options.dom.replace('"H"', "").replace("l", "").replace("f", ""));
    options.info || options.pagingType || (options.dom = options.dom.replace('"F"', "").replace("i", "").replace("p", ""));
    tryApplyingStateSavedBeforeRebuild.call(this, options);
    return options;
  }
  function getOrderFromOrderBy(orderBy) {
    var orders = [];
    if (orderBy) {
      orders = _.map(orderBy.split(","), function(orderBy) {
        orderBy = orderBy.split(" ");
        var columnKey = orderBy[0], columnNumber = getSortableColumnNumber.call(this, columnKey);
        if (columnNumber !== undefined) {
          columnKey = this.displayedColumns[columnNumber].attributes.column_key;
          if (this.columns.findWhere({
            column_key: columnKey
          }).get("sort")) {
            return [ columnNumber, orderBy[1] || "asc" ];
          }
        }
      }, this);
    }
    var definedOrders = _.filter(orders, function(orderBy) {
      return !!orderBy;
    });
    return definedOrders;
  }
  function getTableOrderingOption() {
    if (this.options.enableSorting !== true) {
      return false;
    }
    var sortableColumn = _.find(this.displayedColumns, function(col) {
      return col.attributes && col.attributes.sort === true;
    });
    return !!sortableColumn;
  }
  function ensureExpandAllDetailRowsColumn(nHead) {
    function toggleDetailsRow(event) {
      this.detailsRowsAreExpanded = !this.detailsRowsAreExpanded;
      this._clearExpandedRows();
      this._detailRowsDescriptionTRs = [];
      this._drawTable();
      if (this.options.descriptionRowViewOptions && this.options.descriptionRowViewOptions.showDescriptions) {
        this.showDetailRowDescriptions(true);
      } else {
        this.trigger("dom:refresh");
      }
      if (!!this.collection.isSortOptionSelected) {
        this.collection.isSortOptionSelected = false;
      }
    }
    if (this.options.haveDetailsRowExpandCollapseColumn && this.options.haveToggleAllDetailsRows && this.collection.length) {
      var expandAllHeaderCell = $("th.csui-table-cell-_toggledetails", nHead);
      if (expandAllHeaderCell.length > 0 && !this._toggleExpandAllRegion) {
        var toggleExpandAllView = new DisclosureView({
          titleDisclosed: toggleDetailsLang.expandAllTooltip,
          titleExpanded: toggleDetailsLang.collapseAllTooltip,
          ariaLabelDisclosed: toggleDetailsLang.expandAllAria,
          ariaLabelExpanded: toggleDetailsLang.collapseAllAria
        });
        this.listenTo(toggleExpandAllView.model, "change:expanded", toggleDetailsRow);
        this._toggleExpandAllRegion = new Marionette.Region({
          el: expandAllHeaderCell
        });
        this._toggleExpandAllRegion.show(toggleExpandAllView);
      }
    }
  }
  function ensureSelectAllCheckbox(nHead) {
    var self = this;
    var selectColumn = $("th:first-child", nHead);
    if (selectColumn.length === 0) {
      return;
    }
    function toggleSelection() {
      var selectedRows = [];
      var selectedModels = [];
      var deselectedRows = [];
      var deselectedModels = [];
      var index, row;
      if (self._selectAllCheckboxRegion && self._selectAllCheckboxRegion.currentView) {
        Backbone.trigger("closeToggleAction");
        var cbView = self._selectAllCheckboxRegion.currentView;
        var checked = cbView.model.get("checked");
        switch (checked) {
         case "true":
          self.collection.each(function(model) {
            if (model.get(SelectCellView.isSelectedModelAttributeName)) {
              index = self.collection.indexOf(model);
              row = self.table.row(index);
              deselectedModels.push(model);
              deselectedRows.push(row.node());
            }
          });
          break;

         default:
          self.collection.each(function(model) {
            if (model.get("selectable") !== false) {
              if (!model.get(SelectCellView.isSelectedModelAttributeName)) {
                index = self.collection.indexOf(model);
                row = self.table.row(index);
                selectedModels.push(model);
                selectedRows.push(row.node());
              }
            } else {
              if (model.get(SelectCellView.isSelectedModelAttributeName)) {
                index = self.collection.indexOf(model);
                row = self.table.row(index);
                deselectedModels.push(model);
                deselectedRows.push(row.node());
              }
            }
          });
        }
        if (deselectedRows.length > 0) {
          self.trigger("tableRowUnselected", {
            sender: self,
            targets: deselectedRows,
            nodes: deselectedModels
          });
          deselectedModels.forEach(function(model) {
            model.set(SelectCellView.isSelectedModelAttributeName, false);
          });
        }
        if (selectedRows.length > 0) {
          selectedModels.forEach(function(model) {
            model.set(SelectCellView.isSelectedModelAttributeName, true);
          });
          self.trigger("tableRowSelected", {
            sender: self,
            targets: selectedRows,
            nodes: selectedModels
          });
        }
        self.selectedChildren.reset(self.getSelectedChildren());
        updateSelectAllCheckbox.call(this);
        self.trigger("dom:refresh");
      }
    }
    function _markSelectAllCheckboxFocusable() {
      var checkboxFocusableElement = checkboxView.el.querySelector("otc-checkbox");
      $(checkboxFocusableElement).addClass("csui-focusable-table-column-header");
    }
    if (this.options.selectColumn && this.options.selectAllColumnHeader) {
      if (!this._selectAllCheckboxRegion) {
        var checkboxView = new CheckboxView({
          checked: false,
          disabled: false,
          ariaLabel: lang.selectAllAria,
          title: lang.selectAll
        });
        this.listenTo(checkboxView, "clicked", function(e) {
          e.cancel = true;
          toggleSelection.call(self);
        });
        this.listenTo(checkboxView, "render", function() {
          _markSelectAllCheckboxFocusable();
        });
        this._selectAllCheckboxRegion = new Marionette.Region({
          el: selectColumn
        });
        this._selectAllCheckboxRegion.show(checkboxView);
        _markSelectAllCheckboxFocusable();
      }
      if (this.collection.length) {
        this._selectAllCheckboxRegion.currentView.setDisabled(false);
        var selected = this.collection.where({
          csuiIsSelected: true
        }).length;
        if (selected > 0) {
          updateSelectAllCheckbox.call(this);
        }
      } else {
        this._selectAllCheckboxRegion.currentView.setDisabled(true);
      }
    }
  }
  function destroyAllSearchBox() {
    _.each(this.searchBoxes, function(sb) {
      sb.destroy();
    });
    this.searchBoxes.splice(0, this.searchBoxes.length);
  }
  function ensureTableHeaderSortArrow(table, sortKey) {
    const sorting = getSortingFromTable(table);
    if (sorting.direction != null) {
      var self = this;
      const sortColumnIndex = sorting.index;
      const sortDirection = sorting.direction;
      if (sortColumnIndex < this.displayedColumns.length) {
        var arrowEl = '<span class="csui-sort-arrow icon-sortArrowUnknown"></span>';
        if (theming.isJATOTheme()) {
          if (sortDirection === "asc") {
            arrowEl = `<otc-icon size="16" class="csui-sort-arrow" svg='${jatoIcons["actionSortAscending"]}'></otc-icon>`;
          } else if (sortDirection === "desc") {
            arrowEl = `<otc-icon size="16" class="csui-sort-arrow" svg='${jatoIcons["actionSortDescending"]}'></otc-icon>`;
          }
        } else {
          if (sortDirection === "asc") {
            arrowEl = '<span class="csui-sort-arrow icon-sortArrowUp"></span>';
          } else if (sortDirection === "desc") {
            arrowEl = '<span class="csui-sort-arrow icon-sortArrowDown"></span>';
          }
        }
        var thEl = self.$("th:eq(" + sortColumnIndex + ")");
        self.$el.find(".csui-sort-arrow").remove();
        var arrowParent = thEl.hasClass("csui-sorting-toggle") ? thEl.find(".csui-focusable-table-column-header") : thEl.find(".csui-sorting-toggle");
        arrowParent.append(arrowEl);
        _.find(self.searchBoxes, function(searchbox) {
          var searchColumnName = searchbox.getColumn();
          if (sortKey === searchColumnName && searchbox.getShown()) {
            self.$el.find(".csui-sort-arrow").addClass("binf-hidden");
            return true;
          }
        });
      }
    }
  }
  function ensureAllSearchBox() {
    var self = this;
    destroyAllSearchBox.call(self);
    this._el_headerCells && this._el_headerCells.each(function(index) {
      if ($(this).find(".csui-table-column-search, .csui-table-column-otcsearch").length === 0) {
        if (self.displayedColumns.length > index) {
          var columnName = self.displayedColumns[index].name.toLowerCase();
          var columnTitle = self.displayedColumns[index].title;
          if (self.displayedColumns[index].noTitleInHeader === true) {
            columnTitle = "";
          }
          if (self.displayedColumns[index].filterable === true) {
            var filterKey = self.displayedColumns[index].data && self.displayedColumns[index].data(undefined, "filterBy"), searchbox, isTypeAheadSearchbox = self.columnsWithTypeaheadSearchbox && _.indexOf(self.columnsWithTypeaheadSearchbox, columnName) !== -1, filterOpts = {
              column: filterKey,
              columnName: columnName,
              columnTitle: columnTitle,
              context: self.options.context
            };
            if (isTypeAheadSearchbox) {
              var typeaheadSearchboxOptions = self.options.columnsWithTypeaheadSearchbox[columnName];
              _.extend(filterOpts, typeaheadSearchboxOptions);
              searchbox = new TypeaheadSearchBoxView(filterOpts);
            } else if (useOtcSearch != null) {
              const filterVal = self.collection.filters && self.collection.filters[columnName];
              searchbox = new OtcSearchBoxView(filterVal, filterOpts);
            } else {
              var filterVal = self.collection.filters && self.collection.filters[columnName];
              searchbox = new SearchBoxView(filterVal, filterOpts);
              searchbox.$el.attr("title", "");
            }
            searchbox.$el.addClass("data-table-custom-area");
            self.searchBoxes.push(searchbox);
            searchbox.off(searchbox.valueChangedEventName).on(searchbox.valueChangedEventName, function(data) {
              self.applyFilter(data);
            });
            var buttonDiv = $(this).find(".csui-otc-button-wrapper");
            var textDiv = $(this).find(".csui-table-column-text");
            var thead = this;
            searchbox.off("opened").on("opened", function() {
              buttonDiv.addClass("binf-hidden");
              textDiv.addClass("binf-hidden");
              $(thead).find(".csui-sort-arrow").addClass("binf-hidden");
              $(thead).removeAttr("title");
              $(thead).attr("aria-label", columnTitle);
              self.searchColumn = columnName;
            });
            searchbox.off("closed").on("closed", function() {
              buttonDiv.removeClass("binf-hidden");
              textDiv.removeClass("binf-hidden");
              $(thead).find(".csui-sort-arrow").removeClass("binf-hidden");
              const sorting = getSortingFromTable(self.table);
              const nextSortDir = getNextSortingDirection(sorting, index, self.displayedColumns[index]);
              setSortingTooltipAndAriaLabel($(thead), self.displayedColumns[index], nextSortDir);
              self.collection.filters[columnName] = undefined;
            });
            searchbox.off("changed:focus").on("changed:focus", function() {
              if (self.tableCaptionView) {
                self.tableCaptionView._accSearchBoxFocused({
                  columnName: columnName,
                  columnIndex: index
                });
              }
            });
            searchbox.render();
            $(this).append(searchbox.el);
            if (columnName === self.searchColumn) {
              searchbox.setFocus();
            }
          }
        }
      }
    });
  }
  function selectTableRows(nodes) {
    nodes && nodes.forEach(function(node) {
      selectRowsByNodeIds.call(this, node.get("id"));
    }.bind(this));
  }
  function selectRowsByNodeIds(selectedNodesById) {
    if (this.table && selectedNodesById) {
      _.each(this.table.rows(), function(rows) {
        _.each(rows, function(position) {
          var node = this.table.row(position).data(), nodeSelection = false;
          if (this._allSelectedNodes.length) {
            nodeSelection = !!this._allSelectedNodes.get(node);
          } else {
            var id = node.id || node.get("id");
            nodeSelection = !!selectedNodesById[id];
          }
          if (nodeSelection) {
            var tt = getTableTools.call(this);
            var trNode = this.table.row(position).node();
            tt.fnSelect(trNode);
          }
        }, this);
      }, this);
    }
  }
  function updateSelectAllCheckbox() {
    if (this._selectAllCheckboxRegion && this._selectAllCheckboxRegion.currentView) {
      var checkboxView = this._selectAllCheckboxRegion.currentView;
      if (this.collection.length) {
        checkboxView.setDisabled(false);
        var selection = this.collection.filter(function(model) {
          return model.get(SelectCellView.isSelectedModelAttributeName);
        });
        var numNotDisabled;
        if (this.table) {
          numNotDisabled = this.table.rows().nodes().to$().find(".csui-checkbox:not([disabled])").length;
        } else {
          numNotDisabled = this.collection.length;
        }
        var all = selection.length >= numNotDisabled;
        if (selection.length > 0 && !all) {
          checkboxView.setChecked("mixed");
        } else {
          checkboxView.setChecked(selection.length > 0);
        }
      } else {
        checkboxView.model.set("checked", false);
        checkboxView.setDisabled(true);
      }
    }
  }
  function getNodes(rows) {
    return _.map(rows, function(row) {
      var position = this.table.row(row).index();
      return this.table.row(position).data();
    }, this);
  }
  function getSortableColumnNumber(name) {
    name = name.toLowerCase();
    var number;
    _.find(this.displayedColumns, function(column, index) {
      if (column.attributes.sort_key === name || column.name.toLowerCase() === name || column.attributes.column_key === name) {
        number = index;
        return true;
      }
    });
    return number;
  }
  function addSelectColumn(self, columns, columnsByKey) {
    var options = self.options;
    if (options.selectColumn && !(columns.length > 0 && columns[0].get("column_key") === "_select")) {
      const columnModel = new NodeChildrenColumnModel({
        column_key: "_select",
        name: lang.selectionColumnTitle,
        sortable: false,
        alignment: "center",
        permanentColumn: true
      });
      columns.unshift(columnModel);
      columnsByKey[columnModel.get("column_key")] = columnModel;
    }
  }
  function getAdditionalColumns(self, columns, columnsByKey) {
    var options = self.options;
    if (options.additionalColumns && options.additionalColumns.length > 0) {
      _.each(options.additionalColumns, function(column, index) {
        const columnModel = new NodeChildrenColumnModel(column);
        columns.push(columnModel);
        columnsByKey[columnModel.get("column_key")] = columnModel;
      });
    }
    if (accessibleTable && options.enforceDescriptionColumnInAccessibleMode) {
      var hasCustomDescriptionColumn = columns.some(function(column) {
        if (column.get("column_key") === "description") {
          column.set("is_default_column", true, {
            silent: true
          });
          return true;
        }
      });
      if (!hasCustomDescriptionColumn) {
        const columnModel = new NodeChildrenColumnModel({
          column_key: "description",
          is_default_column: true,
          name: lang.descriptionColumnTitle,
          sortable: false,
          permanentColumn: true
        });
        columns.push(columnModel);
        columnsByKey[columnModel.get("column_key")] = columnModel;
      }
    }
    if (options.haveDetailsRowExpandCollapseColumn) {
      const columnModel = new NodeChildrenColumnModel({
        column_key: "_toggledetails",
        name: "",
        sortable: false,
        alignment: "center",
        permanentColumn: true,
        title: "",
        noTitleInHeader: true
      });
      columns.push(columnModel);
      columnsByKey[columnModel.get("column_key")] = columnModel;
    }
    return columns;
  }
  function freeObjects() {
    destroyProcessingPanel.call(this);
    cleanUpTableEventListeners.call(this);
    this._destroyTableHeaderAndBodyViews();
  }
  function destroyTable() {
    freeObjects.call(this);
    if (this.table) {
      this.trigger("destroyingTable", {
        sender: this
      });
      this._inlineBarShouldDestroy();
      destroyAllSearchBox.call(this);
      destroyAllColumnMenuViews.call(this);
      if (this._alternativeHeaderRegion) {
        this._alternativeHeaderRegion.empty();
        delete this._alternativeHeaderRegion;
      }
      if (this._selectAllCheckboxRegion) {
        this._selectAllCheckboxRegion.empty();
        delete this._selectAllCheckboxRegion;
      }
      delete this._detailRowsDescriptionTRs;
      delete this._detailRowViewsByModelId;
      this.table.destroy();
      cleanPlaceholder.call(this);
      delete this.table;
      delete this.tableTools;
      this.trigger("tableDestroyed", {
        sender: this
      });
    }
  }
  function cleanUpTableEventListeners() {
    _.each(this.csuiDestroyRowCallbacks, function(callBack) {
      callBack();
    });
    this.csuiDestroyRowCallbacks = [];
  }
  function cleanPlaceholder() {
    $("> table , > #message", this.$el).remove();
  }
  function saveStateBeforeRebuild() {
    var collection = this.collection;
    var selectedRowsData = this.table.rows(".selected").data();
    var selectedNodesById = {};
    _.each(selectedRowsData, function(node) {
      node.get(SelectCellView.isSelectedModelAttributeName) && (selectedNodesById[node.id || node.get("id")] = true);
    });
    this.stateBeforeRebuild = {
      pageLength: collection ? collection.topCount : this.options.pageSize,
      selectedNodesById: selectedNodesById,
      currentScollPosition: this._getScrollContainer().scrollTop()
    };
  }
  function tryApplyingStateSavedBeforeRebuild(options) {
    if (this.stateBeforeRebuild) {
      _.extend(options, this.stateBeforeRebuild);
      delete this.stateBeforeRebuild;
    }
  }
  function fetchData(oTable, aoData, oSettings, fnCallback) {
    if (this.refreshEnabled === false) {
      return;
    }
    if (!(this.columns.length || this.columns.fetched)) {
      return;
    }
    var fetch = setOrder.call(this, aoData, oSettings);
    if (fetch) {
      this.fetchCollection();
      return;
    }
    var result = {
      sEcho: getDataParameter(aoData, "sEcho"),
      data: this.collection.models
    };
    this.trigger("settingServerData", {
      sender: this,
      result: result
    });
    fnCallback(result);
    if (this._isSingleSelectionEnabled()) {
      selectTableRows.call(this, this._allSelectedNodes);
    }
  }
  function clientSideUpdateData(oTable, aoData, oSettings, fnCallback) {
    if (!this.options.clientSideDataOperation) {
      return;
    }
    setOrder.call(this, aoData, oSettings);
    var result = {
      sEcho: getDataParameter(aoData, "sEcho"),
      data: this.collection.models
    };
    this.trigger("settingServerData", {
      sender: this,
      result: result
    });
    fnCallback(result);
  }
  function delegateClickAction(event, kind) {
    if (base.isControlClick(event)) {} else {
      event.preventDefault();
      var target = $(event.target);
      var tr = target.closest("tr");
      var position = tr[0]._DT_RowIndex;
      if (position !== undefined) {
        var node = this.table.row(position).data();
        this.trigger("click" + kind + "Action", {
          sender: this,
          target: target[0],
          node: node,
          event: event
        });
      }
    }
  }
  function setOrder(aoData, oSettings) {
    var columns = oSettings.aoColumns;
    var orderBy = [];
    _.each(oSettings.oInstance.api().table().order(), function(orderinfo) {
      var sortColumnIndex = orderinfo[0];
      var sortColumnKey = columns[sortColumnIndex].attributes.column_key;
      if (sortColumnKey) {
        if (orderinfo[1]) {
          orderBy.push(sortColumnKey + " " + orderinfo[1]);
        } else {
          orderBy.push(sortColumnKey);
        }
      }
    });
    var returnValue = false;
    if (orderBy.length) {
      returnValue = this.collection.setOrder(orderBy.join(), false);
    }
    if (this.enableViewState) {
      var makeItDefault = false;
      if (!this.getViewStateOrderBy()) {
        makeItDefault = true;
      }
      orderBy.length > 0 && this.setViewStateOrderBy(orderBy, {
        default: makeItDefault
      });
    }
    return returnValue;
  }
  function getDataParameter(aoData, name) {
    return aoData ? aoData[name] : undefined;
  }
  function destroyAllColumnMenuViews() {
    _.each(this.columnMenus, function(cm) {
      cm.destroy();
    });
    this.columnMenus.splice(0, this.columnMenus.length);
  }
  function ensureAllColumnResizeHandle(table) {
    this._el_headerCells.find(".csui-column-header-menu").remove();
    this._el_headerCells.find(".csui-vertical-sticky-divider").remove();
    this._el_headerCells.find(".csui-column-resize-handle").remove();
    delete this._el_verticalStickyDivider;
    destroyAllColumnMenuViews.call(this);
    if (this.tableColumnsWrappingOn) {
      return;
    }
    const self = this;
    self.displayedColumns.forEach(function(col, index) {
      var th = self._el_headerCells.filter('th[data-csui-attribute="' + col.attributes.column_key + '"]').get(0);
      if (!th) {
        return;
      }
      if (col.hasResizeHandle && !accessibleTable) {
        const colTitle2Use = col.resizeSpan ? self.displayedColumns[col.resizeNumber - 1].sTitle : col.title;
        const columnMenu = $('<div title="" class="csui-column-header-menu data-table-custom-area"></div>').appendTo($(th));
        if (base.isTouchBrowser()) {
          columnMenu.addClass("csui-visible");
        }
        const data = {
          orderIndex: col.resizeSpan ? col.resizeNumber - 1 : index,
          resizeIndex: col.resizeSpan ? col.resizeNumber - 1 : index,
          columnIndex: index
        };
        const status = {
          context: self.context,
          data: data,
          table: table,
          originatingView: self
        };
        const columnHeaderMenu = new ColumnHeaderMenuView({
          el: columnMenu,
          status: status,
          dropDownText: lang.ToolbarItemMore,
          dropDownAria: _.str.sformat(lang.ToolbarItemMoreAria, colTitle2Use),
          columnName: col.name,
          resizeName: self.displayedColumns[status.data.resizeIndex].name
        });
        columnHeaderMenu.commandController.off("after:execute:command").on("after:execute:command", () => {
          self.tableCaptionView && self.tableCaptionView._accColumnMenuFocused({
            columnName: col.name,
            columnIndex: index
          });
        });
        self.columnMenus.push(columnHeaderMenu);
        columnMenu.append(columnHeaderMenu.el);
        columnHeaderMenu.render();
      }
      if (col.lastPinned) {
        self._el_verticalStickyDivider = $('<div class="csui-vertical-sticky-divider data-table-custom-area"></div>')[0];
        self._el_verticalStickyDivider.style.height = `${self._el_table.clientHeight}px`;
        $(th).append(self._el_verticalStickyDivider);
      }
      if (col.hasResizeHandle) {
        const resizeHandle = $('<div class="csui-column-resize-handle data-table-custom-area"></div>');
        const titleAttr = _.str.sformat(lang.columnDragSeparatorTooltip, self.displayedColumns[col.resizeNumber - 1].title);
        resizeHandle.attr("title", titleAttr);
        var eventData = {
          columnIndex: index,
          resizeIndex: col.resizeNumber - 1,
          th: th,
          tableView: self
        };
        resizeHandle.off("pointerout." + self.cid).on("pointerout." + self.cid, eventData, resizeHandlePointerOutHandler);
        resizeHandle.off("pointerdown." + self.cid).on("pointerdown." + self.cid, eventData, resizeHandlePointerDownHandler);
        resizeHandle.off("pointermove." + self.cid).on("pointermove." + self.cid, eventData, resizeHandlePointerMoveHandler);
        resizeHandle.off("pointerup." + self.cid).on("pointerup." + self.cid, eventData, resizeHandlePointerUpHandler);
        resizeHandle.off("mouseenter." + self.cid).on("mouseenter." + self.cid, eventData, mouseEnterResizeHandle);
        resizeHandle.off("mouseleave." + self.cid).on("mouseleave." + self.cid, eventData, mouseLeaveResizeHandle);
        $(th).append(resizeHandle);
      }
    });
  }
  function setResizeIndicatorStartPositionAndHeight(event) {
    const tableView = event.data.tableView;
    const thEl = event.target.parentElement;
    const thRect = thEl.getBoundingClientRect();
    const borderProp = i18n.settings.rtl ? "borderLeftWidth" : "borderRightWidth";
    const borderWidth = +(window.getComputedStyle(thEl)[borderProp] || "").replace("px", "") || 0;
    const separatorX = i18n.settings.rtl ? thRect.left : thRect.right - borderWidth;
    event.data.pageX = separatorX - event.pageX - (tableView._el_columnResizeIndicator.offsetWidth - borderWidth) / 2;
    event.data.pageX = event.data.pageX - tableView._el_columnResizeIndicator.parentElement.getBoundingClientRect().x;
    tableView._el_columnResizeIndicator.style.left = `${event.pageX + event.data.pageX}px`;
    const tableHeight = this.closest("table").parentElement.clientHeight;
    tableView._el_columnResizeIndicator.style.height = `${tableHeight}px`;
  }
  function mouseEnterResizeHandle(event) {
    if (!event.data.tableView._isResizing) {
      if (!event.data.th.classList.contains("csui-column-highlight")) {
        setColumnHighlight(event.data.th, event.data.resizeIndex + 1);
      }
      event.data.tableView._el_columnResizeIndicator.classList.add("csui-state-hover");
      setResizeIndicatorStartPositionAndHeight.call(this, event);
    }
  }
  function mouseLeaveResizeHandle(event) {
    event.data.tableView._el_columnResizeIndicator.classList.remove("csui-state-hover");
  }
  function abortResizeDragOperation(event) {
    const tableView = event.data.tableView;
    tableView._isResizing = false;
    this.releasePointerCapture(event.pointerId);
    tableView._el_columnResizeIndicator.classList.remove("csui-state-active");
  }
  function resizeHandlePointerOutHandler(event) {
    const tableView = event.data.tableView;
    if (tableView._isResizing) {
      abortResizeDragOperation.call(this, event);
    }
  }
  function resizeHandlePointerDownHandler(event) {
    const tableView = event.data.tableView;
    if (tableView._isResizing) {
      abortResizeDragOperation.call(this, event);
      return;
    }
    if (event.button !== 0) {
      return;
    }
    tableView._isResizing = true;
    this.setPointerCapture(event.pointerId);
    setResizeIndicatorStartPositionAndHeight.call(this, event);
    if (event.data.resizeIndex === event.data.columnIndex) {
      event.data.baseWidth = event.target.parentElement.getBoundingClientRect().width;
    } else {
      const resizeHeader = tableView._el_headerCells[event.data.resizeIndex];
      event.data.baseWidth = resizeHeader.getBoundingClientRect().width;
    }
    event.data.baseX = event.pageX;
    const resizeColumn = tableView.displayedColumns[event.data.resizeIndex];
    if (resizeColumn.attributes.customization_pinned) {
      const pinnedWidths = getPinnedWidths.call(tableView);
      event.data.areaWidth = pinnedWidths.areaWidth;
      event.data.maxWidth = pinnedWidths.maxWidth;
    }
    tableView._el_columnResizeIndicator.classList.add("csui-state-active");
  }
  function resizeHandlePointerUpHandler(event) {
    const tableView = event.data.tableView;
    if (!tableView._isResizing) {
      return;
    }
    tableView._isResizing = false;
    tableView._el_columnResizeIndicator.classList.remove("csui-state-active");
    this.releasePointerCapture(event.pointerId);
    const resizeIndex = event.data.resizeIndex;
    const draggedOffset = event.pageX - event.data.baseX;
    const draggedWidth = i18n.settings.rtl ? event.data.baseWidth - draggedOffset : event.data.baseWidth + draggedOffset;
    const resizeColumn = tableView.displayedColumns[resizeIndex];
    const minWidth = resizeColumn.columnMinWidth;
    var newWidth = draggedWidth;
    if (draggedWidth < minWidth) {
      newWidth = minWidth;
    } else if (resizeColumn.attributes.customization_pinned) {
      if (event.data.areaWidth - event.data.baseWidth + draggedWidth > event.data.maxWidth) {
        if (event.data.maxWidth > event.data.areaWidth) {
          newWidth = event.data.baseWidth + event.data.maxWidth - event.data.areaWidth;
        } else {
          newWidth = event.data.baseWidth;
        }
      }
    }
    if (newWidth !== event.data.baseWidth) {
      log.debug("table dragged width: {0} area: {1}->{2} column: {3} {4}->{5}", event.data.maxWidth, event.data.areaWidth, event.data.areaWidth - (event.data.baseWidth - newWidth), resizeIndex, event.data.baseWidth, newWidth) && console.log(log.last);
      tableView._setColumnToWidth(resizeIndex, newWidth);
    }
    tableView.tableBodyView.findStickyColumns.call(tableView.tableBodyView);
  }
  function resizeHandlePointerMoveHandler(event) {
    const tableView = event.data.tableView;
    if (!tableView._isResizing) {
      return;
    }
    const draggedOffset = event.pageX - event.data.baseX;
    const draggedWidth = i18n.settings.rtl ? event.data.baseWidth - draggedOffset : event.data.baseWidth + draggedOffset;
    const resizeColumn = tableView.displayedColumns[event.data.resizeIndex];
    const minWidth = resizeColumn.columnMinWidth;
    var pageX = event.pageX;
    if (draggedWidth < minWidth) {
      const maxReduce = event.data.baseWidth - minWidth;
      pageX = i18n.settings.rtl ? event.data.baseX + maxReduce : event.data.baseX - maxReduce;
    } else if (resizeColumn.attributes.customization_pinned) {
      if (event.data.areaWidth - event.data.baseWidth + draggedWidth > event.data.maxWidth) {
        if (event.data.maxWidth > event.data.areaWidth) {
          const maxIncrease = event.data.maxWidth - event.data.areaWidth;
          pageX = i18n.settings.rtl ? event.data.baseX - maxIncrease : event.data.baseX + maxIncrease;
        } else {
          pageX = event.data.baseX;
        }
      }
    }
    tableView._el_columnResizeIndicator.style.left = `${pageX + event.data.pageX}px`;
  }
  function getColumnCells(table, columnIndex) {
    const columnCells = [];
    const nthChild = columnIndex + 1;
    table.querySelectorAll(":scope>thead>tr:not(.csui-details-row)").forEach(row => {
      const columnCell = row.querySelector(`:scope>th:nth-child(${nthChild})`);
      columnCells.push(columnCell);
    });
    const inlineFormInfo = this._inlineFormInfo;
    let inlineIndex = columnIndex;
    if (inlineFormInfo) {
      if (inlineFormInfo.tdIndex <= inlineFormInfo.lastPinnedIndex) {
        if (columnIndex > inlineFormInfo.tdIndex) {
          if (columnIndex <= inlineFormInfo.lastPinnedIndex) {
            inlineIndex = inlineFormInfo.tdIndex;
          } else {
            inlineIndex = columnIndex - inlineFormInfo.lastPinnedIndex + inlineFormInfo.tdIndex;
          }
        }
      }
    }
    table.querySelectorAll(":scope>tbody>tr:not(.csui-details-row)").forEach((row, trIndex) => {
      if (inlineFormInfo && trIndex === inlineFormInfo.trIndex) {
        const nthChild = inlineIndex + 1;
        const columnCell = row.querySelector(`:scope>td:nth-child(${nthChild})`);
        columnCells.push(columnCell);
      } else {
        const columnCell = row.querySelector(`:scope>td:nth-child(${nthChild})`);
        columnCells.push(columnCell);
      }
    });
    return columnCells;
  }
  function setColumnHighlight(th, resizeNumber) {
    const mergedCells = th.closest("table").querySelectorAll("th.csui-resize-" + resizeNumber + ", td.csui-resize-" + resizeNumber);
    mergedCells.forEach(function(cell) {
      cell.classList.add("csui-column-highlight");
    });
  }
  function clearColumnHighlight(th, resizeNumber) {
    const mergedCells = th.closest("table").querySelectorAll("th.csui-resize-" + resizeNumber + ", td.csui-resize-" + resizeNumber);
    mergedCells.forEach(function(cell) {
      cell.classList.remove("csui-column-highlight");
    });
  }
  function mouseEnterResizableHeader(event) {
    if (!event.data.th.classList.contains("csui-column-highlight")) {
      setColumnHighlight(event.data.th, event.data.resizeNumber);
    }
  }
  function mouseLeaveResizableHeader(event) {
    if (event.data.th.classList.contains("csui-column-highlight")) {
      clearColumnHighlight(event.data.th, event.data.resizeNumber);
    }
  }
  function setColumnsWidthAndOffset(startIndex = 0, overrideWidth = undefined) {
    for (var columnIndex = startIndex; columnIndex < this.displayedColumns.length; ++columnIndex) {
      const colDef = this.displayedColumns[columnIndex];
      if (colDef.attributes.customization_min_width) {
        colDef.columnMinWidth = colDef.attributes.customization_min_width;
      }
      if (colDef.isResizeColumn && !colDef.columnMinWidth) {
        colDef.columnMinWidth = TableView.columnCustomizationMinWidth;
      }
      let customWidth;
      if (columnIndex === startIndex && overrideWidth) {
        customWidth = overrideWidth.value;
      } else {
        customWidth = colDef.attributes.customization_width;
        if (customWidth == null && colDef.defaultCustomizationWidth != null) {
          customWidth = _.isFunction(colDef.defaultCustomizationWidth) ? colDef.defaultCustomizationWidth() : colDef.defaultCustomizationWidth;
        }
      }
      const convertedWidth = +customWidth;
      var columnWidth = undefined;
      var widthGiven = customWidth === 0 || !!convertedWidth;
      if (widthGiven) {
        columnWidth = convertedWidth || 0;
        if (colDef.isResizeColumn && columnWidth < colDef.columnMinWidth) {
          columnWidth = colDef.columnMinWidth;
        }
      } else if (colDef.attributes.customization_pinned && !colDef.lastPinned && (columnIndex !== startIndex || !overrideWidth)) {
        columnWidth = colDef.columnMinWidth || TableView.columnCustomizationMinWidth;
      }
      if (columnIndex === 0 && columnWidth != null) {
        if (!theming.isJATOTheme()) {
          columnWidth = columnWidth + 18;
        }
      }
      colDef.columnWidth = columnWidth;
      if (colDef.attributes.customization_pinned) {
        if (!columnIndex) {
          colDef.stickyOffset = 0;
        } else {
          const prevDef = this.displayedColumns[columnIndex - 1];
          if (prevDef.stickyOffset != null && prevDef.columnWidth != null) {
            colDef.stickyOffset = prevDef.stickyOffset + prevDef.columnWidth;
          } else {
            colDef.stickyOffset = undefined;
          }
        }
      }
    }
  }
  function getPinnedWidths() {
    const wrapperRect = this._el_wrapper.getBoundingClientRect();
    const maxWidth = Math.round(wrapperRect.width * this.options.pinnedAreaMaxFactor);
    const lastRect = this._el_lastPinnedHeader ? this._el_lastPinnedHeader.getBoundingClientRect() : undefined;
    var pinnedWidth;
    if (lastRect) {
      const otherWidth = i18n.settings.rtl ? wrapperRect.right - lastRect.right : lastRect.x - wrapperRect.x;
      pinnedWidth = lastRect.width + otherWidth;
    }
    return {
      areaWidth: pinnedWidth,
      maxWidth: maxWidth
    };
  }
  function getPinnedResizeIndex() {
    var resizeIndex;
    for (var ii = 0; ii < this.displayedColumns.length; ++ii) {
      var column = this.displayedColumns[ii];
      if (!column.attributes.customization_pinned) {
        break;
      }
      if (column.isResizeColumn && column.columnWidth > column.columnMinWidth) {
        resizeIndex = ii;
      }
      if (column.lastPinned) {
        break;
      }
    }
    return resizeIndex;
  }
  function headerRowOverlap(row) {
    var nameCell = this.getNameCell(row);
    const nameCellEl = nameCell && nameCell[0];
    const headerRowEl = this.el.querySelector("thead tr");
    if (nameCellEl && headerRowEl) {
      var nameTop = nameCellEl.getBoundingClientRect().top;
      var headerBottom = headerRowEl.getBoundingClientRect().bottom;
      return Math.ceil(nameTop) < Math.floor(headerBottom);
    }
  }
  _.extend(TableView.prototype, ViewEventsPropagationMixin);
  _.extend(TableView.prototype, NodeViewStateMixin);
  TableView.prototype._eventsToPropagateToViews.push("clicked:cell");
  return TableView;
});