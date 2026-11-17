/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "dctmw/utils/authenticators/session", "dctmw/server.adaptors/converters/node", "d2/server.adaptors/models/esoc/comments.utils", "d2/utils/contexts/context.controller", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/graphics/graphics.resources", "d2/utils/widget.constants", "d2/utils/server.query.utils", "d2/utils/search.utils", "dctmw/utils/user.preference.storage", "dctmw/utils/utils", "d2/utils/node.utils", "d2/utils/vdoc.utils", "d2/utils/concurrency.manager", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function(module, require, _, $, Url, Session, nodeConverter, CommentsUtils, D2ContextController, RestResources, RestLinkrels, constants, GraphicsResources, widgetConstants, serverQueryUtils, searchUtils, userPreferenceStore, utils, nodeUtils, vdUtil, ConcurrencyManager, lang) {
  "use strict";
  var config = _.extend({
    showFavoriteColumn: true
  }, module.config());
  return {
    mixin: function(prototype) {
      var superSyncMethod = prototype.sync;
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          options = options || {};
          this.d2NodeOptions = _.extend({}, options);
          return this;
        },
        isFetchableDirectly: function() {
          var id = this.get("id");
          return id && id !== "volume";
        },
        urlBase: function(method) {
          var id = this.get("id"), url;
          if (!id) {
            throw new Error("Node creation not supported via model");
          } else {
            let objectTypePathParam = this.getObjectTypePathParam(id, method);
            url = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), objectTypePathParam, id);
          }
          return url;
        },
        getObjectTypePathParam: function(id, method) {
          if (id.indexOf("81") === 0 && method !== "delete") {
            return "business-workspaces";
          }
          return "objects";
        },
        url: function(method) {
          return this.urlBase(method);
        },
        parse: function(response, options) {
          var isHomeCabinet = this.get("_is_home_cabinet") === true;
          this._clearPrevResidualAttrs(options);
          if (isHomeCabinet || response.properties && response.properties._is_home_cabinet) {
            var origProps = response.properties;
            response.properties = {
              r_object_id: response.properties.r_object_id,
              object_name: lang.homeCabinetNodeName,
              actions: response.properties.actions || [],
              wnd_comments: response.properties.wnd_comments,
              _possibleRoots: response.properties._possibleRoots,
              i_ancestor_id: [],
              _is_home_cabinet: true,
              _orig_properties: origProps,
              d2ObjectDataFetched: response.properties?.d2ObjectDataFetched
            };
          }
          var node = options.searchnode ? nodeConverter.convertNode(searchUtils.convertSearchNode(response, options.oldmodel)) : nodeConverter.convertNode(response);
          if (this.clientColumns !== undefined) {
            node.definitions = this.clientColumns;
            node.columns = this.clientColumns;
            node.widgetPreference = {
              widgetName: this.widgetName,
              widgetType: this.widgetType,
              columnPreference: this.columnPreference,
              clientColumns: this.clientColumns,
              widgetConfig: this.widgetConfig
            };
            if (this.originWidgetConfig) {
              node.widgetPreference.originWidgetConfig = this.originWidgetConfig;
              delete this.originWidgetConfig;
            }
          }
          if (node.menuType) {
            this.delayedActions && (this.delayedActions.menuType = node.menuType);
            this.setNonPromotedActionsOptions && this.setNonPromotedActionsOptions({
              menuType: node.menuType
            });
          }
          if (node.widgetType) {
            this.delayedActions && (this.delayedActions.widgetType = node.widgetType);
            this.setNonPromotedActionsOptions && this.setNonPromotedActionsOptions({
              widgetType: node.widgetType
            });
            this.widgetType = node.widgetType;
          }
          return node;
        },
        sync: function(method, model, options) {
          if (ConcurrencyManager.isProgressPanelMinized() && _.contains(ConcurrencyManager.getInprogressIds(), model.get("id"))) {
            if (!options.d2SuppressModelEvents) {
              options.d2SuppressModelEvents = [];
            }
            options.d2SuppressModelEvents.push("request");
          }
          if (utils.isMobile() && this.d2NodeOptions.ignoreObjectData !== true) {
            this._fetchMenuNewObjectItems = true;
          }
          var me = this, originalError = options.error;
          options.error = function(model, xhr, options) {
            if (model && model.responseText) {
              var msg = JSON.parse(model.responseText);
              model.responseText = msg ? msg.message : model.responseText;
            }
            if (originalError) {
              originalError(model, xhr, options);
            }
          };
          if (method === "delete") {
            this._addDeleteParamsToUrl(model, options);
          } else if (method === "read") {
            var deferred = $.Deferred();
            if (options.resolveWidgetColumns === true && options.url) {
              options.url = Url.appendQuery(options.url, Url.combineQueryString({
                "widget-name": me.widgetName,
                "widget-type": me.widgetType
              }));
            }
            if (me._handleSpecialNode(model, options, deferred)) {
              return deferred.promise();
            } else {
              var oldSuccess = options.success, oldError = options.error;
              options.success = function(model, status, xhr) {
                var id;
                if (model.type === "dm_relation") {
                  id = model.properties.parent_id;
                } else {
                  id = model.properties.r_object_id;
                }
                var fromTile = !_.isUndefined(model._expanded) && model._expanded === false;
                delete model._expanded;
                var _handleSuccess = function() {
                  if (model && id && me.d2NodeOptions.ignoreObjectData !== true) {
                    var ignoreExternalShareTypes = [ widgetConstants.D2.RENDITIONS ], ignoreExternalShare = me.d2NodeOptions.fetchExternalShare === false || ignoreExternalShareTypes.indexOf(me.widgetType) > -1, fetchRelationsCount = me.collection && me.collection.fetchRelationsCount, widgetType = me.widgetType || me.widgetConfig && me.widgetConfig["widget_type"] || widgetConstants.D2.DOCLIST, isVDocWidgetUsageSnapshot = me.widgetConfig && me.widgetConfig["is_client_side_usage_snapshot"] === true, rulesType = widgetType === widgetConstants.D2.VDOC ? "vdoc" : undefined, vdFrameId = null, menuType;
                    switch (widgetType) {
                     case widgetConstants.D2.VDOC:
                      menuType = isVDocWidgetUsageSnapshot ? constants.MenuTypes.VDOC_SNAPSHOT : constants.MenuTypes.VDOC;
                      break;

                     case widgetConstants.D2.RELATIONS:
                      menuType = constants.MenuTypes.DETAIL_RELATIONS;
                      break;

                     case widgetConstants.D2.TASK_ATTACHMENTS:
                      menuType = constants.MenuTypes.TASK_DOCUMENTS;
                      break;

                     case widgetConstants.D2.WORKFLOWS:
                      menuType = constants.MenuTypes.WORKFLOWS;
                      break;

                     case widgetConstants.D2.COLLECTIONS:
                      menuType = constants.MenuTypes.COLLECTION_ITEMS;
                      break;

                     case widgetConstants.D2.BWS:
                      if (model?.properties?.r_object_id?.indexOf("81") === 0) {
                        menuType = constants.MenuTypes.BWS_OBJECT;
                      } else {
                        menuType = constants.MenuTypes.BWS_ITEMS;
                      }
                      break;

                     default:
                      menuType = constants.MenuTypes.CONTEXT;
                      break;
                    }
                    if (model.properties.r_object_type === "d2c_workflow_tracker" || model.properties.rObjectType === "d2c_workflow_tracker") {
                      menuType = constants.MenuTypes.WORKFLOWS;
                      widgetType = widgetConstants.D2.WORKFLOWS;
                    }
                    var params = {
                      ids: [ id ],
                      connector: me.connector
                    };
                    if (me.d2NodeOptions.fetchFavorites !== false) {
                      params.favorites = config.showFavoriteColumn !== false;
                    }
                    if (me.d2NodeOptions.fetchRelationsCount !== false) {
                      params.relationsCount = fetchRelationsCount;
                    }
                    if (me.d2NodeOptions.fetchPreviewFormats !== false && !utils.isMobile()) {
                      params.previewFormats = true;
                    }
                    if (me.d2NodeOptions.fetchActions !== false) {
                      params.actions = {
                        menuType: menuType,
                        widgetType: widgetType,
                        rulesType: rulesType,
                        associateIds: options.associate_id && [ options.associate_id ]
                      };
                      if (me.limitedCollection === true) {
                        params.actions.queryAction = "PROMOTED";
                      }
                      if (rulesType === "vdoc") {
                        if (!isVDocWidgetUsageSnapshot) {
                          vdFrameId = model.properties[vdUtil.PROP_PARENT_VD_ID];
                          if (!vdFrameId && me.origNode) {
                            vdFrameId = vdUtil.getParentVDId(me.origNode);
                          }
                          if (vdFrameId) {
                            params.actions[vdUtil.QUERY_PARAM_VD_FRAME_ID] = vdFrameId;
                            if (vdUtil.getVDRelationId(me)) {
                              params.actions[vdUtil.QUERY_VD_RELATION_IDS] = [ vdUtil.getVDRelationId(me) ];
                            }
                            if (vdUtil.getVDMNumber(me)) {
                              params.actions[vdUtil.QUERY_VDM_NUMBERS] = [ vdUtil.getVDMNumber(me) ];
                            }
                          }
                        } else {
                          delete params.actions;
                        }
                        delete params.previewFormats;
                      }
                      params.permissions = {
                        permissionLevel: "read"
                      };
                    }
                    if (!ignoreExternalShare) {
                      params.externalShare = true;
                    }
                    if (me.isDisableLocationColumn === false) {
                      _.extend(params, {
                        locations: {
                          fullPath: false,
                          ancestorDetails: GraphicsResources.hasConditionAttributes()
                        }
                      });
                    }
                    if (me.widgetName && me.widgetType) {
                      _.extend(params, {
                        widgetName: me.widgetName,
                        widgetType: me.widgetType,
                        isTargetBrowse: me.isTargetBrowse
                      });
                    }
                    serverQueryUtils.fetchDataForObjects(params).done(function(output) {
                      me.fetchMenuNewObjectData(id).done(function(actions) {
                        var actionKey = rulesType === "vdoc" && !!vdFrameId ? vdUtil.createVDActionKey(id, vdUtil.getVDRelationId(me), vdUtil.getVDMNumber(me)) : id;
                        if (output.actions && output.actions[actionKey] && actions) {
                          output.actions[actionKey] = output.actions[actionKey].concat(actions);
                          model.properties.csuiLazyActionsRetrieved = true;
                        }
                        if (me.viewerMarkupCount !== undefined) {
                          model.properties["viewer_markup_count"] = me.viewerMarkupCount;
                        }
                        if (me.isDisableLocationColumn === false && output.locations && output.locations[id]) {
                          model.properties.parent_id_expand = output.locations[id];
                          model.properties.parent_name = output.locations[id].name;
                        }
                        if (fetchRelationsCount && output.relationsCount && output.relationsCount[id]) {
                          model["relations_count"] = output.relationsCount[id]["relations_count"];
                        }
                        if (!ignoreExternalShare && output.externalShare && output.externalShare[id]) {
                          model.properties["externalShare"] = output.externalShare[id];
                        }
                        model.properties.actions = output.actions && output.actions[actionKey] || [];
                        if (config.showFavoriteColumn !== false) {
                          model.properties.favorite = output.favorites[id].favorite;
                        }
                        if (output.previewFormats && output.previewFormats[id]) {
                          model["previewFormats"] = output.previewFormats[id];
                        }
                        var permission = output.permissions[id];
                        model["base-permissions"] = permission ? permission["base-permission"] : {};
                        if (model["base-permissions"].read === true) {
                          var wInfo = D2ContextController.getWidgetInfo({
                            skipPreferredWidget: true
                          });
                          if (wInfo && wInfo.type === widgetConstants.D2.VDOC) {
                            if (!isVDocWidgetUsageSnapshot) {
                              model.properties.actions.push({
                                signature: "D2-OpenVDoc"
                              });
                            } else {
                              var previewLink = _.findWhere(model.links, {
                                rel: RestLinkrels.PREVIEW_URLS
                              }), links = previewLink ? [ previewLink ] : [];
                              model.properties.actions.push({
                                signature: "Download",
                                commandData: {
                                  menuId: "clientSideVDSnapshotDownload"
                                },
                                links: links
                              });
                            }
                            model.properties.actions.push({
                              signature: "D2-ViewVDoc"
                            }, {
                              signature: "D2-PreviewFormat",
                              csuiNonPromotedAction: false,
                              commandData: {
                                "preview-format": "pdf"
                              }
                            });
                          } else {
                            model.properties.actions.push({
                              signature: "open"
                            });
                          }
                        }
                        var commentsCol = me.clientColumns && _.find(me.clientColumns, function(model) {
                          return model["column_key"] === "wnd_comments";
                        });
                        serverQueryUtils.fetchDataForStateIconViews(params, model.properties).done(() => {
                          if (commentsCol) {
                            CommentsUtils.fetchTotalComments([ me ], me.connector).done(function() {
                              model.properties.wnd_comments = me.get("wnd_comments");
                              model.properties.d2ObjectDataFetched = true;
                              oldSuccess.call(options.context, model, status, xhr);
                              deferred.resolve();
                            }).fail(function() {
                              oldError && oldError.apply(options.context, arguments);
                              deferred.reject.apply(options.context, arguments);
                            });
                          } else {
                            model.properties.d2ObjectDataFetched = true;
                            oldSuccess.call(options.context, model, status, xhr);
                            deferred.resolve();
                          }
                        });
                      }).fail(function() {
                        oldError && oldError.apply(options.context, arguments);
                        deferred.reject.apply(options.context, arguments);
                      });
                    }).fail(function() {
                      oldError && oldError.apply(options.context, arguments);
                      deferred.reject.apply(options.context, arguments);
                    });
                  } else {
                    oldSuccess.call(options.context, model, status, xhr);
                    deferred.resolve();
                  }
                };
                options.error = function() {
                  oldError.apply(options.context, arguments);
                  deferred.reject.apply(deferred, arguments);
                };
                me.resolveWidgetInfoForPreferredType(model, options).done(function(isPreferredWidget) {
                  if (isPreferredWidget) {
                    let originWidgetInfo = D2ContextController.getWidgetInfo({
                      skipPreferredWidget: true
                    });
                    if (originWidgetInfo?.type === widgetConstants.D2.DOCLIST) {
                      let originWidgetConfig = nodeUtils.getNodeWidgetConfig(me, originWidgetInfo);
                      if (originWidgetConfig?.getParam("start_path_smartview") || originWidgetConfig?.getParam("content_type") === "DQL") {
                        me.originWidgetConfig = originWidgetConfig;
                      }
                    }
                  } else {
                    delete me.originWidgetConfig;
                  }
                  me.fetchWidgetData(!me.fields.columns).done(function(widgetConfig) {
                    if (widgetConfig) {
                      me.widgetName = widgetConfig.object_name;
                      me.widgetType = widgetConfig.widget_type;
                      me.widgetConfig = widgetConfig;
                    }
                    if (!fromTile) {
                      me._checkWidgetRestriction(model).fail(function(xhr) {
                        var error;
                        if (xhr && xhr.status === 0) {
                          error = xhr;
                          oldError.apply(options.context, arguments);
                        } else {
                          var name = me.get("_is_home_cabinet") === true ? lang.homeCabinetNodeName : me.get("name");
                          error = new Error(_.str.sformat(lang.doclistMismatchPath, name, me.widgetName));
                          oldError.apply(options.context, [ error, "error", error ]);
                        }
                        deferred.reject(error);
                      }).done(function() {
                        _handleSuccess();
                      });
                    } else {
                      _handleSuccess();
                    }
                  }).fail(function(err) {
                    options.error && options.error(err);
                    deferred.reject(err);
                  });
                }).fail(deferred.reject);
              };
              superSyncMethod.call(me, method, model, options).fail(deferred.reject);
            }
            return deferred.promise();
          }
          return superSyncMethod.call(me, method, model, options);
        },
        _handleSpecialNode: function(model, options, deferred) {
          var me = this, data, nodeId = me.get("id"), handleSuccess = function() {
            options.success.call(options.context, data, "success", {});
            deferred.resolve();
          }, handleError = function(err) {
            options.error.call(options, err);
            deferred.reject(err);
          };
          try {
            data = nodeUtils.createSpecialNode(nodeId);
          } catch (err) {
            handleError(err);
            return true;
          }
          if (!data) {
            return false;
          }
          options.parse = false;
          me.trigger("request", model, {}, options);
          var spcCfg = nodeUtils.getSpecialNodeConfig(me);
          if (nodeId === constants.NodeId.FAVORITES && !spcCfg.favoritesNodeEnabled || nodeId === constants.NodeId.REPOSITORY && nodeId !== spcCfg.startingPath && !me["_is_target_browse"]) {
            handleError(new Error(_.str.sformat(lang.doclistMismatchPath, data.name, me.widgetName)));
            return;
          }
          var fetchActions = function() {
            if (nodeConverter.isFavoritesNode(me)) {
              return $.Deferred().resolve([]).promise();
            }
            var actionId = nodeConverter.isRepositoryNode(me) ? constants.NodeId.REPOSITORY_SERVER : constants.NodeId.DQL;
            return me.fetchMenuNewObjectData(actionId).done(function(actions) {
              data.actions = data.actions.concat(actions);
            });
          };
          fetchActions().done(function() {
            me.resolveWidgetInfoForPreferredType().done(function() {
              me.fetchWidgetData(!me.fields.columns).done(function(widgetConfig) {
                if (widgetConfig) {
                  if (me.fields.columns) {
                    data.definitions = me.clientColumns;
                    data.columns = me.clientColumns;
                    data.widgetPreference = {
                      widgetName: widgetConfig.object_name,
                      widgetType: widgetConfig.widget_type,
                      columnPreference: me.columnPreference,
                      clientColumns: me.clientColumns,
                      widgetConfig: widgetConfig
                    };
                  } else {
                    me.widgetName = widgetConfig.object_name;
                    me.widgetType = widgetConfig.widget_type;
                    me.widgetConfig = widgetConfig;
                  }
                }
                setTimeout(function() {
                  handleSuccess();
                });
              }).fail(handleError);
            });
          }).fail(handleError);
          return true;
        },
        fetchMenuNewObjectData: function(id) {
          var me = this, deferred = $.Deferred();
          this.isMenuNewObjectItemsFetchable().done(fetchMenuNewObjectItems => {
            if (fetchMenuNewObjectItems === true) {
              let menuType;
              switch (me.widgetType) {
               case widgetConstants.D2.BWS:
                menuType = constants.MenuTypes.BWS_NEW_OBJECT;
                break;

               default:
                menuType = constants.MenuTypes.NEW_OBJECT;
                break;
              }
              serverQueryUtils.fetchActions({
                ids: [ id ],
                connector: this.connector,
                menuType: menuType
              }).done(function(actions) {
                deferred.resolve(actions[id]);
              }).fail(deferred.reject);
            } else {
              deferred.resolve([]);
            }
          }).fail(deferred.reject);
          return deferred.promise();
        },
        isMenuNewObjectItemsFetchable: function() {
          var me = this, deferred = $.Deferred();
          if (this._fetchMenuNewObjectItems === true) {
            deferred.resolve(true);
          } else {
            require([ "csui/utils/contexts/factories/next.node" ], NextNodeModelFactory => {
              var context = Session.get().getContext(), nextNode = context.getModel(NextNodeModelFactory), currentNodeId = this.get("id"), nextNodeId = nextNode?.get("id");
              if (currentNodeId === nextNodeId && me.isDctmContainerNode()) {
                deferred.resolve(true);
              } else {
                deferred.resolve(false);
              }
            }, deferred.reject);
          }
          return deferred.promise();
        },
        isDctmContainerNode: function() {
          if (this.has("container")) {
            return this.get("container");
          }
          return nodeUtils.isContainerNode(this);
        },
        fetchWidgetData: function(ignoreColumns) {
          if (this._expanded === false) {
            return $.Deferred().resolve().promise();
          }
          var me = this, deferred = $.Deferred(), widgetInfo = nodeConverter.isDQLNode(me) ? {
            name: me.get("id").substring(constants.DQL_NODE_PREFIX.length)
          } : D2ContextController.getWidgetInfo();
          var widgetConfig;
          try {
            widgetConfig = nodeUtils.getNodeWidgetConfig(me, widgetInfo);
          } catch (e) {
            return deferred.reject(e);
          }
          if (ignoreColumns !== true) {
            me.fetchColumnPreferences(widgetConfig).done(function() {
              deferred.resolve(widgetConfig, me.clientColumns);
            }).fail(function(err) {
              deferred.reject(err);
            });
          } else {
            deferred.resolve(widgetConfig, me.clientColumns);
          }
          return deferred.promise();
        },
        resolveWidgetInfoForPreferredType: function(response, options) {
          let deferred = $.Deferred();
          require([ "csui/utils/contexts/factories/next.node", "nuc/models/mixins/rules.matching/rules.matching.mixin", "d2/utils/rules/node.perspective.rules" ], (NextNodeModelFactory, RulesMatchingMixin, widgetPerspectiveViewRules) => {
            let context = this.connector?.context || Session.get().getContext(), nextNode = context.getModel(NextNodeModelFactory), handleError = function(errorMsg) {
              D2ContextController.removePreferredWidgetInfo();
              context.rejectPerspective && context.rejectPerspective(this, new Error(errorMsg));
              options.error.call(options, new Error(errorMsg));
              deferred.reject(new Error(errorMsg));
            }.bind(this);
            if (!response) {
              if (nextNode.cid === this.cid) {
                D2ContextController.removePreferredWidgetInfo();
              }
              deferred.resolve();
              return;
            }
            if (response?.properties && nextNode.cid === this.cid) {
              let rulesMatcher = RulesMatchingMixin.mixin({}), widgetPerspective = _.find(widgetPerspectiveViewRules, function(rule) {
                return rulesMatcher.matchRules(response, rule);
              });
              if (widgetPerspective) {
                let widgetType = widgetPerspective?.widgetType, widgetTitle = widgetPerspective.widgetTitle || widgetType, perspectiveLayout = widgetPerspective?.perspectiveLayout;
                if (widgetPerspective.resolveWidgetForType && _.isFunction(widgetPerspective.resolveWidgetForType)) {
                  let widgetNameResolver = widgetPerspective.resolveWidgetForType(response);
                  if (widgetNameResolver) {
                    if (_.isString(widgetNameResolver)) {
                      widgetNameResolver = $.Deferred().resolve(widgetNameResolver).promise();
                    }
                    widgetNameResolver.done(widgetName => {
                      if (widgetType && widgetName && perspectiveLayout) {
                        let perspectiveData = {};
                        if (_.isFunction(widgetPerspective.resolveDataForPerspective)) {
                          perspectiveData = widgetPerspective.resolveDataForPerspective(response);
                        }
                        _.extend(response.properties, perspectiveData, {
                          perspective: widgetPerspective.perspectiveLayout
                        });
                        D2ContextController.setPreferredWidgetInfo({
                          name: widgetName,
                          type: widgetType
                        });
                        deferred.resolve(true);
                      } else {
                        handleError(_.str.sformat(lang.widgetNotConfiguredForTypeError, widgetTitle));
                      }
                    }).fail(() => {
                      handleError(_.str.sformat(lang.widgetNotConfiguredForTypeError, widgetTitle));
                    });
                  } else {
                    handleError(_.str.sformat(lang.widgetNotConfiguredForTypeError, widgetTitle));
                  }
                } else {
                  handleError(_.str.sformat(lang.widgetNotResolvedForTypeError, widgetTitle));
                }
              } else {
                D2ContextController.removePreferredWidgetInfo();
                deferred.resolve();
              }
            } else {
              deferred.resolve();
            }
          }, deferred.reject);
          return deferred.promise();
        },
        fetchColumnPreferences: function(widgetConfig) {
          var me = this, deferred = $.Deferred();
          if (me.widgetName && widgetConfig && me.widgetName !== widgetConfig.object_name) {
            me.clientColumns = undefined;
          }
          me.widgetName = widgetConfig && widgetConfig.object_name;
          me.widgetType = widgetConfig && widgetConfig.widget_type;
          this.showCommentColumn = true;
          if (widgetConfig) {
            this.showCommentColumn = widgetConfig.getParam("is_disable_cmts_col_smartview") !== "true";
            if (me.widgetType === widgetConstants.D2.VDOC) {
              var defaultDoclistWidgetName = RestResources.getCurrentUser().get("defaultWidgets")[widgetConstants.DEFAULT.DOCLIST], defaultDoclistWidgetConfig = defaultDoclistWidgetName && serverQueryUtils.getWidgetConfig(widgetConstants.D2.DOCLIST, defaultDoclistWidgetName);
              this.showCommentColumn = defaultDoclistWidgetConfig ? defaultDoclistWidgetConfig.getParam("is_disable_cmts_col_smartview") !== "true" : false;
            }
          }
          var columnOptions;
          if (!utils.isMobile()) {
            CommentsUtils.setCommentingEnabled(this.showCommentColumn);
            columnOptions = {
              commentColumn: this.showCommentColumn,
              favoriteColumn: config.showFavoriteColumn !== false,
              externalShareColumn: !_.isUndefined(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_MYSHARED_OBJECTS))
            };
            if (me.showVdmSequenceColumn) {
              columnOptions["vdmSequenceColumn"] = true;
            }
          } else {
            columnOptions = {
              typeColumn: false,
              reservedColumn: false,
              externalShareColumn: false,
              commentColumn: false,
              favoriteColumn: false
            };
          }
          if (me.isTargetBrowse) {
            columnOptions = {
              reservedColumn: false,
              externalShareColumn: false,
              commentColumn: false,
              favoriteColumn: false
            };
          }
          serverQueryUtils.fetchColumnPreferences({
            scope: me,
            widgetType: me.widgetType || widgetConstants.D2.DOCLIST,
            widgetName: me.widgetName || "",
            defaultType: me.widgetType === widgetConstants.D2.VDOC ? constants.DocumentLinkType.VD : constants.ColTypes.DEFAULT,
            connector: me.connector,
            columnOptions: columnOptions
          }).done(function(clientCols, columnPreference) {
            me.columnPreference = columnPreference;
            me.clientColumns = clientCols;
            _.each(clientCols, function(col) {
              if (col.filter !== false && (col.type === 2 || col.type === -1)) {
                col.filter = true;
                col.filter_key = col.filter_key || col.column_key;
              }
            });
            deferred.resolve();
          }).fail(function(err) {
            deferred.reject(err);
          });
          return deferred.promise();
        },
        resetWidgetPreference: function() {
          var me = this, deferred = $.Deferred(), widgetPreference = me.get("widgetPreference"), originWidgetConfig = widgetPreference?.originWidgetConfig;
          me.fetchWidgetData().done(function(widgetConfig, clientColumns) {
            let widgetPreference = {
              widgetName: widgetConfig.object_name,
              widgetType: widgetConfig.widget_type,
              clientColumns: clientColumns,
              columnPreference: me.columnPreference,
              widgetConfig: widgetConfig
            };
            if (originWidgetConfig) {
              widgetPreference.originWidgetConfig = originWidgetConfig;
            }
            me.set("widgetPreference", widgetPreference);
            me.definitions.reset(clientColumns);
            me.columns.reset(clientColumns);
            me.set("columns", clientColumns);
            deferred.resolve();
          }).fail(function(err) {
            deferred.reject(err);
          });
          return deferred.promise();
        },
        _checkWidgetRestriction: function(model) {
          var me = this, deferred = $.Deferred(), ancestorIds = model.properties["i_ancestor_id"], wConf = me.widgetConfig, originWConf = me.originWidgetConfig, callback = function() {
            if (_.isArray(ancestorIds)) {
              var homeCabinetEnabled = wConf.getParam("is_show_home_cabinet") === "true", startingPath = wConf.getParam("start_path_smartview") || originWConf?.getParam("start_path_smartview");
              if (!homeCabinetEnabled && me.get("_is_home_cabinet") === true) {
                deferred.reject();
              } else {
                nodeUtils.fetchFavoriteFolders({
                  favoriteFoldersEnabled: wConf.getParam("is_show_favorites_folders") === "true",
                  connector: me.connector
                }).done(function(favIds) {
                  var pRoots = nodeUtils.getPossibleRoots({
                    ancestorIds: ancestorIds,
                    favoriteFolderIds: favIds,
                    homeCabinetEnabled: homeCabinetEnabled,
                    startingPath: startingPath
                  });
                  if (!me.get("_is_home_cabinet") && me.get("id") === nodeUtils.getHomeCabinetId() && homeCabinetEnabled) {
                    var bcRoot = D2ContextController.getBreadcrumbRoot();
                    if (!bcRoot || !bcRoot.root) {
                      if (!pRoots.favoritesNodes || !pRoots.favoritesNodes.length) {
                        me.set("_is_home_cabinet", true);
                      }
                    } else if (bcRoot.root._is_home_cabinet === true) {
                      me.set("_is_home_cabinet", true);
                    }
                  }
                  model.properties._possibleRoots = pRoots;
                  if (!startingPath || pRoots.startingPath || pRoots.homeCabinet || pRoots.favoritesNodes && pRoots.favoritesNodes.length) {
                    deferred.resolve();
                  } else {
                    deferred.reject();
                  }
                }).fail(deferred.reject);
              }
            } else {
              deferred.resolve();
            }
          };
          if (me._expanded === false) {
            return $.Deferred().resolve().promise();
          }
          if (me.widgetName && wConf) {
            var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.OBJECTS_LOCATIONS);
            url = Url.appendQuery(url, Url.combineQueryString({
              "object-ids": model["properties"]["r_object_id"]
            }));
            if (url && !ancestorIds) {
              $.ajax(me.connector.extendAjaxOptions({
                url: url,
                success: function(response) {
                  var id;
                  var startingPath = wConf.getParam("start_path_smartview");
                  if (response.entries[0].content && response.entries[0].content.properties && response.entries[0].content.properties[0]["ancestor_id_path"]) {
                    var ancestorProperties = _.find(response.entries[0].content.properties, function(properties) {
                      return properties["ancestor_id_path"] && properties["ancestor_id_path"].indexOf(startingPath) !== -1;
                    });
                    if (ancestorProperties && ancestorProperties["ancestor_id_path"]) {
                      id = ancestorProperties["ancestor_id_path"].split("/");
                    } else {
                      id = response.entries[0].content.properties[0]["ancestor_id_path"].split("/");
                    }
                  }
                  ancestorIds = id && id.slice(1);
                  callback();
                },
                error: deferred.reject
              }));
            } else {
              callback();
            }
          } else {
            deferred.resolve();
          }
          return deferred.promise();
        },
        _addDeleteParamsToUrl: function(model, options) {
          var deleteOptions = options.deleteOptions;
          var deleteParams = {};
          var baseDeleteUrl = this.url("delete");
          if (deleteOptions) {
            if (deleteOptions.deleteFileAndLinks === false) {
              _.extend(options, {
                url: Url.combine(RestLinkrels.getLink(model.get("links"), RestLinkrels.PARENT_LINKS), options.container.get("id"))
              });
              return;
            } else {
              if (deleteOptions.deleteFileAndVersions) {
                deleteParams["del-version"] = "all";
              }
              if (deleteOptions.deleteFolderAndDecendants) {
                deleteParams["del-non-empty"] = "true";
              }
              if (deleteOptions.deleteVDocAndDecendants) {
                deleteParams["del-vd-all"] = "true";
              }
              deleteParams["parent-id"] = model?.parent?.get("id") ?? deleteParams["parent-id"];
              if (_.keys(deleteOptions).length) {
                options.url = Url.appendQuery(baseDeleteUrl, Url.combineQueryString(deleteParams));
                return;
              }
            }
          }
          options.url = baseDeleteUrl;
        },
        _clearPrevResidualAttrs: function(options) {
          var idAttr = this.idAttribute || "id";
          for (var key in this.attributes) {
            if (Object.prototype.hasOwnProperty.call(this.attributes, key)) {
              if (key !== idAttr && key !== "type" && key.indexOf("csui") !== 0) {
                delete this.attributes[key];
              }
              if (options.clearselection && key === "csuiIsSelected") {
                delete this.attributes[key];
              }
            }
          }
        },
        isVirtualDoc: function() {
          return this.get("rIsVirtualDoc");
        },
        getParentId: function(args) {
          var parent_id = args?.status?.container?.get("id"), isValidParentId = function(id) {
            if (id?.indexOf("dql_") === 0) {
              return false;
            }
            return true;
          };
          if (!parent_id || !isValidParentId(parent_id)) {
            parent_id = this.get("parent_id_expand")?.id || this.get("parent_id");
          }
          return parent_id;
        },
        canBeOpened: function(nodeData) {
          return !this.get("container") && !vdUtil.isVDSnapshot(this) && nodeData && nodeData.basePermissions && nodeData.basePermissions.read && _.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION, constants.Types.OBJECT, constants.Types.WORKFLOW_STEP ], this.get("type"));
        }
      });
    }
  };
});