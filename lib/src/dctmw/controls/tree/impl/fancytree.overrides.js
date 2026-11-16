/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "i18n!dctmw/controls/tree/impl/nls/lang", "dctmw/lib/fancytree/jquery.fancytree" ], function($, lang) {
  "use strict";
  $.ui.fancytree.registerExtension({
    name: "d2-overrides",
    version: "1.0.0",
    options: {
      rootIndent: 0,
      levelIndent: 12,
      levelIndentOnErrorNode: true
    },
    nodeRenderStatus: function(ctx) {
      var res, node = ctx.node, spanEl = $(node.span), level = node.getLevel(), expanded = node.isExpanded(), extOpts = ctx.options["d2-overrides"], $statusEl = $(node[ctx.tree.statusClassPropName]), $ariaEl = $(node.tr || node.li), $expander = spanEl.find(".fancytree-expander");
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
      var rtl = ctx.tree.options.rtl;
      $ariaEl.addClass("fancytree-level-" + level);
      if (rtl) {
        spanEl.css({
          paddingRight: (level - 1) * extOpts.levelIndent + extOpts.rootIndent
        });
      } else {
        spanEl.css({
          paddingLeft: (level - 1) * extOpts.levelIndent + extOpts.rootIndent
        });
      }
      if (node.statusNodeType === "error") {
        $expander.remove();
        if (!extOpts.levelIndentOnErrorNode) {
          if (rtl) {
            spanEl.css({
              paddingRight: extOpts.rootIndent + 4
            });
          } else {
            spanEl.css({
              paddingLeft: extOpts.rootIndent + 4
            });
          }
        }
      }
      if (node.isPagingNode()) {
        spanEl.find(".fancytree-title:not(:has(.fancytree-paging-icon))").append('<span class="fancytree-paging-icon ' + (node.data.showMore ? "show-more" : "show-less") + '">');
      }
      if (node._isLoading === true) {
        spanEl.find(".fancytree-expander").append('<div class="fancytree-loader"></div>');
      } else {
        spanEl.find(".fancytree-expander").empty();
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