/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "dctmw/utils/rest.resources", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, CommandModel, ConnectorFactory, CommandHelper, RestResources, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-CompareVDoc",
      command_key: "D2-CompareVDoc",
      name: lang.CommandNameCompareVDoc,
      scope: "single"
    },
    enabled: function(_status, _options) {
      if (_status.nodes && _status.nodes.length === 1) {
        var node = CommandHelper.getJustOneNode(_status);
        return node.get("rIsVirtualDoc") && _status.context.viewStateModel.get("currentRouterFragment").includes("/editvdoc");
      }
      return false;
    },
    execute: function(status) {
      this.loadVirtualDocument(status);
    },
    loadVirtualDocument: function(status) {
      let VdStructureEditView = require("d2/widgets/splitview.widgets/vd.structure.edit.view");
      let node = CommandHelper.getJustOneNode(status);
      node.attributes.links.push({
        rel: "http://identifiers.emc.com/linkrel/d2-vd-nodes",
        href: "/repositories/" + RestResources.getCurrentRepository().get("name") + "/objects/" + node.get("id") + "/d2-vd-nodes"
      });
      let virtualDocumentView = new VdStructureEditView({
        context: status.context,
        connector: status.context.getObject(ConnectorFactory),
        model: node,
        container: status.container,
        blockingParentView: this,
        showBackButton: true,
        originatingView: status.originatingView,
        isForComparing: true
      });
      status.originatingView.compareVirtualDocumentView = virtualDocumentView;
      status.originatingView.splitViewDoclist.splitViewDocList.$el.find(".splitview-doclist").addClass("d2-target-browse-hide");
      status.originatingView.splitViewDoclist.splitViewDocList.$el.find(".metadata--container").removeClass("metadata--container-hide");
      status.originatingView.splitViewDoclist.splitViewDocList.metaDataRegion.show(virtualDocumentView);
      this.listenTo(virtualDocumentView, "close:vdoc:compare:block", view => {
        status.originatingView.splitViewDoclist.splitViewDocList.$el.find(".metadata--container").addClass("metadata--container-hide");
        status.originatingView.compareVirtualDocumentView = null;
        view.destroy();
        status.originatingView.splitViewDoclist.splitViewDocList.$el.find(".splitview-doclist").removeClass("d2-target-browse-hide");
      });
    }
  });
});