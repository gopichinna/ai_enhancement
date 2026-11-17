/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/log", "csui/controls/toolbar/toolitem.view", "csui/controls/progressblocker/blocker", "csui/models/nodes", "csui/controls/toolbar/toolitems.filtered.model", "csui/utils/commands", "csui/controls/otc.menu/menu.items.view", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "hbs!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu", "i18n!csui/widgets/metadata/impl/nls/lang", "css!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu" ], function(module, $, _, Backbone, Marionette, log, ToolItemView, BlockingView, NodeCollection, FilteredToolItemsCollection, commands, MenuItemsView, theming, JatoIcons, template, lang) {
  "use strict";
  log = log(module.id);
  const AddPropertiesDropdownMenuView = Marionette.LayoutView.extend({
    className: "metadata-add-properties",
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        iconSVG: JatoIcons.actionAdd,
        iconName: "csui_action:action_add32",
        addTitleTooltip: this.collection.length === 1 ? this.collection.at(0).get("name") : lang.addNewProperties
      };
    },
    ui: {
      button: "otc-button",
      menu: "otc-menu"
    },
    regions: {
      menuRegion: "otc-menu"
    },
    constructor: function AddPropertiesDropdownMenuView(options = {}) {
      this.context = options.context;
      this.commands = options.commands || commands;
      this.node = options.node;
      this.container = options.container;
      this.formCollection = options.collection;
      this.originalFormCollection = options.formCollection;
      this.listenTo(this.formCollection, "reset", this._updateMenuItems);
      this.buttonId = _.uniqueId("addPropertiesButton");
      this.originatingView = options.originatingView;
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      var status = {
        nodes: new NodeCollection([ options.node ]),
        container: options.container,
        formCollection: this.formCollection,
        originalFormCollection: this.originalFormCollection,
        context: options.context
      };
      var toolbarName = "addPropertiesToolbar";
      var toolItemFactory = options.toolbarItems[toolbarName];
      options.collection = new FilteredToolItemsCollection(toolItemFactory, {
        status: status,
        commands: this.commands,
        delayedActions: options.containerCollection && options.containerCollection.delayedActions,
        mask: options.toolbarItemsMask
      });
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this.listenTo(this.node.actions, "sync update", this._reRender);
      if (options.containerCollection && options.containerCollection.delayedActions) {
        this.listenTo(options.containerCollection.delayedActions, "sync", this._reRender);
      }
      this.listenTo(this.node, "sync change", function() {
        this.node.set("csuiAddPropertiesActionsRetrieved", false, {
          silent: true
        });
      });
    },
    _updateMenuItems: function() {
      this.collection.refilter();
    },
    _reRender: function() {
      if (this._isRendered && !this._isRendering && !this.isDestroyed) {
        this._updateMenuItems();
        this.render();
      }
    },
    onRender: function() {
      if (this._isRendering) {
        return;
      }
      this._isRendering = true;
      this._ensureLazyActionsRetrieved().always(_.bind(function() {
        this._isRendering = false;
      }, this)).done(_.bind(function() {
        if (!this.isRendered) {
          return;
        }
        if (this.collection.length < 1 || this.options.suppressAddProperties === true) {
          this.ui.button.addClass("binf-hidden");
          this.ui.button.attr("data-cstabindex", "-1");
        } else {
          $(this.ui.button)?.removeClass("binf-hidden");
          this.ui.button.attr("data-cstabindex", "0");
          if (this.collection.length === 1) {
            this.ui.button.removeAttr("id");
            this.ui.menu.removeAttr("buttonid");
            this.ui.menu.addClass("binf-hidden");
            var addNewCat = this.collection.at(0).get("name");
            this.ui.button.attr({
              arialabel: addNewCat,
              title: addNewCat
            });
          }
          this.ui.button[0].addEventListener("click", _.bind(this._onClickAddButton, this));
          this.ui.button[0].addEventListener("keydown", event => {
            if (event.key === " " || event.key === "Enter") {
              this._onClickAddButton(event);
            }
          });
        }
        if (this.collection.length > 1) {
          this.menuCollection = new Backbone.Collection();
          for (let i = 0; i < this.collection.length; i++) {
            const model = this.collection.at(i);
            if (model.isSeparator()) {
              model.set("overrideChildElm", "otc-menudivider", {
                silent: true
              });
            }
            model.set("displayName", model.get("name"), {
              silent: true
            });
            this.menuCollection.add(model);
          }
          this.addPropertiesMenuItemsView = new MenuItemsView({
            collection: this.menuCollection,
            childElm: "otc-menuitem"
          });
          this.menuRegion.show(this.addPropertiesMenuItemsView);
          this.listenTo(this.addPropertiesMenuItemsView, "change:selection", this._executeAction);
          this.ui.button.attr("id", this.buttonId);
          this.ui.menu.attr("buttonid", this.buttonId);
        }
        var self = this;
        setTimeout(function() {
          var event = $.Event("tab:content:render");
          self.$el.trigger(event);
        }, 200);
      }, this)).fail(_.bind(function() {
        this.$el.addClass("binf-hidden");
        this.ui.button.attr("data-cstabindex", "-1");
      }, this));
    },
    _onClickAddButton: function(event) {
      if (this.collection.length === 1) {
        Backbone.trigger("closeToggleAction");
        this._executeAction({
          itemValue: this.collection.at(0)
        });
      }
    },
    _executeAction: function({
      itemValue: toolItem
    }) {
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var executeOptions = {
        action: this.options.action,
        node: this.options.node,
        collection: this.formCollection,
        container: this.options.container,
        inheritance: this.options.inheritance,
        context: this.options.context,
        parentView: this.options.parentView,
        addPropertiesCallback: this.options.addPropertiesCallback,
        isKeyEvent: toolItem?.get("isKeyEvent")
      };
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([ this.node ]),
        container: this.options.container,
        formCollection: this.formCollection,
        originalFormCollection: this.originalFormCollection,
        originatingView: this.originatingView
      };
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }
        var el = this.ui.button;
        el.attr("disabled", true);
        command.execute(status, executeOptions).done(_.bind(function(resp) {
          el.removeAttr("disabled");
          el.closest(".tab-links").find(".tab-links-bar ul li.binf-active a").trigger("focus");
        }, this)).fail(function(error) {
          el.removeAttr("disabled");
          if (error && error.cancelled) {
            el.trigger("focus");
          }
        });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
      }
    },
    _ensureLazyActionsRetrieved: function() {
      var deferred = $.Deferred(), node = this.options.node, lazyActionsAreRetrieved = !!node.get("csuiLazyActionsRetrieved"), addPropertiesActionsAreRetrieved = !!node.get("csuiAddPropertiesActionsRetrieved"), isNodeLocallyCreated = !node.get("id"), nonPromotedCommands = node.nonPromotedActionCommands;
      var actionsCommands, actionsAreRetrieved = lazyActionsAreRetrieved && addPropertiesActionsAreRetrieved;
      if (this.options.toolbarItems && nonPromotedCommands && !node.lazyActionsDisabled) {
        if (!lazyActionsAreRetrieved) {
          var additionalPropertiesCommands = commands.getSignatures(this.options.toolbarItems);
          if (additionalPropertiesCommands.length) {
            actionsCommands = nonPromotedCommands = node.nonPromotedActionCommands = _.union(additionalPropertiesCommands, node.nonPromotedActionCommands);
          }
        } else if (!addPropertiesActionsAreRetrieved) {
          actionsCommands = commands.getSignatures(this.options.toolbarItems);
        }
      }
      function fetchActionsCommands() {
        if (!lazyActionsAreRetrieved) {
          return node.setEnabledLazyActionCommands(true);
        } else if (!addPropertiesActionsAreRetrieved) {
          return node.getAdditionalActionCommands(actionsCommands, "csuiAddPropertiesActionsRetrieved");
        } else {
          return $.Deferred().reject().promise();
        }
      }
      if (!!node && !isNodeLocallyCreated && !actionsAreRetrieved && actionsCommands && actionsCommands.length) {
        var self = this;
        this.ui.button.addClass("binf-hidden");
        this.$el.find(".csui-loading-parent-wrapper").removeClass("binf-hidden");
        fetchActionsCommands().done(function() {
          setTimeout(function() {
            self.$el.find(".csui-loading-parent-wrapper").addClass("binf-hidden");
            self._updateMenuItems();
            deferred.resolve();
          }, 300);
        }).fail(function() {
          this.ui.button.removeClass("binf-hidden");
          deferred.reject();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });
  return AddPropertiesDropdownMenuView;
});