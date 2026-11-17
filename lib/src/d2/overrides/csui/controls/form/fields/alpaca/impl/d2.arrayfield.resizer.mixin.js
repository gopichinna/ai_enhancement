/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/overrides/csui/controls/form/fields/alpaca/impl/grid.storage.utils", "i18n", "css!d2/overrides/csui/controls/form/fields/alpaca/impl/d2.arrayfield.css" ], function(_, $, GridStorageUtils, i18n) {
  const MIN_WIDTH = 100, MAX_WIDTH = 1500, DEFAULT_WIDTH_KEY = "D";
  const STRETCH_DEFAULT_COLS = "d2-stretch-default-cols", DEFAULT_SIZE_COL = "d2-default-size-col", CUSTOM_GRID_WIDTH = "d2-custom-width-grid", RESIZABLE_ARRAY_FIELD = "d2-resizable-array-field", CUSTOM_DRAG_HELPER = "d2-custom-drag-helper", CUSTOM_DRAG_INDIDCATOR = "d2-custom-drag-indicator", D2_CUSTOM_HELPER = "d2-custom-helper", D2_DRAG_FOLLOWER = "d2-drag-helper-follower";
  const SCROLL_SELECTOR = ".csui-scrollablecols", LOCKED_COL_SELECTOR = ".csui-lockedcols", SET_WRAPPER_SELECTOR = ".cs-form-set.cs-form-set-container", ALPACA_CONTAINER_ITEM = ".alpaca-container-item";
  const fnRowInverseSelector = rowIdx => `.cs-array.alpaca-container-item[data-alpaca-container-item-index]:not([data-alpaca-container-item-index="${rowIdx}"])`, fnColumnSelector = cIdx => `.cs-array-item-field-wrapper .alpaca-container-item[data-alpaca-container-item-index=${cIdx}]`, fnDefaultWidthPredicate = width => width === DEFAULT_WIDTH_KEY, fnGenerateBoundaryX = (event, {
    helperEl,
    maxWidth,
    minWidth,
    isWrappedMode,
    me
  }) => {
    let rtl = i18n.settings.rtl, targetEl$ = $(event.target).closest(ALPACA_CONTAINER_ITEM), targetWidth = targetEl$.width(), marginLeft = parseInt(helperEl.css("margin-left")), elStart = targetEl$.prop("offsetLeft"), maxStop = rtl ? elStart + targetWidth - maxWidth : elStart + maxWidth, minStop = rtl ? elStart + targetWidth - minWidth : elStart + minWidth;
    if (isWrappedMode) {
      maxStop -= parseInt(marginLeft);
      minStop -= parseInt(marginLeft);
    } else {
      maxStop += 4;
      if (rtl) {
        minStop -= marginLeft;
        let inContainer = me.containerItemEl.find(SET_WRAPPER_SELECTOR).prop("offsetLeft");
        maxStop += inContainer;
        minStop += inContainer;
      }
    }
    return {
      minStop: minStop,
      maxStop: maxStop
    };
  };
  return {
    mixin: function(prototype) {
      const origAddItem = prototype.addItem;
      _.extend(prototype, {
        initCustomization: function() {
          this.initCustomColumnWidth();
          this.initDragging();
          const cb = () => {
            this.restructureParentObjFieldContainer();
          };
          this.formView.listenTo(this.formView, "relayout:form", cb);
          this.formView.listenTo(this.formView, "destroy", () => {
            this.formView.stopListening(this.formView, "relayout:form", cb);
          });
        },
        addItem: function(itemIndex, itemSchema, itemOptions, itemData, callback) {
          const wrapperCallback = () => {
            this.initCustomColumnWidth(itemIndex, true);
            callback.call(this);
            setTimeout(() => this.initDragging());
          };
          origAddItem.call(this, itemIndex, itemSchema, itemOptions, itemData, wrapperCallback);
        },
        initCustomColumnWidth: function(rowIdx, skipRestructure = false) {
          if (!this.isCustomSizingAllowed()) {
            return;
          }
          let originatingView = this.connector.config.originatingView;
          if (originatingView) {
            originatingView.listenTo(originatingView, "d2:sync:layout", () => this.syncWidthFromStorage());
          }
          this.syncWidthFromStorage(rowIdx, skipRestructure);
        },
        initDragging: function() {
          if (!this.isCustomSizingAllowed()) {
            return;
          }
          this.cleanDraggerHelpers();
          const element = this.getDragHelperEl(CUSTOM_DRAG_HELPER).append($("<div>").addClass(CUSTOM_DRAG_INDIDCATOR));
          let handlers = [];
          this.children.forEach((row, rowIdx) => {
            row.children.forEach((cell, colIdx) => handlers.push(element.clone().data("idx", {
              y: rowIdx,
              x: colIdx
            }).appendTo(cell.containerItemEl)[0]));
          });
          this.dragHandlers = $(handlers);
          this.addMouseListeners();
          this.enableDragging();
        },
        getCellAtIdx: function(rowIdx, colIdx) {
          return this.children.at(rowIdx).children.at(colIdx);
        },
        enableDragging: function() {
          let me = this, isRtl = i18n.settings.rtl, draggerState = {};
          this.dragHandlers.draggable({
            axis: "x",
            helper: function(event) {
              let idx = $(event.currentTarget).data("idx"), helperEl = $("<div>").addClass(D2_CUSTOM_HELPER).addClass(D2_DRAG_FOLLOWER), hasRowLimit = me.isRowLimitEnabled(), isWrappedMode = me.isLockedMode(), isLastColumn = idx.x + 1 === me.getColumnCount(), target, maxWidth;
              if (idx.x > 0) {
                maxWidth = MAX_WIDTH;
              } else {
                let setContainer = me.children.at(0).containerItemEl.parent(), innerMarigin = parseInt(setContainer.css("margin-left")) + parseInt(setContainer.css("margin-right"));
                maxWidth = Math.floor((me.containerItemEl.width() - innerMarigin) * .9);
              }
              draggerState = {
                ...idx,
                isWrappedMode: isWrappedMode,
                maxWidth: maxWidth
              };
              if (isWrappedMode) {
                const targetContainer = idx.x > 0 ? SCROLL_SELECTOR : LOCKED_COL_SELECTOR;
                me.getFieldEl().find(targetContainer).append(helperEl);
                helperEl = $(event.target).closest(targetContainer).find(`.${D2_DRAG_FOLLOWER}`);
                draggerState.followerEls = me.getFieldEl().find(`${fnRowInverseSelector(idx.y)} .${D2_DRAG_FOLLOWER}`);
              } else {
                helperEl.addClass("d2-grid-no-wrap-mode");
                if (hasRowLimit) {
                  helperEl.addClass("d2-helper-limited");
                }
                target = me.getFieldEl().find(SET_WRAPPER_SELECTOR);
                target.append(helperEl);
              }
              if (isLastColumn) {
                helperEl.addClass("d2-last-column");
                draggerState.followerEls?.addClass("d2-last-column");
              }
              draggerState.boundsX = fnGenerateBoundaryX(event, {
                helperEl: helperEl,
                isWrappedMode: isWrappedMode,
                maxWidth: maxWidth,
                minWidth: MIN_WIDTH,
                me: me
              });
              return helperEl;
            },
            start: function(event) {
              me.field.addClass("d2-grid-resizing");
              me.trigger("resizing:start");
              const el = $(event.target).closest(ALPACA_CONTAINER_ITEM);
              draggerState.baseWidth = el.width();
              draggerState.offsetLeft = el.prop("offsetLeft");
            },
            drag: function(event, ui) {
              let {
                followerEls
              } = draggerState;
              if (isRtl) {
                ui.position.left = Math.max(ui.position.left, draggerState.boundsX.maxStop);
                ui.position.left = Math.min(ui.position.left, draggerState.boundsX.minStop);
              } else {
                ui.position.left = Math.max(ui.position.left, draggerState.boundsX.minStop);
                ui.position.left = Math.min(ui.position.left, draggerState.boundsX.maxStop);
              }
              followerEls?.css("left", ui.position.left);
            },
            stop: function(event, ui) {
              let dX = ui.position.left - ui.originalPosition.left, {
                x: colIdx,
                baseWidth
              } = draggerState;
              if (isRtl) {
                dX *= -1;
              }
              const newWidth = me._getBoundedWidth(baseWidth + dX);
              me.setColumnWidth(colIdx, newWidth);
              me.saveGridWidthForCol(colIdx, false, newWidth);
              let prevScrollLeft = event.target.closest(SCROLL_SELECTOR)?.scrollLeft;
              queueMicrotask(() => {
                me.restructureParentObjFieldContainer();
                if (event.target.closest(SCROLL_SELECTOR) && prevScrollLeft) {
                  event.target.closest(SCROLL_SELECTOR).scrollLeft = prevScrollLeft;
                }
              });
              draggerState = {};
              me.removeHelpers();
              me.field.removeClass("d2-grid-resizing");
              setTimeout(() => {
                me.triggerDomRefreshOnCol(colIdx);
                me.trigger("resizing:finished");
                me.initDragging();
              });
            }
          });
        },
        addMouseListeners: function() {
          this.dragHandlers?.on("mouseover", event => {
            let x = $(event.currentTarget).data("idx").x;
            this.dragHandlers?.filter((_idx, el) => $(el).data("idx").x === x).addClass("active");
          }).on("mouseleave", event => {
            let x = $(event.currentTarget).data("idx").x;
            this.dragHandlers?.filter((_idx, el) => $(el).data("idx").x === x).removeClass("active");
          }).on("dblclick", event => {
            this.resetToDefaultWidthForCol($(event.currentTarget).data("idx").x);
          });
        },
        restructureParentObjFieldContainer: function() {
          if (this.isCustomSizingAllowed()) {
            this.getParent().restructureSetContainer(this.containerItemEl.find(SET_WRAPPER_SELECTOR), this.getParent());
          }
        },
        saveGridWidthForCol: function(colIdx, reset, width) {
          let gridId = this.getGridId(), gridWidths = GridStorageUtils.getGridWidth(this.getStorageKey(), gridId);
          if (!gridWidths) {
            gridWidths = new Array(this.getColumnCount()).fill("D");
          }
          gridWidths[colIdx] = reset ? DEFAULT_WIDTH_KEY : width;
          GridStorageUtils.setGridWidth(this.getStorageKey(), gridId, gridWidths);
          this.refreshDefaultColClss();
        },
        syncWidthFromStorage: function(rowIdx, skipRestructure) {
          this.containerItemEl.addClass(RESIZABLE_ARRAY_FIELD);
          this.field.addClass(CUSTOM_GRID_WIDTH);
          let gridKey = this.getGridId(), gridSize = GridStorageUtils.getGridWidth(this.getStorageKey(), gridKey), children = rowIdx ? [ this.children[rowIdx] ] : this.children;
          children.forEach(row => {
            row.children.forEach((cell, idx) => {
              let size = gridSize?.at(idx), isDefaultWidth = fnDefaultWidthPredicate(size);
              size = isDefaultWidth ? null : size;
              if (!(size || this.options.sv_enable_auto_fit)) {
                size = cell.options.columnWidth;
              }
              if (size) {
                cell.containerItemEl.css("width", Math.min(size, MAX_WIDTH));
                cell.containerItemEl.removeClass(DEFAULT_SIZE_COL);
              } else {
                cell.containerItemEl.addClass(DEFAULT_SIZE_COL);
              }
            });
          });
          this.refreshDefaultColClss();
          !skipRestructure && this.restructureParentObjFieldContainer();
        },
        setColumnWidth: function(childIdx, width) {
          this.getFieldEl().find(fnColumnSelector(childIdx)).removeClass(DEFAULT_SIZE_COL).width(width);
        },
        _getBoundedWidth: function(width) {
          return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(width.toFixed(2))));
        },
        removeHelpers: function() {
          this.field.find(`.${D2_DRAG_FOLLOWER}`).remove();
        },
        getDragHelperEl: function(clazz) {
          let el = $("<div></div>").addClass(D2_CUSTOM_HELPER);
          return el.addClass(clazz ? ` ${clazz}` : "");
        },
        refreshDefaultColClss: function() {
          let gridWidths = GridStorageUtils.getGridWidth(this.getStorageKey(), this.getGridId()), hasDefaultCol = this.options.sv_enable_auto_fit && (!gridWidths || gridWidths.includes(DEFAULT_WIDTH_KEY));
          this.field[hasDefaultCol ? "addClass" : "removeClass"](STRETCH_DEFAULT_COLS);
        },
        cleanDraggerHelpers: function() {
          this.dragHandlers?.off("mouseover").off("mouseleave").off("dblclick");
          this.dragHandlers?.remove();
          this.field.find(`.${D2_CUSTOM_HELPER}`).remove();
          this.field.find(`.${D2_DRAG_FOLLOWER}`).remove();
        },
        triggerDomRefreshOnCol: function(colIdx) {
          this.children.forEach(row => row.children.at(colIdx).fieldView.trigger("refresh:size"));
        },
        resetToDefaultWidthForCol: function(colIdx) {
          if (this.options.sv_enable_auto_fit) {
            this.getFieldEl().find(fnColumnSelector(colIdx)).addClass(DEFAULT_SIZE_COL).css("width", "");
          } else {
            let width = Math.min(this.children.at(0).children.at(colIdx).options.columnWidth, MAX_WIDTH);
            this.getFieldEl().find(fnColumnSelector(colIdx)).width(width);
          }
          this.saveGridWidthForCol(colIdx, true);
          this.triggerDomRefreshOnCol();
          let prevScrollLeft = this.children.at(0).containerItemEl.find(SCROLL_SELECTOR).get(0)?.scrollLeft;
          this.restructureParentObjFieldContainer();
          if (this.children.at(0).containerItemEl.find(SCROLL_SELECTOR).length && prevScrollLeft) {
            this.children.at(0).containerItemEl.find(SCROLL_SELECTOR).scrollLeft(prevScrollLeft);
          }
        },
        getStorageKey: function() {
          return GridStorageUtils.getStorageKey(this.connector.config.originatingView, this.options.propertyPageId);
        },
        getGridId: function() {
          return GridStorageUtils.buildGridId(this.children.at(0).children.map(child => child.propertyId));
        },
        getColumnCount: function() {
          return this.children.at(0)?.children.length;
        },
        isCustomSizingAllowed: function() {
          return this.getFieldType() === "array";
        },
        isLockedMode: function() {
          return this.getFieldEl().hasClass("csui-set-locked-container");
        },
        isRowLimitEnabled: function() {
          return !_.isUndefined(this.options.rows_to_display) && this.data?.length > this.options.rows_to_display;
        }
      });
    }
  };
});