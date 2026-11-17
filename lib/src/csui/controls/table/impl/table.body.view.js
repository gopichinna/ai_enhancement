/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/marionette", "csui/utils/focusable", "i18n", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function($, Marionette, focusable, i18n, TabableRegionBehavior) {
  "use strict";
  var TableBodyView = Marionette.View.extend({
    constructor: function TableBodyView(options) {
      TableBodyView.__super__.constructor.apply(this, arguments);
      this._getActiveInlineForm = options._getActiveInlineForm;
      this.startInlineFormForEdit = options.startInlineFormForEdit;
      this.collection = options.collection;
      this.displayedColumns = options.displayedColumns;
      this.nameColumnIndex = TableBodyView.getNameColumnIndex(options.displayedColumns) || 0;
      this.accFocusedCell = options.accFocusedCell || {
        column: this.nameColumnIndex,
        row: 0
      };
      this.tableView = options.tableView;
    },
    events: {
      keydown: "onKeyInView"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    findStickyColumns: function() {
      this._haveSticky = false;
      let lastStickyEl;
      let rows = this.$el.find("tr");
      if (rows.length > 0) {
        const row = rows[0];
        lastStickyEl = row.querySelector("td.csui-nowrap-table__column_last-sticky");
        if (lastStickyEl) {
          this._haveSticky = true;
        }
      }
      if (this._haveSticky) {
        rows = this.tableView.el.querySelectorAll("thead > tr");
        if (rows.length > 0) {
          const row = rows[rows.length - 1];
          const headerRow = row.getBoundingClientRect();
          this._headerRowBottom = headerRow.top + headerRow.height;
        }
      }
    },
    render: function() {
      this.triggerMethod("before:render", this);
      var headerCells = this.$el.parent().find("thead>tr>th");
      this._columnCount = headerCells.length;
      this.triggerMethod("render", this);
    },
    remove: function() {
      this.stopListening();
      this.undelegateEvents();
      return this;
    },
    onDomRefresh: function() {
      this.findStickyColumns();
    },
    currentlyFocusedElement: function() {
      if (!this.tableView.table) {
        return $();
      }
      const activeInlineForm = this._getActiveInlineForm();
      if (activeInlineForm && activeInlineForm.currentlyFocusedElement) {
        return activeInlineForm.currentlyFocusedElement();
      }
      if (this.accFocusedCell) {
        var model = this.collection.at(this.accFocusedCell.row);
        var detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
        if (detailRowsInfo.accFocusedViewIndex !== undefined) {
          return $();
        } else {
          var tableRowEl = $(this.tableView.table.row(this.accFocusedCell.row).node());
          var tableCellEl = tableRowEl.children()[this.accFocusedCell.column];
          var focusables = focusable.findFocusables(tableCellEl);
          return focusables.length === 1 ? $(focusables[0]) : $(tableCellEl);
        }
      } else {
        return $();
      }
    },
    onClickedCell: function(args) {
      this.accFocusedCell.row = args.rowIndex;
      this.accFocusedCell.column = args.colIndex;
      this._accSetFocusAfterTabableRegionActivated();
    },
    onKeyInView: function(event) {
      var model, detailRowsInfo;
      var focusedElement = $();
      if (this._getActiveInlineForm()) {
        return;
      }
      if (event.keyCode === 37) {
        if (i18n && i18n.settings.rtl) {
          if (this.accFocusedCell.column < this.displayedColumns.length - 1) {
            this.accFocusedCell.column++;
          }
        } else {
          if (this.accFocusedCell.column > 0) {
            this.accFocusedCell.column--;
          }
        }
        event.preventDefault();
        event.stopPropagation();
        this.trigger("closeOtherControls");
        this._accSetFocusAfterTabableRegionActivated();
      } else {
        if (event.keyCode === 38) {
          event.preventDefault();
          event.stopPropagation();
          this.trigger("closeOtherControls");
          model = this.collection.at(this.accFocusedCell.row);
          detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
          if (detailRowsInfo.accFocusedViewIndex === undefined) {
            if (this.accFocusedCell.row > 0) {
              this.accFocusedCell.row--;
            } else {
              return;
            }
          } else {
            if (detailRowsInfo.accFocusedViewIndex > 0) {
              detailRowsInfo.accFocusedViewIndex--;
            } else {
              delete detailRowsInfo.accFocusedViewIndex;
            }
          }
          this._accSetFocusAfterTabableRegionActivated();
        } else {
          if (event.keyCode === 39) {
            if (i18n && i18n.settings.rtl) {
              if (this.accFocusedCell.column > 0) {
                this.accFocusedCell.column--;
              }
            } else {
              if (this.accFocusedCell.column < this.displayedColumns.length - 1) {
                this.accFocusedCell.column++;
              }
            }
            event.preventDefault();
            event.stopPropagation();
            this.trigger("closeOtherControls");
            this._accSetFocusAfterTabableRegionActivated();
          } else {
            if (event.keyCode === 40) {
              model = this.collection.at(this.accFocusedCell.row);
              detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
              var detailLastFocusedView = detailRowsInfo.accFocusedViewIndex;
              if (detailRowsInfo.accFocusedViewIndex === undefined && detailRowsInfo.views.length > 0) {
                detailRowsInfo.accFocusedViewIndex = -1;
              }
              while (focusedElement.length === 0) {
                if (detailRowsInfo.accFocusedViewIndex !== undefined && detailRowsInfo.accFocusedViewIndex + 1 < detailRowsInfo.views.length) {
                  detailRowsInfo.accFocusedViewIndex = detailRowsInfo.accFocusedViewIndex + 1;
                } else {
                  if (this.accFocusedCell.row + 1 < this.collection.length) {
                    delete detailRowsInfo.accFocusedViewIndex;
                    this.accFocusedCell.row++;
                    model = this.collection.at(this.accFocusedCell.row);
                    if (model) {
                      detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
                    }
                  } else {
                    detailRowsInfo.accFocusedViewIndex = detailLastFocusedView;
                    break;
                  }
                }
                focusedElement = this.currentlyFocusedElement();
              }
              event.preventDefault();
              event.stopPropagation();
              this.trigger("closeOtherControls");
              this._accSetFocusAfterTabableRegionActivated();
            } else {
              if (event.keyCode === 33) {
                this.accFocusedCell.row = 0;
                model = this.collection.at(this.accFocusedCell.row);
                detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
                delete detailRowsInfo.accFocusedViewIndex;
                event.preventDefault();
                event.stopPropagation();
                this.trigger("closeOtherControls");
                this._accSetFocusAfterTabableRegionActivated();
              } else {
                if (event.keyCode === 34) {
                  if (this.collection.length > 0) {
                    this.accFocusedCell.row = this.collection.length - 1;
                    model = this.collection.at(this.accFocusedCell.row);
                    detailRowsInfo = _accGetDetailRowInfo.call(this.tableView, model);
                    delete detailRowsInfo.accFocusedViewIndex;
                  } else {
                    this.accFocusedCell.row = 0;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  this.trigger("closeOtherControls");
                  this._accSetFocusAfterTabableRegionActivated();
                } else {
                  if (event.keyCode === 35) {
                    this.accFocusedCell.column = this.displayedColumns.length - 1;
                    event.preventDefault();
                    event.stopPropagation();
                    this.trigger("closeOtherControls");
                    this._accSetFocusAfterTabableRegionActivated();
                  } else {
                    if (event.keyCode === 36) {
                      this.accFocusedCell.column = 0;
                      event.preventDefault();
                      event.stopPropagation();
                      this.trigger("closeOtherControls");
                      this._accSetFocusAfterTabableRegionActivated();
                    } else {
                      if (event.keyCode === 113) {
                        model = this.collection.at(this.accFocusedCell.row);
                        if (model) {
                          this.startInlineFormForEdit(model);
                        }
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    _scrollIfNeeded: function(tdEl) {
      let td = tdEl[0];
      if (td.tagName !== "TD") {
        td = td.closest("td");
      }
      const row = td.closest("tr");
      const lastStickyEl = row.querySelector("td.csui-nowrap-table__column_last-sticky");
      if (!lastStickyEl) {
        return;
      }
      const isStickyCell = td.classList.contains("csui-nowrap-table__column_sticky");
      if (!isStickyCell) {
        const rectPinned = lastStickyEl.getBoundingClientRect();
        const pinnedAreaBoundary = rectPinned.x + (i18n && i18n.settings.rtl ? 0 : rectPinned.width);
        let scrollLeft, scrollTop;
        const rectFocused = td.getBoundingClientRect();
        var startPosFocused;
        var needHorScroll;
        if (i18n && i18n.settings.rtl) {
          startPosFocused = rectFocused.x + rectFocused.width;
          needHorScroll = startPosFocused > pinnedAreaBoundary;
        } else {
          startPosFocused = rectFocused.x;
          needHorScroll = startPosFocused < pinnedAreaBoundary;
        }
        const topPosFocused = rectFocused.y;
        const outerTable = this.tableView.$el.find("table.binf-table").parent()[0];
        if (needHorScroll) {
          scrollLeft = Math.round(outerTable.scrollLeft - (pinnedAreaBoundary - startPosFocused));
        }
        if (topPosFocused < this._headerRowBottom) {
          scrollTop = Math.round(outerTable.scrollTop - (this._headerRowBottom - topPosFocused));
        }
        const scrollOptions = {
          behavior: "smooth"
        };
        if (scrollLeft !== undefined) {
          scrollOptions.left = scrollLeft;
        }
        if (scrollTop !== undefined) {
          scrollOptions.top = scrollTop;
        }
        if (scrollLeft !== undefined || scrollTop !== undefined) {
          setTimeout(function() {
            outerTable.scrollTo(scrollOptions);
          }, 0);
        }
      } else {
        let scrollTop;
        const rectFocused = td.getBoundingClientRect();
        const topPosFocused = rectFocused.y;
        const outerTable = this.tableView.$el.find("table.binf-table").parent()[0];
        if (topPosFocused < this._headerRowBottom) {
          scrollTop = Math.round(outerTable.scrollTop - (this._headerRowBottom - topPosFocused));
        }
        const scrollOptions = {
          behavior: "smooth"
        };
        if (scrollTop !== undefined) {
          scrollOptions.top = scrollTop;
        }
        if (scrollTop !== undefined) {
          setTimeout(function() {
            outerTable.scrollTo(scrollOptions);
          }, 0);
        }
      }
    },
    accActivateTabableRegion: function() {
      var tdEl = this.currentlyFocusedElement();
      if (tdEl.length > 0) {
        this._scrollIfNeeded(tdEl);
      }
    },
    _accSetFocusAfterTabableRegionActivated: function() {
      if (this._getActiveInlineForm()) {
        return;
      }
      var tdEl = this.currentlyFocusedElement();
      if (tdEl.length > 0) {
        var el = $(tdEl);
        this.trigger("changed:focus", this);
        if (this._isVisible(el)) {
          el.trigger("focus");
        }
      }
    },
    _isVisible: function(el) {
      return $(el).is(":visible");
    }
  }, {
    getNameColumnIndex: function(displayedColumns) {
      if (!displayedColumns) {
        return undefined;
      }
      for (var colIdx = 0; colIdx < displayedColumns.length; colIdx++) {
        var column = displayedColumns[colIdx];
        if (column.isNaming) {
          return colIdx;
        }
      }
      return undefined;
    }
  });
  function _accGetDetailRowInfo(model) {
    var detailRowInfo;
    if (model) {
      detailRowInfo = this._detailRowViewsByModelId[model.id || model.get("id")];
    }
    if (!detailRowInfo) {
      return {
        views: []
      };
    } else {
      return detailRowInfo;
    }
  }
  return TableBodyView;
});