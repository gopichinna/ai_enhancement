/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "d2/utils/contexts/embed.context.controller", "d2/utils/constants", "dctmw/utils/utils", "csui-ext!d2/commands/node.actions.rules", "css!d2/commands/impl/icons" ], function(module, _, EmbedContextController, constants, utils, extraActionRules) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    embedMode: false
  });
  function isRootNodeInEmbedMode(nodeId) {
    var embedData = EmbedContextController.getEmbedData();
    return embedData && embedData.mode === "folderbrowser" && embedData.rootNodeId === nodeId;
  }
  var defaultNodeActions = [ {
    command_key: "D2-ShowDialog",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && (item.actionParameters["DIALOG_NAME"] !== "PropertiesDialog" || item.actionParameters["property_config"] && item.actionParameters["DIALOG_NAME"] === "PropertiesDialog");
    },
    prioritisePluginImpl: true,
    iconName: "d2_action_custom_dialog"
  }, {
    command_key: "Download",
    decides: function(item) {
      return item.action === "D2_ACTION_CONTENT_EXPORT" && (item.actionParameters === undefined || item.actionParameters.c2_config_name === undefined);
    },
    iconName: "csui_action_download32"
  }, {
    command_key: "D2-CSV-Export",
    decides: function(item) {
      return item.action === "D2_ACTION_PROPERTIES_EXPORT";
    },
    iconName: "csui_action_download32"
  }, {
    command_key: "DownloadC2Override",
    decides: function(item) {
      return item.action === "D2_ACTION_CONTENT_EXPORT_C2_OVERRIDE" && (item.actionParameters === undefined || item.actionParameters.c2_config_name === undefined);
    },
    iconName: "csui_action_download32"
  }, {
    command_key: "D2-ViewNative",
    equals: {
      action: "D2_ACTION_CONTENT_VIEW_NATIVE"
    },
    iconName: "d2_action_view_native_content"
  }, {
    command_key: "D2-ViewC2Override",
    equals: {
      action: "D2_ACTION_CONTENT_VIEW_C2_OVERRIDE"
    },
    iconName: "d2_action_view_native_content"
  }, {
    command_key: "ReserveDoc",
    equals: {
      action: "D2_ACTION_CONTENT_CHECKOUT"
    },
    iconName: "csui_action_reserve32"
  }, {
    command_key: "D2-Edit",
    equals: {
      action: "D2_ACTION_CONTENT_EDIT"
    },
    iconName: "csui_action_edit32"
  }, {
    command_key: "UnreserveDoc",
    equals: {
      action: "D2_ACTION_CONTENT_CANCEL_CHECKOUT"
    },
    iconName: "csui_action_unreserve32"
  }, {
    command_key: "D2-Locations",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "D2SVLocationsManager";
    },
    iconName: "d2_action_locations"
  }, {
    command_key: "D2-TaskDocumentLocations",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "TaskDocumentsLocationsManager";
    },
    iconName: "d2_action_locations"
  }, {
    command_key: "D2-TaskDocumentVersions",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "D2SVTaskVersionsManager";
    },
    iconName: "d2_action_version_control32"
  }, {
    command_key: "D2-Audits",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "D2SVAuditsManager";
    },
    iconName: "d2_action_workflow_audit"
  }, {
    command_key: "D2-Renditions",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "D2SVRenditionsManager";
    }
  }, {
    command_key: "D2-Relations",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "D2SVRelationsManager";
    }
  }, {
    command_key: "comment",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "CommentManager";
    }
  }, {
    command_key: "EmailLink",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "SendmailManager";
    },
    iconName: "csui_action_share32"
  }, {
    command_key: "VersionDelete",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "DestroyManager" && item.properties && item.properties.menuType === constants.MenuTypes.DETAIL_VERSIONS;
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "D2-DeleteSavedSearch",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "DestroyManager" && item.properties && item.properties.menuType === constants.MenuTypes.SAVED_SEARCH;
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "Delete",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "DestroyManager" && !isRootNodeInEmbedMode(item.nodeId) && (item.properties && item.properties.menuType !== constants.MenuTypes.COLLECTIONS);
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "D2-RelationDelete",
    equals: {
      action: "D2_ACTION_RELATION_DESTROY"
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "D2-CreateRelations",
    equals: {
      action: "D2_ACTION_RELATION_CREATE"
    },
    iconName: "d2_action_create_relations"
  }, {
    command_key: "Copy",
    decides: function(item) {
      return item.action === "D2_ACTION_COPY" && !isRootNodeInEmbedMode(item.nodeId);
    },
    iconName: "csui_action_copy32"
  }, {
    command_key: "D2-CutSavedSearch",
    decides: function(item) {
      return item.action === "D2_ACTION_CUT" && item.properties && item.properties.menuType === constants.MenuTypes.SAVED_SEARCH;
    },
    iconName: "d2_action_cut"
  }, {
    command_key: "D2-Cut",
    decides: function(item) {
      return item.action === "D2_ACTION_CUT" && !isRootNodeInEmbedMode(item.nodeId);
    },
    iconName: "d2_action_cut"
  }, {
    command_key: "D2-PasteSavedSearch",
    decides: function(item) {
      return item.action === "D2_ACTION_PASTE" && item.properties && item.properties.menuType === constants.MenuTypes.SAVED_SEARCH;
    }
  }, {
    command_key: "D2-PasteAsLink",
    equals: {
      action: "D2_ACTION_PASTE_LINK"
    }
  }, {
    command_key: "D2-Paste",
    equals: {
      action: "D2_ACTION_PASTE"
    }
  }, {
    command_key: "D2-RenditionDelete",
    equals: {
      action: "D2_ACTION_REMOVE_RENDITION"
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "D2-Print",
    equals: {
      action: "D2_ACTION_CONTENT_PRINT"
    },
    iconName: "csui_action_print32"
  }, {
    command_key: "D2-AddToCollections",
    equals: {
      action: "D2_ACTION_ADD_TO_COLLECTION"
    },
    iconName: "d2_action_create_file"
  }, {
    command_key: "D2-GoToD2Collection",
    equals: {
      action: "D2_ACTION_OPEN_COLLECTION"
    }
  }, {
    command_key: "D2-ReviewEditConsolidatedCopy",
    equals: {
      action: "D2_ACTION_CONTENT_ANNOTATE_NATIVE_ANNOTATION"
    }
  }, {
    command_key: "D2-ReviewEditPersonalCopy",
    equals: {
      action: "D2_ACTION_CONTENT_EDIT_NATIVE_ANNOTATION"
    }
  }, {
    command_key: "D2-CollaborativeCheckoutMerge",
    equals: {
      action: "D2_ACTION_CONTENT_EDIT_WITH_NATIVE_ANNOTATION"
    }
  }, {
    command_key: "D2-rename-collection",
    equals: {
      action: "D2_ACTION_RENAME_COLLECTION"
    },
    iconName: "d2-icon-type-collections"
  }, {
    command_key: "D2-manageshare-collection",
    equals: {
      action: "D2_ACTION_MANAGE_SHARE_COLLECTION"
    },
    iconName: "d2_action_share_collection"
  }, {
    command_key: "D2-share-collection",
    equals: {
      action: "D2_ACTION_SHARE_COLLECTION"
    },
    iconName: "d2_action_share_collection"
  }, {
    command_key: "D2-RemoveCollectionItem",
    equals: {
      action: "D2_ACTION_REMOVE_FROM_COLLECTION"
    },
    iconName: "d2_action_remove_collection_item"
  }, {
    command_key: "D2-MoveCollectionItem",
    equals: {
      action: "D2_ACTION_MOVE_COLLECTION_ITEM"
    },
    iconName: "d2-icon-type-collections"
  }, {
    command_key: "D2-DeleteCollection",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "DestroyManager" && item.properties && item.properties.menuType === constants.MenuTypes.COLLECTIONS;
    },
    iconName: "csui_action_delete32"
  }, {
    command_key: "D2-Dump",
    equals: {
      action: "D2_ACTION_DUMP"
    },
    iconName: "d2_action_dump"
  }, {
    command_key: "CopyLink",
    equals: {
      action: "D2_ACTION_COPY_LINK_IN_CLIPBOARD"
    },
    iconName: "csui_action_copy_link32"
  }, {
    command_key: "D2-OpenUrl",
    equals: {
      action: "D2_ACTION_OPEN_URL"
    },
    iconName: "d2_action_open_url"
  }, {
    command_key: "AddVersion",
    equals: {
      action: "D2_ACTION_CONTENT_IMPORT_AS_VERSION"
    },
    iconName: "csui_action_add_version32"
  }, {
    command_key: "D2-AddRendition",
    decides: function(item) {
      return item.action === "D2_ACTION_RENDITION_ADD";
    },
    iconName: "d2_action_import_rendition"
  }, {
    command_key: "D2-OpenVDoc",
    equals: {
      action: "D2_ACTION_OPEN_VD"
    },
    iconName: "d2_action_display_outline"
  }, {
    command_key: "D2-EditVDoc",
    equals: {
      action: "D2_ACTION_EDIT_VD"
    },
    iconName: "d2_action_display_outline"
  }, {
    command_key: "D2-CompareVDoc",
    equals: {
      action: "D2_ACTION_COMPARE_VD"
    },
    iconName: "d2_action_display_outline"
  }, {
    command_key: "D2-OpenVDocSnapshot",
    equals: {
      action: "D2_ACTION_OPEN_SNAPSHOT"
    },
    iconName: "d2_action_display_outline"
  }, {
    command_key: "D2-ConvertToVDoc",
    equals: {
      action: "D2_ACTION_CONVERT_VD"
    },
    iconName: "d2_action_convert_to_vdoc"
  }, {
    command_key: "D2-ConvertToSimpleDoc",
    equals: {
      action: "D2_ACTION_CONVERT_DOC"
    },
    iconName: "d2_action_convert_to_simple_doc"
  }, {
    command_key: "D2-ConvertToVDocFolder",
    equals: {
      action: "D2_ACTION_FOLDERTOVD_CONVERT"
    },
    iconName: "d2_action_convert_to_vdoc"
  }, {
    command_key: "D2-VDocCreateSnapshot",
    equals: {
      action: "D2_ACTION_VD_SNAPSHOT_CREATE"
    },
    iconName: "d2_action_create_snapshot"
  }, {
    command_key: "D2-ImportFile",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "ImportManager";
    },
    iconName: "d2_action_import_file"
  }, {
    command_key: "D2-CallService",
    equals: {
      action: "D2_ACTION_EXECUTE"
    },
    iconName: "d2_action_call_service"
  }, {
    command_key: "D2-CreateFile",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "CreateManager";
    },
    iconName: "d2_action_create_file"
  }, {
    command_key: "D2-CreateFolder",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "CreateFolderManager";
    },
    type: constants.Types.FOLDER
  }, {
    command_key: "D2-ImportFolder",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "ImportStructureManager";
    },
    iconName: "d2_action_import_folder"
  }, {
    command_key: "D2-AcquireTask",
    equals: {
      action: "D2_ACTION_TASK_ACQUIRE"
    },
    iconName: "d2_action_acquire_task"
  }, {
    command_key: "D2-ForwardTask",
    equals: {
      action: "D2_ACTION_TASK_FORWARD"
    },
    iconName: "d2_action_forward_task"
  }, {
    command_key: "D2-RejectTask",
    equals: {
      action: "D2_ACTION_TASK_REJECT"
    },
    iconName: "d2_action_reject_task"
  }, {
    command_key: "D2-DelegateTask",
    equals: {
      action: "D2_ACTION_TASK_DELEGATE"
    },
    iconName: "d2_action_delegate_task"
  }, {
    command_key: "D2-PauseTask",
    equals: {
      action: "D2_ACTION_TASK_PAUSE"
    },
    iconName: "d2_action_pause_task"
  }, {
    command_key: "D2-RerunTask",
    equals: {
      action: "D2_ACTION_TASK_RERUN"
    }
  }, {
    command_key: "D2-CompleteTask",
    equals: {
      action: "D2_ACTION_TASK_COMPLETE"
    }
  }, {
    command_key: "D2-ResumeTask",
    equals: {
      action: "D2_ACTION_TASK_RESUME"
    },
    iconName: "d2_action_resume_task"
  }, {
    command_key: "D2-WorkflowUpdatePerformers",
    equals: {
      action: "D2_ACTION_WORKFLOW_UPDATE_PERFORMERS"
    },
    iconName: "d2_action_update_performer"
  }, {
    command_key: "D2-WorkflowManageAttachment",
    equals: {
      action: "D2_ACTION_WORKFLOW_MANAGE_ATTACHMENTS"
    },
    iconName: "d2_action_manage_supporting_files"
  }, {
    command_key: "D2-TaskAddWorkingFile",
    equals: {
      action: "D2_ACTION_TASK_ADD_WORKINGFILE"
    },
    iconName: "d2_action_manage_supporting_files"
  }, {
    command_key: "D2-TaskRemoveWorkingFile",
    equals: {
      action: "D2_ACTION_TASK_REMOVE_WORKINGFILE"
    },
    iconName: "d2_action_manage_supporting_files"
  }, {
    command_key: "D2-AddTaskNote",
    equals: {
      action: "D2_ACTION_TASK_NOTE"
    },
    iconName: "d2_action_add_task_note"
  }, {
    command_key: "D2-WorkflowAbort",
    equals: {
      action: "D2_ACTION_WORKFLOW_ABORT"
    },
    iconName: "d2_action_abort_workflow"
  }, {
    command_key: "D2-WorkflowStart",
    equals: {
      action: "D2_ACTION_WORKFLOW_LAUNCH_SCHEDULED"
    },
    iconName: "d2_action_start_workflow"
  }, {
    command_key: "D2-WorkflowResume",
    equals: {
      action: "D2_ACTION_WORKFLOW_RESUME"
    },
    iconName: "d2_action_start_workflow"
  }, {
    command_key: "D2-WorkflowPause",
    equals: {
      action: "D2_ACTION_WORKFLOW_PAUSE"
    },
    iconName: "d2_action_pause_workflow"
  }, {
    command_key: "D2-WorkflowChangeSupervisor",
    equals: {
      action: "D2_ACTION_WORKFLOW_UPDATE_SUPERVISOR"
    },
    iconName: "d2_action_change_supervisor"
  }, {
    command_key: "D2-WorkflowEmailSupervisor",
    equals: {
      action: "D2_ACTION_WORKFLOW_EMAIL_SUPERVISOR"
    },
    iconName: "d2_action_email_supervisor"
  }, {
    command_key: "D2-WorkflowEmailPerformers",
    equals: {
      action: "D2_ACTION_WORKFLOW_EMAIL_PERFORMERS"
    },
    iconName: "d2_action_email_performers"
  }, {
    command_key: "D2-AddWorkflowNote",
    equals: {
      action: "D2_ACTION_WORKFLOW_NOTE"
    },
    iconName: "d2_action_add_task_note"
  }, {
    command_key: "D2-WorkflowAudit",
    equals: {
      action: "D2_ACTION_WORKFLOW_AUDIT"
    },
    iconName: "d2_action_workflow_audit"
  }, {
    command_key: "D2-ReadTask",
    decides: function(item) {
      return item && item.action && item.action === "D2_ACTION_TASK_READ" && item.actionParameters && item.actionParameters.read === "true";
    },
    iconName: "d2_action_mark_task_as_read"
  }, {
    command_key: "D2-UnreadTask",
    decides: function(item) {
      return item && item.action && item.action === "D2_ACTION_TASK_READ" && item.actionParameters && item.actionParameters.read === "false";
    },
    iconName: "d2_action_mark_task_as_unread"
  }, {
    command_key: "D2-PrioritizeTask",
    equals: {
      action: "D2_ACTION_TASK_PRIORITY"
    }
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === "MenuContextTaskPriority";
    },
    iconName: "d2_action_change_task_priority"
  }, {
    command_key: "D2-LaunchWorkflow",
    equals: {
      action: "D2_ACTION_WORKFLOW_LAUNCH"
    },
    iconName: "d2_action_launch_workflow",
    dynamicIdAttribute: "config-id"
  }, {
    command_key: "D2-MassUpdate",
    equals: {
      action: "D2_ACTION_MASS_UPDATE"
    },
    dynamicIdAttribute: "config-id",
    iconName: "d2_action_mass_update"
  }, {
    command_key: "D2-ShowWorkflowHistory",
    equals: {
      action: "D2_ACTION_SHOW_WORKFLOW_HISTORY"
    },
    iconName: "d2_action_workflow_history"
  }, {
    command_key: "D2-CreateSearchCategory",
    decides: function(item) {
      return item && item.action === "D2_ACTION_QUERY_CATEGORY_DIALOG" && item.properties && item.properties.menuType === constants.MenuTypes.SAVED_SEARCH;
    }
  }, {
    command_key: "Rename",
    iconName: "csui_action_rename32",
    equals: {
      action: "D2_ACTION_RENAME"
    }
  }, {
    command_key: "D2-RunSavedSearch",
    iconName: "d2_action_run_search_object",
    decides: function(item) {
      return item && item.action === "D2_ACTION_LOCATE_SEARCH" && item.properties && item.properties.menuType === constants.MenuTypes.SAVED_SEARCH;
    }
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_MASS_UPDATE;
    },
    iconName: "d2_action_mass_update"
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_LAUNCH_WORKFLOW;
    },
    iconName: "d2_action_launch_workflow"
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === "MenuDocumentShare";
    },
    iconName: "csui_action_share32"
  }, {
    command_key: "D2-ShareToCoreCreate",
    decides: function(item) {
      if (item && item.action && (item.action === "D2_ACTION_SHARE_TO_CORE" || item.action === "D2_ACTION_SHARE_TO_CORE_C2_OVERRIDE")) {
        if (item.properties && item.action === "D2_ACTION_SHARE_TO_CORE_C2_OVERRIDE") {
          item.properties.c2Override = true;
        }
        return true;
      }
      return false;
    },
    iconName: "csui_action_share32"
  }, {
    command_key: "D2-ShareToCoreManage",
    equals: {
      action: "D2_ACTION_MANAGE_SHARE"
    },
    iconName: "csui_action_share32"
  }, {
    command_key: "D2-ShareToCoreStop",
    equals: {
      action: "D2_ACTION_STOP_SHARE"
    },
    iconName: "csui_action_share32"
  }, {
    command_key: "Browse",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_OVERVIEW";
    }
  }, {
    command_key: "D2-Viewer",
    decides: function(item) {
      return item.action === "D2_ACTION_CONTENT_FULL_VIEW";
    }
  }, {
    command_key: "D2-Viewer",
    decides: function(item) {
      return item.action === "D2_ACTION_CONTENT_MINI_VIEW";
    },
    isMiniView: true
  }, {
    command_key: "D2-CompareText",
    equals: {
      action: "D2_ACTION_CONTENT_VIEWER_COMPARE_TEXT"
    },
    iconName: "d2_compare_text"
  }, {
    command_key: "D2-CompareGraphical",
    equals: {
      action: "D2_ACTION_CONTENT_VIEWER_COMPARE_GRAPHIC"
    },
    iconName: "d2_compare_graphical"
  }, {
    command_key: "D2-CompareWith",
    equals: {
      action: "D2_ACTION_CONTENT_VIEWER_COMPARE_WITH"
    },
    iconName: "d2_action_compare_with"
  }, {
    command_key: "D2-DocumentMerge",
    equals: {
      action: "D2_ACTION_DOCUMENT_MERGE"
    },
    iconName: "d2_action_merge_document"
  }, {
    command_key: "D2-GoToLocation",
    equals: {
      action: "D2_ACTION_LOCATE_OBJECT"
    },
    iconName: "d2_action_go_to_location"
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_DOCUMENT_LIFECYCLE;
    },
    iconName: "d2_action_lifecycle"
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_DOCUMENT_LIFECYCLE_ATTACH;
    },
    iconName: "d2_action_lifecycle"
  }, {
    command_key: "D2-SubMenu",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_DOCUMENT_D2_LIFECYCLE_ATTACH;
    },
    iconName: "d2_action_lifecycle"
  }, {
    command_key: "D2-LifeCycleStateChange",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters["MANAGER"] === "D2LifeCycleManager";
    },
    iconName: "d2_action_lifecycle",
    dynamicIdAttribute: [ "targetState", "MANAGER" ]
  }, {
    command_key: "D2-DctmLifeCycleStateAction",
    decides: function(item) {
      return item.action === "D2_ACTION_LIFECYCLE_DCTM" && item.actionParameters && !!item.actionParameters["DIALOG_LIST_PARAM"] && !!item.actionParameters["operation"];
    }
  }, {
    command_key: "separator",
    equals: {
      id: "separator"
    }
  }, {
    command_key: "placeholder",
    decides: function(item) {
      return item.action === "DEFAULT" && item.actionParameters && item.actionParameters.type === "placeholder" && item.actionParameters.dynamic === "true";
    }
  }, {
    command_key: "D2-Permissions",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "PermissionsManager";
    },
    iconName: "csui_action_view_perms32"
  }, {
    command_key: "D2-DirectView",
    equals: {
      action: "D2_ACTION_CONTENT_VIEW_POP_OUT"
    },
    iconName: "d2_action_direct_view"
  }, {
    command_key: "Aviator-LaunchChat",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "AviatorChatManager";
    },
    iconName: "aie_action_aviator32"
  }, {
    command_key: "D2-ShowExternal",
    equals: {
      action: "D2_ACTION_SHOW_EXTERNAL_WIDGET"
    },
    iconName: "d2_action_external_widget"
  }, {
    command_key: "D2-Create-Workspace",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "CreateBWSManager";
    }
  }, {
    command_key: "BWS-Members",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "WorkspaceMembersManager";
    }
  }, {
    command_key: "BWS-Properties",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && item.properties.menuType === constants.MenuTypes.BWS_OBJECT && item.actionParameters && item.actionParameters.DIALOG_NAME === "PropertiesDialog";
    }
  }, {
    command_key: "D2-BWSAddFavorite",
    decides: function(item) {
      return item.action === "D2_ACTION_ADD_TO_FAVOURITES";
    }
  }, {
    command_key: "D2-BWSRemoveFavorite",
    decides: function(item) {
      return item.action === "D2_ACTION_REMOVE_FROM_FAVOURITES";
    }
  }, {
    command_key: "D2-EditOnline",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "MSEditOnline";
    },
    iconName: "d2_action_edit_online"
  } ];
  if (utils.isMobile()) {
    var commandsNotForMobile = [ "comment", "ReserveDoc", "VersionDelete", "D2-Cut", "D2-RenditionDelete", "D2-CreateFile", "D2-CreateFolder", "D2-ImportFolder", "D2-ShowDialog" ];
    defaultNodeActions = _.reject(defaultNodeActions, function(currAction) {
      return _.indexOf(commandsNotForMobile, currAction.command_key) !== -1;
    });
  }
  if (extraActionRules) {
    defaultNodeActions = defaultNodeActions.concat(_.flatten(extraActionRules, true));
  }
  return defaultNodeActions;
});