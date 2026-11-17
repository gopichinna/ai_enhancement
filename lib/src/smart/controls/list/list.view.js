/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/emptylist/emptylist.view", "smart/themes/theming", "i18n", "hbs!smart/controls/list/impl/list", "i18n!smart/controls/list/impl/nls/lang", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/list/impl/list", "smart/bundles/otwc/icons_action" ], function(_, $, Marionette, smartBase, EmptyListView, theming, i18n, listTemplate, lang, jatoIcons) {
  const EMPTY_CLASSNAME = "smart-empty-list";
  var ListItemView = Marionette.ItemView.extend({
    constructor: function ListItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  const isJato = () => theming.isJATOTheme();
  var ListView = Marionette.CompositeView.extend({
    direction: !!i18n.settings.rtl ? "right" : "left",
    constructor: function ListView(options) {
      options || (options = {});
      _.defaults(options, {
        filterValue: ""
      });
      options.enableIcon = options?.enableIcon ?? true;
      Marionette.CompositeView.prototype.constructor.call(this, options);
      var th = this.templateHelpers(), currentListTitle = !!th && !!th.title ? th.title.toLowerCase() : !!options && !!options.data && !!options.data.title ? options.data.title : "", expandAria = options?.expandAria ? options.expandAria : lang.openPerspective, messages = {
        icon: options?.data?.titleBarIcon,
        isJato: isJato(),
        smartTileHeaderJatoIcon: this._getJatoHeaderIcon(),
        tileHeaderExapandSVGContent: jatoIcons.actionWindowExpand,
        title: currentListTitle,
        expandTitle: lang.expandView,
        expandAria: _.str.sformat(lang.expandAria, currentListTitle),
        searchTooltip: lang.searchView,
        searchCloseTooltip: lang.collapseSearch,
        searchAria: _.str.sformat(lang.searchAria, currentListTitle),
        searchCloseAria: lang.collapseAria,
        collapseSearchTooltip: lang.collapseSearch,
        openPerspectiveAria: expandAria,
        openPerspectiveTooltip: expandAria,
        enableOpenPerspective: this._enableOpenPerspective,
        enableExpand: options?.enableExpand ?? true,
        searchTitle: options?.searchTitle,
        searchPlaceholder: options?.searchPlaceholder,
        imageClass: options?.imageClass,
        imageUrl: options?.imageUrl,
        hideSearch: options?.hideSearch,
        listRole: options?.data?.listRole || "listbox"
      };
      this.hideSearch = this.options.hideSearch ?? th?.hideSearch;
      this.templateHelpers = _.defaults(th, messages, lang);
      this.listenToOnce(this.collection, "sync", function() {
        this.$el.removeClass("initialLoading");
      });
      this.listenToOnce(this.collection, "error", _.bind(this.handleError, this));
      this.listenToOnce(this.completeCollection, "error", _.bind(this.handleError, this));
      this.listenTo(this.collection, "reset", this._emptyTileSearchText);
      this.listenTo(this.completeCollection || this.collection, "sync", function() {
        const listCollection = this.completeCollection || this.collection, isFavWidgetView = !!listCollection.favorites, isListCollectionEmpty = isFavWidgetView ? !listCollection.favorites.length : !listCollection.length;
        if (isListCollectionEmpty) {
          this.ui?.tileContent?.removeAttr("role");
        } else {
          this.ui?.tileContent?.attr("role", this.templateHelpers?.listRole);
        }
        this._updateClassNames();
      });
      let coll = this?.completeCollection?.length ? this?.completeCollection : this?.collection;
      this.listenTo(coll, "change update", this._updateClassNames);
      this._setEmptyViewOptions();
    },
    _getJatoHeaderIcon: function() {
      const smartTileHeaderJatoIcon = this.options?.data?.smartTileHeaderJatoIcon;
      return isJato() && smartTileHeaderJatoIcon;
    },
    _updateClassNames: function() {
      let coll = this?.completeCollection?.length ? this?.completeCollection : this?.collection;
      if (coll.length === 0) {
        this.el.classList.add(EMPTY_CLASSNAME);
      } else {
        this.el.classList.remove(EMPTY_CLASSNAME);
      }
    },
    handleError: function() {
      this.errorExists = true;
      this.$el.addClass("csui-list-view-error");
    },
    templateHelpers: function() {
      return {
        isJato: isJato(),
        smartTileHeaderJatoIcon: this._getJatoHeaderIcon(),
        tileHeaderExapandSVGContent: jatoIcons.actionWindowExpand,
        listRole: this.options?.data?.listRole || "listbox",
        noHeader: this.options?.noHeader ?? false,
        enableSubtitle: this.options?.listHeaderSubtitle?.length,
        listHeaderSubtitle: this.options?.listHeaderSubtitle
      };
    },
    setValidator: function() {
      this.validator = setInterval(_.bind(this.validateInput, this), 10);
    },
    unsetValidator: function() {
      clearInterval(this.validator);
    },
    className: function() {
      var classNames = [ "cs-list smart-cs-list tile content-tile initialLoading" ];
      if (!!this.options?.className) {
        classNames.push(this.options?.className);
      }
      if (this.options?.noHeader) {
        classNames.push("smart-list-without-header");
      }
      return _.unique(classNames).join(" ");
    },
    template: listTemplate,
    childViewContainer: ".binf-list-group",
    childView: ListItemView,
    childViewOptions: function() {
      let enableIcon = this.options?.enableIcon ?? true;
      return {
        enableIcon: enableIcon,
        template: this.options.childViewTemplate
      };
    },
    emptyView: EmptyListView,
    ui: {
      headerTitle: ".tile-title",
      tileIcon: ".tile-icons",
      searchInput: ".smart-list-search-input",
      tileExpand: ".csui-tile-expand",
      tileHeader: ".tile-header",
      openPerspectiveButton: ".cs-open-perspective-button",
      openPerspectiveIcon: ".icon-perspective-open",
      tileControls: ".tile-controls",
      tileContent: ".tile-content .binf-list-group",
      tileContentWrapper: ".tile-content",
      smartSearchBtn: ".smart-list-search",
      smartSearchInput: ".smart-list-search-input",
      tileTypeIcon: ".tile-type-icon"
    },
    events: {
      keydown: "onKeyDown"
    },
    openingSearch: async function(e) {
      e.target.setAttribute("isopen", "");
      await e.target.updateComplete;
      this.ui.headerTitle.hide();
      this.ui.openPerspectiveButton.hide();
      this.ui.tileTypeIcon.hide();
      this.ui.tileIcon[0].classList.add("smart-list-search-open");
    },
    openSearch: function(e) {
      this.ui.smartSearchBtn[0].innerInputField?.focus();
      this.ui.smartSearchInput[0].setAttribute("tabindex", "0");
      this.searchInput();
    },
    closingSearch: async function(e) {
      this.ui.smartSearchBtn[0].innerInputField.setAttribute("value", "");
      this.ui.smartSearchBtn[0].removeAttribute("isopen");
      await this.ui.smartSearchBtn[0].updateComplete;
      setTimeout(_.bind(() => {
        this.ui.smartSearchBtn[0].focus();
        this.ui.tileIcon[0].classList.remove("smart-list-search-open");
        this.ui.headerTitle.show();
        this.ui.openPerspectiveButton.show();
        this.ui.tileTypeIcon.show();
      }, this), 300);
    },
    closeSearch: async function() {
      await this.ui.smartSearchBtn[0].updateComplete;
    },
    _bindEvents: function() {
      this.expandableElements = [ this.ui.openPerspectiveButton[0], this.ui.tileHeader[0] ];
      this.expandableElements.forEach(_.bind(function(ele) {
        this._bindClickHandleronExpand(ele);
      }, this));
      if (isJato()) {
        this.ui.tileContentWrapper.off("scroll wheel", {
          view: this
        }, this._handleTileScroll).on("scroll wheel", {
          view: this
        }, this._handleTileScroll);
      }
    },
    _bindClickHandleronExpand: function(ele) {
      var expandButton = ele;
      if (expandButton) {
        expandButton.removeEventListener("click", this._boundPerformExpand);
        this._boundPerformExpand = this.performExpand.bind(this);
        expandButton.addEventListener("click", this._boundPerformExpand);
      }
    },
    _handleTileScroll: function() {
      const tileContent = this.closest(".csui-normal-scrolling");
      if (!tileContent.classList.contains("smart-scroll-fade-top-bottom") && tileContent.scrollTop > 4) {
        tileContent.classList.add("smart-scroll-fade-top-bottom");
      } else if (tileContent.scrollTop < 4) {
        tileContent.classList.remove("smart-scroll-fade-top-bottom");
      }
    },
    performExpand: function(event) {
      if ((event.type === "click" || event.keyCode === 13 || event.keyCode === 32) && !(event.target.classList.contains("smart-list-search") || event.target.classList.contains("smart-list-search-input"))) {
        event.preventDefault();
        event.stopPropagation();
        if (this._enableOpenPerspective) {
          this.triggerMethod("click:open:perspective", event);
        } else {
          this.triggerMethod("more:link:click", event);
        }
      }
    },
    onKeyDown: function() {},
    onBeforeClickHeader: function() {
      if (this.errorExists) {
        return;
      }
      this.triggerMethod("click:header");
    },
    onRender: function() {
      this._bindEvents();
      this.ui.smartSearchBtn.on("opening", _.bind(this.openingSearch, this));
      this.ui.smartSearchBtn.on("open", _.bind(this.openSearch, this));
      this.ui.smartSearchBtn.on("closing", _.bind(this.closingSearch, this));
      this.ui.searchInput.on("input", _.bind(this.searchInput, this));
      this.srOnly = this.$el.find(".tile-content .binf-sr-only");
      this.tileHeader = this.$el.find(".tile-header");
      this.titleId = _.uniqueId("dlgTitle");
      this.$(this.ui.headerTitle).find(".csui-heading").attr("id", this.titleId);
      this.$(this.tileHeader).parent().attr("role", "region").attr("aria-labelledby", this.titleId);
      this.ui.tileContent.attr("aria-labelledby", this.titleId);
      this.$el.on("focusin", _.bind(this.focusinAria, this));
      this.$el.on("focusout", _.bind(this.focusoutAria, this));
      this.trigger("dom:refresh");
      smartBase.isAppleMobile() === false && this._addActivationEventHandlers();
      this._setEmptyViewOptions();
    },
    _setEmptyViewOptions: function() {
      let emptyViewOpts = typeof this.emptyViewOptions === "function" ? this.emptyViewOptions() : this.emptyViewOptions;
      this.emptyText = emptyViewOpts?.stateMessages?.empty ?? emptyViewOpts?.text ?? "";
    },
    _addActivationEventHandlers: function() {
      var el = this.$el;
      el.addClass("cs-no-expanding");
      el.on("mouseover", function() {
        el.addClass("cs-hover");
      }).on("mouseleave", function() {
        el.removeClass("cs-hover cs-mousedown");
      }).on("mousedown", function() {
        el.addClass("cs-mousedown");
      }).on("mouseup", function() {
        el.removeClass("cs-mousedown");
      }).on("focusin", function() {
        el.addClass("cs-has-focus");
      }).on("focusout", function() {
        el.removeClass("cs-has-focus");
      });
      this.ui.tileHeader.on("mouseover", function() {
        el.addClass("cs-tile-header-hover");
      }).on("mouseleave", function() {
        el.removeClass("cs-tile-header-hover");
      });
    },
    focusOutHandle: undefined,
    focusinAria: function() {
      if (this.focusOutHandle) {
        clearTimeout(this.focusOutHandle.handle);
        this.focusOutHandle = undefined;
      } else {
        this.srOnly.attr("aria-live", "polite");
        this.setElementsVisibleAria();
      }
    },
    focusoutAria: function() {
      var that = this;
      this.focusOutHandle = setTimeout(function() {
        that.srOnly.attr("aria-live", "off");
        that.srOnly.html("");
        that.focusOutHandle = undefined;
      }, 25);
    },
    isSearchOpen: function() {
      return this.ui?.smartSearchInput?.is && this.ui.smartSearchBtn[0]?.hasAttribute("isopen");
    },
    validateInput: function() {
      if (!this.ui.searchInput.val) {
        return;
      }
    },
    searchInput: function() {
      if (this.keyInputTimer) {
        clearTimeout(this.keyInputTimer);
      }
      this.keyInputTimer = setTimeout(_.bind(function() {
        this.keyInputTimer = undefined;
        this.filterChanged();
      }, this), 300);
    },
    filterChanged: function() {
      this.options.filterValue = this.ui?.smartSearchInput?.val();
      this.trigger("change:filterValue");
      this.setElementsVisibleAria();
    },
    _emptyTileSearchText: function() {
      let isSearchActive = this.collection?.length === 0 && this.isSearchOpen() && this.ui?.searchInput?.val()?.length > 0, emptyViewOpts = this.emptyViewOptions;
      if (typeof this.emptyViewOptions === "function") {
        emptyViewOpts = this.emptyViewOptions();
      }
      if (emptyViewOpts?.stateMessages?.empty?.length) {
        emptyViewOpts.stateMessages.empty = isSearchActive ? this.options?.emptyResultsSearchText || lang.emptyTileSearchText : this.emptyText;
      } else {
        emptyViewOpts = _.extend(emptyViewOpts ?? {}, {
          text: isSearchActive ? this.options?.emptyResultsSearchText || lang.emptyTileSearchText : this.emptyText
        });
      }
      this.emptyViewOptions = emptyViewOpts;
    },
    setElementsVisibleAria: function() {
      var numElements = this.collection ? this.collection.size() : "0";
      this.srOnly.text(_.str.sformat(lang.elementsVisibleAria, numElements, this.templateHelpers.title));
    },
    _resetFilter: function() {
      this.ui.searchInput.val("");
      this.filterChanged();
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var targetEle = this.options.customEle ? this.options.customEle : "div a:nth-child({0})", nthChildSel = _.str.sformat(targetEle, index + 1), $item = this.$(nthChildSel);
      if ($item.length === 0) {
        $item = this._lookForElementToTabTo(index, [ '[role="option"] > div:not(.binf-hidden)', '[role="option"]' ]);
      }
      if ($item) {
        return $($item[0]);
      }
    },
    _lookForElementToTabTo: function(index, selectors) {
      var $item, listElement = this.el;
      selectors && selectors.some(function(selector) {
        var elements = listElement.querySelectorAll(selector);
        if (elements && elements.length > index) {
          return $item = $(elements[index]);
        }
      });
      return $item;
    }
  });
  return ListView;
});