/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/widgets/favorites/impl/favorite.star/favorite.add.footer", "i18n!csui/widgets/favorites/impl/nls/lang", "smart/themes/theming" ], function(_, $, Marionette, template, lang, theming) {
  var FavoriteAddFooterView = Marionette.ItemView.extend({
    template: template,
    attributes: {
      slot: "foot"
    },
    triggers: {
      "click .csui-add-fav-btn": "click:add:button",
      "click .csui-cancel-fav-btn": "click:cancel:button"
    },
    ui: {
      addButton: ".csui-add-fav-btn",
      cancelButton: ".csui-cancel-fav-btn"
    },
    events: {
      "keydown @ui.addButton": "onClickAddButton",
      "keydown @ui.cancelButton": "onClickCancelButton"
    },
    onClickAddButton: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.trigger("click:add:button");
      }
    },
    onClickCancelButton: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.trigger("click:cancel:button");
      }
    },
    templateHelpers: function() {
      let isJATO = theming.isJATOTheme();
      return {
        add_button_label: lang.addFavoriteAddButtonLabel,
        cancel_button_label: lang.addFavoriteCancelButtonLabel,
        add_button_arialabel: lang.addFav,
        cancel_button_arialabel: lang.closeFavFlyout,
        isJATO: isJATO
      };
    },
    constructor: function FavoriteAddFooterView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return FavoriteAddFooterView;
});