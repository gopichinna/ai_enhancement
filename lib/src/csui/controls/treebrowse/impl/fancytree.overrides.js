/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "i18n!csui/controls/treebrowse/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "csui/lib/fancytree/jquery.fancytree" ], function($, lang, theming, jatoIcons) {
  "use strict";
  $.ui.fancytree.registerExtension({
    name: "csui-overrides",
    version: "1.0.0",
    options: {
      rootIndent: 0,
      levelIndent: 12
    },
    nodeRenderStatus: function(ctx) {
      var res, node = ctx.node, spanEl = $(node.span), level = node.getLevel(), expanded = node.isExpanded(), extOpts = ctx.options["csui-overrides"], $statusEl = $(node[ctx.tree.statusClassPropName]), $ariaEl = $(node.tr || node.li), $expander = spanEl.find(".fancytree-expander");
      const fancyTreeSpanIconGroup = ".fancytree-custom-icon .csui-icon-group";
      const iconTitle = spanEl.find(fancyTreeSpanIconGroup).attr("title") || "";
      res = this._super(ctx);
      $expander.attr("title", expanded ? lang.tooltipTreeNodeCollapse : lang.tooltipTreeNodeExpand);
      if (node.data.disabled === true) {
        $statusEl.addClass("fancytree-disabled");
        if (ctx.options.aria) {
          $ariaEl.attr("aria-disabled", true);
        }
      } else if (ctx.options.aria) {
        $ariaEl.attr("aria-disabled", false);
      }
      $ariaEl.addClass("fancytree-level-" + level);
      if (ctx.tree.options.rtl) {
        spanEl.css({
          paddingRight: (level - 1) * extOpts.levelIndent + extOpts.rootIndent
        });
      } else {
        spanEl.css({
          paddingLeft: (level - 1) * extOpts.levelIndent + extOpts.rootIndent
        });
      }
      spanEl.toggleClass("fancytree-node--is-jato", theming.isJATOTheme());
      if (node.isPagingNode()) {
        spanEl.find(".fancytree-title:not(:has(.fancytree-paging-icon))").append('<span class="fancytree-paging-icon ' + (node.data.showMore ? "show-more" : "show-less") + '">');
      }
      if (node._isLoading === true) {
        $expander.empty().append('<div class="fancytree-loader"></div>');
      } else if (theming.isJATOTheme()) {
        const expanderIcon = $("<otc-icon></otc-icon>").attr({
          type: "subtle",
          svg: expanded ? jatoIcons.actionChevronSmallDown : jatoIcons.actionChevronSmallRight,
          title: expanded ? lang.tooltipTreeNodeCollapse : lang.tooltipTreeNodeExpand
        });
        $expander.empty().append(expanderIcon);
        const folderIcon = $("<otc-icon></otc-icon>").attr({
          type: "subtle",
          title: iconTitle,
          svg: level === 1 ? jatoIcons.actionWorkspace : expanded ? jatoIcons.actionFolderOpen : jatoIcons.actionFolder
        });
        if (!spanEl.find(fancyTreeSpanIconGroup + " img").hasClass("csui-node-type-image")) {
          spanEl.find(fancyTreeSpanIconGroup).empty().append(folderIcon);
        }
        const bwsIcon = $("<otc-icon></otc-icon>").attr({
          type: "raw",
          title: iconTitle,
          svg: jatoIcons.actionWorkspace
        });
        if (spanEl.find(fancyTreeSpanIconGroup + ".csui-node-bws").length) {
          spanEl.find(fancyTreeSpanIconGroup).empty().append(bwsIcon);
        }
        if (node.isPagingNode()) {
          const pagingIcon = $("<otc-icon></otc-icon>").attr({
            type: "subtle",
            size: "13px",
            svg: node.data.showMore ? jatoIcons.actionChevronSmallUp : jatoIcons.actionChevronSmallDown
          });
          spanEl.find(".fancytree-paging-icon").empty().append(pagingIcon);
        }
      } else {
        $expander.empty();
      }
      if (node.data.isErrorNode === true) {
        spanEl.addClass("fancytree-node-error");
      } else if (node.hasError === true) {
        spanEl.addClass("fancytree-error");
      }
      return res;
    },
    nodeSetActive: function(ctx, flag, callOpts) {
      if (ctx.node.data.disabled === true) {
        return $.Deferred(function() {
          this.resolveWith(ctx);
        }).promise();
      }
      this._super(ctx, flag, callOpts);
    },
    treeSetFocus: function(ctx, flag, callOpts) {
      if (flag === false && this.focusNode) {
        this._lastFocusNode = this.focusNode;
      }
      var res = this._super(ctx, flag, callOpts);
      if (flag && (!callOpts || !callOpts.calledByNode) && !this.focusNode && this._lastFocusNode) {
        this._lastFocusNode.setFocus();
      }
      return res;
    }
  });
  return $.ui.fancytree;
});