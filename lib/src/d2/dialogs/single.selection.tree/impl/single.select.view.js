/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/dialogs/single.selection.tree/impl/single.select.tree.view", "hbs!d2/dialogs/single.selection.tree/impl/single.select", "hbs!d2/dialogs/single.selection.tree/impl/add.child", "i18n!d2/dialogs/single.selection.tree/impl/nls/lang", "css!d2/dialogs/single.selection.tree/impl/single.select", "dctmw/lib/fancytree/jquery.fancytree.filter" ], function($, _, Marionette, TabableRegionBehavior, SingleSelectTreeView, template, addChildTemplate, lang) {
  "use strict";
  function resetSelectedTreeNode(treeNode, identifierClass) {
    $(treeNode.tr).removeClass("fancytree-focused");
    $(treeNode.tr).find("." + identifierClass).blur();
    treeNode.tree._hasFocus = true;
    treeNode.setFocus();
  }
  var AddChildButtonView = Marionette.ItemView.extend({
    className: "d2-single-select-add-child",
    template: addChildTemplate,
    constructor: function AddChildButtonView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.treeNode = this.options.treeData.node;
    },
    ui: {
      addCategory: ".d2-add-category"
    },
    events: {
      "click @ui.addCategory": "onClickAddCategory",
      "keydown @ui.addCategory": "onKeydownAddCategory",
      "focusin @ui.addCategory": "onFocusInOutAddCategory"
    },
    templateHelpers: function() {
      return {
        addFileToolTip: lang.addCategoryTitle,
        addFileAria: lang.addCategoryTitle,
        iconName: "csui_action_add32"
      };
    },
    onClickAddCategory: function(event) {
      this._addNewNode();
      event.stopPropagation();
      event.preventDefault();
    },
    onKeydownAddCategory: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._addNewNode();
        break;

       case 37:
        $(this.treeNode.tr).find(".d2-tree-node-title").trigger("focus");
        break;

       case 27:
        resetSelectedTreeNode(this.treeNode, "d2-add-category");
        break;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    _focusAddElement: function() {
      this.treeNode.tr.find(".add-category").trigger("focus");
    },
    _addNewNode: function() {
      this.treeNode.setActive(false);
      this.options.parentView && this.options.parentView.trigger("single:select:tree:revert:forms");
      this.treeNode.addNode({
        creationNode: true,
        icon: false
      }, "firstChild");
      this.treeNode.setExpanded(true);
      resetSelectedTreeNode(this.treeNode, "d2-add-category");
    },
    onFocusInOutAddCategory: function(event) {
      event.stopPropagation();
    }
  }), TreeNodeTitleView = Marionette.ItemView.extend({
    tagName: "span",
    className: "d2-tree-node-title fancytree-title",
    template: false,
    constructor: function TreeNodeTitleView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.treeNode = this.options.treeData.node;
      this.$el.attr({
        tabindex: -1,
        title: this.options.treeData.node.title,
        "aria-label": _.str.sformat(lang.selecTreeNodeAria, this.options.treeData.node.title)
      });
      this.$el.text(this.options.treeData.node.title);
    },
    events: {
      click: "onClickTitle",
      keydown: "onKeydownTitle",
      focusin: "onFocusInOutTitle"
    },
    onKeydownTitle: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._activateCurrentNode();
        break;

       case 39:
        $(this.treeNode.tr).find(".d2-add-category").trigger("focus");
        break;

       case 27:
        resetSelectedTreeNode(this.treeNode, "d2-tree-node-title");
        break;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    onClickTitle: function(event) {
      this._activateCurrentNode();
      event.stopPropagation();
      event.preventDefault();
    },
    _activateCurrentNode: function() {
      resetSelectedTreeNode(this.treeNode, "d2-tree-node-title");
      this.treeNode.setActive(true);
    },
    onFocusInOutTitle: function(event) {
      event.stopPropagation();
    }
  });
  return Marionette.LayoutView.extend({
    className: "d2-single-select-view",
    template: template,
    templateHelpers: function() {
      return {
        searchPlaceholder: lang.searchPlaceholder,
        noResultsMessage: lang.noResultsMessage,
        clearTooltip: lang.clearTooltip
      };
    },
    regions: {
      treeRegion: ".d2-single-select-tree-region"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      search: ".d2-single-select-tree-search",
      empty: ".d2-single-select-tree-empty-region",
      clearIcon: ".d2-single-select-tree-clear-icon"
    },
    events: {
      "input @ui.search": "onInputSearchField",
      "click @ui.clearIcon": "onClickClearIcon",
      "keyup @ui.clearIcon": "onKeyUpClearIcon"
    },
    constructor: function SingleSelectView(options) {
      options = options || {};
      if (!options.data) {
        throw new Error("Data is mandatory in the constructor options");
      }
      this._createChildViews(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    currentlyFocusedElement: function(event) {
      var focusables = this.$el.find("*[tabindex]:not(.d2-tree-node-title,.d2-add-category)");
      if (focusables.length) {
        focusables.prop("tabindex", 0);
      }
      return event && event.shiftKey ? focusables.last() : focusables.first();
    },
    onLastTabElement: function(shiftTab, event) {
      var visibleElems = this.$("*[tabindex=0]");
      return event.target === (shiftTab ? visibleElems[0] : visibleElems[visibleElems.length - 1]);
    },
    onKeyUpClearIcon: function(event) {
      switch (event.which) {
       case 32:
       case 13:
        this.onClickClearIcon(event);
        break;
      }
    },
    onClickClearIcon: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.ui.search.val("").trigger("input");
    },
    _updateSelectButton: function(enable) {
      this.trigger("d2:update:select:button", enable);
    },
    onShow: function() {
      this._showChildViews();
    },
    _showChildViews: function() {
      this._showTreeView();
    },
    _showTreeView: function() {
      this.treeRegion.show(this.treeView);
    },
    _createChildViews: function(options) {
      this._createTreeView(options);
    },
    _createTreeView: function(options) {
      this.treeView = new SingleSelectTreeView(this._buildTreeOptions(options));
    },
    onInputSearchField: function() {
      var searchText = this.ui.search.val();
      this.ui.clearIcon[searchText.length ? "addClass" : "removeClass"]("show");
      this.trigger("single:select:tree:revert:forms");
      this.treeView.tree.filterNodes(function(node) {
        var searchRegex = null;
        if (searchText && searchText.length > 0) {
          searchText = searchText.replace(/[.+^${}()|[\]\\]/g, "\\$&");
          searchText = searchText.replace(/\?/g, ".");
          searchText = searchText.replace(/\*/g, ".*?");
          searchRegex = new RegExp(searchText, "gi");
        } else {
          return true;
        }
        if (node.title && node.title.match(searchRegex)) {
          node.titleWithHighlight = node.title.replace(searchRegex, function(matchT) {
            return "<mark>" + matchT + "</mark>";
          });
          return true;
        }
      });
    },
    _buildTreeOptions: function(options) {
      var me = this;
      return {
        source: options.data,
        init: function(event, data) {
          _.each(data.tree.getRootNode().getChildren(), function(node) {
            if (node.getChildren() && node.getChildren().length < 8) {
              node.setExpanded(true);
            }
          });
        },
        click: function(event, data) {
          if (me.treeView.tree.activeNode && me.treeView.tree.activeNode.key === data.node.key && !$(event.originalEvent.target).hasClass("fancytree-expander")) {
            me.sameNodeClicked = true;
            data.node.setActive(false);
          }
        },
        dblclick: function() {
          return false;
        },
        activate: function(event, data) {
          if (data.node.data && data.node.data.creationNode === true) {
            data.node.setActive(false, {
              noEvents: true
            });
            me.selectedNode = null;
            me._updateSelectButton(false);
          } else if (me.sameNodeClicked) {
            me.sameNodeClicked = false;
            data.node.setActive(false, {
              noEvents: true
            });
            me.selectedNode = null;
            me._updateSelectButton(false);
          } else {
            me.selectedNode = data.node;
            me._updateSelectButton(true);
          }
        },
        modifyChild: function(event, data) {
          if (data.childNode && data.childNode.data && data.childNode.data.creationNode === true) {
            return;
          }
          if (data.operation === "add") {
            me.ui.empty.addClass("show");
          } else if (data.operation === "remove") {
            me.ui.empty.removeClass("show");
          }
        },
        filter: {
          autoExpand: true,
          counter: false,
          hideExpanders: true,
          mode: "hide"
        },
        renderColumns: function(event, data) {
          var treeNode = data.node, $tr = $(treeNode.tr), $tdList = $tr.find(">td");
          $tdList.eq(0).addClass("node-name-column");
          $tdList.eq(1).addClass("add-child-column");
          if (data.node && data.node.data && data.node.data.creationNode) {
            var addChildFormview = me.options.createAddChildForm({
              context: me.options.context,
              treeNodeData: data
            });
            $tdList.eq(0).find(".fancytree-title").html(addChildFormview.$el);
            addChildFormview.render();
            addChildFormview.listenTo(me, "single:select:tree:revert:forms", function() {
              addChildFormview.trigger("form:closed");
              if (addChildFormview.isDestroyed()) {
                return;
              }
              treeNode && treeNode.parent && treeNode.remove();
              addChildFormview.destroy();
            });
            addChildFormview.listenTo(addChildFormview, "form:closed", function() {
              treeNode && treeNode.parent && treeNode.parent.tr && $(treeNode.parent.tr).removeAttr("addingChild");
            });
            treeNode && treeNode.parent && treeNode.parent.tr && $(treeNode.parent.tr).attr("addingChild", true);
            $tr.attr("addchildnode", true);
            treeNode.makeVisible();
          } else {
            var treeNodeTitleView = new TreeNodeTitleView({
              treeData: data,
              parentView: me
            }), addChildButtonView = new AddChildButtonView({
              treeData: data,
              parentView: me
            });
            $tdList.eq(0).find(".fancytree-title").replaceWith(treeNodeTitleView.$el);
            treeNodeTitleView.render();
            $tdList.eq(1).html(addChildButtonView.$el);
            addChildButtonView.render();
          }
        }
      };
    }
  });
});