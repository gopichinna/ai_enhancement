/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import RestResources from "dctmw/utils/rest.resources";

import vdTreeIconView from "d2/widgets/virtual.document.explorer/vd.treenode.icon.view";

import vdUtil from "d2/utils/vdoc.utils";

import VDocChildrenFactory from "d2/utils/contexts/factories/virtual.document.children.factory";

import NodeSpriteCollection from "csui/utils/nodesprites";

import TaskAttachmentsTableTreeTemplate from "hbs!d2/widgets/task.details/impl/task.files.list/task.attachments.tabletree/task.attachments.table.tree";

import lang from "i18n!d2/widgets/task.details/impl/nls/lang";

import PubSub from "csui/controls/form/pub.sub";

import "dctmw/lib/fancytree/jquery.fancytree.table";

import "css!d2/widgets/task.details/impl/task.files.list/task.attachments.tabletree/task.attachments.table.tree";

class TaskAttachmentsTableTreeView extends vdTreeIconView {
  static _selectedObjId = undefined;
  template = TaskAttachmentsTableTreeTemplate;
  className() {
    return "d2-task-attachments-table-tree d4-tree";
  }
  constructor(attachmentsView) {
    super();
    this.attachmentsView = attachmentsView;
    this.showOnlyNameCol = this.attachmentsView.options.model.get("contentViewOptions")?.showOnlyNameCol;
    this.tableTreeOptions = this._buildTreeOptions();
    super.setTreeOptions(this.tableTreeOptions);
  }
  templateHelpers() {
    return {
      nameHeader: lang.nameHeader,
      titleHeader: lang.titleHeader,
      authorHeader: lang.authorHeader,
      hideNonNameCols: !this.showOnlyNameCol,
      hideHeader: this.showOnlyNameCol,
      isListView: this.showOnlyNameCol
    };
  }
  _buildTreeOptions() {
    const me = this;
    return {
      source: function() {
        const collection = me.attachmentsView.collection;
        const result = [];
        for (let i = 0; i < collection.models.length; i++) {
          const currentNode = collection.models[i];
          const hasVDChildren = vdUtil.hasVDChildren(currentNode);
          if (vdUtil.isVirtualDoc(currentNode)) {
            currentNode.set("vdm-number", "0");
          }
          if (me.attachmentsView.isMultipackage && !me.showOnlyNameCol) {
            if (currentNode.get("package")) {
              const packageNode = {
                title: currentNode.get("package"),
                packageObj: currentNode.get("package-obj"),
                origNode: currentNode,
                isPackage: true,
                folder: false,
                isDocAttached: !(currentNode.get("name") === undefined || currentNode.get("name") === null)
              };
              result.push(packageNode);
            }
          }
          if (!currentNode.get("isEmptyPackage")) {
            const fancyTreeNode = {
              key: me._getKeyForVDNode(currentNode),
              vdmNumber: vdUtil.getVDMNumber(currentNode),
              origNode: currentNode,
              title: currentNode.get("name"),
              folder: hasVDChildren,
              lazy: hasVDChildren
            };
            result.push(fancyTreeNode);
          }
        }
        return result;
      },
      init: function(event, data) {
        const treeNode = data.tree;
        let currentNode = treeNode.rootNode.children.filter(node => {
          return !node.data?.isPackage && node.data?.origNode.get("id") === TaskAttachmentsTableTreeView._selectedObjId;
        }).at(0);
        if (!currentNode) {
          if (treeNode.getFirstChild()?.data?.isPackage) {
            currentNode = treeNode.rootNode.children.at(1);
          } else {
            currentNode = treeNode.getFirstChild();
          }
        }
        treeNode.visit(function(node) {
          if (!node.isPackage) {
            node.setExpanded(true);
          }
        });
        if (currentNode && !currentNode.data.isPackage) {
          currentNode.setActive(true);
          currentNode.setSelected(true);
          currentNode.data.origNode.widgetDetails = {
            widgetName: me.attachmentsView.collection?.widgetPreference?.widgetName,
            widgetType: me.attachmentsView.collection?.widgetPreference?.widgetType
          };
          me.attachmentsView.options?.originatingView?.taskDetailsView?.trigger("add:mini:viewer", currentNode.data.origNode || null);
        }
      },
      lazyLoad: function(event, data) {
        const dfd = $.Deferred();
        me.attachmentsView.blockActions();
        const originalNode = data.node.data.origNode;
        const originalNodeId = originalNode.get("id");
        const repoName = RestResources.getCurrentRepository().get("name");
        originalNode.get("links").push({
          rel: "http://identifiers.emc.com/linkrel/d2-vd-nodes",
          href: `/repositories/${repoName}/objects/${originalNodeId}/d2-vd-nodes`
        });
        me._fetchNodeChildren(data.node.data.origNode).done(function(result) {
          let data = {};
          data = result.at(0)?.origNode.collection.filter(model => model.get("id") === TaskAttachmentsTableTreeView._selectedObjId).at(0);
          PubSub.trigger("refresh:taskPage:metadataView", me, data);
          dfd.resolve(result);
        }).fail(dfd.reject).always(me.attachmentsView.unblockActions.bind(me.attachmentsView));
        data.result = dfd.promise();
      },
      expand: function(event, data) {
        if (data.node.data.isPackage) {
          return false;
        }
        me.trigger("node:expand", data.node.data.origNode);
      },
      collapse: function(event, data) {
        if (data.node.data.isPackage) {
          return false;
        }
        me.trigger("node:collapse", data.node.data.origNode);
        data.node.resetLazy();
      },
      click: function(event, data) {
        if (data.node.data.isPackage) {
          return false;
        }
        const target = $(event.originalEvent?.target);
        if (!event.shiftKey) {
          data.tree.activateKey(false, {
            noEvents: true
          });
        }
        if (target.closest(".d2-inline-row-action").length === 0) {
          data.node.data.origNode.widgetDetails = {
            widgetName: me.attachmentsView.collection?.widgetPreference?.widgetName,
            widgetType: me.attachmentsView.collection?.widgetPreference?.widgetType
          };
          me.attachmentsView.options?.originatingView?.taskDetailsView?.trigger("add:mini:viewer", data.node.data.origNode || null);
        }
        TaskAttachmentsTableTreeView._selectedObjId = data.node.data.origNode.get("id");
      },
      activate: function(event, data) {
        if (data.node.data.isPackage) {
          return false;
        }
        const tree = data.tree;
        const treeNode = data.node;
        const key = treeNode.key;
        const origNode = treeNode.data.origNode;
        tree._currActiveNodeKey = key;
        tree.ignoreSelectionEvents = true;
        const deselectableNodes = _.reject(tree.getSelectedNodes(), function(tn) {
          return tn.key === key;
        }) || [];
        if (deselectableNodes.length) {
          _.each(deselectableNodes, function(tn) {
            tn.setSelected(false);
          });
        }
        treeNode.setSelected(true);
        tree.ignoreSelectionEvents = false;
        me.attachmentsView.additionalPanelsView && me.attachmentsView.additionalPanelsView.trigger("select:item", me.attachmentsView, origNode);
      },
      icon: function(event, data) {
        if (data.node.data.isPackage) {
          return false;
        } else {
          if (data.node.data.origNode) {
            var nodeSprite = NodeSpriteCollection.findByNode(data.node.data.origNode);
            return nodeSprite && (_.result(nodeSprite.attributes, "className") || _.result(data.node.data.origNode.attributes, "image_url")) || "";
          }
        }
      },
      renderColumns: function(event, data) {
        const treeNode = data.node, fancyTreeNodeData = treeNode.data, $tr = $(treeNode.tr), $tdList = $tr.find(">td");
        if (fancyTreeNodeData.isPackage && !me.showOnlyNameCol) {
          $tr.addClass("package-row");
          const packageName = fancyTreeNodeData?.packageObj?.name;
          const isMandatory = fancyTreeNodeData?.packageObj?.is_mandatory;
          const isDocAttached = fancyTreeNodeData?.isDocAttached;
          $tdList.eq(0).attr("colspan", $tdList.length).html(`
            <div class="package-container">
              ${lang.packageNameHeader} :
              ${isMandatory ? '<span class="mandatory">*</span>' : ""}
              <span class="package-name">${packageName}</span>
            </div>`);
          const $inlinePackageRowActionContainer = $('<span class="d2-inline-package-row-action"></span>');
          $inlinePackageRowActionContainer.data("key", treeNode.key);
          if (!isDocAttached) {
            $tdList.eq(0).append($inlinePackageRowActionContainer);
          }
          treeNode.setSelected(false);
          treeNode.setActive(false);
          $tdList.slice(1).remove();
        } else {
          const node = fancyTreeNodeData.origNode;
          $tdList.eq(0).find(".fancytree-title").addClass("d2-overflow-tooltip");
          const $inlineRowActionContainer = $('<span class="d2-inline-row-action"></span>');
          $inlineRowActionContainer.data("key", treeNode.key);
          $tdList.eq(0).append($inlineRowActionContainer);
          const docTitle = node.get("title") || "";
          const docAuthor = node.get("modify_user_id") || "";
          $tdList.eq(1).html(`<span class='d2-overflow-tooltip'>${docTitle}</span>`);
          $tdList.eq(2).html(`<span class='d2-overflow-tooltip'>${docAuthor}</span>`);
        }
      },
      loadChildren: function(event, data) {
        data.node.children?.forEach(node => {
          if (!node.data.isPackage && node.data.origNode?.get("id") === TaskAttachmentsTableTreeView._selectedObjId) {
            node.setActive(true);
            node.setSelected(true);
          }
        });
      },
      "d4-overrides": {
        skipNodeRenderStatus: node => {
          return node.data.isPackage === true;
        }
      }
    };
  }
  onActivateSelf() {
    if (this.attachmentsView) {
      this.attachmentsView.filesListRegion?.empty();
      this.attachmentsView._setupFilesTableTreeView();
      this.attachmentsView._showFilesTableTreeView();
    }
  }
  _fetchNodeChildren(parentNode, stopWithSuccess) {
    const dfd = $.Deferred();
    this.vdChildren = this.attachmentsView.options.context.getCollection(VDocChildrenFactory, {
      attributes: {
        id: parentNode.get("id")
      },
      options: {
        node: parentNode,
        exploreAsSnapshot: false
      }
    });
    this.vdChildren.fetch().then(() => {
      const children = this.vdChildren.getChildrenOf(parentNode);
      if (_.isEmpty(children)) {
        if (stopWithSuccess === true) {
          dfd.resolve([]);
        } else {
          this.vdChildren.refresh({
            vdmNumber: vdUtil.getVDMNumber(parentNode),
            silent: true
          }).then(this._fetchNodeChildren.bind(this, parentNode, true)).done(dfd.resolve).fail(dfd.reject);
        }
      } else {
        dfd.resolve(_.map(children, this._createFirstLevelExpandableTreeNode.bind(this)));
      }
    });
    return dfd.promise();
  }
  _createFirstLevelExpandableTreeNode(node) {
    let vdmNumber = vdUtil.getVDMNumber(node);
    let isExpandable = vdmNumber === "0";
    return {
      key: this._getKeyForVDNode(node),
      vdmNumber: vdmNumber,
      origNode: node,
      title: node.get("name"),
      folder: isExpandable,
      lazy: isExpandable
    };
  }
  _getKeyForVDNode(node) {
    return node.cid;
  }
}

export default TaskAttachmentsTableTreeView;