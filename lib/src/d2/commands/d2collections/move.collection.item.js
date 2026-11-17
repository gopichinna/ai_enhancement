/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "d2/commands/d2collections/add.to.d2collections", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "nuc/utils/url", "d2/utils/constants", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/controls/form/impl/nls/root/lang" ], function(require, _, $, AddToD2CollectionsCommand, GlobalMessage, utils, RestLinkrels, RestResources, Url, constants, CommandHelper, localLang, lang) {
  "use strict";
  return AddToD2CollectionsCommand.extend({
    defaults: {
      signature: "D2-MoveCollectionItem",
      command_key: "D2-MoveCollectionItem",
      name: localLang.CommandNameMoveCollectionItem,
      scope: "multiple"
    },
    enabled: function(_status, _options) {
      const sharedCollectionWidgetCollection = require("d2/models/d2collections/d2.sharedcollections.collection");
      if (_status.container?.collection instanceof sharedCollectionWidgetCollection || _status.originatingView?.selectedModel.collection instanceof sharedCollectionWidgetCollection) return false;
      return AddToD2CollectionsCommand.prototype.enabled.apply(this, arguments);
    },
    _getTitle: function(_from, _model) {
      return localLang.MovetoCollectionModelTitle;
    },
    _getFormContent: function(_from) {
      var collectionForm = {
        dialog: {
          content: {
            order: 1,
            combo: {
              id: "add_to_collections_list",
              label: localLang.AddToCollectionFormLabelCollection,
              assistance_type: "custom",
              asynchronous: true,
              condition_required: true,
              order: 1,
              autoselect_single: true
            }
          }
        }
      };
      return collectionForm;
    },
    _getButtonsList: function(_from, _model) {
      return {
        showYes: true,
        labelYes: lang.moveCollectionItemFormLabel,
        showNo: false,
        showCancel: true
      };
    },
    handleResult: function(collection, _result, _command, options, _self) {
      var me = this;
      let items = collection.nodes.models.map(node => node.attributes.id);
      var source_collection_id = collection.originatingView.selectedModel.get("id");
      var target_colleciton_id = options.data.collectionName;
      var deferred = $.Deferred();
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
      url = Url.combine(url, "collections/" + target_colleciton_id + "/items");
      var payload = {
        items_object_id: items,
        move_from_collection: source_collection_id
      };
      const docName = collection.nodes?.models[0]?.attributes?.name;
      $.ajax(collection.collection.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        dataType: "json",
        data: JSON.stringify(payload),
        success: function(response) {
          collection.originatingView.allSelectedNodes().reset();
          _.forEach(items, function(modelId) {
            if (response.warnings) {
              if (!response.warnings.find(warning => warning.r_object_id === modelId)) collection.originatingView.collection.remove(collection.originatingView.collection.where({
                id: modelId
              }));
            } else {
              collection.originatingView.collection.remove(collection.originatingView.collection.where({
                id: modelId
              }));
            }
          });
          if (response.warnings) {
            let warnings = response.warnings.map(warning => {
              return {
                collectionItemModel: collection.originatingView.collection.where({
                  id: warning.r_object_id
                })[0],
                warnMessage: warning["rest-error"].message
              };
            });
            let title = response.warnings.length == 1 ? _.str.sformat(localLang.oneFilemoveToCollWarningMsg, warnings[0].collectionItemModel.get("name")) : response.warnings.length + localLang.moveToCollWarningMsg;
            me._showErrorMessage(warnings, title, collection.collection.connector);
          } else if (options.data?.selectedCollection?.object_name) {
            if (items.length == 1) {
              GlobalMessage.showMessage("success", _.str.sformat(localLang.D2CollectionMoveItemSuccessMessage, docName, options.data.selectedCollection.object_name));
            } else {
              GlobalMessage.showMessage("success", _.str.sformat(localLang.D2CollectionMoveItemsSuccessMessage, items.length, options.data.selectedCollection.object_name));
            }
          }
        },
        error: function(xhr, message, statusText) {
          CommandHelper.showErrorPanel(collection.originatingView.collection, message, utils.parseAjaxErrorAsString(xhr, statusText, message));
          deferred.reject();
        }
      }));
      return deferred.promise();
    }
  });
});