/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/log", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/commands", "csui/utils/commandhelper", "csui/controls/item.title/impl/otcdropdown.menu/menu.toolitem.view", "csui/controls/item.title/impl/otcdropdown.menu/submenu.toolitem.view", "csui/models/nodes", "csui/controls/toolbar/toolitems.filtered.model", "hbs!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu", "i18n!csui/widgets/metadata/impl/nls/lang", "hbs!csui/widgets/metadata/impl/header/dropdown.menu/lazy.loading.template", "csui/utils/base", "csui/controls/globalmessage/globalmessage", "csui/themes/csui.jato.action.icons", "smart/themes/theming", "css!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu" ], function(module, $, _, log, Backbone, Marionette, commands, CommandHelper, MenuToolItemView, SubMenuToolItemView, NodeCollection, FilteredToolItemsCollection, template, lang, lazyloadingTemplate, base, GlobalMessage, JatoIcons, theming) {
  "use strict";
  log = log(module.id);
  const DropdownMenuView = Marionette.CompositeView.extend({
    className: "cs-dropdown-menu",
    template: template,
    getChildView: function(item) {
      return item.get("flyout") ? SubMenuToolItemView : MenuToolItemView;
    },
    childViewContainer: "otc-menu",
    childViewOptions: function(model) {
      return {
        role: "none",
        command: this.collection.commands && this.collection.commands.findWhere({
          signature: model.get("signature")
        })
      };
    },
    templateHelpers: function() {
      return {
        hasCommands: !!this.collection.length,
        buttonID: _.uniqueId("dropdownMenuButton"),
        isJATO: theming.isJATOTheme(),
        iconSVG: JatoIcons.actionChevronSmallDown,
        showMoreTooltip: lang.showMore,
        showMoreAria: _.str.sformat(lang.showMoreAria, this.model.get("name"))
      };
    },
    ui: {
      dropdownToggle: ".cs-dropdown-button",
      dropdownMenu: "otc-menu",
      loadingIconsDiv: ".csui-loading-parent-wrapper"
    },
    events: {
      "keydown @ui.dropdownToggle": "_onToggleKeyDown",
      "keydown @ui.dropdownMenu": "_onMenuKeyDown",
      "click @ui.dropdownToggle": "_onToggleClick"
    },
    constructor: function DropdownMenuView(options) {
      var status = {
        nodes: new NodeCollection([ options.model ]),
        container: options.container,
        containerCollection: options.containerCollection,
        context: options.context
      };
      options.status = status;
      this.commands = options.commands || commands;
      options.collection = new FilteredToolItemsCollection(options.toolItems, {
        status: status,
        commands: this.commands,
        delayedActions: options.containerCollection && options.containerCollection.delayedActions,
        mask: options.toolItemsMask
      });
      options.reorderOnSort = true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, _.defaults(options.toolItems.options, {
        refilterOnShow: true
      }));
      this.originatingView = options.originatingView;
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction).listenTo(this, "dom:refresh", this._onDomRefresh).listenTo(this.model, "sync", this.render).listenTo(Backbone, "closeToggleAction", this._closeToggle).listenTo(this.model, "change", this.render);
      if (this.model.delayedActions) {
        this.listenTo(this.model.delayedActions, "request", this._hide).listenTo(this.model.delayedActions, "sync error", this._show);
      }
    },
    _updateMenuItems: function() {
      this.collection.silentFetch = true;
      this.fetchingNonPromotedActions = false;
      this.collection.refilter();
      this.render();
    },
    _onToggleClick: function() {
      this.options.refilterOnShow && this.options.collection?.refilter();
      this.ui.dropdownMenu.children(":first").focus();
    },
    _onToggleKeyDown: function(event) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        this._onToggleClick();
      }
    },
    _onMenuKeyDown: function(event) {
      event.stopPropagation();
    },
    _onDomRefresh: function() {
      this.ui.dropdownToggle.attr("tabindex", "0");
    },
    onRender: function() {
      if (this.model.delayedActions && this.model.delayedActions.fetching) {
        this._hide();
      }
      if (!this.collection.length) {
        var node = this.options.model ? this.options.model : this.model, lazyActionsRetrieved = !!node && !!node.get("csuiLazyActionsRetrieved"), isLocallyCreatedNode = !!node && !!node.isLocallyCreated;
        if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands && node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
          this.ui.dropdownToggle.addClass("binf-hidden");
          this.ui.loadingIconsDiv.removeClass("binf-hidden");
          this.fetchingNonPromotedActions = true;
          node.setEnabledLazyActionCommands(true).done(_.bind(function() {
            this.fetchingNonPromotedActions = false;
            var blockingElement = this.$el.find(".csui-loading-parent-wrapper");
            blockingElement.animate("width: 0", 300, _.bind(function() {
              blockingElement.addClass("binf-hidden");
              this.ui.dropdownToggle.removeClass("binf-hidden");
              this._updateMenuItems();
            }, this));
          }, this));
        }
      } else {
        this.fetchingNonPromotedActions = false;
        const renderLazyActions = _.bind(function() {
          var self = this;
          var node = this.options.model ? this.options.model : this.model, lazyActionsRetrieved = !!node && !!node.get("csuiLazyActionsRetrieved"), isLocallyCreatedNode = !!node && !!node.isLocallyCreated, promise;
          if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands && node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
            this.fetchingNonPromotedActions = true;
            this.ui.dropdownMenu.append(lazyloadingTemplate);
            if (node.delayedActions.fetching) {
              promise = node.delayedActions.fetching;
            } else {
              promise = node.setEnabledLazyActionCommands(true);
            }
            promise.done(function(node) {
              self.fetchingNonPromotedActions = false;
              var newCollection = new FilteredToolItemsCollection(self.options.toolItems, {
                status: self.options.status,
                commands: self.commands,
                delayedActions: self.options.containerCollection && self.options.containerCollection.lazyActions,
                lazyActions: self.options.containerCollection && self.options.containerCollection.lazyActions,
                mask: self.options.toolItemsMask
              });
              const blockingEle = self.ui.dropdownMenu.find("otc-menuplaceholder");
              blockingEle.animate("width: 0", 300, function() {
                blockingEle.remove();
                _.filter(newCollection.models, function(model) {
                  if (self.isDestroyed === true || self._isDestroyed) {
                    self.children = undefined;
                  } else {
                    var signature = model.get("signature");
                    if (!self.collection.find({
                      signature: signature
                    })) {
                      self.collection.models.push(model);
                      var lazyToolItemView = self.addChild(model, MenuToolItemView);
                      lazyToolItemView.renderTextOnly();
                    } else {
                      var currModel = self.collection.find({
                        signature: signature
                      });
                      if (model.get("flyout") && currModel.toolItems.length !== model.toolItems.length) {
                        currModel.toolItems.reset(model.toolItems.models);
                      }
                    }
                  }
                });
              });
            }).fail(function(request) {
              self.fetchingNonPromotedActions = false;
              const blockingEle = self.ui.dropdownMenu.find("otc-menuplaceholder"), error = new base.Error(request);
              blockingEle.length && blockingEle.remove();
              GlobalMessage.showMessage("error", error.message);
            });
          }
        }, this);
        this.ui.dropdownMenu.on("open", renderLazyActions);
        this.delegateEvents();
      }
    },
    onRenderCollection: function() {
      if (this.collection.length && this.fetchingNonPromotedActions) {
        const loadingIconsDiv = this.ui.dropdownMenu.find("otc-menuplaceholder");
        loadingIconsDiv.length && loadingIconsDiv.remove();
        this.ui.dropdownMenu.append(lazyloadingTemplate);
      }
    },
    _hide: function() {
      this.$el.addClass("binf-invisible");
    },
    _show: function() {
      this.$el.removeClass("binf-invisible");
    },
    _triggerMenuItemAction: function(toolItemView, args) {
      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([ this.model ]),
        container: this.options.container,
        collection: this.options.containerCollection,
        originatingView: this.options.targetView ? this.options.targetView : this.originatingView,
        showPermissionView: !!this.options.showPermissionView,
        noMetadataNavigation: this.options.noMetadataNavigation,
        toolItem: toolItem,
        data: toolItem.get("commandData") || {}
      };
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        } else if (_.isFunction(command.execute)) {
          var promise = command.execute(status);
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
  return DropdownMenuView;
});