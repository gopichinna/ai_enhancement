/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/log", "d2/widgets/splitview.widgets/splitview.doclist.view", "d2/widgets/splitview.widgets/vd.structure.edit.view", "csui/controls/progressblocker/blocker", "csui/utils/commands", "nuc/models/node/node.model", "csui/utils/contexts/factories/next.node", "d2/widgets/virtual.document/virtual.document.view", "css!d2/widgets/splitview.widgets/edit.virtual.document/impl/edit.virtual.document" ], function(module, _, $, Marionette, log, TargetBrowseViewWidget, VdStructureEditView, BlockingView, commands, NodeModel, NextNodeModelFactory, VirtualDocumentView) {
  "use strict";
  log = log(module.id);
  var EditVirtualDocumentView = VirtualDocumentView.extend({
    constructor: function EditVirtualDocumentView(options) {
      options = options || {};
      EditVirtualDocumentView.__super__.constructor.call(this, options);
      this.options.origInlineBarOptions = null;
      this.$el.addClass("vdoc-edit-view");
      this._getSplitviewDoclist();
      this._getEditVd();
    },
    onRender: function() {
      this.hideBreadCrumb();
      EditVirtualDocumentView.__super__.onRender.call(this);
    },
    templateHelpers: function() {
      return {
        isEditVD: this.isEditVD
      };
    },
    _renderChildrenViews: function() {
      let interval = setInterval(() => {
        if ($(".d2-split-pane-content.primary-pane-content").length > 0) {
          this.splitViewDoclist.show();
          this.hideBreadCrumb();
          clearInterval(interval);
        }
      }, 100);
      this.splitPanel.showPanelViews(null, this.editVDView);
    },
    showSplitViewDocList() {
      this.splitViewDoclist.show();
    },
    hideBreadCrumb: function() {
      $(".csui-perspective-breadcrumb").hide();
      $(".cs-perspective-with-breadcrumb-view").removeClass("csui-breadcrumbs-visible");
    },
    _getEditVd() {
      this.editVDView = new VdStructureEditView(_.defaults({
        context: this.context,
        connector: this.connector,
        model: this.model,
        container: this.container,
        blockingParentView: this,
        showBackButton: true,
        originatingView: this
      }, this.options));
    },
    _getSplitviewDoclist() {
      const container = new NodeModel(undefined, {
        connector: this.model.connector,
        autofetch: true
      });
      var nodePickerOptions = {
        connector: this.model.connector,
        container: container,
        initialContainer: this.model.parent,
        context: this.context,
        selectMultiple: true,
        commands: commands,
        originatingView: this,
        includeBrowse: true,
        globalSearch: true,
        includeFavorites: true
      };
      nodePickerOptions.connector.context = nodePickerOptions.context;
      nodePickerOptions.storeContainer = true;
      nodePickerOptions.restoreContainer = true;
      nodePickerOptions.startLocations = [];
      if (nodePickerOptions.includeBrowse) {
        nodePickerOptions.startLocations.push("current.location");
      }
      if (nodePickerOptions.includeFavorites) {
        nodePickerOptions.startLocations.push("favorites");
      }
      this.splitViewDoclist = new TargetBrowseViewWidget(nodePickerOptions);
    }
  });
  return EditVirtualDocumentView;
});