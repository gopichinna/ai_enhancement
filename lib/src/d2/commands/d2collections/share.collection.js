/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "d2/commands/d2collections/add.to.d2collections", "csui/utils/contexts/factories/connector", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/utils/constants", "csui/models/fileuploads", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "csui/controls/form/pub.sub", "d2/controls/form/impl/nls/root/lang" ], function(_require, _, $, AddToD2CollectionsCommand, ConnectorFactory, GlobalMessage, utils, RestLinkrels, RestResources, Url, constants, UploadFileCollection, CommandHelper, localLang, PubSub, lang) {
  "use strict";
  return AddToD2CollectionsCommand.extend({
    sharedUserIds: [],
    defaults: {
      signature: "D2-share-collection",
      command_key: "D2-share-collection",
      name: localLang.ShareCollectionToUsersorGroups,
      scope: "single"
    },
    enabled: function(status) {
      let model = CommandHelper.getJustOneNode(status);
      if (model && model.get("isSharedCollection") === false) {
        return true;
      }
      return false;
    },
    _getTitle: function(_from, _model) {
      return _model.get("is_shared") ? localLang.ManageShareCollectionModelTitle : localLang.ShareCollectionModelTitle;
    },
    _fetchDialogMetaData(_collectionModel) {
      var dfd = $.Deferred();
      let shareDetailsUrl = _collectionModel.get("links").find(link => link.rel === RestLinkrels.D2_COLLECTION_SHARED_INFO).href;
      let connector = _collectionModel.connector;
      var batchPayload = [ {
        id: "sharedDetails",
        request: {
          method: "GET",
          uri: shareDetailsUrl
        }
      }, {
        id: "user-details",
        request: {
          method: "GET",
          uri: RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.ELIGIBLE_RECIPIENT_TO_SHARE)
        }
      } ];
      utils.makeBatchAjaxCall({
        connector: connector,
        operations: batchPayload,
        continueOnError: true
      }).done(function(result) {
        dfd.resolve(result);
      }).fail(function(error) {
        dfd.reject(error);
      });
      return dfd.promise();
    },
    _getFormContent: function(_from, _dialogMetaData) {
      var options = [], userDetails = [], eligibleUsers = _dialogMetaData.find(data => data.id === "user-details")["output"]["users_and_groups"], sharedUsers = _dialogMetaData.find(data => data.id === "sharedDetails")["output"]["users_and_groups"];
      this.sharedUserIds = sharedUsers ? sharedUsers.map(user => user.recipient_id) : [];
      let currentUserId = RestResources.getCurrentUser().get("properties").r_object_id;
      for (let i = 0; i < eligibleUsers.length; i++) {
        if (eligibleUsers[i].recipient_id === currentUserId) continue;
        options.push({
          p: i,
          l: eligibleUsers[i].recipient_name + (eligibleUsers[i].recipient_email_address === "" || eligibleUsers[i].recipient_email_address === undefined ? "" : "-" + eligibleUsers[i].recipient_email_address),
          s: this.sharedUserIds.find(userId => userId === eligibleUsers[i].recipient_id) !== undefined,
          v: eligibleUsers[i].recipient_id
        });
        userDetails.push({
          id: eligibleUsers[i].recipient_name,
          properties: {
            r_is_group: eligibleUsers[i].recipient_type === "group",
            r_object_id: eligibleUsers[i].recipient_id,
            user_address: eligibleUsers[i].recipient_email_address,
            user_name: eligibleUsers[i].recipient_name
          }
        });
      }
      var collectionForm = {
        dialog: {
          content: {
            order: 1,
            boolean: {
              id: "unshare",
              label: localLang.UnshareCollectionLabel,
              order: 1,
              property_type: "boolean",
              repeating: false,
              tip: localLang.UnshareCollectionLabel
            },
            list: {
              id: "users_groups",
              label: localLang.ShareCollectionToUsersorGroups,
              assistance_type: "custom",
              asynchronous: false,
              condition_visible: "getValue(unshare).equals(false)",
              order: 2,
              autoselect_single: true,
              o: options
            }
          }
        },
        "user-details": userDetails
      };
      return collectionForm;
    },
    _getButtonsList: function(_from, _model) {
      return {
        showYes: true,
        labelYes: _model.get("is_shared") ? localLang.UpdateShareCollectionModelButtonLabel : lang.shareCollectionModelButtonLabel,
        showNo: false,
        showCancel: true
      };
    },
    _getModalClassName() {
      return "d2-share-collection-model";
    },
    _getSelectedValue(modalView, _from) {
      return modalView.getValues()["users_groups"];
    },
    _validateForm(_modalView, _from, _model) {
      let selectedValue = this._getSelectedValue(_modalView, _from);
      let unshareToggle = _modalView.getValues()["unshare"];
      if (_model.get("is_shared")) {
        return unshareToggle ? true : this.isSharedUsersModified(this.sharedUserIds, selectedValue);
      } else {
        return unshareToggle ? false : this.isSharedUsersModified(this.sharedUserIds, selectedValue);
      }
    },
    isSharedUsersModified(existingSharedUsers, selectedUsers) {
      if (existingSharedUsers.length !== selectedUsers.length) {
        return true;
      }
      existingSharedUsers.sort();
      selectedUsers.sort();
      for (let i = 0; i < existingSharedUsers.length; i++) {
        if (existingSharedUsers[i] !== selectedUsers[i]) {
          return true;
        }
      }
      return false;
    },
    _setSelectedFormData(modalView, options, selectedValues) {
      options["data"] = {
        UserOrGroup: selectedValues,
        selectedUserOrGroupObj: modalView.userData.filter(userGroup => selectedValues.includes(userGroup.properties.r_object_id)),
        shouldUnshare: modalView.getValues()["unshare"]
      };
    },
    handleResult: function(collection, _result, _command, options, _self) {
      let deferred = $.Deferred();
      let connector = collection.context.getObject(ConnectorFactory);
      let selectedModel = collection.toolItem ? collection.toolItem.status.nodes.models[0] : collection.originatingView.selectedModel;
      let collection_id = selectedModel.get("r_object_id");
      let url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/" + collection_id + "/share");
      let payload = {
        users_and_groups: []
      };
      if (!options.data.shouldUnshare) {
        _.forEach(options.data.selectedUserOrGroupObj, function(userRGroup) {
          payload.users_and_groups.push({
            recipient_id: userRGroup.properties.r_object_id,
            recipient_name: userRGroup.properties.user_name,
            recipient_role: "reader",
            recipient_type: userRGroup.properties.r_is_group ? "group" : "user"
          });
        });
      }
      $.ajax(connector.extendAjaxOptions({
        url: url,
        type: "PUT",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(response) {
          if (response.warnings) {
            _self.showErrorMessage(response.warnings, connector);
          } else if (response.status === 401) {
            GlobalMessage.showMessage("error", response.message);
          } else {
            let msg = selectedModel.get("is_shared") ? localLang.collectionUpdatedSuccessMsg : localLang.shareCollectionSuccessMsg;
            GlobalMessage.showMessage("success", _.str.sformat(msg, selectedModel.get("name")));
            if (payload.users_and_groups.length === 0) {
              selectedModel.set("is_shared", false);
              selectedModel.set("isSharedCollection", false);
            } else {
              selectedModel.set("is_shared", true);
              selectedModel.set("isSharedCollection", true);
            }
            PubSub.trigger("d2:updateToolbar", selectedModel);
          }
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(collection.originatingView.collection, message, utils.parseAjaxErrorAsString(xhr, statusText, message));
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    showErrorMessage: function(warnings, connector) {
      let title = _.str.sformat(localLang.shareCollectionsWarningMsg, warnings.length);
      var queueItems = warnings.map(function(warning) {
        return {
          name: warning.properties.reciepient_name,
          state: "rejected",
          errorMessage: warning["rest-error"].message,
          count: 1,
          total: 1
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: connector
      });
      GlobalMessage.showProgressPanel(nodeCollection, {
        multiFileFailure: title,
        actionType: "SHARE"
      });
    }
  });
});