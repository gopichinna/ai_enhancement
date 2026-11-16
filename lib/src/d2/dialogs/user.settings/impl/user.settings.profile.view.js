/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/contexts/factories/user", "csui/controls/progressblocker/blocker", "csui/dialogs/modal.alert/modal.alert", "csui/controls/form/pub.sub", "esoc/controls/userwidget/userwidget.view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/user.utils", "hbs!d2/dialogs/user.settings/impl/user.settings.profile", "i18n!d2/dialogs/user.settings/impl/nls/lang", "csui/lib/binf/js/binf" ], function(require, _, $, Backbone, Marionette, base, UserModelFactory, BlockingView, ModelAlert, PubSub, UserWidgetView, RestResources, RestLinkrels, userUtils, template, lang) {
  "use strict";
  var UserAvatarActions = Object.freeze({
    UPLOAD_PICTURE: "uploadPicture",
    DELETE_PICTURE: "deletePicture"
  }), USER_PHOTO_SIZE_LIMIT = 5242880;
  var UserAvatarActionView = Marionette.ItemView.extend({
    constructor: function UserAvatarActionView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.$el.text(this.model.get("name")).attr({
        tabindex: 0,
        role: "button",
        title: this.model.get("title"),
        "aria-label": this.model.get("ariaLabel")
      });
    },
    template: false,
    className: "user-avatar-action focusable-item",
    triggers: {
      click: "click:item"
    },
    events: {
      keydown: "onKeydownItem",
      keyup: "onKeyupItem"
    },
    onKeydownItem: function(event) {
      if (event.which === 9) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onKeyupItem: function(event) {
      this.trigger("keyup:item", event);
    }
  });
  var UserAvatarActionsView = Marionette.CollectionView.extend({
    constructor: function UserAvatarActionsView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    emptyView: false,
    childView: UserAvatarActionView,
    className: "user-avatar-actions",
    childEvents: {
      "click:item": "onClickItem",
      "keyup:item": "onKeyupItem"
    },
    onClickItem: function(view) {
      this.selectAction(view.model);
    },
    onKeyupItem: function(view, event) {
      switch (event.which) {
       case 13:
       case 32:
        this.selectAction(view.model);
        break;

       case 33:
       case 36:
        this.onFocusFirst(event);
        break;

       case 34:
       case 35:
        this.onFocusLast(event);
        break;

       case 38:
        this.onFocusPrev(event);
        break;

       case 40:
        this.onFocusNext(event);
        break;

       case 27:
        this.trigger("action:close");
        break;

       case 9:
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    onFocusFirst: function() {
      var $el = this.$el.find(".focusable-item");
      this.setElementFocus($el.first());
    },
    onFocusLast: function() {
      var $el = this.$el.find(".focusable-item");
      this.setElementFocus($el.last());
    },
    onFocusPrev: function(event) {
      var $el = $(event.target).closest(".focusable-item");
      this.setElementFocus($el.prev());
    },
    onFocusNext: function(event) {
      var $el = $(event.target).closest(".focusable-item");
      this.setElementFocus($el.next());
    },
    setElementFocus: function($element) {
      if ($element.length > 0 && $element.hasClass("focusable-item")) {
        $element.trigger("focus");
      }
    },
    selectAction: function(model) {
      this.trigger("action:change", model.get("id"));
    }
  });
  return Marionette.LayoutView.extend({
    constructor: function UserSettingsProfileView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.model = this.options.context.getModel(UserModelFactory);
    },
    className: "user-settings-profile",
    template: template,
    ui: {
      userAvatar: ".user-avatar",
      userAvatarContainer: ".user-avatar-container",
      userAvatarEdit: ".edit-user",
      fileBrowse: ".file-browser",
      dotsLoader: ".dots-loader"
    },
    regions: {
      userAvatarRegion: ".user-avatar-container"
    },
    events: {
      "click @ui.userAvatarEdit": "onClickEdit",
      "mouseenter @ui.userAvatarEdit": "onMouseoverEdit",
      "mouseout @ui.userAvatarEdit": "onMouseoutEdit",
      "focusin @ui.userAvatarContainer": "onFocusinUserAvatar",
      "focusout @ui.userAvatarContainer": "onFocusoutUserAvatar",
      "keyup @ui.userAvatarContainer": "onKeyupUserAvatar",
      focusout: "onFocusOut",
      "change @ui.fileBrowse": "onFileSelection"
    },
    templateHelpers: function() {
      return {
        editTitle: lang.editPicture,
        editAria: lang.editPictureAria,
        supportedFormats: this._getAllowedFormatsForInput()
      };
    },
    onRender: function() {
      this.createUserAvatar();
      if (this.model.get("photo_url")) {
        this.createUserAvatarActions();
        this._disableUserAvatar(true);
      } else {
        this.ui.userAvatarEdit.addClass("binf-hidden");
        this._disableUserAvatar(false);
      }
    },
    createUserAvatar: function() {
      var userName = this.model.get("name");
      this.userWidgetView = new UserWidgetView({
        userid: userName,
        connector: this.options.connector,
        context: this.options.context,
        model: this.model.clone(),
        showMiniProfile: false,
        showUserProfileLink: false,
        showUserWidgetFor: "profilepic",
        userWidgetWrapperClass: "d2-userinfo-profile-pic",
        viewShownEvent: true,
        parentView: this
      });
      this._removeUserPhotoFromFactory();
      this.userWidgetView.on("render", _.bind(function() {
        this.userWidgetView.$el.find(".d2-userinfo-profile-pic").attr({
          disabled: true,
          tabindex: -1
        });
      }, this));
      this.listenTo(this, "view:shown", _.bind(function() {
        this._enableUserAvatar(true);
      }, this));
      this.userAvatarRegion.show(this.userWidgetView);
    },
    createUserAvatarActions: function() {
      this.userAvatarActionsView = new UserAvatarActionsView({
        collection: this.getUserAvatarActions()
      });
      this.userAvatarActionsView.on("action:change", this.onActionChange.bind(this));
      this.userAvatarActionsView.on("action:close", this.onActionClose.bind(this));
      this.ui.userAvatarContainer.binf_popover({
        content: this.userAvatarActionsView.render().$el,
        html: true,
        placement: "bottom",
        trigger: "manual"
      });
    },
    getUserAvatarActions: function() {
      return new Backbone.Collection([ {
        id: UserAvatarActions.UPLOAD_PICTURE,
        name: lang.uploadPicture,
        title: lang.uploadPicture,
        ariaLabel: lang.uploadPictureAria
      }, {
        id: UserAvatarActions.DELETE_PICTURE,
        name: lang.deletePicture,
        title: lang.deletePicture,
        ariaLabel: lang.deletePictureAria
      } ]);
    },
    onActionChange: function(action) {
      this._hideActionPopover();
      switch (action) {
       case UserAvatarActions.UPLOAD_PICTURE:
        this._showFileSelector();
        break;

       case UserAvatarActions.DELETE_PICTURE:
        this._deleteFile();
        break;

       default:
        return;
      }
    },
    onActionClose: function() {
      this._hideActionPopover();
      this.ui.userAvatarContainer.trigger("focus");
    },
    onFileSelection: function(event) {
      if (event.currentTarget.files && event.currentTarget.files.length > 0 && event.currentTarget.files[0]) {
        var file = event.currentTarget.files[0];
        if (this._validateFile(file)) {
          this._uploadFile(file);
        }
        this._resetFileSelector();
      }
    },
    onClickEdit: function() {
      if (this.userAvatarDisabled) {
        return;
      }
      if (this._isUserPictureAvailable()) {
        this._toggleAction();
      } else {
        this._showFileSelector();
      }
      PubSub.trigger("d2:form:interaction:performed", this.ui.userAvatarEdit);
    },
    onKeyupUserAvatar: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onClickEdit();
      }
    },
    onMouseoverEdit: function() {
      this._showEditButton();
    },
    onMouseoutEdit: function() {
      this._hideEditButton();
    },
    onFocusinUserAvatar: function() {
      this.ui.userAvatar.addClass("focused");
    },
    onFocusoutUserAvatar: function() {
      this.ui.userAvatar.removeClass("focused");
    },
    onFocusOut: function(event) {
      if (this.$el.has(event.relatedTarget).length === 0) {
        this._hideActionPopover();
      }
    },
    _isUserPictureAvailable: function() {
      var $userWidgetAvatar = this.userWidgetView.$el.find(".esoc-user-widget-avatar");
      return $userWidgetAvatar.is(":visible") && !$userWidgetAvatar.hasClass("binf-hidden");
    },
    _showFileSelector: function() {
      this.ui.fileBrowse.trigger("click");
    },
    _toggleAction: function() {
      if (this.ui.userAvatarContainer.attr("action-popover")) {
        this._hideActionPopover();
      } else {
        this._showActionPopover();
      }
    },
    _validateFile: function(file) {
      if (file) {
        if (file.size <= 0) {
          this._showErrorMessageDialog(lang.errorUserPhotoInvalidFile);
          return false;
        }
        if (file.size > USER_PHOTO_SIZE_LIMIT) {
          this._showErrorMessageDialog(lang.errorUserPhotoSize);
          return false;
        }
        var allowedFormatTypes = this._getAllowedFormats(), fileExtn = file && this._getFileExtn(file.name);
        if (!fileExtn || !_.contains(allowedFormatTypes, fileExtn)) {
          this._showErrorMessageDialog(lang.errorUserPhotoFormat);
          return false;
        }
        return true;
      }
    },
    _getAllowedFormats: function() {
      var d2Options = RestResources.getD2Options();
      return d2Options && d2Options["user_profile_image_extensions"] || [];
    },
    _getAllowedFormatsForInput: function() {
      var allowedFormats = this._getAllowedFormats();
      if (allowedFormats && allowedFormats.length > 0) {
        return "." + allowedFormats.join(",.");
      }
    },
    _uploadFile: function(file) {
      this._disableUserAvatar(true);
      var options = _.extend({
        file: file
      }, this.options);
      userUtils.uploadUserProfileImage(options).done(this._onUserPhotoChangeSuccess.bind(this)).fail(this._onUserPhotoChangeFailed.bind(this, lang.errorUserPhotoUpload));
    },
    _deleteFile: function() {
      this._disableUserAvatar(true);
      userUtils.deleteUserProfileImage(this.options).done(this._onUserPhotoChangeSuccess.bind(this)).fail(this._onUserPhotoChangeFailed.bind(this, lang.errorUserPhotoDelete));
    },
    _onUserPhotoChangeSuccess: function() {
      this._removeUserPhotoFromFactory();
      this.userWidgetView.render();
      this.model.trigger("change");
    },
    _onUserPhotoChangeFailed: function(defaultErrorMsg, error) {
      this._enableUserAvatar(true);
      var errorMessage = error && error.message || defaultErrorMsg;
      this._showErrorMessageDialog(errorMessage);
    },
    _removeUserPhotoFromFactory: function() {
      var userName = this.model.get("name"), userFactories = this.options.context.getFactory(UserModelFactory);
      if (userFactories && userFactories.options[userName]) {
        delete userFactories.options[userName];
        delete userFactories.options[userName + "_blob_content"];
      }
    },
    _disableUserAvatar: function(showLoader) {
      this.ui.userAvatarContainer.attr({
        disabled: true,
        tabindex: -1
      });
      this.ui.userAvatar.addClass("disabled");
      this.userAvatarDisabled = true;
      if (showLoader) {
        this._showLoader();
      }
    },
    _enableUserAvatar: function(hideLoader) {
      this.ui.userAvatarContainer.attr({
        disabled: false,
        tabindex: 0
      });
      this.ui.userAvatar.removeClass("disabled");
      this.userAvatarDisabled = false;
      if (hideLoader) {
        this._hideLoader();
      }
    },
    _showLoader: function() {
      this.ui.dotsLoader.removeClass("binf-hidden");
    },
    _hideLoader: function() {
      this.ui.dotsLoader.addClass("binf-hidden");
    },
    _getFileExtn: function(fileName) {
      if (fileName) {
        var fileNameSplit = fileName.split(".");
        if (fileNameSplit.length > 1) {
          return fileNameSplit.pop().toLowerCase();
        }
      }
    },
    _resetFileSelector: function() {
      setTimeout(_.bind(function() {
        this.ui.fileBrowse.val("");
      }, this));
    },
    _showErrorMessageDialog: function(errorMsg) {
      ModelAlert.confirmError(function() {}, errorMsg, lang.errorHeader, {
        buttons: {
          showYes: false,
          showNo: false,
          showCancel: true,
          labelCancel: lang.closeButtonLabel
        }
      });
    },
    _showActionPopover: function() {
      this.ui.userAvatarContainer.binf_popover("show");
      this.ui.userAvatarContainer.attr("action-popover", true);
      this.userAvatarActionsView.$el.find(".focusable-item").first().trigger("focus");
    },
    _hideActionPopover: function() {
      this.ui.userAvatarContainer.binf_popover("hide");
      this.ui.userAvatarContainer.removeAttr("action-popover");
    },
    _showEditButton: function() {
      this.ui.userAvatarEdit.addClass("edititable");
    },
    _hideEditButton: function() {
      this.ui.userAvatarEdit.removeClass("edititable");
    }
  });
});