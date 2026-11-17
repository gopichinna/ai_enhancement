/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    DQL_NODE_PREFIX: "dql_",
    SSO_PARAM_PREFIX: "_sso_",
    SSO_AUTH_FAILURE_PARAM: "_ssoauthfail_",
    MAX_OBJECTIDS_ALLOWED: 200,
    MOBILE_VIEW_ENABLED: "mobile_view_enabled",
    SKIP_SSO_PARAM: "skipsso",
    NodeId: Object.freeze({
      REPOSITORY: "repository",
      REPOSITORY_SERVER: "Repository",
      DQL: "node_dql",
      FAVORITES: "favorites"
    }),
    WidgetId: Object.freeze({
      CHECKOUT: "_d2_widget_checkout",
      ADMIN_CHECKOUT: "_d2_widget_admin_checkout",
      ADMIN_WORKFLOWS: "_d2_widget_admin_workflows",
      FAVORITE: "_d2_widget_favorite",
      RECENTLYACCESSED: "_d2_widget_recentlyaccessed",
      MYSHARES: "_d2_widget_myshares",
      SAVED_SEARCH: "_d2_widget_saved_searches",
      TASKS: "_d2_widget_tasks",
      TASKATTACHMENTS: "_d2_widget_tasks_attachments",
      VIRTUAL_DOCUMENTS: "_d2_wdiget_virtual_documents",
      WORKFLOWS: "_d2_widget_workflows",
      COLLECTIONS: "_d2_widget_collections",
      MYCOLLECTIONS: "_d2_widget_mycollections",
      SHAREDCOLLECTIONS: "_d2_widget_sharedcollections"
    }),
    StorageKey: Object.freeze({
      AUTH_DATA: "authData",
      AUTH_TABS: "authTabs",
      WIDGET_CONTEXT: "widgetContext",
      GRID_SIZINGS: "_grid_sizings",
      LAST_SELECTED_LOGIN_ITEMS: "lastSelectedLoginItems",
      USER_PREFERENCE_STORE: "UserPreferences",
      TABLES_USER_PREFERENCE_STORE: "TablesUserPreferences",
      MOBILE: "mobile",
      TASK_DOCUMENTS: "d2_task_documents",
      WORKFLOW_DOCUMENTS: "d2_workflow_documents",
      REPO_DATA: "authRepo",
      JOB_TRACKER: "JobTracker",
      HIGHLIGHT_NODE_DETAILS: "highlightNodeDetails",
      WIDGET_STATE: "widget_state",
      WF_TIMELINE_SELECTED_TASK_FILTER: "wfTimelineSelectedTaskFilter",
      ANCESTOR_INFO: "_ancestorInfo",
      LAST_NAVIGATED_PATH: "last_navigated_path",
      CREATE_RELATION_FORM_VIEW: "createRelationFormView",
      ADD_TO_D2_COLLECTIONS_COMMAND: "addToD2CollectionsCommand",
      LAUNCH_WORKFLOW_ATTACHMENTS_VIEW_MIXIN: "launchWorkflowAttachmentsViewMixin",
      COMPARE_WITH_COMMAND: "compareWithCommand",
      INSERT_INHERITED_CHILDREN_COMMAND: "insertInheritedChildrenCommand",
      DOCUMENT_MERGE_VIEW: "documentMergeView",
      ADD_TASK_ATTACHMENTS_COMMAND: "addTaskAttachmentsCommand",
      ADD_CHILDREN_BROWSE_COMMAND: "addChildrenBrowseCommand",
      AVIATOR_ASSIGNMENT_ADD: "aviatorAssignmentAdd",
      COLLECTIONS_NAVIGATIONS: "collectionPerspectiveNavigation",
      WINDOW_POPUP: "windowPopup"
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
    LastSelectedLoginItems: Object.freeze({
      REPOSITORY: "repository",
      NETWORK_LOCATION: "networkLocation",
      APPLICATION: "application"
    }),
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
    ApplicationName: Object.freeze({
      MOBILE: "D2 Mobile"
    }),
    Resolution: Object.freeze({
      LOWEST: 768,
      LOW: 1024,
      MEDIUM: 1280,
      HIGH: 1440,
      HIGHEST: 1920
    }),
    MediaTypes: Object.freeze({
      DCTM_JSON: "application/vnd.emc.documentum+json",
      DCTM_XML: "application/vnd.emc.documentum+xml",
      DCTM_D2_V1_JSON: "application/vnd.documentum.d2.v1+json",
      JSON: "application/json"
    }),
    ColTypes: Object.freeze({
      SEARCH: "search",
      DEFAULT: "default"
    }),
    Types: Object.freeze({
      FOLDER: 0,
      OBJECT: 3,
      REPOSITORY: 141,
      CABINET: 142,
      BWS: 848,
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
      ACCESSOR: 998,
      COLLECTIONS: 997,
      COLLECTION_ITEMS: 996
    }),
    MenuTypes: Object.freeze({
      CONTEXT: "MenuContext",
      NEW_OBJECT: "MenuNewObject",
      USER: "MenuUser",
      VDOC: "MenuContextVD",
      VDOC_SNAPSHOT: "MenuContextVDSnapshot",
      TASKS: "MenuContextTasksList",
      TASK_DOCUMENTS: "MenuContextTaskDocument",
      WORKFLOWS: "MenuContextWorkflowOverview",
      COLLECTIONS: "MenuContextCollection",
      COLLECTION_ITEMS: "MenuContextCollectionItems",
      SAVED_SEARCH: "MenuContextSavedSearchObject",
      DETAIL_RELATIONS: "MenuContextDetailRelations",
      DETAIL_LOCATIONS: "MenuContextDetailLocations",
      DETAIL_AUDIT: "MenuContextDetailAudit",
      DETAIL_RENDITIONS: "MenuContextDetailRenditions",
      DETAIL_VERSIONS: "MenuContextDetailVersions",
      SUBMENU_SHARE: "MenuDocumentShare",
      SUBMENU_VD_ADD_CHILD: "MenuContextVDAddChildOption",
      SUBMENU_VD_REPLACE_CHILD: "MenuContextVDReplaceChildOption",
      SUBMENU_CHANGE_TASK_PRIORITY: "MenuContextTaskPriority",
      SUBMENU_LAUNCH_WORKFLOW: "MenuDocumentWorkflow",
      SUBMENU_MASS_UPDATE: "MenuToolsMassUpdate",
      SUBMENU_DOCUMENT_LIFECYCLE: "MenuDocumentLifeCycle",
      SUBMENU_DOCUMENT_LIFECYCLE_ATTACH: "MenuDocumentLifeCycleAttach",
      SUBMENU_DOCUMENT_D2_LIFECYCLE_ATTACH: "MenuDocumentD2LifeCycleAttach",
      BWS_OBJECT: "MenuContextBws",
      BWS_NEW_OBJECT: "MenuNewBwsObject",
      BWS_ITEMS: "MenuContextBwsItems"
    }),
    WizardType: Object.freeze({
      DIALOG: "DIALOG",
      SIDE_PANEL: "SIDE_PANEL"
    }),
    SEARCH: Object.freeze({
      ITEMSTOSHOWDEFAULT: 5,
      ITEMSTOSHOW: 25,
      TOPIC_SEPARATOR: "-",
      FACETTYPE_STRING: "string",
      FACETTYPE_INTEGER: "integer",
      FACETTYPE_DOUBLE: "double",
      FACETTYPE_DATE: "date",
      FACETTYPE_BOOLEAN: "boolean",
      FACETOPERATOR_AND: "AND",
      FACETOPERATOR_OR: "OR",
      FACETOPERATOR_IN: "IN",
      FACETOPERATOR_EQUAL: "EQUAL",
      FACET_EXPRESSIONSET: "expression-set",
      FACET_PROPERTY: "property"
    }),
    UrlParams: Object.freeze({
      REPOSITORY: "docbase",
      APPLICATION: "application",
      NETWORK_LOCATION: "networklocation",
      USERNAME: "login",
      PASSWORD: "password",
      OVERVIEW_PERSPECTIVE_LAUNCH_VIEWER_IF_CURRENT: "launchViewerIfCurrent",
      OVERVIEW_PERSPECTIVE_PREVENT_AUTO_VERSION_SWITCH: "preventAutoSwitchToCurrent"
    }),
    AppUrlParams: Object.freeze({
      SSO_FAIL: "_ssoauthfail_",
      LOGGED_OUT: "loggedout"
    }),
    AdvancedSearch: Object.freeze({
      CATEGORY_PRIVATE: "PRIVATE_SEARCH",
      CATEGORY_PUBLIC: "PUBLIC_SEARCH"
    }),
    ItemStates: Object.freeze({
      NOT_VISITED: "notVisited",
      NOT_VALIDATED: "notValidated",
      VALIDATED: "validated",
      PROCESSING: "processing",
      PENDING: "pending",
      INVALID_ENDING: "invalid ending"
    }),
    DocumentLinkType: Object.freeze({
      RELATION: "relation",
      VD: "vd",
      VD_RELATION: "both"
    }),
    HiddenItems: Object.freeze({
      NAME: "...",
      ID: "*"
    }),
    CreationProfileModes: Object.freeze({
      SINGLE_REPO_PASTE: "paste-single"
    }),
    PRESET_PROFILE: Object.freeze({
      KEY_PRESET_NAME: "presetConfigName",
      KEY_PRESET_VALUE_CONFIG_ID: "presetUniqueID"
    }),
    ShareIntentType: Object.freeze({
      PUBLISH: "publish",
      COLLABORATE: "collaborate"
    }),
    ShareActionType: Object.freeze({
      CREATE: "create",
      MANAGE: "manage",
      STOP: "stop"
    }),
    OpenTextCore: Object.freeze({
      PATH: "//CORE/"
    }),
    BrowserPluginMode: Object.freeze({
      WSCTF: "wsctf",
      THIN: "thin"
    }),
    UserSettings: Object.freeze({
      DOWNLOAD_VIEW_PATH: "download_location_view",
      DOWNLOAD_CHECKOUT_PATH: "download_location_checkout"
    }),
    ColumnPreferenceId: Object.freeze({
      NODE_INBOX_TASKS: "node_inbox_tasks",
      DETAIL_WORKFLOW_OVERVIEW_SV: "detail_workflow_overview_sv"
    }),
    MenuPosition: Object.freeze({
      INLINE: "INLINE",
      INLINE_ROW: "INLINE_ROW"
    }),
    TasksPerformersType: Object.freeze({
      LIST: "list",
      SINGLE: "single"
    }),
    WorkflowsReportingType: Object.freeze({
      ALL: "All",
      USER: "User",
      EITHER: "Either"
    }),
    WorkflowState: Object.freeze({
      SCHEDULED: "scheduled",
      RUNNING: "running",
      PAUSED: "paused",
      FINISHED: "finished",
      ABORTED: "aborted"
    }),
    WorkflowTaskState: Object.freeze({
      FUTURE: "future",
      PENDING: "pending",
      RUNNING: "running",
      PAUSED: "paused",
      ACQUIRED: "acquired",
      FINISHED: "finished",
      FAULTED: "faulted",
      EVENT_COMPLETED: "event_completed"
    }),
    ViewType: Object.freeze({
      O2_EDIT: "O2_EDIT"
    }),
    WorkflowUserType: Object.freeze({
      SUPERVISOR: "supervisor",
      PERFORMER: "performer"
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
    VDAddVesionOptions: Object.freeze({
      ROOT_AND_DESCENDANTS: "vdroot_desc",
      ROOT: "vdroot"
    }),
    MassUpdateOptions: Object.freeze({
      ALL_VERSIONS: "all_versions",
      FILE_PROPERTIES: "file_properties",
      FOLDER_PROPERTIES: "folder_properties",
      ITEM_PROPERTIES: "item_properties",
      SUB_FOLDERS: "sub_folders",
      FILES_IN_SUB_FOLDERS: "files_in_sub_folders",
      VIRTUAL_DOCUMENTS: "virtual_documents",
      VIRTUAL_DOCUMENTS_DESCENDANTS: "virtual_documents_descendants"
    }),
    ComparableDocumentPreviewTypes: Object.freeze({
      TEXT_COMPARE: "text-compare",
      GRAPHICAL_COMPARE: "graphical-compare",
      MULTI_FILE_VIEW: "multi-file-view"
    }),
    QueryFormTypes: Object.freeze({
      QUERY_FORM_TYPE: "query_form_type",
      QR_CODE: "qr_code"
    }),
    Permissions: Object.freeze({
      NONE: "none",
      BROWSE: "browse",
      READ: "read",
      RELATE: "relate",
      VERSION: "version",
      WRITE: "write",
      DELETE: "delete"
    }),
    AccessorType: Object.freeze({
      ROLE: "role",
      GROUP: "group",
      USER: "user"
    }),
    ModelAlertTypes: Object.freeze({
      ALERT: "alert",
      TOAST: "toast"
    }),
    ContentUploadOps: Object.freeze({
      IMPORT: "import",
      CHECKIN: "checkin"
    }),
    WizardSize: Object.freeze({
      X_SMALL: "XS",
      SMALL: "S",
      MEDIUM: "M",
      LARGE: "L",
      X_LARGE: "XL"
    }),
    ISODateFormats: Object.freeze({
      DATE_ONLY: "YYYY-MM-DD",
      DATE_TIME: "YYYY-MM-DDTHH:mm:ss.SSSZZ",
      DATE_TIME_INPUT: "YYYY-MM-DDTHH:mm"
    }),
    OES_USER: "M365_SERVICE",
    AUTH_MODE_BASIC: "basic-ct",
    AUTO_RELOAD_INTERVAL: 6e4,
    AspectType: Object.freeze({
      bwsAspect: "dm_bws_aspect"
    })
  });
});