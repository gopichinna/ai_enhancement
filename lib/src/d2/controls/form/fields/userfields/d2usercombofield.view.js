/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/d2combofield.view", "d2/widgets/user.info/user.info.view", "dctmw/utils/utils", "d2/utils/user.utils", "hbs!d2/controls/form/fields/userfields/impl/d2usercombofield.item", "css!d2/controls/form/fields/userfields/impl/d2usercombofield" ], function(_, $, Backbone, Marionette, Alpaca, D2ComboFieldView, UserInfoView, utils, userUtils, ComboItemViewTemplate) {
  "use strict";
  var itemView = Marionette.ItemView.extend({
    template: ComboItemViewTemplate,
    tagName: "li",
    className: "d2-combofield-option d2-user-combofield-option",
    attributes: function() {
      return {
        id: this.model.get("id")
      };
    },
    events: {
      mousedown: "onClickOption"
    },
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", function() {
        this.render();
      });
    },
    onRender: function() {
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), userId = this.model.get("id"), userData = this.options.parentView._getUserData(userId);
      if (!this.userInfoView) {
        this.userInfoView = new UserInfoView({
          model: new Backbone.Model(userData),
          context: this.options.context,
          userInfoId: this.options.userInfoId
        });
        this.userInfoView.render();
        this.$el.on("user:profile:picture:fetch", _.bind(this.userInfoView.trigger, this.userInfoView, "show:profile:picture"));
        this.listenTo(this.userInfoView, "user:profile:picture:fetched", _.bind(this.onProfilePictureFetch, this));
      }
      this.$el.find(".user-info-container").append(this.userInfoView.$el);
      this.userInfoView.updateInfoText(searchRegex);
      if (searchRegex) {
        if (userUtils.checkUserMatchWithSearch(userId, userData["user_address"], searchRegex)) {
          this.model.set("exactMatch", true);
        } else {
          this.model.set("exactMatch", false);
        }
      }
    },
    onClickOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod("click:item");
    },
    onProfilePictureFetch: function() {
      this.$el.addClass("user-profile-image-fetched");
    }
  });
  return D2ComboFieldView.extend({
    constructor: function D2UserComboFieldView() {
      D2ComboFieldView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "field:changed", this.onFieldChange);
      this.context = this.alpacaField.connector.config.context;
      this.isExternal = this.alpacaField.options.isExternal;
      this.resultCount = this.optionsCollection && this.optionsCollection.length > 0 ? this.optionsCollection.length : null;
      this.showSearchCount = true;
    },
    templateHelpers: function() {
      var value = this.getValue();
      return _.extend(D2ComboFieldView.prototype.templateHelpers.apply(this, arguments), {
        data: value.get("id")
      });
    },
    className: function() {
      var parentClassName = D2ComboFieldView.prototype.className || "";
      if (_.isFunction(parentClassName)) {
        parentClassName = parentClassName.apply(this, arguments);
      }
      return parentClassName + " d2-user-combofield";
    },
    events: _.extend(_.result(D2ComboFieldView.prototype, "events"), {
      "mouseenter @ui.writeField": "onMouseEnterWriteField",
      "mouseleave @ui.writeField": "onMouseLeaveWriteField"
    }),
    childView: itemView,
    childViewOptions: function() {
      var parentChildViewOptions = D2ComboFieldView.prototype.childViewOptions, childOptions = {};
      if (parentChildViewOptions) {
        if (_.isFunction(parentChildViewOptions)) {
          childOptions = parentChildViewOptions.apply(this, arguments);
        } else if (_.isObject(parentChildViewOptions)) {
          childOptions = parentChildViewOptions;
        }
      }
      return _.extend(childOptions, {
        parentView: this,
        context: this.context
      });
    },
    onRender: function() {
      D2ComboFieldView.prototype.onRender.apply(this, arguments);
      this._enablePopover();
    },
    onFieldChange: function() {
      this.hideCustomErrorMsg();
    },
    getOptionMatchChecker: function() {
      var me = this;
      return function(model, searchRegex) {
        var userId = model.get("id"), userData = me._getUserData(userId), userAddress = userData["user_address"], status = false;
        if (!_.isNull(searchRegex)) {
          if (userId && userId.match(searchRegex) || userAddress && userAddress.match(searchRegex)) {
            status = true;
          } else {
            status = false;
          }
        } else {
          status = true;
        }
        model.set("exactMatch", false);
        return status;
      };
    },
    filterFunction: function(child) {
      var userId = child.get("id"), userData = this._getUserData(userId), userAddress = userData["user_address"], status = false;
      if (!_.isNull(this.searchRegex)) {
        if (userId && userId.match(this.searchRegex) || userAddress && userAddress.match(this.searchRegex)) {
          child.set("searchRegex", this.searchRegex);
          status = true;
        } else {
          status = false;
        }
      } else {
        child.set("searchRegex", this.searchRegex);
        status = true;
      }
      child.set("exactMatch", false);
      return status;
    },
    getVisibleOptionsCount: function() {
      if (utils.isMobile()) {
        return Math.ceil(this._calculateHeight() / 50) + 5;
      }
      return 10;
    },
    onClickAddOption: function(event) {
      var self = this, args = arguments, searchText = self.searchText;
      self.hideCustomErrorMsg();
      userUtils.validateSearchedUser(searchText, self.context, self.isExternal).always(function() {
        self.ui.writeField.val(searchText).trigger("focus");
      }).done(function(userObject) {
        if (userObject) {
          var userId = userObject["id"], userDump = {};
          userDump[userId] = userObject;
          self.formView.setUserData(userDump);
          self.searchText = userId;
        } else {
          self.searchText = searchText;
        }
        D2ComboFieldView.prototype.onClickAddOption.apply(self, args);
        self.filterOptions.call(self, searchText, event);
        userUtils.fetchUserProfilePictureForVisibleOptions(self.ui.scrollContainer, "d2-user-combofield-option");
      }).fail(function(errorMsg) {
        event.preventDefault();
        event.stopPropagation();
        self.showCustomErrorMsg(errorMsg);
        self.hideOptions();
      });
    },
    onMouseEnterWriteField: function(event) {
      this._showPopover();
      event.preventDefault();
      event.stopPropagation();
    },
    onMouseLeaveWriteField: function(event) {
      this._hidePopover();
      event.preventDefault();
      event.stopPropagation();
    },
    focusOutAction: function() {
      D2ComboFieldView.prototype.focusOutAction.apply(this, arguments);
      this._hidePopover();
      this.hideCustomErrorMsg();
    },
    focusInAction: function(event, eventData) {
      D2ComboFieldView.prototype.focusInAction.apply(this, arguments);
      if (!eventData || !eventData.forceTrigger) {
        this._showPopover();
      }
      this.hideCustomErrorMsg();
    },
    showCustomErrorMsg: function(errorMsg) {
      var messageTemplateDescriptor = this.alpacaField.view.getTemplateDescriptor("message");
      var customErrorMessageEl = Alpaca.tmpl(messageTemplateDescriptor, {
        id: "userErrorMessage",
        message: errorMsg,
        view: this.alpacaField.view
      });
      customErrorMessageEl.addClass("d2-user-error-message").attr("role", "alert");
      this.ui.writeFieldInner.parent().append(customErrorMessageEl);
    },
    hideCustomErrorMsg: function() {
      this.ui.writeFieldInner.parent().find(".d2-user-error-message").remove();
    },
    _getUserData: function(id) {
      var userData = {
        id: id,
        isExternal: this.isExternal
      };
      if (!this.isExternal) {
        var formUserData = this.formView && this.formView.userData && this.formView.userData[id];
        if (formUserData) {
          _.extend(userData, formUserData);
        }
      }
      return userData;
    },
    onTextSearch: function() {
      this._hidePopover();
      this.hideCustomErrorMsg();
    },
    _enablePopover: function() {
      var value = this.getValue(), userId = value.get("id"), userData = this._getUserData(userId);
      this.tooltipUserInfoView = new UserInfoView({
        model: new Backbone.Model(userData),
        context: this.context,
        label: this.alpacaField && this.alpacaField.options && this.alpacaField.options.label,
        forceProfilePictureFetch: true
      });
      var $userInfoEl = this.tooltipUserInfoView.render().$el;
      this.ui.writeFieldInner.parent().addClass("user-info-popover-content");
      this.ui.writeFieldInner.binf_popover({
        content: $userInfoEl,
        html: true,
        placement: this._getPopoverPlacement.bind(this)
      });
      this.ui.writeFieldInner.parent().addClass("popover-hidden");
      if (this.alpacaField && this.alpacaField.options && this.alpacaField.options.ensureUserInfoForValue && this.formView && this.formView.userData && this.formView.userData && !this.formView.userData[userId]) {
        userUtils.getUserDetails(userId, this.context).done(_.bind(function(userData) {
          this.formView.userData[userId] = userData;
          this.tooltipUserInfoView.updateUserInfo(userData);
        }, this));
      }
    },
    _getPopoverPlacement: function() {
      var placement = "bottom", contentHeight = this._getheightOfPopupContent(), viewportHeight = $(window).height(), topPosition = this.$el.offset().top + this.$el.outerHeight() + 20, remainingHeight = viewportHeight - topPosition;
      if (contentHeight > remainingHeight) {
        placement = "top";
      }
      return placement;
    },
    _getheightOfPopupContent: function() {
      var $userInfoEl = this.tooltipUserInfoView.$el.clone();
      this.ui.writeFieldInner.parent().append($userInfoEl);
      var height = $userInfoEl.outerHeight();
      $userInfoEl.remove();
      return height;
    },
    _showPopover: function() {
      if (this._isPopoverEnabled()) {
        var value = this.getValue(), userId = value.get("id"), userData = this._getUserData(userId);
        this.tooltipUserInfoView.updateUserInfo(userData);
        this.ui.writeFieldInner.parent().removeClass("popover-hidden");
        this.ui.writeFieldInner.binf_popover("show");
      } else {
        this.ui.writeFieldInner.parent().addClass("popover-hidden");
      }
    },
    _hidePopover: function() {
      this.ui.writeFieldInner.parent().addClass("popover-hidden");
      this.ui.writeFieldInner.binf_popover("hide");
    },
    _isPopoverEnabled: function() {
      var value = this.getValue();
      return !utils.isMobile() && value && value.get("id") && value.get("id") === this.ui.writeField.val() && !this.ui.comboOptionsContainer.hasClass("binf-show");
    }
  });
});