/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/controls/toolbar/otctoolbar/otctoolitem.view", "csui/controls/toolbar/otctoolbar/otcflyout.toolitem.view", "csui/controls/toolbar/otctoolbar/otctoolitems.view", "csui/models/nodes", "hbs!csui/controls/toolbar/otctoolbar/impl/lazy.loading.template", "csui/utils/base", "csui/utils/high.contrast/detector!", "csui/controls/mixins/dynamic.toolitems/reopening.toolbar.mixin", "csui/controls/globalmessage/globalmessage", "csui/controls/icons.v2", "css!csui/controls/toolbar/otctoolbar/impl/toolbar" ], function(_, $, Backbone, OTCToolItemView, OTCFlyoutToolItemView, OTToolItemsView, NodeCollection, lazyloadingTemplate, base, highContrast, ReopeningToolbarMixin, GlobalMessage, iconRegistry) {
  "use strict";
  var OTCToolbarView = OTToolItemsView.extend({
    parentScrollElement: ".csui-metadata-myattachments",
    className: function() {
      let cssClassForNavigationBar = "binf-nav binf-nav-pills ";
      let cssClassForAlignment = "csui-align-left";
      if (this.options.hAlign) {
        if (this.options.hAlign === "right") {
          cssClassForAlignment = "csui-align-right";
        } else if (this.options.hAlign === "none") {
          cssClassForAlignment = "";
        }
      }
      return "csui-toolbar " + cssClassForNavigationBar + cssClassForAlignment;
    },
    events: {
      keydown: "onKeyInView"
    },
    childViewOptions: function(model) {
      return _.extend(OTToolItemsView.prototype.childViewOptions.call(this, model), {
        collection: model.toolItems,
        command: this.collection.commands && this.collection.commands.findWhere({
          signature: model.get("signature")
        }),
        useIconsForDarkBackground: this._useIconsForDarkBackground
      });
    },
    constructor: function OTCToolbarView(options) {
      options || (options = {});
      this.parentScrollElement = options.parentScrollElement || this.parentScrollElement;
      OTCToolbarView.__super__.constructor.apply(this, arguments);
      this.options.onRefilterReopen && this.makeReopeningToolbar();
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this._useIconsForDarkBackground = options.useIconsForDarkBackground && highContrast !== 2 || highContrast === 1;
      this.listenTo(this, "render:collection dom:refresh", this._updateToolbar).listenTo(this, "before:execute:command", this._setBlocked).listenTo(this, "after:execute:command", this._setUnblocked);
      if (options.keyboardNavigationEnabled) {
        this._keyboardNavigationEnabled = true;
        this.listenTo(this.collection, "remove", function() {
          if (this._accFocusedToolbarItemIndex > this.collection.length - 1) {
            this._accFocusedToolbarItemIndex = this.collection.length - 1;
          }
        });
        this.listenTo(this.collection, "reset", function() {
          this._accFocusedToolbarItemIndex = this.collection.length > 0 ? 0 : -1;
        });
        this._accFocusedToolbarItemIndex = this.collection.length > 0 ? 0 : -1;
      }
      this.fetchingNonPromotedActions = false;
    },
    filter: function(model) {
      return typeof model?.isSeparator === "function" ? !model.isSeparator() : model;
    },
    _updateToolbar: function() {
      if (!this._adjusting) {
        this._adjustToFit();
      }
    },
    onRender: function() {
      if (this._toolbarBlocked && !this._isSingleCommandBlocked) {
        this.$childViewContainer[0].setAttribute("disabled", true);
      }
    },
    onDestroy: function() {
      $(window).off("resize." + this.cid);
    },
    _getFocusedElementByIndex: function(index) {
      let n = index + 1;
      let el = this.$el.find(".csui-acc-focusable")[n];
      return el;
    },
    getVisibleToolitemsCount: function() {
      var el = this.$el.find(".csui-acc-focusable");
      return el.length;
    },
    currentlyFocusedElement: function() {
      if (this._keyboardNavigationEnabled && this._accFocusedToolbarItemIndex >= 0) {
        return this._getFocusedElementByIndex(this._accFocusedToolbarItemIndex);
      } else {
        return $();
      }
    },
    setFocusByIndex: function(index) {
      this._getFocusedElementByIndex(index)?.focus();
    },
    letRightmostItemGetFocus: function() {
      this._accFocusedToolbarItemIndex = this.collection.length - 1;
    },
    closeDropdown: function() {
      this.children.call("closeDropdown");
    },
    closeSubMenu: function() {
      this.children.call("closeSubMenu");
    },
    onKeyInView: function(event) {
      if (!this._keyboardNavigationEnabled) {
        return;
      }
      if (this.collection.length === 0) {
        return;
      }
      switch (event.keyCode) {
       case 37:
        event.stopPropagation();
        if (this._accFocusedToolbarItemIndex > 0) {
          this._accFocusedToolbarItemIndex = this._accFocusedToolbarItemIndex - 1;
          this.triggerMethod("changed:focus");
        } else {
          this._accFocusedToolbarItemIndex = 0;
          this.triggerMethod("focusout", {
            direction: "left"
          });
        }
        break;

       case 39:
        event.stopPropagation();
        if (this._accFocusedToolbarItemIndex < this.collection.length - 1) {
          this._accFocusedToolbarItemIndex = this._accFocusedToolbarItemIndex + 1;
          this.triggerMethod("changed:focus");
        } else {
          this._accFocusedToolbarItemIndex = this.collection.length - 1;
          this.triggerMethod("focusout", {
            direction: "right"
          });
        }
        break;
      }
    },
    _setBlocked: function(eventArgs) {
      var self = this, command = eventArgs.command, toolItemView = eventArgs.status && eventArgs.status.toolItemView, el = command?.get("selfBlockOnly") && toolItemView ? toolItemView.el : this.$childViewContainer[0];
      if (!command.get("allowMultipleInstances")) {
        this._blockedTimer = setTimeout(function() {
          if (self._toolbarBlocked === false) {
            el.removeAttribute("disabled");
          }
          self._blockedTimer = undefined;
        }, 500);
        this._toolbarBlocked = true;
        this._isSingleCommandBlocked = el !== this.$childViewContainer[0];
        el.setAttribute("disabled", true);
      }
    },
    _setUnblocked: function(eventArgs) {
      this._toolbarBlocked = false;
      var command = eventArgs.command, toolItemView = eventArgs.status && eventArgs.status.toolItemView, el = command?.get("selfBlockOnly") && toolItemView ? toolItemView.el : this.$childViewContainer[0];
      if (!this._blockedTimer) {
        el.removeAttribute("disabled");
        if (eventArgs && eventArgs.cancelled) {
          var targetToolItem = this.$el.find("[data-csui-command=" + eventArgs.commandSignature.toLowerCase() + "] a"), isUnderDropDown = targetToolItem.length ? targetToolItem.closest("ul.csui-more-dropdown-menu") : {};
          if (isUnderDropDown.length) {
            isUnderDropDown.siblings("a.binf-dropdown-toggle").trigger("focus");
          } else {
            targetToolItem.trigger("focus");
          }
        }
      }
    },
    _adjustToFit: function() {
      if (this._isActive === false) {
        return;
      }
      this.trigger("before:adjust");
      var itemViews = _.filter(this.children.toArray(), view => {
        return view instanceof OTCToolItemView || view instanceof OTCFlyoutToolItemView;
      });
      itemViews = _.sortBy(itemViews, "cid");
      if (!_.isUndefined(this.options.maxItemsShown)) {
        this._adjusting = true;
        if (this.children.length > 0) {
          this.options.lazyActions && this._loadLazyActions();
        }
        this._adjusting = false;
      } else {
        this._makeItemsFocusable(itemViews);
      }
      this.trigger("after:adjust");
    },
    _makeItemsFocusable: function(items) {
      _.each(items, function(toolItemView, index) {
        _.isFunction(toolItemView.makeFocusable) && toolItemView.$el.addClass("csui-acc-focusable");
      }, this);
    },
    _loadLazyActions: function() {
      var lazyActionsRetrieved = true;
      var isLocallyCreatedNode = true;
      var nonPromotedActionCommands = [];
      var selectedNodes;
      if (this.collection.status.nodes instanceof NodeCollection) {
        selectedNodes = this.collection.status.nodes;
      } else {
        if (this.collection.status.nodes instanceof Backbone.Collection) {
          selectedNodes = new NodeCollection(this.collection.status.nodes.models);
        } else {
          if (_.isArray(this.collection.status.nodes)) {
            selectedNodes = new NodeCollection(this.collection.status.nodes);
          } else {
            selectedNodes = new NodeCollection();
          }
        }
      }
      if (!selectedNodes.connector) {
        selectedNodes.connector = this.collection.status.collection.connector;
      }
      selectedNodes.each(function(selectedNode) {
        lazyActionsRetrieved = lazyActionsRetrieved && selectedNode.get("csuiLazyActionsRetrieved");
        isLocallyCreatedNode = isLocallyCreatedNode && selectedNode.isLocallyCreated;
        nonPromotedActionCommands = nonPromotedActionCommands.length ? nonPromotedActionCommands : selectedNode.nonPromotedActionCommands;
      });
      selectedNodes.nonPromotedActionCommands = nonPromotedActionCommands;
      selectedNodes.lazyActionsRetrieved = lazyActionsRetrieved;
      if (!lazyActionsRetrieved && !isLocallyCreatedNode && nonPromotedActionCommands.length) {
        if (!this.fetchingNonPromotedActions) {
          this._renderLazyActions(selectedNodes);
        }
        if (!this.ui.otctoolbar.find("otc-toolbarplaceholder").length) {
          const toolbarPlaceholderEl = this.ui.otctoolbar[0].querySelector("otc-toolbarplaceholder");
          toolbarPlaceholderEl && toolbarPlaceholderEl.remove();
          this.ui.otctoolbar[0].insertAdjacentHTML("beforeend", lazyloadingTemplate());
        }
      }
    },
    appendLazyActions: function() {
      var self = this, existingChildViews = _.sortBy(self.children.toArray(), view => parseInt(view.cid.substring(4))), index = 0, actionItems = _.filter(self.collection.models, function(model) {
        return model;
      });
      _.each(actionItems, function(model) {
        var existingChildView = existingChildViews[index], itemName = model.get("name");
        if (existingChildView && existingChildView.model.get("name") === itemName) {
          if (model.get("flyout") && model.toolItems.length !== existingChildView.model.toolItems.length) {
            existingChildView.collection.reset(model.toolItems.models);
          }
          index++;
        } else {
          if (self.options.toolbarItemViewOptions) {
            self.options.toolbarItemViewOptions.index++;
            var childViewClass = model.get("flyout") ? OTCFlyoutToolItemView : OTCToolItemView, lazyToolItemView = self.addChild(model, childViewClass, self.options.toolbarItemViewOptions.index);
            _.isFunction(lazyToolItemView.makeFocusable) && lazyToolItemView.$el.addClass("csui-acc-focusable");
            existingChildView && self.removeChildView(existingChildView);
            index++;
          }
        }
      });
    },
    _renderLazyActions: function(selectedNodes) {
      if (!selectedNodes.lazyActionsRetrieved) {
        var self = this;
        this.fetchingNonPromotedActions = true;
        selectedNodes.setEnabledLazyActionCommands(true).done(_.bind(function() {
          self.fetchingNonPromotedActions = false;
          const blockingEle = self.ui.otctoolbar.find("otc-toolbarplaceholder");
          blockingEle.animate("width: 0", 300, function() {
            blockingEle.remove();
            self.collection.refilter();
            self.appendLazyActions();
            self.triggerMethod("dom:refresh");
            self.trigger("render:lazy:actions");
          });
        }), this).fail(function(request) {
          self.fetchingNonPromotedActions = false;
          const blockingEle = self.ui.otctoolbar.find("otc-toolbarplaceholder"), error = new base.Error(request);
          blockingEle.length && blockingEle.remove();
          GlobalMessage.showMessage("error", error.message);
        });
      }
    },
    setActive: function(isActive) {
      this._isActive = isActive;
    }
  });
  ReopeningToolbarMixin.mixin(OTCToolbarView.prototype);
  return OTCToolbarView;
});