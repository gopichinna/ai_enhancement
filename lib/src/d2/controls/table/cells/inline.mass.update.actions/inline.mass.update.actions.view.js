/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/icon/icon.view", "csui/controls/listitem/inline.menu.view", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "csui/controls/toolbar/toolitems.factory", "csui/utils/commands", "d2/utils/constants", "i18n!d2/controls/table/cells/inline.mass.update.actions/impl/nls/lang", "css!d2/controls/table/cells/inline.mass.update.actions/impl/inline.mass.update.actions" ], function($, _, Marionette, base, IconView, InlineMenuView, TemplatedCellView, cellViewRegistry, ToolItemsFactory, commands, constants, lang) {
  "use strict";
  var InlineMassUpdateActions = TemplatedCellView.extend({
    constructor: function InlineMassUpdateActions() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.tableView = this.options.tableView;
      this.context = this.options.context;
      this.createInlineRowActionRegion();
    },
    events: {
      focusin: "onFocusIn",
      focusout: "onFocusOut",
      keydown: "onKeyDown"
    },
    modelEvents: {
      "change:d2_field_value_count": "render"
    },
    onFocusIn: _.throttle(function() {
      if (base.isTouchBrowser()) {
        return;
      }
      this.isFocused = true;
      if (this.showUndo) {
        this.createIconView();
      } else if (!this.tableView.multiSelectMode && this.model.get("has_value") !== false) {
        this.createInlineMenu();
      }
    }, 150, {
      leading: false
    }),
    onFocusOut: function() {
      if (base.isTouchBrowser()) {
        return;
      }
      if (!this.isFocused) {
        this.onFocusIn.cancel();
        return;
      }
      setTimeout(function() {
        if (this.$el.has(document.activeElement).length === 0 && this.el !== document.activeElement) {
          this.isFocused = false;
          if (!this.tableView.multiSelectMode && this.model.get("has_value") !== false) {
            var me = this, destroyInlineMenu = function() {
              if (me.clicking) {
                setTimeout(function() {
                  destroyInlineMenu();
                });
              } else {
                me.destroyInlineMenu();
              }
            };
            destroyInlineMenu();
          }
        }
      }.bind(this));
    },
    onKeyDown: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        if (this.iconView) {
          this.iconView.$el.trigger("click");
        } else if (this._inlineMenuView) {
          if (!this._inlineMenuView.ui.moreToggle.hasClass("binf-hidden")) {
            var e = $.Event("keydown");
            e.which = 13;
            this._inlineMenuView.ui.moreToggle.trigger(e);
          } else {
            this._inlineMenuView.ui.toolbarContainer.find("li a").trigger("click");
          }
        }
        break;
      }
    },
    createInlineRowActionRegion: function() {
      this.$el.append('<div class="d2-inline-mass-update-row-action"/>');
      this.inlineRowActionRegion = new Marionette.Region({
        el: this.$el.find(".d2-inline-mass-update-row-action")
      });
    },
    renderValue: function() {
      if (this.model.get("hideInlineMenu")) {
        return;
      }
      this.showUndo = !_.isUndefined(this.model.previousFieldValueCount) && this.model.get("d2_field_value_count") !== this.model.previousFieldValueCount && !this.tableView.multiSelectMode;
      if (this.tableView.fieldType === "d2combo") {
        this.showUndo = this.tableView.newRowhasAdded ? this.model.newNode : this.showUndo;
      }
      if (this.showUndo) {
        this.createIconView();
      } else if (!this.tableView.multiSelectMode && this.model.get("has_value") !== false) {
        this.destroyIconView();
        if (base.isTouchBrowser()) {
          this.createInlineMenu();
        } else {
          this.listenTo(this.tableView, "enterTableRow", function(options) {
            this.enterTimeout = setTimeout(function() {
              this.enterTimeout = null;
              if (options.node === this.model) {
                this.createInlineMenu();
              }
            }.bind(this), 50);
          });
          var onLeaveTableRow = function(options) {
            this.enterTimeout && clearTimeout(this.enterTimeout);
            if (options.node === this.model) {
              if (this.clicking) {
                setTimeout(function() {
                  onLeaveTableRow.call(this, options);
                }.bind(this));
              } else {
                this.destroyInlineMenu();
              }
            }
          };
          this.listenTo(this.tableView, "leaveTableRow", onLeaveTableRow);
          if (this.$el.has(document.activeElement).length || this.el === document.activeElement) {
            this.createInlineMenu();
          }
        }
      } else {
        this.destroyIconView();
        this.destroyInlineMenu();
      }
    },
    createIconView: function() {
      if (!this.iconView) {
        this.destroyInlineMenu();
        this.iconView = new IconView({
          iconName: "d2_action_undo",
          states: true
        });
        this.inlineRowActionRegion.show(this.iconView);
        this.iconView.$el.attr("title", lang.undoTooltip);
        this.iconView.$el.on("click", function(event) {
          event.stopPropagation();
          event.preventDefault();
          this.model.collection.trigger("d2:undo:field:value", this.model);
        }.bind(this));
      }
      this.tableView.off("enterTableRow", undefined, this);
      this.tableView.off("leaveTableRow", undefined, this);
    },
    destroyIconView: function() {
      if (this.iconView) {
        this.iconView.destroy();
        delete this.iconView;
      }
    },
    createInlineMenu: function() {
      if (!this._inlineMenuView) {
        var actions = [], langPrefix = this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FOLDER_PROPERTIES ? "Folder" : this.model.get("massUpdateDocumentType") === constants.MassUpdateOptions.FILE_PROPERTIES ? "File" : "Item", count = this.model.get("d2_field_value_count");
        this.tableView.fieldType === "d2list" && actions.push({
          signature: "D2-ApplyPropertyToAllFiles",
          name: lang["applyToAll" + langPrefix + "s"]
        });
        actions.push({
          signature: "D2-RemovePropertyFromFiles",
          name: count === this.model.get("total_count") ? lang["removeFromAll" + langPrefix + "s"] : count === 1 ? lang["removeFromOne" + langPrefix] : lang["removeFromSome" + langPrefix + "s"],
          iconName: "d2_action_remove_from_files"
        });
        var inlineToolbar = new ToolItemsFactory({
          main: actions
        }, {
          maxItemsShown: 1,
          dropDownText: lang.moreActionsTooltip,
          dropDownIconName: "csui_action_more32"
        });
        this._inlineMenuView = new InlineMenuView({
          context: this.context,
          originatingView: this,
          model: this.model,
          commands: commands,
          tileViewToolbarItems: {
            inlineActionbar: inlineToolbar
          }
        });
        this.inlineRowActionRegion.show(this._inlineMenuView);
        if (this.model.get("d2_field_value_count") === this.model.get("total_count") || this.tableView.fieldType !== "d2list") {
          this._inlineMenuView.ui.moreToggle.trigger("click");
          this.clicking = true;
          setTimeout(function() {
            this.clicking = false;
          }.bind(this), 50);
        }
      }
    },
    destroyInlineMenu: function() {
      if (this._inlineMenuView && !this.isFocused && !base.isTouchBrowser()) {
        this._inlineMenuView.destroy();
        delete this._inlineMenuView;
      }
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-inline-mass-update-actions"
  });
  cellViewRegistry.registerByColumnKey("d2_inline_mass_update_actions", InlineMassUpdateActions);
  return InlineMassUpdateActions;
});