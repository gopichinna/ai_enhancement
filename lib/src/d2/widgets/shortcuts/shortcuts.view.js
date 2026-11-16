/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "d2/widgets/error/error.view", "d2/widgets/shortcut/shortcut.view", "d2/utils/constants", "hbs!d2/widgets/shortcuts/impl/shortcuts", "css!d2/widgets/shortcuts/impl/shortcuts" ], function(_, $, Backbone, Marionette, TabableRegionBehavior, LayoutViewEventsPropagationMixin, ErrorView, ShortcutView, constants, template) {
  "use strict";
  var THEME_SUFFIX = [ "shade1", "shade2", "shade3", "shade4" ];
  var ShortcutsView = Marionette.LayoutView.extend({
    constructor: function ShortcutsView(options) {
      options || (options = {});
      options.data || (options.data = {
        shortcutItems: []
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      this._setupItems();
      this._currentShortcutIndex = 0;
    },
    tagName: "div",
    className: "d2-shortcut-container tile",
    template: template,
    templateHelpers: function() {
      return {
        items: this._items
      };
    },
    regions: {
      shortcut0: ".shortcut-region-0",
      shortcut1: ".shortcut-region-1",
      shortcut2: ".shortcut-region-2",
      shortcut3: ".shortcut-region-3"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    events: {
      keydown: "onKeyInView"
    },
    _setupItems: function() {
      var self = this;
      var layout;
      switch (self.options.data.shortcutItems.length) {
       case 1:
        layout = "large";
        break;

       case 2:
        layout = "medium";
        break;

       case 3:
        layout = "small";
        break;

       default:
        layout = "mini";
      }
      self._items = _.map(_.first(this.options.data.shortcutItems, 4), function(item, index, arr) {
        var theme, color;
        if (item.options.theme && item.options.theme.type && item.options.theme.color) {
          theme = self._getShortcutTheme(item.options.theme.type, item.options.theme.color);
        } else if (item.options.color && item.options.color["background-color"] && item.options.color["text-color"]) {
          theme = undefined;
          color = item.options.color;
        } else {
          theme = self._getDefaultShortcutTheme(index, arr.length);
        }
        delete item.options.theme;
        delete item.options.color;
        delete item.options.order;
        var shortcutView = self._getShortcutView(item.id || item.launchButtonID, item.type, self.options.context, item.options);
        self.listenTo(shortcutView, "update:error", function(index, model) {
          var region = self.getRegion("shortcut" + index);
          if (model.get("error")) {
            region.show(new ErrorView({
              data: model.get("error")
            }));
          }
        }.bind(self, index));
        return {
          id: item.id || item.lauchButtonID,
          type: item.type,
          layout: layout,
          theme: theme,
          color: color,
          shortcutView: shortcutView
        };
      });
    },
    _getShortcutTheme: function(type, shade) {
      return "csui-shortcut-theme-" + type + "-" + shade;
    },
    _getDefaultShortcutTheme: function(itemIndex, numberOfItems) {
      var theme = "csui-shortcut-theme-grey";
      if (numberOfItems === 1) {
        theme += "-" + THEME_SUFFIX[0];
      } else if (numberOfItems > 1) {
        theme += "-" + THEME_SUFFIX[itemIndex];
      }
      return theme;
    },
    _getShortcutView: function(id, type, context, options) {
      return new ShortcutView({
        data: {
          id: id,
          type: type,
          options: options
        },
        context: context
      });
    },
    onRender: function() {
      var self = this;
      this.$el.attr("role", "menu");
      _.each(this._items, function(item, index) {
        var region = self.getRegion("shortcut" + index);
        var $el = item.shortcutView.$el;
        if (item.theme === undefined) {
          var c = item.color;
          $el.css({
            "background-color": c["background-color"].content,
            color: c["text-color"].content
          });
        } else {
          $el.addClass(item.theme);
        }
        $el.addClass("csui-shortcut-item csui-acc-focusable csui-" + item.layout);
        region.show(item.shortcutView);
      });
    },
    onDomRefresh: function() {
      var self = this;
      _.each(this._items, function(item, index) {
        var region = self.getRegion("shortcut" + index);
        if (item.shortcutView.model.get("error")) {
          region.show(new ErrorView({
            data: item.shortcutView.model.get("error")
          }));
        }
      });
    },
    currentlyFocusedElement: function() {
      return this._items[this._currentShortcutIndex].shortcutView.$el;
    },
    onKeyInView: function(event) {
      if (event.keyCode === 38) {
        this._selectPreviousShortcut();
      } else if (event.keyCode === 40) {
        this._selectNextShortcut();
      } else if (event.keyCode === 32 || event.keyCode === 13) {
        this.currentlyFocusedElement().trigger("click");
      }
    },
    _selectNextShortcut: function() {
      var index = Math.min(this._currentShortcutIndex + 1, this._items.length - 1);
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
        this.currentlyFocusedElement().trigger("focus");
      }
    }
  });
  _.extend(ShortcutsView.prototype, LayoutViewEventsPropagationMixin);
  return ShortcutsView;
});