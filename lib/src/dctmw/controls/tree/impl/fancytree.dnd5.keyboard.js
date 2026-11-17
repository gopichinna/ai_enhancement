/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/lib/fancytree/jquery.fancytree" ], function($, _) {
  "use strict";
  var hitModes = [ "before", "over", "after" ], hitModeDropMarkerClasses = {
    before: "fancytree-drop-before",
    over: "fancytree-drop-over",
    after: "fancytree-drop-after"
  };
  function getDndMode(data) {
    return data.tree.ext["dnd5-keyboard"].dndMode;
  }
  function setDndMode(data, enabled) {
    data.tree.ext["dnd5-keyboard"].dndMode = !!enabled;
  }
  function getHitMode(data) {
    return data.tree.ext["dnd5-keyboard"].hitMode;
  }
  function setHitMode(data, value) {
    data.tree.ext["dnd5-keyboard"].hitMode = value;
  }
  function setDragImagePosition($dragImage, data, hitMode) {
    var $targetElement = $(data.node.tr || data.node.span).find("span.fancytree-title"), imageOffsetX = data.options.dnd5.dropMarkerOffsetX || 0, imageOffsetY = hitMode === "after" ? $targetElement.outerHeight() / 2 : hitMode === "before" ? -($targetElement.outerHeight() / 2) : 0, rtl = data.options.rtl, offsetString = n => {
      return n === 0 ? "" : n > 0 ? "+" + n : "" + n;
    }, position = $.ui.fancytree.fixPositionOptions({
      my: (rtl ? "right" : "left") + offsetString(rtl ? -imageOffsetX : imageOffsetX) + " top" + offsetString(imageOffsetY),
      at: (rtl ? "right" : "left") + " center",
      of: $targetElement,
      collision: "none fit"
    });
    $dragImage.position(position);
  }
  function addDragImage(data, dataTransfer) {
    var options = data.options["dnd5-keyboard"];
    if (!options.dragImage) {
      return;
    }
    var $targetElement = $(data.node.tr || data.node.span).find("span.fancytree-title"), $dragImage = _.isFunction(options.dragImage) ? options.dragImage(_.extend(data, {
      nodes: getDragNodes(data)
    })) : $(dataTransfer.getDragImage()).clone();
    $dragImage.addClass(options.dragImageKBClass).css({
      height: $targetElement.outerHeight()
    }).prependTo(data.tree.$container);
    setDragImagePosition($dragImage, data);
  }
  function moveDragImageToNode(data, hitMode) {
    var options = data.options["dnd5-keyboard"];
    if (!options.dragImage) {
      return;
    }
    var $dragImage = data.tree.$container.find("." + options.dragImageKBClass);
    setDragImagePosition($dragImage, data, hitMode);
  }
  function removeDragImage(data) {
    var options = data.options["dnd5-keyboard"];
    if (!options.dragImage) {
      return;
    }
    data.tree.$container.find("." + options.dragImageKBClass).remove();
  }
  function createEvent(type, data, hitMode) {
    var target = data.node.tr || data.node.span, relPosY = hitMode === "after" ? .76 : hitMode === "before" ? .24 : .5, dataTransfer = {
      types: [ "", "application/x-fancytree-node" ],
      setData: () => {},
      getData: () => {},
      setDragImage: dragImage => {
        dataTransfer.dragImage = dragImage;
      },
      getDragImage: () => {
        return dataTransfer.dragImage;
      }
    };
    return {
      type: type,
      dataTransfer: dataTransfer,
      pageY: relPosY * $(target).height() + $(target).offset().top,
      originalEvent: {},
      stopPropagation: () => {},
      preventDefault: () => {}
    };
  }
  function getDragNodes(data) {
    var dragNodeList = [];
    data.tree.visit(node => {
      node && node.dragStartKeyboard && dragNodeList.push(node);
      return true;
    });
    return dragNodeList;
  }
  function clearStylesAndDeactivateDndMode(data) {
    if (!getDndMode(data)) {
      return;
    }
    onFocusOutNode(data);
    removeDragImage(data);
    getDragNodes(data).forEach(dragNode => {
      $(dragNode.tr || dragNode.span).trigger(createEvent("dragend", {
        node: dragNode
      }));
      $(dragNode.tr || dragNode.span).removeClass(data.options["dnd5-keyboard"].dragNodeKBClass);
      dragNode.dragStartKeyboard = false;
    });
    setDndMode(data, false);
    setHitMode(data, null);
  }
  function checkDropSupport(data, hitMode) {
    data && data.node && $(data.node.tr || data.node.span).trigger(createEvent("dragleave", data));
    return data && data.node && $.event.trigger(createEvent("dragenter", data, hitMode), undefined, data.node.tr || data.node.span) === false && $.event.trigger(createEvent("dragover", data, hitMode), undefined, data.node.tr || data.node.span) === false;
  }
  function moveHitMode(data, direction, checkCurrentHitMode) {
    var index = hitModes.indexOf(getHitMode(data)), node = data.node, moveHitModeFn = hitMode => {
      if (checkDropSupport(data, hitMode) && $(data.options.dnd5.dropMarkerParent).find("#fancytree-drop-marker").hasClass(hitModeDropMarkerClasses[hitMode])) {
        moveDragImageToNode(data, hitMode);
        $(node.tr || node.span).addClass(data.options["dnd5-keyboard"].dropNodeKBClass);
        node.dragOverKeyboard = true;
        setHitMode(data, hitMode);
        return false;
      }
      return true;
    };
    node.dragOverKeyboard = false;
    if (index !== -1) {
      direction === "up" && hitModes.slice(0, checkCurrentHitMode ? index + 1 : index).reverse().every(moveHitModeFn);
      direction === "down" && hitModes.slice(checkCurrentHitMode ? index : index + 1).every(moveHitModeFn);
    }
  }
  function onFocusOutTree(event, tree) {
    clearStylesAndDeactivateDndMode({
      tree: tree,
      node: $.ui.fancytree.getNode(event),
      options: tree.options
    });
  }
  function onBeforeExpandCollapseNode(event, data) {
    if (!getDndMode(data) || !data.node?.isExpanded()) {
      return;
    }
    var node = data.node, hasDragNodes = false;
    node.visit(childNode => {
      hasDragNodes = !!childNode.dragStartKeyboard;
      return !hasDragNodes;
    });
    hasDragNodes && clearStylesAndDeactivateDndMode(data);
  }
  function onClickNode(event, data) {
    clearStylesAndDeactivateDndMode(_.extend(_.clone(data), {
      node: data.tree.focusNode
    }));
  }
  function onFocusNode(event, data) {
    if (!getDndMode(data)) {
      return;
    }
    setHitMode(data, getHitMode(data) || "over");
    moveHitMode(data, getHitMode(data) === "after" ? "up" : "down", true);
    if (!data.node.dragOverKeyboard) {
      setHitMode(data, null);
      moveDragImageToNode(data, "over");
    }
  }
  function onFocusOutNode(data) {
    if (!getDndMode(data)) {
      return;
    }
    if (data && data.node) {
      $(data.node.tr || data.node.span).trigger(createEvent("dragleave", data));
      $(data.node.tr || data.node.span).removeClass(data.options["dnd5-keyboard"].dropNodeKBClass);
      data.node.dragOverKeyboard = false;
    }
  }
  function onKeyDownNode(event, data) {
    var tree = data.tree, node = data.node, dndOptions = data.options.dnd5, options = data.options["dnd5-keyboard"];
    if ((event.which === 13 || event.which === 32) && event.ctrlKey && !getDndMode(data)) {
      var dragStartEvent = createEvent("dragstart", data);
      if (node && $.event.trigger(dragStartEvent, undefined, node.tr || node.span)) {
        event.stopPropagation();
        event.preventDefault();
        var dragNodeList = dndOptions.multiSource ? tree.getSelectedNodes() : [ node ];
        dragNodeList = dragNodeList.includes(node) ? dragNodeList : [ node ];
        dragNodeList.forEach(dragNode => {
          if (dragNode) {
            $(dragNode.tr || dragNode.span).addClass(options.dragNodeKBClass);
            dragNode.dragStartKeyboard = true;
          }
        });
        setDndMode(data, true);
        addDragImage(data, dragStartEvent.dataTransfer);
        onFocusNode(event, data);
      }
      return;
    }
    if (!getDndMode(data)) {
      return;
    }
    if (event.which === 27) {
      clearStylesAndDeactivateDndMode(data);
    }
    if (event.which === 38 || event.which === 40) {
      moveHitMode(data, event.which === 38 ? "up" : "down");
      if (node.dragOverKeyboard) {
        event.stopPropagation();
        event.preventDefault();
      } else {
        setHitMode(data, event.which === 38 ? "after" : "before");
      }
    }
    if (event.which === 13 || event.which === 32) {
      event.stopPropagation();
      event.preventDefault();
      if (checkDropSupport(data, getHitMode(data))) {
        removeDragImage(data);
        $(data.node.tr || data.node.span).trigger(createEvent("drop", data, getHitMode(data)));
        clearStylesAndDeactivateDndMode(data);
      }
    }
  }
  $.ui.fancytree.registerExtension({
    name: "dnd5-keyboard",
    version: "1.0.0",
    options: {
      dragNodeKBClass: "d4-tree-drag-kb-node",
      dropNodeKBClass: "d4-tree-drop-kb-node",
      dragImageKBClass: "d4-tree-drag-kb-image",
      dragImage: true
    },
    _getDndMode: getDndMode,
    _setDndMode: setDndMode,
    _getHitMode: getHitMode,
    _setHitMode: setHitMode,
    _setDragImagePosition: setDragImagePosition,
    _addDragImage: addDragImage,
    _moveDragImageToNode: moveDragImageToNode,
    _removeDragImage: removeDragImage,
    _createEvent: createEvent,
    _getDragNodes: getDragNodes,
    _clearStylesAndDeactivateDndMode: clearStylesAndDeactivateDndMode,
    _checkDropSupport: checkDropSupport,
    _onFocusOutTree: onFocusOutTree,
    _onBeforeExpandCollapseNode: onBeforeExpandCollapseNode,
    _onClickNode: onClickNode,
    _onFocusNode: onFocusNode,
    _onFocusOutNode: onFocusOutNode,
    _onKeyDownNode: onKeyDownNode,
    nodeRenderStatus: function(ctx = {}) {
      var res = this._super(ctx), tree = ctx.tree, node = ctx.node;
      if (getDndMode({
        tree: tree
      })) {
        if (node && node.dragStartKeyboard) {
          $(node.tr || node.span).trigger(createEvent("dragstart", {
            node: node
          }));
        }
        if (node && node.dragOverKeyboard) {
          $(node.tr || node.span).trigger(createEvent("dragleave", {
            node: node
          }));
          $(node.tr || node.span).trigger(createEvent("dragenter", {
            node: node
          }, getHitMode({
            tree: tree
          })));
          $(node.tr || node.span).trigger(createEvent("dragover", {
            node: node
          }, getHitMode({
            tree: tree
          })));
        }
        node !== tree.focusNode && onFocusOutNode({
          tree: tree,
          node: node,
          options: ctx.options
        });
      }
      return res;
    },
    treeInit: function(ctx) {
      var FT = $.ui.fancytree, tree = ctx.tree, ext = tree.ext["dnd5-keyboard"];
      if (!tree.ext["dnd5"]) {
        $.error("Extension 'dnd5' is required.");
      }
      FT.overrideMethod(ctx.options, "keydown", (event, data) => {
        !getDndMode(data) && ext._super.call(this, event, data);
        if (event.isPropagationStopped()) {
          return;
        }
        onKeyDownNode(event, data);
      }, ext);
      FT.overrideMethod(ctx.options, "focus", (event, data) => {
        ext._super.call(this, event, data);
        if (event.isPropagationStopped()) {
          return;
        }
        onFocusNode(event, data);
      }, ext);
      FT.overrideMethod(ctx.options, "click", (event, data) => {
        ext._super.call(this, event, data);
        if (event.isPropagationStopped()) {
          return;
        }
        onClickNode(event, data);
      }, ext);
      tree.$container.on("focusout", event => {
        onFocusOutTree(event, tree);
      });
      FT.overrideMethod(ctx.options, "beforeExpand", (event, data) => {
        ext._super.call(this, event, data);
        if (event.isPropagationStopped()) {
          return;
        }
        onBeforeExpandCollapseNode(event, data);
      }, ext);
      this._superApply(arguments);
    }
  });
  return $.ui.fancytree;
});