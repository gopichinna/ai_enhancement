/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/node/node.model", "d2/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/connector", "csui/utils/commands/node", "csui/utils/commandhelper", "nuc/utils/url", "d2/commands/vdoc/vdoc.mixin", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/vdoc.creation.utils", "d2/utils/vdoc.utils", "d2/utils/constants", "d2/utils/content.assist", "i18n!d2/commands/nls/localized.strings", "i18n!d2/controls/form/impl/nls/lang" ], function(require, $, _, Backbone, NodeModel, GlobalMessage, ConnectionFactory, NodeCommand, CommandHelper, Url, VDocCommandMixin, NodeCreationSuccessMessageView, RestResources, RestLinkrels, VdocCreationUtils, vdUtils, constants, ContentAssist, lang, ctrLang) {
  "use strict";
  var VDocAddChildrenBrowse = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocAddChildrenBrowse",
      command_key: "D2-VDocAddChildrenBrowse",
      name: lang.CommandVDocAddChildrenBrowse,
      scope: "single"
    },
    getContentAssistOptions: function(me, status, container, options, deferred) {
      ContentAssist.getContentAssistOptions(status).done(function(config) {
        var title = config ? config.label_value : "";
        var includeBrowse = config && config.properties ? config.properties.has_browse_assist : true;
        var includeFavorites = config && config.properties ? config.properties.has_favorites_assist : false;
        var globalSearch = config && config.properties ? config.properties.has_search_assist : false;
        if (!includeBrowse && !includeFavorites && !globalSearch) {
          includeBrowse = true;
        }
        me.displayContentAssist(title, includeBrowse, includeFavorites, globalSearch, status, container, options, deferred);
      }).fail(function(error) {
        me.showErrorMessage(error[0].responseText, CommandHelper.getJustOneNode(status));
        deferred.reject(error);
      });
    },
    displayContentAssist: function(title, includeBrowse, includeFavorites, globalSearch, status, container, options, deferred) {
      require([ "d2/dialogs/target.browse/target.browse" ], function(NodePicker) {
        var response = {}, parentNode = status.nodes.models[0], pickerOptions = {
          dialogTitle: title,
          connector: container.connector,
          container: container,
          initialContainer: container,
          context: status.context,
          selectMultiple: true,
          includeBrowse: includeBrowse,
          globalSearch: globalSearch,
          includeFavorites: includeFavorites,
          selectType: "typeName",
          selectTypeValue: [ constants.Types.DOCUMENT, constants.Types.EMAIL ]
        };
        pickerOptions.storeContainer = true;
        pickerOptions.restoreContainer = true;
        pickerOptions.dataId = constants.StorageKey.ADD_CHILDREN_BROWSE_COMMAND + constants.StorageKey.ANCESTOR_INFO;
        if (!pickerOptions.dialogTitle || pickerOptions.dialogTitle.length === 0) {
          pickerOptions.dialogTitle = ctrLang.addContent;
        }
        pickerOptions.startLocations = [];
        if (pickerOptions.includeBrowse) {
          pickerOptions.startLocations.push("current.location");
        }
        if (pickerOptions.includeFavorites) {
          pickerOptions.startLocations.push("favorites");
        }
        if (pickerOptions?.container?.widgetConfig) {
          pickerOptions.container.widgetConfig.widget_type = "";
        }
        this.nodePicker = new NodePicker(pickerOptions);
        var me = this;
        this.nodePicker.show().done(function(selectedNodes) {
          var childNodes = selectedNodes.nodes, collection = new Backbone.Collection(childNodes.map(function(node, index) {
            return {
              name: node.get("name"),
              mime_type: node.get("mime_type"),
              state: index === 0 ? "processing" : "pending",
              count: 0,
              total: 1,
              node: node,
              chronicle_id: node.get("i_chronicle_id"),
              context: status.context
            };
          }));
          options.parentNode = parentNode;
          options.childNodes = childNodes;
          me.performVdocOperation(status, options).done(function(obj) {
            response.result = obj;
            var completeProcess = function() {
              if (response.result["operation-status"]) {
                response.result["operation-status"].forEach(function(item) {
                  collection.each(function(model) {
                    if (item["chronicle-id"] === model.get("chronicle_id")) {
                      var node = collection.find({
                        chronicle_id: item["chronicle-id"]
                      });
                      if (item.status === "200") {
                        node.set({
                          state: "resolved",
                          count: 1,
                          errorMessage: ""
                        });
                      } else {
                        node.set({
                          state: "rejected",
                          count: 1,
                          errorMessage: item["rest-error"].details || item["rest-error"].message
                        });
                      }
                    }
                  });
                });
                if (collection.length === 1) {
                  var state = collection.models[0].get("state");
                  if (state === "rejected") {
                    var err = {};
                    err.responseJSON = {};
                    err.responseJSON.details = collection.models[0].get("errorMessage");
                    me.showErrorMessage(err, parentNode);
                    deferred.reject();
                  } else {
                    GlobalMessage.showMessage("success", _.str.sformat(lang.VDocAddChildOneItemSuccessMessage, childNodes[0].get("name")));
                    deferred.resolve();
                  }
                } else {
                  collection.each(function(model) {
                    model.node = model.get("node");
                    model.unset("node");
                  });
                  if (collection.pluck("state").indexOf("rejected") === -1) {
                    GlobalMessage.showMessage("success", _.str.sformat(lang.VDocAddChildManyItemsSuccessMessage, collection.length));
                  } else {
                    me.showProgressMessages(collection, options);
                  }
                  deferred.resolve();
                }
              }
            };
            if (response && response.result && response.result["operation-status"]) {
              var vdmNumber = vdUtils.getVDMNumber(parentNode);
              if (!vdUtils.isVirtualDoc(parentNode)) {
                vdmNumber = vdUtils.getParentVDMNumber(parentNode);
              }
              if (vdmNumber) {
                status.collection.refresh({
                  vdmNumber: vdmNumber
                }).done(function() {
                  status.collection.trigger("children:added", vdUtils.getVDMNumber(parentNode));
                  completeProcess();
                }).fail(function(err) {
                  me.showErrorMessage(lang.VDocAddChildRefreshErrorMessage, parentNode);
                  deferred.reject(err);
                });
              } else {
                completeProcess();
              }
            } else {
              completeProcess();
            }
          }).fail(function(err) {
            me.showErrorMessage(err, parentNode);
            deferred.reject(err);
          });
        }).fail(function(err) {
          if (!err.cancelled) {
            me.showErrorMessage(err, parentNode);
          }
          deferred.reject();
        });
      }.bind(this), deferred.reject);
    },
    execute: function(status, options) {
      var me = this, deferred = $.Deferred(), vdNode = status.data && status.data.useContainer ? status.container : CommandHelper.getJustOneNode(status), connector = status.context.getObject(ConnectionFactory), vdocId = vdNode?.get("id"), nodeModel = vdocId && new NodeModel({
        id: vdocId
      }, {
        context: status.context,
        connector: connector
      });
      options = options || {};
      options.originatingView = status.originatingView;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      nodeModel ? nodeModel.fetch().done(function() {
        CommandHelper.findValidParentForNode({
          node: nodeModel,
          context: status.context
        }).done(function(validParent) {
          if (validParent === undefined) {
            let connector = status.context.getObject(ConnectionFactory);
            validParent = new NodeModel(undefined, {
              context: status.context,
              connector: connector
            });
          }
          delete validParent._expanded;
          me.getContentAssistOptions(me, status, validParent, options, deferred);
        }.bind(this)).fail(function() {
          deferred.reject();
        });
      }).fail(function() {
        deferred.reject();
      }) : deferred.reject();
      return deferred.promise();
    },
    performVdocOperation: function(status, options) {
      return VdocCreationUtils.addChildToVd(options.parentNode, options.childNodes, this.get("signature"));
    },
    showErrorMessage: function(error, node) {
      CommandHelper.showErrorPanel(node, this.getDefaultErrorMessage(), _.isString(error) ? error : error && error.responseJSON && (error.responseJSON.details || error.responseJSON.message));
    },
    getDefaultErrorMessage: function() {
      return lang.VDocAddChildErrorMessage;
    },
    showProgressMessages: function(collection) {
      this.progressPanel = GlobalMessage.showProgressPanel(collection, {
        oneFilePending: lang.VDocAddingChildOneItem,
        multiFilePending: lang.VDocAddingChildManyItems,
        oneFileSuccess: lang.VDocAddChildOneItemSuccessMessage,
        multiFileSuccess: lang.VDocAddChildManyItemsSuccessMessage,
        oneFileFailure: lang.VDocAddChildOneItemFailMessage,
        multiFileOneFailure: lang.VDocAddChildManyItemsOneFailMessage,
        multiFileFailure: lang.VDocAddChildManyItemsFailMessage,
        actionType: "UPLOAD"
      });
    }
  });
  VDocCommandMixin.mixin(VDocAddChildrenBrowse.prototype);
  return VDocAddChildrenBrowse;
});