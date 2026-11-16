/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "dctmw/lib/fancytree/jquery.fancytree", "css!d2/widgets/virtual.document.explorer/impl/fancytree.ext.vdoc" ], function($) {
  "use strict";
  $.ui.fancytree.registerExtension({
    name: "vdoc",
    version: "1.0.0",
    options: {
      highlighterClass: "fancytree-d2-highlight",
      highlightFromLevel: 2,
      multiSelectIndicatorClass: "fancytree-d2-multiselect",
      reservationIndicatorClass: "fancytree-d2-reserved",
      newItemIndicatorClass: "fancytree-d2-new-item",
      multiLevelSelectIndicatorClass: "fancytree-d2-multilevelselect",
      snapshotView: false
    },
    treeInit: function(ctx) {
      this._superApply(arguments);
      this.$container.addClass("fancytree-ext-vdoc");
      ctx.options["vdoc"].snapshotView && this.$container.addClass("fancytree-ext-vdoc-snapshot");
    },
    nodeRenderStatus: function(ctx) {
      var res, tree = ctx.tree, node = ctx.node, src = node.data.origNode, level = node.getLevel(), expanded = node.isExpanded(), extOpts = ctx.options["vdoc"], $ariaEl = $(node.tr || node.li);
      res = this._superApply(arguments);
      if (level > extOpts["highlightFromLevel"]) {
        $ariaEl.addClass(extOpts["highlighterClass"]);
      } else if (level === extOpts["highlightFromLevel"]) {
        if (expanded) {
          $ariaEl.addClass(extOpts["highlighterClass"]);
        } else {
          $ariaEl.removeClass(extOpts["highlighterClass"]);
        }
      }
      if (src) {
        if (src.get("reserved") === true) {
          $ariaEl.addClass(extOpts["reservationIndicatorClass"]);
        } else {
          $ariaEl.removeClass(extOpts["reservationIndicatorClass"]);
        }
        if (src.get("isLocallyCreated") === true) {
          $ariaEl.addClass(extOpts["newItemIndicatorClass"]);
        } else {
          $ariaEl.removeClass(extOpts["newItemIndicatorClass"]);
        }
      }
      if (tree.getSelectedNodes().length > 1) {
        var prevNode, sameParents = true;
        $.each(tree.getSelectedNodes(), function(index, node) {
          if (index > 0 && node.parent !== prevNode.parent) {
            sameParents = false;
            return false;
          }
          prevNode = node;
        }.bind(this));
        this.$container.addClass(extOpts["multiSelectIndicatorClass"]);
        sameParents ? this.$container.removeClass(extOpts["multiLevelSelectIndicatorClass"]) : this.$container.addClass(extOpts["multiLevelSelectIndicatorClass"]);
      } else {
        this.$container.removeClass(extOpts["multiSelectIndicatorClass"]);
        this.$container.removeClass(extOpts["multiLevelSelectIndicatorClass"]);
      }
      return res;
    },
    nodeSetExpanded: function(ctx, flag, options) {
      options = $.extend({}, options, {
        noEvents: false
      });
      return this._super(ctx, flag, options);
    },
    nodeClick: function(ctx) {
      var tree = ctx.tree, node = ctx.node, activeNode = tree.getActiveNode() || tree.getFirstChild(), selectedNodes = tree.getSelectedNodes(), eventStr = $.ui.fancytree.eventToString(ctx.originalEvent);
      switch (eventStr) {
       case "shift+click":
        $.each(selectedNodes, function(i, n) {
          if (n !== activeNode) {
            if (node.isBelowOf(activeNode)) {
              if (n.isBelowOf(node)) {
                n.setSelected(false);
              }
            } else {
              if (node.isBelowOf(n)) {
                n.setSelected(false);
              }
            }
          }
        });
        tree.visitRows(function(n) {
          n.setSelected();
          if (n === node) {
            return false;
          }
        }, {
          start: activeNode,
          reverse: activeNode.isBelowOf(node)
        });
        node.setFocus(true);
        return;

       case "ctrl+click":
       case "meta+click":
        if (!node.isActive()) {
          node.toggleSelected();
        }
        return;
      }
      return this._superApply(arguments);
    },
    nodeKeydown: function(ctx) {
      var tree = ctx.tree, focusNode = ctx.node, firstNode = tree.getFirstChild(), activeNode = tree.getActiveNode(), selectedNodes = tree.getSelectedNodes(), event = ctx.originalEvent, eventStr = $.ui.fancytree.eventToString(event), nextFocusableNode = null;
      switch (eventStr) {
       case "shift+home":
        $.each(selectedNodes, function(i, n) {
          if (n !== activeNode && focusNode.isBelowOf(activeNode) && n.isBelowOf(focusNode)) {
            n.setSelected(false);
          }
        });
        tree.visitRows(function(n) {
          nextFocusableNode = n;
          n.setSelected(true);
          if (n === firstNode) {
            return false;
          }
        }, {
          start: focusNode.isBelowOf(activeNode) ? focusNode : activeNode,
          reverse: true
        });
        break;

       case "shift+end":
        $.each(selectedNodes, function(i, n) {
          if (n !== activeNode && activeNode.isBelowOf(focusNode) && focusNode.isBelowOf(n)) {
            n.setSelected(false);
          }
        });
        tree.visitRows(function(n) {
          nextFocusableNode = n;
          n.setSelected(true);
        }, {
          start: activeNode.isBelowOf(focusNode) ? focusNode : activeNode
        });
        break;

       case "shift+up":
        $.each(selectedNodes, function(i, n) {
          if (n !== activeNode && focusNode.isBelowOf(activeNode) && n.isBelowOf(focusNode)) {
            n.setSelected(false);
          }
        });
        if (focusNode.isBelowOf(activeNode)) {
          focusNode.setSelected(false);
          tree.visitRows(function(n) {
            if (!nextFocusableNode && focusNode.isBelowOf(n)) {
              nextFocusableNode = n;
              return false;
            }
            n.setSelected(false);
          }, {
            start: focusNode,
            reverse: true
          });
        } else {
          tree.visitRows(function(n) {
            n.setSelected(true);
            if (focusNode.isBelowOf(n)) {
              nextFocusableNode = n;
              return false;
            }
          }, {
            start: activeNode,
            reverse: true
          });
        }
        break;

       case "shift+down":
        $.each(selectedNodes, function(i, n) {
          if (n !== activeNode && activeNode.isBelowOf(focusNode) && focusNode.isBelowOf(n)) {
            n.setSelected(false);
          }
        });
        if (activeNode.isBelowOf(focusNode)) {
          focusNode.setSelected(false);
          tree.visitRows(function(n) {
            if (!nextFocusableNode && n.isBelowOf(focusNode)) {
              nextFocusableNode = n;
              return false;
            }
            n.setSelected(false);
          }, {
            start: focusNode
          });
        } else {
          tree.visitRows(function(n) {
            n.setSelected(true);
            if (n.isBelowOf(focusNode)) {
              nextFocusableNode = n;
              return false;
            }
          }, {
            start: activeNode
          });
        }
        break;
      }
      if (nextFocusableNode) {
        nextFocusableNode.setFocus(true);
        event.preventDefault();
        event.stopPropagation();
      }
      return this._superApply(arguments);
    }
  });
  return $.ui.fancytree;
});