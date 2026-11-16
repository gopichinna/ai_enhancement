/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/utils/log", "nuc/utils/url", "csui/utils/taskqueue", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/vdoc.utils", "d2/utils/constants" ], function(module, _, $, Backbone, NodeModel, NodeResourceMixin, log, Url, TaskQueue, CommandHelper, RestLinkrels, RestResources, serverQueryUtils, vdUtil, constants) {
  "use strict";
  log = log(module.id);
  var PARENT_CHILD_VDM_NUMBER_SEPARATOR = ".", defaultVDMNumber = {}, defaultParentVDMNumber = {};
  defaultVDMNumber[vdUtil.PROP_VDM_NUMBER] = "0";
  defaultParentVDMNumber[vdUtil.PROP_PARENT_VDM_NUMBER] = "0";
  function decimalStrToInt(num, defaultValue) {
    var val = defaultValue;
    if (num !== null && !_.isUndefined(num)) {
      var temp = parseInt(num);
      if (!_.isNaN(temp)) {
        val = temp;
      }
    }
    return val;
  }
  function compareByVDMNumber(vdm1, vdm2) {
    vdm1 = vdm1.split(PARENT_CHILD_VDM_NUMBER_SEPARATOR);
    vdm2 = vdm2.split(PARENT_CHILD_VDM_NUMBER_SEPARATOR);
    var maxLen = Math.max(vdm1.length, vdm2.length);
    for (var idx = 0; idx < maxLen; idx++) {
      var n1 = decimalStrToInt(vdm1[idx]), n2 = decimalStrToInt(vdm2[idx]);
      if (n1 !== n2) {
        return n1 - n2;
      }
    }
    return 0;
  }
  var VDocNodeModel = NodeModel.extend({
    idAttribute: vdUtil.PROP_VDM_NUMBER,
    constructor: function VDocNodeModel() {
      return NodeModel.prototype.constructor.apply(this, arguments);
    }
  });
  var VirtualDocumentChildren = Backbone.Collection.extend({
    model: VDocNodeModel,
    comparator: function(m1, m2) {
      return compareByVDMNumber(vdUtil.getVDMNumber(m1), vdUtil.getVDMNumber(m2));
    },
    constructor: function VirtualDocumentChildren(models, options) {
      options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this._vdExpandedView = _.isBoolean(options._vdExpandedView) ? options._vdExpandedView : false;
      this.logPrefix = "VD collection " + this.cid;
      this.makeNodeResource(options);
      this.exploreAsSnapshot = _.isBoolean(options.exploreAsSnapshot) ? options.exploreAsSnapshot : vdUtil.isVDSnapshot(this.node);
      this.taskQueue = new TaskQueue({
        parallelism: 1
      });
      this.mirrorInstance = options.mirrorInstance;
      if (this.mirrorInstance) {
        if (!(this.mirrorInstance instanceof VirtualDocumentChildren)) {
          throw new Error("mirrorInstance can only be of type VirtualDocumentChildrenCollection");
        } else {
          log.debug("{0} - has a mirror instance collection - {1}", this.logPrefix, this.mirrorInstance.logPrefix) && console.log(log.last);
        }
      }
    },
    fetch: function(options) {
      options = _.defaults(options || {}, {
        shouldExpandAll: false
      });
      if (this.exploreAsSnapshot) {
        options.shouldExpandAll = true;
      }
      var dfd = $.Deferred(), me = this, vdRoot = options.isSyncingDueToRefresh === true ? this.getVDRoot() : null;
      if (!!vdRoot && vdRoot.get("id") !== this.node.get("id")) {
        this.node.clear({
          silent: true
        });
        this.node.set(vdRoot.attributes, {
          silent: true
        });
      }
      this.ensureWidgetConfig(null, null, options).always(function() {
        options.url = me._getUrl(null, options.shouldExpandAll);
        log.debug("{0} - fetching with option expand-all: {1}", me.logPrefix, options.shouldExpandAll) && console.log(log.last);
        Backbone.Collection.prototype.fetch.call(me, options).done(function() {
          if (!!me.mirrorInstance && options.skipMergeWithMirrorOnFetch !== true) {
            log.debug("{0} - resetting mirror instance {1} with own fetch results", me.logPrefix, me.mirrorInstance.logPrefix);
            me.mirrorInstance.reset(_.map(me._getModels(), function(model) {
              return _.deepClone(model.attributes);
            }));
          }
          dfd.resolve();
        }).fail(dfd.reject);
      });
      return dfd.promise();
    },
    clone: function() {
      var clone = new this.constructor(this.models, {
        node: this.node,
        autofetch: this.autofetch,
        autofetchEvent: this._autofetchEvent
      });
      clone.fetched = this.fetched;
      clone.error = this.error;
      return clone;
    }
  });
  NodeResourceMixin.mixin(VirtualDocumentChildren.prototype);
  var origSync = VirtualDocumentChildren.prototype.sync, origPrepareModel = VirtualDocumentChildren.prototype._prepareModel;
  _.extend(VirtualDocumentChildren.prototype, {
    _prepareModel: function(attrs, options) {
      var node = origPrepareModel.call(this, attrs, options);
      node.fetched = true;
      node[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP];
      return node;
    },
    _getUrlFromActionOrNode: function(node, linkrelId, actionSignature) {
      var url = actionSignature ? CommandHelper.getOriginalActionLink(node, actionSignature, linkrelId) : null;
      if (!url) {
        url = RestLinkrels.getLink(node.get("links"), linkrelId);
      }
      return url;
    },
    _getBaseUrl: function(node) {
      if (this.exploreAsSnapshot) {
        var url = this._getUrlFromActionOrNode(node, RestLinkrels.VD_SNAPSHOT_NODE_CHILDREN, "D2-OpenVDocSnapshot");
        if (!url) {
          url = this._getUrlFromActionOrNode(this.node, RestLinkrels.VD_SNAPSHOT_NODE_CHILDREN, "D2-OpenVDocSnapshot");
          if (!!url && node.get("id") !== this.node.get("id")) {
            var qParam = {};
            qParam[vdUtil.PROP_PARENT_VD_ID] = vdUtil.getParentVDId(node);
            url = Url.appendQuery(url, Url.combineQueryString(qParam));
          }
        }
        return url;
      } else {
        return this._getUrlFromActionOrNode(node, RestLinkrels.VD_NODE_CHILDREN, "D2-OpenVDoc");
      }
    },
    _getUrl: function(node, shouldExpandAll) {
      node = node || this.node;
      shouldExpandAll = _.isBoolean(shouldExpandAll) ? shouldExpandAll : false;
      var url = this._getBaseUrl(node), widgetPreference = this.node.get("widgetPreference"), qParams = {
        inline: true
      };
      qParams["expand-all"] = shouldExpandAll === true;
      if (widgetPreference) {
        qParams["widget-name"] = widgetPreference.widgetName;
      }
      return Url.appendQuery(url, Url.combineQueryString(qParams));
    },
    url: function() {
      return this._getUrl();
    },
    parse: function(response, options) {
      options = options || {};
      options[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP] || new Date().getTime();
      return _.isArray(response.entries) ? _.map(response.entries, function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, _.defaults(_.omit(obj, "properties", "base-permissions"), defaultVDMNumber, defaultParentVDMNumber));
        return obj;
      }) : [];
    },
    _parseAndAddSubtreeModels: function(parentNode, response, options) {
      options = options || {};
      options[vdUtil.MEM_TSTAMP] = new Date().getTime();
      response.entries = _.isArray(response.entries) ? response.entries : [];
      var rejectedEntries = [], me = this;
      log.debug("<------------------------------- {0} refresh cycle begin ---------------------------------\x3e", me.logPrefix) && console.log(log.last);
      log.debug("{0} - refreshing - {1}", me.logPrefix, vdUtil.getLogPrintableDetails(parentNode)) && console.log(log.last);
      log.debug("{0} - server response length {1}", me.logPrefix, response.entries.length) && console.log(log.last);
      if (response.entries.length) {
        var parentId = parentNode.get("id");
        response.entries = _.reject(response.entries, function(e) {
          var rejectable = e.content.properties["r_object_id"] === parentId;
          if (rejectable) {
            rejectedEntries.push(e);
          }
          return rejectable;
        });
      }
      var vdmPrefix = vdUtil.getVDMNumber(parentNode), children = me.getChildrenOf(parentNode) || [], existingChildrenRelations = [], snapshotExistingChildrenVDMs = [], removableChildren = [], addableChildren = [], updatableChildren = [], updateTimestampByVDMNumber = function(vdmNumber) {
        var existingModel = me.get(vdmNumber);
        if (existingModel) {
          existingModel[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP];
        }
      }, updateChildTimestampAndVDMNumberByRelation = function(relationId, vdmNumber) {
        var existingModel = _.find(children, function(c) {
          return vdUtil.getVDRelationId(c) === relationId;
        });
        if (existingModel) {
          var oldVDMNumber = vdUtil.getVDMNumber(existingModel);
          existingModel[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP];
          if (vdmNumber !== oldVDMNumber) {
            var subTree = me.getSubtreeOf(existingModel);
            _.each(subTree, function(c) {
              var vNumber = vdUtil.getVDMNumber(c), vParentNumber = vdUtil.getParentVDMNumber(c);
              var vNumberNew = vNumber.replace(oldVDMNumber, vdmNumber), vParentNumberNew = vParentNumber.replace(oldVDMNumber, vdmNumber), updateHash = {};
              c[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP];
              updateHash[vdUtil.PROP_VDM_NUMBER] = vNumberNew;
              updateHash[vdUtil.PROP_PARENT_VDM_NUMBER] = vParentNumberNew;
              c.set(updateHash);
            });
            me._byId[vdmNumber] = existingModel;
            existingModel.set(vdUtil.PROP_VDM_NUMBER, vdmNumber, {
              silent: true
            });
          }
        }
      }, logModels = function(models) {
        _.each(models, function(m) {
          log.debug("{0} - has - {1}", me.logPrefix, vdUtil.getLogPrintableDetails(m)) && console.log(log.last);
        });
      };
      if (!me.exploreAsSnapshot) {
        var currentChildrenRelations = _.map(response.entries, function(entry) {
          return entry.content[vdUtil.PROP_VD_RELATION_ID];
        });
        children = _.filter(children, function(childModel) {
          var relId = vdUtil.getVDRelationId(childModel), stays = _.contains(currentChildrenRelations, relId);
          if (stays) {
            existingChildrenRelations.push(relId);
          } else {
            log.debug("{0} - will remove relation - {1}", me.logPrefix, relId) && console.log(log.last);
            removableChildren.push(childModel);
          }
          return stays;
        });
      } else {
        _.each(children, function(childModel) {
          snapshotExistingChildrenVDMs.push(vdUtil.getVDMNumber(childModel));
        });
      }
      existingChildrenRelations.length && log.debug("{0} - existing relations to stay {1}", me.logPrefix, JSON.stringify(existingChildrenRelations)) && console.log(log.last);
      snapshotExistingChildrenVDMs.length && log.debug("{0} - existing snapshot vdms to stay {1}", me.logPrefix, JSON.stringify(snapshotExistingChildrenVDMs)) && console.log(log.last);
      if (removableChildren.length) {
        log.debug("{0} - entire collection state before remove - {1}", me.logPrefix, me.length) && console.log(log.last);
        logModels(this._getModels());
        this.remove(removableChildren);
      }
      _.each(response.entries, function(entry) {
        var content = entry.content, idx;
        var vdmNumber = content[vdUtil.PROP_VDM_NUMBER], relationId = content[vdUtil.PROP_VD_RELATION_ID];
        vdmNumber = (vdmPrefix !== defaultVDMNumber[vdUtil.PROP_VDM_NUMBER] ? vdmPrefix + PARENT_CHILD_VDM_NUMBER_SEPARATOR : "") + vdmNumber;
        content[vdUtil.PROP_VDM_NUMBER] = vdmNumber;
        content[vdUtil.PROP_PARENT_VDM_NUMBER] = vdmPrefix;
        if (!me.exploreAsSnapshot) {
          idx = _.indexOf(existingChildrenRelations, relationId);
          if (idx !== -1) {
            updatableChildren.push(entry);
            existingChildrenRelations.splice(idx, 1);
          } else {
            log.debug("{0} - will add relation - {1}", me.logPrefix, relationId) && console.log(log.last);
            addableChildren.push(entry);
          }
        } else {
          idx = _.indexOf(snapshotExistingChildrenVDMs, vdmNumber);
          if (idx !== -1) {
            updatableChildren.push(entry);
            snapshotExistingChildrenVDMs.splice(idx, 1);
          } else {
            log.debug("{0} - will add vdm - {1}", me.logPrefix, vdmNumber) && console.log(log.last);
            addableChildren.push(entry);
          }
        }
      });
      _.each(addableChildren.length ? updatableChildren.reverse() : updatableChildren, function(entry) {
        var content = entry.content, vdmNumber = content[vdUtil.PROP_VDM_NUMBER], relationId = content[vdUtil.PROP_VD_RELATION_ID];
        if (!me.exploreAsSnapshot) {
          updateChildTimestampAndVDMNumberByRelation(relationId, vdmNumber);
        } else {
          var existingModel = me._byId[vdmNumber];
          if (existingModel) {
            existingModel[vdUtil.MEM_TSTAMP] = options[vdUtil.MEM_TSTAMP];
          }
        }
      });
      _.each(addableChildren, function(entry) {
        var content = entry.content, vdmNumber = content[vdUtil.PROP_VDM_NUMBER];
        delete me._byId[vdmNumber];
      });
      _.each(rejectedEntries, function(entry) {
        var content = entry.content;
        content[vdUtil.PROP_VDM_NUMBER] = vdmPrefix;
        content[vdUtil.PROP_PARENT_VDM_NUMBER] = vdUtil.getParentVDMNumber(parentNode);
        content[vdUtil.PROP_PARENT_VD_ID] = vdUtil.getParentVDId(parentNode);
        if (vdmPrefix !== defaultVDMNumber[vdUtil.PROP_VDM_NUMBER]) {
          content[vdUtil.PROP_VD_RELATION_ID] = vdUtil.getVDRelationId(parentNode);
        }
        updateTimestampByVDMNumber(vdmPrefix);
      });
      log.debug("{0} - entire collection state before add/update - {1}", me.logPrefix, me.length) && console.log(log.last);
      logModels(this._getModels());
      this.add({
        entries: addableChildren
      }, _.extend({}, options, {
        parse: true,
        merge: true
      }));
      this.add({
        entries: updatableChildren
      }, _.extend({}, options, {
        parse: true,
        merge: true
      }));
      this.add({
        entries: rejectedEntries
      }, _.extend({}, options, {
        parse: true,
        merge: true
      }));
      log.debug("{0} - entire collection state after add/update - {1}", me.logPrefix, me.length) && console.log(log.last);
      logModels(this._getModels());
      log.debug("<------------------------------- {0} refresh cycle end ---------------------------------\x3e", me.logPrefix) && console.log(log.last);
    },
    _getModels: function() {
      return this.models;
    },
    sync: function(method, collection, options) {
      if (method !== "read") {
        throw new Error("Only fetching the vdoc children collection is supported");
      }
      var dfd = $.Deferred();
      options.vdFrameId = options.vdFrameId || this.node.get("id");
      options.vdFrameParentId = options.vdFrameParentId || options.vdFrameId;
      this.ensureWidgetConfig(method, collection, options).then(this.fetchNodeChildren.bind(this)).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    },
    ensureWidgetConfig: function(method, collection, options) {
      var dfd = $.Deferred(), widgetPreference = this.node.get("widgetPreference");
      if (widgetPreference) {
        dfd.resolve(method, collection, options);
      } else {
        this.node.resetWidgetPreference().done(function() {
          dfd.resolve(method, collection, options);
        }).fail(dfd.reject);
      }
      return dfd.promise();
    },
    fetchNodeChildren: function(method, collection, options) {
      var dfd = $.Deferred(), me = this, origSuccess = options.success, origError = options.error, widgetPreference = this.node.get("widgetPreference");
      if (widgetPreference) {
        collection.options || (collection.options = {});
        collection.options.widgetName = widgetPreference["widgetName"];
        collection.widgetType = widgetPreference["widgetType"];
      }
      options.success = function(response, status, xhr) {
        me.fetchNodeChildrenData(response, options).done(function() {
          origSuccess.call(options, response, status, xhr);
          if (me._vdExpandedView && me.node.columns.find({
            column_key: "wnd_comments"
          })) {
            var currentRepo = RestResources.getCurrentRepository(), url = Url.combine(RestLinkrels.getLink(currentRepo.get("links"), RestLinkrels.SELF), "comments-count");
            url = Url.appendQuery(url, Url.makeMultivalueParameter("object-ids", _.uniq(_.map(response.entries, function(entry) {
              return entry.content.id;
            }))));
            me.trigger("comments:request");
            $.ajax(me.node.connector.extendAjaxOptions({
              url: url,
              success: function(response) {
                _.each(response.entries, function(entry) {
                  var nodeModels = me.where({
                    id: entry.content.r_object_id
                  }), commentCount = entry.content.comments_count > 0 ? entry.content.comments_count : null;
                  _.each(nodeModels, function(node) {
                    node.set("wnd_comments", commentCount);
                  });
                });
                me.trigger("comments:sync");
              },
              error: function() {
                me.trigger("comments:error");
              }
            }));
          }
          dfd.resolve();
        }).fail(dfd.reject);
      };
      options.error = function() {
        origError.apply(options, arguments);
        dfd.reject(arguments[0]);
      };
      origSync.call(this, method, collection, options);
      return dfd.promise();
    },
    fetchNodeChildrenData: function(response, options) {
      var dfd = $.Deferred(), me = this, widgetPreference = this.node.get("widgetPreference"), widgetType = widgetPreference && widgetPreference.widgetConfig && widgetPreference.widgetConfig["widget_type"] || "", getUniqueIdsFromResponseEntries = function(entries) {
        return _.uniq(_.map(entries, function(entry) {
          return entry.content.properties.r_object_id;
        }));
      }, parentEntriesInResponse = [], childrenObjectRelationVDMTuples = {}, childrenEntriesInResponse = _.filter(response.entries, function(entry) {
        var content = entry.content, id = content.properties.r_object_id, relationId = content[vdUtil.PROP_VD_RELATION_ID], vdmNumber = content[vdUtil.PROP_VDM_NUMBER];
        if (id === options.vdFrameId) {
          parentEntriesInResponse.push(entry);
          if (options.vdFrameId === options.vdFrameParentId) {
            options.vdFrameRelationId = relationId;
          }
          return false;
        }
        childrenObjectRelationVDMTuples[vdUtil.createVDActionKey(id, relationId, vdmNumber)] = {
          id: id,
          relationId: relationId,
          vdmNumber: vdmNumber
        };
        return true;
      }), childIds = getUniqueIdsFromResponseEntries(childrenEntriesInResponse), parentIds = getUniqueIdsFromResponseEntries(parentEntriesInResponse), parentId = _.first(parentIds), queryUtilOptions = {
        ids: _.union(childIds, parentIds),
        connector: this.node.connector,
        permissions: {
          permissionLevel: "read"
        }
      };
      if (this._vdExpandedView) {
        _.extend(queryUtilOptions, {
          favorites: true,
          externalShare: true
        });
      }
      serverQueryUtils.fetchDataForObjects(queryUtilOptions).done(function(output) {
        _.each(response.entries, function(item) {
          var id = item.content.properties.r_object_id;
          var permission = output.permissions[id];
          item.content["base-permissions"] = permission ? _.clone(permission["base-permission"]) : {};
          item.content.properties.actions = [];
          if (item.content["base-permissions"].read === true) {
            if (!me.exploreAsSnapshot) {
              item.content.properties.actions.push({
                signature: "D2-OpenVDoc"
              });
            } else {
              var previewLink = _.findWhere(item.content.links, {
                rel: RestLinkrels.PREVIEW_URLS
              }), links = previewLink ? [ previewLink ] : [];
              item.content.properties.actions.push({
                signature: "Download",
                commandData: {
                  menuId: "clientSideVDSnapshotDownload"
                },
                links: links
              });
            }
            item.content.properties.actions.push({
              signature: "D2-ViewVDoc"
            });
            if (me._vdExpandedView) {
              item.content.properties.actions.push({
                signature: "D2-PreviewFormat",
                csuiNonPromotedAction: false,
                commandData: {
                  "preview-format": "pdf"
                }
              });
            }
          }
          if (output.favorites && output.favorites[id]) {
            item.content["favorite"] = output.favorites[id].favorite || false;
          }
          if (output.externalShare && output.externalShare[id]) {
            item.content.properties["externalShare"] = output.externalShare[id];
          }
        });
        dfd.resolve(response, options);
        if (!me.exploreAsSnapshot) {
          if (options.shouldExpandAll === true && childrenEntriesInResponse.length) {
            var groupOfChildren = _.groupBy(childrenEntriesInResponse, function(entry) {
              return entry.content[vdUtil.PROP_PARENT_VD_ID];
            });
            _.each(_.keys(groupOfChildren), function(groupParentId) {
              var pid = groupParentId === parentId ? groupParentId : null, nOptions = _.defaults({
                vdFrameId: groupParentId,
                vdFrameParentId: groupParentId
              }, options);
              childrenObjectRelationVDMTuples = {};
              _.each(groupOfChildren[groupParentId], function(entry) {
                var content = entry.content, id = content["id"] || content.properties.r_object_id, relationId = content[vdUtil.PROP_VD_RELATION_ID], vdmNumber = content[vdUtil.PROP_VDM_NUMBER], lastDotIndex = vdmNumber.lastIndexOf(PARENT_CHILD_VDM_NUMBER_SEPARATOR);
                if (lastDotIndex !== -1) {
                  vdmNumber = vdmNumber.substring(lastDotIndex + 1);
                }
                childrenObjectRelationVDMTuples[vdUtil.createVDActionKey(id, relationId, vdmNumber)] = {
                  id: id,
                  relationId: relationId,
                  vdmNumber: vdmNumber
                };
              });
              me.fetchActions(pid, childrenObjectRelationVDMTuples, nOptions, widgetType);
            });
          } else {
            me.fetchActions(parentId, childrenObjectRelationVDMTuples, options, widgetType);
          }
        }
      }).fail(dfd.reject);
      return dfd.promise();
    },
    getChildrenOf: function(parentNode, skipSorting) {
      var children = null;
      if (parentNode) {
        var parentId = parentNode.get("id"), parentVDMNumber = vdUtil.getVDMNumber(parentNode), isDefaultVDMNumber = parentVDMNumber === defaultVDMNumber[vdUtil.PROP_VDM_NUMBER];
        children = this.filter(function(model) {
          return vdUtil.getParentVDId(model) === parentId && (isDefaultVDMNumber || vdUtil.getVDMNumber(model).startsWith(parentVDMNumber));
        });
        if (skipSorting !== true) {
          children = _.sortBy(children, function(model) {
            return parseInt(vdUtil.getVDMNumber(model).replace(isDefaultVDMNumber ? "" : parentVDMNumber, "").replace(/\./, ""));
          });
        }
      }
      return children;
    },
    getSubtreeOf: function(vdNode, includeSelf, accumulator) {
      accumulator = _.isArray(accumulator) ? accumulator : [];
      var children = this.getChildrenOf(vdNode) || [];
      for (var i = 0; i < children.length; i++) {
        this.getSubtreeOf(children[i], true, accumulator);
      }
      if (includeSelf === true) {
        accumulator.push(vdNode);
      }
      return accumulator;
    },
    getSiblingsOf: function(vdNode, excludeSelf) {
      var children = [];
      if (vdNode) {
        var clause = {
          id: vdUtil.getParentVDId(vdNode)
        };
        clause[vdUtil.PROP_VDM_NUMBER] = vdUtil.getParentVDMNumber(vdNode);
        var parentNode = this.findWhere(clause);
        children = this.getChildrenOf(parentNode);
      }
      if (excludeSelf === true) {
        children = _.reject(children, function(c) {
          return c.get("id") === vdNode.get("id");
        });
      }
      return children;
    },
    removeAllChildrenOf: function(vdNode, includeSelf, options) {
      options = options || {};
      var children = this.getSubtreeOf(vdNode, includeSelf);
      log.warn("{0} - removing all direct & indirect children of - {1}", this.logPrefix, vdUtil.getLogPrintableDetails(vdNode)) && console.log(log.last);
      this.remove(children, {
        silent: options.silent === true
      });
    },
    removeGrandChildrenOf: function(vdNode, options) {
      options = options || {};
      var children = this.getSubtreeOf(vdNode, false);
      var grandChildren = _.reject(children, function(c) {
        return vdUtil.getParentVDId(c) === vdNode.get("id");
      });
      log.warn("{0} - removing all indirect children of - {1}", this.logPrefix, vdUtil.getLogPrintableDetails(vdNode)) && console.log(log.last);
      this.remove(grandChildren, {
        silent: options.silent === true
      });
    },
    fetchActions: function(parentVDId, childrenObjectRelationVDMTuples, options, widgetType) {
      var dfd = $.Deferred(), me = this, keyToRelMap = {}, menuType = this.exploreAsSnapshot ? constants.MenuTypes.VDOC_SNAPSHOT : constants.MenuTypes.VDOC, childrenIds = _.map(_.keys(childrenObjectRelationVDMTuples), function(actionKey) {
        return childrenObjectRelationVDMTuples[actionKey].id;
      }), queryUtilOptionsChildren = {
        ids: childrenIds,
        connector: this.node.connector,
        actions: {
          menuType: menuType,
          widgetType: widgetType,
          rulesType: "vdoc"
        }
      }, queryUtilOptionsParent = {
        ids: [ parentVDId ],
        connector: this.node.connector,
        actions: {
          menuType: menuType,
          widgetType: widgetType,
          rulesType: "vdoc"
        }
      }, updateActionsForNodes = function(nodesToBeUpdated, newActions) {
        _.each(nodesToBeUpdated, function(vdNode) {
          var nodeActions = _.union(vdNode.get("actions"), newActions);
          vdNode.set({
            actions: nodeActions
          });
          vdNode.trigger("actionsFetched");
        });
      }, updateVDModelsActions = function(output) {
        _.each(_.keys(output["actions"]), function(key) {
          var tuple = keyToRelMap[key], clause = {};
          if (!tuple || !tuple.relationId) {
            clause["id"] = tuple ? tuple.id : key;
          } else {
            clause[vdUtil.PROP_VD_RELATION_ID] = tuple.relationId;
          }
          log.debug("{0} - updating nodes with newly retreived actions for action-entry key {1}", me.logPrefix, key) && console.log(log.last);
          var nodesToBeUpdated = me.where(clause);
          if (nodesToBeUpdated.length) {
            updateActionsForNodes(nodesToBeUpdated, output["actions"][key]);
          } else {
            log.warn("{0} - retrieved actions are unmapable for action-entry key {1}", me.logPrefix, key) && console.log(log.last);
          }
          if (!!me.mirrorInstance && options.skipMergeWithMirrorOnFetch !== true) {
            log.debug("{0} - updating mirror nodes with newly retreived actions for action-entry key {1}", me.logPrefix, key) && console.log(log.last);
            nodesToBeUpdated = me.mirrorInstance.where(clause);
            if (nodesToBeUpdated.length) {
              updateActionsForNodes(nodesToBeUpdated, output["actions"][key]);
            } else {
              log.warn("{0} - retrieved actions are unmapable in mirror instance {1} for action-entry key {2}", me.logPrefix, me.mirrorInstance.logPrefix, key) && console.log(log.last);
            }
          }
        });
      };
      if (!this.exploreAsSnapshot) {
        var vdmNums = [], relationIds = [], frameActionKey = vdUtil.createVDActionKey(options.vdFrameId);
        _.each(_.keys(childrenObjectRelationVDMTuples), function(key) {
          var tuple = childrenObjectRelationVDMTuples[key];
          relationIds.push(tuple.relationId);
          vdmNums.push(tuple.vdmNumber);
          keyToRelMap[key] = tuple;
        });
        queryUtilOptionsChildren.actions[vdUtil.QUERY_VDM_NUMBERS] = vdmNums;
        queryUtilOptionsChildren.actions[vdUtil.QUERY_VD_RELATION_IDS] = relationIds;
        queryUtilOptionsChildren.actions[vdUtil.QUERY_PARAM_VD_FRAME_ID] = options.vdFrameId;
        if (options.vdFrameId !== options.vdFrameParentId) {
          queryUtilOptionsParent.actions[vdUtil.QUERY_VDM_NUMBERS] = [ options.vdFrameRelativeVDMNumber ];
          queryUtilOptionsParent.actions[vdUtil.QUERY_VD_RELATION_IDS] = [ options.vdFrameRelationId ];
          queryUtilOptionsParent.actions[vdUtil.QUERY_PARAM_VD_FRAME_ID] = options.vdFrameParentId;
          frameActionKey = vdUtil.createVDActionKey(options.vdFrameId, options.vdFrameRelationId, options.vdFrameRelativeVDMNumber);
        }
        keyToRelMap[frameActionKey] = {
          id: parentVDId,
          relationId: options.vdFrameRelationId,
          vdmNumber: options.vdFrameRelativeVDMNumber
        };
      }
      me.trigger("actions:request", me);
      serverQueryUtils.fetchDataForObjects(queryUtilOptionsParent).done(function(parentOutput) {
        updateVDModelsActions(parentOutput);
        if (childrenIds && childrenIds.length > 0) {
          serverQueryUtils.fetchDataForObjects(queryUtilOptionsChildren).done(function(output) {
            updateVDModelsActions(output);
            dfd.resolve();
          }).fail(dfd.reject);
        } else {
          dfd.resolve();
        }
      }).fail(dfd.reject);
      dfd.promise().done(function() {
        me.trigger("actions:sync", me);
      }).fail(function(e) {
        me.trigger("actions:error", me, e);
      });
      return dfd.promise();
    },
    _refresh: function(nodeToRefresh, options) {
      options = options || {};
      var me = this, dfd = $.Deferred(), promise = dfd.promise(), currentVDMNumber = vdUtil.getVDMNumber(nodeToRefresh);
      log.debug("{0} - refresh task, source - {1}", me.logPrefix, vdUtil.getLogPrintableDetails(nodeToRefresh)) && console.log(log.last);
      options.isSyncingDueToRefresh = true;
      if (currentVDMNumber === defaultVDMNumber[vdUtil.PROP_VDM_NUMBER] && options.force === true) {
        log.warn("{0} - refreshing forcefully, it will discard all existing children", me.logPrefix) && console.log(log.last);
        promise = this.fetch(options);
      } else {
        var replicas = me.where({
          id: nodeToRefresh.get("id")
        }), mirrorReplicas;
        log.debug("{0} - a total of {1} matching vd will receive update", me.logPrefix, replicas.length) && console.log(log.last);
        if (me.mirrorInstance) {
          mirrorReplicas = me.mirrorInstance.where({
            id: nodeToRefresh.get("id")
          });
          mirrorReplicas && log.debug("{0} - a total of {1} matching vd in mirror instance {2} will receive the same update", me.logPrefix, mirrorReplicas.length, me.mirrorInstance.logPrefix) && console.log(log.last);
        }
        var success = options.success, lastDotIndex = currentVDMNumber.lastIndexOf(PARENT_CHILD_VDM_NUMBER_SEPARATOR), syncOpts = {
          restartRequest: true,
          url: this._getUrl(nodeToRefresh),
          vdFrameId: nodeToRefresh.get("id"),
          vdFrameParentId: vdUtil.getParentVDId(nodeToRefresh),
          vdFrameRelativeVDMNumber: lastDotIndex === -1 ? currentVDMNumber : currentVDMNumber.substring(lastDotIndex + 1),
          vdFrameAbsoluteVDMNumber: currentVDMNumber,
          vdFrameRelationId: vdUtil.getVDRelationId(nodeToRefresh),
          success: function(response, status, xhr) {
            _.each(replicas, function(replica) {
              this._parseAndAddSubtreeModels(replica, _.deepClone(response), options);
            }.bind(this));
            _.each(mirrorReplicas, function(replica) {
              me.mirrorInstance._parseAndAddSubtreeModels(replica, _.deepClone(response), options);
            });
            _.isFunction(success) && success(response, status, xhr);
          }.bind(this)
        };
        this.sync("read", this, _.extend({}, options, syncOpts)).done(dfd.resolve).fail(dfd.reject);
      }
      return promise;
    },
    _createRefreshTask: function(nodeToRefresh, options, dfd) {
      var me = this;
      return {
        worker: function() {
          me._refresh(nodeToRefresh, options).done(dfd.resolve).fail(dfd.reject);
          return dfd.promise();
        }
      };
    },
    refresh: function(options) {
      var opt = options || {}, me = this, vdmNumber = _.isArray(opt.vdmNumber) ? opt.vdmNumber : _.isString(opt.vdmNumber) ? [ opt.vdmNumber ] : [], forceRefresh = options ? _.isBoolean(opt.force) ? opt.force : false : true, clause = {}, dfd = $.Deferred();
      log.debug("{0} - request to refresh with force: {1} for vdm: {2}", me.logPrefix, forceRefresh, JSON.stringify(vdmNumber)) && console.log(log.last);
      var nodes = _.chain(vdmNumber).uniq().sortBy(function(vdm) {
        if (vdm === defaultVDMNumber[vdUtil.PROP_VDM_NUMBER]) {
          return 0;
        } else {
          var match = vdm.match(/\./g);
          return 1 + (match ? match.length : 0);
        }
      }).reverse().map(function(vdm) {
        clause[vdUtil.PROP_VDM_NUMBER] = vdm;
        var node = me.findWhere(clause);
        if (!!node && vdUtil.isVirtualDoc(node)) {
          return node;
        } else {
          log.warn("{0) - cannot refresh key {1}", me.logPrefix, vdm) && console.log(log.last);
        }
        return null;
      }).compact().value();
      if (nodes && nodes.length) {
        var promises = _.map(nodes, function(node) {
          var deferred = $.Deferred();
          me.taskQueue.pending.add(me._createRefreshTask(node, opt, deferred));
          return deferred.promise();
        });
        $.whenAll.apply($, promises).done(function() {
          var similarToDriverNode = me.findWhere({
            i_chronicle_id: me.node.get("i_chronicle_id")
          });
          if (!!similarToDriverNode && similarToDriverNode.get("i_contents_id") !== me.node.get("i_contents_id")) {
            vdUtil.copyAttributesExceptVDPrivates(me.node, similarToDriverNode.attributes, {
              silent: true
            });
            me.node.trigger("sync");
          }
          dfd.resolve();
        }).fail(dfd.reject);
      } else if (forceRefresh) {
        me.taskQueue.pending.add(me._createRefreshTask(me.getVDRoot(), opt, dfd));
      } else {
        log.debug("{0} - ignored request to refresh", me.logPrefix) && console.log(log.last);
        dfd.resolve();
      }
      return dfd.promise();
    },
    getVDRoot: function() {
      return this.findWhere(defaultVDMNumber);
    }
  });
  return VirtualDocumentChildren;
});