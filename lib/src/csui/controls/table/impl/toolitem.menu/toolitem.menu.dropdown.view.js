/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "hbs!csui/controls/table/impl/toolitem.menu/impl/toolitem.menu.dropdown" ], function(Marionette, template) {
  "use strict";
  const ToolItemMenuDropdownView = Marionette.View.extend({
    tagName: "otc-menu",
    className: "csui-toolitem-menu-dropdown",
    template: template,
    attributes: function() {
      return {
        buttonId: this.options.buttonId,
        ariarole: "menu",
        usepopover: "",
        isOpen: this.options.isOpen ? "" : null
      };
    },
    events: {
      change: "_onChange",
      "item-click": "_onItemClick"
    },
    constructor: function ToolItemMenuDropdownView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
      this._toolItems = {};
    },
    templateContext: function() {
      return {
        items: this._prepareItems()
      };
    },
    _prepareItems: function() {
      const isCheckableItem = toolItem => {
        return toolItem.get("stateIsOn") !== undefined;
      };
      const prepared = [];
      let currentGroup;
      this.collection.each(toolItem => {
        const signature = toolItem.get("signature");
        const groupName = toolItem.get("group");
        if (currentGroup && (groupName !== currentGroup.name || !isCheckableItem(toolItem))) {
          prepared.push({
            isGroupEnd: true
          });
          currentGroup = null;
        }
        if (toolItem.get("flyout") || toolItem.toolItems?.length > 0) {
          console.warn(`In toolitem.menu flyout and submenus are not yet supported. Ignoring signature ${signature} and subitems.`);
        } else if (signature === "-") {
          prepared.push({
            isDivider: true
          });
        } else {
          const item = {
            signature: signature,
            name: toolItem.get("name")
          };
          if (isCheckableItem(toolItem)) {
            if (!currentGroup) {
              prepared.push({
                isGroupStart: true
              });
              currentGroup = {
                name: groupName
              };
            }
            item.isCheckable = true;
            item.isChecked = toolItem.get("stateIsOn");
          } else {
            item.isItem = true;
          }
          prepared.push(item);
          this._toolItems[signature] = toolItem;
        }
      });
      return prepared;
    },
    isOpen: function() {
      return this.el.isOpen;
    },
    _closeMenu: function() {
      setTimeout(() => {
        this.el.removeAttribute("isopen");
      });
    },
    _onChange: function(event) {
      this._executeAction(event);
    },
    _onItemClick: function(event) {
      this._executeAction(event);
    },
    _executeAction: function(event) {
      const signature = event.target.getAttribute("data-csui-command");
      const toolItem = this._toolItems[signature];
      this._closeMenu();
      this.triggerMethod("toolitem:action", toolItem);
    }
  });
  return ToolItemMenuDropdownView;
});