/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/default.action/default.action.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/controls/listitem/inline.menu.view", "nuc/utils/log", "nuc/utils/url", "nuc/utils/base", "csui/utils/nodesprites", "dctmw/controls/tree/tree.view", "d2/controls/table/cells/version/version.view", "d2/models/virtual.document.children", "d2/widgets/virtual.document.explorer/impl/vdoc.command.controller.mixin", "d2/widgets/virtual.document.explorer/vd.treenode.icon.view", "d2/utils/vdoc.utils", "d2/utils/rest.linkrels", "d2/utils/constants", "csui/models/fileuploads", "hbs!d2/controls/tree/impl/node.tree", "hbs!d2/widgets/virtual.document.explorer/impl/virtual.document.tree.table", "i18n!d2/commands/nls/localized.strings", "css!d2/controls/tree/impl/node.tree", "css!d2/widgets/virtual.document.explorer/impl/virtual.document.structure", "dctmw/lib/fancytree/jquery.fancytree.table", "dctmw/lib/fancytree/jquery.fancytree.dnd5", "d2/widgets/virtual.document.explorer/impl/fancytree.ext.vdoc" ], function(require, module, $, _, Backbone, Marionette, TabableRegionBehavior, DefaultActionBehavior, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin, BlockingView, InlineMenuView, log, Url, base, NodeSpriteCollection, TreeView, NodestableVersionCellView, VirtualDocumentChildren, VDocCommandControllerMixin, TreeViewWithNodeIcon, vdUtil, RestLinkrels, constants, UploadFileCollection, template, templateTreeTable, lang) {
  "use strict";
  log = log(module.id);
  var VDTreeVersionCellView = NodestableVersionCellView.extend({
    tagName: "div",
    constructor: function VDTreeVersionCellView() {
      NodestableVersionCellView.prototype.constructor.apply(this, arguments);
      this.isCommandActive = false;
    },
    onRender: function() {
      this.$el.addClass(NodestableVersionCellView.columnClassName);
    }
  });
  var VDocStructureView = Marionette.LayoutView.extend({
    className: "d2-tree-panel d2-vd-structure",
    template: template,
    regions: {
      treeRegion: ".d2-tree-container"
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      PerfectScrolling: {
        contentParent: "> .d2-tree-container",
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },
    constructor: function VDocStructureView(options) {
      options = options || {};
      if (!(options.collection instanceof VirtualDocumentChildren)) {
        throw new Error("virtual.document.structure requires a virtual.document.children collection to be set at options");
      }
      this.context = options.context;
      this.connector = options.connector || this.context && this.context.getObject("connector");
      this.selectedNodes = options.selectedNodes instanceof Backbone.Collection ? options.selectedNodes : new Backbone.Collection();
      this.displayVersionColumn = _.isBoolean(options.displayVersionColumn) ? options.displayVersionColumn : false;
      this.renderExpanded = _.isBoolean(options.renderExpanded) ? options.renderExpanded : false;
      this.snapshotView = _.isBoolean(options.snapshotView) ? options.snapshotView : false;
      this.evtIdInlineMenuCreate = "mouseenter.inline_menu_" + this.cid;
      this.evtIdInlineMenuDestroy = "mouseleave.inline_menu_" + this.cid;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.defaultActionController.actionItems = this.options.defaultActionItems;
      this.defaultActionController.commands = this.options.defaultActionCommands;
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "request", this.blockActions).listenTo(this.collection, "reset", this._onCollectionReset).listenTo(this.collection, "sync", this._renderVDTree).listenTo(this.collection, "sync error", this.unblockActions).listenTo(this.collection, "change", this._onCollectionModelChange).listenTo(this.collection, "remove", this._onCollectionModelRemove).listenTo(this.collection, "children:added", this._onChildrenAdded);
      if (this.collection.fetching) {
        this.blockActions();
      }
    },
    _onCollectionReset: function() {
      if (this.treeView) {
        this.treeView.tree.clear();
      }
    },
    _onCollectionModelChange: function(model) {
      log.debug("<--------------------- VDT update cycle begin ------------------------\x3e") && console.log(log.last);
      log.debug("Trigger source - {0}", vdUtil.getLogPrintableDetails(model)) && console.log(log.last);
      var models = this.collection.where({
        id: model.get("id")
      });
      _.each(models, function(m) {
        if (m !== model) {
          vdUtil.copyAttributesExceptVDPrivates(m, model.changed, {
            silent: true
          });
        }
      });
      log.debug("Found {0} similar nodes", models.length) && console.log(log.last);
      if (this.treeView) {
        this.blockActions();
        var me = this, tree = me.treeView.tree;
        _.chain(models).map(function(m) {
          log.debug("Update - {0}", vdUtil.getLogPrintableDetails(m)) && console.log(log.last);
          return tree.getNodeByKey(me._getKeyForVDNode(m));
        }).compact().each(function(ftNode) {
          var data = ftNode.data, node = data.origNode, wasExpanded = ftNode.isExpanded(), wasLazy = ftNode.isLazy(), ftNewNodeDetails = me._createTreeNode(node);
          log.debug("VDT before - k: {0}, v: {1}, name: {2}, l: {3}, e: {4}", ftNode.key, data.vdmNumber, ftNode.title, wasLazy, wasExpanded) && console.log(log.last);
          ftNode.applyPatch(ftNewNodeDetails);
          _.extend(ftNode, ftNewNodeDetails, {
            expanded: wasExpanded
          });
          if (!wasExpanded && _.isArray(ftNode.children) && !ftNode.children.length) {
            ftNode.children = null;
          }
          ftNode.render(true);
          log.debug("VDT after - k: {0}, v: {1}, name: {2}, l: {3}, e: {4}", ftNode.key, data.vdmNumber, ftNode.title, ftNode.isLazy(), ftNode.isExpanded()) && console.log(log.last);
          var isLazy = ftNode.isLazy();
          if (wasExpanded && isLazy) {
            var uiChildren = ftNode.getChildren(), uiChildrenKeys = _.map(uiChildren, function(uc) {
              return uc.key;
            }), modelChildren = me.collection.getChildrenOf(node), prevIdx = 0, prevSibling = null;
            if (modelChildren.length > uiChildren.length) {
              _.each(modelChildren, function(childModel) {
                var key = me._getKeyForVDNode(childModel);
                var idx = _.indexOf(uiChildrenKeys, key);
                if (idx !== -1) {
                  prevSibling = ftNode.getChildren()[idx];
                  prevIdx = idx + 1;
                } else {
                  var fNode = me._createTreeNode(childModel);
                  if (prevSibling) {
                    fNode = prevSibling.appendSibling(fNode);
                  } else {
                    fNode = ftNode.addNode(fNode, "firstChild");
                  }
                  prevSibling = fNode;
                  uiChildrenKeys.splice(prevIdx, 0, key);
                  log.debug("VDT add - k: {0}, v: {1}, name: {2}, l: {3}, e: {4}, at: {5}", fNode.key, fNode.data.vdmNumber, fNode.title, fNode.isLazy(), fNode.isExpanded(), prevIdx) && console.log(log.last);
                  prevIdx++;
                }
              });
            }
          }
        });
        this.unblockActions();
      }
      log.debug("<--------------------- VDT update cycle end ------------------------\x3e") && console.log(log.last);
    },
    _onCollectionModelRemove: function(model) {
      log.debug("<--------------------- VDT remove cycle begin ------------------------\x3e") && console.log(log.last);
      log.debug("Trigger source - {0}", vdUtil.getLogPrintableDetails(model)) && console.log(log.last);
      var clause = {
        id: model.get("id")
      };
      clause[vdUtil.PROP_PARENT_VD_ID] = vdUtil.getParentVDId(model);
      clause[vdUtil.PROP_VD_RELATION_ID] = vdUtil.getVDRelationId(model);
      var models = [ model ].concat(this.collection.where(clause) || []);
      log.debug("Found {0} similar nodes", models.length) && console.log(log.last);
      if (this.treeView) {
        this.blockActions();
        var me = this, tree = me.treeView.tree;
        _.chain(models).map(function(m) {
          log.debug("Remove - {0}", vdUtil.getLogPrintableDetails(m)) && console.log(log.last);
          return tree.getNodeByKey(me._getKeyForVDNode(m));
        }).compact().each(function(ftNode) {
          log.debug("VDT rem - k: {0}, v: {1}, name: {2}, l: {3}, e: {4}", ftNode.key, ftNode.data.vdmNumber, ftNode.title, ftNode.isLazy(), ftNode.isExpanded()) && console.log(log.last);
          ftNode.remove();
        });
        this.unblockActions();
      }
      this.collection.remove(models, {
        silent: true
      });
      log.debug("<--------------------- VDT remove cycle end ------------------------\x3e") && console.log(log.last);
    },
    _onChildrenAdded: function(vdmNumber) {
      if (this.treeView && vdmNumber) {
        var node = this.collection.get(vdmNumber), ftNode = node && this.treeView.tree.getNodeByKey(this._getKeyForVDNode(node));
        ftNode && ftNode.setExpanded(true);
      }
    },
    onRender: function() {
      if (base.isIE11()) {
        this.$el.addClass("fix-msie");
      }
      this.$el.find(".d2-tree-container").addClass("fancytree-grid-container");
    },
    onShow: function() {
      this._adjustVersionDisplay();
      this._renderVDTree();
    },
    _renderVDTree: function() {
      let options = {};
      if (!this.$el.parent().length || !this.collection.fetched || this.isBusy) {
        return;
      }
      this.trigger("render:begin");
      if (!this.treeView) {
        this.treeView = new TreeViewWithNodeIcon(_.extend(this._buildTreeOptions(options), {
          snapshotView: this.snapshotView
        }));
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
      let me = this, DRAG_OVER_STAMP = null;
      let dnd5 = {
        autoExpandMS: 800,
        dropMarkerInsertOffsetX: 0,
        effectAllowed: "all",
        dropEffectDefault: "move",
        multiSource: true,
        preventForeignNodes: true,
        preventNonNodes: false,
        preventRecursion: true,
        preventSameParent: false,
        preventVoidMoves: false,
        scroll: true,
        scrollSensitivity: 15,
        scrollSpeed: 15,
        setTextTypeJson: false,
        dragStart: function(node, data) {
          var selectedNodes = data.tree.getSelectedNodes(), allowDrag = true, sameParent = true;
          if (node === data.tree.getFirstChild()) {
            allowDrag = false;
          } else {
            if (_.contains(selectedNodes, node)) {
              var prevNode;
              $.each(selectedNodes, function(index, selectedNode) {
                if (index > 0 && prevNode.parent !== selectedNode.parent) {
                  sameParent = false;
                  return false;
                }
                prevNode = selectedNode;
              });
            } else {
              selectedNodes = [ node ];
            }
            allowDrag = sameParent;
            allowDrag && _.each(selectedNodes, function(selectedNode) {
              !$(selectedNode.tr).hasClass("drag-start") && $(selectedNode.tr).addClass("drag-start");
            });
          }
          return allowDrag;
        },
        dragImage: function(node, data) {
          if (data.options.dnd5.dragStart(node, data)) {
            var selectedNodes = data.tree.getSelectedNodes(), singleItem = _.contains(selectedNodes, node) ? selectedNodes.length <= 1 : true, nodeCount = selectedNodes.length, content = node.tr.outerHTML, $dragImage = $('<div class="drag-item"></div>').html(content), $tdList = $dragImage.find("tr > td"), $tr = $dragImage.find("tr");
            $tdList.eq(0).find("span.fancytree-node").css("padding-left", "16px");
            $tdList.eq(1).remove();
            $tdList.eq(2).remove();
            $tdList.eq(3).remove();
            $tr.removeClass("drag-start");
            $tr.hasClass("fancytree-active") && $tr.removeClass("fancytree-active");
            $tr.hasClass("fancytree-level-2") && $tr.removeClass("fancytree-level-2");
            !singleItem && $tr.addClass("multiple-drag") && $tr.append($('<div class="node-count">' + nodeCount + '</div><div class="back-layer"></div>'));
            $dragImage.appendTo(node.tr.parentElement);
            setTimeout(function() {
              $dragImage.remove();
            });
            if (base.isEdge()) {
              $dragImage.css({
                top: "-80px",
                height: "51px",
                width: "335px"
              });
              data.dataTransfer.setDragImage && data.dataTransfer.setDragImage($dragImage[0], 0, 0);
            } else {
              if (base.isFirefox()) {
                $dragImage.css("width", "240px");
                $dragImage.find("tr").css("width", "235px");
                $dragImage.find(".back-layer").css("width", "235px");
              }
              data.dataTransfer.setDragImage && data.dataTransfer.setDragImage($dragImage[0], 5, 25);
            }
          }
        },
        dragEnd: function(node, data) {
          var selectedNodes = data.tree.getSelectedNodes();
          selectedNodes = _.contains(selectedNodes, node) ? selectedNodes : [ node ];
          _.each(selectedNodes, function(selectedNode) {
            $(selectedNode.tr).removeClass("drag-start");
          });
          $("body").find("#fancytree-drop-marker").css("top", "-5px");
          $(node.tr.parentElement).find("tr").removeClass("drag-over");
        },
        dragEnter: function(node, data) {
          var selectedNodes = data.tree.getSelectedNodes(), allowDrop = true;
          if (node === data.tree.getFirstChild()) {
            allowDrop = false;
          } else if (_.contains(selectedNodes, data.otherNode)) {
            allowDrop = !_.contains(selectedNodes, node);
            allowDrop && $.each(selectedNodes, function(index, selectedNode) {
              if (_.contains(me._fetchAllParentNodes(node), selectedNode)) {
                allowDrop = false;
                return false;
              }
            });
          }
          return allowDrop && data.otherNode !== node;
        },
        dragOver: function(node, data) {
          var dndOpts = data.options.dnd5;
          if (!node.expanded && node.hasChildren() !== false && data.hitMode === "over") {
            if (!DRAG_OVER_STAMP) {
              DRAG_OVER_STAMP = Date.now();
            } else if (dndOpts.autoExpandMS && Date.now() - DRAG_OVER_STAMP > dndOpts.autoExpandMS && (!dndOpts.dragExpand || dndOpts.dragExpand(node, data) !== false)) {
              node.setExpanded();
            }
          } else {
            DRAG_OVER_STAMP = null;
          }
          me.$dropMarker = me.$dropMarker || $("body").find("#fancytree-drop-marker");
          if (data.hitMode === "over" && !(vdUtil.hasVDChildren(node.data.origNode) && node.data.origNode.isVirtualDoc())) {
            data.hitMode = "after";
            me.dropOver = true;
            !me.$dropMarker.hasClass("drop-marker-hide") && me.$dropMarker.addClass("drop-marker-hide");
            !$(node.tr).hasClass("drag-over") && $(node.tr.parentElement).find("tr").removeClass("drag-over") && $(node.tr).addClass("drag-over");
          } else {
            if (data.hitMode === "over") {
              data.hitMode = "after";
            }
            me.dropOver = false;
            me.$dropMarker.hasClass("drop-marker-hide") && me.$dropMarker.removeClass("drop-marker-hide");
            !$(node.parent.tr).hasClass("drag-over") && $(node.tr.parentElement).find("tr").removeClass("drag-over") && $(node.parent.tr).addClass("drag-over");
          }
          me._setDropMarkerWidth(node);
        },
        dragLeave: function(node) {
          if (DRAG_OVER_STAMP) {
            DRAG_OVER_STAMP = null;
          }
          $(node.tr.parentElement).find("tr").removeClass("drag-over");
        },
        dragDrop: function(node, data) {
          var selectedNodes = data.tree.getSelectedNodes(), samePosition = false, setSelected = true;
          if (!_.contains(selectedNodes, data.otherNode)) {
            selectedNodes = [ data.otherNode ];
            setSelected = false;
            samePosition = (node.getPrevSibling() === data.otherNode && data.hitMode === "before" || node.getNextSibling() === data.otherNode && data.hitMode === "after") && me.dropOver === false;
          } else {
            $.each(selectedNodes, function(index, selectedNode) {
              if (node.getNextSibling() === selectedNode && data.hitMode === "after" && me.dropOver === false) {
                samePosition = true;
                return false;
              }
            });
          }
          if (!samePosition) {
            me.blockActions();
            me._performMoveAction(node, selectedNodes, data).done(function(result, targetNode) {
              if (setSelected) {
                me._setSelectedNodes(selectedNodes, targetNode);
              }
              me._checkNodeStatus(selectedNodes, result);
              me.unblockActions();
            }).fail(function(errMessage) {
              _.each(selectedNodes, function(selectedNode) {
                selectedNode.errorMessage = errMessage;
              });
              me._showErrorMessage(selectedNodes, 0);
              me.unblockActions();
            });
          }
        }
      };
      return dnd5;
    },
    _buildTreeOptions: function(options) {
      var me = this, triggerSelectionChange = _.throttle(function() {
        me.selectedNodes.reset(_.map(me.treeView.tree.getSelectedNodes(), function(treeNode) {
          return treeNode.data.origNode;
        }));
      }, 100, {
        leading: false
      });
      return {
        source: function() {
          var dfd = $.Deferred(), node = me._fetchRootNode();
          me.blockActions();
          node.ensureFetched().done(function() {
            me.rootNodes = [ node ];
            dfd.resolve(_.map(me.rootNodes, me._createTreeNode.bind(me)));
          }).fail(dfd.reject).always(me.unblockActions.bind(me));
          return dfd.promise();
        },
        init: function(event, data) {
          var rootNode = data.tree.getFirstChild(), cbDone = function() {
            rootNode.setActive(true);
            me.isBusy = false;
            me.trigger("render:complete");
          };
          if (me.renderExpanded) {
            me._expandAll().always(cbDone);
          } else {
            me.blockActions();
            rootNode.setExpanded(true).done(cbDone).always(me.unblockActions.bind(me));
          }
        },
        lazyLoad: function(event, data) {
          var dfd = $.Deferred();
          me.blockActions();
          me._fetchNodeChildren(data.node.data.origNode).done(function(result) {
            dfd.resolve(result);
          }).fail(dfd.reject).always(me.unblockActions.bind(me));
          data.result = dfd.promise();
        },
        dnd5: me.getDnD(),
        focus: function(event, data) {
          data.node.scrollIntoView(true);
        },
        expand: function(event, data) {
          me.trigger("update:scrollbar");
          me.trigger("node:expand", data.node.data.origNode);
        },
        collapse: function(event, data) {
          me.trigger("update:scrollbar");
          me.trigger("node:collapse", data.node.data.origNode);
          if (!me.snapshotView) {
            data.node.resetLazy();
            me.collection.removeAllChildrenOf(data.node.data.origNode, false, {
              silent: true
            });
          }
        },
        beforeActivate: function(event, data) {
          var origEvent = event.originalEvent, $target = origEvent && $(origEvent.target), ignorable = origEvent && origEvent.type === "click" && ($target.hasClass("csui-toolitem") || $target.hasClass("icon-toolbar-more")), treeNode = data.node, node = treeNode.data.origNode;
          if (!ignorable) {
            if (treeNode.isActive() || treeNode.data.executingDefaultHandler) {
              treeNode.data.executingDefaultHandler = false;
            } else if (me.defaultActionController.hasAction(node)) {
              me.blockActions();
              treeNode.data.executingDefaultHandler = true;
              me.defaultActionController.executeAction(node, {
                context: me.context,
                originatingView: me
              }).then(treeNode.setActive.bind(treeNode, true)).always(me.unblockActions.bind(me));
              return false;
            }
            return true;
          }
          return false;
        },
        activate: function(event, data) {
          var tree = data.tree, treeNode = data.node, key = treeNode.key;
          tree._currActiveNodeKey = key;
          tree.ignoreSelectionEvents = true;
          var deselectableNodes = _.reject(tree.getSelectedNodes(), function(tn) {
            return tn.key === key;
          }) || [];
          if (deselectableNodes.length) {
            _.each(deselectableNodes, function(tn) {
              tn.setSelected(false);
            });
          }
          treeNode.setSelected(true);
          tree.ignoreSelectionEvents = false;
          triggerSelectionChange();
        },
        beforeSelect: function(event, data) {
          if (!data.tree.ignoreSelectionEvents) {
            triggerSelectionChange();
          }
          return true;
        },
        renderColumns: function(event, data) {
          var treeNode = data.node, node = data.node.data.origNode, $tr = $(treeNode.tr), $tdList = $tr.find(">td");
          if (!me.snapshotView) {
            treeNode.tr.draggable = true;
            treeNode.span.draggable = false;
          }
          $tdList.eq(0).find(".fancytree-title").addClass("d2-overflow-tooltip");
          $tdList.eq(0).prepend('<span class="icon drag-dots"></span>');
          if (node.get("reserved") === true) {
            $tdList.eq(1).html('<span class="icon icon-reserve"></span>');
          } else {
            $tdList.eq(1).empty();
          }
          var versionView = new VDTreeVersionCellView({
            model: node,
            column: {
              name: "r_version_label",
              attributes: {
                column_key: "r_version_label"
              }
            }
          });
          $tdList.eq(3).html(versionView.$el);
          versionView.render();
          if (options?.showAdditionalColumns !== undefined && options.showAdditionalColumns) {
            $tdList.eq(2).html(node.get("title"));
            $tdList.eq(4).html(node.get("a_status"));
          }
          var $inlineMenuContainer = $('<span class="icon inline-context-menu"></span>');
          $inlineMenuContainer.data("key", treeNode.key);
          $tdList.eq(5).html($inlineMenuContainer);
        }
      };
    },
    _fetchAllParentNodes: function(node) {
      var parents = [];
      while (node.parent) {
        node = node.parent;
        parents.push(node);
      }
      return parents;
    },
    _setDropMarkerWidth: function(node) {
      var dropMarker = $("body").find("#fancytree-drop-marker");
      if (dropMarker && !dropMarker.is(":hidden")) {
        dropMarker.css("width", parseInt($(node.tr).css("width")) - dropMarker.position().left - 1);
      }
    },
    _showErrorMessage: function(nodes) {
      var queueItems = nodes.map(function(item) {
        return {
          name: item.title,
          relationId: vdUtil.getVDRelationId(item.data.origNode),
          state: item.errorMessage ? "rejected" : "resolved",
          errorMessage: item.errorMessage,
          count: 1,
          total: 1,
          node: item.data.origNode
        };
      });
      var nodeCollection = new UploadFileCollection(queueItems, {
        connector: this.connector
      });
      nodeCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        GlobalMessage.showProgressPanel(nodeCollection, {
          oneFileSuccess: lang.MoveVDOneItemSuccessMessage,
          multiFileSuccess: lang.MoveVDManyItemsSuccessMessage,
          oneFileFailure: lang.MoveVDOneItemFailureMessage,
          multiFileOneFailure: lang.MoveVDManyItemsOneFailureMessage,
          multiFileFailure: lang.MoveVDManyItemsFailureMessage
        });
      });
    },
    _getTreeNodeFromVDRelationId: function(treeNodes, relationId) {
      var node = false;
      $.each(treeNodes, function(index, treeNode) {
        if (vdUtil.getVDRelationId(treeNode.data.origNode) === relationId) {
          node = treeNode;
          return false;
        }
      });
      return node;
    },
    _checkNodeStatus: function(selectedNodes, result) {
      var okCount = 0, failCount = 0, nodes = [], me = this, node = true;
      _.each(result.entries, function(entry) {
        if (entry.content && entry.content["status"] === "200") {
          okCount++;
          node = me._getTreeNodeFromVDRelationId(selectedNodes, entry.content["relation-id"]);
          node && nodes.push(node);
        } else if (entry.content && entry.content["status"] !== 200) {
          failCount++;
          node = me._getTreeNodeFromVDRelationId(selectedNodes, entry.content["relation-id"]);
          if (node) {
            node.errorMessage = entry.content["rest-error"].message;
          }
          nodes.push(node);
        }
      });
      if (failCount > 0) {
        me._showErrorMessage(nodes, okCount);
      }
    },
    _refreshNodes: function(nodes) {
      var deferred = $.Deferred(), vdmNumbers = [], me = this;
      _.each(nodes, function(node) {
        node.data.origNode.isVirtualDoc() && vdmNumbers.push(vdUtil.getVDMNumber(node.data.origNode));
      });
      me.collection.refresh({
        vdmNumber: vdmNumbers,
        force: false,
        silent: false
      }).then(function() {
        deferred.resolve();
      });
      return deferred.promise();
    },
    _fetchAllImmediateParents: function(nodes) {
      var parentNodes = [];
      _.each(nodes, function(node) {
        node.parent && parentNodes.indexOf(node.parent) === -1 && parentNodes.push(node.parent);
      });
      return parentNodes;
    },
    _performMoveAction: function(node, selectedNodes, data) {
      var vdNode = node.data.origNode, href = RestLinkrels.getLink(vdNode.get("links"), RestLinkrels.VD_MOVE_NODES), qParams = {}, deferred = $.Deferred(), payload = {}, relationIds = [], me = this, targetNode = [], nodesInvolved = _.clone(selectedNodes);
      nodesInvolved.push(node);
      var nodesToRefresh = me._fetchAllImmediateParents(nodesInvolved);
      qParams["inline"] = true;
      if (me.dropOver) {
        qParams["target-parent-id"] = node.data.origNode.get("id");
        targetNode.push(node);
      } else {
        if (!node.isLastSibling() || data.hitMode === "before") {
          qParams["insert-before-node"] = data.hitMode === "after" ? vdUtil.getVDRelationId(node.getNextSibling().data.origNode) : vdUtil.getVDRelationId(vdNode);
        }
        qParams["target-parent-id"] = vdUtil.getParentVDId(vdNode);
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      _.each(selectedNodes, function(selectedNode) {
        relationIds.push({
          "relation-id": vdUtil.getVDRelationId(selectedNode.data.origNode)
        });
      });
      payload["virtual-document-nodes"] = relationIds;
      $.ajax(vdNode.connector.extendAjaxOptions({
        url: href,
        type: "PATCH",
        contentType: constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload),
        success: function(result) {
          me._refreshNodes(nodesToRefresh).then(function() {
            if (targetNode.length) {
              targetNode[0].setExpanded().done(function() {
                deferred.resolve(result, node);
              });
            } else {
              deferred.resolve(result, node.parent);
            }
          });
        },
        error: function(result) {
          deferred.reject(result.responseJSON.message);
        }
      }));
      return deferred.promise();
    },
    _setSelectedNodes: function(nodes, targetNode) {
      _.each(nodes, function(node) {
        $.each(targetNode.children, function(index, ftNode) {
          if (ftNode.data.origNode.get("id") === node.data.origNode.get("id")) {
            !ftNode.isActive() && ftNode.setSelected(true);
            return false;
          }
        });
      });
    },
    _createTreeNode: function(node) {
      var hasVDChildren = false;
      if (this.snapshotView) {
        var children = this.collection.getChildrenOf(node);
        hasVDChildren = children && children.length;
      } else {
        hasVDChildren = vdUtil.hasVDChildren(node);
      }
      return {
        key: this._getKeyForVDNode(node),
        vdmNumber: vdUtil.getVDMNumber(node),
        origNode: node,
        title: node.get("name"),
        folder: hasVDChildren,
        lazy: hasVDChildren
      };
    },
    _getKeyForVDNode: function(node) {
      return node.cid;
    },
    _fetchRootNode: function() {
      return this.collection.getVDRoot();
    },
    _fetchNodeChildren: function(parentNode, stopWithSuccess) {
      var dfd = $.Deferred(), children = this.collection.getChildrenOf(parentNode);
      if (_.isEmpty(children)) {
        if (stopWithSuccess === true) {
          log.warn("VDT - received empty children for - {0}", vdUtil.getLogPrintableDetails(parentNode)) && console.warn(log.last);
          dfd.resolve([]);
        } else {
          this.collection.refresh({
            vdmNumber: vdUtil.getVDMNumber(parentNode),
            silent: true
          }).then(this._fetchNodeChildren.bind(this, parentNode, true)).done(dfd.resolve).fail(dfd.reject);
        }
      } else {
        dfd.resolve(_.map(children, this._createTreeNode.bind(this)));
      }
      return dfd.promise();
    },
    onChangeVersionsDisplay: function(isShown) {
      var showVersion = !!isShown;
      if (this.displayVersionColumn !== showVersion) {
        this.displayVersionColumn = showVersion;
        this._adjustVersionDisplay();
      }
    },
    _adjustVersionDisplay: function() {
      if (this.displayVersionColumn) {
        this.$el.addClass("show-versions");
      } else {
        this.$el.removeClass("show-versions");
      }
    },
    _recursiveExpandSubtree: function(ftNode) {
      var dfd = $.Deferred(), me = this, childrenExpander = function() {
        var children = ftNode.getChildren(), promises = [];
        if (_.isArray(children)) {
          for (var c = 0; c < children.length; c++) {
            promises.push(me._recursiveExpandSubtree(children[c]));
          }
        }
        $.whenAll.apply($, promises).done(dfd.resolve).fail(dfd.reject);
      };
      if (ftNode.hasChildren() !== false) {
        if (ftNode.isExpanded() !== true) {
          ftNode.setExpanded(true).always(childrenExpander);
        } else {
          childrenExpander();
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _expandAll: function() {
      var dfd = $.Deferred();
      if (this.treeView) {
        this.blockActions();
        this._recursiveExpandSubtree(this.treeView.tree.getFirstChild()).done(dfd.resolve).fail(dfd.reject).always(this.unblockActions.bind(this));
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _collapseAll: function() {
      if (this.treeView) {
        this.blockActions();
        var collapsibleRoot = this.treeView.tree.getFirstChild();
        collapsibleRoot.visit(function(node) {
          if (node.hasChildren() !== false && node.isExpanded() === true) {
            node.setExpanded(false);
          }
        });
        this.unblockActions();
      }
    },
    onChangeExpandCollapse: function(isExpanded) {
      var expanded = !!isExpanded;
      if (expanded) {
        this._expandAll();
      } else {
        this._collapseAll();
      }
    },
    onSetFallbackActiveNode: function(vdmNumber) {
      if (this.treeView && this.treeView.tree.getActiveNode() === null) {
        var tree = this.treeView.tree, clause = {};
        clause[vdUtil.PROP_VDM_NUMBER] = vdmNumber;
        var node = this.collection.findWhere(clause), ftNode = node ? tree.getNodeByKey(this._getKeyForVDNode(node)) : tree.getFirstChild();
        ftNode && ftNode.setActive(true);
      }
    },
    _createInlineMenu: function(e) {
      var $inlineMenuContainer = $(e.currentTarget).find(".inline-context-menu"), nodeKey = $inlineMenuContainer.data("key");
      if (!!nodeKey && !this._inlineMenuView) {
        var nodeModel = this.treeView.tree.getNodeByKey(nodeKey).data.origNode, rgnMenuBar = new Marionette.Region({
          el: $inlineMenuContainer
        });
        this._inlineMenuView = new InlineMenuView(_.defaults({
          context: this.context,
          model: nodeModel,
          tileViewToolbarItems: this.options.toolItemFactory
        }, this.options, {
          originatingView: this
        }));
        this._inlineMenuView.inlineActionbarOptions = _.extend({}, this._inlineMenuView.inlineActionbarOptions, {
          container: this._fetchRootNode(),
          vdRootNode: this.options.collection.perspectiveNode
        });
        this._inlineMenuView.on("before:execute:command", this.beforeExecuteCommand.bind(this)).on("after:execute:command", this.afterExecuteCommand.bind(this));
        rgnMenuBar.show(this._inlineMenuView);
      }
    },
    _destroyInlineMenu: function() {
      if (this._executingCommand === true && this._inlineMenuView) {
        this._inlineMenuView.isDestroyable = true;
        return;
      }
      this._inlineMenuView && this._inlineMenuView.destroy();
      this._inlineMenuView = null;
    },
    beforeExecuteCommand: function() {
      this._executingCommand = true;
      this._beforeExecuteCommand.apply(this, arguments);
    },
    afterExecuteCommand: function() {
      this._executingCommand = false;
      this._afterExecuteCommand.apply(this, arguments);
      if (this._inlineMenuView && this._inlineMenuView.isDestroyable) {
        this._destroyInlineMenu();
      }
    }
  });
  _.extend(VDocStructureView.prototype, LayoutViewEventsPropagationMixin);
  VDocCommandControllerMixin.mixin(VDocStructureView.prototype);
  return VDocStructureView;
});