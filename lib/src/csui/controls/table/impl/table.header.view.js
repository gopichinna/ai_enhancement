/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/utils/base", "i18n", "smart/themes/theming", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function($, _, Marionette, base, i18n, theming, TabablesBehavior, TabableRegionBehavior) {
  "use strict";
  const useOtcSearch = new URLSearchParams(window.location.search).get("useOtcSearch");
  const headerFocusablesSelector = [ ".csui-sorting-toggle", ".csui-table-otcsearch-box", ".csui-toolitem-menu-toggle", "th:not(:has(.csui-toolitem-menu-toggle)):not(:has(.csui-table-otcsearch-box)):not(:has(.csui-sorting-toggle)) .csui-focusable-table-column-header" ].join(", ");
  var TableHeaderView = Marionette.View.extend({
    constructor: function TableHeaderView(options) {
      TableHeaderView.__super__.constructor.apply(this, arguments);
      this._getActiveInlineForm = options._getActiveInlineForm;
      this.searchBoxes = options.searchBoxes;
      this.alternativeHeaderView = options.alternativeHeaderView;
      this.displayedColumns = options.displayedColumns;
      this.accFocusedColumn = options.accFocusedColumn || 0;
      this.accSearchFocused = options.accSearchFocused || false;
      this.accMenuFocused = options.accMenuFocused || false;
      this.tableView = options.tableView;
      if (this.alternativeHeaderView) {
        this.listenTo(this.alternativeHeaderView, "focusout", function(args) {
          var thElements = this.$(">tr>th:not(.csui-alternative-table-header)");
          var thNextToAlternativeHeaderIndex = -1;
          var i, thEl;
          if (args.direction === "left") {
            for (i = 0; i < thElements.length; i++) {
              thEl = $(thElements[i]);
              if (thEl.hasClass(TableHeaderView.ClassNameColumnForAlternativeHeader)) {
                thNextToAlternativeHeaderIndex = i - 1;
                break;
              }
            }
          } else {
            for (i = thElements.length - 1; i > 0; i--) {
              thEl = $(thElements[i]);
              if (thEl.hasClass(TableHeaderView.ClassNameColumnForAlternativeHeader)) {
                if (i + 1 < thElements.length) {
                  thNextToAlternativeHeaderIndex = i + 1;
                  break;
                }
              }
            }
          }
          if (thNextToAlternativeHeaderIndex >= 0) {
            this.accFocusedColumn = thNextToAlternativeHeaderIndex;
          }
          this._accSetFocusToCurrentlyFocusedElement();
        });
        this.listenTo(this.alternativeHeaderView, "changed:focus", this._accSetFocusToCurrentlyFocusedElement);
      }
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    events: {
      closing: "_onClosing",
      focusin: "_onFocusIn",
      keydown: "onKeyInView",
      click: "_onHeaderClicked"
    },
    clearTabIndexes: function() {
      const focusables = this.$el.find(TabablesBehavior.focusablesSelector + ", " + headerFocusablesSelector).filter(":not(.csui-table-otcsearch-input)");
      focusables.attr("tabindex", "-1");
      if (useOtcSearch != null) {
        const headerFocusables = this.$el.find(headerFocusablesSelector);
        this._setAdditionalTabIndexes(headerFocusables);
      }
    },
    _setAdditionalTabIndexes: function(focusables, target) {
      var previous, opened;
      focusables.each((index, element) => {
        if ($(element).is(":visible") && !$(element).is(":has(.csui-searchbox-shown)")) {
          if (opened) {
            $(opened).attr("tabindex", "0");
            if ($(opened).is(":has(:focus)")) {
              $(previous).attr("tabindex", "0");
              $(element).attr("tabindex", "0");
            }
            previous = opened;
            opened = null;
          }
          if (element.classList.contains("csui-table-otcsearch-box") && element.isOpen && (!target || element.contains(target))) {
            opened = element;
          } else {
            previous = element;
          }
        }
      });
      if (previous && opened) {
        $(opened).attr("tabindex", "0");
        if ($(opened).is(":has(:focus)")) {
          $(previous).attr("tabindex", "0");
        }
      }
    },
    _clearAdditionalTabIndexes: function(focusables, except) {
      focusables.each((index, element) => {
        if (!element.contains(except)) {
          $(element).attr("tabindex", "-1");
        }
      });
    },
    _onClosing: function(event) {
      const target = $(event.target).closest(".csui-table-otcsearch-box", this.el);
      if (target.length > 0) {
        target.one("close", event => {
          this.clearTabIndexes();
        });
      }
    },
    _onFocusIn: function(event) {
      this._setCurrentHeaderElement(event.target);
      this.trigger("changed:focus", this);
      if (useOtcSearch != null) {
        const headerFocusables = this.$el.find(headerFocusablesSelector);
        this._clearAdditionalTabIndexes(headerFocusables, event.target);
        this._setAdditionalTabIndexes(headerFocusables, null);
      }
    },
    _onHeaderClicked: function(event) {
      this._setCurrentHeaderElement(event.target, true);
    },
    _setCurrentHeaderElement: function(target, setFocus) {
      function findClassElement(target, classes, context) {
        var foundClass = classes.find(cl => target.classList.contains(cl));
        if (!foundClass) {
          const selector = "." + classes.join(", .");
          const closest = $(target).closest(selector, context);
          if (closest.length > 0) {
            foundClass = classes.find(cl => closest[0].classList.contains(cl));
          }
        }
        return foundClass;
      }
      const th = $(target).closest("th", this.el);
      if (th.length > 0) {
        const colName = th.attr("data-csui-attribute");
        const colIndex = this._findColumnIndexByName(colName);
        if (colIndex > -1) {
          var classes = [ "csui-table-column-search", "csui-table-column-otcsearch", "csui-column-header-menu", "csui-sorting-toggle", "csui-focusable-table-column-header", "csui-nowrap-table__cell-wrapper" ];
          const foundClass = findClassElement(target, classes, th);
          if (foundClass) {
            this.accFocusedColumn = colIndex;
            this.accSearchFocused = false;
            this.accMenuFocused = false;
            if (foundClass === "csui-table-column-search" || foundClass === "csui-table-column-otcsearch") {
              this.accSearchFocused = true;
            } else if (foundClass === "csui-column-header-menu") {
              this.accMenuFocused = true;
            }
            if (setFocus) {
              this._accSetFocusToCurrentlyFocusedElement();
            }
          }
        }
      }
    },
    findStickyColumns: function() {
      this._haveSticky = false;
      var lastStickyEl;
      var rows = this.$el.find("tr");
      if (rows.length > 0) {
        var row = rows[0];
        lastStickyEl = row.querySelector("th.csui-nowrap-table__column_last-sticky");
        if (lastStickyEl) {
          this._haveSticky = true;
        }
      }
    },
    render: function() {
      this.triggerMethod("before:render", this);
      var headerCells = this.$(">tr>th");
      var searchBoxCells = this.$(">tr>th>:is(.csui-table-column-search, .csui-table-column-otcsearch)");
      this._columnCount = headerCells.length;
      this._searchBoxCount = searchBoxCells.length;
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
      _limitAccFocusedColumnToDisplayed.call(this);
      var columnSelector = this._getColumnSelector(this.displayedColumns[this.accFocusedColumn]);
      var focusedElement = this.$(columnSelector);
      if (focusedElement.is(":visible")) {
        if (this.accSearchFocused) {
          var sbView = this._findActiveSearchBoxView();
          if (sbView) {
            focusedElement = sbView.currentlyFocusedElement();
          } else {
            focusedElement = $();
          }
        } else if (this.accMenuFocused) {
          const cmView = this._findActiveColumnMenuView();
          if (cmView) {
            focusedElement = cmView.$(".csui-toolitem-menu-toggle");
          } else {
            focusedElement = $();
          }
        } else {
          var elText = $(focusedElement[0]).find(".csui-focusable-table-column-header");
          if (elText.length > 0) {
            focusedElement = elText;
            var elSort = elText.find(".csui-sorting-toggle");
            if (elSort.length > 0) {
              focusedElement = elSort;
            }
          }
        }
      }
      return focusedElement;
    },
    _getColumnSelector: function(column) {
      var columnAttributeName = column.attributes.column_key;
      var columnSelector = 'tr>th[data-csui-attribute="' + columnAttributeName + '"]';
      return columnSelector;
    },
    _rightIsNextColumn: function() {
      if (this.accMenuFocused) {
        return true;
      }
      var column = this.displayedColumns[this.accFocusedColumn];
      var columnSelector = this._getColumnSelector(column);
      var columnmenuSelector = columnSelector + " .csui-column-header-menu";
      var columnMenu = this.$(columnmenuSelector);
      if (columnMenu.length) {
        return false;
      }
      var searchboxSelector = columnSelector + " :is(.csui-table-column-search, .csui-table-column-otcsearch)";
      var searchBox = this.$(searchboxSelector);
      return this.accSearchFocused || searchBox.length === 0;
    },
    onKeyInView: function(event) {
      var columnSelector, thEl;
      function moveFocusedElementLeft() {
        newFocusedColumn = this.accFocusedColumn - 1;
        while (newFocusedColumn >= 0) {
          columnSelector = this._getColumnSelector(this.displayedColumns[newFocusedColumn]);
          thEl = this.$(columnSelector);
          if (thEl.is(":visible") && thEl.find(".csui-focusable-table-column-header").length > 0) {
            this.accFocusedColumn = newFocusedColumn;
            this.accSearchFocused = this.accMenuFocused = false;
            columnMenu = thEl.find(".csui-column-header-menu");
            this.accMenuFocused = columnMenu.length > 0;
            if (this.accMenuFocused) {
              cmView = this._findActiveColumnMenuView();
              if (cmView) {
                cmView.$(".csui-toolitem-menu-toggle")[0].focus();
              }
              break;
            }
            searchBox = thEl.find(".csui-table-column-search, .csui-table-column-otcsearch");
            this.accSearchFocused = searchBox.length > 0;
            if (this.accSearchFocused) {
              sbView = this._findActiveSearchBoxView();
              if (sbView && sbView.getShown()) {
                sbView.setFocusToGlass();
              }
            }
            break;
          } else {
            newFocusedColumn--;
          }
        }
      }
      var n, searchBox, columnMenu, newFocusedColumn, sbView, cmView;
      if (this._getActiveInlineForm()) {
        return;
      }
      switch (event.keyCode) {
       case 9:
        columnMenu = this.$el.find('.csui-column-header-menu .csui-toolitem-menu-toggle:is([aria-expanded="true"], [menuopen])');
        columnMenu.trigger("click");
        break;

       case 32:
       case 13:
        if (!(event.ctrlKey || event.metaKey)) {
          if (!this.accSearchFocused && !this.accMenuFocused) {
            if (this.options.displayedColumns[this.accFocusedColumn].orderable) {
              event.preventDefault();
              event.stopPropagation();
              this.trigger("sorting:toggle", this.accFocusedColumn);
            }
          }
        }
        break;

       case 37:
        columnMenu = this.$el.find('.csui-column-header-menu .csui-toolitem-menu-toggle:is([aria-expanded="true"], [menuopen])');
        columnMenu.trigger("click");
        if (i18n && i18n.settings.rtl) {
          this._handleRightArrowKey(columnSelector, thEl, sbView, n);
        } else {
          this._handleLeftArrowKey(sbView, moveFocusedElementLeft);
        }
        event.preventDefault();
        event.stopPropagation();
        this.trigger("closeOtherControls");
        this._accSetFocusAfterTabableRegionActivated();
        break;

       case 39:
        columnMenu = this.$el.find('.csui-column-header-menu .csui-toolitem-menu-toggle:is([aria-expanded="true"], [menuopen])');
        columnMenu.trigger("click");
        if (i18n && i18n.settings.rtl) {
          this._handleLeftArrowKey(sbView, moveFocusedElementLeft);
        } else {
          this._handleRightArrowKey(columnSelector, thEl, sbView, n);
        }
        event.preventDefault();
        event.stopPropagation();
        this.trigger("closeOtherControls");
        this._accSetFocusAfterTabableRegionActivated();
        break;

       case 35:
        this.accFocusedColumn = this.displayedColumns.length - 1;
        n = this.accFocusedColumn + 1;
        this.accSearchFocused = this.accMenuFocused = false;
        columnMenu = this.$(">tr>th:nth-child(" + n + ") .csui-column-header-menu");
        this.accMenuFocused = columnMenu.length > 0;
        if (this.accMenuFocused) {
          cmView = this._findActiveColumnMenuView();
          if (cmView) {
            cmView.$(".csui-toolitem-menu-toggle")[0].focus();
          }
          event.preventDefault();
          event.stopPropagation();
          this.trigger("closeOtherControls");
          this._accSetFocusAfterTabableRegionActivated();
          break;
        }
        searchBox = this.$(">tr>th:nth-child(" + n + ") :is(.csui-table-column-search, .csui-table-column-otcsearch)");
        this.accSearchFocused = searchBox.length > 0;
        if (this.accSearchFocused) {
          sbView = this._findActiveSearchBoxView();
          if (sbView && sbView.getShown()) {
            sbView.setFocusToInput();
          }
        }
        event.preventDefault();
        event.stopPropagation();
        this.trigger("closeOtherControls");
        this._accSetFocusAfterTabableRegionActivated();
        break;

       case 36:
        this.accFocusedColumn = 0;
        this.accSearchFocused = false;
        this.accMenuFocused = false;
        event.preventDefault();
        event.stopPropagation();
        this.trigger("closeOtherControls");
        this._accSetFocusAfterTabableRegionActivated();
        break;

       case 121:
        if (event.shiftKey) {
          if (this.searchBoxes && this.searchBoxes.length > 0) {
            sbView = this.searchBoxes[0];
            sbView.showSearchInput();
            this.listenToOnce(sbView, "closed", this._accSetFocusAfterTabableRegionActivated);
          }
          event.stopPropagation();
          event.preventDefault();
        }
        break;
      }
    },
    _handleLeftArrowKey: function(sbView, moveFocusedElementLeft) {
      if (this.accMenuFocused) {
        this.accMenuFocused = false;
        sbView = this._findActiveSearchBoxView();
        if (sbView) {
          this.accSearchFocused = true;
          if (sbView.getShown()) {
            sbView.setFocusToInput();
          }
        } else {
          const columnSelector = this._getColumnSelector(this.displayedColumns[this.accFocusedColumn]);
          const thEl = this.$(columnSelector);
          if (!wantKeyStopOnTH.call(this, this.accFocusedColumn, thEl)) {
            moveFocusedElementLeft.call(this);
          }
        }
      } else if (this.accSearchFocused) {
        sbView = this._findActiveSearchBoxView();
        if (sbView && sbView.getShown()) {
          moveFocusedElementLeft.call(this);
        } else {
          this.accSearchFocused = false;
        }
      } else {
        moveFocusedElementLeft.call(this);
      }
    },
    _handleRightArrowKey: function(columnSelector, thEl, sbView, n) {
      if (this._rightIsNextColumn()) {
        n = this.accFocusedColumn + 1;
        var moved;
        while (n < this.displayedColumns.length) {
          columnSelector = this._getColumnSelector(this.displayedColumns[n]);
          thEl = this.$(columnSelector);
          if (this._isHeaderCellFocusable(thEl) && (this._findActiveSearchBoxView(n) || this._findActiveColumnMenuView(n) || wantKeyStopOnTH.call(this, n, thEl))) {
            moved = true;
            this.accFocusedColumn = n;
            this.accSearchFocused = false;
            this.accMenuFocused = false;
            break;
          } else {
            n = n + 1;
          }
        }
        sbView = this._findActiveSearchBoxView();
        if (sbView && sbView.getShown()) {
          this.accSearchFocused = true;
          sbView.setFocusToInput();
        } else {
          columnSelector = this._getColumnSelector(this.displayedColumns[this.accFocusedColumn]);
          thEl = this.$(columnSelector);
          if (!wantKeyStopOnTH.call(this, this.accFocusedColumn, thEl)) {
            const cmView = this._findActiveColumnMenuView();
            if (cmView) {
              this.accMenuFocused = true;
              cmView.$(".csui-toolitem-menu-toggle")[0].focus();
            }
          }
        }
      } else if (this.accSearchFocused || !this._findActiveSearchBoxView()) {
        this.accSearchFocused = false;
        this.accMenuFocused = true;
        const cmView = this._findActiveColumnMenuView();
        if (cmView) {
          cmView.$(".csui-toolitem-menu-toggle")[0].focus();
        }
      } else {
        this.accSearchFocused = true;
        sbView = this._findActiveSearchBoxView();
        if (sbView && sbView.getShown()) {
          sbView.setFocusToInput();
        }
      }
    },
    _scrollIfNeeded: function($el) {
      var el = $el[0];
      var th = el.closest("th");
      if (!th) {
        return;
      }
      const row = th.closest("tr");
      const lastStickyEl = row.querySelector("th.csui-nowrap-table__column_last-sticky");
      if (!lastStickyEl) {
        return;
      }
      var isStickyCell = th.classList.contains("csui-nowrap-table__column_sticky");
      if (!isStickyCell) {
        const rectPinned = lastStickyEl.getBoundingClientRect();
        const pinnedAreaBoundary = rectPinned.x + (i18n && i18n.settings.rtl ? 0 : rectPinned.width);
        var rectFocused = el.getBoundingClientRect();
        var startPosFocused;
        var needHorScroll;
        if (i18n && i18n.settings.rtl) {
          startPosFocused = rectFocused.x + rectFocused.width + 4;
          needHorScroll = startPosFocused > pinnedAreaBoundary;
        } else {
          startPosFocused = rectFocused.x - 4;
          needHorScroll = startPosFocused < pinnedAreaBoundary;
        }
        if (needHorScroll) {
          var outerTable = this.tableView.$el.find("table.binf-table").parent()[0];
          var scrollLeft = Math.round(outerTable.scrollLeft - (pinnedAreaBoundary - startPosFocused));
          setTimeout(function() {
            outerTable.scrollTo({
              left: scrollLeft,
              behavior: "smooth"
            });
          }, 0);
        }
      }
    },
    accActivateTabableRegion: function() {
      var el = this.currentlyFocusedElement();
      if (el.length > 0) {
        this._scrollIfNeeded(el);
      }
    },
    _accSetFocusToCurrentlyFocusedElement: function() {
      var el = this.currentlyFocusedElement();
      if (el.length > 0) {
        el = $(el[0]);
        this.trigger("changed:focus", this);
        if (this._isVisible(el)) {
          el.trigger("focus");
        }
      }
    },
    _isVisible: function(el) {
      return $(el).is(":visible");
    },
    _accSetFocusAfterTabableRegionActivated: function() {
      if (this._getActiveInlineForm()) {
        return;
      }
      var sbView = this._findActiveSearchBoxView();
      if (sbView && sbView.getShown()) {
        return;
      }
      this._accSetFocusToCurrentlyFocusedElement();
    },
    _accSearchBoxFocused: function(options) {
      this.accFocusedColumn = options.columnIndex;
      this.accSearchFocused = true;
      this.accMenuFocused = false;
      this._accSetFocusToCurrentlyFocusedElement();
    },
    _accColumnMenuFocused: function(options) {
      this.accFocusedColumn = options.columnIndex;
      this.accSearchFocused = false;
      this.accMenuFocused = true;
      this._accSetFocusToCurrentlyFocusedElement();
    },
    _findActiveSearchBoxView: function(n) {
      var searchBoxViews = this.searchBoxes;
      var displayedColumns = this.displayedColumns;
      var columnName = displayedColumns[n != null ? n : this.accFocusedColumn].name.toLowerCase();
      var sbView = _.find(searchBoxViews, function(searchBoxView) {
        return searchBoxView.options.columnName?.toLowerCase() === columnName;
      });
      return sbView;
    },
    _findActiveColumnMenuView: function(n) {
      const columnName = this.displayedColumns[n != null ? n : this.accFocusedColumn].name.toLowerCase();
      const cmView = this.tableView.columnMenus.find(cm => cm.options.columnName?.toLowerCase() === columnName);
      return cmView;
    },
    _findColumnIndexByName: function(name) {
      name = name.toLowerCase();
      for (var ii = 0; ii < this.displayedColumns.length; ii++) {
        if (this.displayedColumns[ii].name.toLowerCase() === name) {
          return ii;
        }
      }
      return -1;
    },
    _isHeaderCellFocusable: function(thEl) {
      return thEl.is(":visible") && thEl.find(".csui-focusable-table-column-header").length > 0;
    }
  }, {
    ClassNameColumnForAlternativeHeader: "csui-undefined"
  });
  function wantKeyStopOnTH(n, thEl) {
    return this.displayedColumns[n].orderable || !this.displayedColumns[n].resizeSpan && thEl.width();
  }
  function _limitAccFocusedColumnToDisplayed() {
    if (this.accFocusedColumn >= this.displayedColumns.length) {
      if (this.displayedColumns.length > 0) {
        this.accFocusedColumn = this.displayedColumns.length - 1;
      } else {
        this.accFocusedColumn = 0;
      }
    }
  }
  return TableHeaderView;
});