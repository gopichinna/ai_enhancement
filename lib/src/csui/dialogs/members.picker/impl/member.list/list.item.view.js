/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/controls/listitem/listitemstandard.view", "csui/dialogs/members.picker/behaviors/member.list.keyboard.behavior", "csui/utils/url", "csui/utils/user.avatar.color", "csui/utils/commonconfig.util", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.mime.icons", "hbs!csui/dialogs/members.picker/impl/member.list/list.item", "hbs!csui/dialogs/node.picker/impl/search.list/search.location.item", "i18n!csui/dialogs/members.picker/impl/nls/lang", "css!csui/dialogs/members.picker/impl/members.picker" ], function(module, _, $, StandardListItem, MemberListKeyboardBehaviour, Url, UserAvatarColor, CommonConfig, theming, JatoIcons, jatoMIMEIcons, itemTemplate, searchLocationTemplate, lang) {
  var config = _.extend({
    enableRemoveMember: CommonConfig.enableFeatureInSmartView() || false
  }, module.config());
  var ListItem = StandardListItem.extend({
    template: itemTemplate,
    searchLocationTemplate: searchLocationTemplate,
    templateHelpers: function() {
      const isJATO = theming.isJATOTheme();
      return {
        defaultProfilePictureClass: this._isGroup() ? "image_group_placeholder_permission" : "image_user_placeholder",
        imgAlt: this._isGroup() ? lang.groupSymbolAlt : lang.userSymbolAlt,
        department: this.options.model.get("group_id_expand") && this.options.model.get("group_id_expand").name,
        totalcount: !this.options.model.collection.totalCount,
        isGroup: !!this._isGroup(),
        name: this.options.model.get("name_formatted"),
        imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
        isJATO: isJATO,
        svgMimeGroup: isJATO && jatoMIMEIcons.mimeGroup,
        jatoCheckMarkSelect: JatoIcons.actionCheckmarkSelect,
        jatoRightCaretIcon: JatoIcons.actionChevronLargeRight
      };
    },
    tagName: "li",
    ui: {
      link: ".csui-list-group-item"
    },
    _isUser: function() {
      return this.options.model.get("type") === 0;
    },
    _isGroup: function() {
      return this.options.model.get("type") === 1;
    },
    _isInActiveUser: function() {
      return this.options.model.get("type") < 0;
    },
    constructor: function ListItem(options) {
      this.behaviors = _.extend(this.behaviors, {
        MemberListKeyboardBehaviour: {
          behaviorClass: MemberListKeyboardBehaviour
        }
      });
      StandardListItem.apply(this, arguments);
      this.browsed = false;
    },
    toggleSelect: function() {
      this.selected = !this.selected;
      if (!this.isDestroyed) {
        this.render();
      }
    },
    toggleBrowse: function() {
      this.browsed = !this.browsed;
      this.render();
    },
    assignedBrowseNSelect: function() {
      this.browsed = this.selected = true;
      this.render();
    },
    unassignBrowseNSelect: function() {
      if (!this.isDestroyed) {
        this.browsed = this.selected = false;
        this.render();
      }
    },
    isSelected: function() {
      return this.selected;
    },
    isBrowsed: function() {
      return this.browsed;
    },
    setValidity: function(valid) {
      this.valid = valid;
    },
    onRender: function() {
      this.$el.addClass("cs-left-item-" + this.model.get("id"));
      this.$el.removeClass("select");
      this.$el.removeClass("browse");
      this?.ui?.link?.removeAttr("aria-selected");
      this.$el.attr("role", "option");
      var elementNamePlus = _.str.sformat(lang.itemTypeNameAria, this.model.get("type_name"), this.model.get("name"));
      if (!this.valid) {
        elementNamePlus = _.str.sformat(lang.disabledItemTypeNameAria, this.model.get("type_name"), this.model.get("name"));
      }
      this.$el.attr("aria-label", elementNamePlus);
      this.$el.attr("tabindex", 0);
      if (this.selected) {
        if (this._isGroup()) {
          this.$el.find("span").removeClass("binf-hidden");
          this.$el?.find(".csui-end-icon")?.removeClass("binf-hidden");
        }
        this.$el.addClass("select");
        this.$el.attr("aria-selected", "true");
      } else if (this.browsed) {
        this.$el.addClass("browse");
        if (!(this.showInlineActionBar && config.enableRemoveMember)) {
          this.$el.find("span.csui-end-icon").removeClass("binf-hidden");
        }
      }
      if (this._isBrowsable(this.model)) {
        this.ui.link.attr("aria-haspopup", "true");
        this.ui.link.attr("aria-expanded", "false");
      }
      this._renderPhoto();
    },
    _renderPhoto: function() {
      var photoUrl = this.model.get("photo_url");
      var userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.options.model.attributes.data.properties);
      this.$el.find(".csui-user-default-picture-dlg.image_user_placeholder").css("background-color", userbackgroundcolor);
      if (this._isGroup() || photoUrl === null) {} else {
        var that = this;
        this._resolvePhoto(photoUrl).done(_.bind(function(photo) {
          var profieEle = that.$el.find(".csui-memberpicker-user-avator");
          that.url = URL.createObjectURL(photo);
          profieEle.removeClass("binf-hidden").attr("image", that.url);
        })).fail(function() {});
      }
    },
    _resolvePhoto: function(photoUrl) {
      var connector = this.options.model.connector, connection = connector.connection, cgiUrl = new Url(connection.url).getCgiScript(), dPhoto = $.Deferred(), imgUrl = Url.combine(cgiUrl, photoUrl);
      var getPhotoOptions = {
        url: imgUrl,
        dataType: "binary",
        connection: connection
      };
      connector.makeAjaxCall(getPhotoOptions).done(function(response, statusText, jqxhr) {
        if (jqxhr.status === 200) {
          dPhoto.resolve(response);
        } else {
          dPhoto.reject();
        }
      }).fail(dPhoto.reject);
      return dPhoto.promise();
    },
    _isBrowsable: function(node) {
      return node.get("container") && node.get("perm_see_contents") !== false;
    }
  });
  return ListItem;
});