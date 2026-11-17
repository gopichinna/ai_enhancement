/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/constants", "d2/widgets/metadata/panels/metadata.workflow.zero.state.base.view", "i18n!d2/widgets/metadata/panels/favorites/impl/nls/lang" ], function(_, constants, MetaWorkflowZeroStateBaseView, lang) {
  "use strict";
  var MetadataFavoritesView = MetaWorkflowZeroStateBaseView.extend({
    className: MetaWorkflowZeroStateBaseView.prototype.className + " d2-metadata-favorites",
    constructor: function MetadataFavoritesView(options) {
      options = options || {};
      _.defaults(options, {
        zeroStateMessage: lang.FavoritesMessage
      });
      MetaWorkflowZeroStateBaseView.prototype.constructor.call(this, options);
    }
  }, {
    enabled: function(options) {
      return options.node.get("id") === constants.NodeId.FAVORITES;
    }
  });
  return MetadataFavoritesView;
});