/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/columns", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "d2/utils/rest.linkrels", "d2/utils/constants", "i18n!d2/widgets/metadata/panels/permissions/impl/nls/lang" ], function(_, $, Backbone, Marionette, NodeColumnCollection, NodeResourceMixin, ClientSideBrowsableMixin, RestLinkrels, constants, lang) {
  "use strict";
  var PermissionSetTableRowModel = Backbone.Model.extend({});
  var PermissionSetTableCollection = Backbone.Collection.extend({
    model: PermissionSetTableRowModel,
    constructor: function PermissionSetTableCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      options = options || {};
      this.makeNodeResource(options).makeClientSideBrowsable(options);
      this.columns = new NodeColumnCollection();
      this.columnTypes = {};
      this.tabName = options.customCollectionOptions.tabName;
      this.fetchedResponse = options.customCollectionOptions.fetchedResponse;
      this.context = options.customCollectionOptions.context;
    },
    url: function() {
      return RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_PERMISSION_SET);
    },
    sync: function(method, collection, options) {
      var deferred = $.Deferred(), me = this;
      me.fetchColumnPreferences();
      if (method === "read") {
        me.fetchColumnPreferences();
        if (!me.fetchedResponse) {
          me.fetchPermissionSetCollection(method, collection, options).done(function(response) {
            deferred.resolve(response);
          }).fail(function() {
            deferred.reject();
          });
        } else {
          options.parse = false;
          if (me.fetchedResponse) {
            var response = me.parseResponse(me.fetchedResponse);
            options.success(response);
            deferred.resolve(response);
          } else {
            deferred.resolve();
          }
          me.fetched = true;
        }
      }
      return deferred.promise();
    },
    fetchPermissionSetCollection: function(method, collection, options) {
      var deferred = $.Deferred(), me = this, oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.success = function(response, status, xhr) {
        response = me.parseResponse(response);
        oldSuccess.call(options.context, response, status, xhr);
        deferred.resolve(response);
      };
      Backbone.sync.call(me, method, collection, options).fail(deferred.reject);
      return deferred.promise();
    },
    parseResponse: function(response) {
      if (this.tabName === "permissions") {
        return this.parseResponseForPermittedModels(response);
      } else {
        return response;
      }
    },
    parseResponseForPermittedModels: function(response) {
      var modelsArray = response && response["permitted"] || [], me = this;
      _.each(modelsArray, function(model) {
        var accessorName = model && model["accessor"] || "", basicPermission = model && model["basic-permission"] || "", extendedPermissions = model && model["extend-permissions"] || "", groupUser = model && model["r_is_group"] || false, type = constants.Types.ACCESSOR, typeName = groupUser ? constants.AccessorType.GROUP : accessorName === "dm_world" || accessorName === "dm_owner" || accessorName === "dm_group" ? constants.AccessorType.ROLE : constants.AccessorType.USER;
        model["accessorName"] = model["id"] = accessorName;
        model["basicPermission"] = basicPermission;
        model["extendedPermissions"] = extendedPermissions;
        model["type"] = type;
        model["type_name"] = typeName;
        model["basicPermissionTranslatedString"] = me._getTranslatedBasicPermission(basicPermission);
        model["extendedpPermissionsTranslatedString"] = me._getTranslatedExtendedPermissions(extendedPermissions)["translatedString"];
        model["extendedpPermissionsTranslatedArray"] = me._getTranslatedExtendedPermissions(extendedPermissions)["translatedArray"];
        model["basicPermissionFlyoutView"] = me._getFlyoutView(basicPermission);
        delete model["accessor"];
        delete model["basic-permission"];
        delete model["extend-permissions"];
      });
      return modelsArray;
    },
    fetchColumnPreferences: function() {
      if (this.tabName === "permissions" || this.tabName === "restrictions") {
        this.setCollectionColumnsForPermittedAndRestrictedModels();
      }
    },
    setCollectionColumnsForPermittedAndRestrictedModels: function() {
      var columns = [ {
        column_key: "avatar",
        definitions_order: 511,
        isNaming: true,
        type: 2,
        widthFactor: 2,
        context: this.context
      }, {
        column_key: "accessorName",
        definitions_order: 512,
        isNaming: true,
        title: lang.UserOrGroup,
        type: 2,
        widthFactor: 2
      }, {
        column_key: "basicPermissionTranslatedString",
        flyout_view: "basicPermissionFlyoutView",
        flyout_placement: "right",
        definitions_order: 513,
        title: lang.Permission,
        type: 2
      }, {
        column_key: "extendedpPermissionsTranslatedString",
        items_array: "extendedpPermissionsTranslatedArray",
        definitions_order: 514,
        title: lang.ExtendedPermissions,
        type: 2,
        widthFactor: 2
      } ];
      this.columns.reset(columns);
    },
    _getTranslatedBasicPermission: function(permissionCode) {
      if (permissionCode) {
        return lang[permissionCode] || "";
      }
      return "";
    },
    _getTranslatedExtendedPermissions: function(extendedPermissions) {
      if (extendedPermissions) {
        var extendedPermissionsArray = extendedPermissions.split(","), joinedExtendedPermissionsString = "", translatedArray = [];
        extendedPermissionsArray.forEach(function(permissionCode, index) {
          translatedArray[index] = {
            id: permissionCode,
            label: lang[permissionCode] || ""
          };
          joinedExtendedPermissionsString = index === 0 ? translatedArray[index]["label"] : _.str.sformat(lang.extendedPermissionsFormatter, joinedExtendedPermissionsString, translatedArray[index]["label"]);
        });
        return {
          translatedString: joinedExtendedPermissionsString,
          translatedArray: translatedArray
        };
      }
      return {
        translatedString: "",
        translatedArray: []
      };
    },
    _getPermissionsIncludedArray: function(permissionCode) {
      var permissionCodesIndexMap = new Map([ [ "None", 0 ], [ "Browse", 1 ], [ "Read", 2 ], [ "Relate", 3 ], [ "Version", 4 ], [ "Write", 5 ], [ "Delete", 6 ] ]), permissionCodesArray = [ "None", "Browse", "Read", "Relate", "Version", "Write", "Delete" ];
      return permissionCodesArray.splice(0, permissionCodesIndexMap.get(permissionCode) + 1);
    },
    _getFlyoutContent: function(permissionCode) {
      var includedPermissionCodesArray = this._getPermissionsIncludedArray(permissionCode);
      if (includedPermissionCodesArray && includedPermissionCodesArray.length > 1) {
        var translatedPermissionsString = "";
        includedPermissionCodesArray.forEach(function(permission, index) {
          if (lang[permission]) {
            if (index !== 0) {
              translatedPermissionsString = translatedPermissionsString + '<span class="d2-permissions-flyout-body">' + lang[permission] + "</span>";
              if (index !== includedPermissionCodesArray.length - 1) {
                translatedPermissionsString = translatedPermissionsString + "<br>";
              }
            }
          }
        });
        if (translatedPermissionsString) {
          return '<span class="d2-permissions-flyout-header">' + lang.flyoutTextHeader + "</span><br>" + translatedPermissionsString;
        }
      }
      return "";
    },
    _getFlyoutView: function(permissionCode) {
      var flyoutContent = this._getFlyoutContent(permissionCode), flyoutViewTemplate = "<div><%= content %></div>";
      if (flyoutContent) {
        var flyoutView = Marionette.ItemView.extend({
          template: function() {
            return _.template(flyoutViewTemplate)({
              content: flyoutContent
            });
          }
        });
        return new flyoutView().render().$el;
      }
      return;
    },
    resetCollection: function(response) {
      this.fetchedResponse = response;
      var me = this, modelsArray = me.parseResponse(response);
      me.reset(modelsArray);
    }
  });
  ClientSideBrowsableMixin.mixin(PermissionSetTableCollection.prototype);
  NodeResourceMixin.mixin(PermissionSetTableCollection.prototype);
  return PermissionSetTableCollection;
});