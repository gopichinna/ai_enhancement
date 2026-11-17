/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette3", "smart/utils/smart.base", "smart/themes/theming", "i18n", "smart/controls/simple.tile/header/simple.tile.header.view", "hbs!smart/controls/simple.tile/impl/simple.tile", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/simple.tile/impl/simple.tile" ], function(_, $, Marionette, smartBase, theming, i18n, SimpleTileHeaderView, template, jatoIcons) {
  const isJato = () => theming.isJATOTheme();
  var SmartSimpleTileView = Marionette.View.extend({
    className: function() {
      return "smart-simple-tile " + (this.options.noHeader ? "smart-simple-tile-no-header" : "");
    },
    attributes: function() {
      return {
        role: "group",
        "aria-labelledby": "tileHeader" + this.cid
      };
    },
    template: template,
    regions: {
      header: ".smart-simple-tile-header-region",
      content: ".smart-simple-tile-content-region"
    },
    ui: {
      simpleTileContent: ".smart-simple-tile-content-region"
    },
    _bindEvents: function() {
      if (isJato()) {
        this.ui.simpleTileContent.off("scroll wheel", {
          view: this
        }, this._handleTileScroll).on("scroll wheel", {
          view: this
        }, this._handleTileScroll);
      }
    },
    _handleTileScroll: function() {
      const tileContent = this.closest(".csui-normal-scrolling");
      if (!tileContent.classList.contains("smart-scroll-fade-top-bottom") && tileContent.scrollTop > 4) {
        tileContent.classList.add("smart-scroll-fade-top-bottom");
      } else if (tileContent.scrollTop < 4) {
        tileContent.classList.remove("smart-scroll-fade-top-bottom");
      }
    },
    constructor: function SmartSimpleTileView(options = {}) {
      options.noHeader = options.noHeader ?? false;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      !this.options.noHeader && this.__renderHeader();
      this._bindEvents();
      this.__renderContentView();
      smartBase.isAppleMobile() === false && this._addActivationEventHandlers();
    },
    _addActivationEventHandlers: function() {
      var rightToolbar = this.el?.querySelector(".smart-simple-header-right-toolbar");
      this.$el.on("focusin", function() {
        $(rightToolbar).removeClass("smart-hide-right-toolbar");
      });
      this.$el.on("mouseover", function() {
        $(rightToolbar).removeClass("smart-hide-right-toolbar");
      });
      this.$el.on("focusout", function() {
        $(rightToolbar).addClass("smart-hide-right-toolbar");
      });
      this.$el.on("mouseleave", function() {
        $(rightToolbar).addClass("smart-hide-right-toolbar");
      });
    },
    __renderHeader: function() {
      this.options.headerId = "tileHeader" + this.cid;
      this.headerView = new SimpleTileHeaderView(this.options);
      this.headerView.render();
      this.showChildView("header", this.headerView);
      const bindHeaderEvents = (event, callback) => {
        this.listenTo(this.headerView, event, _.bind(callback, this));
      };
      bindHeaderEvents("click:back", () => {
        this.trigger("click:back");
      });
      bindHeaderEvents("click:open:perspective", () => {
        this.trigger("click:open:perspective");
      });
      bindHeaderEvents("more:link:click", () => {
        this.trigger("more:link:click");
      });
      bindHeaderEvents("click:tile:header", () => {
        this.trigger("click:tile:header");
      });
      bindHeaderEvents("change:filterValue", () => {
        this.trigger("change:filterValue");
      });
    },
    __renderContentView: function() {
      if (this.options.customContentView) {
        this.contentRegion = this.options.customContentView;
        this.contentRegion?.render();
        this.showChildView("content", this.contentRegion);
      }
    }
  });
  return SmartSimpleTileView;
});