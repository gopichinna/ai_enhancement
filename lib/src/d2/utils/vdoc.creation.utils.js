/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "d2/models/creation.profile", "d2/utils/constants", "d2/utils/rest.linkrels", "csui/utils/commandhelper", "dctmw/utils/utils", "d2/utils/creation.utils", "d2/models/creation.profiles", "d2/models/creation.profile.value.configs", "d2/utils/vdoc.utils", "d2/dialogs/reserve/confirm.dialog", "i18n!d2/commands/nls/localized.strings", "nuc/models/nodes", "d2/commands/reserve" ], function($, _, Backbone, Url, CreationProfileModel, constants, RestLinkrels, CommandHelper, utils, CreationUtils, ProfileCollection, ValueConfigCollection, vdUtils, ConfirmDialog, lang, NodeCollection, CommandReserve) {
  "use strict";
  var cmdReserve = new CommandReserve();
  return {
    fetchFolderConfiguration: function(status, options) {
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status), mode = "create", connector = status.context.getObject("connector"), sourceContentNode = CreationUtils.getSourceContentNode(status), landingPageInheritedNode = CreationUtils.getLandingPageInheritedNode(status, connector);
      var profileCollection = new ProfileCollection(undefined, {
        connector: connector,
        mode: mode,
        inheritableSourceNode: sourceContentNode || landingPageInheritedNode
      }), configCollection = new ValueConfigCollection(undefined, {
        connector: connector,
        mode: mode
      });
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.FOLDER_STRUCTURE_CONVERSION_CONFIG);
      if (!url) {
        deferred.reject(new Error(lang.FetchFolderStructureLinkRelMissing));
      } else {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "GET",
          headers: {
            Accept: constants.MediaTypes.DCTM_JSON,
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            var profileConfig = new CreationProfileModel(_.extend(status, response), options);
            profileCollection.reset();
            profileConfig.ensureFetched().then(function() {
              profileCollection.add(profileConfig);
              configCollection.profile = profileCollection.at(0);
              configCollection.fetch().then(function() {
                deferred.resolve({
                  profile: profileCollection,
                  valueConfig: configCollection
                });
              }, function(error) {
                deferred.reject(error);
              });
            }, function(error) {
              deferred.reject(error);
            });
          },
          error: function(xhr) {
            deferred.reject(xhr);
          }
        }));
      }
      return deferred.promise();
    },
    convertToVDoc: function(newObjectNode, signature, folderNode) {
      var deferred = $.Deferred();
      var urlString = folderNode ? RestLinkrels.getLink(newObjectNode.get("links"), RestLinkrels.CONVERT_TO_VIRTUAL_DOCUMENT) : CommandHelper.getOriginalActionLink(newObjectNode, signature, RestLinkrels.CONVERT_TO_VIRTUAL_DOCUMENT);
      newObjectNode.set("rIsVirtualDoc", true);
      if (!urlString) {
        deferred.reject(new Error(lang.ConvertToVirtualDocumentLinkRelMissing));
      } else {
        var data = {};
        if (folderNode) {
          data["inherited-folder-structure-id"] = folderNode.get("id");
        }
        var urlStringParam = Url.combineQueryString(data);
        urlString = !folderNode ? urlString : Url.appendQuery(urlString, urlStringParam);
        $.ajax(newObjectNode.connector.extendAjaxOptions({
          url: urlString,
          type: "POST",
          headers: {
            Accept: constants.MediaTypes.DCTM_JSON,
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            deferred.resolve(response);
          },
          error: function(xhr) {
            deferred.reject(xhr);
          }
        }));
      }
      return deferred.promise();
    },
    performLockPrecheck: function(nodes) {
      var dfd = $.Deferred(), notCheckedOutNodes = _.filter(nodes instanceof Backbone.Collection ? nodes.models : nodes, function(node) {
        return !node.get("reserved_user_id");
      }), status = {
        nodes: new NodeCollection(notCheckedOutNodes)
      }, options = {
        suppressConfirmationDialog: true
      };
      if (notCheckedOutNodes.length) {
        cmdReserve._doCheckoutPrecheck(status, options).done(function(nodesStatus) {
          var atLeastOneError = false, atLeastOneWarning = false, args = _.map(nodesStatus, function(nodeStatus) {
            if (nodeStatus.status === "WARNING") {
              atLeastOneWarning = true;
              return nodeStatus;
            } else if (nodeStatus.status !== "OK") {
              atLeastOneError = true;
              var errMessage = nodeStatus.message ? nodeStatus.message : lang.VDocOperationsLockPrecheckFail;
              _.extend(nodeStatus, {
                responseJSON: {
                  details: errMessage,
                  message: errMessage
                }
              });
              return nodeStatus;
            } else {
              return nodeStatus;
            }
          });
          if (atLeastOneError) {
            dfd.reject.apply(dfd, args);
          } else if (atLeastOneWarning) {
            var dialog = new ConfirmDialog({
              checkoutItems: nodesStatus
            });
            dialog.confirm().done(function(selectedItems) {
              status.nodes.reset(nodes.filter(function(node) {
                return _.any(selectedItems, function(item) {
                  return item.id === node.get("id");
                });
              }));
              dfd.resolve.apply(dfd, args);
            }).fail(function() {
              dfd.reject.apply(dfd, [ lang.VDocOperationsLockPrecheckFail ]);
            });
          } else {
            dfd.resolve.apply(dfd, args);
          }
        }).fail(dfd.reject);
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    addChildToVd: function(parent, childNodes, signature) {
      return this.performLockPrecheck([ parent ]).then(function() {
        var virtualDocNodes = [];
        childNodes.map(function(item) {
          virtualDocNodes.push({
            "chronicle-id": item.get("i_chronicle_id")
          });
        });
        var payload = {
          "virtual-document-nodes": virtualDocNodes
        }, urlString;
        urlString = CommandHelper.getOriginalActionLink(parent, signature, RestLinkrels.ADD_VIRTUAL_DOCUMENT_NODES);
        var qParams = {
          inline: true,
          "suppress-checkout-warning": true
        }, widgetPreference = parent.get("widgetPreference");
        if (widgetPreference) {
          qParams["widget-name"] = widgetPreference.widgetName;
        }
        urlString = Url.appendQuery(urlString, Url.combineQueryString(qParams));
        var options = parent.connector.extendAjaxOptions({
          url: urlString,
          type: "POST",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          data: JSON.stringify(payload)
        });
        return $.ajax(options);
      });
    },
    replaceVdChild: function(status, childNode, signature, errorCallBack) {
      return this.performLockPrecheck([ status.parent ]).then(function() {
        var deferred = $.Deferred(), urlString, options, payload, parentVdm, qParams = {
          inline: true
        }, parent = status.parent, oldNode = status.nodes.models[0], widgetPreference = parent.get("widgetPreference");
        parentVdm = vdUtils.getParentVDMNumber(oldNode);
        if (widgetPreference) {
          qParams["widget-name"] = widgetPreference.widgetName;
        }
        payload = {
          "chronicle-id": childNode.get("i_chronicle_id")
        };
        urlString = CommandHelper.getOriginalActionLink(CommandHelper.getJustOneNode(status), signature, RestLinkrels.REPLACE_VIRTUAL_DOCUMENT_NODES);
        if (!urlString) {
          return $.Deferred().reject(lang.ReplaceChildLinkRelErrorMessage);
        }
        urlString = Url.appendQuery(urlString, Url.combineQueryString(qParams));
        options = parent.connector.extendAjaxOptions({
          url: urlString,
          type: "PATCH",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          data: JSON.stringify(payload),
          success: function(response) {
            status.collection.refresh({
              vdmNumber: parentVdm
            }).done(function() {
              status.originatingView.trigger("activate:fallback:vdm", vdUtils.getVDMNumber(CommandHelper.getJustOneNode(status)));
              deferred.resolve(response);
            }).fail(function(err) {
              deferred.reject(err);
            });
          },
          error: function(request) {
            deferred.reject(request);
          }
        });
        $.ajax(options);
        return deferred;
      }).fail(function() {
        errorCallBack();
      });
    }
  };
});