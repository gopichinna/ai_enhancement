/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "i18n!csui/widgets/search.results/controls/sorting/impl/nls/localized.strings", "hbs!csui/widgets/search.results/controls/sorting/impl/sort.menu", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/controls/otc.menu/menu.items.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function(_, Backbone, Marionette, lang, template, theming, JatoIcons, MenuItemsView, TabableRegionBehavior) {
  const constants = {
    SORT_ASC: "asc",
    SORT_DESC: "desc",
    DEFAULT_SORT: "relevance"
  };
  const SearchSortingView = Marionette.LayoutView.extend({
    className: "cs-sort-links",
    template: template,
    templateHelpers: function() {
      if (!this.collection.sorting || !this.collection.sorting.links) return;
      this._setSelection(this.collection.sorting.links[this.collection.sorting.sort[0]]);
      const isDescSortDir = this.selected.get("order") === constants.SORT_DESC;
      const titleVal = _.str.sformat(lang.sortByThis, this.formatColon(this.selected.get("titleAttr")));
      const titleArrow = _.str.sformat(isDescSortDir ? lang.ascending : lang.descending, this.selected.get("titleAttr"));
      this.isSortEnabled = this.collection.models.length && !!this.collection.sorting && this.options.enableSorting;
      return {
        selectedTitle: this.selected.get("title"),
        titleVal: titleVal,
        titleArrow: titleArrow,
        sortEnable: this.isSortEnabled,
        id: _.uniqueId("sortButton"),
        sortButtonAria: _.str.sformat(lang.sortOptionsButtonAria, this.selected.get("title")),
        listAria: lang.sortOptionsListAria,
        iconSVG: JatoIcons.actionChevronSmallDown,
        isJatoTheme: theming.isJATOTheme(),
        displaySortArrow: this.selected.get("id") !== constants.DEFAULT_SORT,
        orderIcon: isDescSortDir ? "icon-sortArrowDown" : "icon-sortArrowUp",
        jatoOrderIcon: isDescSortDir ? JatoIcons.actionSortDescending : JatoIcons.actionSortAscending
      };
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      dirLink: "a.search-sort-btn",
      sortOrderBtn: ".open-sort-menu"
    },
    regions: {
      selectedMenuRegion: ".csui-search-sort-options>otc-menu"
    },
    events: {
      "click @ui.dirLink": "_onSortOptionClick"
    },
    currentlyFocusedElement: function() {
      this.ui.sortOrderBtn.prop("tabindex", 0);
    },
    constructor: function SearchSortingView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.config = this.options.config || {};
      this.selected = new Backbone.Model();
      if (this.collection) {
        const orderBy = this.options.orderBy || this.collection.orderBy;
        this.collection.setOrder(orderBy, false);
        this.listenTo(this.collection, "reset", this.render);
      }
    },
    onRender: function() {
      if (!this.isSortEnabled) return;
      this.linkCollection = new Backbone.Collection();
      this._formatDropDownCollection(this.collection.sorting);
      this.sortMenuSelectGroupView = new MenuItemsView({
        collection: this.linkCollection,
        childElm: "otc-menuradio"
      });
      this.listenTo(this.sortMenuSelectGroupView, "change:selection", this._sortSearchResults);
      this.sortMenuSelectGroupView.render();
      this.selectedMenuRegion.show(this.sortMenuSelectGroupView);
      this._setSelection(this.collection.sorting.links[this.collection.sorting.sort[0]]);
    },
    _onSortOptionClick: function(event) {
      event.preventDefault();
      const selectedItem = this.selected.get("id") ?? constants.DEFAULT_SORT;
      const newDir = this.selected.get("order") === constants.SORT_DESC ? constants.SORT_ASC : constants.SORT_DESC;
      this.resetCollection(selectedItem + " " + newDir, true);
    },
    _sortSearchResults: function({
      itemValue
    }) {
      this.selected = itemValue;
      let orderBy = this.selected.get("key") + " " + "desc";
      const isDefaultDisplay = this.selected.get("key") === constants.DEFAULT_SORT;
      if (isDefaultDisplay) {
        orderBy = constants.DEFAULT_SORT;
      }
      this.resetCollection(orderBy, true);
    },
    _setSelection: function(model) {
      const sortObj = {};
      if (this.collection.sorting.sort) {
        sortObj.order = this.collection.sorting.sort[0].indexOf(constants.SORT_DESC) === 0 ? constants.SORT_DESC : constants.SORT_ASC;
        sortObj.id = this.collection.sorting.sort[0].replace(/asc_/g, "").replace(/desc_/g, "");
      } else {
        sortObj.id = "";
        sortObj.order = constants.SORT_DESC;
      }
      sortObj.titleAttr = _.str.trim(model && model.display_name ? model.display_name : model && model.name ? this.trimSortOptionName(model.name) : "empty");
      sortObj.title = this.truncateCategoryName(sortObj.titleAttr);
      this.selected.set(sortObj);
    },
    resetCollection: function(filter, autoFetch) {
      this.collection.setOrder(filter, autoFetch);
    },
    _formatDropDownCollection: function({
      links = {}
    }) {
      const sortListKeys = Object.keys(links);
      if (sortListKeys.length === 0) return;
      this._addDefaultCollection();
      for (let i = 0; i < sortListKeys.length; i++) {
        const sortKey = sortListKeys[i];
        const item = links[sortKey];
        const titleAttr = item.display_name ? item.display_name : this.trimSortOptionName(item.name);
        const sortName = this.truncateCategoryName(this.formatColon(titleAttr));
        item.displayName = sortName;
        item.id = sortKey;
        const actualKey = sortKey?.replace(/asc_/g, "").replace(/desc_/g, "");
        item.key = actualKey;
        item.direction = sortKey.search("asc_") === 0 ? constants.SORT_ASC : constants.SORT_DESC;
        if (item.direction !== constants.SORT_ASC && item.displayName && sortKey !== constants.DEFAULT_SORT) {
          item.checked = this.selected.get("id") === actualKey;
          this.linkCollection.add(item);
        }
      }
    },
    _addDefaultCollection: function() {
      const links = this.collection.sorting.links;
      if (!links?.[constants.DEFAULT_SORT]) return;
      const defaultSort = links[constants.DEFAULT_SORT];
      defaultSort.display_name = defaultSort.name;
      defaultSort.displayName = defaultSort.name;
      defaultSort.checked = this.selected.get("id") === constants.DEFAULT_SORT;
      defaultSort.key = constants.DEFAULT_SORT;
      this.linkCollection.add(defaultSort);
    },
    trimSortOptionName: function(name) {
      return name.replace(/\(*\s([;\s\w\W\"\=\,\:\.\/\~\{\}\?\!\-\%\&\#\$\^\(\)]*?)\)/g, "");
    },
    truncateCategoryName: function(name) {
      return name.replace(/^[^:]*:\s*/, "");
    },
    formatColon: function(name) {
      return name.replace(/:([^\s])/, ": $1");
    }
  });
  return SearchSortingView;
});