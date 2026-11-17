/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/dialogs/members.picker/impl/members.picker.view", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/member", "csui/models/member/member.model", "csui/models/member/membercollection", "csui/models/permission/nodepermission.model", "csui/dialogs/members.picker/start.locations/start.location.collection", "csui/dialogs/members.picker/impl/command.type", "csui/dialogs/members.picker/impl/header/members.picker.header.view", "i18n!csui/dialogs/members.picker/impl/nls/lang", "csui/utils/log", "csui/utils/url", "csui/controls/progressblocker/blocker", "csui/controls/wizard/wizard.view", "csui/widgets/permissions/edit/permission.level.selector/permission.level.selector.view", "csui/widgets/permissions/edit/permission.attributes/permission.attributes.view", "csui/widgets/permissions/edit/apply.permission/apply.permission.view", "csui/utils/taskqueue", "csui/controls/globalmessage/globalmessage", "i18n", "csui/utils/commonconfig.util", "css!csui/dialogs/members.picker/impl/members.picker", "csui/dialogs/node.picker/node.picker" ], function(module, _, $, Backbone, Marionette, MembersPickerView, ConnectorFactory, MemberModelFactory, MemberModel, MemberCollectionModel, NodePermissionModel, StartLocationCollection, CommandType, HeaderView, lang, log, Url, BlockingView, WizardView, PermissionLevelSelectorView, PermissionAttributesView, ApplyPermissionView, TaskQueue, GlobalMessage, i18n, CommonConfig) {
  "use strict";
  var config = _.extend({
    initialLocationLookupOrder: [ "csui/dialogs/members.picker/start.locations/recent.groups", "csui/dialogs/members.picker/start.locations/member.groups", "csui/dialogs/members.picker/start.locations/acl.groups", "csui/dialogs/members.picker/start.locations/all.members" ]
  }, module.config());
  _.defaults(config, {
    parallelism: 3,
    enableRemoveMember: CommonConfig.enableFeatureInSmartView() || false
  });
  var defaultOptions = {
    initialSelection: [],
    dialogTitle: lang.dialogTitle,
    orderBy: "name asc"
  };
  function MembersPickerWizard(options) {
    options || (options = {});
    this.options = _.defaults(options, defaultOptions, {
      pageSize: 30
    });
    this.options.connector || (this.options.connector = this._getConnector(this.options));
    if (!this.options.connector) {
      var msg = lang.missingConnector;
      log.error(msg) && console.error(msg);
      throw new Error(msg);
    }
    this.options.targetBrowseHistory = [];
    this.options.navigateFromHistory = false;
    this.options.initialContainer = this._getInitalContainer(this.options);
    this.options.unselectableMembers = this._getArrayOfNodeIds(options.unselectableMembers);
    this.options.selectableMembers = this._getArrayOfNodeIds(options.selectableMembers);
    this.options.commandType = new CommandType(this.options);
  }
  let removedModels = [];
  _.extend(MembersPickerWizard.prototype, {
    show: function() {
      this._locations = new StartLocationCollection(this.options);
      this._locations.fetch({
        connector: this.options.connector,
        container: this.options.initialContainer,
        nodeId: this.options.nodeModel ? this.options.nodeModel.get("id") : undefined,
        removeInvalid: false
      }).done(_.bind(this._showWizard, this));
      this._deferred = $.Deferred();
      return this._deferred.promise();
    },
    _showWizard: function() {
      this._steps = this._createWizardSteps();
      this._wizard = new WizardView({
        steps: this._steps
      });
      BlockingView.imbue(this._wizard);
      this._wizard.options.editpermission = this.membersPickerView.options.edit_permission;
      this._wizard.options.groupId = this.membersPickerView.options.groupId;
      this._wizard.options.id = this.membersPickerView.options.groupId;
      this._wizard.options.add = this.membersPickerView.options.add;
      this.membersPickerView.selectViews.initialLocation = this.initialLocation;
      this._wizard.show(this._wizard.options);
      this._wizard.on("save:result", this.onClickFinishButton, this);
      this._wizard.on("add:member", this.onClickApplyButton, this);
      this._wizard.on("apply:result", this.onClickApplyButton, this);
      this._wizard.on("closing:wizard", this.onClickCancelButton, this);
      this._wizard.currentView.headerView.on("show:selectItem", this.selectUsers, this);
      this._wizard.currentView.headerView.on("enable:add", this.enableAdd, this);
      if (this.options.selectedMember) {
        this.selectUsers(this.options.selectedMember);
      }
    },
    _createHeaderControl: function(initialLocation) {
      var options = this.options, locationSelector = options.locationSelector == null ? true : options.locationSelector, displayStartLocation = options.displayStartLocation == null ? false : options.displayStartLocation;
      var headerView = new HeaderView({
        locations: this._locations,
        headerViewoptions: this.options,
        title: options.dialogTitle,
        context: options.context,
        node: this.options.node,
        authUser: this.options.authUser,
        hasEditPermissionAction: this.options.edit_permission,
        initialLocation: initialLocation,
        displayStartLocation: displayStartLocation,
        adduserorgroup: options.adduserorgroup ? options.adduserorgroup : false,
        showUserPicker: options.showUserPicker,
        locationSelector: locationSelector,
        selectedMember: options.selectedMember,
        initialSelection: options.initialSelection
      });
      options.adduserorgroup && headerView.startLocationView.on("change:location", this.onChangeLocation, this);
      headerView.on("hide:parentDialog", this.parentdialogdestroy, this);
      return headerView;
    },
    parentdialogdestroy: function(e) {
      this._wizard.destroy();
    },
    _createPickerView: function(location, leftSelection) {
      if (!this.options.startLocation) {
        this.options.startLocation = this._locations.at(0);
      }
      var options = this.options, locationFactory = location.get("factory"), locationParameters = locationFactory.getLocationParameters(this.options);
      _.defaults(locationParameters, this.options, {
        leftSelection: leftSelection
      });
      var membersPickerView = new MembersPickerView(locationParameters);
      membersPickerView.on("update:button", this.updateButton, this);
      membersPickerView.on("enable:apply", this.enableDone, this);
      membersPickerView.on("changing:selection", this._blockDialog, this).on("change:location", this.onChangeLocation, this);
      if (!!options.adduserorgroup) {
        membersPickerView.on("change:complete", this.onSelectionChange, this);
      }
      this.membersPickerView = membersPickerView;
      return membersPickerView;
    },
    _createPermissionLevelSelectorView: function() {
      var permissionLevelView = new PermissionLevelSelectorView({
        selected: 1,
        isContainer: this.options.nodeModel ? this.options.nodeModel.get("container") : true,
        nodeModel: this.options.nodeModel
      });
      permissionLevelView.on("permission:level:selected", this.onPermissionLevelSelection, this);
      return permissionLevelView;
    },
    _createPermissionLevelSubItemsView: function() {
      var applyPermissionView = new ApplyPermissionView({
        selected: 2,
        context: this.options.context,
        model: this.options.nodeModel,
        applyTo: this.options.applyTo
      });
      applyPermissionView.on("permission:level:selected", this.onPermissionLevelSelection, this);
      return applyPermissionView;
    },
    dialogClassName: function() {
      var className = "target-browse";
      if (this.options && this.options.userClassName) {
        className = className + " " + this.options.userClassName;
      }
      return className;
    },
    _createWizardSteps: function() {
      this.initialLocation = this._getInitialLocation();
      var options = this.options, step1header = this._createHeaderControl(this.initialLocation), step1view = this._createPickerView(this.initialLocation), isContainer = options.nodeModel && options.nodeModel.get("container") && options.nodeModel.get("permissions_model") === "advanced" ? true : false, memberPickerTitleId = "memberPickerHeader", permissionLevelDescId = _.uniqueId("permissionLevel"), step1, step2, step3;
      if (options.adduserorgroup && !options.showUserPicker && isContainer) {
        step1 = {
          title: options.dialogTitle,
          adduserorgroup: options.adduserorgroup ? options.adduserorgroup : false,
          headerView: step1header,
          view: step1view,
          className: this.dialogClassName,
          nextButton: true,
          userClassName: this.options.dialogClass,
          attributes: {
            "aria-labelledby": memberPickerTitleId
          },
          largeSize: true
        };
        step2 = {
          title: options.dialogTitle,
          headers: [ {
            label: lang.selectPermissionLevel,
            class: "csui-permission-level-select",
            id: permissionLevelDescId
          } ],
          nextButtonLabel: lang.nextButtonLabel,
          nextButton: true,
          disableNext: false,
          view: this._createPermissionLevelSelectorView(),
          className: this.dialogClassName() + " csui-permissions-level",
          attributes: {
            "aria-labelledby": memberPickerTitleId,
            "aria-describedby": permissionLevelDescId
          }
        };
        step3 = {
          title: options.dialogTitle,
          doneButtonLabel: lang.doneButtonLabel,
          disableDone: false,
          doneButton: true,
          view: this._createPermissionLevelSubItemsView(),
          className: this.dialogClassName() + " csui-permissions-apply-dialog",
          attributes: {
            "aria-labelledby": memberPickerTitleId
          }
        };
        return [ step1, step2, step3 ];
      } else if (options.adduserorgroup && !options.showUserPicker && !isContainer) {
        step1 = {
          title: options.dialogTitle,
          adduserorgroup: options.adduserorgroup ? options.adduserorgroup : false,
          headerView: step1header,
          view: step1view,
          className: this.dialogClassName,
          nextButton: true,
          userClassName: this.options.dialogClass,
          attributes: {
            "aria-labelledby": memberPickerTitleId
          },
          largeSize: true
        };
        step2 = {
          title: options.dialogTitle,
          headers: [ {
            label: lang.selectPermissionLevel,
            class: "csui-permission-level-select",
            id: permissionLevelDescId
          } ],
          doneButtonLabel: lang.doneButtonLabel,
          disableDone: false,
          doneButton: true,
          view: this._createPermissionLevelSelectorView(),
          className: this.dialogClassName() + " csui-permissions-level",
          attributes: {
            "aria-labelledby": memberPickerTitleId,
            "aria-describedby": permissionLevelDescId
          }
        };
        return [ step1, step2 ];
      } else {
        var memberBrowseStep = {
          title: options.dialogTitle,
          adduserorgroup: options.adduserorgroup ? options.adduserorgroup : false,
          showUserPicker: options.showUserPicker,
          headerView: step1header,
          view: step1view,
          className: this.dialogClassName,
          userClassName: this.options.dialogClass,
          attributes: {
            "aria-labelledby": "memberPickerHeader"
          },
          largeSize: true,
          buttons: options.buttons
        };
        return [ memberBrowseStep ];
      }
    },
    _blockDialog: function() {
      this._wizard.blockWithoutIndicator();
      return true;
    },
    onHideDialog: function() {
      if (this._deferred) {
        if (this._result) {
          this._deferred.resolve(this._result);
        } else if (this._deferred.state() === "pending") {
          this._deferred.reject({
            cancelled: true
          });
        }
      }
    },
    normalizeLocationName: function(location) {
      let lastSlash = location.lastIndexOf("/");
      return lastSlash >= 0 ? location : `csui/dialogs/members.picker/start.locations/${location}`;
    },
    onChangeLocation: function(location, leftSelection) {
      if (!location.get) {
        location = this._locations.get(this.normalizeLocationName(location));
      }
      this.options.targetBrowseHistory = [];
      var selectedMembers = this.membersPickerView && this.membersPickerView.selectedMemberList && this.membersPickerView.selectedMemberList.collection.models;
      this._steps[0].view.destroy();
      this.membersPickerView.trigger("change:complete");
      this.options.location = location.get("location");
      this.options.startLocation = this.options.location;
      var rightId = leftSelection && leftSelection.rightId;
      this._steps[0].view = this._createPickerView(location, rightId);
      var node = location.get("factory").container;
      this._wizard.currentView.showView(this._steps[0].view);
      if (selectedMembers) {
        this.selectUsers(selectedMembers);
      }
    },
    selectUsers: function(selectedMember) {
      this.membersPickerView && this.membersPickerView.selectedMemberList && this.membersPickerView.selectedMemberList.trigger("show:selectItem", selectedMember);
    },
    onClickCancelButton: function() {
      removedModels = [];
      if (this.options.context?.memberListView?.removedItems) {
        this.options.context.memberListView.removedItems = [];
      }
    },
    enableDone: function() {
      const removedItemsLength = this.options.context?.memberListView?.removedItems?.length;
      if (removedItemsLength) {
        removedModels.push(this.options.context?.memberListView?.removedItems[removedItemsLength - 1]);
      }
      const buttonView = this._wizard.currentView.footerView.children._views;
      _.each(buttonView, function(apply) {
        if (apply.model.get("id") === "Apply") {
          apply?.$el?.removeAttr("disabled");
        }
      }, this);
    },
    enableAdd: function() {
      if (!config.enableRemoveMember) {
        var buttonView = this._wizard.currentView.footerView.children._views;
        _.each(buttonView, function(add) {
          if (add.model.get("id") === "Add") {
            add.$el.removeClass("binf-hidden");
          }
        }, this);
      }
    },
    updateButton: function(selectedMemberCollection) {
      this._wizard.currentView.footerView && this._wizard.currentView.footerView.trigger("update:button", selectedMemberCollection);
      this.locationId = !!this._wizard.currentView.headerView.options && !!this._wizard.currentView.headerView.options.headerViewoptions && this._wizard.currentView.headerView.options.headerViewoptions.locationID;
      var buttonView = this._wizard.currentView.footerView.children._views;
      _.each(buttonView, function(add) {
        if (add.model.get("id") === "Add" || add.model.get("id") === "Apply") {
          if ((selectedMemberCollection.models.length > 0 || removedModels?.length > 0) && this._wizard.options.add) {
            if (this.options.selectedMember && !this.locationId) {
              add.$el.attr("disabled", "disabled");
            } else {
              add?.$el?.removeAttr("disabled");
            }
          } else {
            add?.$el?.attr("disabled", "disabled");
          }
        }
      }, this);
      var memberExists = selectedMemberCollection.models.length > 0 ? true : false;
      this._wizard.currentView.headerView && this._wizard.currentView.headerView.userSearchView && this._wizard.currentView.headerView.userSearchView.updatePlaceHolder(memberExists);
    },
    onClickFinishButton: function() {
      var members, permissions, applyToSubFolders, isContainer;
      if (this && this.getMemberPickerView() && this.getMemberPickerView().getSelection()) {
        members = this.getMemberPickerView().getSelection();
        permissions = this.getPermissionLevelView().getSelectedPermissions();
        isContainer = this.options.nodeModel.get("container") && this.options.nodeModel.get("permissions_model") === "advanced" ? true : false;
        if (isContainer) {
          applyToSubFolders = this.getPermissionsApplyView().getApplyToFlag();
        }
        this._result = {
          members: members,
          permissions: permissions,
          apply_to: isContainer ? applyToSubFolders ? 2 : 3 : 0
        };
        this._wizard.destroy();
        this.onHideDialog();
      } else {
        this._wizard.currentView.updateButton("next", {
          disabled: true
        });
      }
    },
    onClickApplyButton: function() {
      this.membersPickerView.selectedMemberList.collection.models.length > 0 && this.onClickAddButton();
      removedModels.length > 0 && this.removeMembers();
      if (this.options.context?.memberListView?.removedItems) {
        this.options.context.memberListView.removedItems = [];
      }
      this._wizard.destroy();
      this.onHideDialog();
    },
    removeMembers: function() {
      const id = this._wizard.options.groupId, url = this.options.connector.getConnectionUrl().getApiBase("v2");
      let self = this, groupName = this.getMemberPickerView().getSelection() && this.getMemberPickerView().getSelection().get("name_formatted") || this.membersPickerView.options.displayName, ajaxOptions = {}, connector = this.options.connector;
      self.groupName = groupName;
      const passedUsers = [];
      const failedUsers = [];
      let passcount = 0;
      let failcount = 0;
      let count = 0;
      const queue = new TaskQueue({
        parallelism: config.parallelism
      }), selectedModels = removedModels, promises = _.map(selectedModels, function(model) {
        var deferred = $.Deferred();
        const userName = model.get("name_formatted") || model.get("name");
        queue.pending.add({
          worker: function() {
            const memberId = model.id;
            ajaxOptions = {
              type: "DELETE",
              id: id,
              url: `${url}/members/${id}/members?member_id=${memberId}`
            };
            connector.makeAjaxCall(ajaxOptions).done(function(resp) {
              passcount += 1;
              passedUsers.push(userName);
              deferred.resolve(model);
            }, self).fail(function(resp) {
              failcount += 1;
              failedUsers.push(userName);
              deferred.resolve(model);
            }, self);
            return deferred.promise();
          }
        });
        count++;
        return deferred.promise();
      });
      $.whenAll.apply($, promises).then(function(promises) {
        removedModels = [];
        switch (true) {
         case passcount === 1 && failcount === 0:
          GlobalMessage.showMessage("success", _.str.sformat(lang.removalSingleUserText, passedUsers[0], self.groupName));
          break;

         case passcount === 0 && failcount === 1:
          GlobalMessage.showMessage("error", _.str.sformat(lang.removalSingleUserFailureText, failedUsers[0], self.groupName));
          break;

         case passcount === 1 && failcount > 0:
          GlobalMessage.showMessage("success", _.str.sformat(lang.removalSinglePassMoreThanOneFail, passedUsers[0], self.groupName, failcount));
          break;

         case passcount > 0 && failcount > 0:
          GlobalMessage.showMessage("success", _.str.sformat(lang.removalManyUserText, passcount, failcount, self.groupName));
          break;

         case passcount > 0 && failcount === 0:
          GlobalMessage.showMessage("success", _.str.sformat(lang.removalOnlyAllSuccessText, passcount, self.groupName));
          break;

         case passcount === 0 && failcount > 0:
          GlobalMessage.showMessage("error", _.str.sformat(lang.removalOnlyAllFailureText, failcount, self.groupName));
          break;

         default:
          break;
        }
      });
    },
    onClickAddButton: function(resolve, reject) {
      var id = this._wizard.options.groupId, url = this.options.connector.getConnectionUrl().getApiBase("v2");
      var self = this, groupName = this.getMemberPickerView().getSelection() && this.getMemberPickerView().getSelection().get("name_formatted") || this.membersPickerView.options.displayName, formData = {}, ajaxOptions = {}, connector = this.options.connector, selecetedGroupId = !!this._wizard.currentView.headerView.options && !!this._wizard.currentView.headerView.options.headerViewoptions && this._wizard.currentView.headerView.options.headerViewoptions.locationID;
      id = selecetedGroupId ? selecetedGroupId : id;
      self.groupName = groupName;
      const passedUsers = [];
      const failedUsers = [];
      let passcount = 0;
      let failcount = 0;
      var queue = new TaskQueue({
        parallelism: config.parallelism
      }), count = 0, selectedModels = this.membersPickerView && this.membersPickerView.selectedMemberList && this.membersPickerView && this.membersPickerView.selectedMemberList.collection.models, promises = _.map(selectedModels, function(model) {
        var deferred = $.Deferred();
        queue.pending.add({
          worker: function() {
            formData = {
              member_id: model.id
            };
            const userName = model.get("name_formatted") || model.get("name");
            var memberModel = new MemberModel({}, {
              id: id,
              connector: connector
            });
            memberModel.save(formData, {
              type: "POST",
              processData: false,
              metadataPartName: "body"
            }).done(function(resp) {
              passcount += 1;
              passedUsers.push(userName);
              deferred.resolve(model);
            }, self).fail(function(resp) {
              failcount += 1;
              failedUsers.push(userName);
              deferred.resolve(model);
            }, self);
            return deferred.promise();
          }
        });
        count++;
        return deferred.promise(promises);
      });
      $.whenAll.apply($, promises).then(function(promises) {
        if (passcount === 1 && failcount === 0) {
          GlobalMessage.showMessage("success", _.str.sformat(lang.additionSingleUserText, passedUsers[0], self.groupName));
        } else if (passcount === 0 && failcount === 1) {
          GlobalMessage.showMessage("error", _.str.sformat(lang.additionSingleUserFailureText, failedUsers[0], self.groupName));
        } else if (passcount === 1 && failcount > 0) {
          GlobalMessage.showMessage("success", _.str.sformat(lang.additionSinglePassMoreThanOneFail, passedUsers[0], self.groupName, failcount));
        } else if (passcount > 0 && failcount > 0) {
          GlobalMessage.showMessage("success", _.str.sformat(lang.additionManyUserText, passcount, failcount, self.groupName));
        } else if (passcount > 0 && failcount === 0) {
          GlobalMessage.showMessage("success", _.str.sformat(lang.additionOnlyAllSuccessText, passcount, self.groupName));
        } else if (passcount === 0 && failcount > 0) {
          GlobalMessage.showMessage("error", _.str.sformat(lang.additionOnlyAllFailureText, failcount, self.groupName));
        }
      });
    },
    _getArrayOfNodeIds: function(unselectableNodes) {
      if (unselectableNodes && !_.isEmpty(unselectableNodes)) {
        if (unselectableNodes[0] instanceof Backbone.Model) {
          return _.map(unselectableNodes, function(node) {
            return node.get("right_id");
          });
        }
      }
      return unselectableNodes;
    },
    _getInitalContainer: function(options) {
      var container = this.options.initialContainer;
      if (container == null || _.isEmpty(container) || !(container instanceof Backbone.Model)) {
        container = new MemberModel({
          groupId: options.groupId,
          displayName: options.displayName
        }, {
          connector: options.connector
        });
      } else {
        container == null;
      }
      return container;
    },
    _getConnector: function(options) {
      var connector;
      if (options.context) {
        connector = options.context.getObject(ConnectorFactory);
      } else if (options.initialSelection || options.initialContainer) {
        var initalSelection = options.initialSelection, nodes = initalSelection ? _.isArray(initalSelection) ? initalSelection : initalSelection.models : undefined, node = options.initialContainer || nodes[0];
        connector = node && node.connector;
      }
      return connector;
    },
    _getInitialLocation: function() {
      var locationId = this.options.startLocation, initialLocation;
      if (locationId) {
        var lastSlash = locationId.lastIndexOf("/");
        if (lastSlash < 0) {
          locationId = "csui/dialogs/members.picker/start.locations/" + locationId;
        }
        initialLocation = this._locations.get(locationId);
      }
      if (!locationId && this.options.groupId) {
        initialLocation = this._locations.get("csui/dialogs/members.picker/start.locations/current.group");
      }
      return initialLocation;
    },
    onSelectionChange: function(member) {
      var disable = this.getMemberPickerView().getNumberOfSelectItems() > 0, hasFilterName;
      if (member && member.get("id")) {
        this.options.locationID = member.get("id");
      }
      this._wizard.options.add = member && member.add;
      this._wizard.destroyBlockingView();
      var header = this.getMemberPickerHeader();
      if (this.options.saveFilter && header && header.ui.saveFilter) {
        hasFilterName = header.ui.saveFilter.val().trim() ? true : false;
        if (hasFilterName && disable) {
          this._wizard.updateButton("next", {
            disabled: false
          });
        } else {
          this._wizard.updateButton("next", {
            disabled: true
          });
        }
      } else {
        this._wizard.updateButton("next", {
          disabled: !disable
        });
        if (this.membersPickerView && this.membersPickerView.selectedMemberList.collection.models.length > 0 && member && member.get("id") && member.add && !member.get("deleted")) {
          this._wizard.updateButton("Add", {
            disabled: false
          });
        } else {
          this._wizard.updateButton("Add", {
            disabled: true
          });
        }
      }
      if (this.isCustom) {
        this._steps[1].view = this._createPermissionLevelSelectorView();
        var permissionLevelStep = this._wizard.getStepViewByStepNumber(1);
        permissionLevelStep.showView(this._steps[1].view);
        this.isCustom = false;
      }
    },
    onPermissionLevelSelection: function() {
      var view = this.getPermissionLevelView();
      if (view.selected === NodePermissionModel.PERMISSION_LEVEL_CUSTOM) {
        var customPermissionView = new PermissionAttributesView({
          permissions: [],
          readonly: false,
          showButtons: false,
          node: this.options.nodeModel
        });
        this._steps[1].view = customPermissionView;
        this._wizard.currentView.showView(this._steps[1].view);
        this.isCustom = true;
        customPermissionView.trigger("adjust:splitbar:separator");
      }
      this._wizard.updateButton("next", {
        disabled: false
      });
    },
    getMemberPickerView: function() {
      return this._steps[0].view;
    },
    getMemberPickerHeader: function() {
      return this._steps[0].headerView;
    },
    getPermissionLevelView: function() {
      return this._steps[1].view;
    },
    getPermissionsApplyView: function() {
      return this._steps[2].view;
    }
  });
  return MembersPickerWizard;
});