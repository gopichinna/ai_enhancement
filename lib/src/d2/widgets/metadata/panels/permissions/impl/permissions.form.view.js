/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "i18n!d2/widgets/metadata/panels/permissions/impl/nls/lang" ], function(_, D2FormModel, D2FormView, FormConverter, lang) {
  "use strict";
  var PermissionsFormView = D2FormView.extend({
    constructor: function PermissionsFormView(permissionsModel, options) {
      var formModelSchema = this._getMyPermissionsFormSchema(permissionsModel), formModel = new D2FormModel(formModelSchema);
      options.model = formModel;
      options.mode = "read";
      options.topAlignedLabel = true;
      options.templateWrapperClassName = "d2-metadata-my-permissions-form";
      D2FormView.prototype.constructor.call(this, options);
    },
    _getMyPermissionsFormSchema: function(permissionsModel) {
      var form = {
        id: "my-permissions-form",
        title: "My Permissions Form",
        actionMode: "read",
        layoutMode: "doubleCol",
        data: {
          basicPermission: this._getTranslatedBasicPermission(permissionsModel.get("basicPermission")),
          extendedPermissions: this._getTranslatedExtendedPermissions(permissionsModel.get("extendedPermissions"))["translatedString"]
        },
        schema: {
          id: "my-permissions-form",
          initial_invalid: false,
          properties: {
            basicPermission: {
              title: lang.MyPermission,
              type: "string",
              readonly: true,
              maxLength: 32
            },
            extendedPermissions: {
              title: lang.MyExtendedPermissions,
              type: "string",
              readonly: true,
              maxLength: 255
            }
          }
        },
        options: {
          fields: {
            basicPermission: {
              label: lang.MyPermission,
              _type: "string",
              readonly: true,
              type: "d2label"
            },
            extendedPermissions: {
              label: lang.MyExtendedPermissions,
              _type: "string",
              readonly: true,
              type: "d2label"
            }
          }
        },
        expressions: {}
      };
      FormConverter.generateFormModelConfig([ form ]);
      return form;
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
    }
  });
  return PermissionsFormView;
});