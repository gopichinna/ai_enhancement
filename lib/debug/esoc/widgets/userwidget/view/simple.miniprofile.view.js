csui.define([
  'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/url',
  'esoc/widgets/common/util',
  'esoc/widgets/userwidget/util',
  'smart/controls/user/miniprofile.view',
  'esoc/widgets/utils/chat/impl/util',
  'esoc/widgets/userwidget/chat/chatfactory',
  'esoc/widgets/userwidget/chat/view/presence.view',
  'css!esoc/widgets/userwidget/impl/userwidget.css'
], function (module, $, _, Marionette, Url,
  CommonUtil, Util, SmartMiniProfile,
  ChatUtil, ChatFactory, PresenceView) {
  // added module config (ESOC-7098)
  var config = module.config();
  _.defaults(config, {
    hideFollow: false
  });

  var MiniProfileView = Marionette.ItemView.extend({
    commonUtil: CommonUtil,
    util: Util,
    className: "esoc-simple-mini-profile-popover",
    constructor: function MiniProfileView(options) {

      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);

    },
    render: function (content) {
      var targetEle = this.options.targetEle, that = this;
      this.smartMiniProfileCardView = new SmartMiniProfile(this.options);
      this.setEvents();
      this.listenTo(this, "show:display:actions", function (data) {
        this.smartMiniProfileCardView.trigger("show:display:actions", data);
      });
      this.smartMiniProfileCardView.render();
      $(targetEle).binf_popover({
        content: this.smartMiniProfileCardView.$el,
        placement: function (context) {
          $(context).addClass("esoc-mini-profile-popover esoc");
          if (!!that.options.enableSimpleSettingsModel) {
            $(context).addClass("esoc-simple-mini-profile-popover");
          }
          var _tempElement = $('<div/>')
            .attr("style", "display:none")
            .addClass("esoc-mini-profile-popover binf-popover esoc-mini-profile-temp-div");
          $(targetEle).append(_tempElement);
          var popOverMaxHeight = $(".esoc-mini-profile-temp-div").height() + 40,
            popOverMaxWidth = $(".esoc-mini-profile-temp-div").width() + 40;
          _tempElement.remove();
          var popOverSource = $(targetEle),
            offset = that.getElementOffset(popOverSource),
            window_left = offset.left,
            window_top = offset.top,
            window_right = (($(window).width()) - (window_left + popOverSource.outerWidth())),
            window_bottom = (($(window).height()) -
              (window_top + popOverSource.outerHeight(true)));
          if (window_bottom > popOverMaxHeight) {
            return "bottom";
          } else if (window_right > popOverMaxWidth) {
            return "right";
          } else if (window_left > popOverMaxWidth) {
            return "left";
          } else if (window_top > popOverMaxHeight) {
            return "top";
          } else {
            return "auto";
          }
        },
        html: true,
        trigger: "manual",
        container: $.fn.binf_modal.getDefaultContainer()
      });

      $(targetEle).off("mouseenter").on("mouseenter", function (e) {
        var userWidgetView = that.getParentView();
        clearTimeout(userWidgetView.profileTimer);
        that.options.originatingView &&
          that.options.originatingView.disengageModalKeyboardFocusOnClose &&
          that.options.originatingView.disengageModalKeyboardFocusOnClose();
        var profileTimer = setTimeout(function () {
          $(targetEle).binf_popover('show');
        }, 1000);
        userWidgetView.profileTimer = profileTimer;
      });
      $(targetEle).off("mouseleave").on("mouseleave", function (e) {
        var userWidgetView = that.getParentView();
        clearTimeout(userWidgetView.profileTimer);
      });

      $(targetEle).off('shown.binf.popover').on('shown.binf.popover', function (e) {
        //TODO- need to re-factor popover implementation

        that.smartMiniProfileCardView.triggerMethod("show");
        $("*").one('scroll', function (event) {
          if (!event.target.closest(".smart-simple-mini-profile")) {
            $(targetEle).binf_popover('hide');
          } else{
            event.preventDefault();
          }
        });
        $(targetEle).one("remove", function () {
          $(targetEle).binf_popover('hide');
        });
        // TODO: Need to write common util method to hide widget specific popovers
        $('[aria-describedby]').each(function () {
          if (!$(this).is(e.target) && $(this).has(e.target).length === 0 &&
            $('.popover').has(e.target).length === 0 &&
            !$('#' + $(this)[0].getAttribute("aria-describedby")).find(e.target).is(e.target)) {
            $(this).binf_popover('hide');
          }
        });
        // hide the popover on mouseleave of popover
        $(".esoc-mini-profile-popover").on("mouseleave", function (e) {
          var targetId = e.target.id ? "#" + e.target.id : "";
          if (!targetId && $(targetId).attr("aria-describedby") !==
            $(targetEle).attr("aria-describedby")) {
            $(targetEle).binf_popover('hide');
          }
        });
        // hide the popover on mouseleave of target element
        $(targetEle).off("mouseleave").on("mouseleave", function (e) {
          setTimeout(function () {
            if ($(".esoc-mini-profile-popover:hover").length === 0) {
              $(targetEle).binf_popover('hide');
            }
          }, 1000);
        });
        // re-engage after the destroy of minipopover
        $(targetEle).one("destroyed.binf.popover hidden.binf.popover", function (e) {
          if (that.options.originatingView && !that.options.originatingView.isDestroyed) {
            that.options.originatingView.engageModalKeyboardFocusOnOpen &&
              that.options.originatingView.engageModalKeyboardFocusOnOpen();
          }
        });
        that.listenTo(that.options.originatingView, "destroy", function (e) {
          $(targetEle).binf_popover('destroy');
        });

      });
    },

    setEvents: function () {
      var that = this;
      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "update:ajax:call", function (self) {
        var formData = new FormData();
        var followUnfollowActionUrl = Url.combine(
          Util.commonUtil.getV2Url(this.options.connector.getConnectionUrl()),
          Util.commonUtil.REST_URLS.pulseRestUrl,
          this.options.model.id),
          followUnfollowAction = !this.options.model.attributes.following ?
            Util.commonUtil.globalConstants.FOLLOW :
            Util.commonUtil.globalConstants.UNFOLLOW;
        formData.append(Util.commonUtil.globalConstants.ACTION, followUnfollowAction);
        var args = {
          "itemview": this,
          "url": followUnfollowActionUrl,
          "type": "POST",
          "data": formData,
          "requestType": "miniProfilePopup",
          "targetElement": $(self),
          "popOverTarget": this.options.targetEle
        };
        that.util.updateAjaxCall(args);
      });

      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "display:actions", function (params) {
        var miniprofileActionUrl = Url.combine(
          Util.commonUtil.getV2Url(that.options.connector.getConnectionUrl()),
          Util.commonUtil.REST_URLS.pulseRestUrl,
          that.model.id);

        miniprofileActionUrl = Util.commonUtil.updateQueryStringValues(miniprofileActionUrl,
          Util.commonUtil.globalConstants.FIELDS,
          Util.commonUtil.globalConstants.CHAT_SEETING);

        var displayParams = {
          "itemview": that,
          "url": miniprofileActionUrl,
          "type": "GET",
          "requestType": "miniProfileActionsDisplay"
        };
        that.util.updateAjaxCall(displayParams);
      });

      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "click:userprofilepic", function (e) {
        this.options.userWidgetView.showUserProfileDialog(e);
      });

      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "set:profile:pic", function (options) {
        var userProfilePicOptions = {
          context: this.options.context,
          userid: this.model.attributes.id,
          photoElement: $(".esoc-userprofile-img-" + Util.escapeSelector(this.model.attributes.id)),
          defaultPhotElement: $(".esoc-user-default-avatar-" +
            Util.escapeSelector(this.model.attributes.id)),
          userbackgroundcolor: this.options.userbackgroundcolor
        };
        that.util.commonUtil.setProfilePic(userProfilePicOptions);


      });

      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "launch:chat:window", function () {
        ChatUtil.launchChatWindow(this.options);
      });

      this.smartMiniProfileCardView.listenTo(this.smartMiniProfileCardView, "render:presenceView", function () {
        var presenceOptions = {
          id: this.model.attributes.id,
          context: this.options.context,
          username: this.model.attributes.name,
          subscribeEvent: true
        };
        var presenceRegion = new Marionette.Region({
          el: this.$el.find("#esoc-user-profile-presence-indicator")
        });
        ChatFactory.initializeApplication(this.options).promise().done(function () {
          var presenceView = new PresenceView(presenceOptions);
          presenceRegion.show(presenceView);
        });
      });
    },
    getElementOffset: function (ele) {
      return ele.is(':visible') ? ele.offset() : { top: 0, left: 0 };
    },
    getParentView: function () {
      return this.options.userWidgetView;
    },

  });
  return MiniProfileView;
});
