/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/nodes", "nuc/models/node.children2/node.children2", "nuc/utils/url", "dctmw/lib/uri-templates", "nuc/models/node/node.model", "csui/models/fileuploads", "csui/models/widget/search.results/search.results.model", "d2/controls/globalmessage/globalmessage", "csui/utils/commandhelper", "csui/utils/commands", "d2/models/virtual.document.children", "dctmw/server.adaptors/converters/node", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "dctmw/utils/utils", "d2/utils/constants", "d2/utils/widget.constants" ], function(require, $, _, Backbone, NodeCollection, NodeChildren2Collection, Url, UriTemplates, NodeModel, UploadFileCollection, SearchResultsCollection, GlobalMessage, CommandHelper, Commands, VDocChildModels, nodeConverter, RestLinkrels, RestResources, serverQueryUtils, utils, constants, widgetConstants) {
  "use strict";
  _.extend(CommandHelper, {
    getOriginalAction: function(node, signature, commandData) {
      var actions = node.actions.where({
        signature: signature
      });
      if (actions && actions.length) {
        if (commandData && commandData.menuId) {
          return _.find(actions, function(action) {
            var actionMenuId = (action.get("commandData") || {}).menuId || "", cmdMenuId = commandData.menuId || "";
            return actionMenuId === cmdMenuId;
          });
        } else {
          return actions[0];
        }
      }
    },
    getOriginalActionLink: function(node, signature, linkrel, params, commandData) {
      var origAction = this.getOriginalAction(node, signature, commandData);
      if (origAction) {
        var links = origAction.get("links"), link = linkrel ? _.findWhere(links, {
          rel: linkrel
        }) : links[0];
        var isTemplate = link && !!link.hreftemplate;
        if (isTemplate) {
          var template = new UriTemplates(utils.buildLinkUrl(link, isTemplate));
          return template.fill(params);
        } else {
          return utils.buildLinkUrl(link);
        }
      }
      return undefined;
    },
    refreshNode: function(node, refreshOptions) {
      var me = this, deferred = $.Deferred();
      require([ "csui/models/widget/recentlyaccessed.model" ], function(RecentlyAccessedCollection) {
        if (node instanceof Backbone.Model) {
          var options = {
            force: true,
            skipSWCache: true
          }, oldmodel = JSON.parse(JSON.stringify(node.attributes));
          if (refreshOptions && refreshOptions.widgetName && refreshOptions.widgetType) {
            options.resolveWidgetColumns = true;
            node.widgetName = refreshOptions.widgetName;
            node.widgetType = refreshOptions.widgetType;
            node.isDisableLocationColumn = refreshOptions.isDisableLocationColumn;
            if (node.collection instanceof SearchResultsCollection) {
              options.keepselection = true;
              options.searchnode = true;
              options.oldmodel = oldmodel;
            } else if (refreshOptions.widgetType === widgetConstants.D2.RELATIONS) {
              var childNode = new NodeModel({
                id: node.get("id")
              }, {
                connector: node.connector
              });
              options.associate_id = node.get("associate_id");
              childNode.widgetName = node.widgetName;
              childNode.widgetType = node.widgetType;
              childNode._expanded = false;
              childNode.fetch(options).done(function() {
                childNode.unset("links");
                node.set(childNode.attributes);
                if (options.resolveWidgetColumns) {
                  delete node.widgetName;
                  delete node.widgetType;
                  delete node.isDisableLocationColumn;
                }
                if (refreshOptions.mergeOldAttributes && oldmodel) {
                  _.defaults(node.attributes, oldmodel);
                }
                deferred.resolve();
              }).fail(function(err) {
                deferred.reject(err);
              });
              return deferred.promise();
            }
            if (node.collection instanceof VDocChildModels && !node.origNode) {
              node.origNode = node;
            }
          }
          node._expanded = false;
          if (node.collection && node.collection.limitedCollection === true) {
            if (options.resolveWidgetColumns) {
              delete node.widgetName;
              delete node.widgetType;
              delete node.isDisableLocationColumn;
            }
            options.resolveWidgetColumns = false;
            node.limitedCollection = true;
          }
          if (node.collection instanceof RecentlyAccessedCollection) {
            me.refreshRecentlyAccessedNode(node).done(deferred.resolve).fail(deferred.reject);
          } else {
            node.fetch(options).done(function() {
              if (options.resolveWidgetColumns) {
                delete node.widgetName;
                delete node.widgetType;
                delete node.isDisableLocationColumn;
              }
              delete node.limitedCollection;
              if (refreshOptions && refreshOptions.mergeOldAttributes && oldmodel) {
                _.defaults(node.attributes, oldmodel);
              }
              if (node?.collection?.widgetType === widgetConstants.D2.FAVORITES) {
                node.collection.fetchDelayedData({
                  nodes: [ node.get("id") ]
                }).done(function(delayedDataResponse) {
                  node.set(delayedDataResponse[node.get("id")]);
                });
                _.defaults(node.attributes, _.pick(oldmodel, "rObjectType"));
              }
              deferred.resolve();
            }).fail(function(err) {
              deferred.reject(err);
            });
          }
        } else {
          deferred.reject("node is not a backbone model");
        }
      });
      return deferred.promise();
    },
    refreshNodes: function(nodes, refreshOptions) {
      refreshOptions = refreshOptions || {};
      nodes = nodes instanceof Backbone.Collection ? nodes : new Backbone.Collection(nodes);
      var deferred = $.Deferred(), connector = refreshOptions.connector, widgetType = refreshOptions.widgetType, widgetName = refreshOptions.widgetName, nodeModelMap = nodes.reduce(function(map, node) {
        var id = node.get("id");
        map[id] = node;
        return map;
      }, {}), nodeIds = _.keys(nodeModelMap), menuType;
      switch (widgetType) {
       case widgetConstants.D2.DOCLIST:
       case widgetConstants.D2.SEARCH:
       case widgetConstants.D2.FAVORITES:
       case widgetConstants.D2.CHECKOUT:
       case widgetConstants.D2.RECENTLY_ACCESSED:
       case widgetConstants.D2.MYSHARES:
        menuType = constants.MenuTypes.CONTEXT;
        break;

       case widgetConstants.D2.TASK_ATTACHMENTS:
        menuType = constants.MenuTypes.TASK_DOCUMENTS;
        break;

       default:
        break;
      }
      function fetchNodeData() {
        var dfd = $.Deferred();
        if (nodeIds.length > 0) {
          var batchPayload = [];
          _.each(nodeIds, function(nodeId) {
            var nodeModel = nodeModelMap[nodeId], url = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.SELF);
            if (widgetName && widgetType) {
              url = Url.appendQuery(url, Url.combineQueryString({
                "widget-name": widgetName,
                "widget-type": widgetType
              }));
            }
            batchPayload.push({
              id: nodeId,
              request: {
                method: "GET",
                uri: url
              }
            });
          });
          utils.makeBatchAjaxCall({
            connector: connector,
            operations: batchPayload,
            continueOnError: true,
            sequential: true,
            skipSWCache: true
          }).done(function(successful) {
            if (!successful || successful.length === 0) {
              dfd.reject();
            }
            var nodeObjects = [];
            _.each(successful, function(item) {
              if (item && item.output) {
                nodeObjects.push(item.output);
              }
            });
            dfd.resolve(nodeObjects);
          }).fail(dfd.reject);
        } else {
          dfd.resolve();
        }
        return dfd.promise();
      }
      function fetchDataForNodes(nodeObjects) {
        var dfd = $.Deferred(), nodeIds = _.map(nodeObjects, function(nodeObject) {
          return nodeObject.properties["r_object_id"];
        }), ignoreExternalShareTypes = [ widgetConstants.D2.RENDITIONS ], ignoreExternalShare = ignoreExternalShareTypes.indexOf(widgetType) > -1, fetchRelationsCount = refreshOptions.collection && refreshOptions.collection.fetchRelationsCount, includeLocation = refreshOptions.collection && refreshOptions.collection.options && refreshOptions.collection.options.isDisableLocationColumn === false, params = {
          ids: nodeIds,
          connector: connector,
          skipSWCache: true,
          favorites: true,
          relationsCount: fetchRelationsCount,
          previewFormats: utils.isMobile() ? false : true,
          externalShare: !ignoreExternalShare,
          permissions: {
            permissionLevel: "read"
          },
          actions: {
            menuType: menuType,
            widgetType: widgetType
          }
        };
        if (includeLocation) {
          _.extend(params, {
            locations: {
              fullPath: false
            }
          });
        }
        serverQueryUtils.fetchDataForObjects(params).done(function(output) {
          var nodeModel, oldModel;
          _.each(nodeObjects, function(nodeObject) {
            var id = nodeObject.properties["r_object_id"];
            nodeModel = nodeModelMap[id];
            oldModel = JSON.parse(JSON.stringify(nodeModel.attributes));
            nodeObject.properties.actions = output.actions && output.actions[id] || [];
            nodeObject.properties.favorite = output.favorites[id].favorite;
            if (fetchRelationsCount && output.relationsCount && output.relationsCount[id]) {
              nodeObject["relations_count"] = output.relationsCount[id]["relations_count"];
            }
            if (!ignoreExternalShare && output.externalShare && output.externalShare[id]) {
              nodeObject.properties["externalShare"] = output.externalShare[id];
            }
            if (output.previewFormats && output.previewFormats[id]) {
              nodeObject["previewFormats"] = output.previewFormats[id];
            }
            if (includeLocation && output.locations && output.locations[id]) {
              nodeObject.properties.parent_id_expand = output.locations[id];
              nodeObject.properties.parent_name = output.locations[id].name;
            }
            var permission = output.permissions[id];
            nodeObject["base-permissions"] = permission ? permission["base-permission"] : {};
            if (nodeModel) {
              var nodeAttributes = nodeModel.parse(nodeObject, {});
              if (refreshOptions.mergeOldAttributes && oldModel) {
                _.defaults(nodeAttributes, oldModel);
              }
              nodeModel.set(nodeAttributes, {
                silent: true
              });
            }
          });
          refreshOptions.collection.fetch({
            reload: false
          }).always(function() {
            refreshOptions.selectedNodes && refreshOptions.selectedNodes.trigger("change");
            dfd.resolve();
          });
        }).fail(function() {
          dfd.reject();
        });
        return dfd.promise();
      }
      if (menuType && nodeIds && nodeIds.length > 0) {
        fetchNodeData().done(function(nodeObjects) {
          fetchDataForNodes(nodeObjects).always(function() {
            deferred.resolve({
              nodesRefreshed: true
            });
          });
        }).fail(deferred.reject);
      } else {
        deferred.resolve({
          nodesRefreshed: false
        });
      }
      return deferred.promise();
    },
    showErrorPanel: function(node, errMessage, detailMessage) {
      var collection = new UploadFileCollection([ {
        name: node.get("name"),
        state: "rejected",
        errorMessage: detailMessage,
        count: 1,
        total: 1
      } ], {
        connector: node.connector
      });
      collection.at(0).node = node;
      return GlobalMessage.showProgressPanel(collection, {
        oneFileFailure: errMessage
      });
    },
    refreshRecentlyAccessedNode: function(node) {
      var deferred = $.Deferred(), qParams = {
        "object-ids": node.get("id"),
        inline: true,
        "widget-name": node.widgetName
      }, url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_USER_RECENTLY_ACCESSED);
      $.ajax(node.connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(qParams)),
        skipSWCache: true,
        success: function(response) {
          var localNode = nodeConverter.convertNode(response.entries[0].content), permission = node.get("basePermissions"), options = {
            ids: [ node.get("id") ],
            connector: node.connector,
            menuType: constants.MenuTypes.CONTEXT,
            widgetType: widgetConstants.D2.RECENTLY_ACCESSED,
            actions: {
              menuType: constants.MenuTypes.CONTEXT,
              widgetType: widgetConstants.D2.RECENTLY_ACCESSED
            },
            externalShare: !_.isUndefined(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MYSHARED_OBJECTS))
          };
          serverQueryUtils.fetchDataForObjects(options).done(function(output) {
            let nodeResponse = output.actions[node.get("id")];
            localNode.actions = localNode.actions.concat(nodeResponse);
            if (output && output.externalShare && output.externalShare[node.get("id")]) {
              localNode.externalShare = output.externalShare[node.get("id")];
            }
            localNode.actions.push({
              signature: "open"
            });
            localNode.basePermissions = permission;
            node.set(localNode);
            deferred.resolve();
          }).fail(deferred.reject);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    blockD2ViewActions: function(view) {
      if (view && _.isFunction(view.blockActions)) {
        (!view._blockingCounter || view._blockingCounter < 1) && view.blockActions();
      } else {
        $("div.load-container.csui-global").removeClass("binf-hidden");
      }
    },
    unblockD2ViewActions: function(view) {
      if (view && _.isFunction(view.unblockActions)) {
        view.unblockActions();
      } else {
        $("div.load-container.csui-global").addClass("binf-hidden");
      }
    },
    postCommandOperation: function(options) {
      var dfds = [];
      if ((options.refreshWidget === true || options.refreshCheckoutState === true || options.locateAndRefresh === true) && options.collection === undefined) {
        CommandHelper.refreshNode(options.selectedNodes?.models[0]).always(function() {
          options?.context.triggerMethod("change:perspective");
        });
      } else {
        if (options.refreshWidget === true && options.selectedNodes?.models[0]?.collection) {
          Commands.get("D2-RefreshList").execute({
            collection: options?.collection,
            originatingView: options?.originatingView,
            context: options?.context,
            container: options.selectedNodes?.models[0]?.parent
          }).done(function() {
            options.selectedNodes.each(function(node) {
              if (!options.collection.get(node.get("id"))) {
                options.originatingView?.removeNodesFromSelection && options.originatingView.removeNodesFromSelection([ node ]);
              }
              CommandHelper.unblockD2ViewActions(options?.originatingView);
            });
          });
        }
        if (options.refreshCheckoutState === true && options.selectedNodes) {
          const widgetName = options.collection?.options?.widgetName, widgetType = options.collection?.widgetType;
          options.selectedNodes.each(function(node) {
            dfds.push(CommandHelper.refreshNode(node, {
              widgetName: widgetName,
              widgetType: widgetType
            }));
          });
        }
        if (options.locateAndRefresh === true && options.selectedNodes?.models[0]?.collection) {
          options.selectedNodes.each(function(node) {
            CommandHelper.refreshNode(node).always(function() {
              Commands.get("D2-GoToLocation").execute({
                nodes: new NodeCollection(node),
                context: options?.context
              });
            });
          });
        }
      }
      return $.when.apply($, dfds);
    }
  });
});