/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/log", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/lib/handlebars", "smart/controls/pagination/impl/keyevent.navigation", "i18n!smart/controls/pagination/impl/nls/localized.strings", "hbs!smart/controls/pagination/impl/nodespagination", "css!smart/controls/pagination/impl/nodespagination", "smart/lib/binf/js/binf", "smart/utils/otwc.loader", "smart/controls/icons.v2/icons.v2" ], function($, _, log, Backbone, Marionette, Handlebars, KeyEventNavigation, lang, template) {
  "use strict";
  var NodesPaginationView = Marionette.ItemView.extend({
    template: template,
    className: "csui-pager",
    ui: {
      totalCount: "> .csui-total-container-items",
      pageSizeMenu: "> .csui-pagesize-menu",
      dropDownMenu: "> .csui-pagesize-menu > .csui-dropdown > .smart-dropdown-toggle",
      dropDownList: "> .csui-pagesize-menu .csui-dropdown-list",
      navPagingMenu: "> .csui-pagination > .csui-paging-navbar",
      dropDownListItem: "> .csui-pagesize-menu ul.csui-dropdown-list a"
    },
    templateHelpers: function() {
      var totalCount = this._getTotalCount();
      var pageSize = this.pageSize && this.pageSize > 0 ? this.pageSize : 30;
      this.pageTotalAria = totalCount <= pageSize ? _.str.sformat(lang.SinglePageTotalsAria, totalCount) : _.str.sformat(lang.PageNTotalsAria, this.currentPageNum, Math.ceil(totalCount / pageSize), totalCount);
      this.nextPagesAria = lang.NextPagesAria;
      this.previousPagesAria = lang.PreviousPagesAria;
      this.firstPagesAria = lang.firstPagesAria;
      this.lastPagesAria = lang.lastPagesAria;
      return {
        showPageSizeMenu: this._showPageSizeMenu(),
        totalItems: this._getTotalDisplayCount(),
        totalItemsAria: _.str.sformat(lang.TotalItemsAria, this._getTotalCount()),
        itemsPerPage: _.str.sformat(lang.PageNavBarItemsPerPage, this.selectedPageSize),
        pageSizeMenuAria: _.str.sformat(lang.PageSizeMenuAria, this.selectedPageSize),
        checkForPageLinks: this._getTotalCount() > this.pageSize,
        items: this._addPageSizeOptions(totalCount)
      };
    },
    events: {
      "keydown @ui.dropDownListItem": "resetPageSizeKeyUp",
      "click .csui-pagesize-menu .smart-dropdown-menu otc-menuradio": "resetPageSize",
      "click .csui-paging-navbar > ul > li:not(.csui-overflow) > a": "onChangePage",
      "click .csui-pagination  li.csui-overflow.slide-control > a": "onSlidePageMenu",
      "click .csui-paging-navbar > ul > li.csui-overflow.page-control > a": "onPageControlClick",
      keydown: "onKeyInView"
    },
    constructor: function NodesPaginationView(options = {}) {
      options.pageSize ||= 30;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.addPaging = true;
      this.currentPageNum = 1;
      this.ddList = this.defaultDDList = options.defaultDDList || [ 30, 50, 100 ];
      this.skipCollectionRequest = false;
      this.skipPaginationUpdateRequest = !!options.skipPaginationUpdateRequest;
      this.pageSize = this.selectedPageSize = this.options.pageSize;
      this.rendered = false;
      this.pageTotalAriaLast = undefined;
      this.pageTotalTimeoutHandle = undefined;
      this.aboutPrefix = this.options.aboutPrefix ?? true;
      var skip = this.options?.pageNumber * this.options?.pageSize || 0;
      if (this.collection) {
        this.resetCollection(skip, this.options.pageSize, false);
        this.listenTo(this.collection, "reset", this.collectionChange);
        this.listenTo(this.collection, "add", this._maintainPageSize);
        this.listenTo(this.collection, "remove", this._maintainPageSize);
        this.listenTo(this.collection, "paging:change", this._collectionPageInfoChanged);
        this.listenTo(this, "reset:attributes", this.resetAttributes);
      }
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
    },
    onDestroy: function() {
      $(window).off("resize.app", this.onWinRefresh);
    },
    windowRefresh: function() {
      if (this._isRendered) {
        var initializePageTabMenu = this.totalCount > this.pageSize;
        initializePageTabMenu && this._initializePageTabMenu(false, true);
        this.resetActiveChild();
      }
    },
    collectionChange: function() {
      var slideBars = this.$el.find(".csui-paging-navbar ul");
      this.totalCount = 0;
      slideBars.empty();
      slideBars.remove();
      if (this.lastAction !== "setPageSize") {
        this._reCalculatePageSizes();
      }
      this.lastAction = "";
      this.render();
      if (this.collection.actualSkipCount === 0 && this.collection.skipCount !== 0) {
        this.resetCollection(0, this.pageSize, false);
      }
    },
    resetAttributes: function() {
      if (!$(this.ui.dropDownMenu).is(":visible")) {
        $(this.ui.dropDownList).removeAttr("role");
        this.ui.dropDownList && $(this.ui.dropDownList).empty();
        this.$el.parent().removeAttr("role aria-label");
        this.$el.removeAttr("role aria-label");
      }
      this.pageSize = this.selectedPageSize = this.options.pageSize;
      this.totalCount = 0;
      this.resetRenderFlags();
      if (this._isRendered) {
        this.setActiveChild(this.ui.dropDownMenu);
      }
    },
    resetRenderFlags: function() {
      this.addPaging = true;
    },
    onChangePage: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var targetPageTab = $(e.currentTarget), pageNum = parseInt(targetPageTab.attr("data-pageid"), 10);
      this.changePage(pageNum);
      this.setActiveChild(targetPageTab);
    },
    onPageControlClick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      const nextPgMenu = parseInt($(e.currentTarget).attr("data-slidepage"), 10), firstBtnClicked = $(e.currentTarget).hasClass("csui-overflow-first"), slideOptions = {};
      this.slidePageMenu(nextPgMenu, firstBtnClicked, slideOptions);
      const dataPageId = parseInt($(e.currentTarget).attr("data-pageid"), 10);
      if (slideOptions.animationOff) {
        this.goToPageHandler(dataPageId);
      } else {
        setTimeout(() => {
          this.goToPageHandler(dataPageId);
        }, 250);
      }
    },
    goToPageHandler: function(dataPageId) {
      const targetPageTab = this.$el.find(`.csui-paging-navbar > ul > li:not(.csui-overflow) > a[data-pageid="${dataPageId}"]`);
      this.changePage(dataPageId);
      this.setActiveChild(targetPageTab);
      this.activateChild(true, targetPageTab);
    },
    changePage: function(pageNum) {
      var pageSize = this.pageSize;
      this.currentPageNum = pageNum + 1;
      var skipCount = pageNum * pageSize;
      this.collection.pagination = this.addPaging;
      this.collection.trigger("new:page");
      this.resetCollection(skipCount, pageSize, true);
      this.templateHelpers();
    },
    resetCollection: function(skipItems, pageSize, autoFetch) {
      var resetObj = {
        skipItems: skipItems,
        pageSize: pageSize,
        autoFetch: autoFetch,
        paginationView: this
      };
      this.collection.trigger("collection:set:limit", resetObj);
    },
    resetPageSizeKeyUp: function(e) {
      if (e.keyCode === 32) {
        this.resetPageSize(e);
      }
      return true;
    },
    resetPageSize: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.collection.pagination = this.addPaging;
      var newPageSize = parseInt($(e.currentTarget).attr("data-pagesize"), 10);
      this.setPageSize(newPageSize, true);
      this.setActiveChild(this.ui.dropDownMenu);
    },
    setPageSize: function(size, autoFetch) {
      this.pageSize = this.selectedPageSize = size;
      if (this.skipCollectionRequest || !autoFetch) {
        this.skipCollectionRequest = false;
      } else {
        this.rendered = false;
        this.resetCollection(0, size, autoFetch);
      }
      this.lastAction = "setPageSize";
      this.currentPageNum = 1;
      this.trigger("pagesize:updated", this);
    },
    _setPageTotalAria: function() {
      if (this.pageTotalAria != this.pageTotalAriaLast) {
        this.$el.parent().children(".binf-sr-only").html(this.pageTotalAria);
        this.pageTotalAriaLast = this.pageTotalAria;
        this.pageTotalTimeoutHandle = undefined;
      }
    },
    onRender: function() {
      var collection = this.collection;
      var sronlyExists = this.$el.parent().children(".binf-sr-only");
      if (!(sronlyExists && sronlyExists.length)) {
        this.$el.before('<div class="binf-sr-only" aria-live="polite"></div>');
      }
      if (this._validCollection(collection)) {
        this.pageSize = this.pageSize > this.options.pageSize && this.pageSize > this.totalCount ? this.totalCount : this.pageSize;
        this.rendered = true;
        this.$el.removeClass("binf-hidden");
        this._initializeDDList();
        if (this.pageTotalTimeoutHandle) {
          clearTimeout(this.pageTotalTimeoutHandle);
        }
        this.pageTotalTimeoutHandle = setTimeout(this._setPageTotalAria.bind(this), 1200);
      } else {
        this.$el.addClass("binf-hidden");
        if (!this.pageTotalTimeoutHandle) {
          this.pageTotalTimeoutHandle = setTimeout(this._setPageTotalAria.bind(this), 2400);
        }
      }
      this.trigger("render:complete");
    },
    onDomRefresh: function() {
      if (this._validCollection(this.collection) && this.rendered) {
        this.totalCount = this._getTotalCount();
        var totalCount = this.totalCount;
        if (totalCount !== 0 && this._showPageSizeMenu()) {
          this._setPageSizeMenu();
          if (totalCount > this.pageSize) {
            this._initializePageTabMenu(true, true);
          }
        }
        this.resetActiveChild();
      }
    },
    onSlidePageMenu: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var nextPgMenu = parseInt($(e.currentTarget).attr("data-slidepage"), 10);
      var prevBtnClicked = $(e.currentTarget).hasClass("csui-overflow-left");
      this.slidePageMenu(nextPgMenu, prevBtnClicked);
    },
    slidePageMenu: function(nextPgMenu, prevBtnClicked, options = {
      animationOff: false
    }) {
      var el = this.$el;
      this._initializePageTabMenu(true, true, nextPgMenu);
      !options?.animationOff && el.find(".csui-pages-" + nextPgMenu).addClass("csui-slide");
      if (prevBtnClicked && prevBtnClicked === true) {
        el.find(" .csui-paging-navbar ").addClass("csui-prev-active");
      } else {
        el.find(" .csui-paging-navbar ").removeClass("csui-prev-active");
      }
    },
    getDDList: function(tt) {
      var ddItemLists = this.defaultDDList || [];
      return [ ...ddItemLists ];
    },
    _getOverflowIconWidth: function() {
      if (!this.overFlowIcon || this.overFlowIcon === 0) {
        var overFlowIcon = this.$el.find(".csui-paging-navbar > ul > li.csui-overflow");
        this.overFlowIcon = parseInt(overFlowIcon.css("min-width"), 10);
      }
      return this.overFlowIcon;
    },
    _getPageTabMinWidth: function() {
      if (!this.pageTabMinWidth || this.pageTabMinWidth === 0) {
        var pageTab = this.$el.find(".csui-paging-navbar > ul > li");
        this.pageTabMinWidth = parseInt(pageTab.css("min-width"), 10);
        pageTab = null;
      }
      this.pageTabMinWidth = 46;
      return this.pageTabMinWidth;
    },
    _initializeDDList: function() {
      this.ddList = this.getDDList(this.totalCount);
    },
    _validCollection: function(collection) {
      var retVal = false, totalCount = this.totalCount;
      if (!collection) {
        log.error("Pagination won't be rendered (collection is not set)") && console.error(log.last);
      } else {
        var collectionCount = this._getTotalCount(collection);
        this.totalCount = totalCount && totalCount < collectionCount ? totalCount : collectionCount;
        if (collectionCount && collectionCount > 0) {
          retVal = true;
        }
      }
      return retVal;
    },
    _getTotalDisplayCount: function() {
      var collection = this.collection, totalCount = this._getTotalCount(), displayCount = "";
      if (totalCount > 0 && !collection.totalCountComputed) {
        displayCount = totalCount === 1 ? lang.PageNavBarSingleItem : totalCount === collection.skipCount + collection.length ? lang.PageNavBarTotalItems : this.aboutPrefix === true ? lang.PageNavBarAboutItems : lang.PageNavBarTotalItems;
        displayCount = _.str.sformat(displayCount, totalCount);
      }
      return displayCount;
    },
    _showPageSizeMenu: function() {
      return this._getTotalCount() > this.ddList[0];
    },
    _setPageSizeMenu: function() {
      var totalCount = this._getTotalCount();
      if (totalCount !== 0) {
        if (this.ddList.length >= 1) {
          this._addPageSizeOptions(totalCount);
        }
      }
    },
    _addPageSizeOptions: function(totalCount) {
      var html = "", listArray = [], ddList = this.ddList, pageSize = this.pageSize;
      for (var i = ddList.length - 1; i >= 0; i--) {
        if (totalCount > ddList[i] || totalCount > ddList[i - 1]) {
          var ddListItem = ddList[i], txt = _.str.sformat(lang.PageNavBarItemsPerPage, ddListItem), ariaTxt = _.str.sformat(lang.PageSizeChoiceAria, ddListItem), className = ddListItem === this.selectedPageSize ? "csui-select" : "", ariaCurrent = ddListItem === pageSize ? ' aria-current="true" ' : "", checked = ddListItem === pageSize ? "checked" : "";
          listArray.push({
            txt: txt,
            ariaTxt: ariaTxt,
            className: className,
            ddList: ddList,
            ddListItem: ddListItem,
            ariaCurrent: ariaCurrent,
            checked: checked
          });
        }
      }
      return listArray;
    },
    _initializePageTabMenu: function(forceReset, activateMenu, activeMenu) {
      this.$el.parent().attr("role", "navigation").attr("aria-label", lang.PaginationContainerLandmarkAria);
      this.$el.attr("role", "navigation").attr("aria-label", lang.PaginationLandmarkAria);
      var minPageTabWidth = this._getPageTabMinWidth(), overflowIconWidth = this._getOverflowIconWidth();
      this._setPageTabMenu(minPageTabWidth, overflowIconWidth, forceReset, activateMenu, activeMenu);
    },
    _setPageTabMenu: function(minPageTabWidth, nextIconWidth, forceReset, activateMenu, activeMenu) {
      var numPages = this.numPages = Math.ceil(this._getTotalCount() / this.pageSize);
      var pageTabsPerMenu = this._getPageTabsPerSlideMenu(minPageTabWidth, nextIconWidth, numPages);
      this.numSlideMenus = Math.ceil(numPages / pageTabsPerMenu);
      if (forceReset || pageTabsPerMenu !== this.pageTabsPerMenu) {
        this.pageTabsPerMenu = pageTabsPerMenu;
        activateMenu && this.ui.navPagingMenu.html("");
        this._addSideMenu(this.numSlideMenus, pageTabsPerMenu, numPages, activateMenu, activeMenu);
      }
    },
    _getPageTabsPerSlideMenu: function(minPageTabWidth, nextIconWidth, numPages) {
      var navMenuWidth = this.ui.navPagingMenu.width(), pageTabs = Math.floor(navMenuWidth / minPageTabWidth);
      if (pageTabs < numPages) {
        pageTabs = Math.floor((navMenuWidth - 2 * nextIconWidth) / minPageTabWidth);
        pageTabs <= 0 && (pageTabs = 1);
      }
      return pageTabs > 5 ? 5 : pageTabs;
    },
    _addSideMenu: function(numSlideMenus, pageTabsPerMenu, numPages, activate, currSlideMenu) {
      var navPagingMenu = this.ui.navPagingMenu, skipCount = this.collection.skipCount, totalCount = this.totalCount, pageSize = this.pageSize, currPage = skipCount > totalCount ? numPages - 1 : skipCount / pageSize;
      currSlideMenu = currSlideMenu == null ? Math.floor(currPage / pageTabsPerMenu) : currSlideMenu;
      var startPageNum = currSlideMenu * pageTabsPerMenu;
      var html = "", slideBar = $(`<ul class="binf-nav expanded-pager pager-tabs csui-pages csui-pages-${currSlideMenu} ${numSlideMenus <= 1 ? "smart-no-overflow" : ""}"></ul>`);
      if (currSlideMenu > 0) {
        const tmp_caret_left = Handlebars.compile(`{{{icon-v2 iconName="csui_smart_ot_action_caret_left32" states="true" }}}`)();
        const tmp_caret_first = Handlebars.compile(`{{{icon-v2 iconName="csui_smart_ot_action_caret_first32" states="true" }}}`)();
        html += `<li class="csui-overflow page-control">
          <a class="csui-overflow-first smart-v2-icon-parent" 
            href="#" tabindex="-1" 
            data-slidePage="0" 
            aria-label="${this.firstPagesAria}" 
            title="${this.firstPagesAria}" 
            data-pageid="0">
            ${tmp_caret_first}
          </a>
        </li>`;
        html += `<li class="csui-overflow right-mergin slide-control">
          <a class="csui-overflow-left smart-v2-icon-parent" 
            href="#" tabindex="-1" 
            data-slidePage="${currSlideMenu - 1}" 
            aria-label="${this.previousPagesAria}" 
            title="${this.previousPagesAria}">
            ${tmp_caret_left}
          </a>
        </li>`;
      } else {
        html += `<li class="csui-overflow smart-empty-placeholder"></li>
          <li class="csui-overflow right-mergin smart-empty-placeholder"></li>`;
      }
      html += this._addPageTabs(startPageNum, currPage, pageTabsPerMenu, numPages);
      if (activate) {
        slideBar.addClass("csui-active");
      }
      if (currSlideMenu < numSlideMenus - 1) {
        const tmp_caret_right = Handlebars.compile(`{{{icon-v2 iconName="csui_smart_ot_action_caret_right32" states="true" }}}`)();
        const tmp_caret_last = Handlebars.compile(`{{{icon-v2 iconName="csui_smart_ot_action_caret_last32" states="true" }}}`)();
        html += `<li class="csui-overflow left-mergin slide-control">
        <a class="csui-overflow-right smart-v2-icon-parent" 
          href="#" tabindex="-1" 
          data-slidePage="${currSlideMenu + 1}" 
          aria-label="${this.nextPagesAria}" 
          title="${this.nextPagesAria}">
          ${tmp_caret_right}
        </a>
       </li>`;
        html += `<li class="csui-overflow page-control">
        <a class="csui-overflow-last smart-v2-icon-parent"
         href="#" tabindex="-1" 
         data-slidePage="${numSlideMenus - 1}" 
         aria-label="${this.lastPagesAria}" 
         title="${this.lastPagesAria}" 
         data-pageid="${numPages - 1}">
         ${tmp_caret_last}
        </a>
       </li>`;
      } else {
        html += `<li class="csui-overflow left-mergin smart-empty-placeholder"></li>
        <li class="csui-overflow smart-empty-placeholder"></li>`;
      }
      if (currSlideMenu === numSlideMenus - 1) {
        this.$el.find(".csui-pagination").find(".csui-paging-navbar").addClass("csui-last-slidePage");
      } else {
        this.$el.find(".csui-pagination").find(".csui-paging-navbar").removeClass("csui-last-slidePage");
      }
      slideBar.append(html);
      navPagingMenu.html(slideBar);
    },
    _addPageTabs: function(startPage, currPage, pageTabsPerMenu, numPages) {
      var retVal = false;
      var endPage = startPage + pageTabsPerMenu >= numPages ? numPages : startPage + pageTabsPerMenu;
      var html = "";
      for (let pageNum = startPage; pageNum < endPage; pageNum++) {
        const txt = pageNum + 1, showAria = _.str.sformat(lang.ShowPageNAria, txt, numPages);
        html += `<li>
          <a href="#" tabindex="-1" 
            ${pageNum === currPage ? 'class="csui-activePage" aria-current="page"' : 'class="csui-page" aria-current="page"'} 
            data-pageid="${pageNum}" 
            aria-label="${showAria}" 
            title="${showAria}">
            <span>${txt}</span>
          </a>
        </li>`;
      }
      return html;
    },
    _reCalculatePageSizes: function() {
      this._calculateSelectPageSize();
      this._reCalculatePageSize();
    },
    _calculateSelectPageSize: function() {
      var selectedPageSize = this.selectedPageSize, collectionTotal = this._getTotalCount(), sizeList = this.defaultDDList;
      this.selectedPageSize = _.indexOf(sizeList, selectedPageSize) > -1 ? selectedPageSize : selectedPageSize >= collectionTotal ? collectionTotal : _.find(sizeList, function(size) {
        return selectedPageSize < size;
      });
    },
    _reCalculatePageSize: function() {
      var defaultPageSize = this.options.pageSize, collectionCount = this._getTotalCount();
      this.pageSize = collectionCount === 0 ? defaultPageSize : this.selectedPageSize > collectionCount ? collectionCount : this.selectedPageSize;
    },
    _maintainPageSize: function(model, collection, trigger) {
      if (collection.isPoped) {
        delete collection.isPoped;
        return true;
      }
      if (model.get("csuiIsSelected")) {
        model.set("csuiIsSelected", false);
      }
      this._updateTotalCount(trigger);
      this.resetRenderFlags();
      this._initializeDDList(false);
      if (this.skipPaginationUpdateRequest && this.collection?.allModels?.length === this.collection?.skipCount) {
        this.collection.skipCount = this.collection.skipCount - this.collection.topCount;
      }
      this.skipCollectionRequest = true;
      this._reCalculatePageSizes();
      this.render();
      return true;
    },
    _getTotalCount: function(collection) {
      var totalCount = 0;
      if (!collection) {
        collection = this.collection;
      }
      if (collection) {
        totalCount = collection.filteredCount;
        if (totalCount == null) {
          totalCount = collection.totalCount;
        }
        if (totalCount == null) {
          totalCount = collection.length;
        }
      }
      return totalCount;
    },
    _updateTotalCount: function(trigger) {
      var difference = trigger.add ? 1 : -1;
      this.totalCount += difference;
      if (this.collection.filteredCount != null) {
        this.collection.filteredCount += difference;
      }
      if (this.collection.totalCount != null) {
        this.collection.totalCount += difference;
      }
    },
    _collectionPageInfoChanged: function() {
      this.pageSize = this.selectedPageSize = parseInt(this.collection.topCount);
    }
  });
  _.extend(NodesPaginationView.prototype, KeyEventNavigation);
  return NodesPaginationView;
});