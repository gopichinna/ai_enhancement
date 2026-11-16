/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/controls/table.settings/impl/keyboard.navigation.mixin", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.draghandle", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.name", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.btn.up", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.btn.down", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.btn.remove", "hbs!smart/controls/table.settings/impl/columns.side.panel.content.layout", "smart/themes/carbonfiber/ot-icons/icons_smart_action", "css!smart/controls/table.settings/impl/columns.side.panel.selected" ], function(module, _, Backbone, Marionette, logUtil, KeyboardNavigationMixin, columnsItemDragHandleTemplate, columnsItemNameTemplate, columnsItemBtnUpTemplate, columnsItemBtnDownTemplate, columnsItemBtnRemoveTemplate, columnsItemLayoutTemplate) {
  const log = logUtil(module.id);
  const ColumnsItemDragHandleView = Marionette.ItemView.extend({
    template: columnsItemDragHandleTemplate,
    constructor: function ColumnsItemDragHandleView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.itemModel = options.itemModel;
    }
  });
  const ColumnsItemNameView = Marionette.ItemView.extend({
    template: columnsItemNameTemplate,
    className: "smart-table-settings-column-label-name",
    constructor: function ColumnsItemNameView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.itemModel = options.itemModel;
      this.listenTo(this.itemModel, "change:name change:label", this.render);
    },
    templateHelpers: function() {
      return {
        label: this.itemModel.get("group"),
        name: this.itemModel.get("name")
      };
    }
  });
  const ColumnsItemButtonUpView = Marionette.ItemView.extend({
    template: columnsItemBtnUpTemplate,
    events: {
      click: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger("click:up");
      },
      keydown: "onKeyInView"
    },
    constructor: function ColumnsItemButtonUpView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.itemModel = options.itemModel;
      this._scope = "in-column";
      this.setupKeyboardNavigationMixin({
        scope: this._scope,
        isFocusableElement: () => {
          return this.itemModel.get("canMoveUp");
        },
        getFocusableElement: () => {
          return this._focusableElement;
        },
        focus: () => {
          this._focusableElement.focus();
        },
        id: "upBtn",
        setTabStop: isTabStop => {
          this.model.set("tabstop", isTabStop);
        }
      });
      this.listenTo(this.model, "change:tabstop", this.render);
      this.listenTo(this.itemModel, "change:canMoveUp", this.render);
      this.listenTo(this.itemModel, "change:active", () => {
        if (!this.isDestroyed) {
          this.render();
        }
      });
    },
    templateHelpers: function() {
      return {
        active: this.itemModel.get("active"),
        tabstop: this.model.get("tabstop"),
        canMoveUp: this.itemModel.get("canMoveUp")
      };
    },
    onRender: function() {
      this._focusableElement = this.el.querySelector(".smart-table-settings-column-btnUp");
      log.debug(`KN: scope ${this._scope} rendered ${this.constructor.name} item: ${this.itemModel.get("id")}, id: ${this.knGetIdentifier({
        scope: "in-column"
      })}`) && console.log(log.last);
      this.knFocusIfNeeded({
        scope: this._scope
      });
    }
  });
  const ColumnsItemButtonDownView = Marionette.ItemView.extend({
    template: columnsItemBtnDownTemplate,
    events: {
      click: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger("click:down");
      },
      keydown: "onKeyInView"
    },
    constructor: function ColumnsItemButtonDownView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.itemModel = options.itemModel;
      this._scope = "in-column";
      this.setupKeyboardNavigationMixin({
        scope: this._scope,
        isFocusableElement: () => {
          return this.itemModel.get("canMoveDown");
        },
        getFocusableElement: () => {
          return this._focusableElement;
        },
        focus: () => {
          this._focusableElement.focus();
        },
        id: "downBtn",
        setTabStop: isTabStop => {
          this.model.set("tabstop", isTabStop);
        }
      });
      this.listenTo(this.model, "change:tabstop", this.render);
      this.listenTo(this.itemModel, "change:canMoveDown", this.render);
      this.listenTo(this.itemModel, "change:active", () => {
        if (!this.isDestroyed) {
          this.render();
        }
      });
    },
    templateHelpers: function() {
      return {
        active: this.itemModel.get("active"),
        tabstop: this.model.get("tabstop"),
        canMoveDown: this.itemModel.get("canMoveDown")
      };
    },
    onRender: function() {
      this._focusableElement = this.el.querySelector(".smart-table-settings-column-btnDown");
      log.debug(`KN: scope ${this._scope} rendered ${this.constructor.name} item: ${this.itemModel.get("id")}, id: ${this.knGetIdentifier({
        scope: this._scope
      })}`) && console.log(log.last);
      this.knFocusIfNeeded({
        scope: this._scope
      });
    }
  });
  const ColumnsItemButtonRemoveView = Marionette.ItemView.extend({
    template: columnsItemBtnRemoveTemplate,
    events: {
      click: function() {
        this.trigger("click:remove");
      },
      keydown: "onKeyInView"
    },
    constructor: function ColumnsItemButtonRemoveView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.itemModel = options.itemModel;
      this._scope = "in-column";
      this.setupKeyboardNavigationMixin({
        scope: this._scope,
        isFocusableElement: true,
        getFocusableElement: () => {
          return this._focusableElement;
        },
        focus: () => {
          this._focusableElement.focus();
        },
        id: "removeBtn",
        setTabStop: isTabStop => {
          this.model.set("tabstop", isTabStop);
        }
      });
      this.listenTo(this.model, "change:tabstop", this.render);
      this.listenTo(this.itemModel, "change:active", () => {
        if (!this.isDestroyed) {
          this.render();
        }
      });
    },
    templateHelpers: function() {
      return {
        active: this.itemModel.get("active"),
        tabstop: this.model.get("tabstop")
      };
    },
    onRender: function() {
      this._focusableElement = this.el.querySelector(".smart-table-settings-column-btnRemove");
      this.knFocusIfNeeded({
        scope: this._scope
      });
    }
  });
  const ColumnsItemView = Marionette.LayoutView.extend({
    template: columnsItemLayoutTemplate,
    className: function() {
      let className = "smart-table-settings-column-view";
      const fixed = this.model.get("fixed");
      const movable = !(this.model.get("pinned") || this.model.get("permanentAtEnd"));
      const haveLabel = this.model.get("group");
      if (fixed) {
        className += " smart-table-settings-column--is-fixed";
      } else {
        className += " smart-table-settings-column--is-removable";
      }
      if (movable) {
        className += " smart-table-settings-column--is-movable";
      } else {
        className += " smart-table-settings-column--is-not-movable";
      }
      if (haveLabel) {
        className += " smart-table-settings-column--is-with-label";
      }
      return className;
    },
    tagName: "li",
    events: {
      mouseenter: "onMouseEnter",
      click: "onClick",
      keydown: "onKeyInView",
      dragstart: "onDragStart",
      dragover: "onDragOver",
      dragleave: "onDragLeave",
      dragend: "onDragEnd",
      drop: "onDrop"
    },
    regions: {
      dragHandle: ".smart-table-settings-column-region-drag-handle",
      name: ".smart-table-settings-column-region-name",
      btnUp: ".smart-table-settings-column-region-btnUp",
      btnDown: ".smart-table-settings-column-region-btnDown",
      btnRemove: ".smart-table-settings-column-region-btnRemove"
    },
    constructor: function ColumnsItemView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this._tabRegionScope = "in-column";
      this._focusableElementScope = "default";
      this.setupKeyboardNavigationMixin([ {
        scope: this._focusableElementScope,
        isFocusableElement: true,
        focus: () => {
          this.el.focus();
        },
        id: () => {
          const key = this.model.get("id");
          if (!key) {
            throw new Error(`knView ${this.constructor.name}: scope ${this._focusableElementScope}: key in model is undefined`);
          }
          return key;
        },
        getFocusableElement: () => {
          return this.el;
        },
        setTabStop: isTabStop => {
          this.model.set("tabstop", isTabStop);
        }
      }, {
        scope: this._tabRegionScope,
        isTabRegion: true,
        tabRegionName: `${this.constructor.name}-${this.model.get("id")}`
      } ]);
      this.listenTo(this.model, "change:active", this.render);
      this.listenTo(this.model, "change:dragstart", () => {
        const dragstart = this.model.get("dragstart");
        if (dragstart) {
          this.el.classList.add("smart-table-settings-column--is-dragstart");
        } else {
          this.el.classList.remove("smart-table-settings-column--is-dragstart");
        }
      });
      this.listenTo(this.model, "change:dragover", () => {
        const dragover = this.model.get("dragover");
        switch (dragover) {
         case "top":
          this.el.classList.add("smart-table-settings-column--is-dragover");
          this.el.classList.add("smart-table-settings-column--is-dragover-top");
          this.el.classList.remove("smart-table-settings-column--is-dragover-bottom");
          break;

         case "bottom":
          this.el.classList.add("smart-table-settings-column--is-dragover");
          this.el.classList.add("smart-table-settings-column--is-dragover-bottom");
          this.el.classList.remove("smart-table-settings-column--is-dragover-top");
          break;

         default:
          this.el.classList.remove("smart-table-settings-column--is-dragover");
          this.el.classList.remove("smart-table-settings-column--is-dragover-top");
          this.el.classList.remove("smart-table-settings-column--is-dragover-bottom");
        }
      });
      this.listenTo(this.model, "change:tabstop", () => {
        const current = this.model.get("tabstop");
        if (current === false) {
          const prev = this.model.previous("tabstop");
          if (prev !== undefined) {
            this._setTabIndex();
          }
        } else {
          this._setTabIndex();
        }
      });
    },
    onRender: function() {
      const active = this.model.get("active");
      const pinned = this.model.get("pinned");
      const permanentAtEnd = this.model.get("permanentAtEnd");
      const fixed = this.model.get("fixed");
      this.showChildView("name", new ColumnsItemNameView({
        itemModel: this.model
      }));
      if (active) {
        this.columnsItemButtonUpView = new ColumnsItemButtonUpView({
          model: new Backbone.Model({
            key: "upBtn"
          }),
          itemModel: this.model,
          knViewsCollection: this.knGetKnViewsCollection({
            scope: this._tabRegionScope
          })
        });
        this.listenTo(this.columnsItemButtonUpView, "click:up", () => {
          this.trigger("move:up");
        });
        this.showChildView("btnUp", this.columnsItemButtonUpView);
        this.columnsItemButtonDownView = new ColumnsItemButtonDownView({
          model: new Backbone.Model({
            key: "downBtn"
          }),
          itemModel: this.model,
          knViewsCollection: this.knGetKnViewsCollection({
            scope: this._tabRegionScope
          })
        });
        this.listenTo(this.columnsItemButtonDownView, "click:down", () => {
          this.trigger("move:down");
        });
        this.showChildView("btnDown", this.columnsItemButtonDownView);
      }
      if (!fixed) {
        this.columnsItemButtonRemoveView = new ColumnsItemButtonRemoveView({
          model: new Backbone.Model({
            key: "removeBtn"
          }),
          itemModel: this.model,
          knViewsCollection: this.knGetKnViewsCollection({
            scope: this._tabRegionScope
          })
        });
        this.listenTo(this.columnsItemButtonRemoveView, "click:remove", () => {
          this.trigger("remove:item");
        });
        this.showChildView("btnRemove", this.columnsItemButtonRemoveView);
      }
      if (active) {
        this.el.classList.add("smart-table-settings-column--is-active");
      } else {
        this.el.classList.remove("smart-table-settings-column--is-active");
      }
      if (pinned || permanentAtEnd || active) {
        this.el.removeAttribute("draggable");
      } else {
        this.showChildView("dragHandle", new ColumnsItemDragHandleView({
          model: new Backbone.Model({
            key: "dragdrop"
          }),
          itemModel: this.model,
          knViewsCollection: this.knGetKnViewsCollection({
            scope: this._tabRegionScope
          })
        }));
        this.el.setAttribute("draggable", true);
      }
      this._updateOnActiveChange(active);
      this._setTabIndex();
    },
    onDragStart: function(event) {
      const active = this.model.get("active");
      const pinned = this.model.get("pinned");
      const permanentAtEnd = this.model.get("permanentAtEnd");
      if (active || pinned || permanentAtEnd) {
        event.preventDefault();
        return;
      }
      this.model.set({
        dragstart: true
      });
      event.originalEvent.dataTransfer.setData("text/plain", this.model.get("id"));
    },
    onDragOver: function(event) {
      const active = this.model.get("active");
      const pinned = this.model.get("pinned");
      const permanentAtEnd = this.model.get("permanentAtEnd");
      if (active || pinned || permanentAtEnd) {
        event.preventDefault();
        return;
      }
      this.trigger("dragover:item", event);
    },
    onDragLeave: function(event) {
      this.model.set("dragover", "");
    },
    onDragEnd: function(event) {
      this.trigger("dragend:item", event);
    },
    onDrop: function(event) {
      const active = this.model.get("active");
      const pinned = this.model.get("pinned");
      const permanentAtEnd = this.model.get("permanentAtEnd");
      if (active || pinned || permanentAtEnd) {
        event.preventDefault();
        return;
      }
      this.trigger("drop:item", event);
    },
    onClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.trigger("click:item");
    },
    onMouseEnter: function() {
      const notMovable = this.model.get("pinned") || this.model.get("permanentAtEnd");
      const fixed = this.model.get("fixed");
      if (notMovable && fixed) {
        return;
      }
      const dragstart = this.model.get("dragstart");
      if (dragstart) {
        return;
      }
    },
    _updateOnActiveChange: function(isActive) {
      let active = isActive;
      if (active === undefined) {
        active = this.model.get("active");
      }
      const knViewsInfos = this.knGetKnViewsSorted({
        scope: this._tabRegionScope
      });
      if (active) {
        if (!this._knKeyHandledAtLeastOnce && knViewsInfos.length > 0) {
          const viewInfo = knViewsInfos[0];
          this.knSetCurrentlyFocusedViewIdentifier(viewInfo.id, {
            scope: this._tabRegionScope
          });
          log.debug(`KN: marked ${viewInfo.id} as initial tab-stop (scope ${this._tabRegionScope})`) && console.log(log.last);
        }
      } else {
        this._knKeyHandledAtLeastOnce = false;
        this.knSetCurrentlyFocusedViewIdentifier(undefined, {
          scope: this._tabRegionScope
        });
        const knViewsCollection = this.knGetKnViewsCollection({
          scope: this._tabRegionScope
        });
        log.debug(`KN: removing any tab-stop from tab region ${knViewsCollection.tabRegionName}, because it's deactivated (scope ${this._tabRegionScope})`) && console.log(log.last);
      }
      const currentlyFocusedViewInfo = this.knUpdateTabStops(knViewsInfos);
      const knViewsCollection = this.knGetKnViewsCollection({
        scope: this._tabRegionScope
      });
      if (active) {
        if (!currentlyFocusedViewInfo) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has no currently focused view, but there should be one`);
        }
      } else {
        if (currentlyFocusedViewInfo) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has currently focused view, but there should not be one`);
        }
      }
    },
    willLooseFocus: function(canUpDown) {
      log.debug(`KN: handling willLooseFocus ${this.model.get("id")} (scope ${this._tabRegionScope})`) && console.log(log.last);
      const knViewsCollection = this.knGetKnViewsCollection({
        scope: this._tabRegionScope
      });
      const currentlyFocusedViewIdentifier = this.knGetCurrentlyFocusedViewIdentifier({
        scope: this._tabRegionScope
      });
      const upId = this.columnsItemButtonUpView.knGetIdentifier({
        scope: this._tabRegionScope
      });
      const downId = this.columnsItemButtonDownView.knGetIdentifier({
        scope: this._tabRegionScope
      });
      const modelUpBtn = knViewsCollection.get(upId);
      const modelDownBtn = knViewsCollection.get(downId);
      const upKnViewInfo = modelUpBtn ? {
        id: upId,
        view: modelUpBtn.get("view")
      } : undefined;
      const downKnViewInfo = modelDownBtn ? {
        id: downId,
        view: modelDownBtn.get("view")
      } : undefined;
      switch (currentlyFocusedViewIdentifier) {
       case upId:
        if (!canUpDown.canMoveUp && canUpDown.canMoveDown) {
          this._knMoveTabStop(upKnViewInfo, downKnViewInfo, {
            scope: this._tabRegionScope
          });
        } else {
          this.model.set("active", false);
        }
        break;

       case downId:
        if (!canUpDown.canMoveDown && canUpDown.canMoveUp) {
          this._knMoveTabStop(downKnViewInfo, upKnViewInfo, {
            scope: this._tabRegionScope
          });
        } else {
          this.model.set("active", false);
        }
        break;
      }
    },
    onKeyInView: function(event) {
      switch (event.keyCode) {
       case 9:
        if (this.model.get("active")) {
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       case 13:
       case 32:
        if (event.ctrlKey || event.metaKey) {
          this.trigger("enter:item");
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       case 27:
        this.model.set("active", false);
        event.preventDefault();
        event.stopPropagation();
        break;

       case 37:
        if (this.model.get("active")) {
          this._knHandleKeyArrowLeft(event);
        }
        break;

       case 39:
        if (this.model.get("active")) {
          this._knHandleKeyArrowRight(event);
        }
        break;

       case 38:
        if (event.ctrlKey || event.metaKey) {
          if (this.model.get("canMoveUp")) {
            this.trigger("move:up");
          }
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       case 40:
        if (event.ctrlKey || event.metaKey) {
          if (this.model.get("canMoveDown")) {
            this.trigger("move:down");
          }
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       default:
        switch (event.key) {
         case "Delete":
         case "Backspace":
          if (!this.model.get("fixed")) {
            this.trigger("remove:item");
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        }
        break;
      }
    },
    _setTabIndex: function() {
      const tabstop = this.model.get("tabstop");
      if (tabstop) {
        this.el.setAttribute("tabindex", "0");
      } else {
        this.el.removeAttribute("tabindex");
      }
    },
    _checkTabables: function() {
      const active = this.model.get("active");
      const tabables = this.el.querySelectorAll('*[tabindex="0"],otc-button:not([tabindex="-1"])');
      const knViewsCollection = this.knGetKnViewsCollection({
        scope: this._tabRegionScope
      });
      if (active) {
        if (tabables.length !== 1) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has ${tabables.length} tab-stops, but there should only be one`);
        }
      } else {
        if (tabables.length > 0) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has ${tabables.length} elements acting as tab-stop, but there should not be one`);
        }
      }
    },
    _knHandleKeyArrowLeft: function(event) {
      const id = this.knNavigateToPrev({
        scope: this._tabRegionScope
      });
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _knHandleKeyArrowRight: function(event) {
      const id = this.knNavigateToNext({
        scope: this._tabRegionScope
      });
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
  KeyboardNavigationMixin.mixin(ColumnsItemButtonUpView.prototype);
  KeyboardNavigationMixin.mixin(ColumnsItemButtonDownView.prototype);
  KeyboardNavigationMixin.mixin(ColumnsItemButtonRemoveView.prototype);
  KeyboardNavigationMixin.mixin(ColumnsItemView.prototype);
  return ColumnsItemView;
});