/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "dctmw/controls/behaviors/open.app.scope.behavior", "d2/utils/perspectives/app.scope.perspectives", "d2/widgets/shortcut/shortcut.behaviors", "d2/widgets/shortcut/shortcut.behavior", "d2/widgets/shortcut/shortcut.view.model", "hbs!d2/widgets/shortcut/impl/shortcut", "i18n!d2/widgets/shortcuts/impl/nls/lang", "css!d2/widgets/shortcut/impl/shortcut", "css!d2/widgets/shortcut/impl/mini.shortcut", "css!d2/widgets/shortcut/impl/small.shortcut", "css!d2/widgets/shortcut/impl/medium.shortcut", "css!d2/widgets/shortcut/impl/large.shortcut" ], function(_, Marionette, OpenAppScopeBehavior, appScopePerspectives, shortcutBehaviors, DefaultShortcutBehavior, ShortcutViewModel, shortcutTemplate, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    constructor: function ShortcutView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options.data.options = options.data.options || {};
      options.model = new ShortcutViewModel({
        name: options.data.options.title || options.data.options.name,
        icon: options.data.options.icon,
        error: options.data.options.error
      });
      this.widgetName = options.data.options.widgetName;
      this.widgetType = options.data.options.widgetType;
      var behaviorDef = shortcutBehaviors.findByOptions(options.data.options), BehaviorClass = behaviorDef && behaviorDef.getBehaviorClass();
      if (!_.isFunction(BehaviorClass)) {
        if (options.data.options.applicationScope && appScopePerspectives.getModelForScope(options.data.options.applicationScope)) {
          BehaviorClass = OpenAppScopeBehavior;
        } else {
          BehaviorClass = DefaultShortcutBehavior;
        }
      }
      this.behaviors = _.extend(this.behaviors || {}, {
        ShortcutBehavior: {
          behaviorClass: BehaviorClass,
          registerClickEventListener: false,
          clickHandler: options.data.options.clickHandler,
          viewModel: options.model,
          context: options.context,
          data: _.defaults({
            id: options.data.id
          }, options.data.options)
        }
      });
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    tagName: "a",
    template: shortcutTemplate,
    templateHelpers: function() {
      var favName = this.model.get("name");
      return {
        icon: this.model.get("icon"),
        name: favName,
        shortcutAria: _.str.sformat(lang.shortcutPrefixAria, favName)
      };
    },
    modelEvents: {
      "change:name": "render",
      "change:icon": "render",
      "change:error": "_onError",
      "change:enabled": "_onChangeEnabled"
    },
    events: {
      click: _.debounce(function() {
        this.triggerMethod("click");
      }, 500, true)
    },
    _onError: function() {
      this.trigger("update:error", this.model);
    },
    _onChangeEnabled: function() {
      if (this.model.get("enabled") === false) {
        this.$el.addClass("csui-disabled");
      } else {
        this.$el.removeClass("csui-disabled");
      }
    }
  });
});