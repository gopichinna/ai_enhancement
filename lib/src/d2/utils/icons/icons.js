/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/constants", "i18n!d2/utils/icons/impl/nls/localized.strings", "d2/utils/theme/icons_d2_action", "css!d2/utils/icons/impl/icons" ], function(_, constants, lang) {
  "use strict";
  return [ {
    or: {
      equals: {
        a_content_type: [ "irm-pdf" ],
        aContentType: [ "irm-pdf" ]
      }
    },
    className: "csui-icon d2-icon-type-acrobatRM",
    mimeType: lang.NodeTypeIRMPDF,
    sequence: 5
  }, {
    decides: function(item) {
      return (item.get("i_contents_id") ? parseInt(item.get("i_contents_id"), 16) === 0 : false) && (item.get("rIsVirtualDoc") ? item.get("rIsVirtualDoc") : false);
    },
    className: "csui-icon d2-icon-type-virtualDoc-blank",
    mimeType: lang.NodeTypeVirtualDocContentless,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-excel14book", "irm-excel12book", "irm-excel5book", "irm-excel8book" ],
        aContentType: [ "irm-excel14book", "irm-excel12book", "irm-excel5book", "irm-excel8book" ]
      }
    },
    className: "csui-icon d2-icon-type-excelRM",
    mimeType: lang.NodeTypeIRMXLS,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-excel14template", "irm-excel12template", "irm-excel8template" ],
        aContentType: [ "irm-excel14template", "irm-excel12template", "irm-excel8template" ]
      }
    },
    className: "csui-icon d2-icon-type-excel-templateRM",
    mimeType: lang.NodeTypeXLSIRMTemplate,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-ppt12", "irm-ppt14", "irm-ppt8" ],
        aContentType: [ "irm-ppt12", "irm-ppt14", "irm-ppt8" ]
      }
    },
    className: "csui-icon d2-icon-type-powerpointRM",
    mimeType: lang.NodeTypePPTIRM,
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("r_object_type") === "dm_csai_config";
    },
    className: "csui-icon d2-icon-av4r",
    mimeType: lang.NodeTypeAviatorConfig,
    sequence: 5
  }, {
    or: {
      equals: {
        mime_type: [ "application/x-dos_ms_powerpnt", "application/pot", "application/x-soffic", "application/vnd.openxmlformats-officedocument.presentationml.template" ],
        a_content_type: [ "ppt8_template", "ppt12template", "ppt8template", "ppt12_template" ],
        aContentType: [ "ppt8_template", "ppt12template", "ppt8template", "ppt12_template" ]
      }
    },
    className: "csui-icon d2-icon-type-powerpoint-template",
    mimeType: lang.NodeTypePPTTemplate,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-ppt12template", "irm-ppt12_template", "irm-ppt14template", "irm-ppt14_template", "irm-ppt8template", "irm-ppt8_template" ],
        aContentType: [ "irm-ppt12template", "irm-ppt12_template", "irm-ppt14template", "irm-ppt14_template", "irm-ppt8template", "irm-ppt8_template" ]
      }
    },
    className: "csui-icon d2-icon-type-powerpoint-templateRM",
    mimeType: lang.NodeTypePPTIRMTemplate,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-msw12", "irm-msw14", "irm-msw8", "irm-msw6" ],
        aContentType: [ "irm-msw12", "irm-msw14", "irm-msw8", "irm-msw6" ]
      }
    },
    className: "csui-icon d2-icon-type-wordRM",
    mimeType: lang.NodeTypeIRMDOC,
    sequence: 5
  }, {
    or: {
      equals: {
        a_content_type: [ "irm-msw12template", "irm-msw8template", "irm-msw14template", "irm-msw6template" ],
        aContentType: [ "irm-msw12template", "irm-msw8template", "irm-msw14template", "irm-msw6template" ]
      }
    },
    className: "csui-icon d2-icon-type-word-templateRM",
    mimeType: lang.NodeTypeIRMTemplateDOC,
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.NodeId.FAVORITES;
    },
    className: "csui-icon d2-icon-type-favorites-node",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.COLLECTIONS;
    },
    className: "csui-icon d2-icon-type-widget-collections",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.CHECKOUT;
    },
    className: "csui-icon d2-icon-type-widget-checkout",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.ADMIN_CHECKOUT;
    },
    className: "csui-icon d2-icon-type-widget-checkout",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.FAVORITE;
    },
    className: "csui-icon d2-icon-type-widget-favorite",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.MYSHARES;
    },
    className: "csui-icon d2-icon-type-widget-myshares",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.RECENTLYACCESSED;
    },
    className: "csui-icon d2-icon-type-widget-recentlyaccessed",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.TASKS;
    },
    className: "csui-icon d2-icon-type-widget-assignments",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.WORKFLOWS;
    },
    className: "csui-icon d2-icon-type-widget-workflows",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.TASKATTACHMENTS && item.get("iconType") === "taskWorkingFiles";
    },
    className: "csui-icon d2-icon-type-widget-workingfiles",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("id") === constants.WidgetId.TASKATTACHMENTS;
    },
    className: "csui-icon d2-icon-type-widget-supportingfiles",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("activity_type") === constants.WorkflowActivityType.AUTOMATIC && item.get("performer_type") === constants.WorkflowAuditPerformerType.SIGNATURE;
    },
    className: "csui-icon d2-icon-wf-performer-signature",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("activity_type") === constants.WorkflowActivityType.AUTOMATIC;
    },
    className: "csui-icon d2-icon-wf-performer-system",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("performer_type") === constants.WorkflowAuditPerformerType.GROUP;
    },
    className: "csui-icon d2-icon-wf-performer-group",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("performer_type") === constants.WorkflowAuditPerformerType.USER;
    },
    className: "csui-icon d2-icon-wf-performer-user",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("task_state") === "acquired";
    },
    className: "csui-icon d2-icon-type-task-acquired",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("workflow_task_type") === "REJECT";
    },
    className: "csui-icon d2-icon-type-task-rejected",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK && item.get("workflow_task_type") === "DELEGATE";
    },
    className: "csui-icon d2-icon-type-task-delegated",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK;
    },
    className: "csui-icon d2-icon-type-task",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK_EVENT;
    },
    className: "csui-icon d2-icon-wf-performer-tracker",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK_PERFORMER && item.get("type_name") === constants.TasksPerformersType.LIST;
    },
    className: "csui-icon d2-icon-type-group-user",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.TASK_PERFORMER && item.get("type_name") === constants.TasksPerformersType.SINGLE;
    },
    className: "csui-icon d2-icon-type-single-user",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.WORKFLOW;
    },
    className: "csui-icon d2-icon-type-workflow",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("_is_home_cabinet") === true;
    },
    className: "csui-icon d2-icon-type-home-cabinet",
    sequence: 5
  }, {
    decides: function(node) {
      var rAspectNameConverted = node.get("r_aspect_name") && _.contains(node.get("r_aspect_name"), "dmc_migrated_msg_archive");
      if (node.get("aContentType") === "emcmf" && !rAspectNameConverted) {
        return true;
      }
    },
    className: "csui-icon d2-icon-type-emcmf",
    mimeType: lang.NodeTypeEmcmf,
    sequence: 5
  }, {
    decides: function(node) {
      var rAspectNameConverted = node.get("r_aspect_name") && _.contains(node.get("r_aspect_name"), "dmc_migrated_msg_archive");
      if (node.get("aContentType") === "emcmf" && rAspectNameConverted) {
        return true;
      }
    },
    className: "csui-icon d2-icon-type-emcmf-converted",
    mimeType: lang.NodeTypeEmcmfConverted,
    sequence: 5
  }, {
    equals: {
      type: constants.Types.CABINET
    },
    className: "csui-icon d2-icon-type-cabinet",
    mimeType: lang.NodeTypeCabinet,
    sequence: 25
  }, {
    equals: {
      type: constants.Types.FOLDER
    },
    className: "csui-icon mime_folder",
    mimeType: lang.NodeTypeFolder,
    sequence: 25
  }, {
    equals: {
      type: constants.Types.REPOSITORY
    },
    className: "csui-icon d2-icon-type-repo",
    mimeType: lang.NodeTypeRepository,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "application/msaccess", "application/x-msaccess", "application/vnd.msaccess", "application/vnd.ms-access", "application/mdb", "application/x-mdb", "zz-application/zz-winassoc-mdb" ]
      },
      startsWith: {
        aContentType: [ "ms_access8", "ms_access", "ms_access7", "ms_access8_mde" ],
        a_content_type: [ "ms_access8", "ms_access", "ms_access7", "ms_access8_mde" ]
      }
    },
    className: "csui-icon d2-icon-type-access",
    mimeType: lang.NodeTypeAccess,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/illustrator", "application/postscript" ]
    },
    className: "csui-icon d2-icon-type-ai",
    mimeType: lang.NodeTypeAI,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/photoshop", "image/vnd.adobe.photoshop", "image/x-psd", "image/photoshop", "image/x-photoshop", "image/psd", "application/psd", "zz-application/zz-winassoc-psd" ]
    },
    className: "csui-icon d2-icon-type-adobePhotoshop",
    mimeType: lang.NodeTypePhotoShop,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "audio/mp4", "audio/vnd.rn-realaudio", "audio/vnd.rn-realmedia", "audio/vnd.rn-realplayer", "audio/vnd.rn-realvideo", "audio/wav", "audio/x-wav", "audio/x-pn-wav", "audio/wave", "audio/x-aiff", "audio/x-mod", "audio/x-mpeg", "audio/x-ms-wma", "audio/x-pn-realaudio", "audio/mpeg", "audio/ogg", "audio/midi", "audio/webm", "audio/aiff", "audio/avi" ]
    },
    className: "csui-icon d2-icon-type-audio",
    mimeType: lang.NodeTypeAudio,
    sequence: 25
  }, {
    decides: function(item) {
      return item.get("rIsVirtualDoc") === true || item.get("r_is_virtual_doc") === 1 ? true : false;
    },
    className: "csui-icon d2-icon-type-virtualDoc",
    mimeType: lang.NodeTypeVirtualDoc,
    sequence: 25
  }, {
    decides: function(item) {
      var assembledFromId = item.get("rAssembledFromId") || item.get("r_assembled_from_id");
      return assembledFromId ? parseInt(assembledFromId, 16) !== 0 : false;
    },
    className: "csui-icon d2-icon-type-virtualDoc-snapshot",
    mimeType: lang.NodeTypeVirtualSnapshot,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "application/vnd.ms-excel", "application/msexcel", "application/x-msexcel", "application/x-ms-excel", "application/x-excel", "application/x-dos_ms_excel", "application/xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ],
        aContentType: [ "excel12bbook", "excel8book", "excel5book" ]
      }
    },
    className: "csui-icon d2-icon-type-excel",
    mimeType: lang.NodeTypeXLS,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/vnd.ms-excel.sheet.macroEnabled.12", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.spreadsheetml.template", "application/vnd.ms-excel.template.macroEnabled.12", "application/vnd.ms-excel.addin.macroEnabled.12", "application/vnd.ms-excel.sheet.binary.macroEnabled.12" ]
    },
    className: "csui-icon d2-icon-type-excelME",
    mimeType: lang.NodeTypeXLS,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "application/vnd.openxmlformats-officedocument.spreadsheetml.template" ],
        a_content_type: [ "excel14template", "excel12template", "excel8template" ]
      }
    },
    className: "csui-icon d2-icon-type-excel-template",
    mimeType: lang.NodeTypeXLSTemplate,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-excel.template.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-excel-templateME",
    mimeType: lang.NodeTypeXLSTemplate,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "text/html" ]
    },
    className: "csui-icon d2-icon-type-html",
    mimeType: lang.NodeTypeHTML,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "application/vnd.ms-infopath" ],
        aContentType: [ "xsf" ]
      }
    },
    className: "csui-icon d2-icon-type-infopath",
    mimeType: lang.NodeTypeInfoPath,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "image/jpeg", "image/jpg", "image/jp_", "application/jpg", "application/x-jpg", "image/pjpeg", "image/pipeg", "image/vnd.swiftview-jpeg", "image/x-xbitmap", "image/jpe_", "image/tiff" ],
        aContentType: [ "jpeg" ],
        a_content_type: [ "JPEG Image", "jpeg" ]
      }
    },
    className: "csui-icon d2-icon-type-jpeg",
    mimeType: lang.NodeTypeImage,
    sequence: 25
  }, {
    or: {
      equals: {
        type: 749,
        a_content_type: [ "msg", "entourage_msg", "MS Outlook Express Electronic Mail" ],
        aContentType: [ "msg", "entourage_msg", "eml", "d2mail" ]
      }
    },
    className: "csui-icon d2-icon-type-mail",
    mimeType: lang.NodeTypeEmail,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/onenote", "application/msonenote" ]
    },
    className: "csui-icon d2-icon-type-oneNote",
    mimeType: lang.NodeTypeONE,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "text/plain", "application/txt", "browser/internal", "text/anytext", "widetext/plain", "widetext/paragraph" ],
        aContentType: [ "crtext" ],
        a_content_type: [ "Text Document (Windows)" ]
      }
    },
    className: "csui-icon d2-icon-type-paper",
    mimeType: lang.NodeTypeText,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf", "text/pdf", "text/x-pdf" ]
    },
    className: "csui-icon d2-icon-type-pdf",
    mimeType: lang.NodeTypePDF,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/vnd.ms-powerpoint", "application/mspowerpoint", "application/ms-powerpoint", "application/mspowerpnt", "application/vnd-mspowerpoint", "application/powerpoint", "application/x-powerpoint", "application/x-m", "application/vnd.openxmlformats-officedocument.presentationml.presentation" ]
    },
    className: "csui-icon d2-icon-type-powerpoint",
    mimeType: lang.NodeTypePPT,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-powerpoint.presentation.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-powerpointME",
    mimeType: lang.NodeTypePPT,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.slideshow" ]
    },
    className: "csui-icon d2-icon-type-powerpoint-slideshow",
    mimeType: lang.NodeTypePPT,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-powerpoint.slideshow.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-powerpoint-slideshowME",
    mimeType: lang.NodeTypePPT,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-powerpoint.template.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-powerpoint-templateME",
    mimeType: lang.NodeTypePPTME,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/vnd.ms-project", "application/msproj", "application/msproject", "application/x-msproject", "application/x-ms-project", "application/x-dos_ms_project", "application/mpp", "zz-application/zz-winassoc-mpp" ]
    },
    className: "csui-icon d2-icon-type-projects",
    mimeType: lang.NodeTypeMPP,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "video/mp4", "video/MSS", "video/quicktime", "video/x-dv", "video/x-gxf", "video/x-lxf", "video/x-mpeg", "video/x-mpeg2", "video/x-ms-asf", "video/x-ms-asx", "video/x-ms-wmv", "video/x-mxf", "video/x-vp6-flv", "video/avi", "video/msvideo", "video/x-msvideo", "image/avi", "video/xmpg2", "application/x-troff-msvideo", "application/x-3gp", "video/webm", "video/x-matroska" ]
      },
      startsWith: {
        aContentType: [ "avi" ],
        a_content_type: [ "avi" ]
      }
    },
    className: "csui-icon d2-icon-type-video",
    mimeType: lang.NodeTypeVideo,
    sequence: 25
  }, {
    or: {
      equals: {
        mime_type: [ "application/vnd.visio", "application/visio", "application/x-visio", "application/visio.drawing", "application/vsd", "application/x-vsd", "image/x-vsd", "zz-application/zz-winassoc-vsd" ],
        a_content_type: [ "MS Visio Drawing" ],
        aContentType: [ "vsd" ]
      }
    },
    className: "csui-icon d2-icon-type-visio",
    mimeType: lang.NodeTypeVisio,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/msword", "application/doc", "appl/text", "application/vnd.msword", "application/vnd.ms-word", "application/winword", "application/word", "application/x-msw6", "application/x-msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ]
    },
    className: "csui-icon d2-icon-type-word",
    mimeType: lang.NodeTypeDOC,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-word.document.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-wordME",
    mimeType: lang.NodeTypeDOC,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "application/dot", "application/x-dot", "application/microsoft_word", "application/mswor2csc2", "zz-application/zz-winassoc-dot", "application/vnd.openxmlformats-officedocument.wordprocessingml.template" ]
    },
    className: "csui-icon d2-icon-type-word-template",
    mimeType: lang.NodeTypeDOC,
    sequence: 25
  }, {
    equals: {
      mime_type: "application/vnd.ms-word.template.macroEnabled.12"
    },
    className: "csui-icon d2-icon-type-word-templateME",
    mimeType: lang.NodeTypeDOC,
    sequence: 25
  }, {
    equals: {
      mime_type: [ "text/xml", "application/xml", "application/x-xml" ]
    },
    className: "csui-icon d2-icon-type-xml",
    mimeType: lang.NodeTypeXML,
    sequence: 25
  }, {
    startsWithNoCase: {
      mime_type: "text/"
    },
    className: "csui-icon mime_paper",
    mimeType: lang.NodeTypeText,
    sequence: 48
  }, {
    startsWithNoCase: {
      mime_type: "image/"
    },
    className: "csui-icon mime_image",
    mimeType: lang.NodeTypeImage,
    sequence: 49
  }, {
    equals: {
      mime_type: [ "application/zip", "application/x-zip", "application/x-zip-compressed", "application/octet-stream", "application/x-compress", "application/x-compressed", "multipart/x-zip", "application/x-rar-compressed" ]
    },
    className: "csui-icon d2-icon-type-zip",
    mimeType: lang.NodeTypeCompressed,
    sequence: 25
  }, {
    decides: function(node) {
      if (node.get("r_object_type") === "d2_queryform_config") {
        return true;
      }
    },
    className: "csui-icon d2-icon-search-queryform",
    mimeType: lang.NodeTypeQueryForm,
    sequence: 25
  }, {
    decides: function(node) {
      if (node.get("r_object_type") === "d2c_query") {
        return true;
      }
    },
    className: "csui-icon d2-icon-saved-search-query",
    mimeType: lang.NodeTypeSearchQuery,
    sequence: 25
  }, {
    decides: function(item) {
      return item.get("r_object_type") === "d2c_query_category" || item.get("_is_saved_search_container") === true;
    },
    className: "csui-icon d2-icon-search-group",
    sequence: 25
  }, {
    decides: function(item) {
      return item.get("r_object_type") === "d2c_query_wizard";
    },
    className: "csui-icon d2-icon-saved-search-query-wizard",
    sequence: 25
  }, {
    decides: function(node) {
      if (node.get("type") === 144 && node.get("a_content_type") === "" && (!node.get("mime_type") || !node.get("aContentType"))) {
        return true;
      }
    },
    className: "csui-icon d2-icon-type-contentless",
    mimeType: lang.NodeTypeContentless,
    sequence: 48
  }, {
    decides: function(node) {
      if (node.get("type") === 144) {
        return true;
      }
    },
    className: "csui-icon d2-icon-type-document",
    mimeType: lang.NodeTypeUnknown,
    sequence: 49
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.ACCESSOR && item.get("type_name") === constants.AccessorType.ROLE;
    },
    className: "csui-icon d2-icon-type-accessor-role",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.ACCESSOR && item.get("type_name") === constants.AccessorType.GROUP;
    },
    className: "csui-icon d2-icon-type-group-user",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.ACCESSOR && item.get("type_name") === constants.AccessorType.USER;
    },
    className: "csui-icon d2-icon-type-single-user",
    sequence: 5
  }, {
    decides: function(item) {
      return item.get("type") === constants.Types.COLLECTIONS;
    },
    className: "csui-icon d2-icon-type-collections",
    sequence: 5
  } ];
});