/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/controls/item.title/impl/otcdropdown.menu/menu.toolitem.view", "csui/models/nodes", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/item.title/impl/otcdropdown.menu/submenu.toolitem.view", "csui/utils/commands", "csui/utils/commandhelper", "csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin", "csui-ext!csui/controls/item.title/dropdown.menu/dropdown.menu.view", "csui/utils/log", "hbs!csui/controls/item.title/impl/otcdropdown.menu/dropdown.menu", "i18n!csui/controls/item.title/impl/nls/localized.strings", "csui/themes/csui.jato.action.icons", "smart/themes/theming", "css!csui/controls/item.title/impl/dropdown.menu/dropdown.menu" ], function(module, $, _, Marionette, MenuToolItemView, NodeCollection, FilteredToolItemsCollection, SubMenuToolItemView, commands, CommandHelper, DynamicToolItemsMixin, dropdownMenuExtensions, log, template, lang, JatoIcons, theming) {
  "use strict";
  log = log(module.id);
  const DropdownMenuView = Marionette.CompositeView.extend({
    className: "csui-item-title-dropdown-menu",
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        btnId: _.uniqueId("dropdownMenuButton"),
        buttonIcon: JatoIcons.actionChevronSmallDown,
        showMoreTooltip: lang.showMore,
        showMoreAria: _.str.sformat(lang.showMoreAria, this.model.get("name"))
      };
    },
    getChildView: function(item) {
      return item.get("flyout") ? SubMenuToolItemView : MenuToolItemView;
    },
    childViewContainer: "otc-menu",
    childViewOptions: function(model) {
      return {
        command: this.collection.commands && this.collection.commands.findWhere({
          signature: model.get("signature")
        })
      };
    },
    ui: {
      dropdownToggle: ".item-title-menu-button",
      dropdownMenu: "otc-menu"
    },
    events: {
      "click .item-title-menu-button": "_handleToggleClick",
      "open otc-menu": "_handleMenuOpen"
    },
    constructor: function DropdownMenuView(options) {
      options.collection = new FilteredToolItemsCollection(options.toolItems, {
        status: this._createCommandStatus(options),
        commands: this.commands,
        mask: options.toolItemsMask
      });
      options.reorderOnSort = true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, _.defaults(options.toolItems.options, {
        refilterOnShow: true
      }));
      this.commands = options.commands || commands;
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction).listenTo(this.model, "sync", this.render).listenTo(this.model, "change", this.render).listenTo(this.options.collection, "add remove reset", this._setCaretVisibility);
      if (this.model.delayedActions) {
        this.listenTo(this.model.delayedActions, "request", this._hide).listenTo(this.model.delayedActions, "sync error", this._show);
      }
      if (this.model.actions) {
        this.listenTo(this.model.actions, "update", this.render);
      }
      if (dropdownMenuExtensions) {
        dropdownMenuExtensions.forEach(entryPoint => entryPoint(this));
      }
      this.makeDynamicToolItems({
        model: this.model,
        toolbarItems: {
          headerMenuToolbar: this.options.toolItems
        },
        toolbarNames: [ "headerMenuToolbar" ],
        eventArgs: {
          context: this.options.context,
          model: this.model,
          originatingView: this.options.originatingView
        }
      });
    },
    _createCommandStatus: function(options) {
      return {
        nodes: new NodeCollection([ options.model ]),
        container: options.model,
        context: options.context
      };
    },
    _updateCollectionStatus: function() {
      const status = this._createCommandStatus(this.options);
      this.options.collection.setStatus(status);
    },
    _handleToggleClick: function() {
      this.options.refilterOnShow && this.options.collection?.refilter();
    },
    _handleMenuOpen: function() {
      theming.isJATOTheme() && this.ui.dropdownToggle.attr("menuOpen", true);
    },
    _setCaretVisibility: function() {
      if (this.options.collection.length === 0) {
        this.$el.addClass("binf-hidden");
      } else {
        this.$el.removeClass("binf-hidden");
      }
    },
    onBeforeRender: function() {
      this._updateCollectionStatus();
      this._setCaretVisibility();
    },
    onRender: function() {
      if (this.model.delayedActions && this.model.delayedActions.fetching) {
        this._hide();
      }
    },
    _hide: function() {
      this.$el.addClass("binf-invisible");
    },
    _show: function() {
      this.$el.removeClass("binf-invisible");
    },
    _triggerMenuItemAction: function(toolItemView, args) {
      const toolItem = args.toolItem;
      const signature = toolItem.get("signature");
      const command = this.commands.get(signature);
      const status = {
        context: this.options.context,
        nodes: new NodeCollection([ this.model ]),
        container: this.model,
        originatingView: this.options.originatingView,
        collection: this.options.originatingView.collection
      };
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        } else if (_.isFunction(command.execute)) {
          const promise = command.execute(status);
          CommandHelper.handleExecutionResults(promise, {
            command: command,
            suppressSuccessMessage: status.suppressSuccessMessage,
            suppressFailMessage: status.suppressFailMessage
          });
        } else {
          this.trigger(signature.toLowerCase(), this);
        }
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
      }
    }
  });
  DynamicToolItemsMixin.mixin(DropdownMenuView.prototype);
  return DropdownMenuView;
});