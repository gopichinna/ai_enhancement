/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    DQL_NODE_PREFIX: "dql_",
    SSO_PARAM_PREFIX: "_sso_",
    SSO_AUTH_FAILURE_PARAM: "_ssoauthfail_",
    SKIP_SSO_PARAM: "skipsso",
    MAX_OBJECTIDS_ALLOWED: 200,
    Headers: Object.freeze({
      APPLICATION: "X-D2-APPLICATION-NAME",
      NETWORK_LOCATION: "X-D2-NETWORK-LOCATION",
      CLIENT_TYPE: "X-D2-CLIENT-TYPE",
      EMBED_MODE: "X-D2-EMBED-MODE",
      OTDS_TKT_HEADER: "OTDS-TICKET",
      TIME_ZONE: "X-D2-TIMEZONE",
      CLIENT_LOCATION: "X-CLIENT-LOCATION",
      CLIENT_APPLICATION: "X-CLIENT-APPLICATION-NAME"
    }),
    ClientTypes: Object.freeze({
      DESKTOP: "D2SmartView",
      MOBILE: "D2Mobile"
    }),
    MediaTypes: Object.freeze({
      DCTM_JSON: "application/vnd.emc.documentum+json",
      DCTM_XML: "application/vnd.emc.documentum+xml",
      DCTM_D2_V1_JSON: "application/vnd.documentum.d2.v1+json"
    }),
    AppUrlParams: Object.freeze({
      SSO_FAIL: "_ssoauthfail_",
      LOGGED_OUT: "loggedout"
    }),
    StorageKey: Object.freeze({
      AUTH_DATA: "authData",
      AUTH_TABS: "authTabs",
      WIDGET_CONTEXT: "widgetContext",
      LAST_SELECTED_LOGIN_ITEMS: "lastSelectedLoginItems",
      USER_PREFERENCE_STORE: "UserPreferences",
      TABLES_USER_PREFERENCE_STORE: "TablesUserPreferences",
      MOBILE: "mobile",
      TASK_DOCUMENTS: "d2_task_documents",
      WORKFLOW_DOCUMENTS: "d2_workflow_documents",
      REPO_DATA: "authRepo",
      JOB_TRACKER: "JobTracker"
    }),
    AuthStorage: Object.freeze({
      REPOSITORY: "repository",
      APPLICATION: "application",
      NETWORK_LOCATION: "networkLocation",
      CLIENT_LOCATION: "X-CLIENT-LOCATION",
      CLIENT_APPLICATION: "X-CLIENT-APPLICATION-NAME",
      LOCATION_PERMISSION: "LOCATION-PERMISSION",
      SESSION_EXPIRY: "SESSION_EXPIRY",
      SESSION_SERVER_DATE: "SESSION_SERVER_DATE"
    }),
    UrlParams: Object.freeze({
      REPOSITORY: "docbase",
      APPLICATION: "application",
      NETWORK_LOCATION: "networklocation",
      USERNAME: "login",
      PASSWORD: "password"
    }),
    LastSelectedLoginItems: Object.freeze({
      REPOSITORY: "repository",
      NETWORK_LOCATION: "networkLocation",
      APPLICATION: "application"
    }),
    Types: Object.freeze({
      FOLDER: 0,
      OBJECT: 3,
      REPOSITORY: 141,
      CABINET: 142,
      DOCUMENT: 144,
      RENDITION: 146,
      WORKFLOW_STEP: 153,
      TASK: 206,
      TASK_PERFORMER: 207,
      WORKFLOW: 208,
      WORKFLOW_EVENT: 209,
      TASK_EVENT: 210,
      SAVED_SEARCH_OBJECT: 215,
      EMAIL: 749,
      DQL: 999,
      ACCESSOR: 998
    }),
    NodeId: Object.freeze({
      REPOSITORY: "repository",
      REPOSITORY_SERVER: "Repository",
      DQL: "node_dql",
      FAVORITES: "favorites"
    }),
    MenuTypes: Object.freeze({
      WORKFLOWS: "MenuContextWorkflowOverview"
    }),
    WidgetId: Object.freeze({
      CHECKOUT: "_d2_widget_checkout",
      FAVORITE: "_d2_widget_favorite",
      RECENTLYACCESSED: "_d2_widget_recentlyaccessed",
      MYSHARES: "_d2_widget_myshares",
      SAVED_SEARCH: "_d2_widget_saved_searches",
      TASKS: "_d2_widget_tasks",
      TASKATTACHMENTS: "_d2_widget_tasks_attachments",
      VIRTUAL_DOCUMENTS: "_d2_wdiget_virtual_documents",
      WORKFLOWS: "_d2_widget_workflows"
    }),
    TasksPerformersType: Object.freeze({
      LIST: "list",
      SINGLE: "single"
    }),
    WorkflowAuditPerformerType: Object.freeze({
      SYSTEM: "system",
      TRACKER: "tracker",
      USER: "user",
      GROUP: "group",
      SIGNATURE: "signature"
    }),
    WorkflowActivityType: Object.freeze({
      AUTOMATIC: "AUTOMATIC",
      MANUAL: "MANUAL"
    }),
    ApplicationName: Object.freeze({
      MOBILE: "D2 Mobile"
    }),
    AccessorType: Object.freeze({
      ROLE: "role",
      GROUP: "group",
      USER: "user"
    }),
    Resolution: Object.freeze({
      LOWEST: 768,
      LOW: 1024,
      MEDIUM: 1280,
      HIGH: 1440,
      HIGHEST: 1920
    })
  });
});