/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/utils/base", "csui/controls/form/fields/base/csformfield.view", "csui/controls/form/fields/typeaheadfield.view.mixin", "csui/controls/userpicker/userpicker.view", "csui/utils/log", "csui/utils/contexts/factories/member", "i18n!csui/controls/form/impl/nls/lang", "css!csui/controls/form/impl/fields/userfield/userfield" ], function(module, require, _, $, base, FormFieldView, TypeaheadFieldViewMixin, UserPickerView, Log, MemberModelFactory, lang) {
  var log = new Log(module.id);
  var UserFieldView = FormFieldView.extend({
    constructor: function UserFieldView(options) {
      $.extend(true, options || {}, {
        css: {
          root: "cs-formfield cs-userfield",
          itemName: "esoc-user-container cs-user-container-no-hover csui-hovering esoc-user-mini-profile",
          customImage: "user-photo binf-img-circle",
          defaultIcon: "user-default-image csui-icon image_user_placeholder csui-initials"
        },
        lang: {
          fieldReadOnlyAria: lang.userFieldReadOnlyAria,
          emptyFieldReadOnlyAria: lang.emptyUserFieldReadOnlyAria,
          noItem: lang.noOwner
        },
        noId: -3
      });
      options.createItemWidgetView = this.createUserWidgetView;
      options.TypeaheadPickerView = UserPickerView;
      FormFieldView.apply(this, arguments);
      this.makeTypeaheadFieldView(this.options);
      this.listenTo(this.options.model, "change", function() {
        if (this.alpacaField && !!this.data.id) {
          this.alpacaField.itemModel = this.options.context.getModel(MemberModelFactory, {
            attributes: {
              id: this.data.id || ""
            },
            temporary: true
          });
          this.alpacaField.itemModel.ensureFetched();
        }
      });
    }
  });
  TypeaheadFieldViewMixin.mixin(UserFieldView.prototype);
  var original = _.extend({}, UserFieldView.prototype);
  _.extend(UserFieldView.prototype, {
    templateHelpers: function() {
      var data = this.model.get("data"), placeholder;
      this.isGroup = data.type === 1;
      if (this.isGroup) {
        this.options.css.defaultIcon = "user-default-image csui-icon image_group_placeholder";
      } else {
        this.options.css.defaultIcon = "user-default-image csui-icon image_user_placeholder csui-initials";
      }
      return original.templateHelpers.apply(this, arguments);
    },
    onRender: function() {
      this.nodeTypeIconView && this.nodeTypeIconView.$el.removeAttr("title aria-label");
      var data = this.model.get("data"), placeholder;
      this.onlyUsers = this.model.get("schema").type === "otcs_user_picker";
      this.onlyGroups = !this.onlyUsers && this.model.get("schema").type === "otcs_group_picker";
      var memberFilter = this.onlyUsers ? [ 0 ] : this.onlyGroups ? [ 1 ] : [ 0, 1 ];
      let action;
      if (this.options.alpaca) {
        var typeControl = this.options.alpaca.options.type_control;
        action = typeControl?.action;
        if (_.has(typeControl, data.id)) {
          typeControl = this.options.alpaca.options.type_control[data.id];
        } else if (_.has(typeControl, "?")) {
          typeControl = this.options.alpaca.options.type_control["?"];
        }
        if (typeControl) {
          if (_.has(typeControl, "parameters")) {
            memberFilter = typeControl.parameters.select_types;
          }
        }
      }
      placeholder = this.options.alpaca && this.options.alpaca.options && this.options.alpaca.options.placeholder;
      $.extend(true, this.options, {
        lang: {
          alpacaPlaceholder: placeholder ? placeholder : this.onlyUsers ? lang.alpacaPlaceholderOTUserPicker : this.onlyGroups ? lang.alpacaPlaceholderOTGroupPicker : lang.alpacaPlaceholderOTUserGroupPicker
        },
        pickerOptions: {
          memberFilter: {
            type: memberFilter
          },
          action: action
        }
      });
      this.isGroup = data.type === 1;
      this.isUser = data.type === 0;
      this.ui.itemName.attr("title", this.isGroup ? this.ui.itemName.text().trim() : null);
      this._isUserWidgetEnabled = false;
      this.ui.customImage.removeClass("csui-typeahead-image-" + data.id);
      this.ui.defaultIcon.removeClass("csui-typeahead-icon-" + data.id);
      this.ui.customImage.addClass("esoc-userprofile-img-" + data.id);
      this.ui.defaultIcon.addClass("esoc-user-default-avatar-" + data.id);
      original.onRender.apply(this, arguments);
    },
    removeUnderline: function(e) {
      if (this.isGroup || this.data.id === -3) {
        return;
      }
      if (this.isUser) {
        this.ui.customImage.removeClass("cs-user-photo-hover");
        this.ui.defaultIcon.removeClass("cs-user-photo-hover");
        this.ui.itemName.removeClass("cs-user-container-hover").addClass("cs-user-container-no-hover");
      }
    },
    showItemProfileDialog: function() {
      if (this.isGroup || this.data.id === -3) {
        return;
      }
      if (this.isUser) {
        original.showItemProfileDialog.apply(this, arguments);
      }
    },
    showItemProfileDialogWidget: function(e) {
      this.ui.customImage.addClass("cs-user-photo-hover");
      this.ui.defaultIcon.addClass("cs-user-photo-hover");
      this.ui.itemName.removeClass("cs-user-container-no-hover").addClass("cs-user-container-hover");
      $(".esoc-mini-profile-popover").binf_popover("hide");
      this.getItemWidget().showUserProfileDialog(e);
    },
    showItemInfoPopup: function() {
      if (this.isGroup || this.data.id === -3) {
        return;
      }
      if (this.isUser) {
        original.showItemInfoPopup.apply(this, arguments);
      }
    },
    showItemInfoPopupWidget: function(e) {
      this.ui.customImage.addClass("cs-user-photo-hover");
      this.ui.defaultIcon.addClass("cs-user-photo-hover");
      this.ui.itemName.removeClass("cs-user-container-no-hover").addClass("cs-user-container-hover");
      this.getItemWidget().showMiniProfilePopup(e);
    },
    createUserWidgetView: function(callback) {
      require([ "esoc/controls/userwidget/userwidget.view" ], _.bind(function(UserWidgetView) {
        var userWidgetView = new UserWidgetView({
          userid: this.data.id,
          context: this.options.context,
          baseElement: this.ui.membername,
          showUserProfileLink: true,
          showMiniProfile: true,
          loggedUserId: this.data.id,
          connector: this.connector
        });
        callback(userWidgetView);
      }, this));
    },
    _isInPicker: function(element, excluded) {
      return original._isInPicker.call(this, element, excluded + ", csui-user-picker-no-results");
    }
  });
  var wrappee = _.extend({}, UserFieldView.prototype);
  var old2new = {
    showUserProfileDialog: "showItemProfileDialog",
    showMiniProfilePopup: "showItemInfoPopup"
  };
  var new2old = _.invert(old2new);
  _.extend(UserFieldView.prototype, {
    setUserWidget: function(methodName, e) {
      old2new[methodName] && wrappee.createItemWidget.call(this, old2new[methodName], e);
    },
    createItemWidget: function(methodName, e) {
      new2old[methodName] && this.setUserWidget(new2old[methodName], e);
    },
    setItemWidget: function(view) {
      this.userWidgetView = view;
    },
    getItemWidget: function() {
      return this.userWidgetView;
    },
    setItemPicked: function(state) {
      this.userPicked = state;
    },
    getItemPicked: function() {
      return this.userPicked;
    },
    className: "cs-formfield cs-userfield",
    onUserPickerOpen: function() {
      return wrappee.onItemPickerOpen.apply(this, arguments);
    },
    onItemPickerOpen: function() {
      return this.onUserPickerOpen.apply(this, arguments);
    },
    onUserPickerClose: function() {
      return wrappee.onItemPickerClose.apply(this, arguments);
    },
    onItemPickerClose: function() {
      return this.onUserPickerClose.apply(this, arguments);
    },
    showUserProfileDialog: function() {
      return wrappee.showItemProfileDialog.apply(this, arguments);
    },
    showItemProfileDialog: function() {
      return this.showUserProfileDialog.apply(this, arguments);
    },
    showMiniProfilePopup: function() {
      return wrappee.showItemInfoPopup.apply(this, arguments);
    },
    showItemInfoPopup: function() {
      return this.showMiniProfilePopup.apply(this, arguments);
    }
  });
  return UserFieldView;
});