/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/default.action/default.action.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/controls/listitem/inline.menu.view", "nuc/utils/log", "nuc/utils/url", "nuc/utils/base", "csui/utils/nodesprites", "dctmw/controls/tree/tree.view", "d2/controls/table/cells/version/version.view", "d2/models/virtual.document.children", "d2/widgets/virtual.document.explorer/impl/vdoc.command.controller.mixin", "d2/utils/vdoc.utils", "d2/utils/rest.linkrels", "d2/utils/constants", "csui/models/fileuploads", "hbs!d2/controls/tree/impl/node.tree", "hbs!d2/widgets/virtual.document.explorer/impl/virtual.document.tree.table", "i18n!d2/commands/nls/localized.strings", "css!d2/controls/tree/impl/node.tree", "css!d2/widgets/virtual.document.explorer/impl/virtual.document.structure", "dctmw/lib/fancytree/jquery.fancytree.table", "dctmw/lib/fancytree/jquery.fancytree.dnd5", "d2/widgets/virtual.document.explorer/impl/fancytree.ext.vdoc" ], function(require, module, $, _, Backbone, Marionette, TabableRegionBehavior, DefaultActionBehavior, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin, BlockingView, InlineMenuView, log, Url, base, NodeSpriteCollection, TreeView, NodestableVersionCellView, VirtualDocumentChildren, VDocCommandControllerMixin, vdUtil, RestLinkrels, constants, UploadFileCollection, template, templateTreeTable, lang) {
  "use strict";
  var ftAdditionalOptions = [ "beforeSelect", "renderColumns", "dnd5" ];
  var TreeViewWithNodeIcon = TreeView.extend({
    tagName: "table",
    template: templateTreeTable,
    templateHelpers: function() {
      return this.showAdditionalColumns !== undefined && this.showAdditionalColumns ? {
        nameHeader: lang.NameHeader,
        titleHeader: lang.TitleHeader,
        versionHeader: lang.VersionHeader,
        statusHeader: lang.StatusHeader
      } : {};
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function TreeViewWithNodeIcon(options) {
      options = options || {};
      var ftOptionsCustom = _.pick(options, ftAdditionalOptions);
      options = _.omit(options, ftAdditionalOptions);
      this.showAdditionalColumns = options.showAdditionalColumns;
      TreeView.prototype.constructor.call(this, options);
      this.treeOptions = _.extend(this.treeOptions, ftOptionsCustom, {
        click: function(event, data) {
          if (!event.shiftKey) {
            data.tree.activateKey(false, {
              noEvents: true
            });
          }
        },
        dblclick: function() {
          return false;
        },
        keydown: function(event, data) {
          if (event.which === 13 || event.which === 32) {
            data.tree.activateKey(false, {
              noEvents: true
            });
          }
        },
        icon: function(event, data) {
          if (data.node.data.origNode) {
            return NodeSpriteCollection.findClassByNode(data.node.data.origNode);
          }
        },
        extensions: options.snapshotView ? this.treeOptions.extensions.concat([ "vdoc", "table" ]) : this.treeOptions.extensions.concat([ "vdoc", "table", "dnd5" ]),
        table: {
          indentation: 20,
          nodeColumnIdx: 0
        },
        vdoc: {
          snapshotView: options.snapshotView
        },
        selectMode: 2,
        tabindex: "0"
      });
      this.vdNameTooltipEvent = "mouseenter.vd_node_name_" + this.cid;
    },
    onBeforeRender: function() {},
    onShow: function() {
      this.treeOptions.scrollParent = this.$el.parent();
      var retVal = TreeView.prototype.onBeforeRender.apply(this, arguments);
      this.tree.$scrollParent = this.$el.parent();
      return retVal;
    },
    onBeforeDestroy: function() {
      this.$el.off(this.vdNameTooltipEvent);
      this.$dropMarker ? this.$dropMarker.remove() : $("body").find("#fancytree-drop-marker").remove();
    },
    currentlyFocusedElement: function() {
      return this.el;
    }
  });
  return TreeViewWithNodeIcon;
});