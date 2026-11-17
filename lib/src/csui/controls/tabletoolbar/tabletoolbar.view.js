/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/models/node/node.model", "csui/models/nodes", "csui/controls/toolbar/toolitem.model", "csui/controls/toolbar/toolitems.filtered.model", "csui/controls/toolbar/toolbar.view", "csui/controls/toolbar/add.toolbar.view", "csui/controls/item.title/item.title.view", "csui/controls/toolbar/delayed.toolbar.view", "csui/utils/commands/add", "i18n!csui/controls/tabletoolbar/impl/nls/localized.strings", "csui/controls/table/inlineforms/inlineform.factory", "hbs!csui/controls/tabletoolbar/impl/tabletoolbar", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/mixins/dynamic.toolitems/dynamic.toolitems.mixin", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/toolbar/toolbar.command.controller", "csui/utils/commands", "csui/utils/accessibility", "csui/utils/nodesprites", "csui-ext!csui/controls/tabletoolbar/tabletoolbar.view", "csui/controls/toolbar/otctoolbar/otcdelayed.toolbar.view", "smart/themes/theming", "csui/lib/jquery.when.all", "css!csui/controls/tabletoolbar/impl/tabletoolbar" ], function($, _, Marionette, NodeModel, NodeCollection, ToolItemModel, FilteredToolItemsCollection, ToolbarView, AddToolbarView, ItemTitleView, DelayedToolbarView, AddCommand, tableToolbarLang, inlineFormViewFactory, template, LayoutViewEventsPropagationMixin, DynamicToolItemsMixin, TabableRegionBehavior, ToolbarCommandController, commands, accessibility, nodeSprites, toolbarExtensions, OTCdelayedToolbarView, theming) {
  "use strict";
  var TableToolbarView = Marionette.LayoutView.extend({
    template: template,
    templateHelpers: function() {
      return {
        toolbarAria: tableToolbarLang.ToolbarAria
      };
    },
    regions: {
      navigationToolbarRegion: ".csui-navigationToolbar",
      filterToolbarRegion: ".csui-filterToolbar",
      addToolbarRegion: ".csui-addToolbar",
      leftToolbarRegion: ".csui-leftToolbar",
      otherToolbarRegion: ".csui-otherToolbar",
      toolbarCaptionRegion: ".csui-toolbar-caption",
      rightToolbarRegion: ".csui-rightToolbar"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    toolbarItemSelector: "a." + TabableRegionBehavior.accessibilityFocusableClass + ":visible," + "button." + TabableRegionBehavior.accessibilityFocusableClass + ":visible," + "otc-button." + TabableRegionBehavior.accessibilityFocusableClass + ":visible," + "div." + TabableRegionBehavior.accessibilityFocusableClass + ":visible",
    events: {
      keydown: "onKeyInView"
    },
    currentlyFocusedElement: function() {
      var toolbarElements = this.$(this.toolbarItemSelector);
      var elementOfFocus = toolbarElements.length ? $(toolbarElements[this.accNthToolbarItemFocused]) : null;
      return elementOfFocus;
    },
    constructor: function TableToolbarView(options) {
      options || (options = {});
      this.context = options.context;
      this.commandController = options.toolbarCommandController || new ToolbarCommandController({
        commands: options.commands || commands
      });
      this.addableTypes = options.addableTypes;
      this.originatingView = options.originatingView || this;
      this.blockingParentView = options.blockingParentView;
      this.selectedNodes = new NodeCollection();
      this.accNthToolbarItemFocused = 0;
      this.toolbarNames = [ "navigation", "filter", "add", "left", "other", "right" ];
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "before:regions:reinitialize", this.initialize);
    },
    initialize: function(options) {
      this.container = options.container || this.collection && this.collection.node;
      var status = {
        context: this.context,
        nodes: this.selectedNodes,
        container: options.removeContainer ? undefined : this.container,
        collection: this.collection,
        originatingView: this.originatingView,
        data: {
          addableTypes: this.addableTypes
        }
      };
      function createToolbarView(toolbarName, toolBarviewSupportObj) {
        if (toolbarName === "add" && toolBarviewSupportObj.isOTWC) {
          return new AddToolbarView(toolBarviewSupportObj);
        } else if (toolBarviewSupportObj.useOTCToolbar && theming.isJATOTheme()) {
          return new OTCdelayedToolbarView(toolBarviewSupportObj);
        } else {
          return new ToolbarView(toolBarviewSupportObj);
        }
      }
      _.each(this.toolbarNames, function(toolbarName) {
        var fullToolbarName = toolbarName + "Toolbar", toolItemFactory = this.options.toolbarItems[fullToolbarName];
        if (toolItemFactory) {
          var toolbarItemsMask = this.options.toolbarItemsMasks && this.options.toolbarItemsMasks.toolbars[fullToolbarName];
          var filteredCollection = new FilteredToolItemsCollection(toolItemFactory, {
            status: status,
            commands: this.commandController.commands,
            mask: toolbarItemsMask
          });
          if (this.container) {
            this.listenTo(this.container.actions, "reset update", function() {
              filteredCollection.refilter();
            });
          }
          let toolBarviewSupportObj = Object.assign({
            collection: filteredCollection,
            toolbarName: toolbarName,
            toolbarCommandController: this.commandController,
            toolbarItemsMask: toolbarItemsMask,
            originatingView: this.originatingView,
            blockingParentView: this.blockingParentView,
            noMenuRoles: true
          }, toolItemFactory.options);
          let toolbarView = createToolbarView(toolbarName, toolBarviewSupportObj);
          this[toolbarName + "ToolbarView"] = toolbarView;
          if (toolbarView.closeDropdown) {
            toolbarView.listenTo(this, "changed:focus close:dropdown", toolbarView.closeDropdown);
          }
          if (toolbarView.closeSubMenu) {
            toolbarView.listenTo(this, "close:subMenu", toolbarView.closeSubMenu);
          }
          this.listenTo(toolbarView, "childview:toolitem:action", this._toolbarItemClicked).listenTo(this.commandController, "after:execute:command", function(eventArgs) {
            if (eventArgs && eventArgs.cancelled) {
              var targetToolItem = this.$el.find("[data-csui-command=" + eventArgs.commandSignature.toLowerCase() + "] a"), isUnderDropDown = targetToolItem.length ? targetToolItem.closest("ul.csui-more-dropdown-menu") : {};
              if (isUnderDropDown.length) {
                isUnderDropDown.siblings("a.binf-dropdown-toggle").trigger("focus");
              } else {
                targetToolItem.trigger("focus");
              }
            }
          });
          if (toolbarView instanceof DelayedToolbarView) {
            this.listenTo(this.selectedNodes, "reset", function() {
              toolbarView.actionState.set("showMessage", !!this.selectedNodes.length);
            });
          }
        }
      }, this);
      if (this.options.toolbarItems.addToolbar && this.addableTypes) {
        this._updateAddToolbar();
        this.listenTo(this.addableTypes, "reset", this._updateAddToolbar, this);
      }
      const self = this;
      if (toolbarExtensions) {
        toolbarExtensions.forEach(function(entryPoint) {
          const extensionViews = entryPoint(self);
          extensionViews && Object.entries(extensionViews).map(([ key, view ]) => {
            if (self.toolbarNames.includes(key)) {
              self[key + "ToolbarView"] = view;
            } else if (key === "customCaptionView") {
              self.captionView = view;
            }
          });
        });
      }
      if (!this.captionView && this.options.headermenuItems && this.options.headermenuItems.headerMenuToolbar && this.container) {
        this.captionView = new ItemTitleView({
          model: this.container,
          toolItems: this.options.headermenuItems.headerMenuToolbar,
          toolItemsMask: this.options.headermenuItemsMask,
          context: this.context,
          commands: this.commandController.commands,
          originatingView: this.originatingView,
          nameSchema: this.options.nameSchema
        });
        this.captionView.listenTo(this, "changed:focus", this.captionView.closeMenu);
      }
      this.propagateEventsToRegions();
      this.makeDynamicToolItems({
        collection: this.collection,
        toolbarItems: this.options.toolbarItems,
        toolbarNames: this.toolbarNames.filter(name => name !== "add").map(name => name === "other" ? "tableHeader" : name).map(name => `${name}Toolbar`).filter(name => this.options.toolbarItems[name]),
        eventArgs: {
          context: this.context,
          container: this.container,
          collection: this.collection,
          selection: this.selectedNodes,
          addableTypes: this.addableTypes
        }
      });
    },
    _moveTo: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("changed:focus", this);
      this.currentlyFocusedElement().trigger("focus");
    },
    onKeyInView: function(event) {
      var toolbarElements;
      if ($(event.target).is(":input") && !$(event.target).hasClass(TabableRegionBehavior.accessibilityFocusableClass)) {
        return;
      }
      switch (event.keyCode) {
       case 9:
        this.trigger("close:dropdown");
        break;

       case 37:
        toolbarElements = this.$(this.toolbarItemSelector);
        if (this.accNthToolbarItemFocused > 0) {
          this.accNthToolbarItemFocused--;
        }
        this._moveTo(event);
        break;

       case 39:
        toolbarElements = this.$(this.toolbarItemSelector);
        if (this.accNthToolbarItemFocused < toolbarElements.length - 1) {
          this.accNthToolbarItemFocused++;
        }
        this._moveTo(event);
        break;

       case 35:
        if (!$(event.target).closest("ul").hasClass("binf-dropdown-menu")) {
          toolbarElements = this.$(this.toolbarItemSelector);
          this.accNthToolbarItemFocused = toolbarElements.length - 1;
          this._moveTo(event);
        }
        break;

       case 36:
        if (!$(event.target).closest("ul").hasClass("binf-dropdown-menu")) {
          this.accNthToolbarItemFocused = 0;
          this._moveTo(event);
        }
        break;
      }
    },
    _updateAddToolbar: function() {
      var toolbarItems = [];
      this.addableTypes.each(function(addableType) {
        var addType = addableType.get("type");
        var isAddableWithoutInlineForm = AddCommand.isAddableTypeWithoutInlineForm(addType);
        var inlineFormView;
        if (!isAddableWithoutInlineForm) {
          inlineFormView = inlineFormViewFactory.getInlineFormView(addType);
        }
        if (isAddableWithoutInlineForm || inlineFormView) {
          var signature = "Add", groupName = "add", addableCommandInfo = inlineFormView && Object.getPrototypeOf(inlineFormView).addableCommandInfo;
          if (inlineFormView && _.isObject(addableCommandInfo)) {
            var cmdInfo = addableCommandInfo;
            signature = cmdInfo.signature || signature;
            groupName = cmdInfo.group || groupName;
          } else if (inlineFormView && _.isFunction(inlineFormView.prototype.getAddableCommandInfo)) {
            var commandInfo = inlineFormView.prototype.getAddableCommandInfo();
            signature = commandInfo.signature || signature;
            groupName = commandInfo.group || groupName;
          }
          var typeName = addableType.get("type_name");
          typeName = nodeSprites.findTypeByNode(new NodeModel({
            type: addType,
            type_name: typeName
          })) || typeName;
          var toolItem = new ToolItemModel({
            signature: signature,
            name: typeName,
            title: _.str.sformat(tableToolbarLang.AddToolbarItemsTitle, typeName),
            type: addType,
            group: groupName,
            commandData: {
              type: addType,
              addableTypes: this.addableTypes
            },
            toolItemRole: "menuitem"
          });
          _.isFunction(this.options.updateAddToolItem) && this.options.updateAddToolItem(toolItem);
          toolbarItems.push(toolItem);
        }
      }, this);
      var self = this;
      if (!toolbarItems.length) {
        this._requestAddToolbar(toolbarItems).always(function(arg) {
          var toolbarItemsData = [], sequenceNo = [];
          if (arg) {
            for (var i = 0; i < arg.length; i++) {
              self._orderTheSequence(arg[i], toolbarItemsData, sequenceNo);
            }
          }
          self._setToolBarItems(toolbarItemsData, toolbarItems);
          self._resetAddToolbar(toolbarItems);
        });
      } else {
        this.stopListening(this.addToolbarView, "toolbar.show").listenTo(this.addToolbarView, "toolbar.show", function() {
          this.addToolbarView.startLazyLoading();
          this._requestAddToolbar(toolbarItems).always(function(arg) {
            self.addToolbarView.collection.silentFetch = true;
            var toolbarItemsData = [], sequenceNo = [];
            if (arg) {
              for (var i = 0; i < arg.length; i++) {
                self._orderTheSequence(arg[i], toolbarItemsData, sequenceNo);
              }
            }
            self._setToolBarItems(toolbarItemsData, toolbarItems);
            self._resetAddToolbar(toolbarItems);
            self.addToolbarView.stopLazyLoading();
            self.stopListening(self.addToolbarView, "toolbar.show");
            self.addToolbarView.appendLazyActions();
          });
        });
        this._resetAddToolbar(toolbarItems);
      }
    },
    _requestAddToolbar: function(toolbarItems) {
      var deferreds = [];
      this.triggerMethod("before:updateAddToolbar", {
        context: this.context,
        container: this.container,
        addableTypes: this.addableTypes,
        toolbarItems: toolbarItems,
        async: function() {
          var deferred = $.Deferred();
          deferreds.push(deferred);
          return function(arg) {
            deferred.resolve(arg);
          };
        }
      });
      return $.whenAll.apply($, deferreds);
    },
    _orderTheSequence: function(arg, toolbarItemsData, sequenceNo) {
      if (arg && arg.toolItems && arg.sequence && arg.toolItems.length > 0) {
        if (toolbarItemsData.length > 0) {
          if (arg.sequence < sequenceNo[sequenceNo.length - 1]) {
            this._swapArrayPositionOfToolbarItems(toolbarItemsData, sequenceNo, arg);
          } else {
            this._pushToToolbarItemsData(toolbarItemsData, sequenceNo, arg);
          }
        } else {
          this._pushToToolbarItemsData(toolbarItemsData, sequenceNo, arg);
        }
      }
      return toolbarItemsData;
    },
    _pushToToolbarItemsData: function(toolbarItemsData, sequenceNo, arg) {
      toolbarItemsData.push(arg.toolItems);
      sequenceNo.push(arg.sequence);
    },
    _swapArrayPositionOfToolbarItems: function(toolbarItemsData, sequenceNo, arg) {
      var tempToolbarItemsData = toolbarItemsData.pop();
      var tempSequenceNo = sequenceNo.pop();
      this._pushToToolbarItemsData(toolbarItemsData, sequenceNo, arg);
      toolbarItemsData.push(tempToolbarItemsData);
      sequenceNo.push(tempSequenceNo);
    },
    _setToolBarItems: function(arg, toolbarItems) {
      var toolbarItem = arg;
      if (!_.isArray(toolbarItem)) {
        return;
      }
      var argLen = toolbarItem.length;
      if (argLen <= 0) {
        return;
      }
      for (var i = 0; i < argLen; i++) {
        var subElm = toolbarItem[i];
        for (var j = 0; j < subElm.length; j++) {
          subElm[j].set("toolItemRole", "menuitem");
          toolbarItems.push(subElm[j]);
        }
      }
    },
    _resetAddToolbar: function(toolbarItems) {
      if (this.options.creationToolItemsMask) {
        toolbarItems = this.options.creationToolItemsMask.maskItems(toolbarItems);
      }
      this.options.toolbarItems.addToolbar.reset(toolbarItems);
    },
    _toolbarItemClicked: function(toolItemView, args) {
      var executionContext = {
        context: this.context,
        nodes: this.selectedNodes.clone(),
        container: this.container,
        collection: this.collection,
        originatingView: this.originatingView,
        toolItemView: toolItemView
      };
      this.commandController.toolitemClicked(args.toolItem, executionContext);
    },
    updateForSelectedChildren: function(selectedNodes) {
      const models = selectedNodes.models || selectedNodes;
      this.selectedNodes.reset(models);
    },
    onRender: function() {
      if (accessibility.isAccessibleMode()) {
        this.el.firstElementChild.classList.add("csui-wrap-text");
      }
      if (this.options.height) {
        this.$el.height(this.options.height);
      }
      _.each(this.toolbarNames, function(toolbarName) {
        var view = this[toolbarName + "ToolbarView"];
        if (view) {
          view.collection.refilter();
          this[toolbarName + "ToolbarRegion"].show(view);
        }
      }, this);
      if (this.captionView) {
        this.toolbarCaptionRegion.show(this.captionView);
      }
    }
  });
  _.extend(TableToolbarView.prototype, LayoutViewEventsPropagationMixin);
  DynamicToolItemsMixin.mixin(TableToolbarView.prototype);
  return TableToolbarView;
});