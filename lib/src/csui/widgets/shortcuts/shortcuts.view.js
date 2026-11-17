/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/utils/base", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/widgets/shortcuts/impl/shortcut/shortcut.view", "csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view", "csui/utils/contexts/factories/node", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/controls/mixins/shortcuts.view/shortcuts.view.mixin", "csui/utils/perspective/perspective.util", "smart/controls/progressblocker/blocker", "i18n!csui/widgets/shortcuts/impl/nls/lang", "css!csui/widgets/shortcuts/impl/shortcuts" ], function(module, _, $, Backbone, Marionette, base, TabableRegionBehavior, MiniShortcutView, EditableShortcutView, NodeModelFactory, ViewEventsPropagationMixin, ShortcutsViewMixin, PerspectiveUtil, BlockingView, lang) {
  "use strict";
  var config = _.defaults({}, module.config() || {}, {
    isPageHasDarkTheme: true
  });
  var THEME_SUFFIX = [ "shade1", "shade2", "shade3", "shade4" ];
  var ShortcutModel = Backbone.Model.extend({
    idAttribute: "shortcutItemId",
    isAddShortcut: function() {
      return this.get("isAddNew") === true;
    }
  });
  var ShortcutsCollection = Backbone.Collection.extend({
    constructor: function(models, options) {
      options || (options = {});
      _.defaults(options, {
        model: ShortcutModel,
        comparator: function(a, b) {
          if (b.get("isAddNew")) {
            return -1;
          }
          return 0;
        }
      });
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
    getShortcuts: function() {
      return this.filter(function(model) {
        return !model.isAddShortcut();
      });
    },
    evaluateAddNewExistence: function() {
      var widgetId = this.options[PerspectiveUtil.KEY_WIDGET_ID];
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE && (widgetId && !PerspectiveUtil.isPersonalWidgetId(widgetId))) {
        return;
      }
      var newItem = this.where(function(model) {
        return model.isAddShortcut();
      });
      if (this.length < 4 && newItem.length === 0) {
        this.add({
          id: "",
          isAddNew: true,
          icon: "icon-new",
          displayName: "",
          customBackgroundColor: "",
          customBackgroundImage: ""
        });
        return true;
      } else if (this.length > 4 && newItem.length > 0) {
        this.remove(newItem);
        return true;
      }
      return false;
    }
  });
  var ShortcutsView = Marionette.CollectionView.extend({
    constructor: function ShortcutsView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options = _.defaults(options, {
        reorderOnSort: true,
        widgetContainer: this
      });
      options.data = this._normalizeData(options.data);
      options.collection = options.collection || new ShortcutsCollection([], _.pick(options, "perspectiveMode", PerspectiveUtil.KEY_WIDGET_ID));
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },
    tagName: "div",
    className: "csui-shortcut-container tile initialLoading csui-shortcut-group-container csui-widget-focusable",
    attributes: function() {
      var attrs = {};
      if (!this._isInlineEditMode()) {
        attrs = _.extend({
          role: "navigation",
          "aria-label": lang.groupUsageAria
        }, attrs);
      }
      return attrs;
    },
    regions: {
      shortcut0: ".shortcut-region-0",
      shortcut1: ".shortcut-region-1",
      shortcut2: ".shortcut-region-2",
      shortcut3: ".shortcut-region-3"
    },
    behaviors: function() {
      if (!this._isInlineEditMode()) {
        return {
          TabableRegion: {
            behaviorClass: TabableRegionBehavior
          }
        };
      }
    },
    events: function() {
      var evts = {};
      if (this._isInlineEditMode()) {
        evts = _.extend(evts, {
          drop: "onDrop",
          dragover: "onDragOver",
          dragenter: "onDragEnter",
          keydown: "_onEditKeyDown"
        });
      } else {
        evts = _.extend(evts, {
          keydown: "onKeyInView"
        });
      }
      return evts;
    },
    childEvents: {
      "change:shortcutTheme": "_onChangeTheme",
      "change:customBackgroundColor": "_onChangeCustomBackgroundColor",
      "change:customBackgroundImage": "_onChangeCustomBackgroundImage",
      "add:shortcut": "_onAddShortcut",
      "delete:widget": "_onRemoveShortcut",
      "update:widget:options": "_updateShortcutOptions"
    },
    childViewOptions: function(model, index) {
      return {
        context: this.options.context,
        collection: this.options.collection,
        container: this,
        perspectiveMode: this.options.perspectiveMode
      };
    },
    getChildView: function() {
      return this._isInlineEditMode() ? EditableShortcutView : MiniShortcutView;
    },
    _normalizeData: function(data) {
      data || (data = {
        shortcutItems: []
      });
      data.shortcutTheme || (data.shortcutTheme = "");
      return data;
    },
    initialize: function() {
      this.loadingText = lang.loadingText;
      this.darkBackground = config.isPageHasDarkTheme;
      BlockingView.imbue(this);
      this.listenTo(this.collection, "add", this._onCollectionChange).listenTo(this.collection, "remove", this._onCollectionChange).listenTo(this.collection, "reset", this._onCollectionChange);
      if (this._isInlineEditMode()) {
        this.listenTo(this.collection, "add", this._onCollectionInlineAdd).listenTo(this.collection, "remove", this._onCollectionInlineRemove);
      }
      var shortcutItems = _.map(_.first(this.options.data.shortcutItems || [], 4), _.clone);
      this._fetchShortcutModels(shortcutItems).always(_.bind(function(filteredItems) {
        this._fetchModels(filteredItems);
      }, this));
      this._currentShortcutIndex = 0;
      this.listenTo(this, "add:child", this.propagateEventsToViews);
    },
    _fetchModels: function(shortcutItems) {
      this.blockActions();
      const backgroundImagePromiseList = this.createDetailListForShortcuts(shortcutItems);
      if (backgroundImagePromiseList.length) {
        const result = $.whenAll.apply($, backgroundImagePromiseList);
        const self = this;
        result.always(function(bgImgs) {
          shortcutItems.forEach(item => {
            const bgImgId = item?.customBackgroundImage;
            const bgImg = bgImgs.find(img => img[0]?.id === bgImgId)?.[0];
            if (bgImg) {
              item.deploy_url = bgImg.deploy_url;
              item.modify_date = bgImg.modify_date;
              item.mime_type = bgImg.mime_type;
              item.version_number = bgImg.version_number;
            }
          });
          self.unblockActions();
          self._setupCollection(shortcutItems);
        });
        return shortcutItems;
      } else {
        this._setupCollection(shortcutItems);
        this.unblockActions();
      }
    },
    _setupCollection: function(shortcutItems) {
      shortcutItems = shortcutItems || [];
      this.collection.reset(shortcutItems);
    },
    _fetchShortcutModels: function(shortcutItems) {
      this.blockActions();
      const modelPromiseList = this.createListForShortcutNodes(shortcutItems);
      const result = $.whenAll.apply($, modelPromiseList);
      const self = this;
      const deferred = $.Deferred();
      result.always(function() {
        let filteredItems = shortcutItems.filter(shortcutItem => {
          return !shortcutItem.node.error;
        });
        if (!self._isInlineEditMode() && filteredItems.length === 0) {
          filteredItems = _.first(shortcutItems, 1);
        }
        self.unblockActions();
        deferred.resolve(filteredItems);
      });
      return deferred.promise();
    },
    _isInlineEditMode: function() {
      return !!this.options.perspectiveMode;
    },
    _onCollectionChange: function() {
      if (this._isInlineEditMode()) {
        this.collection.evaluateAddNewExistence();
      }
      this._updateShortcutStyles();
    },
    _onCollectionInlineAdd: function() {
      this.collection.each(function(model) {
        model.trigger("refresh:mask");
      });
    },
    _onCollectionInlineRemove: function() {
      this.collection.each(function(model) {
        model.trigger("refresh:mask");
      });
    },
    _getLayout: function(size) {
      var layout = "small";
      if (size === 1) {
        layout = "large";
      } else if (size === 2) {
        layout = "medium";
      }
      return layout;
    },
    _getShortcutTheme: function(itemIndex, numberOfItems) {
      var smartShortcutShade = "smart-shortcut-shade ";
      var smartShortcutTheme = "smart-shortcut-theme ";
      var theme = this.options.data.shortcutTheme ? this.options.data.shortcutTheme : "csui-shortcut-theme-grey";
      if (numberOfItems > 1) {
        itemIndex += 4 - numberOfItems;
        theme += "-" + THEME_SUFFIX[itemIndex];
        theme = smartShortcutShade + theme;
      } else {
        theme = smartShortcutTheme + theme;
      }
      return theme;
    },
    _updateShortcutOptions: function(shortcutItemView, args) {
      var itemModel = shortcutItemView.model, updatedOptions = args.options;
      if (itemModel.get("isAddNew")) {
        if (args.softUpdate) {
          return;
        }
        if (!args.isValid || !shortcutItemView.isOptionsValid(updatedOptions)) {
          if (this.options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
            this._notifyOptionsChange(!shortcutItemView.isShortcutValid(updatedOptions));
          }
          return;
        }
        itemModel.set({
          isAddNew: undefined,
          displayName: undefined,
          icon: undefined,
          customBackgroundColor: undefined,
          customBackgroundImage: undefined
        }, {
          silent: true,
          unset: true
        });
      }
      shortcutItemView.isUpdating = true;
      this._setDefaultOptions(updatedOptions);
      itemModel.set(updatedOptions);
      this._notifyOptionsChange();
      var isCollChanged = this.collection.evaluateAddNewExistence();
      delete shortcutItemView.isUpdating;
      if (!isCollChanged) {
        this._updateShortcutStyles();
        shortcutItemView.model.trigger("refresh:mask");
      }
      this.triggerMethod("dom:refresh");
    },
    _setDefaultOptions: function(updatedOptions) {
      updatedOptions.type = updatedOptions.type || 141;
    },
    _onRemoveShortcut: function(shortcutItemView) {
      var getNextItemToFocus = this.collection.indexOf(shortcutItemView.model);
      this.collection.remove(shortcutItemView.model);
      var shortcutItems = this.collection.getShortcuts();
      if (shortcutItems.length === 0) {
        this.options.widgetContainer.trigger("remove:widget");
      } else {
        this._notifyOptionsChange();
        this.children.findByIndex(getNextItemToFocus).focus();
      }
    },
    _notifyOptionsChange: function(isInvalid) {
      var shortcutItems = this.collection.getShortcuts().map(function(model) {
        return {
          id: model.get("id"),
          type: model.get("type"),
          displayName: model.get("displayName"),
          icon: model.has("icon") ? model.get("icon") : "",
          customBackgroundColor: model.has("customBackgroundColor") && model.get("customBackgroundColor") || "",
          customBackgroundImage: model.has("customBackgroundImage") && model.get("customBackgroundImage") || ""
        };
      });
      this.options.widgetContainer.trigger("update:widget:options", {
        shortcutTheme: this.collection.first().get("shortcutTheme"),
        shortcutItems: shortcutItems,
        isValid: !isInvalid
      });
    },
    _onChangeTheme: function(childView) {
      this.options.data.shortcutTheme = childView.model.get("shortcutTheme");
      this._updateShortcutStyles();
    },
    _onChangeBackgroundColor: function(childView) {
      this.options.data.customBackgroundColor = childView.model.get("customBackgroundColor");
    },
    _onChangeBackgroundImage: function(childView) {
      this.options.data.customBackgroundImage = childView.model.get("customBackgroundImage");
    },
    _onAddShortcut: function(childView, model) {
      this.collection.add({
        id: "",
        icon: "",
        displayName: "",
        customBackgroundColor: "",
        type: 141,
        shortcutTheme: this.options.data.shortcutTheme,
        customBackgroundImage: ""
      }, {
        at: this.collection.length - 1
      });
      this.collection.sort();
      this._notifyOptionsChange();
    },
    _updateShortcutStyles: function() {
      var shortcutTheme = this.options.data.shortcutTheme, layout = this._getLayout(this.collection.length);
      this.collection.each(function(model, index) {
        var totalShortcuts = !this._isInlineEditMode() ? this.collection.length : this.collection.getShortcuts().length, theme = this._getShortcutTheme(index, totalShortcuts);
        model.set({
          layout: layout,
          theme: theme,
          shortcutTheme: shortcutTheme
        });
      }, this);
    },
    onDrop: function(event) {
      this.options.widgetContainer.trigger("replace:widget", event);
    },
    onDragOver: function(event) {
      event.preventDefault();
    },
    onDragEnter: function(event) {
      event.preventDefault();
    },
    onRender: function() {
      this._clearShortcutTabIndexes();
    },
    onDomRefresh: function() {
      if (this._isInlineEditMode()) {
        var btnRequired = true, shortcutGroup = lang.groupAria, shortcutCount = this.collection.getShortcuts().length, shortcutGroupAriaLabel = "", wrapperEle = this.$el.parent().find(".shortcut-group-wrapper");
        if (wrapperEle.length > 0) {
          btnRequired = false;
        }
        btnRequired && this.$el.before("<div class='shortcut-group-button-wrapper'><button class='shortcut-group-wrapper binf-btn' tabindex='0'></button></div>");
        this.$el.parent().off("click", ".shortcut-group-wrapper", this._onEditEnterPress).on("click", ".shortcut-group-wrapper", this._onEditEnterPress.bind(this));
        this.$el.parent().off("keydown", ".shortcut-group-wrapper", this._onKeyInEmptyPlaceHolder).on("keydown", ".shortcut-group-wrapper", _.bind(this._onKeyInEmptyPlaceHolder, this));
        switch (shortcutCount) {
         case 0:
          shortcutGroupAriaLabel = lang.emptyGroupAria;
          break;

         case 1:
          shortcutGroupAriaLabel = _.str.sformat(lang.shortcutGroupOneItemAria, shortcutCount, 4 - shortcutCount);
          break;

         case 4:
          shortcutGroupAriaLabel = lang.maxItemsGroupAria;
          break;

         default:
          shortcutGroupAriaLabel = _.str.sformat(lang.shortcutGroupMixedItemsAria, shortcutCount, 4 - shortcutCount);
        }
        this.$el.parent().find(".shortcut-group-wrapper").attr("aria-label", shortcutGroupAriaLabel);
      }
    },
    _clearShortcutTabIndexes: function() {
      if (!this.$el.find(".binf-popover").length) {
        base.clearFocusables(this.$el);
      }
    },
    currentlyFocusedElement: function() {
      var currentItem = this._currentlyFocusedShortcut();
      return currentItem && currentItem.$el;
    },
    _currentlyFocusedShortcut: function() {
      return this.children.findByIndex(this._currentShortcutIndex);
    },
    _onEditEnterPress: function(event) {
      var $target = $(event.target);
      if (this.collection.getShortcuts().length === 0 && this.$el.has($target).length === 0) {
        this.$el.find(".csui-pman-widget-masking").trigger("click");
        return false;
      } else if ($target.is(this.$el.parent().find(".shortcut-group-wrapper"))) {
        this._enterConfiguration();
        return false;
      }
      return true;
    },
    _onEditKeyDown: function(event) {
      var continueEvent = true, $target = $(event.target);
      switch (event.keyCode) {
       case 13:
       case 32:
        continueEvent = this._onEditEnterPress(event);
        break;

       case 27:
        if (this.collection.getShortcuts().length > 0) {
          if ($target.is(this.$el.find(".wrapper-button"))) {
            this.$el.parent().find(".shortcut-group-wrapper").trigger("focus");
          } else {
            this.$el.find(".csui-pman-shortcut-new .wrapper-button").trigger("focus");
          }
          continueEvent = false;
        } else if (this.collection.getShortcuts().length === 0) {
          this._exitConfiguration();
          continueEvent = false;
        }
        break;

       case 38:
        this._selectPreviousShortcut();
        break;

       case 40:
        this._selectNextShortcut();
        break;
      }
      return continueEvent;
    },
    _enterConfiguration: function() {
      this._currentShortcutIndex = -1;
      this._selectShortcut(0);
    },
    _exitConfiguration: function() {
      this.$el.parent().find(".shortcut-group-wrapper").trigger("focus");
      this._clearShortcutTabIndexes(this.$el);
    },
    onKeyInView: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.currentlyFocusedElement().trigger("click");
        break;

       case 38:
        this._selectPreviousShortcut();
        break;

       case 40:
        this._selectNextShortcut();
        break;
      }
    },
    _onKeyInEmptyPlaceHolder: function(event) {
      switch (event.keyCode) {
       case 9:
        if (event.shiftKey && $(event.target).is($(".shortcut-group-wrapper"))) {
          var index = $(document.activeElement).closest(".csui-draggable-item.csui-pman-editable-widget").index(), widgetEle = $(".csui-dnd-container>.csui-pman-editable-widget"), prevWidgetEleTop = widgetEle.eq(index - 1).offset().top, isWidgetInSameRow = widgetEle.eq(index).offset().top === prevWidgetEleTop;
          if (!isWidgetInSameRow) {
            var scrollPosition = index < 0 ? 0 : prevWidgetEleTop - $(".pman-header").height();
            $("html, body").animate({
              scrollTop: scrollPosition
            }, 0);
          }
        }
        break;
      }
    },
    _selectNextShortcut: function() {
      var index = Math.min(this._currentShortcutIndex + 1, this.collection.length - 1);
      this._selectShortcut(index);
    },
    _selectPreviousShortcut: function() {
      var index = Math.max(this._currentShortcutIndex - 1, 0);
      this._selectShortcut(index);
    },
    _selectShortcut: function(index) {
      if (index !== this._currentShortcutIndex) {
        this._currentShortcutIndex = index;
        this.trigger("changed:focus", this);
        this._currentlyFocusedShortcut().focus();
      }
    }
  }, {
    migrateSingleShortcut: function(options) {
      var shortcutTheme;
      switch (options.background) {
       case "cs-tile-background1":
        shortcutTheme = "csui-shortcut-theme-stone1";
        break;

       case "cs-tile-background2":
        shortcutTheme = "csui-shortcut-theme-teal2";
        break;

       case "cs-tile-background3":
        shortcutTheme = "csui-shortcut-theme-pink1";
        break;
      }
      return {
        shortcutItems: [ options ],
        shortcutTheme: shortcutTheme
      };
    },
    migrateData: function(widgetType, options) {
      switch (widgetType) {
       case "shortcut":
       case "csui/widgets/shortcut":
        return ShortcutsView.migrateSingleShortcut(options);

       default:
        return options;
      }
    }
  });
  _.extend(ShortcutsView.prototype, ViewEventsPropagationMixin);
  _.extend(ShortcutsView.prototype, ShortcutsViewMixin);
  return ShortcutsView;
});