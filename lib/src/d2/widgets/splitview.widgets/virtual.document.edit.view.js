/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "d2/widgets/virtual.document.explorer/virtual.document.structure.view", "d2/widgets/virtual.document.explorer/vd.treenode.icon.view", "d2/utils/vdoc.utils", "d2/utils/rest.linkrels", "d2/utils/constants", "csui/utils/commands", "csui/models/fileuploads", "i18n!d2/commands/nls/localized.strings", "css!d2/controls/tree/impl/node.tree", "css!d2/widgets/virtual.document.explorer/impl/virtual.document.structure", "dctmw/lib/fancytree/jquery.fancytree.table", "dctmw/lib/fancytree/jquery.fancytree.dnd5", "d2/widgets/virtual.document.explorer/impl/fancytree.ext.vdoc" ], function(require, $, _, Url, VDocStructureView, TreeViewWithNodeIcon, vdUtil, RestLinkrels, constants, Commands, UploadFileCollection, lang) {
  "use strict";
  var VDocSplitView = VDocStructureView.extend({
    className: "d2-tree-panel d2-vd-structure d2-vd-edit-structure",
    constructor: function VDocSplitView(options) {
      options = options || {};
      this.isVDEditView = true;
      VDocSplitView.__super__.constructor.call(this, options);
    },
    _renderVDTree: function() {
      let options = {};
      options.showAdditionalColumns = true;
      options.snapshotView = this.snapshotView;
      if (!this.$el.parent().length || !this.collection.fetched || this.isBusy) {
        return;
      }
      this.trigger("render:begin");
      if (!this.treeView) {
        this.treeView = new TreeViewWithNodeIcon(_.extend(this._buildTreeOptions(options), options));
        this.isBusy = true;
        this.treeRegion.show(this.treeView);
        this.treeView.$el.off(this.evtIdInlineMenuCreate).on(this.evtIdInlineMenuCreate, "tr", _.throttle(this._createInlineMenu.bind(this), 300));
        this.treeView.$el.off(this.evtIdInlineMenuDestroy).on(this.evtIdInlineMenuDestroy, "tr", this._destroyInlineMenu.bind(this));
      } else {
        this.blockActions();
        this.treeView.tree.reload().always(this.unblockActions.bind(this));
      }
    },
    getDnD: function() {
      let parentDnDOptions = VDocSplitView.__super__.getDnD.call(this), origDragDrop = parentDnDOptions.dragDrop;
      var me = this;
      parentDnDOptions.preventForeignNodes = false;
      parentDnDOptions.onDragEnter = function(targetNode, data) {
        if (me.options.isForComparing) {
          return false;
        }
        return {
          before: targetNode !== data.tree.getFirstChild(),
          over: !targetNode.data.origNode.isVirtualDoc() || !vdUtil.hasVDChildren(targetNode.data.origNode),
          after: targetNode !== data.tree.getFirstChild() && (data.otherNode ? !targetNode.isLastSibling() : true)
        };
      };
      parentDnDOptions.dragDrop = function(node, data) {
        if (data.otherNode && node.tree === data.otherNode.tree) {
          origDragDrop.call(this, node, data);
        } else {
          var draggedData = null;
          if (node.tree !== data.otherNode?.tree && data.otherNode instanceof $.ui.fancytree._FancytreeNodeClass) {
            draggedData = {
              nodes: [ {
                i_chronicle_id: data.otherNode.data.origNode.get("i_chronicle_id"),
                mime_type: data.otherNode.data.origNode.get("mime_type"),
                modify_date: data.otherNode.data.origNode.get("modify_date"),
                name: data.otherNode.data.origNode.get("name"),
                type_name: data.otherNode.data.origNode.get("type_name")
              } ]
            };
          } else {
            draggedData = JSON.parse(data.dataTransfer.getData("draggedData"));
          }
          me.blockActions();
          me.editVD(node, data, draggedData, data.hitMode === "over").done(function(res) {
            me._showEditVdStatus(res, draggedData);
            me.unblockActions();
          }).fail(function(errMessage) {
            me.unblockActions();
            require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
              GlobalMessage.showMessage("error", errMessage);
            });
          });
        }
      };
      return parentDnDOptions;
    },
    _showEditVdStatus: function(status, draggedData) {
      if (!status || !status["operation-status"]) return;
      let operationStatus = status["operation-status"];
      var queueItems = draggedData.nodes.map(function(item) {
        let status = operationStatus.find(stat => item["i_chronicle_id"] === stat["chronicle-id"]);
        return {
          name: item.name,
          state: status["rest-error"] ? "rejected" : "resolved",
          errorMessage: status["rest-error"]?.message,
          count: 1,
          total: 1
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: this.connector
      });
      require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        GlobalMessage.showProgressPanel(nodeCollection, {
          oneFileSuccess: lang.AddVDOneItemSuccessMessage,
          multiFileSuccess: lang.AddVDManyItemsSuccessMessage,
          oneFileFailure: lang.AddVDOneItemFailureMessage,
          multiFileOneFailure: lang.AddVDManyItemsOneFailureMessage,
          multiFileFailure: lang.AddVDManyItemsFailureMessage
        });
      });
    },
    editVD(node, data, dragData, dropOver) {
      let parent;
      if (dropOver || node.isTopLevel()) {
        parent = data.node.data.origNode;
        if (dragData.nodes.length == 1 && !node.isTopLevel()) {
          this.unblockActions();
          let replaceAddVdocCmd = Commands.get("D2-AddReplaceVdoc");
          return replaceAddVdocCmd.execute({
            dragData: dragData,
            targetNode: parent,
            data: data
          }).done(res => {
            this._refreshNodes([ data.node.parent ]);
          });
        } else {
          return this.addNodeToVd(node, parent, dragData.nodes, false);
        }
      } else {
        parent = data.node.parent.data.origNode;
        return this.addNodeToVd(node, parent, dragData.nodes, true, data.hitMode);
      }
    },
    _fetchAllImmediateParents: function(nodes) {
      var parentNodes = [];
      _.each(nodes, function(node) {
        node.parent && parentNodes.indexOf(node.parent) === -1 && parentNodes.push(node.parent);
      });
      return parentNodes;
    },
    addNodeToVd(node, parentNode, childNodes, performOrdering, hitMode) {
      let href = RestLinkrels.getLink(parentNode.get("links"), RestLinkrels.ADD_VIRTUAL_DOCUMENT_NODES), deferred = $.Deferred(), qParams = {}, payload = {}, me = this;
      qParams["inline"] = true;
      qParams["suppress-checkout-warning"] = true;
      payload["virtual-document-nodes"] = childNodes.map(item => {
        return {
          "chronicle-id": item["i_chronicle_id"]
        };
      });
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      var nodesToRefresh = node.isTopLevel() ? [ node ] : me._fetchAllImmediateParents([ node ]);
      $.ajax(parentNode.connector.extendAjaxOptions({
        url: href,
        type: "POST",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(result) {
          if (performOrdering && !node.isLastSibling()) {
            me.orderTheAddedVDNodes(result, childNodes, node, parentNode, hitMode);
          }
          me._refreshNodes(nodesToRefresh).then(function() {
            if (node.isTopLevel()) node.setExpanded();
            deferred.resolve(result, node.parent);
          });
        },
        error: function(result) {
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    },
    orderTheAddedVDNodes: function(result, childNodes, node, parentNode, hitMode) {
      let me = this;
      let payload = {
        "virtual-document-nodes": []
      }, beforeNodeRelationId, targetParentId;
      payload["virtual-document-nodes"] = childNodes.map(item => {
        let relation = result.entries.find(entry => entry.content.properties.i_chronicle_id === item["i_chronicle_id"]);
        return {
          "relation-id": relation.content["relation-id"]
        };
      });
      beforeNodeRelationId = hitMode === "before" ? vdUtil.getVDRelationId(node.data.origNode) : vdUtil.getVDRelationId(node.getNextSibling().data.origNode);
      targetParentId = parentNode.get("id");
      let href = RestLinkrels.getLink(parentNode.get("links"), RestLinkrels.VD_MOVE_NODES), qParams = {
        inline: true,
        "target-parent-id": targetParentId,
        "insert-before-node": beforeNodeRelationId
      }, deferred = $.Deferred(), nodesInvolved = [ node ], nodesToRefresh = this._fetchAllImmediateParents(nodesInvolved);
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      $.ajax(node.data.origNode.connector.extendAjaxOptions({
        url: href,
        type: "PATCH",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(result) {
          me._refreshNodes(nodesToRefresh).then(function() {
            deferred.resolve(result, node.parent);
          });
        },
        error: function(result) {
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    },
    _adjustVersionDisplay: function() {
      if (this.displayVersionColumn || this.isVDEditView) {
        this.$el.addClass("show-versions");
      } else {
        this.$el.removeClass("show-versions");
      }
    }
  });
  return VDocSplitView;
});