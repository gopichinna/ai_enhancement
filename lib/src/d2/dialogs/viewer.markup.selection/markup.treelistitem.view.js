/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/checkbox/checkbox.view", "hbs!d2/dialogs/viewer.markup.selection/impl/markup.treelistitem.template", "i18n!csui/controls/listitem/impl/nls/lang", "css!d2/dialogs/viewer.markup.selection/impl/markup.treelistitem" ], function(_, $, Backbone, Marionette, CheckboxView, MarkupTreeListItemTemplate, lang) {
  "use strict";
  var MarkupTreeListItemView = Marionette.CompositeView.extend({
    className: "d2-markup-treelistitem binf-panel binf-panel-default",
    attributes: function() {
      return {
        role: "treeitem"
      };
    },
    template: MarkupTreeListItemTemplate,
    templateHelpers: function() {
      return this._baseTemplateHelpers();
    },
    _baseTemplateHelpers: function() {
      return {
        icon: this.options.model && this.options.model.get("icon"),
        name: this.options.model && this.options.model.get("docTitle"),
        viewId: this.cid,
        expandLabel: lang.treeListExpandTooltip,
        collapseLabel: lang.treeListCollapseTooltip,
        selectedCount: this.selectedCount,
        index: this._index,
        expand: this._index === 0 && this.options.model.childrenCollection.length < 8 || this.options.documentCount === 1,
        showDropDownIcon: this.options.documentCount > 1
      };
    },
    ui: {
      header: ".d2-markup-header",
      headerDropdownIcon: ".d2-markup-header .dropdown-icon",
      content: "> .d2-markup-content",
      contentList: "> .d2-markup-content > .cs-list-group",
      mainCheckbox: "> .d2-markup-header > .main-checkbox",
      selectedCount: "> .d2-markup-header > .child-items-selected-count"
    },
    events: {},
    childEvents: {
      clicked: "onClickItem",
      render: "_onChildRender"
    },
    childViewContainer: ".cs-list-group",
    childView: CheckboxView,
    childViewOptions: function(model) {
      return {
        checked: model.get("checked") === "true",
        markupId: model.get("markupObjId"),
        ariaLabel: model.get("markupObjectTitle"),
        title: model.get("markupObjectTitle"),
        label: model.get("markupObjectTitle"),
        model: model
      };
    },
    _onChildRender: function(childView) {
      var $item = childView.$el;
      if ($item.is("[data-csui-active]")) {
        $item.addClass("binf-active");
      }
      this.listenTo(childView.model, "change:checked", this.updateHeaderCheckboxBasedOnChild.bind(this));
      this.listenTo(childView.model, "change:checked", this.updateSelectedCount.bind(this));
    },
    updateHeaderCheckboxBasedOnChild: function() {
      var cnt = 0;
      _.each(this.collection.models, function(model) {
        if (model.get("checked") === "true") {
          cnt++;
        }
      });
      if (cnt === this.collection.length) {
        this.headerCheckboxView.setChecked(true);
      } else if (cnt === 0) {
        this.headerCheckboxView.setChecked(false);
      } else {
        this.headerCheckboxView.setChecked("mixed");
      }
    },
    updateSelectedCount: function() {
      var cnt = 0;
      _.each(this.collection.models, function(model) {
        if (model.get("checked") === "true") {
          cnt++;
        }
      });
      this.ui.selectedCount.text(cnt);
      if (cnt > 0 && this.ui.content.hasClass("binf-hidden")) {
        this.ui.selectedCount.removeClass("binf-hidden");
      } else {
        this.ui.selectedCount.addClass("binf-hidden");
      }
    },
    constructor: function MarkupTreeListItemView(options) {
      options || (options = {});
      if (options.model && options.model.childrenCollection) {
        options.collection = options.model.childrenCollection;
      } else {
        options.collection = new Backbone.Collection();
      }
      Marionette.CompositeView.call(this, options);
    },
    onRender: function(itemView) {
      this.ui.headerDropdownIcon.on("click", _.bind(this.onClickHeaderDropdownIcon, this));
      this._setDropdownIconClass();
      this.addHeaderCheckbox(itemView);
      this.updateHeaderCheckboxBasedOnChild();
      this.updateSelectedCount();
    },
    addHeaderCheckbox: function(itemView) {
      var me = this;
      var region = new Marionette.Region({
        el: this.ui.mainCheckbox
      });
      this.headerCheckboxView = new CheckboxView({
        checked: itemView.model.get("checked") === "true",
        disabled: false,
        ariaLabel: "checkboxAriaLabel",
        title: itemView.model.get("docTitle"),
        label: itemView.model.get("docTitle"),
        model: itemView.model,
        className: "header-checkbox"
      });
      this.headerCheckboxView.listenTo(this.headerCheckboxView, "clicked", function(e) {
        var checked = e.model.get("checked");
        if (checked === "false" || checked === "mixed") {
          checked = true;
        } else {
          checked = false;
        }
        _.each(me.children._views, function(view) {
          view.setChecked(checked);
        });
      });
      region.show(this.headerCheckboxView);
    },
    onClickHeaderDropdownIcon: function(event, byTrigger) {
      this.ui.content.toggleClass("binf-hidden");
      this._setDropdownIconClass();
      this._setHeaderClass();
      this.updateSelectedCount();
      if (!byTrigger) {
        this.ui.headerDropdownIcon.prop("tabindex", 0);
        this.ui.headerDropdownIcon.trigger("focus");
      }
    },
    _setDropdownIconClass: function() {
      if (this.ui.content.hasClass("binf-hidden")) {
        this.ui.headerDropdownIcon.removeClass("icon-expandArrowUp");
        this.ui.headerDropdownIcon.addClass("icon-expandArrowDown");
        this.ui.headerDropdownIcon.attr("title", lang.treeListExpandTooltip);
        if (this.model && this.model.get("flatten") !== true) {
          this.$el.attr("aria-expanded", "false");
        }
      } else {
        this.ui.headerDropdownIcon.addClass("icon-expandArrowUp");
        this.ui.headerDropdownIcon.removeClass("icon-expandArrowDown");
        this.ui.headerDropdownIcon.attr("title", lang.treeListCollapseTooltip);
        if (this.model && this.model.get("flatten") !== true) {
          this.$el.attr("aria-expanded", "true");
        }
      }
    },
    _setHeaderClass: function() {
      if (this.ui.content.hasClass("binf-hidden")) {
        this.ui.header.removeClass("open-content");
      } else {
        this.ui.header.addClass("open-content");
      }
    },
    onClickItem: function(src) {
      src.cancelClick = false;
      this.triggerMethod("click:tree:item", src);
      if (src.cancelClick === false) {
        this._setCssItemSelected(src.$el);
        src.$el.trigger("focus");
      }
    },
    _setCssItemSelected: function($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $item.siblings("[data-csui-active]");
      $active.removeClass("binf-active").removeAttr("data-csui-active");
      $item.addClass("binf-active").attr("data-csui-active", "");
      $item.siblings().prop("tabindex", "-1");
    }
  });
  return MarkupTreeListItemView;
});