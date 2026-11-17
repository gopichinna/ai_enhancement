/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "nuc/lib/backbone", "i18n!csui/controls/thumbnail/impl/nls/lang", "hbs!csui/controls/thumbnail/impl/sort/impl/sort.menu", "csui/controls/mixins/view.state/node.view.state.mixin", "csui/themes/csui.jato.action.icons", "csui/controls/otc.menu/menu.items.view", "smart/themes/theming" ], function(_, Marionette, Backbone, lang, template, NodeViewStateMixin, JatoIcons, MenuItemsView, theming) {
  const constants = {
    SORT_ASC: "asc",
    SORT_DESC: "desc"
  };
  const SortingView = Marionette.LayoutView.extend({
    className: "cs-sort-links",
    template: template,
    templateHelpers: function() {
      return {
        id: _.uniqueId("sortButton"),
        isJatoTheme: theming.isJATOTheme(),
        jatoChevronSmallDown: JatoIcons.actionChevronSmallDown,
        selectedValue: this.selectedValue,
        jatoOrderIcon: this.sortDirection === constants.SORT_DESC ? JatoIcons.actionSortDescending : JatoIcons.actionSortAscending,
        sortByTooltip: _.str.sformat(lang.sortBy, this.selectedValue),
        sortByAria: _.str.sformat(lang.sortByAria, this.selectedValue),
        selectedArrowClass: this.selectedArrow,
        selectedArrowTooltip: this.sortDirection === constants.SORT_ASC ? lang.sortDescending : lang.sortAscending,
        selectedArrowAria: this.sortDirection === constants.SORT_DESC ? _.str.sformat(lang.sortDescendingAria, this.selectedValue) : _.str.sformat(lang.sortAscendingAria, this.selectedValue)
      };
    },
    ui: {
      sortOrderBtn: ".csui-thumbnail-sort-options .csui-sort-arrow"
    },
    regions: {
      selectedMenuRegion: "otc-menu"
    },
    events: {
      "click @ui.sortOrderBtn": "onSortOrderClick"
    },
    constructor: function SortingView(options) {
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.context = this.options.resultView.options.context;
      const viewStateModelOrderby = this.context.viewStateModel.getViewState("order_by");
      const state_order = this.collection.orderBy ? this.collection.orderBy.split(" ")[0] : viewStateModelOrderby?.substring(0, viewStateModelOrderby.lastIndexOf("_"));
      let setLableName = state_order?.toLowerCase() || lang.name.toLowerCase();
      this.linkCollection = new Backbone.Collection();
      this.createSortCollection(setLableName);
      this.actualValue = this.options.collection.sortname ?? lang.name;
      this.sortDirection = this.collection.orderBy?.split(" ")?.[1];
      this.options.collection.orderstate = this.sortDirection === constants.SORT_ASC ? "icon-sortArrowUp" : "icon-sortArrowDown";
      this.selectedArrow = this.selectedValue && (this.collection.orderBy ? this.options.collection.orderstate : "icon-sortArrowUp");
      this.selectedId = state_order ? state_order : "name";
      this.config = this.options.config || {};
    },
    createSortCollection: function(setLableName) {
      const allColumns = this.options.resultView.options?.allColumns || [];
      const allColumnsLen = allColumns.length;
      for (let i = 0; i < allColumnsLen; i++) {
        const item = allColumns[i];
        const {
          sort,
          name,
          key
        } = item.attributes || {};
        if (sort) {
          if (key === setLableName) this.selectedValue = name;
          this.linkCollection.add({
            displayName: name,
            key: key,
            checked: key === setLableName
          });
        }
      }
    },
    onSortOptionClick: function({
      itemValue
    }) {
      this.resetSelection(itemValue.get("key"), itemValue.get("name"));
    },
    resetSelection: function(id, name) {
      this.collection.setOrder(id + " " + constants.SORT_ASC, false);
      this.fetchCollection();
      this.setDefaultOrderBy();
      this.selectedValue = name;
      this.actualValue = name;
      this.options.collection.selectedId = id;
      this.options.collection.sortname = name;
      this.options.collection.state = id + " " + constants.SORT_ASC;
      this.options.collection.sort_state = this.options.collection.orderBy;
    },
    fetchCollection: function(options) {
      return this.fetchCollection(options);
    },
    onSortOrderClick: function(e) {
      e.preventDefault();
      if (this.sortDirection === constants.SORT_DESC) {
        this.resetSelection(this.selectedId, this.selectedValue);
      } else {
        const arrowState = this.getViewStateOrderBy() ? this.getViewStateOrderBy().split(" ")[0] : this.selectedValue.toLowerCase();
        this.collection.setOrder(arrowState + " " + constants.SORT_DESC, false);
        this.fetchCollection();
        this.setDefaultOrderBy();
        this.options.collection.sort_state = arrowState + " " + constants.SORT_DESC;
        this.options.collection.selectedId = arrowState;
      }
    },
    setDefaultOrderBy: function() {
      const enableViewState = this.context && this.context.viewStateModel.get("enabled");
      if (!enableViewState) return;
      let makeItDefault = false;
      if (!this.getViewStateOrderBy()) makeItDefault = true;
      if (this.collection.orderBy && this.setViewStateOrderBy([ this.collection.orderBy ], {
        default: makeItDefault
      })) return true;
    },
    onRender: function() {
      this.sortMenu = new MenuItemsView({
        collection: this.linkCollection,
        childElm: "otc-menuradio"
      });
      this.listenTo(this.sortMenu, "change:selection", this.onSortOptionClick);
      this.sortMenu.render();
      this.selectedMenuRegion.show(this.sortMenu);
    }
  });
  _.extend(SortingView.prototype, NodeViewStateMixin);
  return SortingView;
});