/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/themes/csui.jato.app.header.icons", "csui/utils/contexts/factories/branding.config.factory", "csui/widgets/navigation.header/controls/favorites/favorites.view", "hbs!csui/controls/app.header/app.header.controls/favorites/impl/favorites", "i18n!csui/controls/app.header/app.header.controls/favorites/impl/nls/localized.strings", "css!csui/controls/app.header/app.header.controls/favorites/impl/favorites" ], function($, _, jatoHeaderIcons, BrandingConfigFactory, CSUIFavoritesView, favTemplate, localizedStrings) {
  "use strict";
  var FavoritesButtonView = CSUIFavoritesView.extend({
    template: favTemplate,
    constructor: function FavoritesButtonView(options) {
      CSUIFavoritesView.call(this, options);
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.otcData = {
        icon: "csui_header:csui_header_fav42",
        className: "csui-favorites",
        arialabel: localizedStrings.FavoritesTitleAria,
        title: localizedStrings.FavoritesIconTitle,
        overflowValue: localizedStrings.FavoritesIconTitle,
        jatoIcon: jatoHeaderIcons.actionStar
      };
      this.trigger("data:synced");
      this?.options?.otcEl?.addEventListener("click", _.bind(this.onClickFavoritesIcon, this));
      this?.options?.otcEl?.addEventListener("blur", _.bind(this.onBlurButton, this));
    },
    onRender: function() {
      $(this.ui.favoritesViewContainer)[0].classList.add("binf-hidden");
      $(this?.options?.otcEl).on("mouseenter", _.bind(this._mouseEnterButton, this));
      $(this?.options?.otcEl).on("mouseleave", _.bind(this._mouseLeaveButton, this));
      let overflowButton = $(this?.options?.otcEl).closest("otc-overflow-container");
      overflowButton[0].addEventListener("blur", _.bind(this._onBlurOverflowButton, this));
    },
    _onBlurOverflowButton: function() {
      this._hideFavoritesView();
    },
    _mouseEnterButton: function() {
      this.favoritesViewInFocus = true;
    },
    _mouseLeaveButton: function() {
      this.favoritesViewInFocus = false;
    },
    documentClick: function(event) {
      if (!$(event.target).parents(".csui-favorites-view-container").length && !$(event.target).parents(".csui-favorites-icon-container").length && event.target !== this?.el) {
        this._hideFavoritesView();
      }
    },
    _showFavoritesView: function() {
      this.ui.favoritesViewContainer.removeClass("binf-hidden");
      this.ui.favoritesButtonContainer.attr("aria-expanded", "true");
      this.$el.addClass("showing-favorites-view");
      this.favoritesViewContainerRegion.show(this.favoritesView);
      this.favoritesViewContainerRegion.el.classList.remove("binf-hidden");
      $(document).off("click." + this.cid).on("click." + this.cid, _.bind(this.documentClick, this));
      this?.options?.otcEl?.setAttribute("menuopen", "");
    },
    _hideFavoritesView: function() {
      $(document).off("click." + this.cid);
      this.favoritesViewInFocus = false;
      this.ui.favoritesViewContainer.addClass("binf-hidden");
      this.ui.favoritesButtonContainer.attr("aria-expanded", "false");
      this.$el.removeClass("showing-favorites-view");
      this?.options?.otcEl?.removeAttribute("menuopen");
    },
    onClickFavoritesIcon: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.options && this.options.parentView && this.options.parentView.trigger("header:control:clicked");
      var toggleDropdown = $(".binf-open>.binf-dropdown-toggle");
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown("toggle");
      }
      this._ensureFavoritesView();
      this._toggleFavoritesView();
      event?.pointerType != "mouse" && this._focusOnFavoriteSearch(event);
    },
    _focusOnNextElement: function() {
      let appHeader = document.getElementsByTagName("otc-header-bar");
      var appHeaderButtons = appHeader[0].querySelectorAll("otc-toolbaritem");
      let overflowContainer = appHeader[0].querySelector("otc-overflow-container");
      let nextToFavButton = appHeaderButtons[0].nextSibling;
      nextToFavButton?.getAttribute("slot") !== "otc-overflow-slot" ? nextToFavButton.focus() : overflowContainer.focus();
    },
    onKeyInView: function(event) {
      let appHeader = document.getElementsByTagName("otc-header-bar");
      var appHeaderButtons = appHeader[0].querySelectorAll("otc-toolbaritem");
      let afterOverflowEle = appHeader[0].querySelectorAll("[slot='afterOverflow']");
      switch (event.keyCode) {
       case 9:
        var favoritesButtonInFocus = $(this?.options?.otcEl).is(":focus");
        var openPerspectiveInFocus = $(this.el.querySelectorAll(".cs-open-perspective-button")[0]).is(":focus");
        var listItemInFocus = document.activeElement.classList.contains("smart-simpletreelistitem") || document.activeElement.classList.contains("smart-tree-list-item");
        if (favoritesButtonInFocus && event.shiftKey !== true && !this.ui.favoritesViewContainer.hasClass("binf-hidden")) {
          this._focusOnFavoriteSearch(event);
        } else if (!favoritesButtonInFocus && event.shiftKey && !openPerspectiveInFocus) {
          if (!(listItemInFocus && this.favoritesView._isSearchInputVisible())) {
            event.preventDefault();
            event.stopPropagation();
            this?.options?.otcEl?.getAttribute("slot") !== "otc-overflow-slot" ? this._focusOnFavoriteButton() : this._focusOnOverflowButton();
          }
        } else if (!$(event.target).closest(".tile-header").length && !!this.favoritesViewInFocus) {
          this._hideFavoritesView();
          this?.options?.otcEl?.getAttribute("slot") !== "otc-overflow-slot" ? this._focusOnNextElement() : afterOverflowEle[0].focus();
          event.preventDefault();
        }
        break;

       case 40:
        if (this?.options?.otcEl?.getAttribute("slot") === "") {
          if (!this.favoritesView || this.ui.favoritesViewContainer.hasClass("binf-hidden")) {
            this.triggerMethod("click:favorites:icon", event);
            this._focusOnFavoriteSearch(event);
          } else if (this.favoritesViewInFocus !== true) {
            this._focusOnFavoriteSearch(event);
          }
        }
        break;

       case 27:
        if (!event?.target?.classList?.contains("smart-list-search-input")) {
          this?.options?.otcEl?.getAttribute("slot") !== "otc-overflow-slot" ? this._focusOnFavoriteButton() : this._focusOnOverflowButton();
          this._hideFavoritesView();
        }
        break;
      }
    },
    _focusOnFavoriteButton: function() {
      this.options?.otcEl?.focus();
      this.favoritesViewInFocus = false;
    },
    _focusOnOverflowButton: function() {
      this.options?.otcEl?.closest("otc-overflow-container")?.focus();
      this.favoritesViewInFocus = false;
    },
    onBlurButton: function() {
      if (this.favoritesViewInFocus !== true && document.activeElement !== this?.options?.otcEl) {
        this._hideFavoritesView();
      }
    }
  });
  return FavoritesButtonView;
});