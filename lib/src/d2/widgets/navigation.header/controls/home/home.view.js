/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/utils/contexts/factories/application.scope.factory", "i18n!d2/widgets/navigation.header/controls/home/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/home/impl/home", "css!d2/widgets/navigation.header/controls/home/impl/home" ], function(Marionette, TabableRegionBehavior, ApplicationScopeModelFactory, lang, template) {
  "use strict";
  var HomeView = Marionette.ItemView.extend({
    template: template,
    className: "d2-brand-container",
    ui: {
      homeButton: ".d2-home-interaction",
      d2Logo: ".d2-brand-logo"
    },
    events: {
      "click @ui.d2Logo": "onClickHomeIcon",
      keydown: "onKeydownHomeIcon"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function HomeView(options) {
      Marionette.ItemView.call(this, options);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(options.context, "sync error", function() {
        this.toggleActiveState();
      });
      this.listenTo(this.applicationScope, "change:id", function() {
        this.toggleActiveState();
      });
    },
    templateHelpers: function() {
      return {
        title: this.getTitle()
      };
    },
    currentlyFocusedElement: function() {
      return this.$el;
    },
    onKeydownHomeIcon: function(e) {
      switch (e.which) {
       case 32:
       case 13:
        this.onClickHomeIcon(e);
        break;
      }
    },
    onClickHomeIcon: function(e) {
      this.applicationScope.set("id", "");
      e.preventDefault();
    },
    toggleActiveState: function() {
      if (this._isRendered) {
        var title = this.getTitle();
        this.ui.d2Logo.attr({
          title: title,
          "aria-label": title
        });
        if (this.isAtHome()) {
          this.$el.removeClass("home-active");
          this.ui.homeButton.removeAttr("href");
        } else {
          this.ui.homeButton.attr("href", "#");
          this.$el.addClass("home-active");
        }
      }
    },
    getTitle: function() {
      return this.isAtHome() ? lang.logoAria : lang.home;
    },
    isAtHome: function() {
      return !this.applicationScope.id;
    }
  });
  return HomeView;
});