/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "csui/controls/table.list/table.list.view", "csui/widgets/permissions/dynamic.permissions/toolbaritems", "csui/widgets/permissions/dynamic.permissions/toolbaritems.masks", "csui/widgets/permissions/impl/permissions.list/dynamic.permission.table.columns", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/models/node.actions", "csui/widgets/permissions/impl/dynamic.permissions/dynamic.permissions.header.view", "csui/widgets/permissions/impl/dynamic.permissions/empty.dynamic.permission.view", "hbs!csui/widgets/permissions/impl/dynamic.permissions/dynamic.permissions", "css!csui/widgets/permissions/impl/permissions" ], function(Marionette, TableListView, toolbarItems, ToolbarItemsMasks, tableColumns, ViewEventsPropagationMixin, NodeActionCollection, DynamicPermissionsHeaderView, EmptyDynamicPermissionView, template) {
  "use strict";
  let DynamicPermissionsView = Marionette.LayoutView.extend({
    className: "cs-permissions-content",
    template: template,
    regions: {
      headerRegion: ".cs-permissions-content-header",
      listRegion: ".csui-permissions-list-container"
    },
    constructor: function DynamicPermissionsView(options = {}) {
      this.options = options;
      this.listenTo(this, "permission:changed", async function(status) {
        this.options.hasEditDynamicPermission = await this.checkPermission(status.forceFetch);
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    onRender: async function() {
      this.options.hasEditDynamicPermission = await this.checkPermission();
      this.permissionsHeaderView = new DynamicPermissionsHeaderView({
        hasEditDynamicPermission: this.options.hasEditDynamicPermission,
        context: this.options.context,
        nodeModel: this.options.originatingView.model,
        collection: this.collection
      });
      this.headerRegion.show(this.permissionsHeaderView);
      this.permissionsListView = new TableListView({
        originatingView: this.options.originatingView,
        context: this.options.context,
        collection: this.options.collection,
        tableColumns: tableColumns,
        toolbarItems: toolbarItems,
        emptyView: EmptyDynamicPermissionView,
        toolbarItemsMasks: new ToolbarItemsMasks(),
        userHasEditPermissions: this.options.hasEditDynamicPermission
      });
      this.propagateEventsToViews(this.permissionsListView);
      this.listRegion.show(this.permissionsListView);
    },
    checkPermission: async function(forceFetch = false) {
      const node = this.options.originatingView.model;
      if (forceFetch || !node.actions.has("editdynamicpermissions")) {
        const actions = new NodeActionCollection(undefined, {
          connector: node.connector,
          nodes: [ node.get("id") ],
          commands: [ "editdynamicpermissions" ]
        });
        await actions.fetch();
        const nodeId = node.get("id");
        const nodeSpecificActions = actions.get(nodeId);
        const action = nodeSpecificActions.actions.findWhere({
          signature: "editdynamicpermissions"
        });
        if (action) {
          node.actions.add(action);
        } else {
          node.actions.remove(action);
        }
        return node.actions.has("editdynamicpermissions");
      } else {
        return node.actions.has("editdynamicpermissions");
      }
    }
  });
  Object.assign(DynamicPermissionsView.prototype, ViewEventsPropagationMixin);
  return DynamicPermissionsView;
});