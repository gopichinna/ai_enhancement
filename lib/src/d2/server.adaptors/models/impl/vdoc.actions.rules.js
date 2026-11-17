/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants", "css!d2/commands/impl/icons" ], function(constants) {
  "use strict";
  return [ {
    command_key: "Download",
    decides: function(item) {
      return item.action === "D2_ACTION_CONTENT_DOWNLOAD" && (item.actionParameters === undefined || item.actionParameters.c2_config_name === undefined);
    },
    iconName: "csui_action_download32"
  }, {
    command_key: "properties",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && (item.actionParameters === undefined || item.actionParameters.DIALOG_NAME === "PropertiesDialog");
    },
    iconName: "csui_action_properties32"
  }, {
    command_key: "D2-ShowDialog",
    decides: function(item) {
      return item.action === "D2_ACTION_DISPLAY_DIALOG" && item.actionParameters["DIALOG_NAME"] !== "PropertiesDialog";
    },
    prioritisePluginImpl: true,
    iconName: "d2_action_custom_dialog"
  }, {
    command_key: "D2-Edit",
    equals: {
      action: "D2_ACTION_CONTENT_EDIT"
    },
    iconName: "csui_action_edit32"
  }, {
    command_key: "ReserveDoc",
    equals: {
      action: "D2_ACTION_CONTENT_CHECKOUT"
    },
    iconName: "csui_action_reserve32"
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
    command_key: "D2-VDocCreateSnapshot",
    equals: {
      action: "D2_ACTION_VD_SNAPSHOT_CREATE"
    },
    iconName: "d2_action_create_snapshot"
  }, {
    command_key: "D2-VDAddVersion",
    equals: {
      action: "D2_ACTION_VD_CHECKIN_DESCENDANTS"
    },
    iconName: "csui_action_add_version32"
  }, {
    command_key: "AddVersion",
    equals: {
      action: "D2_ACTION_VD_CHECKIN_DESCENDANTS"
    },
    iconName: "csui_action_add_version32"
  }, {
    command_key: "UnreserveDoc",
    equals: {
      action: "D2_ACTION_VD_CANCEL_CHECKOUT"
    },
    iconName: "csui_action_unreserve32"
  }, {
    command_key: "D2-VDocAddChildrenBrowse",
    equals: {
      action: "D2_ACTION_VD_ADD_CHILD_SELECTED"
    },
    iconName: "d2_action_add_child_browse"
  }, {
    command_key: "D2-vDocCreateFile",
    equals: {
      action: "VIRTUAL_DOCUMENT_CREATE_MANAGER"
    },
    iconName: "d2_action_add_child_create"
  }, {
    command_key: "D2-VDocAddChildrenImport",
    equals: {
      action: "VIRTUAL_DOCUMENT_IMPORT_MANAGER"
    },
    iconName: "d2_action_add_child_import"
  }, {
    command_key: "D2-VDocInheritedChildren",
    equals: {
      action: "D2_ACTION_VD_INSERT_INHERITED_COMPONENT"
    },
    iconName: "d2_action_add_child_template"
  }, {
    command_key: "D2-VDocSetChildVersion",
    equals: {
      action: "D2_ACTION_VD_SET_CHILD_BINDING_VERSION"
    },
    iconName: "d2_action_set_binding_version"
  }, {
    command_key: "D2-VDocReplaceChildBrowse",
    equals: {
      action: "D2_ACTION_VD_REPLACE_CHILD_SELECTED"
    },
    iconName: "d2_action_replace_child_browse"
  }, {
    command_key: "D2-VDocReplaceChildCreate",
    equals: {
      action: "REPLACE_VIRTUAL_DOCUMENT_CREATE_MANAGER"
    },
    iconName: "d2_action_replace_child_create"
  }, {
    command_key: "D2-VDocReplaceChildImport",
    equals: {
      action: "REPLACE_VIRTUAL_DOCUMENT_IMPORT_MANAGER"
    },
    iconName: "d2_action_replace_child_import"
  }, {
    command_key: "D2-VDocRemoveChildren",
    equals: {
      action: "D2_ACTION_VD_REMOVE_CHILD_SELECTED"
    },
    iconName: "d2_action_remove_child"
  }, {
    command_key: "D2-GoToLocation",
    equals: {
      action: "D2_ACTION_LOCATE_OBJECT"
    },
    iconName: "d2_action_locate_object"
  }, {
    command_key: "D2-OpenUrl",
    equals: {
      action: "D2_ACTION_OPEN_URL"
    },
    iconName: "d2_action_open_url"
  }, {
    command_key: "D2-Print",
    equals: {
      action: "D2_ACTION_CONTENT_PRINT"
    },
    iconName: "csui_action_print32"
  }, {
    command_key: "comment",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "CommentManager";
    }
  }, {
    command_key: "D2-SubMenu-VDAddChild",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_VD_ADD_CHILD;
    },
    iconName: "d2_action_add_child_sub_menu"
  }, {
    command_key: "D2-SubMenu-VDReplaceChild",
    decides: function(item) {
      return item && item.properties && item.properties.subMenuType === constants.MenuTypes.SUBMENU_VD_REPLACE_CHILD;
    },
    iconName: "d2_action_replace_child_sub_menu"
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
    command_key: "D2-ShowWorkflowHistory",
    equals: {
      action: "D2_ACTION_SHOW_WORKFLOW_HISTORY"
    },
    iconName: "d2_action_workflow_history"
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
      return item.action === "D2_ACTION_LIFECYCLE_DCTM" && item.actionParameters && item.actionParameters["DIALOG_LIST_PARAM"] && !!item.actionParameters["operation"];
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
    command_key: "Aviator-LaunchChatForVD",
    decides: function(item) {
      return item.action === "D2_ACTION_EXECUTE_MANAGER" && item.actionParameters && item.actionParameters.MANAGER === "AviatorChatManager";
    },
    iconName: "aie_action_aviator32"
  } ];
});