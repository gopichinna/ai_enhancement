/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/widgets/metadata/panels/permissions/metadata.permissions.commands", "d2/widgets/metadata/panels/permissions/metadata.permissions.toolbaritems", "d2/widgets/metadata/panels/permissions/permission.set.table.collection", "d2/widgets/metadata/panels/metadata.base.view", "css!d2/widgets/metadata/panels/permissions/impl/metadata.permissions.view" ], function(module, $, _, Marionette, commands, toolbarItems, PermissionSetTableCollection, MetadataBaseTableView) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 10,
    defaultPageSizes: [ 10, 30, 50, 100 ]
  });
  var PermissionSetTableView = MetadataBaseTableView.extend({
    constructor: function PermissionSetTableView(options) {
      _.defaults(options, {
        collectionClass: PermissionSetTableCollection,
        commands: commands,
        toolbarItems: toolbarItems,
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        selectRows: "none",
        columnsWithSearch: []
      });
      PermissionSetTableView.__super__.constructor.call(this, options);
    },
    className: function() {
      return MetadataBaseTableView.prototype.className + " metadata-permission-set-table";
    },
    onRender: function() {
      MetadataBaseTableView.prototype.onRender.apply(this, arguments);
    }
  });
  return PermissionSetTableView;
});