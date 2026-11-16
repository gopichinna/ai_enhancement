/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "dctmw/controls/list/sortable.list.view", "d2/widgets/table/type.attributes", "d2/widgets/table/columns.settings.item.view", "d2/widgets/table/columns.settings.add.view", "hbs!d2/widgets/table/impl/table.settings.columns", "i18n!d2/widgets/table/impl/nls/lang" ], function(_, $, Marionette, SortableListView, typeAttributes, ColumnsSettingsItemView, ColumnsSettingsAddView, template, lang) {
  "use strict";
  return Marionette.LayoutView.extend({
    template: template,
    templateHelpers: function() {
      return {
        noBack: this.options.noBack,
        labels: {
          title: lang.ColumnsSettingsTitle
        }
      };
    },
    regions: {
      columns_list: "> .columns-list"
    },
    ui: {
      add_button: "> .add-button",
      back_button: "> .header > .back-button"
    },
    events: {
      "keydown @ui.add_button": "onKeyDown",
      "keydown @ui.back_button": "onKeyDown",
      "click @ui.add_button": "addButtonClick",
      "click @ui.back_button": "backButtonClick"
    },
    childEvents: function() {
      return {
        "remove:child": this.onShow
      };
    },
    constructor: function TableSettingsColumnsView(options) {
      options = options || {};
      this.containerView = options.containerView;
      Marionette.LayoutView.call(this, options);
      this.typeAttrPromise = typeAttributes.fetch({
        connector: options.connector
      });
    },
    onBeforeShow: function() {
      var me = this, hasNonRemovableItem = me.options && me.options.fixedColumns && me.options.fixedColumns.length > 0, listView = new SortableListView({
        collection: me.collection,
        itemView: ColumnsSettingsItemView,
        hasNonRemovableItem: hasNonRemovableItem,
        isItemNonRemovable: function(column) {
          return _.contains(me.options.fixedColumns, column.get("name"));
        }
      });
      me.listenTo(listView, "add:child remove:child", function() {
        if (me.$el.is(":visible")) {
          me.containerView.resetHeightAndScroll();
        }
      });
      me.listenTo(listView, "lost:focus", function(isDirectionBackward) {
        if (isDirectionBackward === true || me.options.noBack) {
          me._focusAddButton();
        } else {
          me._focusBackButton();
        }
      });
      me.showChildView("columns_list", listView);
    },
    onShow: function() {
      this._focusAddButton();
    },
    addButtonClick: function() {
      var me = this;
      me.typeAttrPromise.done(function(typeAttrCollection) {
        me.containerView.showCard("add_columns", new ColumnsSettingsAddView({
          collection: typeAttrCollection,
          prefColumns: me.collection,
          containerView: me.containerView
        }));
      });
    },
    onKeyDown: function(event) {
      var isAddButton = $(event.target).hasClass("add-button");
      switch (event.which) {
       case 9:
        if (isAddButton) {
          this.ui.add_button.removeAttr("tabindex");
          if (event.shiftKey && !this.options.noBack) {
            this._focusBackButton();
          } else {
            this.columns_list.currentView.trigger("set:focus");
          }
        } else {
          this.ui.back_button.removeAttr("tabindex");
          if (event.shiftKey) {
            this.columns_list.currentView.trigger("set:focus");
          } else {
            this._focusAddButton();
          }
        }
        break;

       case 13:
       case 32:
        if (isAddButton) {
          this.addButtonClick();
        } else {
          this.backButtonClick();
        }
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    _focusAddButton: function() {
      this.ui.add_button.attr("tabindex", "0");
      this.ui.add_button[0].focus();
    },
    _focusBackButton: function() {
      this.ui.back_button.attr("tabindex", "0");
      this.ui.back_button.trigger("focus");
    },
    backButtonClick: function() {
      this.containerView.showCard("initial");
    }
  });
});