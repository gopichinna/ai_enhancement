/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/perspective.header/perspective.header.view", "csui/controls/toolbar/toolitems.factory", "csui/controls/toolbar/toolitems.filtered.model", "csui/utils/commands", "csui/controls/toolbar/toolbar.command.controller", "csui/controls/toolbar/toolbar.view", "hbs!csui/widgets/recycle.items.table/recycle.item.table.header", "i18n!csui/widgets/recycle.items.table/impl/nls/lang", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/widgets/recycle.items.table/recycle.toolbaritems", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.mime.icons", "smart/themes/theming", "css!csui/controls/perspective.header/impl/perspective.header" ], function(_, $, Marionette, PerspectiveHeaderView, ToolItemsFactory, FilteredToolItemsCollection, commands, ToolbarCommandController, ToolbarView, headerTemplate, lang, TabableRegionBehavior, ToolbarItems, jatoActionIcons, jatoMimeIcons, theming) {
  "use strict";
  var RecycleItemsTableHeaderView = PerspectiveHeaderView.extend({
    className: "csui-perspective-toolbar-container csui-recycle-items-header-view",
    template: headerTemplate,
    templateHelpers: function() {
      const isJATO = theming.isJATOTheme();
      return {
        icon: this.options.icon,
        title: this.options.title,
        backTitle: lang.backTitle,
        backButtonIconSVG: jatoActionIcons.actionArrowLeft,
        isJATO: isJATO,
        widgetIconSvg: isJATO && jatoMimeIcons.mimeRecycleBin
      };
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function RecycleItemsTableHeaderView(options) {
      if (options.collection) {
        this.listenTo(options.collection, "reset", this.updateHeader);
      }
      this.ui = _.extend({
        filterAction: ".filterToolbar",
        filterToolbarRegion: ".csui-filterToolbar"
      }, this.ui);
      this.events = _.extend({
        keydown: "onKeyInView",
        keyup: "onKeyUp"
      }, this.events);
      PerspectiveHeaderView.prototype.constructor.call(this, options);
      this.commandController = options.toolbarCommandController || new ToolbarCommandController({
        commands: options.commands || commands
      });
      let status = {
        context: options.context,
        nodes: this.selectedNodes,
        container: options.removeContainer ? undefined : this.container,
        collection: this.collection,
        originatingView: options.originatingView
      };
      let filteredCollection = new FilteredToolItemsCollection(ToolbarItems.filterToolbar, {
        status: status,
        commands: this.commandController.commands
      });
      const toolbarClass = ToolbarView;
      this.toolbarView = new toolbarClass(_.extend({
        collection: filteredCollection,
        toolbarName: "filter",
        toolbarCommandController: this.commandController,
        originatingView: options.originatingView,
        noMenuRoles: true
      }, ToolbarItems.filterToolbar.options));
      this.listenTo(this.toolbarView, "childview:toolitem:action", this._toolbarItemClicked);
    },
    updateHeader: function() {
      this.filterIconRegion = new Marionette.Region({
        el: this.ui.filterToolbarRegion
      });
      this.filterIconRegion.show(this.toolbarView);
    },
    _toolbarItemClicked: function(toolItemView, args) {
      let executionContext = {
        context: this.options.context,
        nodes: this.options.originatingView.getSelectedNodes().clone(),
        container: this.options.container,
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        toolItemView: toolItemView
      };
      this.commandController.toolitemClicked(args.toolItem, executionContext);
    },
    currentlyFocusedElement: function(event) {
      const tabElements = this.$("*[tabindex]:not(.binf-disabled )");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      return this.accNthHeaderItemFocused ? $(tabElements[this.accNthHeaderItemFocused]) : $(tabElements[0]);
    },
    onKeyInView: function(event) {
      const tabElements = this.$("*[tabindex]:not(.binf-disabled )");
      if (event.keyCode != 9 && event.keyCode != 16) {
        this.currentlyFocusedElement();
      }
      tabElements.removeClass("csui-acc-focusable-active");
      switch (event.keyCode) {
       case 9:
        if (!event.shiftKey) {
          this.accNthHeaderItemFocused++;
        } else {
          this.accNthHeaderItemFocused--;
        }
        if (this.accNthHeaderItemFocused >= tabElements.length) {
          this.accNthHeaderItemFocused = tabElements.length - 1;
          return;
        } else if (this.accNthHeaderItemFocused < 0) {
          this.accNthHeaderItemFocused = 0;
          return;
        }
        this._moveTo(event);
        break;

       case 13:
       case 32:
        $(event.target).click();
        event.preventDefault();
        event.stopPropagation();
        this.currentlyFocusedElementInHeader().trigger("focus");
        this.currentlyFocusedElementInHeader().attr("tabindex", 0);
        break;
      }
    },
    onKeyUp: function(event) {
      const tabElements = this.$("*[tabindex]:not(.binf-disabled )");
      if (this.accNthHeaderItemFocused == null) {
        if (event.shiftKey) {
          this.accNthHeaderItemFocused = 1;
        } else {
          this.accNthHeaderItemFocused = 0;
        }
      }
      this.$el.addClass("csui-acc-tab-region-active");
      $(tabElements[this.accNthHeaderItemFocused]).addClass("csui-acc-focusable-active");
    },
    currentlyFocusedElementInHeader: function(event) {
      const tabElements = this.$("*[tabindex]:not(.binf-disabled )");
      const elementOfFocus = tabElements.length > 0 ? $(tabElements[this.accNthHeaderItemFocused]) : null;
      return elementOfFocus;
    },
    _moveTo: function(event) {
      const currentlyFocused = this.currentlyFocusedElementInHeader();
      currentlyFocused.trigger("focus");
      currentlyFocused.attr("tabindex", 0);
      currentlyFocused.addClass("csui-acc-focusable-active");
      event.preventDefault();
      event.stopPropagation();
    }
  });
  return RecycleItemsTableHeaderView;
});