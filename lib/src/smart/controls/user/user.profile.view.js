/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/user.avatar.color", "smart/controls/user/user.profile.tabs.view", "smart/controls/globalmessage/globalmessage", "smart/controls/image.cropper/image.cropper.view", "hbs!smart/controls/user/impl/user.profile", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/controls/user/nls/lang", "css!smart/controls/user/impl/userprofile.css", "css!smart/controls/user/impl/profileloading.css", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function($, _, Backbone, Marionette, UserAvatarColor, SimpleUserWidgetViewTabs, GlobalMessage, ImageCropperView, simpleUserWidgetTemplate, theming, jatoIcons, Lang) {
  var SimpleUserWidgetView = Marionette.ItemView.extend({
    className: "esoc-simple-user-widget-view",
    attributes: {
      role: "region",
      "aria-label": Lang.userProfileAria
    },
    template: simpleUserWidgetTemplate,
    ui: {
      initialsPlaceholder: ".image_user_placeholder",
      userProfileClose: ".user-widget-view-close"
    },
    templateHelpers: function() {
      var extendedInfo = this.options.model.attributes.extendedInfo, canEdit = !this.options.model.attributes.otherUser && (!!extendedInfo && extendedInfo.isEditable), chatEnabled = this.chatEnabled || this.model.get("chatSettings") && this.model.get("chatSettings").chatEnabled, presenceEnabled = this.showPresenceIndicator;
      return {
        uniqueId: this.uniqueId,
        messages: {
          displayname: !!this.model.attributes.display_name ? this.model.attributes.display_name : this.options.display_name
        },
        isJATO: theming.isJATOTheme(),
        closeSVGContent: jatoIcons.actionCloseSmall,
        chatSVGContent: jatoIcons.actionChats,
        editSVGContent: jatoIcons.actionEdit,
        userid: this.options.userid,
        simpleUserProfileLabel: Lang.simpleUserProfileLabel,
        closeButtonTooltip: Lang.closeButtonTooltip,
        chatLabel: Lang.chatLabel,
        closeLabel: Lang.closeLabel,
        chatSettings: {
          chatEnabled: chatEnabled,
          presenceEnabled: presenceEnabled
        },
        otherUser: this.options.otherUser,
        showChatIcon: this.options.model.get("otherUser") && chatEnabled,
        isEditable: !!this.options.enableUploadProfilePicture && !this.model.attributes.otherUser,
        backButton: this.options.showBackButton,
        edituserProfileTitle: Lang.edituserProfileTitle,
        uploadProfilePicture: Lang.uploadProfilePicture,
        deleteProfilePicture: Lang.deleteProfilePicture
      };
    },
    events: {
      "mouseover .esoc-simple-user-widget-header .edit-user": "onMouseoverProfilePic",
      "mouseout .edit-user": "onMouseoutProfilePic",
      "focusin .edit-user": "onMouseoverProfilePic",
      "focusout .edit-user": "onMouseoutProfilePic",
      "click .esoc-simple-user-widget-header .edit-user": "editProfilePhoto",
      "click .esoc-user-profile-chat-comment": "launchChatWindow",
      "keydown .esoc-user-profile-chat-comment": "launchChatWindow",
      "keydown .user-widget-view-close": "closeSimpleUserWidget",
      "click .esoc-simple-user-profile-pic-edit": "uploadPhoto",
      "click .esoc-simple-user-profile-pic-delete": "deletePhoto",
      "keydown .esoc-simple-user-profile-pic-edit": "uploadPhoto",
      "keydown .esoc-simple-user-profile-pic-delete": "deletePhoto",
      keydown: "onKeyDown"
    },
    triggers: {
      "click .cs-go-back": "click:back:button"
    },
    onKeyDown: function(event) {
      const tabableElements = this.$el.find(this.focusablesSelector).filter("*:not([tabindex=-1]):not([disabled]):visible");
      if (this.options.customKN) {
        this.trigger("custom:KN", event);
      } else {
        if (event.keyCode === 9 || event.shiftKey) {
          if (event.target === tabableElements[0] && event.shiftKey && event.which === 9) {
            tabableElements.last().trigger("focus");
            event.preventDefault();
          } else if (event.target === tabableElements[tabableElements.length - 1] && !event.shiftKey) {
            tabableElements.first().trigger("focus");
            event.preventDefault();
          }
        }
      }
    },
    initialize: function(options) {
      this.options = options;
      this.uniqueId = _.uniqueId();
      var mouseoverOnDefaultAvatar = "mouseover #esoc-simple-user-default-avatar-" + this.uniqueId;
      this.events[mouseoverOnDefaultAvatar] = "onMouseoverProfilePic";
      var focusOnDefaultAvatar = "focusin #esoc-simple-user-default-avatar-" + this.uniqueId;
      this.events[focusOnDefaultAvatar] = "onMouseoverProfilePic";
      var mouseoutFromDefaultAvatar = "mouseout #esoc-simple-user-default-avatar-" + this.uniqueId;
      this.events[mouseoutFromDefaultAvatar] = "onMouseoutProfilePic";
      var focusoutFromDefaultAvatar = "focusout #esoc-simple-user-default-avatar-" + this.uniqueId;
      this.events[focusoutFromDefaultAvatar] = "onMouseoutProfilePic";
      var keydownOnDefaultAvatar = "keydown #edit-esoc-simple-user-default-avatar-" + this.uniqueId;
      this.events[keydownOnDefaultAvatar] = "editProfilePhoto";
      var mouseoverOnImageAvatar = "mouseover #esoc-simple-user-image-avatar-" + this.uniqueId;
      this.events[mouseoverOnDefaultAvatar] = "onMouseoverProfilePic";
      var focusOnImageAvatar = "focusin #esoc-simple-user-image-avatar-" + this.uniqueId;
      this.events[focusOnImageAvatar] = "onMouseoverProfilePic";
      var mouseoutFromImageAvatar = "mouseout #esoc-simple-user-image-avatar-" + this.uniqueId;
      this.events[mouseoutFromImageAvatar] = "onMouseoutProfilePic";
      var focusoutFromImageAvatar = "focusout #esoc-simple-user-image-avatar-" + this.uniqueId;
      this.events[focusoutFromImageAvatar] = "onMouseoutProfilePic";
      var keydownOnImageAvatar = "keydown #edit-esoc-simple-user-image-avatar-" + this.uniqueId;
      this.events[keydownOnImageAvatar] = "editProfilePhoto";
      this.focusablesSelector = "li, a[href], area[href], input:not([disabled]), select:not([disabled])," + "textarea:not([disabled]),  button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
      this.delegateEvents();
    },
    constructor: function SimpleUserWidgetView(options) {
      options = options || {};
      this.chatEnabled = options.chatEnabled;
      this.showPresenceIndicator = this.chatEnabled && options.showPresenceIndicator;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this, "upload:inprogress", this.uploadInProgress);
      this.listenTo(this, "upload:done", this.uploadDone);
      this.listenTo(this, "update:profilepic:failure", this.updateProfilePicFailure);
      this.listenTo(this, "delete:done", this.deletedDone);
    },
    openErrorMessage: function(args) {
      if (args.region) {
        GlobalMessage.setMessageRegionView(args.region);
      }
      const options = {
        doAutoClose: false
      };
      const msg = GlobalMessage.showMessage("error", this.replaceBreakTagWithNewLine(args.errorContent), "", options);
    },
    replaceBreakTagWithNewLine: function(content) {
      if (content) {
        var breakTagRegEx = /<br\s*[\/]?>/gi;
        return content.replace(breakTagRegEx, "\n");
      } else {
        return "";
      }
    },
    uploadInProgress: function() {
      this.$el.find(".esoc-userprofile-actions .esoc-profile-img-load-container").removeClass("esoc-progress-display");
      this.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").removeClass("esoc-profile-opacity");
      this.$el.find($("#esoc-profilepic-desktop-attachment")).val("");
    },
    uploadDone: function() {
      $(".esoc-simple-profile-img-load-container").removeClass("esoc-simple-profile-img-load-icon");
    },
    updateProfilePicFailure: function(photoErrorArgs) {
      $(".esoc-simple-profile-img-load-container").removeClass("esoc-simple-profile-img-load-icon");
      this.openErrorMessage(photoErrorArgs);
    },
    deletedDone: function() {
      this.$el.find(".esoc-userprofile-default-avatar").css("display", "inline-flex");
    },
    onShow: function(e) {
      var that = this;
      var tabsViewRegion = new Marionette.Region({
        el: this.$el.find(".esoc-simple-user-widget-tabs")
      });
      this.options.uniqueId = _.uniqueId();
      var options = this.options;
      options.parentView = this;
      this.tabsview = new SimpleUserWidgetViewTabs(options);
      tabsViewRegion.show(this.tabsview);
      this.firstEle = tabsViewRegion.$el.find(".esoc-user-profile-tab").first();
      if (this.firstEle.length) {
        this.firstEle.find(".cs-tablink").trigger("click");
        this.firstEle.addClass("binf-active");
        var firstLiEle = this.firstEle;
        this.activeTabLink = firstLiEle;
        firstLiEle.attr("tabindex", 0);
        setTimeout(_.bind(function() {
          firstLiEle.trigger("focus");
          this.tabsview.tabPanel._showHideNavigationButtons();
        }, this), 301);
      }
      this.trigger("set:profile:pic");
      if (this.model.attributes.chatSettings && this.model.attributes.chatSettings.chatEnabled && this.model.attributes.chatSettings.presenceEnabled && this.options.showPresenceIndicator) {
        this.trigger("render:presence:view");
        this.listenTo(this, "update:presence", _.bind(function(args) {
          if (args.showPresenceIndicator) {
            var presenceEle = this.$el.find("#esoc-user-profile-presence-indicator"), status = args.status || "Away";
            presenceEle.removeClass("binf-hidden");
            presenceEle.find(".esoc-chat-presence-indicator").addClass("esoc-chat-presence-" + status);
            presenceEle.find(".esoc-chat-presence-indicator").attr({
              title: status,
              "aria-label": status
            });
          }
        }, this));
      }
      if (!this.options.enableUploadProfilePicture || this.model.attributes.otherUser) {
        this.$el.find("#esoc-simple-user-default-avatar-" + this.uniqueId).attr("tabindex", "-1");
        this.$el.find("#esoc-simple-user-image-avatar-" + this.uniqueId).attr("tabindex", "-1");
      }
      if (this.tabsview.extraTabsShownCount <= 1) {
        this.$el.find(".esoc-simple-user-widget-tabs .tab-links-header").hide();
        this.$el.find(".esoc-simple-user-widget-body").addClass("smart-without-tab-header");
        this.ui.userProfileClose.trigger("focus");
      }
    },
    uploadPhoto: function(e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      var that = this, profilepicInput = this.$el.find("#esoc-profilepic-desktop-attachment");
      profilepicInput[0].value = null;
      profilepicInput.off("change").on("change", function(e) {
        if (profilepicInput.val().length > 0) {
          var photo = profilepicInput[0].files[0];
          if (!that.options?.cropDisabled) {
            let cropdialogView = new ImageCropperView({
              photo: photo,
              roundedCropbox: true,
              dialogTitle: Lang.cropDialogTitle
            });
            cropdialogView.render();
            that.listenTo(cropdialogView, "crop:save", _.bind(imgObj => {
              let blob = imgObj.blob;
              let imgSrc = imgObj.imgSrc;
              var formData = new FormData();
              if (blob) {
                formData.append("photo", blob);
              }
              var uploadPhotoOptions = {
                formData: formData,
                target: e.target,
                upload: true
              };
              that.el.querySelector("otc-avatar.esoc-full-profile-avatar-update").setAttribute("image", imgSrc);
              that.trigger("update:ajax:call", uploadPhotoOptions);
              that.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").addClass("esoc-profile-opacity");
              that.$el.find(".esoc-userprofile-actions .esoc-profile-img-load-container").addClass("esoc-progress-display");
              $(".esoc-simple-profile-img-load-container").addClass("esoc-simple-profile-img-load-icon");
              that.$el.find(".edit-user").css("opacity", "0");
            }, that));
            that.listenTo(cropdialogView, "crop:dialog:destroy", _.bind(() => {
              that.$el.find(".edit-user-image-placeholder").trigger("focus");
            }, that));
          } else {
            var formData = new FormData();
            if (photo) {
              formData.append("photo", photo);
            }
            that.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").addClass("esoc-profile-opacity");
            that.$el.find(".esoc-userprofile-actions .esoc-profile-img-load-container").addClass("esoc-progress-display");
            $(".esoc-simple-profile-img-load-container").addClass("esoc-simple-profile-img-load-icon");
            var uploadPhotoOptions = {
              formData: formData,
              target: e.target,
              upload: true
            };
            that.trigger("update:ajax:call", uploadPhotoOptions);
            that.$el.find(".edit-user").css("opacity", "0");
          }
        }
      });
      e.preventDefault();
      profilepicInput.trigger("click");
      this.$el.find(".edit-user").css("opacity", "0");
      this.$el.find(".edit-user-image-placeholder").trigger("focus");
    },
    editProfilePhoto: function(e) {
      if (this.processKeyEvent(e)) {
        return;
      } else {
        var that = this, getElementOffset = function(ele) {
          return ele.is(":visible") ? ele.offset() : {
            top: 0,
            left: 0
          };
        };
        if (!!that.options.enableUploadProfilePicture && !!that.model.attributes.photo_url) {
          this.$el.find(".esoc-simple-user-profile-pic-update").on("keydown", function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode !== 13) {
              e.preventDefault();
              e.stopPropagation();
            }
          });
          this.$el.find(".esoc-simple-user-profile-pic-edit").trigger("focus");
          this.$el.find(".esoc-simple-user-profile-pic-edit").attr("tabindex", "0");
          this.$el.find(".esoc-simple-user-profile-pic-delete").attr("tabindex", "0");
        } else {
          this.uploadPhoto(e);
        }
      }
    },
    deletePhoto: function(e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      this.trigger("update:ajax:call", {
        target: e.target,
        upload: false
      });
    },
    onMouseoverProfilePic: function() {
      this.$el.find(".edit-user").css("opacity", "1");
    },
    onMouseoutProfilePic: function() {
      this.$el.find(".edit-user").css("opacity", "0");
    },
    launchChatWindow: function(e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      this.options.tguser = this.options.model.get("name");
      this.options.domain = this.options.model.get("chatSettings") && this.options.model.get("chatSettings").chatDomain;
      this.trigger("launch:chat:window");
    },
    onDestroy: function() {
      var element = this.options.targetEle;
      if (element && $(element).is(":visible")) {
        $(element).trigger("focus");
      } else if (!element) {
        element = $(".nav-profile");
        if (element && element.length) {
          element.trigger("focus");
        }
      }
      this.$el.find(".esoc-simple-user-profile-pic-update").off("keydown");
      if (this.$el.hasClass("csui-dialog-page-reload")) {
        location.reload();
      }
    },
    closeSimpleUserWidget: function(e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      var target = $(e.target);
      target.trigger("click");
    },
    closeSimpleUserWidgetUponClick: function(e) {
      this.trigger("destroy");
    },
    processKeyEvent: function(e) {
      if (e.type === "keydown") {
        var keyCode = e.keyCode || e.which;
        if (keyCode !== 32 && keyCode !== 13) {
          return true;
        }
      }
      return false;
    }
  });
  return SimpleUserWidgetView;
});