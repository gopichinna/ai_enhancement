/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "i18n", "nuc/models/node/node.model", "dctmw/controls/tree/tree.sprites", "dctmw/lib/fancytree/jquery.fancytree", "dctmw/controls/tree/impl/fancytree.overrides", "css!dctmw/controls/tree/impl/tree" ], function($, _, Marionette, i18n, NodeModel, TreeSprites) {
  "use strict";
  const treeNodePropertiesToUseInIconMatch = [ "statusNodeType", "_isLoading", "_error", "data", "checkbox", "expanded", "extraClasses", "folder", "icon", "iconTooltip", "key", "lazy", "partsel", "refKey", "selected", "title", "tooltip", "type", "unselectable", "unselectableIgnore", "unselectableStatus", "children" ];
  return Marionette.ItemView.extend({
    template: false,
    className: "d2-tree",
    constructor: function TreeView(options) {
      options = options || {};
      const optionsToPick = [ "activate", "beforeActivate", "click", "clickPaging", "collapse", "dblclick", "expand", "focus", "init", "keydown", "lazyLoad", "source", "strings" ];
      if (_.isArray(options.extensions)) {
        options.extensions.forEach(e => optionsToPick.push(e));
      }
      this.treeOptions = _.extend(_.pick(options, optionsToPick), {
        escapeTitles: true,
        extensions: [ "d2-overrides", ...options.extensions || [] ],
        "d2-overrides": {
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
      options = _.omit(options, optionsToPick);
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onBeforeRender: function() {
      this.tree = $.ui.fancytree.getTree(this.$el.fancytree(this.treeOptions));
    },
    onBeforeDestroy: function() {
      if (this.tree && this.tree.widget) {
        this.tree.widget.destroy();
      }
    }
  });
});