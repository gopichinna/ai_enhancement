/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/toolbar/toolbar.view", "nuc/utils/base" ], function(_, $, ToolbarView, base) {
  "use strict";
  var MENU_WRAP_DROPDOWN_WIDTH = 44;
  var CustomizedWrapToolbarView = ToolbarView.extend({
    constructor: function CustomizedWrapToolbarView() {
      return ToolbarView.prototype.constructor.apply(this, arguments);
    },
    _wrapToolItemView: function(toolItemView) {
      var isSeparator = toolItemView.model.isSeparator();
      if (!isSeparator) {
        this.options.toolbarItemViewOptions.toolItemCounter++;
      }
      if (this.options.toolbarItemViewOptions.dropDownMenuEl) {
        if (!(isSeparator && this.options.toolbarItemViewOptions.index + 1 === this.children.length)) {
          toolItemView.$el.attr("role", "menuitem");
          toolItemView.$el.find(".csui-flyout-arrow .csui-button-icon.icon-expandArrowDown").addClass("binf-hidden");
          toolItemView.$el.find(".csui-toolitem.csui-flyout-arrow").removeClass("csui-flyout-arrow");
          _.isFunction(toolItemView.renderTextOnly) && toolItemView.renderTextOnly(true);
          this.options.toolbarItemViewOptions.dropDownMenuEl.append(toolItemView.$el);
          toolItemView.triggerMethod("dom:refresh");
        }
      } else {
        if (!isSeparator) {
          var currentOffsetY = Math.round(base.getOffset(toolItemView.$el).top), currElementWidth = Math.round(toolItemView.$el[0].getBoundingClientRect() ? toolItemView.$el[0].getBoundingClientRect().width : toolItemView.$el.width()), rightWithoutCurrentMenu = this.options.toolbarItemViewOptions.currentRight, availableSpace = this.options.toolbarItemViewOptions.rightMost - rightWithoutCurrentMenu, currentMenuIndex = toolItemView.model.collection.indexOf(toolItemView.model), hasMoreMenuItems = false;
          this.options.toolbarItemViewOptions.currentRight = this.options.toolbarItemViewOptions.currentRight + parseInt(currElementWidth, 10);
          var currentMenuStartsToOverflow = this.options.toolbarItemViewOptions.currentRight > this.options.toolbarItemViewOptions.rightMost;
          if (currentMenuIndex !== toolItemView.model.collection.length - 1) {
            var remainingMenus = toolItemView.model.collection.rest(currentMenuIndex + 1);
            hasMoreMenuItems = _.any(remainingMenus, function(menuModel) {
              return !menuModel.isSeparator();
            });
          }
          if (currentOffsetY !== this.options.toolbarItemViewOptions.firstOffsetY || currentMenuStartsToOverflow && (!hasMoreMenuItems || availableSpace < MENU_WRAP_DROPDOWN_WIDTH) || this.options.toolbarItemViewOptions.toolItemCounter > this.options.maxItemsShown) {
            if (this.options.toolbarItemViewOptions.pIsSeparator) {
              if (this.options.toolbarItemViewOptions.ppEl) {
                this.options.toolbarItemViewOptions.ppEl.$el.attr("role", "menuitem");
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(this.options.toolbarItemViewOptions.ppEl, toolItemView);
                this.options.toolbarItemViewOptions.dropDownMenuEl.children().first().after(this.options.toolbarItemViewOptions.pEl.$el);
              }
            } else {
              if (!this.options.toolbarItemViewOptions.pEl || !hasMoreMenuItems && availableSpace > MENU_WRAP_DROPDOWN_WIDTH) {
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(toolItemView, toolItemView);
              } else {
                this.options.toolbarItemViewOptions.pEl.$el.attr("role", "menuitem");
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(this.options.toolbarItemViewOptions.pEl, toolItemView);
              }
            }
          } else {
            toolItemView.makeFocusable();
          }
        }
        this.options.toolbarItemViewOptions.ppEl = this.options.toolbarItemViewOptions.pEl;
        this.options.toolbarItemViewOptions.pEl = toolItemView;
        this.options.toolbarItemViewOptions.pIsSeparator = isSeparator;
      }
    }
  });
  return CustomizedWrapToolbarView;
});