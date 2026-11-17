/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "csui/controls/table/impl/toolitem.menu/toolitem.menu.toggle.view", "csui/controls/table/impl/toolitem.menu/toolitem.menu.dropdown.view", "css!csui/controls/table/impl/toolitem.menu/impl/toolitem.menu" ], function(Marionette, ToolItemMenuToggleView, ToolItemMenuDropdownView) {
  "use strict";
  const ToolItemMenuView = Marionette.View.extend({
    className: "csui-toolitem-menu",
    template: false,
    constructor: function ToolItemMenuView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
    },
    onDestroy() {
      this.toolitemMenuToggleView?.destroy();
      this.toolitemMenuDropdownView?.destroy();
    },
    onRender: function() {
      this.toolitemMenuToggleView = new ToolItemMenuToggleView({
        dropDownText: this.options.dropDownText,
        dropDownAria: this.options.dropDownAria,
        dropDownIconSVG: this.options.dropDownIconSVG,
        dropDownIconName: this.options.dropDownIconName,
        dropDownButtonSize: this.options.dropDownButtonSize
      });
      this.listenTo(this.toolitemMenuToggleView, "toggleByClick", this._onToggleClick);
      this.listenTo(this.toolitemMenuToggleView, "toggleByKey", this._onToggleKey);
      this.$el.append(this.toolitemMenuToggleView.$el);
      this.toolitemMenuToggleView.render();
    },
    _onToggleKey: function() {
      if (this.toolitemMenuDropdownView && !this.toolitemMenuDropdownView.isOpen()) {
        this.trigger("before:open");
        this.toolitemMenuDropdownView.render();
      }
    },
    _onToggleClick: function() {
      const toolitemMenuDropdownView = this.toolitemMenuDropdownView;
      if (!toolitemMenuDropdownView) {
        this.trigger("before:open");
        this.toolitemMenuDropdownView = new ToolItemMenuDropdownView({
          collection: this.options.collection,
          buttonId: this.toolitemMenuToggleView.el.id
        });
        this.listenTo(this.toolitemMenuDropdownView, "toolitem:action", toolItem => {
          this.trigger("toolitem:action", toolItem);
        });
        this.toolitemMenuDropdownView.render();
        this.$el.append(this.toolitemMenuDropdownView.$el);
      } else if (!this.toolitemMenuDropdownView.isOpen()) {
        this.trigger("before:open");
        this.toolitemMenuDropdownView.render();
      }
    }
  });
  return ToolItemMenuView;
});