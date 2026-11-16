/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/widgets/metadata/impl/versions/metadata.versions.view", "csui/models/version" ], function(module, $, _, Backbone, Marionette, MetadataVersionsTableView, VersionModel) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    enabled: true
  });
  var MetadataVersionsView = MetadataVersionsTableView.extend({
    constructor: function MetadataVersionsView(options) {
      MetadataVersionsTableView.prototype.constructor.apply(this, arguments);
    }
  }, {
    enabled: function(options) {
      if (config.enabled === false || options.enabled === false) {
        return false;
      }
      if (options.node instanceof VersionModel) {
        return false;
      }
      return _.contains([ 144, 736, 749, 5574 ], options.node.get("type"));
    }
  });
  return MetadataVersionsView;
});