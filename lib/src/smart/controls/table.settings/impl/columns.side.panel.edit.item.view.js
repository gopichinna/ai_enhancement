/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "smart/controls/table.settings/impl/keyboard.navigation.mixin", "i18n!smart/controls/table.settings/impl/nls/lang", "hbs!smart/controls/table.settings/impl/columns.side.panel.edit.item", "css!smart/controls/table.settings/impl/columns.side.panel.edit" ], function(module, _, Backbone, Marionette, theming, jatoIcons, KeyboardNavigationMixin, lang, columnsEditItemTemplate) {
  const ColumnsEditItemView = Marionette.ItemView.extend({
    template: columnsEditItemTemplate,
    className: function() {
      let className = "smart-table-settings-column-edit-item-view";
      const fixed = this.model.get("fixed");
      if (fixed) {
        className += " smart-table-settings-column--is-fixed";
      } else {
        className += " smart-table-settings-column--is-removable";
      }
      return className;
    },
    tagName: "li",
    ui: {
      selection: ".smart-table-settings-column-selection",
      icon: ".smart-table-settings-column-selection .smart-table-settings-column-selection-icon"
    },
    events: {
      "focus @ui.selection": "onFocused",
      "click @ui.selection": "onClicked",
      keydown: "onKeyInView"
    },
    constructor: function ColumnsEditItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.setupKeyboardNavigationMixin({
        scope: this._focusableElementScope,
        isFocusableElement: () => {
          return true;
        },
        id: () => {
          const key = this.model.get("id");
          if (!key) {
            throw new Error(`knView ${this.constructor.name}: scope ${this._focusableElementScope}: key in model is undefined`);
          }
          return key;
        },
        getFocusableElement: () => {
          return this._focusableElement;
        },
        focus: () => {
          this._focusableElement.focus();
          this._focusableElement.scrollIntoView({
            block: "nearest"
          });
        },
        setTabStop: isTabStop => {
          this.model.set("tabstop", isTabStop);
        }
      });
      this.listenTo(this.model, "change:tabstop", this.render);
      this.listenTo(this.model, "change:selected", this.onSelectionChanged);
    },
    onRender: function() {
      this._focusableElement = this.el.querySelector(".smart-table-settings-column-selection");
      this.el.setAttribute("role", "none");
    },
    templateHelpers: function() {
      const name = this.model.get("name");
      return {
        isJato: theming.isJATOTheme(),
        actionCheckmarkSelect: jatoIcons.actionCheckmarkSelect,
        tabstop: this.model.get("tabstop"),
        selected: !!this.model.get("selected"),
        fixed: this.model.get("fixed"),
        name: name,
        ariaLabel: name
      };
    },
    onSelectionChanged: function() {
      const selected = !!this.model.get("selected");
      this.ui.selection.attr("aria-checked", selected);
      if (selected) {
        this.ui.selection.addClass("column--is-selected");
        this.ui.icon.removeClass("smart-table-settings-column-selection-icon--is-hidden");
      } else {
        this.ui.selection.removeClass("column--is-selected");
        this.ui.icon.addClass("smart-table-settings-column-selection-icon--is-hidden");
      }
    },
    onFocused: function() {
      this._focusableElement.scrollIntoView({
        block: "nearest"
      });
    },
    onClicked: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this._toggleSelection();
      if (this.knIsFocusableElement()) {
        this.knNavigateToThisView();
      }
    },
    onKeyInView: function(event) {
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      switch (event.key) {
       case " ":
        event.stopPropagation();
        event.preventDefault();
        this._toggleSelection();
        break;
      }
    },
    _toggleSelection: function() {
      if (this.model.get("fixed")) {
        return;
      }
      const newState = !this.model.get("selected");
      this.model.set("selected", newState);
    }
  });
  KeyboardNavigationMixin.mixin(ColumnsEditItemView.prototype);
  return ColumnsEditItemView;
});