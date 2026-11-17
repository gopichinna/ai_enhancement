/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/widgets/nodestable/nodestable.view", "dctmw/utils/rest.resources", "d2/utils/widget.constants" ], function(NodesTableView, RestResources, widgetConstants) {
  "use strict";
  require([ "csui/integration/folderbrowser/impl/folderbrowser.view" ], function(FolderBrowserView) {
    FolderBrowserView.prototype._createNodesTable = function(context, options) {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), widgetName = userDefaultWidgets[widgetConstants.DEFAULT.DOCLIST], widgetType = widgetConstants.D2.DOCLIST, nodesTable = new NodesTableView({
        context: context,
        pageSize: options.pageSize,
        ddItemsList: options.pageSizes,
        tableColumns: options.tableColumns,
        clearFilterOnChange: options.clearFilterOnChange,
        resetOrderOnChange: options.resetOrderOnChange,
        resetLimitOnChange: options.resetLimitOnChange,
        fixedFilterOnChange: options.fixedFilterOnChange,
        toolbarItems: options.toolbarItems,
        preferencesStorageId: widgetType + "_" + widgetName
      });
      this.listenTo(nodesTable, "executed:defaultAction", function(args) {
        if (args.signature === "Browse") {
          this._containerOpened(args.node);
        }
      });
      this.listenTo(nodesTable.tableView, "tableBodyRendered", function(args) {
        this.trigger("tableBodyRendered", {
          sender: this,
          target: args.target
        });
      });
      this.listenTo(nodesTable, "before:defaultAction", function(args) {
        this._beforeDefaultAction(args);
      });
      return nodesTable;
    };
  });
});