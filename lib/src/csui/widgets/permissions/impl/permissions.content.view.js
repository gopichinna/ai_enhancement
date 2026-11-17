/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/log", "csui/widgets/permissions/impl/permissions.lookup/permissions.lookup.view", "csui/controls/table.list/table.list.view", "csui/widgets/permissions/impl/permissions.list/permissions.dropdown.menu.items", "csui/utils/commands", "csui/models/member", "csui/widgets/permissions/impl/permissions.list/toolbaritems", "csui/widgets/permissions/impl/permissions.list/toolbaritems.masks", "csui/widgets/permissions/impl/permissions.list/permission.table.columns", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/themes/csui.jato.mime.icons", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/dialogs/members.picker/members.picker.wizard", "i18n!csui/widgets/permissions/impl/nls/lang", "hbs!csui/widgets/permissions/impl/permissions.content", "hbs!csui/widgets/permissions/impl/permissions.list/permissions.empty", "css!csui/widgets/permissions/impl/permissions" ], function(module, _, $, Marionette, log, PermissionsLookupView, TableListView, dropdownMenuItems, commands, MemberModel, toolbarItems, ToolbarItemsMasks, permissionTableColumns, theming, JatoIcons, jatoMIMEIcons, ViewEventsPropagationMixin, BlockingView, MembersPickerDialog, lang, template, emptyTemplate) {
  "use strict";
  log = log(module.id);
  var NoPermissionsResultView = Marionette.ItemView.extend({
    className: "csui-table-empty",
    template: emptyTemplate,
    templateHelpers: function() {
      if (!!this.model.get("name")) {
        var emptyText = theming.isJATOTheme() ? lang.emptyPermissionListMsg4JATO : _.str.sformat(lang.emptyPermissionListMsg, this.model.get("name"));
        return {
          message: emptyText
        };
      }
    },
    constructor: function NoPermissionsResultView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  var PermissionsContentView = Marionette.LayoutView.extend({
    className: "cs-permissions-content",
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        emptyMessageSuggestion: lang.emptyPermissionSuggest,
        iconSVG: JatoIcons.actionAdd,
        mimePermissionsOwner: jatoMIMEIcons.mimePermissionsOwner,
        mimePermissionsGroup: jatoMIMEIcons.mimePermissionsGroup,
        mimePermPublic: jatoMIMEIcons.mimePermPublic,
        userSVGIcon: JatoIcons.actionUserAdd,
        iconName: "csui_action:action_add32",
        isToolbar: this.admin_permissions,
        buttonAriaLabel: lang.AddUserOrGroup,
        buttonTitle: lang.AddDropdownTitle,
        buttonID: _.uniqueId("permissionAddUserOrGroup")
      };
    },
    regions: {
      lookupRegion: ".csui-permission-lookup-container",
      listRegion: ".csui-permissions-list-container"
    },
    ui: {
      permissionList: ".csui-permissions-list-container",
      emptyActionsContainer: ".csui-permissions-empty-actions",
      addMemberToGroup: ".csui-addMember",
      addMemberToGroupClick: ".csui-addMemberClick",
      grantAccessToMember: ".csui-grantAccess",
      addPermissionButton: ".csui-add-permission",
      addPermissionMenu: ".csui-add-permission-menu",
      addPermissionToolitem: ".csui-toolitem"
    },
    events: {
      "click @ui.addMemberToGroupClick": "onClickAddMember"
    },
    onClickAddMember: function(e) {
      var self = this;
      var deferred = $.Deferred();
      var status = self.options.originatingView;
      var selectableMembers = self.originalCollection && self.originalCollection.models && self.originalCollection.models.length > 0 ? self.originalCollection.models : self.permissionCollection.models;
      selectableMembers = _.filter(selectableMembers, function(member) {
        return member.get("right_id_expand") && member.get("right_id_expand").type === 1;
      });
      var membersPickerDialog = new MembersPickerDialog({
        command: "adduserorgroup",
        context: status.context,
        connector: status.model.connector,
        dialogClass: "cs-permission-group-picker",
        displayName: lang.allUsersAndGroups,
        dialogTitle: lang.addUsersAndGroups,
        startLocation: "acl.groups",
        displayStartLocation: true,
        selectedMember: self.memberFilter,
        showUserPicker: true,
        authUser: self.options.authUser,
        hasEditPermissionAction: self.options.hasEditPermissionAction,
        adduserorgroup: true,
        buttons: [ {
          id: "Add",
          label: lang.addButtonLabel,
          default: true,
          toolTip: lang.addButtonTooltip
        }, {
          id: "Cancel",
          label: lang.cancelButtonLabel,
          disabled: false,
          close: true,
          toolTip: lang.cancelButtonTooltip
        } ],
        nodeModel: status.model,
        availablePermissions: self.options.collection.availablePermissions,
        startLocations: [ "acl.groups" ],
        selectableMembers: selectableMembers
      }, self);
      membersPickerDialog.show().done(function() {
        deferred.resolve.apply(deferred, arguments);
      }).fail(function(error) {
        deferred.reject.apply(deferred, arguments);
      });
    },
    constructor: function PermissionsContentView(options) {
      var self = this;
      options || (options = {});
      options.toolbarItems || (options.toolbarItems = toolbarItems);
      options.toolbarItemsMasks || (options.toolbarItemsMasks = new ToolbarItemsMasks());
      this.options = options;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
      this.memberFilter = new MemberModel();
      this.memberFilter.set({
        id: "",
        name: "",
        group_id: "",
        initials: "",
        photo_url: ""
      });
      this.collection = this.options.collection;
      this.listenTo(this.memberFilter, "change", function() {
        if (this.collection.isFetchable()) {
          var self = this, edit_permissions = this.options.hasEditPermissionAction && this.model.get("permissions_model") !== "simple";
          self.edit_permissions = edit_permissions;
          if (this.memberFilter.get("id")) {
            if (!this.originalCollection) {
              this.originalCollection = this.options.collection.clone();
            }
            this.options.filteredPermissions = true;
            var filteredCollection = _.filter(this.originalCollection.models, function(model) {
              return model.get("right_id") === this.memberFilter.get("id");
            }, this), availableGroups = _.filter(self.originalCollection.models, function(model) {
              return model.get("right_id_expand") && model.get("right_id_expand").type === 1;
            }, this);
            this.collection.models = filteredCollection;
            if (this.permissionsListView) {
              this.collection.options.memberId = this.memberFilter.get("id");
              this.collection.options.selectedMember = this.memberFilter.get("selectedMember");
              this.collection.options.effectivePermissions = this.memberFilter.get("effectivePermissions");
              this.collection.options.clearEmptyPermissionModel = true;
              this.collection.fetch().then(function(resp) {
                self.collection.options.effectivePermissions = false;
                self.collection.options.selectedMember = undefined;
                if (self.collection.models && self.collection.models.length === 0 && self.edit_permissions) {
                  self.ui.permissionList.addClass("empty-permission-list");
                  if (availableGroups.length > 0) {
                    self.ui.emptyActionsContainer.removeClass("binf-hidden");
                    var addMemberToGroup = theming.isJATOTheme() ? lang.addMemberToGroup4JATO : _.str.sformat(lang.addMemberToGroup, self.memberFilter.get("name"));
                    var grantAccessToMember = _.str.sformat(lang.grantAccessToMember, self.memberFilter.get("name"));
                    self.ui.addMemberToGroup.text(addMemberToGroup);
                    self.ui.grantAccessToMember.text(grantAccessToMember);
                    self.ui.addMemberToGroup.attr("title", addMemberToGroup);
                    self.ui.grantAccessToMember.attr("title", grantAccessToMember);
                  }
                } else {
                  self.ui.emptyActionsContainer.addClass("binf-hidden");
                }
              }, this);
            } else {
              this.model.set("isNotFound", true);
              this.collection.options.memberId = this.memberFilter.get("id");
              this.collection.fetch();
              if (edit_permissions) {
                this.ui.permissionList.addClass("empty-permission-list");
                if (availableGroups.length > 0) {
                  this.ui.emptyActionsContainer.removeClass("binf-hidden");
                  var addMemberToGroup = theming.isJATOTheme() ? lang.addMemberToGroup4JATO : _.str.sformat(lang.addMemberToGroup, this.memberFilter.get("name"));
                  var grantAccessToMember = _.str.sformat(lang.grantAccessToMember, this.memberFilter.get("name"));
                  this.ui.addMemberToGroup.text(addMemberToGroup);
                  this.ui.grantAccessToMember.text(grantAccessToMember);
                  this.ui.addMemberToGroup.attr("title", addMemberToGroup);
                  this.ui.grantAccessToMember.attr("title", grantAccessToMember);
                }
              }
            }
          } else {
            this.ui.emptyActionsContainer.addClass("binf-hidden");
            this.ui.permissionList.removeClass("empty-permission-list");
            this.model.set("isNotFound", false);
            this.options.filteredPermissions = false;
            this.originalCollection = undefined;
            this.collection.options.memberId = this.memberFilter.get("id");
            this.collection.fetch();
          }
        }
      });
      this.permissionsLookupView = new PermissionsLookupView(_.extend({
        originatingView: this.options.originatingView,
        userPickerModel: this.memberFilter
      }, this.options));
      this.admin_permissions = this.model && this.model.actions.get({
        signature: "editpermissions"
      });
      this.columnCollection = permissionTableColumns.clone();
      this.updateColumnsCollection();
      this.permissionsListView = new TableListView(_.extend({
        tableAriaLabel: _.str.sformat(lang.permissionsTable, this.options.originatingView.model.get("name")),
        originatingView: this.options.originatingView,
        context: this.options.context,
        memberFilter: this.memberFilter,
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        collection: this.collection,
        tableColumns: this.columnCollection,
        emptyView: NoPermissionsResultView,
        emptyViewModel: this.memberFilter,
        applyTo: this.options.applyTo,
        admin_permissions: this.admin_permissions,
        authUser: this.options.authUser,
        hasPermissionAction: this.options.hasPermissionAction
      }, this.options));
      if (this._isCollectionEditable()) {
        this.listenTo(this.permissionsListView, "render", this.createPermissionDropDown);
      }
      this.listenTo(this, "update:editpermissions:acitons", this._updatePermissionTable);
      this.listenTo(this.permissionsListView, "render", this._resizePermissionTable);
      this.listenTo(this.permissionsListView, "scroll", this._handleScroll);
      this.listenTo(this.permissionsListView, "resizetable", this._resizePermissionTable);
      this.listenTo(this.permissionsLookupView, "close:addmenu", this.closeAddMenu);
      this.propagateEventsToViews(this.permissionsLookupView, this.permissionsListView);
    },
    updateColumnsCollection: function() {
      var models;
      if (this.options.hasPermissionAction) {
        if (this.admin_permissions) {
          models = permissionTableColumns.models;
        } else {
          models = permissionTableColumns.filter(function(model) {
            return !model.attributes.isToolbar;
          });
        }
      } else {
        models = permissionTableColumns.filter(function(model) {
          return !model.attributes.isToolbar;
        });
      }
      this.columnCollection.set(models, {
        remove: true
      });
    },
    _updatePermissionTable: function() {
      if (!this._isCollectionEditable()) {
        this.ui.addPermissionButton.addClass("binf-hidden");
        this.permissionsListView.$el.find(".csui-add-owner-or-group .csui-user-display-name").text(lang.NoOwnerAssigned);
        this.permissionsListView.options.admin_permissions = this.admin_permissions;
        this.permissionsListView.render();
      }
    },
    _resizePermissionTable: function(event) {
      var tableEle = this.$el.find(".csui-table-body");
      if (tableEle) {
        if (tableEle.parents(".csui-table-list").hasClass("csui-table-list-no-scrollable")) {
          tableEle.parents(".csui-table-list").removeClass("csui-table-list-no-scrollable");
        }
        if (tableEle.height() > tableEle.parent().height()) {
          tableEle.parents(".csui-table-list").removeClass("csui-table-list-no-scrollable");
        } else {
          tableEle.parents(".csui-table-list").addClass("csui-table-list-no-scrollable");
        }
      }
    },
    _isCollectionEditable: function() {
      return this.model && this.model.actions.get({
        signature: "editpermissions"
      });
    },
    createPermissionDropDown: async function() {
      if (this._isCollectionEditable()) {
        if (!this.model.get("csuiEditPermissionsActionsRetrieved")) {
          const permissionsActionsCommands = commands.getSignatures(dropdownMenuItems);
          await this.model.getAdditionalActionCommands(permissionsActionsCommands, "csuiEditPermissionsActionsRetrieved");
        }
        var toggler = this.ui.addPermissionButton;
        if (this.dropDownEl !== undefined) {
          this.ui.addPermissionMenu[0].innerHTML = "";
        }
        this.createMenuItems();
        this.dropDownEl = toggler;
      }
    },
    closeAddMenu: function() {
      if (this.ui.addPermissionButton.parent().hasClass("binf-open")) {
        this.ui.addPermissionButton.parent().removeClass("binf-open");
      }
    },
    createMenuItems: function(event) {
      let listItems = dropdownMenuItems.dropdownMenuList;
      let otcMenuItem, signature, toolItems, status = {};
      if (this.options.filteredPermissions) {
        _.extend(this.originalCollection.options, this.collection.options);
        status.permissionCollection = this.originalCollection;
      } else {
        status.permissionCollection = this.collection;
      }
      status.admin_permissions = this.options.hasEditPermissionAction;
      status.nodeModel = this.model;
      status.authUser = this.options.authUser;
      listItems.collection.models.forEach(_.bind(function(item_) {
        signature = item_.get("signature");
        var command = commands.findWhere({
          signature: signature
        });
        status.toolItem = item_;
        if (!!command && signature !== "disabled" && isCommandEnabled()) {
          command.set("startLocation", status.startLocation);
          otcMenuItem = `<otc-menuitem class="csui-permission-addusergroup-menu-item" role="none" data-csui-command="${item_.get("signature")}" 
          arialabel="${item_.get("name")}">${item_.get("name")}</otc-menuitem>`;
          this.ui.addPermissionMenu.append(otcMenuItem);
        }
        function isCommandEnabled() {
          try {
            return command.enabled(status);
          } catch (error) {
            log.warn('Evaluating the command "{0}" failed.\n{1}', command.get("signature"), error.stack) && console.warn(log.last);
            return true;
          }
        }
      }, this));
      toolItems = this.ui.addPermissionMenu.find("otc-menuitem");
      toolItems.on("click", _.bind(this.executeToolItemAction, this));
      toolItems.on("keydown", _.bind(this.onKeyInView, this));
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        if (this.$(event.target).hasClass("csui-permission-addusergroup-menu-item")) {
          this.$(event.target).trigger("click");
        }
      }
    },
    executeToolItemAction: function(event) {
      var self = this;
      this.commands = commands;
      var signature = event.target.getAttribute("data-csui-command"), command = this.commands.findWhere({
        signature: signature
      }), admin_permissions = this.options.hasEditPermissionAction;
      var status = {
        startLocation: command.get("startLocation"),
        context: this.options.context,
        permissionCollection: this.collection,
        originalCollection: this.originalCollection,
        nodeModel: this.model,
        originatingView: this,
        connector: this.model.connector,
        nodeId: this.model.get("id"),
        admin_permissions: admin_permissions,
        applyTo: this.options.applyTo,
        authUser: this.options.authUser
      };
      if (command && command.enabled(status)) {
        this._ = _;
        command.execute(status).done(_.bind(function(resp) {
          if (self.permissionsLookupView.pickerView && self.permissionsLookupView.pickerView.ui.searchclear.is(":visible")) {
            self.permissionsLookupView.pickerView.ui.searchclear.trigger("click");
          } else {
            this.collection.models.forEach(function(item) {
              item.set("isAddNew", false);
            });
            resp.set("isAddNew", true);
            if (resp.get("addOwnerGroup")) {
              self.collection.addOwnerOrGroup(resp, true);
            } else if (resp.get("publicAccess")) {
              self.collection.addPublicAccess(resp);
            } else {
              self.collection.add(resp);
            }
          }
          if (self.originalCollection && self.originalCollection.models) {
            var diffInCollection = this.collection.models.filter(function(item1) {
              for (var i in self.originalCollection.models) {
                if (item1.get("right_id") === self.originalCollection.models[i].get("right_id") && item1.get("type") === self.originalCollection.models[i].get("type") || item1.get("type") === null) {
                  return false;
                }
              }
              return true;
            });
            if (diffInCollection.length > 0 && diffInCollection[0].get("type") === "owner" && self.originalCollection.findWhere({
              type: "owner"
            })) {
              self.originalCollection.remove(self.originalCollection.findWhere({
                type: "owner"
              }));
            }
            self.originalCollection.models.push(diffInCollection[0]);
          }
        }, this)).always(function() {
          self.dropDownEl.trigger("focus");
        });
      }
    },
    onRender: function() {
      this.lookupRegion.show(this.permissionsLookupView);
      this.listRegion.show(this.permissionsListView);
    },
    onBeforeDestroy: function() {
      if (this.collection.options.memberId) {
        delete this.collection.options.memberId;
        this.memberFilter.set({
          id: "",
          group_id: "",
          name: ""
        }, {
          silent: true
        });
      }
    },
    _blockActions: function() {
      var origView = this.options.originatingView;
      origView && origView.blockActions && origView.blockActions();
    },
    _unblockActions: function() {
      var origView = this.options.originatingView;
      origView && origView.unblockActions && origView.unblockActions();
    },
    _handleScroll: function(event) {
      this.options.originatingView && this.options.originatingView.trigger("scroll", event);
    }
  });
  _.extend(PermissionsContentView.prototype, ViewEventsPropagationMixin);
  return PermissionsContentView;
});