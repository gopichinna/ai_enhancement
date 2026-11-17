/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!csui/widgets/permissions/impl/edit/apply.permission/impl/apply.permission", "hbs!csui/widgets/permissions/impl/edit/apply.permission/impl/include.subitems", "i18n!csui/widgets/permissions/impl/edit/apply.permission/impl/nls/lang", "csui/utils/taskqueue", "csui/utils/permissions/permissions.precheck", "csui/models/permission/permission.precheck", "csui/controls/progressblocker/blocker", "csui/utils/permissions/permissions.subtypesForFolders", "csui/lib/handlebars.helpers.xif", "css!csui/widgets/permissions/impl/permissions" ], function(module, _, $, Backbone, Marionette, TabableRegion, applyPermissionTemplate, includeSubitemsTemplate, lang, TaskQueue, PermissionPrecheck, PermissionPrecheckModel, BlockingView, permissionsSubtypesForFolders) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    parallelism: 5
  });
  var ApplyPermissionView = Marionette.ItemView.extend({
    className: "csui-apply-permission",
    template: applyPermissionTemplate,
    includeSubitemsTemplate: includeSubitemsTemplate,
    templateHelpers: function() {
      let permissionMessage;
      const itemName = this.options.model?.get("name");
      if (!!this.options.applyTo?.thresholdExceeded) {
        if (!!this.options.removePermission) {
          permissionMessage = _.str.sformat(lang.removeThresholdExceeded, itemName);
        } else {
          permissionMessage = _.str.sformat(lang.applyToThresholdExceeded, itemName);
        }
      } else {
        if (!!this.options.removePermission) {
          permissionMessage = _.str.sformat(lang.removeToItem, itemName);
        } else {
          permissionMessage = _.str.sformat(lang.applyToItem, itemName);
        }
      }
      if (!!this.options.restorePublicAccess) {
        permissionMessage = _.str.sformat(lang.RestorePermissions, itemName);
      }
      return {
        permissionMessage: permissionMessage
      };
    },
    ui: {
      applyPermissionMsg: ".csui-apply-permission-message",
      appplyToSubFolderContainer: ".csui-apply-permission-sub-folder",
      appplyToSubFolder: ".csui-apply-permission-sub-folder-label",
      applyToSubItemsContainer: "csui-apply-permission-subitems-container",
      applyToSubItemsTitle: ".csui-apply-subitems-message",
      subItemsCheckBox: ".csui-subtypes-option"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function ApplyPermissionView(options) {
      var self = this;
      self._ = _;
      self.userSelectionCount = 0;
      options || (options = {});
      options.removePermission = options.removePermission || false;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      BlockingView.imbue(this);
    },
    initialize: function() {
      this.focusIndex = 0;
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, focusables = this.$el.find("*[tabindex]");
      if (focusables.length) {
        if (event.keyCode === 13) {
          $(focusables[this.focusIndex]).parent().trigger("click");
          event.stopPropagation();
          event.preventDefault();
        } else if (keyCode === 38 || keyCode === 40) {
          if (keyCode === 38) {
            this.focusIndex > 0 && --this.focusIndex;
          } else {
            this.focusIndex < focusables.length - 1 && ++this.focusIndex;
          }
          $(focusables[this.focusIndex]).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        }
      }
    },
    currentlyFocusedElement: function() {
      var focusables = this.$el.find("*[tabindex]");
      if (focusables.length) {
        return $(focusables[this.focusIndex]);
      }
    },
    onRender: function() {
      var self = this;
      if (this.options.model && this.options.model.get("container")) {
        if (this.options.applyTo || this.options.model.get("applyTo")) {
          this.options.applyTo = this.options.applyTo ? this.options.applyTo : this.options.model.get("applyTo");
          this.loadSubFolderDeatils(this);
          this.loadSpecialItems(this.options.applyTo.subTypes, this.options.applyTo.thresholdExceeded);
        } else {
          this.options.applyTo = {};
          this.blockActions && this.blockActions();
          PermissionPrecheck.fetchPermissionsPreCheck(this.options).done(function() {
            self.model.set({
              applyTo: self.options.applyTo
            }, {
              silent: true
            });
            self.unblockActions && self.unblockActions();
            self.loadSubFolderDeatils(self);
            self.loadSpecialItems(self.options.applyTo.subTypes, self.options.applyTo.thresholdExceeded);
          });
        }
      }
    },
    onDomRefresh: function() {
      const otcToggler = this.el?.querySelector("otc-toggle");
      const boundChangeSwitchField = this._onToggle.bind(this);
      otcToggler?.removeEventListener("change", boundChangeSwitchField);
      otcToggler?.addEventListener("change", boundChangeSwitchField);
    },
    loadSubFolderDeatils: function(self) {
      let isSubFolderExists = -1;
      if (self.options.applyTo?.subTypes.some(type => permissionsSubtypesForFolders.includes(type))) {
        isSubFolderExists = 1;
      }
      if (isSubFolderExists >= 0) {
        self.ui.appplyToSubFolderContainer.removeClass("binf-hidden");
        self.$(self.ui.appplyToSubFolder).html(lang.applytoSubFolder);
        self.requiredFieldSwitchModel = new Backbone.Model({
          data: false
        });
        var appplyToSubFolderId = _.uniqueId("appplyToSubFolder");
        self.ui.appplyToSubFolder.attr("id", appplyToSubFolderId);
      } else {
        self.ui && self.ui.applyToSubItemsContainer && self.ui.appplyToSubFolderContainer.addClass("binf-hidden");
      }
    },
    _onToggle: function(event) {
      var self = this;
      const otctoggle = this.el.querySelector("otc-toggle");
      self.subFolderSelected = otctoggle.hasAttribute("checked");
      if (otctoggle.hasAttribute("checked")) {
        if (!!self.options.subTypes) {
          self.loadSpecialItems(self.options.subTypes, self.options.thresholdExceeded);
        } else {
          self.fetchSubFoldersSubItems(self.options).then(function(promises) {
            self.loadSpecialItems(self.options.subTypes, self.options.thresholdExceeded);
          });
        }
      } else if (self.options.applyTo) {
        self.loadSpecialItems(self.options.applyTo.subTypes, self.options.applyTo.thresholdExceeded);
      }
    },
    loadSpecialItems: function(subTypes, thresholdExceeded) {
      var self = this, subtypes = subTypes, threshold_exceeded = thresholdExceeded, isSubFolderExists = self.options.applyTo && self.options.applyTo.subTypes.indexOf(0), folderName = self.model.get("name"), memberName = this.options.permissionModel && this.options.permissionModel.get("right_id_expand") && this.options.permissionModel.get("right_id_expand").name_formatted, subTypesStr = "";
      memberName = this.options.permissionModel && this.options.permissionModel.get("type") === "public" ? lang.publicAccess : memberName;
      if (subtypes.indexOf(204) >= 0) {
        subTypesStr = subTypesStr === "" ? subTypesStr + lang[204] : subTypesStr + ", " + lang[204];
      }
      if (subtypes.indexOf(207) >= 0) {
        subTypesStr = subTypesStr === "" ? subTypesStr + lang[207] : subTypesStr + ", " + lang[207];
      }
      if (subtypes.indexOf(215) >= 0) {
        subTypesStr = subTypesStr === "" ? subTypesStr + lang[215] : subTypesStr + ", " + lang[215];
      }
      if (subtypes.indexOf(298) >= 0) {
        subTypesStr = subTypesStr === "" ? subTypesStr + lang[298] : subTypesStr + ", " + lang[298];
      }
      if (subtypes.indexOf(3030202) >= 0) {
        subTypesStr = subTypesStr === "" ? subTypesStr + lang[3030202] : subTypesStr + ", " + lang[3030202];
      }
      if (subTypesStr !== "") {
        self.ui.applyToSubItemsContainer.removeClass("binf-hidden");
        self.ui.applyToSubItemsTitle.html(_.str.sformat(lang.includeSubItems, subTypesStr));
      } else {
        !!self.ui.applyToSubItemsTitle.html && self.ui.applyToSubItemsTitle.html("");
        !!self.ui.applyToSubItemsContainer.addClass && self.ui.applyToSubItemsContainer.addClass("binf-hidden");
      }
    },
    fetchSubFoldersSubItems: function(options) {
      this.options = options;
      this.options.subTypes = [];
      var self = this, subTypes = PermissionPrecheck.includeSubTypes(), queue = new TaskQueue({
        parallelism: config.parallelism
      }), nodeID = self.model.get("id"), promises = _.map(subTypes, function(subType) {
        var deferred = $.Deferred();
        queue.pending.add({
          worker: function() {
            var permissionPrecheckModel = new PermissionPrecheckModel({
              id: nodeID,
              subType: subType,
              include_sub_items: true
            }, {
              connector: self.model.connector
            });
            permissionPrecheckModel.fetch().then(_.bind(function(response) {
              if (response.results.data.subtypes_info !== undefined) {
                self.options.subTypes.push(response.results.data.subtypes_info[0].id);
              }
              self.options.thresholdExceeded = response.results.data.threshold_exceeded;
              deferred.resolve(response);
            })).fail(function(response) {
              deferred.reject(response);
            });
            return deferred.promise();
          }
        });
        return deferred.promise(promises);
      });
      return $.whenAll.apply($, promises);
    },
    getApplyToFlag: function() {
      return this.subFolderSelected;
    }
  });
  return ApplyPermissionView;
});