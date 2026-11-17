/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "i18n", "nuc/models/node/node.model", "nuc/utils/base", "dctmw/controls/tree/tree.sprites", "dctmw/lib/fancytree/jquery.fancytree", "dctmw/controls/tree/impl/fancytree.overrides", "dctmw/controls/tree/impl/fancytree.dnd5.keyboard", "dctmw/lib/fancytree/jquery.fancytree.dnd5", "css!dctmw/controls/tree/impl/tree" ], function($, _, Marionette, i18n, NodeModel, base, TreeSprites) {
  "use strict";
  const treeNodePropertiesToUseInIconMatch = [ "statusNodeType", "_isLoading", "_error", "data", "checkbox", "expanded", "extraClasses", "folder", "icon", "iconTooltip", "key", "lazy", "partsel", "refKey", "selected", "title", "tooltip", "type", "unselectable", "unselectableIgnore", "unselectableStatus", "children" ];
  return Marionette.ItemView.extend({
    template: false,
    className: "d4-tree",
    constructor: function TreeView(options = {}) {
      const optionsToPick = [ "activate", "beforeActivate", "click", "clickPaging", "collapse", "dblclick", "expand", "focus", "init", "keydown", "lazyLoad", "source", "strings", "renderNode" ];
      const dctmwDNDOptions = [ "onDragStart", "onDragEnd", "onDragDrag", "onDragEnter", "onDragOver", "onDragLeave", "onDragExpand", "onDragDrop", "dropNodeParentClass", "dropNodeClass", "dragNodeClass", "dragImageClass", "dragImageNodeCountClass", "dragImageBackLayerClass", "expandBeforeDrop", "dropNodesSortComparator" ];
      if (_.isArray(options.extensions)) {
        options.extensions.forEach(e => optionsToPick.push(e));
      }
      Marionette.ItemView.prototype.constructor.call(this, _.omit(options, optionsToPick));
      options.dnd5 = _.extend(this._defaultDndOptions(options.dnd5), _.omit(options.dnd5, dctmwDNDOptions));
      options["dnd5-keyboard"] = _.extend({}, options["dnd5-keyboard"]);
      this.treeOptions = _.extend(_.pick(options, optionsToPick), {
        escapeTitles: true,
        extensions: [ "d4-overrides", ...options.extensions || [] ],
        "d4-overrides": {
          rootIndent: 4,
          levelIndent: 24,
          levelIndentOnErrorNode: options.levelIndentOnErrorNode !== false
        },
        rtl: i18n && i18n.settings && i18n.settings.rtl,
        autoActivate: false,
        icon: function(event, data) {
          let treeNode = data.node, node = treeNode.data.origNode;
          if (!node) {
            node = new NodeModel({
              id: treeNode.key,
              _is_home_cabinet: treeNode.data._is_home_cabinet,
              statusNodeType: treeNode.statusNodeType
            });
          }
          return TreeSprites.findClassByNode(node) || TreeSprites.findClassByTreeNode(_.pick(treeNode, treeNodePropertiesToUseInIconMatch)) || false;
        }
      });
    },
    onBeforeRender: function() {
      this.tree = $.ui.fancytree.getTree(this.$el.fancytree(this.treeOptions));
    },
    onBeforeDestroy: function() {
      this.tree?.widget?.destroy();
      this.$el.find("#fancytree-drop-marker").remove();
    },
    _defaultDndOptions: function(dndOptions = {}) {
      var me = this, DROP_NODE_PARENT_CLASS = dndOptions.dropNodeParentClass || "d4-tree-drop-parent", DROP_NODE_CLASS = dndOptions.dropNodeClass || "d4-tree-drop-node", DRAG_NODE_CLASS = dndOptions.dragNodeClass || "d4-tree-drag-node", DRAG_IMAGE_CLASS = dndOptions.dragImageClass || "d4-tree-drag-image", DRAG_IMAGE_NODE_COUNT_CLASS = dndOptions.dragImageNodeCountClass || "d4-tree-drag-image-node-count", DRAG_IMAGE_BACK_LAYER_CLASS = dndOptions.dragImageBackLayerClass || "d4-tree-drag-image-back-layer";
      return {
        autoExpandMS: 800,
        dropMarkerInsertOffsetX: -16,
        dropMarkerOffsetX: -28,
        dropMarkerParent: this.$el,
        dropEffectDefault: "move",
        multiSource: false,
        preventForeignNodes: true,
        preventNonNodes: true,
        preventRecursiveMoves: true,
        preventVoidMoves: true,
        scroll: true,
        scrollSensitivity: 15,
        scrollSpeed: 15,
        setTextTypeJson: false,
        dragStart: function(sourceNode, data) {
          var sourceNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ sourceNode ];
          sourceNodeList = sourceNodeList.includes(sourceNode) ? sourceNodeList : [ sourceNode ];
          if (sourceNodeList.find(node => node.isStatusNode())) {
            return false;
          }
          var allowDrag = _.isFunction(dndOptions.onDragStart) ? dndOptions.onDragStart(sourceNode, data) : true;
          allowDrag && sourceNodeList.forEach(node => $(node.tr || node.span).addClass(DRAG_NODE_CLASS));
          return allowDrag;
        },
        dragEnd: function(sourceNode, data) {
          var sourceNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ sourceNode ];
          sourceNodeList = sourceNodeList.includes(sourceNode) ? sourceNodeList : [ sourceNode ];
          sourceNodeList.forEach(node => $(node.tr || node.span).removeClass(DRAG_NODE_CLASS));
          me.$el.find("." + DROP_NODE_PARENT_CLASS).removeClass(DROP_NODE_PARENT_CLASS);
          me.$el.find("." + DROP_NODE_CLASS).removeClass(DROP_NODE_CLASS);
          _.isFunction(dndOptions.onDragEnd) && dndOptions.onDragEnd(sourceNode, data);
        },
        dragDrag: function(sourceNode, data) {
          _.isFunction(dndOptions.onDragDrag) && dndOptions.onDragDrag(sourceNode, data);
        },
        dragEnter: function(targetNode, data) {
          var allowDrop = true, selectedNodeList = [];
          if (data.otherNode) {
            selectedNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ data.otherNode ];
            selectedNodeList = selectedNodeList.includes(data.otherNode) ? selectedNodeList : [ data.otherNode ];
          }
          if (targetNode.isStatusNode() || dndOptions.preventRecursiveMoves !== false && !!selectedNodeList.find(node => targetNode.isDescendantOf(node))) {
            allowDrop = false;
          }
          allowDrop = allowDrop && (_.isFunction(dndOptions.onDragEnter) ? dndOptions.onDragEnter(targetNode, data) : true);
          !allowDrop && me.$el.find("#fancytree-drop-marker").hide();
          return allowDrop;
        },
        dragOver: function(targetNode, data) {
          if (dndOptions.preventVoidMoves !== false && data.otherNode) {
            var selectedNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ data.otherNode ];
            selectedNodeList = selectedNodeList.includes(data.otherNode) ? selectedNodeList : [ data.otherNode ];
            selectedNodeList.forEach(node => {
              if (node == targetNode || data.hitMode === "before" && node.getNextSibling() === targetNode || data.hitMode === "after" && node.getPrevSibling() === targetNode || data.hitMode === "over" && node.parent === targetNode && node.isLastSibling()) {
                data.hitMode = null;
              }
            });
            if (data.hitMode === null) {
              return;
            }
          }
          me.$el.find("." + DROP_NODE_PARENT_CLASS).removeClass(DROP_NODE_PARENT_CLASS);
          me.$el.find("." + DROP_NODE_CLASS).removeClass(DROP_NODE_CLASS);
          data.hitMode === "over" ? $(targetNode.tr || targetNode.span).addClass(DROP_NODE_PARENT_CLASS) : $(targetNode.parent.tr || targetNode.parent.span).addClass(DROP_NODE_PARENT_CLASS);
          $(targetNode.tr || targetNode.span).addClass(DROP_NODE_CLASS);
          _.isFunction(dndOptions.onDragOver) && dndOptions.onDragOver(targetNode, data);
        },
        dragLeave: function(targetNode, data) {
          me.$el.find("." + DROP_NODE_PARENT_CLASS).removeClass(DROP_NODE_PARENT_CLASS);
          me.$el.find("." + DROP_NODE_CLASS).removeClass(DROP_NODE_CLASS);
          _.isFunction(dndOptions.onDragLeave) && dndOptions.onDragLeave(targetNode, data);
        },
        dragExpand: function(targetNode, data) {
          return _.isFunction(dndOptions.onDragExpand) ? dndOptions.onDragExpand(targetNode, data) : true;
        },
        dragDrop: function(targetNode, data) {
          var performMove = function() {
            var dropCallbackPromise = _.isFunction(dndOptions.onDragDrop) ? dndOptions.onDragDrop(targetNode, data) : $.Deferred().resolve().promise();
            var selectedNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ data.otherNode ];
            selectedNodeList = selectedNodeList.includes(data.otherNode) ? selectedNodeList : [ data.otherNode ];
            selectedNodeList = _.clone(selectedNodeList);
            selectedNodeList.sort(_.isFunction(dndOptions.dropNodesSortComparator) ? dndOptions.dropNodesSortComparator : () => {});
            dropCallbackPromise.done(() => selectedNodeList.forEach(node => node.moveTo(targetNode, data.hitMode)));
          };
          data.hitMode === "over" && dndOptions.expandBeforeDrop !== false ? targetNode.setExpanded().done(performMove) : performMove();
        },
        dragImage: function(sourceNode, data) {
          var selectedNodeList = dndOptions.multiSource ? data.tree.getSelectedNodes() : [ sourceNode ];
          selectedNodeList = selectedNodeList.includes(sourceNode) ? selectedNodeList : [ sourceNode ];
          var $dragImage = $(_.str.sformat('<div class="{0}"></div>', DRAG_IMAGE_CLASS)).html((sourceNode.tr || sourceNode.span).outerHTML), $node = $dragImage.find("> tr, > span"), multiSelect = selectedNodeList.length > 1;
          multiSelect && $node.append($(_.str.sformat('<div class="{0}">{1}</div><div class="{2}"></div>', DRAG_IMAGE_NODE_COUNT_CLASS, selectedNodeList.length, DRAG_IMAGE_BACK_LAYER_CLASS)));
          $dragImage.appendTo(me.$el);
          setTimeout(() => $dragImage.remove());
          base.isFirefox() && $node.css({
            width: "295px",
            "max-width": "295px"
          });
          var offsetX = i18n && i18n.settings?.rtl ? base.isFirefox() ? $node.outerWidth() - 5 : $dragImage.width() - 5 : 5, offsetY = multiSelect ? 25 : 14;
          data.dataTransfer.setDragImage && data.dataTransfer.setDragImage($dragImage[0], offsetX, offsetY);
        }
      };
    }
  });
});