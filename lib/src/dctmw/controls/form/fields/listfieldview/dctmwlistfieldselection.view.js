/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "dctmw/utils/utils", "i18n!dctmw/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldselectionitem.view", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfieldselection.view", "dctmw/lib/touchpunch" ], function(_, $, Backbone, Marionette, base, PerfectScrollingBehavior, utils, Lang, CsuiLang, SelectionItemView, SelectionViewTemplate) {
  "use strict";
  return Marionette.CompositeView.extend({
    childView: SelectionItemView,
    childViewContainer: ".dctmw-listfield-selectedvalues",
    className: "dctmw-listfield-selection-wrapper",
    template: SelectionViewTemplate,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: "> .dctmw-listfield-selectedvalues",
        suppressScrollX: true
      }
    },
    ui: {
      selectedValues: "> .dctmw-listfield-selectedvalues",
      showMore: '.dctmw-list-toolbar [ data-dctmw-list-toolbar-action="showMore"]',
      showLess: '.dctmw-list-toolbar [ data-dctmw-list-toolbar-action="showLess"]'
    },
    events: {
      "click @ui.showMore": "showAllItems",
      "click @ui.showLess": "showOnlyLimitedItems"
    },
    templateHelpers: function() {
      return {
        isSortable: !this.collection.isSortedResult,
        showMoreLabel: Lang.showMore,
        showLessLabel: Lang.showLess,
        showHorizontal: this.options.showHorizontal,
        noData: this.collection.length === 0,
        readOnly: this.options.mode === "readonly",
        emptyLabel: this.options.mode === "writeonly" ? Lang.selectFieldEmptyFieldLabel : CsuiLang.noValueSet,
        noneLabel: Lang.selectFieldDefaultLabel,
        noValue: Lang.noValue
      };
    },
    childViewOptions: function() {
      return {
        mode: this.options.mode,
        showHorizontal: this.options.showHorizontal,
        parentView: this,
        showOptionsInHierarchy: this.options.showOptionsInHierarchy
      };
    },
    _prepareOptions: function(options) {
      return {
        collection: options.selected,
        optionsCollection: options.collection,
        mode: options.mode,
        parentView: options.parentView,
        rows: options.rows || 8,
        showHorizontal: options.showHorizontal,
        label: options.model.get("options") && options.model.get("options").label ? options.model.get("options").label : "",
        showOptionsInHierarchy: options.showOptionsInHierarchy
      };
    },
    constructor: function(options) {
      let newOptions = this._prepareOptions(options);
      Marionette.CompositeView.prototype.constructor.call(this, newOptions);
      if (options.mode === "readonly") {
        this._behaviors[0].destroy();
      } else {
        this.listenToOnce(this.options.parentView, "after:visible", this.setDefaultValuesOnWrite);
      }
      this.listenTo(this.options.parentView, "after:visible", function() {
        this.updateHeight(this.honorShowMore());
        this.updateCountLabel();
      });
      if (this.options.parentView.formView) {
        this.listenTo(this.options.parentView.formView, "form:view:updated", function() {
          this.updateHeight(this.honorShowMore());
          this.updateCountLabel();
        });
      }
    },
    onRender: function() {
      this.ui.showMore.hide();
      this.ui.showLess.hide();
      if (this.collection.length === 0 && this.options.mode !== "readonly") {
        this.hide();
      }
      if (this.collection.length && this.honorShowMore()) {
        this.showOnlyLimitedItems();
      } else {
        this.sortSelectedOptions();
      }
      this.enableDisableField(!this.collection.disabled);
      this.trigger("selection:view:rendered");
    },
    setDefaultValuesOnWrite: function() {
      if (this.options.parentView && this.options.parentView.alpacaField.options.ds && this.options.parentView.alpacaField.options.ds) {
        if (this.collection.length === 1 && this.collection.first().get("id") === "") {
          this.collection.reset();
        }
      }
    },
    showOnlyLimitedItems: function(event) {
      event?.stopPropagation();
      event?.preventDefault();
      this.ui.showLess.hide();
      this.updateHeight(true);
      this.ui.showMore.show();
    },
    showAllItems: function(event) {
      event?.stopPropagation();
      event?.preventDefault();
      this.ui.showMore.hide();
      this.updateHeight(false);
      this.ui.showLess.show();
    },
    isVisible: function() {
      return this.$el.is(":visible");
    },
    show: function(fixheight) {
      this.searchText = "";
      this.searchRegex = null;
      this.render();
      this.$el.removeClass("binf-hide");
      this.$el.addClass("binf-show");
      if (this.collection.length === 0 && this.options.mode !== "readonly") {
        this.hide();
      }
      this.updateHeight(fixheight);
      this.updateCountLabel();
    },
    hide: function() {
      this.$el.removeClass("binf-show");
      this.$el.addClass("binf-hide");
    },
    setFocus: function() {
      var firstItem;
      if (this.options.mode === "writeonly") {
        firstItem = this.children.findByIndex(0).$el.find("a");
      } else {
        firstItem = this.$el.find(".dctmw-listfield-selectedvalues button");
      }
      firstItem.attr("tabindex", 0);
      firstItem.trigger("focus");
    },
    enableDisableField: function(enabled) {
      if (enabled) {
        if (!this.collection.isSortedResult) {
          this.ui.selectedValues.addClass("dctmw-listfield-sortable");
        }
        this.ui.selectedValues.removeClass("ui-sortable-disabled dctmw-formfield-disabled");
      } else {
        if (!this.collection.isSortedResult) {
          this.ui.selectedValues.removeClass("dctmw-listfield-sortable");
        }
        this.ui.selectedValues.addClass("ui-sortable-disabled dctmw-formfield-disabled");
      }
      this.collection.disabled = !enabled;
    },
    search: function(searchText) {
      this.searchText = searchText;
      this.searchRegex = null;
      if (searchText.length > 0) {
        searchText = searchText.replace("?", ".");
        searchText = searchText.replace("*", ".*?");
        this.searchRegex = new RegExp(searchText, "gi");
      }
      this.filter = function(child) {
        if (!_.isNull(this.searchRegex)) {
          if (child.get("name").match(this.searchRegex)) {
            child.set("searchRegex", this.searchRegex);
            return true;
          } else {
            return false;
          }
        } else {
          child.set("searchRegex", this.searchRegex);
          return true;
        }
      };
      this.render(true);
      this.updateHeight(true);
    },
    sortSelectedOptions: function() {
      if (!this.options.collection.isSortedResult) {
        var me = this, sortableItems = this.ui.selectedValues;
        if (sortableItems.length) {
          $(sortableItems).sortable({
            items: "li:not(.dctmw-listfield-multivalue-item)",
            placeholder: "dctmw-list-options-sort-placeholder",
            opacity: .5,
            helper: "clone",
            cancel: ".ui-sortable-disabled,.btn-container",
            start: function(event, ui) {
              ui.helper.addClass("dragged-item");
              ui.item.addClass("draggedoptions").show();
            },
            stop: function(event, ui) {
              ui.item.removeClass("draggedoptions");
              var itemMoved = me.collection.get(ui.item.attr("data-key"));
              me.collection.remove(itemMoved, {
                silent: true
              });
              me.collection.add(itemMoved, {
                at: ui.item.index(),
                silent: true
              });
              me.collection.trigger("selectioncollection:change", null, null, {
                valueMoved: itemMoved.get("id"),
                valueBefore: me.collection.at(ui.item.index() === 0 ? false : ui.item.index() - 1) && me.collection.at(ui.item.index() === 0 ? false : ui.item.index() - 1).get("id"),
                valueAfter: me.collection.at(ui.item.index() + 1) && me.collection.at(ui.item.index() + 1).get("id")
              });
            }
          });
        }
      }
    },
    updateHeight: function(fixheight) {
      if (this.$el.find("li").first().outerHeight() > 0 && !this.ui.showLess.is(":visible")) {
        var maxHeight = this.options.rows * this.$el.find("li").first().outerHeight(!!this.options.showHorizontal);
        if (this.ui.selectedValues.attrProp("scrollHeight") <= maxHeight && this.honorShowMore()) {
          this.ui.showMore.hide();
          return;
        }
        if (fixheight) {
          this.ui.selectedValues.css({
            height: maxHeight,
            overflow: "hidden !important"
          });
        } else {
          this.ui.selectedValues.css("height", "");
        }
        if (this.options.mode !== "readonly" && !this.options.parentView.alpacaField.options?.emptyDataSource) {
          this.ui.selectedValues.css({
            "max-height": maxHeight,
            overflow: "",
            height: "auto"
          });
          this.triggerMethod("ensure:scrollbar");
          this.triggerMethod("update:scrollbar");
        }
      }
    },
    honorShowMore: function() {
      return this.options.mode === "readonly" || this.options.parentView.alpacaField.options?.emptyDataSource;
    },
    isElementVisible: function(ele, container) {
      const {
        bottom,
        height,
        top
      } = ele.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
    },
    updateCountLabel: function() {
      if (this.options.parentView.alpacaField.options?.emptyDataSource) {
        let count = 0;
        this.ui.selectedValues.children().each((idx, element) => {
          if (!this.isElementVisible(element, this.ui.selectedValues[0])) {
            count++;
          }
        });
        if (count > 0) {
          this.ui.showMore.html(_.str.sformat(Lang.showMoreWithCount, count));
        } else {
          this.ui.showLess.hide();
          this.ui.showMore.hide();
        }
      }
    }
  });
});