/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/lib/alpaca/js/alpaca.lite", "d2/controls/form/fields/listfieldview/d2listfield.view", "d2/controls/form/fields/listfieldview/d2listfieldsearch.view", "d2/controls/form/fields/listfieldview/d2listfieldoptions.view", "d2/controls/form/fields/listfieldview/d2listfieldoptionsitem.view", "d2/controls/form/fields/listfieldview/d2listfieldselection.view", "d2/controls/form/fields/listfieldview/d2listfieldselectionitem.view", "d2/widgets/user.info/user.info.view", "d2/utils/user.utils", "dctmw/utils/utils", "i18n!d2/controls/form/fields/userfields/impl/nls/lang", "hbs!d2/controls/form/fields/userfields/impl/d2userlistfieldoptions.item", "hbs!d2/controls/form/fields/userfields/impl/d2userlistfieldselection.item", "css!d2/controls/form/fields/userfields/impl/d2userlistfield" ], function(_, $, Backbone, Marionette, Alpaca, ListFieldView, ListFieldSearchView, ListFieldOptionsView, ListFieldOptionsItemView, ListFieldSelectionView, ListFieldSelectionItemView, UserInfoView, userUtils, utils, lang, OptionsItemViewTemplate, SelectionItemViewTemplate) {
  "use strict";
  function getUserData(id, isExternal, formView) {
    var userData = {
      id: id,
      isExternal: isExternal
    };
    if (!isExternal) {
      var formUserData = formView && formView.userData && formView.userData[id];
      if (formUserData) {
        _.extend(userData, formUserData);
      }
    }
    return userData;
  }
  function getClassName(parentCiewClass) {
    var parentClassName = parentCiewClass.prototype.className || "";
    if (_.isFunction(parentClassName)) {
      parentClassName = parentClassName.apply(this, arguments);
    }
    return parentClassName;
  }
  var UserOptionItemView = ListFieldOptionsItemView.extend({
    constructor: function UserOptionItemView() {
      ListFieldOptionsItemView.prototype.constructor.apply(this, arguments);
      this.fieldView = this.options.parentView.options.parentView;
    },
    className: function() {
      return getClassName.call(this, ListFieldOptionsItemView) + " d2-user-list-option";
    },
    template: OptionsItemViewTemplate,
    onRender: function() {
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), userId = this.model.get("id"), userData = getUserData(userId, this.fieldView.isExternal, this.fieldView.formView);
      if (!this.userInfoView) {
        this.userInfoView = new UserInfoView({
          model: new Backbone.Model(userData),
          context: this.fieldView.context
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
    getItemSelector: function() {
      return "a.user-options-item";
    },
    onProfilePictureFetch: function() {
      this.$el.addClass("user-profile-image-fetched");
    }
  });
  var D2UserListFieldOptionsView = ListFieldOptionsView.extend({
    constructor: function D2UserListFieldOptionsView() {
      ListFieldOptionsView.prototype.constructor.apply(this, arguments);
      this.fieldView = this.options.parentView;
      this.context = this.fieldView.context;
      this.showSearchCount = true;
    },
    className: function() {
      return getClassName.call(this, ListFieldOptionsView) + " d2-user-listfield-options-wrapper";
    },
    childView: UserOptionItemView,
    setFocus: function() {
      if (this.children.findByIndex(0)) {
        var firstItem = this.children.findByIndex(0).$el.find("a.user-options-item");
        firstItem.attr("tabindex", 0);
        firstItem.trigger("focus");
      } else {
        this.ui.addNewOption.length === 1 && this.ui.addNewOption.find("a").trigger("focus");
      }
    },
    showOptions: function() {
      this.updateTabindexForAddNew();
      ListFieldOptionsView.prototype.showOptions.apply(this, arguments);
    },
    updateTabindexForAddNew: function() {
      if (this.options.isEditableList) {
        this.ui.addNewOption.find("a").attr("tabindex", 0);
      }
    },
    onClickAddOption: function(event) {
      var self = this, args = arguments, searchText = this.searchText;
      self.fieldView.hideCustomErrorMsg();
      userUtils.validateSearchedUser(searchText, this.context, this.fieldView.isExternal).always(function() {
        self.fieldView.ui.writeField.val(searchText).trigger("focus");
      }).done(function(userObject) {
        if (userObject) {
          var userId = userObject["id"], userDump = {};
          userDump[userId] = userObject;
          self.fieldView.formView.setUserData(userDump);
          self.searchText = userId;
          self.filterOptions(searchText);
          self.showOptions(self.fieldView.alpacaField.options.label);
        } else {
          self.searchText = searchText;
        }
        ListFieldOptionsView.prototype.onClickAddOption.apply(self, args);
        userUtils.fetchUserProfilePictureForVisibleOptions(self.ui.options, "d2-user-list-option");
      }).fail(function(errorMsg) {
        event.preventDefault();
        event.stopPropagation();
        self.fieldView.showCustomErrorMsg(errorMsg);
      });
    },
    onTextSearch: function() {
      this.fieldView.hideCustomErrorMsg();
    },
    onRender: function() {
      ListFieldOptionsView.prototype.onRender.apply(this, arguments);
    },
    updateHeight: function() {
      ListFieldOptionsView.prototype.updateHeight.apply(this, arguments);
      userUtils.fetchUserProfilePictureForVisibleOptions(this.ui.options, "d2-user-list-option");
    }
  });
  var UserSelectionItemView = ListFieldSelectionItemView.extend({
    constructor: function UserSelectionItemView() {
      ListFieldSelectionItemView.prototype.constructor.apply(this, arguments);
      this.fieldView = this.options.parentView.options.parentView;
    },
    className: function() {
      return getClassName.call(this, ListFieldSelectionItemView) + " d2-user-list-selection";
    },
    template: SelectionItemViewTemplate,
    templateHelpers: function() {
      return _.extend({}, ListFieldSelectionItemView.prototype.templateHelpers.call(this), {
        preItemText: this.model.get("preItemText")
      });
    },
    onRender: function() {
      var userId = this.model.get("id"), userData = getUserData(userId, this.fieldView.isExternal, this.fieldView.formView);
      if (!this.userInfoView) {
        this.userInfoView = new UserInfoView({
          model: new Backbone.Model(userData),
          context: this.fieldView.context,
          label: this.options.parentView && this.options.parentView.options && this.options.parentView.options.label ? this.options.parentView.options.label : ""
        });
        this.userInfoView.render();
      }
      this.$el.find(".user-info-container").append(this.userInfoView.$el);
    },
    getItemSelector: function() {
      return "a.user-selection-item";
    }
  });
  var D2UserListFieldSelectionView = ListFieldSelectionView.extend({
    constructor: function D2UserListFieldSelectionView() {
      ListFieldSelectionView.prototype.constructor.apply(this, arguments);
    },
    className: function() {
      return getClassName.call(this, ListFieldSelectionView) + " d2-user-listfield-selection-wrapper";
    },
    childView: UserSelectionItemView,
    setFocus: function() {
      var firstItem = this.children.findByIndex(0).$el.find("a.user-selection-item");
      if (firstItem) {
        firstItem.attr("tabindex", 0);
        firstItem.trigger("focus");
      }
    }
  });
  var D2UserListFieldSearchView = ListFieldSearchView.extend({
    constructor: function D2UserListFieldSearchView() {
      ListFieldSearchView.prototype.constructor.apply(this, arguments);
    },
    events: _.extend(ListFieldSearchView.prototype.events, {
      "focusin @ui.writeField": "focusInAction",
      "focusout @ui.writeField": "focusOutAction"
    }),
    focusInAction: function() {
      this.options.parentView.hideCustomErrorMsg();
    },
    focusOutAction: function() {
      this.options.parentView.hideCustomErrorMsg();
    },
    childView: UserSelectionItemView
  });
  return ListFieldView.extend({
    constructor: function D2UserListFieldView() {
      ListFieldView.prototype.constructor.apply(this, arguments);
      this.isExternal = this.alpacaField.options.isExternal;
      this.context = this.alpacaField.connector.config.context;
      this.listenTo(this, "field:changed", this.onFieldChange);
    },
    className: function() {
      return getClassName.call(this, ListFieldView) + " d2-user-list-field";
    },
    getSearchInputView: function(options) {
      return new D2UserListFieldSearchView(options);
    },
    getOptionView: function(options) {
      this.updateOptionsForOptionView(options);
      return new D2UserListFieldOptionsView(options);
    },
    getSelectionView: function(options) {
      return new D2UserListFieldSelectionView(options);
    },
    getOptionMatchChecker: function() {
      var me = this;
      return function(model, searchRegex) {
        var userId = model.get("id"), userData = getUserData(userId, me.isExternal, me.formView), userAddress = userData["user_address"], status = false;
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
    getVisibleOptionsCount: function() {
      if (utils.isMobile()) {
        return Math.ceil($(".cs-perspective-panel").height() / 50) + 5;
      }
      return 10;
    },
    onFieldChange: function() {
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
      this.$el.find(".cs-field-write").append(customErrorMessageEl);
    },
    hideCustomErrorMsg: function() {
      this.$el.find(".cs-field-write").find(".d2-user-error-message").remove();
    },
    validateOptions: function() {
      var validationStatus = ListFieldView.prototype.validateOptions.apply(this);
      if (!validationStatus.status) {
        return validationStatus;
      }
      if (this.alpacaField.options && (this.alpacaField.options.requiredMinCount || this.alpacaField.options.requiredMaxCount)) {
        var values = this.getValue(), valuesCount = values && values.length, status = true, message;
        if (this.alpacaField.options.requiredMinCount && this.alpacaField.options.requiredMinCount > valuesCount) {
          status = false;
          message = _.str.sformat(lang.minCountMessage, this.alpacaField.options.label, this.alpacaField.options.requiredMinCount);
        }
        if (this.alpacaField.options.requiredMaxCount && this.alpacaField.options.requiredMaxCount < valuesCount) {
          status = false;
          message = _.str.sformat(lang.maxCountMessage, this.alpacaField.options.label, this.alpacaField.options.requiredMaxCount);
        }
        return {
          status: status,
          message: message
        };
      }
      return {
        status: true
      };
    },
    onDeactivateOptions: function() {
      if (this.$el.find(".cs-field-write").hasClass("d2-field-disabled")) {
        return;
      }
      ListFieldView.prototype.onDeactivateOptions.apply(this, arguments);
    }
  });
});