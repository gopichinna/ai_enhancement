/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/models/favorite.model", "csui/dialogs/modal.alert/modal.alert", "csui/utils/base", "i18n", "csui/controls/progressblocker/blocker", "csui/utils/contexts/factories/favorites2", "csui/utils/contexts/factories/favorite2groups", "csui/widgets/favorites/impl/favorite.star/favorite.add.form.view", "csui/controls/mixins/keyboard.navigation/modal.keyboard.navigation.mixin", "csui/widgets/favorites/tileview.toolbaritems", "csui/utils/commands", "hbs!csui/widgets/favorites/impl/favorite.star/favorite.star.view", "i18n!csui/widgets/favorites/impl/nls/lang", "csui/models/favorite2", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/dialogs/node.picker/data/node.picker.extra.data", "csui/widgets/favorites/impl/favorite.star/favorite.footer.form.view", "csui/widgets/favorites/favorite.star.view.mixin", "csui/controls/icons.v2", "css!csui/widgets/favorites/impl/favorite.star/favorite.star.view", "csui/themes/carbonfiber/ot-icons/icons_csui_action" ], function(module, _, $, Marionette, FavoriteModel, ModalAlert, base, i18n, BlockingView, Favorite2CollectionFactory, Favorite2GroupsCollectionFactory, FavoriteAddFormView, ModalKeyboardNavigationMixin, tileViewToolbarItems, commands, template, lang, Favorite2Model, theming, JatoIcons, extraData, favoriteFlyoutFooterView, FavoriteStarViewMixin) {
  "use strict";
  var config = _.defaults({}, module.config() || {}, {
    addNewFavoriteAtFirst: false
  });
  var FavoriteStarView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        enabled: this.enabled(),
        showInFavoritesTable: this.favTableOptions.isFavoritesTable,
        focusable: this.options.focusable,
        iconName: this._iconName,
        iconSVG: this._iconSVG,
        iconAppearance: this.options.useIconsForDarkBackground ? "light" : "dark",
        title: this._title,
        ariaLabel: this._ariaLabel,
        selected: this.favModel.get("selected"),
        isJATO: theming.isJATOTheme(),
        id: this.uniqueViewId
      };
    },
    events: {
      "click otc-button.csui-favorite-star": "_onClickStarButton",
      "beforeClose .csui-favorite-flyout": "_onFlyoutClose"
    },
    modelEvents: {
      "change:favorite": "onChangeFavorite"
    },
    constructor: function FavoriteStarView(options) {
      options || (options = {});
      _.defaults(options, {
        formPopoverPlacement: "left",
        popoverAtBodyElement: false,
        focusable: true,
        favIcon: "csui_action:action_no_fav32",
        favOnIcon: "csui_action:action_fav32",
        favSVG: JatoIcons.actionStar,
        favOnSVG: JatoIcons.actionStarFilled
      });
      this.favTableOptions = options.favoritesTableOptions || {};
      Marionette.ItemView.call(this, options);
      if (options && options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      }
      var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
      this.favGroupsCollection = options.context && options.context.getCollection(Favorite2GroupsCollectionFactory, {
        detached: true,
        permanent: true,
        favorites: {
          options: {
            promotedActionCommands: [],
            nonPromotedActionCommands: nonPromotedActionCommands
          }
        }
      });
      var limitedRS = Favorite2CollectionFactory.getLimitedResourceScope();
      this.favGroupsCollection.favorites.setResourceScope(limitedRS);
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
      this.uniqueViewId = "view" + _.uniqueId();
      this.popoverContainerClassname = "csui-favorite-popover-container " + this.uniqueViewId;
      this.popoverContainerSelector = ".csui-favorite-popover-container." + this.uniqueViewId;
      $(window).on("resize." + this.uniqueViewId, {
        view: this
      }, this._onWindowResize);
    },
    onBeforeDestroy: function() {
      this.triggerMethod("close:add:favorite:form");
      this.closePopover();
      $(window).off("resize." + this.uniqueViewId, this._onWindowResize);
    },
    enabled: function() {
      let disabled = this.model?.attributes?.fav_disabled ?? false;
      return this.model && !disabled && this.options.context ? true : false;
    },
    onBeforeRender: function() {
      const selected = this.favModel.get("selected");
      const name = this.model.get("name");
      this._iconName = selected ? this.options.favOnIcon : this.options.favIcon;
      this._iconSVG = selected ? this.options.favOnSVG : this.options.favSVG;
      this._title = selected ? lang.removeFav : lang.addFav;
      this._ariaLabel = selected ? _.str.sformat(lang.removeFavAria, name) : _.str.sformat(lang.addFavAria, name);
    },
    onRender: function() {
      if (this._previousFocusElm) {
        if ($(this._previousFocusElm).hasClass("csui-favorite-star")) {
          this.$el.find("otc-button.csui-favorite-star").trigger("focus");
          this._previousFocusElm = undefined;
        }
      }
      this._previousTitle = undefined;
      this.delegateEvents();
    },
    _collectionEnsureFetched: function() {
      var self = this;
      var deferred = $.Deferred();
      this.blockActions && this.blockActions();
      this.favGroupsCollection.ensureFetched().always(function() {
        self.unblockActions && self.unblockActions();
      }).done(function(resp) {
        deferred.resolve(resp);
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    },
    _onWindowResize: function(event) {
      if (base.isTouchBrowser() || base.isAppleMobile()) {
        return;
      }
      if (event && event.data && event.data.view) {
        var self = event.data.view;
        self.showingForm && self.closePopover();
      }
    },
    _getPopoverParent: function() {
      return this.options.popoverAtBodyElement ? $(this.popoverContainerSelector) : this.$el;
    },
    _handleScrollEvent: function(event) {
      if (base.isTouchBrowser() || base.isAppleMobile()) {
        return;
      }
      if (!$(event.target).closest(".csui-favorite-flyout").length) {
        var self;
        if (event && event.data && event.data.view) {
          self = event.data.view;
          $(document).off("scroll wheel", self._handleScrollEvent);
          $(window).off("resize", self._handleScrollEvent);
        }
        self && self.closePopover();
      }
    },
    _getModelDataForFavoriteModel: function() {
      var tabId;
      if (this.favTableOptions.isFavoritesTable && this.favTableOptions.selectedGroup) {
        tabId = this.favTableOptions.selectedGroup.get("tab_id");
      } else {
        tabId = this.model.get("favorite_tab_id") || -1;
      }
      return {
        id: this.model.get("id"),
        name: this.model.get("favorite_name") || this.model.get("name"),
        tab_id: tabId
      };
    },
    _onClickView: function(event) {
      if (!this.enabled() || this.$el.find(event.target).length > 0) {
        return;
      }
      this._onClickStarButton(event);
    },
    _onClickStarButton: async function(event) {
      var isFavorite = this.favModel.get("selected");
      if (isFavorite) {
        this._clickRemoveFavoriteStar(event);
      } else {
        if (this.el?.querySelectorAll(".csui-favorite-flyout")?.length == 0) {
          let flyoutEle = await document.createElement("otc-flyout");
          flyoutEle.setAttribute("class", "csui-favorite-flyout csui-flyout-hide");
          flyoutEle.setAttribute("arialabel", this._ariaLabel);
          this.el.querySelector(".csui-favorite-star").setAttribute("menuopen", "");
          flyoutEle.setAttribute("buttonid", this.uniqueViewId);
          $(flyoutEle).appendTo(this.$el.find(".csui-favorite-star-view-container"));
        }
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
      if (this.commandBlocked) {
        return;
      }
      if (!this.el.querySelector(".csui-favorite-flyout").hasAttribute("isopen")) {
        this._setBlocked();
      }
      this._capturePreviousFocusElement();
      this.favModel.set(this._getModelDataForFavoriteModel());
      if (this.favTableOptions.isFavoritesTable) {
        this._addFavoriteToClientSideCollection({
          listenToEvent: true,
          newFavModel: this.favModel
        });
        this.favGroupsCollection.trigger("bulk:update");
      } else {
        this._addFavoriteWithForm();
      }
    },
    _clickRemoveFavoriteStar: function(event) {
      if (this.commandBlocked) {
        return;
      }
      this._setBlocked();
      this._capturePreviousFocusElement();
      this.favModel.set(this._getModelDataForFavoriteModel());
      if (this.favTableOptions.isFavoritesTable) {
        this._removeFavoriteFromClientSideCollection(true);
        this.favGroupsCollection.trigger("bulk:update");
      } else {
        this._removeFavoriteFromServer();
      }
    },
    _clickAddButton: function() {
      if (this.commandBlocked) {
        return;
      }
      this._addFavoriteToServer().done(_.bind(function() {
        this._previousTitle = undefined;
        this.closePopover(true);
        this._restorePreviousFocusAfterClosingPopover();
      }, this));
    },
    _clickCancelButton: function() {
      this.closePopover();
    },
    _capturePreviousFocusElement: function() {
      this._previousFocusElm = document.activeElement;
    },
    _restorePreviousFocusAfterClosingPopover: function() {
      if (this._previousFocusElm) {
        var $previousElm = $(this._previousFocusElm);
        if ($previousElm.hasClass("csui-favorite-star")) {
          this.$el.find("otc-button.csui-favorite-star").trigger("focus");
        } else {
          $previousElm.trigger("focus");
        }
        this._previousFocusElm = undefined;
      }
    },
    closePopover: function(flag) {
      $(document).off("scroll wheel", this._handleScrollEvent);
      $(window).off("resize", this._handleScrollEvent);
      this.el.querySelectorAll(".csui-favorite-star").length != 0 && this.el.querySelector(".csui-favorite-star")?.removeAttribute("menuOpen");
      if (this.el.querySelectorAll(".csui-favorite-flyout").length != 0) {
        this.el.querySelector(".csui-favorite-flyout")?.removeAttribute("isOpen");
        this.el.querySelector(".csui-favorite-flyout")?.classList.add("csui-flyout-hide");
      }
      setTimeout(_.bind(function() {
        this.addForm && this.addForm.destroy();
        this.addForm = undefined;
        this.formFooter && this.formFooter.destroy();
        this.formFooter = undefined;
        !flag && this.el.querySelectorAll(".csui-favorite-star").length != 0 && this.el.querySelector(".csui-favorite-star")?.focus();
      }, this), 50);
    },
    _onFlyoutClose: function(e) {
      $(document).off("scroll wheel", this._handleScrollEvent);
      $(window).off("resize", this._handleScrollEvent);
      if (e.target.classList.contains("csui-favorite-flyout")) {
        e.target.classList.add("csui-flyout-hide");
      }
    },
    _removeFavoriteFromClientSideCollection: function(listenToEvent) {
      var self = this;
      this._setModelFavorite(false);
      this.$el.trigger("favorite:change");
      if (listenToEvent === true) {
        this.listenToOnce(this.favGroupsCollection, "bulk:update:succeed", function() {
          self.stopListening(self.favGroupsCollection, "bulk:update:fail");
          self.favModel.set("selected", false);
        });
        this.listenToOnce(this.favGroupsCollection, "bulk:update:fail", function() {
          self.stopListening(self.favGroupsCollection, "bulk:update:succeed");
          self._setModelFavorite(true);
        });
      }
      this._collectionEnsureFetched().always(function() {
        self.favGroupsCollection.each(function(group) {
          group.favorites && group.favorites.remove({
            id: self.favModel.get("id")
          });
        });
      });
    },
    _removeFavoriteFromServer: function() {
      var self = this;
      this.blockActions && this.blockActions();
      this.favModel.removeFromFavorites().always(function(data) {
        self.unblockActions && self.unblockActions();
      }).done(function(resp) {
        self._removeFavoriteFromClientSideCollection();
      }).fail(function(err) {
        self._showErrorMessage(self.favModel, err);
      });
    },
    _addFavoriteWithForm: function() {
      this._collectionEnsureFetched().always(_.bind(function() {
        this._showAddFavoriteForm();
      }, this));
    },
    _showAddFavoriteForm: async function() {
      this.favModel.set(this._getModelDataForFavoriteModel());
      this.addForm && this.addForm.destroy();
      this.formFooter && this.formFooter.destroy();
      this.addForm = new FavoriteAddFormView({
        context: this.options.context,
        model: this.model,
        favModel: this.favModel,
        collection: this.favGroupsCollection,
        parentView: this
      });
      this.addForm.render();
      this.formFooter = new favoriteFlyoutFooterView({
        addFormView: this.addForm
      });
      this.formFooter.render();
      await $(this.addForm.el).appendTo($(this.el.querySelector(".csui-favorite-flyout")));
      await $(this.formFooter.el).appendTo($(this.el.querySelector(".csui-favorite-flyout")));
      this.el.querySelector(".csui-favorite-flyout").classList.remove("csui-flyout-hide");
      this.el.querySelector(".csui-favorite-flyout").setAttribute("isopen", "");
      var currentlyFocusedEle = this.addForm.currentlyFocusedElement();
      currentlyFocusedEle[0].focus();
      this.listenTo(this.formFooter, "click:add:button", _.bind(() => {
        this.addForm?.validateNameInputAndSetAddButtonState();
        this._clickAddButton();
      }, this));
      this.listenTo(this.formFooter, "click:cancel:button", this._clickCancelButton);
      $(document).on("scroll wheel", {
        view: this
      }, this._handleScrollEvent);
      $(window).on("resize", {
        view: this
      }, this._handleScrollEvent);
    },
    _addFavoriteToClientSideCollection: function({
      listenToEvent,
      newFavModel
    }) {
      var self = this;
      this._setModelFavorite(true);
      this.$el.trigger("favorite:change", this.favModel);
      if (listenToEvent === true) {
        this.listenToOnce(this.favGroupsCollection, "bulk:update:succeed", function() {
          self.stopListening(self.favGroupsCollection, "bulk:update:fail");
          self.favModel.set("selected", true);
        });
        this.listenToOnce(this.favGroupsCollection, "bulk:update:fail", function() {
          self.stopListening(self.favGroupsCollection, "bulk:update:succeed");
          self._setModelFavorite(false);
        });
      }
      this._collectionEnsureFetched().always(_.bind(function() {
        var tabId = newFavModel.get("tab_id"), group = this.favGroupsCollection.findWhere({
          tab_id: tabId
        }), favModelOptions = {};
        const clonedModel = this.model.clone();
        clonedModel.set({
          favorite: true,
          favorite_name: this.favModel.get("name"),
          favorite_tab_id: tabId
        });
        if (config.addNewFavoriteAtFirst) {
          favModelOptions.at = 0;
        }
        if (clonedModel?.get("tab_id") === -1) {
          delete clonedModel.attributes.tab_id;
        }
        group.favorites.add(clonedModel, favModelOptions);
        self.favGroupsCollection.collectionUpdated = true;
      }, this));
    },
    _addFavoriteToServer: function() {
      var deferred = $.Deferred();
      var self = this;
      this.blockActions && this.blockActions();
      this.favModel.addToFavorites().always(function(data) {
        self.unblockActions && self.unblockActions();
      }).done(function(resp) {
        if (resp?.results) {
          let newFavModel = new Favorite2Model({
            ...self?.favModel?.attributes
          }, {
            connector: self.model?.connector
          });
          var limitedRS = Favorite2CollectionFactory?.getLimitedResourceScope(), fieldsArray = Object.keys(extraData?.getModelFields());
          for (let i = 0; i < fieldsArray?.length; i++) {
            let key = fieldsArray[i];
            !limitedRS?.fields?.hasOwnProperty(key) && (limitedRS.fields[key] = "");
          }
          newFavModel?.setResourceScope(limitedRS);
          newFavModel.fetch().then(function(response) {
            deferred.resolve();
            self?._addFavoriteToClientSideCollection({
              newFavModel: newFavModel
            });
          });
        } else {
          self?._showErrorMessage(self.favModel);
        }
      }).fail(function(err) {
        deferred.reject(err);
        self?._showErrorMessage(self.favModel, err);
      });
      return deferred.promise();
    },
    _showErrorMessage: function(model, iError) {
      let error = new base.Error(iError);
      let title = lang.updateFavoriteFailTitle;
      let message = _.str.sformat(lang.updateFavoriteFailMessage, model.get("id"), error.message);
      if (_.isFunction(this._getCustomErrorMessage)) {
        let obj = this._getCustomErrorMessage({
          model: model,
          error: error
        });
        message = obj.message ?? message;
        title = obj.title ?? title;
      }
      ModalAlert.showError(message, title).always(_.bind(function() {
        this._restorePreviousFocusAfterClosingPopover();
      }, this));
    },
    _setModelFavorite: function(bFavorite) {
      this.model.set("favorite", bFavorite, {
        silent: true
      });
    },
    onChangeFavorite: function() {
      this.favModel.set("selected", this.model.get("favorite"));
    }
  });
  ModalKeyboardNavigationMixin.mixin(FavoriteStarView.prototype);
  FavoriteStarViewMixin.mixin(FavoriteStarView.prototype);
  return FavoriteStarView;
});