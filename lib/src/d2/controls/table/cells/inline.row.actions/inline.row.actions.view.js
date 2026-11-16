/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "csui/controls/tableactionbar/tableactionbar.view", "csui/controls/icons.v2", "nuc/utils/base", "css!d2/controls/table/cells/inline.row.actions/impl/inline.row.actions" ], function($, _, Backbone, Marionette, TemplatedCellView, cellViewRegistry, TableActionBarView, iconRegistry, base) {
  "use strict";
  var TableInlineRowActionBarView = TableActionBarView.extend({
    onRenderCollection: function() {
      this._adjusted = false;
      this._layoutButtons();
    },
    _renderLazyActions: function() {
      return TableActionBarView.prototype._renderLazyActions.apply(this, arguments).always(_.bind(function() {
        this.$el.trigger("render:lazy:actions");
      }, this));
    }
  });
  var InlineRowActionsCellView = TemplatedCellView.extend({
    constructor: function InlineRowActionsCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.tableView = this.options.tableView;
      this.inlineRowActionOptions = this.tableView.inlineRowActionOptions || {};
      this.staticActions = this.inlineRowActionOptions.staticActions;
      this.createLoaderElement();
      this.createShowMoreIcon();
      this.createInlineRowActionRegion();
      this.$el.on("focusin", this.focusInlineRowActionCell.bind(this));
      this.$el.on("focusout", this.focusOutlineRowActionCell.bind(this));
      this.$el.off("blur").on("blur", ".binf-dropdown-toggle", this.onDropDownToggleBlur.bind(this));
      this.$el.off("render:lazy:actions").on("render:lazy:actions", ".csui-table-actionbar", this.onRenderLazyActions.bind(this));
      this.$el.off("binf.dropdown.after.show").on("binf.dropdown.after.show", ".binf-dropdown", this.onDropDownAfterShow.bind(this));
      this.$showMoreActionEl.on("click", this.onClickShowMoreAction.bind(this));
    },
    needsAriaLabel: true,
    renderValue: function() {
      this.updateTableRowClass();
      if (this.staticActions) {
        this.createTableActionBar();
      }
    },
    updateTableRowClass: function() {
      var $rowEl = this.$el.closest("tr");
      $rowEl.attr("model-id", this.model.get("id"));
      if (this.inlineRowActionOptions.getTableRowClassName && _.isFunction(this.inlineRowActionOptions.getTableRowClassName)) {
        var tableRowClassName = this.inlineRowActionOptions.getTableRowClassName(this.model);
        $rowEl.addClass(tableRowClassName);
      }
    },
    createInlineRowActionRegion: function() {
      this.$el.append('<div class="d2-inline-row-action"/>');
      this.inlineRowActionRegion = new Marionette.Region({
        el: this.$el.find(".d2-inline-row-action")
      });
    },
    createShowMoreIcon: function() {
      var $svgEl = iconRegistry.getIconByNameWithOptions({
        iconName: "csui_action_more32",
        states: true
      });
      this.$el.append('<div class="show-more-action-icon">' + $svgEl + "</div>");
      this.$showMoreActionEl = this.$el.find(".show-more-action-icon");
    },
    createTableActionBar: function() {
      this.$showMoreActionEl.addClass("binf-hidden");
      this.$dotsLoaderEl.addClass("binf-hidden");
      var defaultActionController = this.tableView.defaultActionController, toolbarItems = this.inlineRowActionOptions.toolbarItems, toolbarItemsMask = this.inlineRowActionOptions.toolbarItemsMasks, options = {
        collection: toolbarItems.inlineActionbar,
        commands: defaultActionController.commands,
        containerCollection: this.model.collection,
        delayedActions: this.model.collection && this.model.collection.delayedActions,
        context: this.options.context,
        model: this.model,
        originatingView: this.tableView.options.originatingView,
        dropDownIconName: "csui_action_more32",
        maxItemsShown: 1,
        toolItemsMask: toolbarItemsMask && toolbarItemsMask.toolbars && toolbarItemsMask.toolbars.inlineActionbar,
        addGroupSeparators: true
      };
      this.tableActionBarView = new TableInlineRowActionBarView(options);
      this.lazyActionOnExpand = this.tableActionBarView.collection && this.tableActionBarView.collection.length > 1;
      this.tableActionBarView.once("show", this.onShowTableActionBar.bind(this));
      this.listenTo(this.tableActionBarView.actionState, "change", _.bind(this.onTableActionBarStateChange, this));
      if (this.tableActionBarView.actionState.get("state") !== "loading") {
        this.inlineRowActionRegion.show(this.tableActionBarView);
      } else {
        this.$dotsLoaderEl.removeClass("binf-hidden");
      }
    },
    createInlineRowAction: function() {
      if (!this.model.get("csuiLazyActionsRetrieved") && this.model && this.model.setEnabledLazyActionCommands && _.isFunction(this.model.setEnabledLazyActionCommands)) {
        this.$showMoreActionEl.addClass("binf-hidden");
        this.$dotsLoaderEl.removeClass("binf-hidden");
        this.model.setEnabledLazyActionCommands(true).always(_.bind(function() {
          this.$dotsLoaderEl.addClass("binf-hidden");
          this.createTableActionBar();
        }, this));
      } else {
        this.createTableActionBar();
      }
    },
    onShowTableActionBar: function() {
      if (this.lazyActionOnExpand) {
        this.triggerEventOnDropdownToggle();
      }
    },
    onDropDownToggleBlur: function(event) {
      if (base.isTouchBrowser()) {
        return;
      }
      var hasItem = this.$el.has($(event.relatedTarget));
      if (hasItem.length === 0) {
        this.collapseInlineRowAction();
      }
    },
    onClickShowMoreAction: function() {
      if (!this.tableActionBarView) {
        this.inlineActionEventType = "click";
        this.createInlineRowAction();
      }
    },
    collapseInlineRowAction: function() {
      if (this.tableActionBarView && !this.tableActionBarView.isDestroyed) {
        this.tableActionBarView.closeDropdownMenuIfOpen();
      }
    },
    focusInlineRowActionCell: function(event) {
      if (base.isTouchBrowser()) {
        return;
      }
      var $currentTarget = $(event.currentTarget);
      $currentTarget.closest("tr").addClass("focused");
      if ($(event.target).is(this.$el) && this.tableActionBarView && this.$el.find(".binf-dropdown-toggle").length > 0) {
        this.collapseInlineRowAction();
        this.triggerEventOnDropdownToggle("focus");
      }
      if (!this.staticActions) {
        if (!this.tableActionBarView || this.tableActionBarView && !this.tableActionBarView.isDestroyed && this.lazyActionOnExpand && this.model.get("csuiLazyActionsRetrieved") && this.$el.find(".csui-table-actionbar .csui-loading-parent-wrapper").length > 0 && !this.$el.find(".csui-table-actionbar .csui-loading-parent-wrapper").hasClass("binf-hidden")) {
          this.inlineActionEventType = "focus";
          this.createInlineRowAction();
        }
      }
    },
    focusOutlineRowActionCell: function(event) {
      if (base.isTouchBrowser()) {
        return;
      }
      var $currentTarget = $(event.currentTarget), $relatedTarget = $(event.relatedTarget), hasItem = $currentTarget.has($relatedTarget);
      if (hasItem.length === 0 && !$currentTarget.is($relatedTarget)) {
        $currentTarget.closest("tr").removeClass("focused");
        this.collapseInlineRowAction();
      }
    },
    onRenderLazyActions: function() {
      if (!this.lazyActionOnExpand) {
        var $lastFocused = $(":focus");
        if (this.$el.is($lastFocused) || $lastFocused.length === 0 || this.inlineActionEventType === "click") {
          this.triggerEventOnDropdownToggle();
        }
      }
    },
    onDropDownAfterShow: function(event) {
      setTimeout(function() {
        $(event.currentTarget).find("li:first a").trigger("focus");
      });
    },
    triggerEventOnDropdownToggle: function(eventType) {
      setTimeout(_.bind(function() {
        eventType = eventType || this.inlineActionEventType || "focus";
        if (eventType === "focus" && !$(document.activeElement).closest(".d2-table-cell-inline-row-actions").is(this.$el)) {
          return;
        }
        this.$el.find(".binf-dropdown-toggle").trigger(eventType);
      }, this));
    },
    onDestroy: function() {
      if (this.tableActionBarView) {
        this.tableActionBarView.destroy();
        this.inlineRowActionRegion.reset();
        this.tableActionBarView = null;
      }
    },
    createLoaderElement: function() {
      var loaderEl = ' <div class="dots-loader binf-hidden">' + '<span class="csui-loading-dots-wrapper">' + '<span class="csui-loading-dot"></span>' + '<span class="csui-loading-dot"></span>' + '<span class="csui-loading-dot"></span>' + "</span>" + "</div>";
      this.$el.append(loaderEl);
      this.$dotsLoaderEl = this.$el.find(".dots-loader");
    },
    onTableActionBarStateChange: function(actionState) {
      if (this.tableActionBarView) {
        if (actionState.get("state") === "loading") {
          this.$dotsLoaderEl.removeClass("binf-hidden");
          this.$showMoreActionEl.addClass("binf-hidden");
          this.tableActionBarView.$el.addClass("binf-hidden");
        } else {
          this.$showMoreActionEl.addClass("binf-hidden");
          this.$dotsLoaderEl.addClass("binf-hidden");
          this.tableActionBarView.$el.removeClass("binf-hidden");
          this.inlineRowActionRegion.show(this.tableActionBarView);
        }
      }
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-table-cell-inline-row-actions"
  });
  cellViewRegistry.registerByColumnKey("d2_inline_row_actions", InlineRowActionsCellView);
  return InlineRowActionsCellView;
});