/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/favorite.model", "csui/controls/progressblocker/blocker", "csui/dialogs/modal.alert/modal.alert", "csui/utils/contexts/factories/favorites", "nuc/utils/base", "d2/server.adaptors/converters/node", "d2/utils/constants", "d2/utils/node.utils", "hbs!d2/widgets/favorites/favorite.star/favorite.star.view", "i18n!csui/widgets/favorites/impl/nls/lang", "css!d2/widgets/favorites/favorite.star/favorite.star.view", "csui/controls/icons.v2" ], function($, _, Marionette, FavoriteModel, BlockingView, ModalAlert, FavoriteCollectionFactory, base, nodeConverter, constants, nodeUtils, template, lang) {
  "use strict";
  var NON_FAVORITE_NODE_TYPES = [ constants.Types.TASK, constants.Types.TASK_EVENT ];
  return Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        enabled: this.enabled(),
        addFav: lang.addFav,
        removeFav: lang.removeFav,
        iconName: this._iconName,
        selected: this.favModel.get("selected")
      };
    },
    events: {
      keydown: "onKeyInView",
      click: "_onClickView",
      "click a.csui-favorite-star.selected-star": "_clickRemoveFavoriteStar",
      "click a.csui-favorite-star.unselected-star": "_clickAddFavoriteStar"
    },
    constructor: function FavoriteStarView(options) {
      options || (options = {});
      _.defaults(options, {});
      Marionette.ItemView.call(this, options);
      if (options && options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.favCollection = options.context && options.context.getCollection(FavoriteCollectionFactory, {
        detached: true
      });
      var connector = this.model && this.model.connector;
      var favModelOptions = {};
      if (this.model) {
        favModelOptions = _.extend(this._getModelDataForFavoriteModel(), {
          selected: this.model.get("favorite")
        });
      }
      this.favModel = new FavoriteModel(favModelOptions, {
        connector: connector
      });
      this.listenTo(this.favModel, "change:selected", this.render);
    },
    enabled: function() {
      return !!(this.model && this.options.context && this.model.attributes.id && !nodeConverter.isNonDCTMNode(this.model) && !this.isNonFavoriteNode(this.model));
    },
    isNonFavoriteNode: function(model) {
      return _.contains(NON_FAVORITE_NODE_TYPES, model.get("type"));
    },
    onBeforeRender: function() {
      var selected = this.favModel.get("selected");
      this._iconName = selected ? "csui_action_fav32" : "csui_action_no_fav32";
    },
    _getModelDataForFavoriteModel: function() {
      return {
        id: this.model.get("id"),
        name: this.model.get("short_name") || this.model.get("name")
      };
    },
    scrollCheckToClosePopover: function() {
      return;
    },
    _onClickView: function(event) {
      if (!this.enabled() || this.$el.find(event.target).length > 0) {
        return;
      }
      if (this.$el.find(".selected-star").length > 0) {
        this._clickRemoveFavoriteStar(event);
      } else {
        this._clickAddFavoriteStar(event);
      }
    },
    _setBlocked: function() {
      this.commandBlocked = true;
      setTimeout(_.bind(function() {
        this.commandBlocked = false;
      }, this), 500);
    },
    _clickAddFavoriteStar: function(event) {
      event && event.preventDefault();
      if (this.commandBlocked) {
        return;
      }
      this._setBlocked();
      this.favModel.set(this._getModelDataForFavoriteModel());
      this._addFavoriteToServer();
    },
    _clickRemoveFavoriteStar: function(event) {
      event && event.preventDefault();
      if (this.commandBlocked) {
        return;
      }
      this._setBlocked();
      this._removeFavoriteFromServer();
    },
    _removeFavoriteFromClientSideCollection: function() {
      var self = this;
      this.model.set("favorite", false, {
        silent: true
      });
      this.$el.trigger("favorite:change", [ this.model ]);
      this.favCollection.remove(this.favCollection.findWhere({
        id: self.favModel.get("id")
      }));
    },
    _removeFavoriteFromServer: function() {
      var self = this;
      this.blockActions();
      this.favModel.removeFromFavorites().always(function() {
        self.unblockActions();
      }).done(function() {
        self._removeFavoriteFromClientSideCollection();
      }).fail(function(err) {
        self._showErrorMessage(self.favModel, err);
      });
    },
    _addFavoriteToClientSideCollection: function() {
      this.model.set("favorite", true, {
        silent: true
      });
      this.$el.trigger("favorite:change", [ this.model ]);
      var model = this.model.clone(), name = this.favModel.get("name"), origProps = model.get("_orig_properties");
      if (model.get("id") === nodeUtils.getHomeCabinetId()) {
        name = origProps && origProps.object_name || name;
      }
      model.set({
        name: name,
        short_name: name,
        favorite: true
      });
      this.favCollection.add(model);
    },
    _addFavoriteToServer: function() {
      var deferred = $.Deferred();
      var self = this;
      this.blockActions();
      this.favModel.addToFavorites().always(function() {
        self.unblockActions();
      }).done(function(resp) {
        deferred.resolve(resp);
        self._addFavoriteToClientSideCollection();
      }).fail(function(err) {
        deferred.reject(err);
        self._showErrorMessage(self.favModel, err);
      });
      return deferred.promise();
    },
    _showErrorMessage: function(model, iError) {
      var error = new base.Error(iError);
      var title = lang.updateFavoriteFailTitle;
      var message = _.str.sformat(lang.updateFavoriteFailMessage, model.get("id"), error.message);
      ModalAlert.showError(message, title);
    },
    toggleFavorite: function() {
      if (this.model.get("favorite")) {
        this._clickRemoveFavoriteStar();
      } else {
        this._clickAddFavoriteStar();
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.enabled() && this.toggleFavorite();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    closePopover: function() {}
  });
});