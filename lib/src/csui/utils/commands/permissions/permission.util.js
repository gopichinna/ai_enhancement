/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/jquery", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, _, Backbone, $, lang) {
  "use strict";
  function generateSuccessMessage(response, GlobalMessage) {
    var message;
    if (response.results.success > 0 && response.results.failure === 0) {
      message = _.str.sformat(response.results.success === 1 ? lang.AppliedPermissionsOneSuccess : lang.AppliedPermissionsOnlySuccess, response.results.success);
    } else if (response.results.success > 0 && response.results.failure > 0) {
      message = _.str.sformat(lang.AppliedPermissionsSuccessAndFailure, response.results.success, response.results.failure);
    } else if (response.results.success === 0 && response.results.failure > 0) {
      message = _.str.sformat(response.results.failure === 1 ? lang.AppliedPermissionsOneFailure : lang.AppliedPermissionsOnlyFailure, response.results.failure);
    }
    var errObject = Backbone.Model.extend({
      defaults: {
        name: "",
        state: "pending",
        commandName: "ViewPermission"
      }
    }), errObjects = [], failedFilesCollection = Backbone.Collection.extend({
      model: errObject
    }), errCollection = new failedFilesCollection();
    for (var i = 0; response.results.failure > 0 && i < response.results.data.length; i++) {
      errObjects[i] = new errObject({
        name: response.results.data[i].name,
        mime_type: "",
        state: "rejected"
      });
      errCollection.add(errObjects[i]);
    }
    var successCount = response.results.success > 0 && response.results.failure > 0 ? response.results.success : "", langTitle = _.str.sformat(lang.ApplyingManyItemsSuccessMessage, successCount), successMsg = successCount > 0 ? langTitle : " ";
    response.results.failure > 0 ? GlobalMessage.showPermissionApplyingProgress(errCollection, {
      oneFileFailure: successMsg + lang.ApplyingOneItemFailMessage,
      someFileFailure: successMsg + _.str.sformat(lang.ApplyingManyItemsFailMessage2, errObjects.length),
      multiFileFailure: successMsg + _.str.sformat(lang.ApplyingManyItemsFailMessage2, errObjects.length)
    }) : "";
    response.results.success > 0 && response.results.failure <= 0 ? GlobalMessage.showMessage("success", message ? message : lang.AppliedPermissions) : "";
  }
  function hasEditPermission(options) {
    const loginUserId = options.authUser?.get("id");
    const selectedGroup = options.headerViewoptions?.selectedGroup?.get("right_id_expand");
    const groupLeaderId = selectedGroup ? selectedGroup.leader_id : options.selectedGroup?.get("right_id_expand").leader_id;
    const isAdminUser = options.authUser?.get("privilege_user_admin_rights");
    let editPermission = false;
    if (groupLeaderId && groupLeaderId === loginUserId) {
      editPermission = true;
    }
    if (!editPermission) {
      const loggedInUserGroups = options.context?._groups;
      editPermission = !!loggedInUserGroups?.find(member => member.data.properties.id === groupLeaderId);
    }
    editPermission = (editPermission || isAdminUser) && (options.node && options.node.get("permissions_model") !== "simple");
    return editPermission;
  }
  return {
    generateSuccessMessage: generateSuccessMessage,
    hasEditPermission: hasEditPermission
  };
});