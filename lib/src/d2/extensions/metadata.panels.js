/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/widgets/metadata/panels/versions/metadata.versions.view", "d2/widgets/metadata/panels/relations/metadata.relations.view", "d2/widgets/metadata/panels/renditions/metadata.renditions.view", "d2/widgets/metadata/panels/task.performers/metadata.task.performers.view", "d2/widgets/metadata/panels/workflow.timeline/metadata.workflow.timeline.view", "d2/widgets/metadata/panels/workflow.overview.redirect/metadata.workflow.overview.redirect.view", "d2/widgets/metadata/panels/workflow.overview.scheduled/metadata.workflow.overview.scheduled.view", "d2/widgets/metadata/panels/permissions/metadata.permissions.view", "d2/widgets/metadata/panels/favorites/metadata.favorites.view", "d2/sdk/widgets/metadata.panel/metadata.panel.views", "d2/widgets/metadata/panels/locations/metadata.locations.view", "d2/widgets/metadata/panels/audit/metadata.audit.view", "i18n!d2/commands/nls/localized.strings" ], function(_, MetadataVersionsTableView, MetadataRelationsTableView, MetadataRenditionsTableView, MetadataTaskPerformersTableView, MetadataWorkflowTimelineView, MetadataWorkflowOverviewRedirectView, MetadataWorkflowOverviewScheduledView, MetadataPermissionsView, MetadataFavoritesView, MetadataPanelViews, MetadataLocationsTableView, MetadataAuditTableView, lang) {
  "use strict";
  var panels = [ {
    name: "versions",
    title: lang.PanelNameVersions,
    sequence: 12,
    contentView: MetadataVersionsTableView
  }, {
    name: "relations",
    title: lang.PanelNameRelations,
    sequence: 40,
    contentView: MetadataRelationsTableView
  }, {
    name: "renditions",
    title: lang.PanelNameRenditions,
    sequence: 50,
    contentView: MetadataRenditionsTableView
  }, {
    name: "task_performers",
    title: lang.PanelNameTaskPerformers,
    sequence: 60,
    contentView: MetadataTaskPerformersTableView
  }, {
    name: "workflow_timeline",
    title: lang.PanelNameWorkflowTimeline,
    sequence: 70,
    contentView: MetadataWorkflowTimelineView,
    executeCommand: true
  }, {
    name: "workflow_overview_scheduled",
    title: lang.PanelNameWorkflowTimeline,
    sequence: 71,
    contentView: MetadataWorkflowOverviewScheduledView,
    executeCommand: true
  }, {
    name: "workflow_overview_redirect",
    title: lang.PanelNameWorkflowOverviewRedirect,
    sequence: 80,
    contentView: MetadataWorkflowOverviewRedirectView,
    executeCommand: true
  }, {
    name: "permissions",
    title: lang.PanelNamePermissions,
    sequence: 55,
    contentView: MetadataPermissionsView
  }, {
    name: "favorites",
    title: lang.PanelNameFavorites,
    sequence: 86,
    contentView: MetadataFavoritesView
  }, {
    name: "locations",
    title: lang.PanelNameLocations,
    sequence: 87,
    contentView: MetadataLocationsTableView
  }, {
    name: "audits",
    title: lang.PanelNameAudits,
    sequence: 88,
    contentView: MetadataAuditTableView
  } ];
  if (_.isArray(MetadataPanelViews) && MetadataPanelViews.length > 0) {
    MetadataPanelViews.forEach(function(panel) {
      panels.push(panel);
    });
  }
  return panels;
});