/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    D2: Object.freeze({
      ADMIN_WORKFLOWS: "AdminWorkflowWidget",
      RECENTLY_ACCESSED: "RecentlyAccessedWidget",
      CHECKOUT: "CheckoutDocumentWidget",
      ADMIN_CHECKOUT: "AdminCheckedOutDocumentWidget",
      DOCLIST: "DoclistWidget",
      FAVORITES: "FavoritesWidget",
      BRAVACSR: "BravaCSRViewerWidget",
      OPENURL: "OpenURLWidget",
      RELATIONS: "DetailsRelationsWidget",
      RENDITIONS: "DetailsRenditionsWidget",
      LOCATIONS: "DetailsLocationsWidget",
      AUDIT: "DetailsAuditsWidget",
      VERSIONS: "DetailsVersionsWidget",
      PROPERTIES: "Properties",
      SEARCH: "SearchWidget",
      MYSHARES: "SharedDocumentWidget",
      VDOC: "VirtualDocWidget",
      TASKS: "TasksWidget",
      WORKFLOWS: "WorkflowOverviewWidget",
      TASK_ATTACHMENTS: "TaskAttachmentWidget",
      BRAVAENTERPRISE: "BravaEnterpriseViewerWidget",
      BRAVAIV: "OpenTextIntelligentViewingWidget",
      COLLECTIONS: "CollectionWidget",
      ADMIN_AVIATOR: "AdminAviatorWidget",
      ADMIN_MIP: "AdminMIPWidget",
      BWS: "BusinessWorkspaceWidget"
    }),
    SMARTUI: Object.freeze({
      RECENTLY_ACCESSED: "csui/widgets/recentlyaccessed",
      CHECKOUT: "d2/widgets/checkout",
      ADMIN_CHECKOUT: "d2/widgets/admin/checkout",
      SAVEDSEARCH: "d2/widgets/savedsearch",
      FAVORITES: "csui/widgets/favorites",
      TASKS: "d2/widgets/tasks",
      SHORTCUTS: "d2/widgets/shortcuts",
      SEARCH: "d2/widgets/savedsearch",
      ERROR: "d2/widgets/error",
      MYSHARES: "d2/widgets/myshares",
      WORKFLOWS: "d2/widgets/workflow.summary",
      ADMIN_WORKFLOWS: "d2/widgets/admin/workflow.summary",
      COLLECTIONS: "d2/widgets/d2collections",
      BWS: "d2/widgets/business.workspace"
    }),
    DEFAULT: Object.freeze({
      VERSIONS: "versionwidget",
      RENDITIONS: "renditionwidget",
      RELATIONS: "relationwidget",
      LOCATIONS: "locationswidget",
      AUDIT: "auditswidget",
      SEARCH: "doclistsearchresultswidget",
      SAVED_SEARCH: "SearchWidget",
      DOCLIST: "doclistwidget",
      FAVORITES: "favoriteswidget",
      BRAVACSR: "bravacsrwidget",
      VDOC: "vdocwidget",
      TASKS: "taskswidget",
      TASK_ATTACHMENTS: "taskattachmentswidget",
      MY_WORKFLOWS: "myworkflowswidget",
      ADMIN_WORKFLOWS: "adminworkflowswidget",
      ALL_WORKFLOWS: "allworkflowswidget",
      BRAVAENTERPRISE: "bravaenterprisewidget",
      BRAVAIV: "otivwidget",
      ALL: "All",
      COLLECTIONS: "collectionwidget",
      BWS: "businessworkspacewidget"
    }),
    WIDGET_SCOPE: Object.freeze({
      ADMIN_AVIATOR: "adm-aviator",
      ADMIN_MIP: "adm-mip",
      ADMIN_CHECKOUT: "adm-checkedout",
      ADMIN_WORKFLOWS: "adm-workflows",
      RECENTLY_ACCESSED: "recentlyaccessed",
      FAVORITES: "favorites",
      CHECKOUT: "checkedout",
      MYSHARES: "myshares",
      INBOX: "inbox",
      MY_WORKFLOWS: "myworkflows",
      ALL_WORKFLOWS: "allworkflows",
      SAVED_SEARCHES: "savedsearch",
      VIEWER: "viewer",
      COLLECTIONS: "collection"
    }),
    TileConfigTypes: Object.freeze({
      WIDGET: "tile_config_widget",
      NONE: "tile_config_none"
    }),
    TableModes: Object.freeze({
      WRAP: "wrap",
      NOWRAP: "nowrap",
      THUMBNAIL: "thumbnail"
    }),
    WidgetPreferenceId: Object.freeze({
      NODESTABLE: "csui/widgets/nodestable:"
    }),
    ServerTableModesConstants: Object.freeze({
      PINNED: "PINNED",
      GRID: "GRID",
      LIST: "LIST"
    }),
    ServerLeftPanelConstants: Object.freeze({
      TREE: "TREE",
      FACET: "FACET",
      QUERYFORM: "QUERYFORM",
      DEFAULT: "DEFAULT"
    })
  });
});