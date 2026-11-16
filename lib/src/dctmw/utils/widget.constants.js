/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    D2: Object.freeze({
      RECENTLY_ACCESSED: "RecentlyAccessedWidget",
      CHECKOUT: "CheckoutDocumentWidget",
      DOCLIST: "DoclistWidget",
      FAVORITES: "FavoritesWidget",
      BRAVACSR: "BravaCSRViewerWidget",
      OPENURL: "OpenURLWidget",
      RELATIONS: "DetailsRelationsWidget",
      RENDITIONS: "DetailsRenditionsWidget",
      VERSIONS: "DetailsVersionsWidget",
      PROPERTIES: "Properties",
      SEARCH: "SearchWidget",
      MYSHARES: "SharedDocumentWidget",
      VDOC: "VirtualDocWidget",
      TASKS: "TasksWidget",
      WORKFLOWS: "WorkflowOverviewWidget",
      TASK_ATTACHMENTS: "TaskAttachmentWidget",
      BRAVAENTERPRISE: "BravaEnterpriseViewerWidget",
      BRAVAIV: "OpenTextIntelligentViewingWidget"
    }),
    SMARTUI: Object.freeze({
      RECENTLY_ACCESSED: "csui/widgets/recentlyaccessed",
      CHECKOUT: "d2/widgets/checkout",
      SAVEDSEARCH: "d2/widgets/savedsearch",
      FAVORITES: "csui/widgets/favorites",
      TASKS: "d2/widgets/tasks",
      SHORTCUTS: "d2/widgets/shortcuts",
      SEARCH: "d2/widgets/savedsearch",
      ERROR: "d2/widgets/error",
      MYSHARES: "d2/widgets/myshares",
      WORKFLOWS: "d2/widgets/workflow.summary"
    }),
    DEFAULT: Object.freeze({
      VERSIONS: "versionwidget",
      RENDITIONS: "renditionwidget",
      RELATIONS: "relationwidget",
      SEARCH: "doclistsearchresultswidget",
      SAVED_SEARCH: "SearchWidget",
      DOCLIST: "doclistwidget",
      FAVORITES: "favoriteswidget",
      BRAVACSR: "bravacsrwidget",
      VDOC: "vdocwidget",
      TASKS: "taskswidget",
      TASK_ATTACHMENTS: "taskattachmentswidget",
      MY_WORKFLOWS: "myworkflowswidget",
      ALL_WORKFLOWS: "allworkflowswidget",
      BRAVAENTERPRISE: "bravaenterprisewidget",
      BRAVAIV: "otivwidget",
      ALL: "All"
    }),
    WIDGET_SCOPE: Object.freeze({
      RECENTLY_ACCESSED: "recentlyaccessed",
      FAVORITES: "favorites",
      CHECKOUT: "checkedout",
      MYSHARES: "myshares",
      INBOX: "inbox",
      MY_WORKFLOWS: "myworkflows",
      ALL_WORKFLOWS: "allworkflows",
      SAVED_SEARCHES: "savedsearch"
    }),
    MOBILE: Object.freeze({
      RECENTLY_ACCESSED: "mobile/widgets/recentlyaccessed",
      FAVORITES: "mobile/widgets/favorites",
      TASKS: "mobile/widgets/myassignments",
      SEARCH: "d2/widgets/mobile.search.widget",
      CHECKOUT: "d2/widgets/mobile.checkedout"
    }),
    TileConfigTypes: Object.freeze({
      WIDGET: "tile_config_widget",
      NONE: "tile_config_none"
    }),
    TableModes: Object.freeze({
      WRAP: "wrap",
      NOWRAP: "nowrap",
      THUMBNAIL: "thumbnail"
    })
  });
});