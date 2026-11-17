/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/log", "csui/utils/base", "csui/controls/tableactionbar/toolitem.v1/toolitem.v1.view", "csui/controls/toolbar/otctoolbar/otctoolitem.view", "smart/themes/theming", "csui/models/nodes", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/toolbar/otctoolbar/otcflyout.toolitem.view", "csui/controls/toolbar/toolbar.state.behavior", "csui/utils/commandhelper", "csui/utils/commands", "csui/utils/high.contrast/detector!", "hbs!csui/controls/tableactionbar/impl/tableactionbar", "hbs!csui/controls/tableactionbar/impl/lazy.loading.template", "csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin", "csui-ext!csui/controls/tableactionbar/tableactionbar.view", "css!csui/controls/tableactionbar/impl/tableactionbar" ], function(module, _, $, Backbone, Marionette, log, base, ToolItemV1View, ToolItemView, theming, NodeCollection, FilteredToolItemsCollection, FlyoutToolItemView, ToolbarStateBehavior, CommandHelper, commands, highContrast, template, lazyLoadingTemplate, DynamicToolItemsMixin, inlineMenuExtensions) {
  "use strict";
  log = log(module.id);
  var TableActionBarView = Marionette.CompositeView.extend({
    className: "csui-table-actionbar",
    template: template,
    getChildView: function(item) {
      const itemIndex = this.collection.models.indexOf(item);
      const toolItemView = !theming.isJATOTheme() && !item.get("iconName") && item.get("icon") && itemIndex < this.options.maxItemsShown ? ToolItemV1View : ToolItemView;
      return item.get("flyout") ? FlyoutToolItemView : toolItemView;
    },
    childViewOptions: function(model) {
      return {
        model: model,
        command: this.commands && this.commands.findWhere({
          signature: model.get("signature")
        }),
        useIconsForDarkBackground: this._useIconsForDarkBackground,
        isInlineActionToolItem: true
      };
    },
    behaviors: {
      ToolbarState: {
        behaviorClass: ToolbarStateBehavior
      }
    },
    ui: {
      otctoolbar: "otc-toolbar"
    },
    events: {
      "open otc-toolbar": "_onOpen"
    },
    templateHelpers: function() {
      return {
        maxItemsShown: this.options.maxItemsShown,
        size: theming.isJATOTheme() ? "small" : "regular",
        overflowMenuLabel: this.options.dropDownText,
        iconAppearance: this._useIconsForDarkBackground ? "light" : "dark"
      };
    },
    childViewContainer: "otc-toolbar",
    constructor: function TableActionBarView(options) {
      this.container = options.container;
      this.containerCollection = options.containerCollection;
      this.originatingView = options.originatingView;
      this.commandExecutionOptions = options.commandExecutionOptions;
      this.context = options.context;
      this.minimalItemsRequiredForDisplay = 1;
      this._useIconsForDarkBackground = options.useIconsForDarkBackground && highContrast !== 2 || highContrast === 1;
      this.notOccupiedSpace = options.notOccupiedSpace === undefined ? 120 : options.notOccupiedSpace;
      options.status || (options.status = {});
      var status = _.defaults(options.status, {
        nodes: new NodeCollection([ options.model ]),
        container: this.container,
        context: this.context
      });
      this.commands = options.commands || commands;
      var toolItemFactory = options.collection;
      options.collection = new FilteredToolItemsCollection(options.collection, {
        status: status,
        commands: this.commands,
        delayedActions: options.delayedActions,
        mask: options.toolItemsMask
      });
      this.renderLazyActions = options.hasOwnProperty("lazyActions") ? !!options.lazyActions : true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this.options.afterAdjustEvent = "render:collection";
      if (inlineMenuExtensions) {
        inlineMenuExtensions.forEach(entryPoint => entryPoint(this));
      }
      this.makeDynamicToolItems({
        model: this.model,
        toolbarItems: {
          inlineActionbar: toolItemFactory
        },
        toolbarNames: [ "inlineActionbar" ],
        eventArgs: {
          context: this.options.context,
          container: this.container,
          model: this.model,
          originatingView: this.options.originatingView
        }
      });
    },
    isEmpty: function() {
      return this.collection.length === 0;
    },
    onBeforeDestroy: function() {
      this.originatingView = null;
      this.collection.stopListening();
    },
    onBeforeRenderCollection: function() {
      this.destroyChildren();
      if (this.$childViewContainer) {
        this.$childViewContainer.empty();
      }
    },
    onRenderCollection: function() {
      this._adjusted = false;
      !this.isEmpty() && this.el.classList.remove("binf-hidden");
      if (base.isVisibleInWindowViewport(this.$el)) {
        this._layoutButtons();
      }
    },
    onRender: function() {
      if (this.options.inlineBarStyle) {
        this.el.classList.add(this.options.inlineBarStyle);
      }
      if (this._isBlocked) {
        this.el.disabled = true;
      }
      this.isEmpty() && this.el.classList.add("binf-hidden");
    },
    onShow: function() {
      if (this.options.removeTypeInlineactions) this.$childViewContainer.removeAttr("type");
      this._layoutButtons();
    },
    _layoutButtons: function() {
      var delayedActions = this.options.delayedActions;
      if (delayedActions && (delayedActions.fetching || delayedActions.error)) {
        return;
      }
      var node = this.model, lazyActionsRetrieved = !!node && !!node.get("csuiLazyActionsRetrieved"), isLocallyCreatedNode = !!node.isLocallyCreated, itemViews = this.children.filter(function(view) {
        return view instanceof ToolItemView || view instanceof FlyoutToolItemView;
      });
      if (itemViews.length > 0) {
        const containerEl = this.$el.parent().offsetParent();
        if (containerEl.length > 0) {
          let availableWidth = containerEl[0].clientWidth - this.notOccupiedSpace;
          const childViewEl = this.el.querySelectorAll("otc-toolbaritem");
          if (availableWidth < 0 || childViewEl && childViewEl[0].clientWidth > availableWidth) {
            this.destroy();
            return;
          }
          this._setActionBarContainerWidth(availableWidth);
        }
      }
      const toolbarEl = this.el.querySelector("otc-toolbar");
      const hasOverflowMenu = toolbarEl.childElementCount > toolbarEl.maxItems;
      if (!hasOverflowMenu && !!node && !lazyActionsRetrieved && node.nonPromotedActionCommands && this.renderLazyActions && node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
        if (itemViews.length > 0) this.ui.otctoolbar.append(lazyLoadingTemplate);
        this._renderLazyActions().always(_.bind(function() {
          this._checkInlineActionBarShouldAlive();
        }, this));
      } else {
        this._checkInlineActionBarShouldAlive();
      }
    },
    _checkInlineActionBarShouldAlive: function() {
      !this.collection.length && this.destroy();
    },
    _setActionBarContainerWidth: function(availableWidth) {
      const toolbarEl = this.el.querySelector("otc-toolbar");
      if (toolbarEl && toolbarEl.updateComplete) {
        toolbarEl.updateComplete.then(() => {
          this.el.style.maxWidth = `${availableWidth}px`;
        });
      }
    },
    _renderLazyActions: function() {
      const self = this, node = this.model, derferred = $.Deferred();
      !!node && node.setEnabledLazyActionCommands(true).done(_.bind(function() {
        function refilterAndResolve() {
          if (self.isDestroyed === true || self._isDestroyed) {
            return;
          }
          self.collection.refilter({
            reset: false
          });
          !self.isEmpty() && self.el.classList.remove("binf-hidden");
          derferred.resolve();
        }
        const blockingEle = self.el.querySelector("otc-toolbarplaceholder");
        if (blockingEle) {
          setTimeout(() => {
            blockingEle.remove();
            refilterAndResolve();
          }, 1e3);
        } else {
          refilterAndResolve();
        }
      }), self).fail(function() {
        const blockingEle = self.el.querySelector("otc-toolbarplaceholder");
        blockingEle && blockingEle.remove();
        derferred.reject();
      });
      return derferred.promise();
    },
    _setBlocked: function(command, toolItemView) {
      var self = this;
      this._blockedTimer = setTimeout(function() {
        if (self._isBlocked === false) {
          self.el.disabled = false;
        }
        self._blockedTimer = undefined;
      }, 500);
      this._isBlocked = true;
      command.get("selfBlockOnly") ? toolItemView.el.disabled = true : this.el.disabled = true;
    },
    _setUnblocked: function(command, toolItemView) {
      this._isBlocked = false;
      if (!this._blockedTimer) {
        command.get("selfBlockOnly") ? toolItemView.el.disabled = false : this.el.disabled = false;
      }
    },
    _onOpen: function() {
      const node = this.model, lazyActionsRetrieved = !!node && !!node.get("csuiLazyActionsRetrieved"), isLocallyCreatedNode = !!node.isLocallyCreated;
      if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands && this.renderLazyActions && node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
        this._removeLazyLoading();
        this._appendLazyLoading();
        this._renderLazyActions();
      }
    },
    _appendLazyLoading: function() {
      const toolbarEl = this.el.querySelector("otc-toolbar");
      if (toolbarEl) {
        const flyoutToolItem = toolbarEl.querySelector("otc-toolbaritem[menuopen]");
        if (flyoutToolItem) {
          flyoutToolItem.insertAdjacentHTML("beforeend", lazyLoadingTemplate());
          return;
        }
      }
      this.ui.otctoolbar.append(lazyLoadingTemplate);
    },
    _removeLazyLoading: function() {
      const blockingEle = this.el.querySelector("otc-toolbarplaceholder");
      blockingEle && blockingEle.remove();
    },
    closeDropdownMenuIfOpen: function() {
      const otcToolbarEl = this.el.querySelector("otc-toolbar");
      if (otcToolbarEl && otcToolbarEl.overflowMenuIsOpen) otcToolbarEl.overflowMenuIsOpen = false;
    },
    onChildviewToolitemAction: function(toolItemView, args) {
      var self = this;
      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = _.defaults(this.options.status, {
        nodes: new NodeCollection([ this.model ]),
        container: this.container,
        originatingView: this.originatingView,
        context: this.context
      });
      status.collection = this.containerCollection;
      status = _.defaults({
        toolItem: toolItem,
        data: toolItem.get("commandData") || {}
      }, status);
      var eventArgs = {
        status: status,
        commandSignature: signature
      };
      this.originatingView.trigger("click:actionbar:command", eventArgs);
      if (toolItem.get("execute") === false || !command.execute) {
        eventArgs.execute = false;
        eventArgs.toolItem = toolItem;
        this.trigger("before:execute:command", eventArgs);
        this.trigger("click:toolitem:action", eventArgs);
        return this.trigger("after:execute:command", eventArgs);
      }
      this.trigger("before:execute:command", eventArgs);
      this._setBlocked(command, toolItemView);
      Backbone.trigger("closeToggleAction");
      var promiseFromCommand;
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }
        promiseFromCommand = command.execute(status, this.commandExecutionOptions);
      } catch (error) {
        self._setUnblocked(command, toolItemView);
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
        eventArgs.error = error;
        return this.trigger("after:execute:command", eventArgs);
      }
      if (!promiseFromCommand) {
        self._setUnblocked(command, toolItemView);
        return this.trigger("after:execute:command", eventArgs);
      }
      CommandHelper.handleExecutionResults(promiseFromCommand, {
        command: command,
        suppressSuccessMessage: status.suppressSuccessMessage,
        suppressFailMessage: status.suppressFailMessage,
        customError: this.options.customError
      }).done(function(nodes) {
        if (!!command.allowCollectionRefetch && self.options.originatingView.collection.totalCount >= self.options.originatingView.collection.topCount) {
          var collectionData = self.options.originatingView.collection;
          if (collectionData.skipCount !== 0 && collectionData.totalCount === collectionData.skipCount) {
            collectionData.setLimit(collectionData.skipCount - collectionData.topCount, collectionData.topCount, false);
          }
          self.options.originatingView._fetchCollection();
        }
      }).always(function() {
        self._setUnblocked(command, toolItemView);
        self.trigger("after:execute:command", eventArgs);
      });
    }
  }, {
    estimateWidthForToolbarItems: function(minNumberOfToolbarItems, fontSize) {
      var leftMargin = .1875 * fontSize;
      var rightMargin = leftMargin;
      var leftBorder = (fontSize * 4 - 36) / 2;
      var rightBorder = leftBorder;
      var iconMargin = 2;
      var width = leftBorder + leftMargin + minNumberOfToolbarItems * this.estimateIconWidth(fontSize) + (minNumberOfToolbarItems - 1) * iconMargin + rightMargin + rightBorder;
      return width;
    },
    estimateIconWidth: function(fontSize) {
      var iconWidth = fontSize * 2 + 4;
      var iconPadding = fontSize * .1;
      return iconWidth + iconPadding;
    }
  });
  DynamicToolItemsMixin.mixin(TableActionBarView.prototype);
  return TableActionBarView;
});