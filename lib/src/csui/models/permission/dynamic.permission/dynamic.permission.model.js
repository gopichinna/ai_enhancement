/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/uploadable/uploadable.mixin", "csui/models/permission/dynamic.permission/dynamic.permission.mixin" ], function(Backbone, ConnectableMixin, UploadableMixin, ServerAdaptorMixin) {
  "use strict";
  const PERMISSIONS = {
    READ: {
      level: 1,
      permissions: [ "see", "see_contents" ]
    },
    WRITE: {
      level: 2,
      permissions: [ "add_items", "delete", "delete_versions", "edit_attributes", "modify", "reserve", "see", "see_contents" ]
    },
    FULL_CONTROL: {
      level: 3,
      permissions: [ "add_items", "delete", "delete_versions", "edit_attributes", "edit_permissions", "modify", "reserve", "add_major_version", "see", "see_contents" ]
    }
  };
  let DynamicPermissionModel = Backbone.Model.extend({
    constructor: function DynamicPermissionModel(attributes = {}, options = {}) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = {};
      this.options.connector = options.connector;
      this.PERMISSION_LEVEL_READ = this._getPermissionLevel("READ");
      this.PERMISSION_LEVEL_WRITE = this._getPermissionLevel("WRITE");
      this.PERMISSION_LEVEL_FULL_CONTROL = this._getPermissionLevel("FULL_CONTROL");
      this.makeConnectable(options).makeUploadable(options);
    },
    getPermissionLevel: function(permissions) {
      let value;
      permissions = this.get("permissions") || this.get("dynamicpermissions");
      if (permissions.includes("edit_permissions")) {
        value = this.PERMISSION_LEVEL_FULL_CONTROL;
      } else if (permissions.includes("delete")) {
        value = this.PERMISSION_LEVEL_WRITE;
      } else if (permissions.includes("see_contents") && permissions.length === 2) {
        value = this.PERMISSION_LEVEL_READ;
      }
      return value;
    },
    getPermissionsByLevel: function(level) {
      for (const key in PERMISSIONS) {
        if (PERMISSIONS[key].level === level) {
          return PERMISSIONS[key].permissions;
        }
      }
    },
    _getPermissionLevel: function(permissionType) {
      return PERMISSIONS[permissionType].level;
    }
  });
  ConnectableMixin.mixin(DynamicPermissionModel.prototype);
  UploadableMixin.mixin(DynamicPermissionModel.prototype);
  ServerAdaptorMixin.mixin(DynamicPermissionModel.prototype);
  return DynamicPermissionModel;
});