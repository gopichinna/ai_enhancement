/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette3", "smart/utils/smart.base", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/controls/simple.tile/header/impl/nls/lang", "hbs!smart/controls/simple.tile/header/impl/simple.tile.header", "css!smart/controls/simple.tile/header/impl/simple.tile.header", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Marionette, smartBase, theming, jatoIcons, lang, template) {
  const DEFAULT_OPTIONS = {
    enableBackButton: false,
    tileIcon: "",
    tileTitle: "",
    tileSubtitle: "",
    enableSearch: false,
    enableExpand: false
  };
  const isJato = () => theming.isJATOTheme();
  var SmartTileHeaderView = Marionette.View.extend({
    className: function() {
      return "smart-simple-tile-header";
    },
    template: template,
    templateContext: function() {
      const enableBackButton = this.options.enableBackButton;
      const tileTitle = this.options.tileTitle;
      const tileIcon = this.options.tileIcon;
      const tileSubtitle = this.options.tileSubtitle;
      const enableSearch = this.options.enableSearch;
      const enableExpand = this.options.enableExpand;
      const tileJatoIcon = this.__getJatoHeaderIcon();
      const enableTileIcon = !enableBackButton && (isJato() ? tileJatoIcon.length : tileIcon?.length);
      return {
        isJATO: isJato(),
        enableBackButton: enableBackButton,
        smartSimpleTileHeaderBackJatoIcon: jatoIcons.actionArrowLeft,
        enableTileIcon: enableTileIcon,
        headerId: this.options.headerId,
        tileIcon: tileIcon,
        tileJatoIcon: tileJatoIcon,
        tileTitle: tileTitle,
        enableSubtitle: tileSubtitle?.length,
        tileSubtitle: tileSubtitle,
        enableSearch: enableSearch,
        enableExpand: enableExpand,
        enableRightToolbar: enableSearch || enableExpand,
        expandAriaText: this.options?.expandAriaText ?? lang.expandAria,
        goBackTooltip: this.options?.goBackTooltip ?? lang.goBackTooltip,
        tileAria: this.options?.tileAria ?? lang.tileAria,
        searchAria: _.str.sformat(lang.searchAria, tileTitle),
        searchCloseAria: lang.collapseAria,
        searchTitle: this.options?.searchTitle ?? _.str.sformat(lang.searchAria, tileTitle),
        searchPlaceholder: this.options?.searchPlaceholder ?? lang.searchPlaceholder,
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
        simpleTileHeaderExpandSVGContent: jatoIcons.actionWindowExpand
      };
    },
    constructor: function SmartTileHeaderView(options = {}) {
      options = _.defaults({}, options, DEFAULT_OPTIONS);
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    ui: {
      headerGoBack: ".smart-simple-tile-header-back-button",
      openPerspectiveButton: ".cs-open-perspective-button",
      smartSearchBtn: ".smart-list-search",
      smartSearchInput: ".smart-list-search-input",
      headerTitleWrapper: ".smart-simple-tile-header-title-wrapper",
      tileTypeIcon: ".smart-tile-type-icon",
      headerRightToolbar: ".smart-simple-header-right-toolbar",
      headerBackButton: ".smart-simple-tile-icon-wrapper",
      smartTileHeader: ".simple-tile-header-elements"
    },
    triggers: {
      "click .smart-simple-tile-header": "click:tile:header"
    },
    events: {
      "click @ui.headerGoBack": "onClickBack",
      "keydown @ui.headerGoBack": "onKeyClickBack"
    },
    _bindClickHandleronExpand: function() {
      var expandButton = this.ui.openPerspectiveButton[0];
      if (expandButton) {
        expandButton.removeEventListener("click", this._boundPerformExpand);
        this._boundPerformExpand = this.performExpand.bind(this);
        expandButton.addEventListener("click", this._boundPerformExpand);
      }
    },
    onClickBack: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("click:back");
    },
    onKeyClickBack: function(event) {
      if (event.keyCode == 13) {
        this.onClickBack(event);
      }
    },
    performExpand: function(event) {
      if (event.type === "click" || event.keyCode === 13 || event.keyCode === 32) {
        event.preventDefault();
        event.stopPropagation();
        if (this._enableOpenPerspective) {
          this.triggerMethod("click:open:perspective", event);
        } else {
          this.triggerMethod("more:link:click", event);
        }
      }
    },
    onRender: function() {
      this._bindClickHandleronExpand();
      const smartSearchBtn = this.el.querySelector(".smart-list-search");
      const boundOpeningSearch = this.openingSearch.bind(this), boundOpenSearch = this.openSearch.bind(this), boundClosingSearch = this.closingSearch.bind(this), boundSearchInput = this.searchInput.bind(this);
      if (smartSearchBtn) {
        smartSearchBtn.removeEventListener("opening", boundOpeningSearch);
        smartSearchBtn.addEventListener("opening", boundOpeningSearch);
        smartSearchBtn.removeEventListener("open", boundOpenSearch);
        smartSearchBtn.addEventListener("open", boundOpenSearch);
        smartSearchBtn.removeEventListener("closing", boundClosingSearch);
        smartSearchBtn.addEventListener("closing", boundClosingSearch);
        smartSearchBtn.removeEventListener("input", boundSearchInput);
        smartSearchBtn.addEventListener("input", boundSearchInput);
      }
    },
    __getJatoHeaderIcon: function() {
      const tileJatoIcon = this.options?.tileJatoIcon ?? "";
      return isJato() && tileJatoIcon;
    },
    openingSearch: async function(e) {
      e.target.setAttribute("isopen", "");
      await e.target.updateComplete;
      this.ui.smartTileHeader.addClass("binf-hidden");
      this.ui.headerRightToolbar[0]?.classList.add("smart-list-search-open");
    },
    openSearch: function(e) {
      this.ui.smartSearchBtn[0]?.innerInputField?.focus();
      this.el?.querySelector(".smart-list-search-input")?.setAttribute("tabindex", "0");
      this.searchInput();
    },
    closingSearch: async function(e) {
      this.ui.smartSearchBtn[0]?.removeAttribute("isopen");
      await this.ui.smartSearchBtn[0].updateComplete;
      this.ui.headerRightToolbar[0]?.classList.remove("smart-list-search-open");
      setTimeout(_.bind(() => {
        this.el?.querySelector(".smart-list-search")?.focus();
        this.el?.querySelectorAll(".simple-tile-header-elements").forEach(el => {
          el.classList.remove("binf-hidden");
        });
      }, this), 300);
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
      this.options.filterValue = this.$el?.find(".smart-list-search-input")?.val();
      this.trigger("change:filterValue");
    }
  });
  return SmartTileHeaderView;
});