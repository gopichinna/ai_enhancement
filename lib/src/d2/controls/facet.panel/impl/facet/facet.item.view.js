/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/handlebars", "nuc/utils/base", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/facet.panel/impl/facet/facet.item", "i18n!d2/controls/facet.panel/impl/nls/lang", "i18n", "css!d2/controls/facet.panel/impl/facet/facet.item" ], function($, Handlebars, base, _, Marionette, template, lang, i18n) {
  var FacetItemView = Marionette.ItemView.extend({
    template: template,
    className: function() {
      if (this.options.model.get("hideTopic")) {
        return "d2-facet-item d2-topic-hidden";
      } else {
        return "d2-facet-item";
      }
    },
    constructor: function FacetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.showInputOnHover = !base.isTouchBrowser() && options.showOnHover;
    },
    initialize: function() {
      this.listenTo(this.model, "change:checked", this.refreshSelectionState);
    },
    triggers: {
      "click .csui-filter-name": "single:filter:select"
    },
    events: {
      "click .d2-facet-checkbox": "onCheckBoxSelect",
      "click .d2-facet-radio": "onRadioSelect",
      "click .more": "onShowMore",
      "click .less": "onShowLess",
      "keydown > span": "onKeyInView",
      "keydown .csui-filter-name": "onKeyInView",
      "mouseover .icon": "onMouseOverIcon",
      "mouseout .icon": "onMouseOutIcon"
    },
    ui: {
      icon: "> span",
      checkbox: "> span input",
      filterName: "> .d2-filter-name",
      more: "> .d2-filter-more",
      categoryLabel: "> .d2-facet-category-label"
    },
    templateHelpers: function() {
      var showOnHover = this.showInputOnHover ? "" : "d2-showAlways";
      var title = this.options.model.get("showTotal") === false ? lang.filterTitleAriaWithZeroItems : lang.filterTitleAria;
      var filterTitleAria = _.str.sformat(title, this.options.model.get("name"), this.options.model.get("total"));
      var filterCheckboxAria = _.str.sformat(title, this.options.model.get("name"), this.options.model.get("total"));
      var facetId = this.model.get("facet-category") ? this.model.get("facet-category") + "_" : "";
      var itemid = facetId + this.model.get("id").replace(/ /g, "_").toLowerCase();
      return {
        showOnHover: showOnHover,
        isMultiSelect: this.model.multiselect,
        filterTitleAria: filterTitleAria,
        filterCheckboxAria: filterCheckboxAria,
        showMore: this.model.get("more-items-count") ? _.str.sformat(lang.filterDialogHint, this.model.get("more-items-count")) : lang.showMore,
        showLess: lang.showLess,
        itemid: itemid,
        showCheckBox: this.options.model.get("type") == "facet",
        showRadio: this.options.model.get("type") == "filter"
      };
    },
    onRender: function() {
      this.$el.attr("role", "option");
      var id = this.model.get("id");
      this.$el.attr("id", id);
      this.$el.find(".more").attr("id", "more-" + id);
      this.$el.find(".less").attr("id", "less-" + id);
      if (this.model.get("checked")) {
        this.selectItem();
      }
      var indent = this.model.get("level");
      if (indent > 0) {
        var margin = i18n && i18n.settings.rtl ? "margin-right" : "margin-left";
        this.ui.icon.css(margin, (indent + 1) * 21);
        this.ui.more.css(margin, (indent + 1) * 21);
        this.ui.categoryLabel.css(margin, (indent + 1) * 21);
      }
      var itemname = this.model.get("highlightedname") || this.model.get("name");
      if (itemname && itemname.length > 0) {
        itemname = itemname.replace(/</gi, "&lt;").replace(/>/gi, "&gt;");
        var hhRegEx = /&lt;HH&gt;/gi;
        var hhEndRegEx = /&lt;\/HH&gt;/gi;
        var modded = itemname.replace(hhRegEx, '<span class="highlight">');
        modded = modded.replace(hhEndRegEx, "</span>");
        this.$el.find(".csui-name").html(modded);
      } else {
        this.$el.find(".csui-name").html(this.model.get("name"));
      }
      if (this.model.get("more-items-count")) {
        this.$el.addClass("last-limited-item");
      }
    },
    onMouseOverIcon: function() {
      var iconspan = this.$el.find(".icon");
      if (!this.model.get("multiselect") && this.model.get("type") === "facet") {
        $(iconspan).removeClass("icon-listview-checkmark");
        if (this.model.get("checked")) {
          $(iconspan).addClass("icon-checkbox-selected");
        } else {
          $(iconspan).addClass("icon-checkbox");
        }
      }
    },
    onMouseOutIcon: function() {
      var iconspan = this.$el.find(".icon");
      if (!this.model.get("multiselect") && this.model.get("type") === "facet") {
        $(iconspan).removeClass("icon-checkbox");
        $(iconspan).removeClass("icon-checkbox-selected");
        if (this.model.get("checked")) {
          $(iconspan).addClass("icon-listview-checkmark");
        } else {
          $(iconspan).addClass("icon-checkbox");
        }
      }
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, target = $(event.target);
      switch (keyCode) {
       case 32:
       case 13:
        if (target.hasClass("icon")) {
          this.ui.checkbox.trigger("click");
        } else {
          this.trigger("single:filter:select", this);
        }
        break;

       default:
        return true;
      }
      return false;
    },
    refreshSelectionState: function() {
      if (!this.model.get("checked")) {
        this.ui.icon.removeClass("icon-checkbox-selected icon-checkbox-disabled").addClass("icon-checkbox");
        this.ui.icon[0].setAttribute("aria-checked", "false");
      } else {
        if (this.model.get("multiselect")) {
          this.ui.icon.removeClass("icon-checkbox icon-checkbox-disabled").addClass("icon-checkbox-selected d2-showAlways");
        } else {
          this.ui.icon.removeClass("icon-checkbox icon-checkbox-disabled").addClass("icon-listview-checkmark");
        }
        this.ui.icon[0].setAttribute("aria-checked", "true");
      }
    },
    onCheckBoxSelect: function() {
      if (this.model.get("checked")) {
        this.model.set("checked", false);
        this.trigger("multi:filter:unselect", this);
      } else {
        this.model.set("checked", true);
        if (this.model.get("multiselect")) {
          this.trigger("multi:filter:select", this);
        } else {
          this.trigger("single:filter:select", this);
        }
      }
      this.refreshSelectionState();
    },
    onRadioSelect: function() {
      this.model.collection.each(function(filter) {
        filter.set("checked", false);
      });
      this.model.set("checked", true);
      this.trigger("single:filter:select", this);
    },
    onShowMore: function() {
      this.trigger("show:more", this);
    },
    onShowLess: function() {
      this.trigger("show:less", this);
    },
    selectItem: function() {
      if (this.model.get("multiselect")) {
        this.ui.icon.removeClass("icon-checkbox icon-checkbox-disabled").addClass("icon-checkbox-selected");
      } else {
        this.ui.icon.removeClass("icon-checkbox icon-checkbox-disabled").addClass("icon-listview-checkmark");
      }
      this.ui.icon[0]?.setAttribute("aria-checked", "true");
      this.ui.checkbox.prop("checked", true);
    },
    getIndex: function() {
      return this._index;
    }
  });
  return FacetItemView;
});