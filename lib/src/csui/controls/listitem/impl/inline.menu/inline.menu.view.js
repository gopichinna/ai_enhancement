/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/controls/tableactionbar/tableactionbar.view", "hbs!csui/controls/listitem/impl/inline.menu/inline.menu", "css!csui/controls/listitem/impl/inline.menu/inline.menu" ], function(Marionette, TableActionBarView, template) {
  "use strict";
  const InlineMenuView = Marionette.View.extend({
    template: template,
    events: {
      "click otc-toolbar": "_onClick",
      "mouseover otc-toolbar": "_preventDefaultAction",
      "keydown otc-toolbar": "_onkeydown"
    },
    _onkeydown: function(event) {
      if (event.key === "Enter" || event.key === " " || event.key === "Tab") this._preventDefaultAction(event);
    },
    regions: {
      inlineBarRegion: ".csui-inline-menu"
    },
    constructor: function InlineMenuView(options) {
      options || (options = {});
      this.tileViewToolbarItems = options.tileViewToolbarItems || {};
      this.inlineActionbar = this.tileViewToolbarItems.inlineActionbar;
      this.inlineActionbarOptions = this.inlineActionbar && this.inlineActionbar.options || {};
      Marionette.View.call(this, options);
    },
    onRender: function() {
      this._showInlineMenu();
    },
    _preventDefaultAction: function(event) {
      event.stopPropagation();
      event.preventDefault();
    },
    _onClick: function(event) {
      this._preventDefaultAction(event);
    },
    acquireFocus: function() {
      const toolbarElement = this.el.querySelector("otc-toolbar");
      if (toolbarElement) toolbarElement.focus();
    },
    _showInlineMenu: function() {
      this.inlineMenuBarView = new TableActionBarView({
        ...this.inlineActionbarOptions,
        context: this.options.context,
        originatingView: this.options.originatingView,
        commands: this.options.commands,
        model: this.model,
        collection: this.inlineActionbar,
        containerCollection: this.model.collection,
        removeTypeInlineactions: true,
        status: {
          originatingView: this.options.originatingView
        }
      });
      this.showChildView("inlineBarRegion", this.inlineMenuBarView);
    },
    closeDropdownMenuIfOpen: function() {
      const otcToolbarEl = this.inlineMenuBarView.el.querySelector("otc-toolbar");
      if (otcToolbarEl && otcToolbarEl.overflowMenuIsOpen) otcToolbarEl.overflowMenuIsOpen = false;
    }
  });
  return InlineMenuView;
});