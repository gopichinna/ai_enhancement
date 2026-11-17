/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/url", "csui/utils/log", "csui/utils/base", "csui/utils/commands", "csui/utils/contexts/factories/member", "csui/utils/contexts/factories/user", "csui/controls/toolbar/toolitems.filtered.model", "csui/widgets/navigation.header/profile.menuitems", "csui/widgets/navigation.header/profile.menuitems.mask", "csui/controls/globalmessage/globalmessage", "csui-ext!csui/widgets/navigation.header/controls/user.profile/user.profile.view", "i18n!csui/pages/start/impl/nls/lang", "smart/themes/theming", "css!csui/controls/app.header/app.header.controls/user.profile/impl/user.profile", "csui/lib/jquery.binary.ajax" ], function(module, _, $, Marionette, Url, log, base, commands, MemberModelFactory, UserModelFactory, FilteredToolItemsCollection, menuItems, MenuItemsMask, GlobalMessage, menuHandlers, lang, theming) {
  "use strict";
  var config = window.csui.requirejs.s.contexts._.config.config["csui/utils/contexts/factories/user"] || {};
  log = log(module.id);
  var ProfileView = Marionette.ItemView.extend({
    template: false,
    serializeData: function() {
      return {
        items: this.collection.toJSON()
      };
    },
    constructor: function ProfileView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.model = this.options.context.getModel(MemberModelFactory);
      this.userModel = this.options.context.getModel(UserModelFactory);
      this.connector = this.options.connector = this.model.connector ?? this.userModel.connector ?? this.options.connector;
      this._ensureModels(true);
      this.otcData = {
        initials: this.model?.attributes?.initials ?? "",
        interactive: "",
        image: "",
        arialabel: lang.profileMenuTitle,
        title: lang.profileMenuTitle,
        collection: this.collection
      };
      this.model.ensureFetched().then(_.bind(function() {
        this._setUserData();
        this._getUserGroups();
        this._refreshActions();
      }, this));
      this.listenTo(this.model, "change", this._setUserData).listenTo(this.userModel, "change", this._setUserMeberData).listenTo(options.context, "sync error", this._refreshActions).listenTo(this, "destroy", this._releasePhotoUrl).listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction);
      this.listenTo(this, "execute:action", _.bind(function(toolItemModel) {
        this._executeAction(toolItemModel);
      }, this));
      this.listenTo(this, "set:focus", _.bind(function() {
        let isJATO = theming.isJATOTheme();
        !isJATO && this.options?.otcEl?.focus();
        isJATO && this.options?.otcEl?.closest(".smart-jato-profile-avatar-parent")?.focus();
      }, this));
    },
    _executeAction: function(toolItem) {
      var signature = toolItem.get("signature"), command = commands.findWhere({
        signature: signature
      }), context = this.options.context, status = {
        context: context,
        toolItem: toolItem,
        originatingView: this,
        data: toolItem.get("commandData")
      }, self = this;
      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }
        command.execute(status).done(function(item) {}).fail(function(error) {
          if (error) {
            error = new base.Error(error);
            GlobalMessage.showMessage("error", error.message, error.errorDetails);
          }
        }).always(function() {});
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
      }
    },
    _getUserGroups: function() {
      let groupsUrl = this._getGroupsUrl();
      if (groupsUrl) {
        this.options.connector.makeAjaxCall({
          type: "GET",
          url: groupsUrl
        }).always(_.bind(function(response, statusText, jqxhr) {
          if (jqxhr && jqxhr.status === 200) {
            let groups = response.results;
            this.options.context._groups = groups;
            this.options.context.trigger("groups:fetched");
            let businessAdministrator = false;
            _.each(groups, function(group) {
              businessAdministrator = !businessAdministrator ? group?.data?.properties?.name?.indexOf("Business Administrators") > -1 : businessAdministrator;
            });
            if (businessAdministrator && config?.initialResponse?.data) {
              config.initialResponse.data.businessAdministrator = businessAdministrator;
              this._ensureModels(this.options);
            }
          }
        }, this));
      }
    },
    _ensureModels: function(useBlank = false) {
      this.staticMenuItems = menuItems.profileMenu.collection.toJSON();
      this.collection = useBlank ? new FilteredToolItemsCollection([]) : new FilteredToolItemsCollection(menuItems.profileMenu, {
        status: {
          context: this.options.context
        },
        commands: commands,
        mask: new MenuItemsMask()
      });
    },
    _getGroupsUrl: function() {
      let user = this.model;
      if (user) {
        let fullUrl = Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "members/memberof");
        return fullUrl;
      }
    },
    _refreshActions: function() {
      if (this._isRendered && !this.isDestroyed) {
        if (menuHandlers) {
          var options = this.options, promises = _.chain(menuHandlers).flatten(true).map(function(menuHandler) {
            return menuHandler(options);
          }).value(), self = this;
          $.whenAll.apply($, promises).always(function(dynamicMenuItems) {
            var mask = new MenuItemsMask();
            self.staticMenuItems = menuItems.profileMenu.collection.toJSON();
            dynamicMenuItems = _.chain(dynamicMenuItems).flatten().pluck("profileMenu").flatten().value();
            _.each(dynamicMenuItems, function(menuItem) {
              if (!!menuItem && !!self.staticMenuItems) {
                var found = false;
                for (var i = 0; i < self.staticMenuItems.length; i++) {
                  if (self.staticMenuItems[i].group === menuItem.group) {
                    found = true;
                  } else if (found) {
                    self.staticMenuItems.splice(i + 1, 0, menuItem);
                    break;
                  }
                }
                if (!found) {
                  self.staticMenuItems.splice(self.staticMenuItems.length - 1, 0, menuItem);
                }
              }
            });
            dynamicMenuItems = self.staticMenuItems.concat([]);
            dynamicMenuItems = mask.maskItems(dynamicMenuItems);
            menuItems.profileMenu.reset(dynamicMenuItems);
            self.collection = new FilteredToolItemsCollection(menuItems.profileMenu, {
              status: {
                context: self.options.context
              },
              commands: commands,
              mask: new MenuItemsMask()
            });
            self.otcData.collection = self.collection;
            self._setOtcData();
          });
        } else {
          this.collection.refilter();
        }
      }
    },
    _setUserMeberData: function() {
      this.model.attributes = _.extend(this.model.attributes, this.userModel.attributes);
      this._setUserData();
    },
    _setUserData: function() {
      var photoUrl = this._getUserPhotoUrl();
      if (photoUrl) {
        var getPhotoOptions = {
          url: photoUrl,
          dataType: "binary"
        };
        this.connector.makeAjaxCall(getPhotoOptions).always(_.bind(function(response, statusText, jqxhr) {
          if (!this.isDestroyed) {
            if (jqxhr.status === 200) {
              this._setPersonalizedImage(response);
            } else {
              this.otcData.image = "";
              this._setOtcData();
            }
          }
        }, this));
      } else {
        this.otcData.image = "";
        this._setOtcData();
      }
    },
    _getUserPhotoUrl: function() {
      var connection = this.connector.connection, cgiUrl = new Url(connection.url).getCgiScript(), photoPath = this.model.get("photo_url");
      if (photoPath && photoPath.indexOf("?") > 0) {
        return Url.combine(cgiUrl, photoPath);
      }
    },
    _setPersonalizedImage: function(imageContent) {
      this._releasePhotoUrl();
      this._photoUrl = URL.createObjectURL(imageContent);
      let blob = imageContent;
      var reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = _.bind(function() {
        var base64String = reader.result;
        this.otcData.image = base64String;
        this._setOtcData();
      }, this);
    },
    _setOtcData: function() {
      this.otcData = _.extend(this.otcData, {
        image: this.otcData.image ?? "",
        initials: this.model.attributes.initials,
        arialabel: _.str.sformat(lang.profileMenuAria, this.model.get("initials"), this.model.get("display_name")),
        collection: this.collection
      });
      this.trigger("data:synced");
      !theming.isJATOTheme() && this._prepareBadge();
    },
    _prepareBadge: function() {
      const selector = 'otc-menuitem[data-csui-command="switchtojato"]';
      const badgeClass = "csui-badge";
      const badgeText = lang.badgeLabel;
      let cmdEle = this.options.parentView.el.querySelector(selector);
      if (cmdEle) {
        const badgeEle = cmdEle.querySelector(`span.${badgeClass}`);
        if (!badgeEle) {
          const badge = document.createElement("span");
          badge.textContent = badgeText;
          badge.className = badgeClass;
          cmdEle.appendChild(badge);
        }
      }
    },
    _releasePhotoUrl: function() {
      if (this._photoUrl) {
        URL.revokeObjectURL(this._photoUrl);
        this._photoUrl = undefined;
      }
    }
  });
  return ProfileView;
});