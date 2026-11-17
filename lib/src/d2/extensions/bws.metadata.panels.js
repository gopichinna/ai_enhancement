/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/panels/workspace/bws.properties.view", "d2/widgets/metadata/panels/workspace/bws.members.view", "d2/sdk/widgets/metadata.panel/bws.metadata.panel.views", "i18n!d2/commands/nls/localized.strings" ], function(_, BWSMetadataPropertiesView, BWSMetadataMembersView, BWSMetadataPanelViews, lang) {
  "use strict";
  var panels = [ {
    name: "bws_properties",
    title: lang.PanelNameBWSProperties,
    sequence: 1,
    contentView: BWSMetadataPropertiesView
  }, {
    name: "bws_members",
    title: lang.PanelNameBWSMembers,
    sequence: 2,
    contentView: BWSMetadataMembersView
  } ];
  if (_.isArray(BWSMetadataPanelViews) && BWSMetadataPanelViews.length > 0) {
    BWSMetadataPanelViews.forEach(function(panel) {
      panels.push(panel);
    });
  }
  return panels;
});