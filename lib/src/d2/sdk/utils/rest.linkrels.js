/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/rest.linkrels'
], function (RestLinkrelsImpl) {
  'use strict';

  /**
   * Utility to handle link relations of a D2-REST resource.
   * Also defined named constants for several link relation identifiers.
   *
   * @module {d2/sdk/utils/rest.linkrels} d2/sdk/utils/"rest.linkrels"
   * @name RestLinkrels
   * @extends {Object}
   */

  return {
    /**
     * Get complete URL from a link relation
     * @param {D2RestLinkObject[]} links - A set of related link objects.
     * @param {string} linkrel - Identifier of the link relation whose URL is to be formed.
     * @returns {string} the formed URL
     * @static
     */
    getLink: function (links, linkrel) {
      return RestLinkrelsImpl.getLink(links, linkrel);
    },

    /**
     * Get complete URL from a templated link relation
     * @param {D2RestLinkObject[]} links - A set of related link objects.
     * @param {string} linkrel - Identifier of the link relation whose URL is to be formed. The link object identified should have `hrefTemplate` in it.
     * @returns {string} the formed URL
     * @static
     */
    getLinkTemplate: function (links, linkrel) {
      return RestLinkrelsImpl.getLinkTemplate(links, linkrel);
    },

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch actions.
     * @static
     */
    ACTIONS: RestLinkrelsImpl.ACTIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute batch operations.
     * @static
     */
    BATCHES: RestLinkrelsImpl.BATCHES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch cabinets.
     * @static
     */
    CABINETS: RestLinkrelsImpl.CABINETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch folder of cabinet/folder.
     * @static
     */
    FOLDERS: RestLinkrelsImpl.FOLDERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch users.
     * @static
     */
    USERS: RestLinkrelsImpl.USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch groups.
     * @static
     */
    GROUPS: RestLinkrelsImpl.GROUPS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch user's profile image.
     * @static
     */
    USER_PROFILE_IMAGE: RestLinkrelsImpl.USER_PROFILE_IMAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to cancel checkout of reserved object.
     * @static
     */
    CANCEL_CHECKOUT: RestLinkrelsImpl.CANCEL_CHECKOUT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch canonical object.
     * @static
     */
    CANONICAL: RestLinkrelsImpl.CANONICAL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to checkout object.
     * @static
     */
    CHECKOUT: RestLinkrelsImpl.CHECKOUT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check if object can be reserved.
     * @static
     */
    CHECKOUT_PRECHECK: RestLinkrelsImpl.CHECKOUT_PRECHECK,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch objects checked-out by user.
     * @static
     */
    CHECKEDOUT_OBJECTS: RestLinkrelsImpl.CHECKEDOUT_OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get child links of object.
     * @static
     */
    CHILD_LINKS: RestLinkrelsImpl.CHILD_LINKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get comments of object.
     * @static
     */
    COMMENTS: RestLinkrelsImpl.COMMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get current version of object.
     * @static
     */
    CURRENT_VERSION: RestLinkrelsImpl.CURRENT_VERSION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get logged-in user's details.
     * @static
     */
    CURRENT_USER: RestLinkrelsImpl.CURRENT_USER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration objects available to logged in user.
     * @static
     */
    D2_CONFIGURATIONS: RestLinkrelsImpl.D2_CONFIGURATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get possible relation types.
     * @static
     */
    D2_RELATION_TYPES: RestLinkrelsImpl.D2_RELATION_TYPES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to convert a document to virtual document.
     * @static
     */
    CONVERT_TO_VIRTUAL_DOCUMENT: RestLinkrelsImpl.CONVERT_TO_VIRTUAL_DOCUMENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to add children to a virtual document.
     * @static
     */
    ADD_VIRTUAL_DOCUMENT_NODES: RestLinkrelsImpl.ADD_VIRTUAL_DOCUMENT_NODES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to add children to a virtual document by inheriting from another virtual document.
     * @static
     */
    D2_VD_INSERT_INHERITED_COMPONENT: RestLinkrelsImpl.D2_VD_INSERT_INHERITED_COMPONENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get virtual document creation templates.
     * @static
     */
    D2_VD_TEMPLATES: RestLinkrelsImpl.D2_VD_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration for converting folder structure to virtual document.
     * @static
     */
    FOLDER_STRUCTURE_CONVERSION_CONFIG: RestLinkrelsImpl.FOLDER_STRUCTURE_CONVERSION_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to replace a child of a virtual document with other objects.
     * @static
     */
    REPLACE_VIRTUAL_DOCUMENT_NODES: RestLinkrelsImpl.REPLACE_VIRTUAL_DOCUMENT_NODES,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get user's default folder.
     * @static
     */
    DEFAULT_FOLDER: RestLinkrelsImpl.DEFAULT_FOLDER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to delete object.
     * @static
     */
    DELETE: RestLinkrelsImpl.DELETE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get content download URLs of object.
     * @static
     */
    DOWNLOAD_URLS: RestLinkrelsImpl.DOWNLOAD_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute a DQL query.
     * @static
     */
    DQL: RestLinkrelsImpl.DQL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get favorited(subscribed) objects of user.
     * @static
     */
    D2_FAVORITES: RestLinkrelsImpl.D2_FAVORITES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of recently accessed objects of user.
     * @static
     */
    D2_USER_RECENTLY_ACCESSED: RestLinkrelsImpl.D2_USER_RECENTLY_ACCESSED,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get related objects of an object.
     * @static
     */
    D2_RELATIONS: RestLinkrelsImpl.D2_RELATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get related objects' count of an object.
     * @static
     */
    D2_OBJECTS_RELATIONS_COUNT: RestLinkrelsImpl.D2_OBJECTS_RELATIONS_COUNT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get renditions of an object.
     * @static
     */
    D2_RENDITIONS: RestLinkrelsImpl.D2_RENDITIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get widget configuration accessible to the user.
     * @static
     */
    D2_WIDGETS: RestLinkrelsImpl.D2_WIDGETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get saved search categories.
     * @static
     */
    D2_SAVED_SEARCH: RestLinkrelsImpl.D2_SAVED_SEARCH,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get displayable information for different Documentum types.
     * @static
     */
    D2_DISPLAY_TYPES: RestLinkrelsImpl.D2_DISPLAY_TYPES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get available theme configurations.
     * @static
     */
    D2_THEMES: RestLinkrelsImpl.D2_THEMES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get default theme config for the D2 Smart View runtime.
     * @static
     */
    D2_DEFAULT_THEME: RestLinkrelsImpl.D2_DEFAULT_THEME,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get different D2 Smart View runtime options.
     * @static
     */
    D2_OPTIONS: RestLinkrelsImpl.D2_OPTIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get thumbnail of a document object.
     * @static
     */
    D2_THUMBNAIL: RestLinkrelsImpl.D2_THUMBNAIL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of content creation profiles.
     * @static
     */
    D2_CREATION_PROFILES: RestLinkrelsImpl.D2_CREATION_PROFILES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a content creation profile.
     * @static
     */
    D2_CREATION_PROFILE: RestLinkrelsImpl.D2_CREATION_PROFILE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get value configurations of a content creation profile.
     * @static
     */
    D2_CREATION_PROFILE_VALUE_CONFIGS: RestLinkrelsImpl.D2_CREATION_PROFILE_VALUE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a creation profile's value configuration.
     * @static
     */
    D2_CREATION_PROFILE_VALUE_CONFIG: RestLinkrelsImpl.D2_CREATION_PROFILE_VALUE_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get preset type of content creation profiles or preset profile in short.
     * @static
     */
    D2_CREATION_PRESET_PROFILES: RestLinkrelsImpl.D2_CREATION_PRESET_PROFILES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to value configurations of a preset profile.
     * @static
     */
    D2_CREATION_PRESET_VALUE_CONFIGS: RestLinkrelsImpl.D2_CREATION_PRESET_VALUE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get recently used content creation profile be it preset or not.
     * @static
     */
    D2_CREATION_PRESET_RECENTLY_USED: RestLinkrelsImpl.D2_CREATION_PRESET_RECENTLY_USED,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get creation time property page.
     * @static
     */
    D2_CREATION_PROPERTIES: RestLinkrelsImpl.D2_CREATION_PROPERTIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to create new object.
     * @static
     */
    D2_OBJECT_CREATION: RestLinkrelsImpl.D2_OBJECT_CREATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets upload content for a newly created object.
     * @static
     */
    D2_CONTENT_UPLOAD_URLS: RestLinkrelsImpl.D2_CONTENT_UPLOAD_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of document templates while creating new content.
     * @static
     */
    D2_DOCUMENT_TEMPLATES: RestLinkrelsImpl.D2_DOCUMENT_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get details of a document template.
     * @static
     */
    D2_DOCUMENT_TEMPLATE: RestLinkrelsImpl.D2_DOCUMENT_TEMPLATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of recently used document templates.
     * @static
     */
    D2_RECENTLY_USED_TEMPLATES: RestLinkrelsImpl.D2_RECENTLY_USED_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get linkable document configuration for a newly created object.
     * @static
     */
    D2_LINKED_DOCUMENT_CONFIG: RestLinkrelsImpl.D2_LINKED_DOCUMENT_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to control check-in of object.
     * @static
     */
    D2_CHECKIN_CONFIG: RestLinkrelsImpl.D2_CHECKIN_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets upload new content as part of check-in.
     * @static
     */
    D2_CHECKIN_URL: RestLinkrelsImpl.D2_CHECKIN_URL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check-in a virtual document silently.
     * @static
     */
    D2_VD_SILENT_CHECKIN: RestLinkrelsImpl.D2_VD_SILENT_CHECKIN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property page to be shown while creating a folder.
     * @static
     */
    D2_FOLDER_CREATION_PROPERTY_PAGE: RestLinkrelsImpl.D2_FOLDER_CREATION_PROPERTY_PAGE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get folders.
     * @static
     */
    D2_FOLDERS: RestLinkrelsImpl.D2_FOLDERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get cabinets.
     * @static
     */
    D2_CABINETS: RestLinkrelsImpl.D2_CABINETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to extract properties using O2 plugin while importing new content.
     * @static
     */
    D2_EXTRACT_O2_PROPERTIES_URLS: RestLinkrelsImpl.D2_EXTRACT_O2_PROPERTIES_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to extract attachments from email while importing new content.
     * @static
     */
    D2_EXTRACT_EMAIL_ATTACHMENTS: RestLinkrelsImpl.D2_EXTRACT_EMAIL_ATTACHMENTS,
    D2_VIRTUAL_DOC_CONVERSION: RestLinkrelsImpl.D2_VIRTUAL_DOC_CONVERSION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to create a linked document silently while creating new content.
     * @static
     */
    D2_SILENT_LINKED_DOCUMENT_CREATION: RestLinkrelsImpl.D2_SILENT_LINKED_DOCUMENT_CREATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get dialog configuration for a query form.
     * @static
     */
    D2_QUERYFORM_DIALOG: RestLinkrelsImpl.D2_QUERYFORM_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to set a document template to a newly created object.
     * @static
     */
    D2_SET_TEMPLATE: RestLinkrelsImpl.D2_SET_TEMPLATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get folder structure config while importing folder.
     * @static
     */
    D2_FOLDER_STRUCTURE_CONFIGS: RestLinkrelsImpl.D2_FOLDER_STRUCTURE_CONFIGS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets import folder structure.
     * @static
     */
    D2_FOLDER_STRUCTURE_IMPORT_URLS: RestLinkrelsImpl.D2_FOLDER_STRUCTURE_IMPORT_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get bound version of a node in virtual document.
     * @static
     */
    D2_FETCH_VERSION_VD: RestLinkrelsImpl.D2_FETCH_VERSION_VD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to set binding versions of a node in virtual document.
     * @static
     */
    D2_SET_BINDING_VD: RestLinkrelsImpl.D2_SET_BINDING_VD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to convert a virtual document to a simple document.
     * @static
     */
    D2_CONVERT_TO_SIMPLE_DOC: RestLinkrelsImpl.D2_CONVERT_TO_SIMPLE_DOC,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to remove children from a virtual document.
     * @static
     */
    D2_REMOVE_VD_CHILDREN: RestLinkrelsImpl.D2_REMOVE_VD_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch content preivew format of object.
     * @static
     */
    D2_PREVIEW_FORMATS: RestLinkrelsImpl.D2_PREVIEW_FORMATS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get task assignments of user.
     * @static
     */
    D2_INBOX: RestLinkrelsImpl.D2_INBOX,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get different categories applicable to user inbox.
     * @static
     */
    D2_TASK_CATEGORIES: RestLinkrelsImpl.D2_TASK_CATEGORIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get supporting documents of a tasks.
     * @static
     */
    D2_TASK_SUPPORTING_DOCUMENTS: RestLinkrelsImpl.D2_TASK_SUPPORTING_DOCUMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get working documents of a task.
     * @static
     */
    D2_TASK_WORKING_DOCUMENTS: RestLinkrelsImpl.D2_TASK_WORKING_DOCUMENTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get notes/user comments of a task.
     * @static
     */
    D2_NOTES: RestLinkrelsImpl.D2_NOTES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to count number of notes of a task.
     * @static
     */
    D2_NOTES_COUNT: RestLinkrelsImpl.D2_NOTES_COUNT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to change status of a task.
     * @static
     */
    D2_TASK_STATUS: RestLinkrelsImpl.D2_TASK_STATUS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to delegate a task.
     * @static
     */
    D2_TASK_DELEGATE: RestLinkrelsImpl.D2_TASK_DELEGATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of users applicable for a task delegation.
     * @static
     */
    D2_TASK_DELEGATE_USER: RestLinkrelsImpl.D2_TASK_DELEGATE_USER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get performers of a task.
     * @static
     */
    D2_TASK_PERFORMERS: RestLinkrelsImpl.D2_TASK_PERFORMERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get dialog config to update performers of a task.
     * @static
     */
    D2_TASK_PERFORMERS_DIALOG: RestLinkrelsImpl.D2_TASK_PERFORMERS_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get data to get resolved participant details of task.
     * @static
     */
    D2_TASK_PERFORMERS_ALIAS_PARTICIPANTS: RestLinkrelsImpl.D2_TASK_PERFORMERS_ALIAS_PARTICIPANTS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get intention dictionary while completing a task.
     * @static
     */
    D2_TASK_INTENTION_DICTIONARY_FORWARD: RestLinkrelsImpl.D2_TASK_INTENTION_DICTIONARY_FORWARD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get intentions dictionary while rejecting a task.
     * @static
     */
    D2_TASK_INTENTION_DICTIONARY_REJECT: RestLinkrelsImpl.D2_TASK_INTENTION_DICTIONARY_REJECT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property-page while completing a task.
     * @static
     */
    D2_TASK_PROPERTY_PAGE_FORWARD: RestLinkrelsImpl.D2_TASK_PROPERTY_PAGE_FORWARD,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property-page while rejecting a task.
     * @static
     */
    D2_TASK_PROPERTY_PAGE_REJECT: RestLinkrelsImpl.D2_TASK_PROPERTY_PAGE_REJECT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to change workflow status.
     * @static
     */
    D2_WORKFLOW_STATUS: RestLinkrelsImpl.D2_WORKFLOW_STATUS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check lifecycle status while completing/rejecting a task.
     * @static
     */
    D2_TASK_LIFECYCLE_CHECKER: RestLinkrelsImpl.D2_TASK_LIFECYCLE_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to check locked status of working documents while completing/rejecting a task.
     * @static
     */
    D2_TASK_CHECK_LOCK_STATE: RestLinkrelsImpl.D2_TASK_CHECK_LOCK_STATE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to launch a new workflow.
     * @static
     */
    D2_WORKFLOWS: RestLinkrelsImpl.D2_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to launch a new workflow.
     * @static
     */
    D2_WORKFLOW_CONFIG: RestLinkrelsImpl.D2_WORKFLOW_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate entry conditions against a workflow config before starting a new workflow.
     * @static
     */
    D2_WORKFLOW_ENTRY_CONDITION_CHECKER: RestLinkrelsImpl.D2_WORKFLOW_ENTRY_CONDITION_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate package types against a workflow config.
     * @static
     */
    D2_WORKFLOW_PACKAGETYPE_CHECKER: RestLinkrelsImpl.D2_WORKFLOW_PACKAGETYPE_CHECKER,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get performer dialog config while launching workflow.
     * @static
     */
    D2_WORKFLOW_LAUNCH_PEROFMERS_DIALOG: RestLinkrelsImpl.D2_WORKFLOW_LAUNCH_PEROFMERS_DIALOG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all workflows that the user is supervisor of.
     * @static
     */
    D2_MY_WORKFLOWS: RestLinkrelsImpl.D2_MY_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all workflows running system-wide.
     * @static
     */
    D2_ALL_WORKFLOWS: RestLinkrelsImpl.D2_ALL_WORKFLOWS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get a summary of workflows supervised by user.
     * @static
     */
    D2_MY_WORKFLOWS_STATUS_SUMMARY: RestLinkrelsImpl.D2_MY_WORKFLOWS_STATUS_SUMMARY,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get available workflow templates.
     * @static
     */
    D2_WORKFLOWS_TEMPLATES: RestLinkrelsImpl.D2_WORKFLOWS_TEMPLATES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of users to be shown for workflow filtering.
     * @static
     */
    D2_WORKFLOW_OVERVIEW_WIDGET_USERS: RestLinkrelsImpl.D2_WORKFLOW_OVERVIEW_WIDGET_USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of user to shown while changing supervisor of a workflow.
     * @static
     */
    D2_CHANGE_WORKFLOW_SUPERVISOR_USERS: RestLinkrelsImpl.D2_CHANGE_WORKFLOW_SUPERVISOR_USERS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get comment configuration of a workflow.
     * @static
     */
    D2_WORKFLOW_NOTES_CONFIG: RestLinkrelsImpl.D2_WORKFLOW_NOTES_CONFIG,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get event details of tasks of a workflow.
     * @static
     */
    D2_WORKFLOW_TASK_AUDITS: RestLinkrelsImpl.D2_WORKFLOW_TASK_AUDITS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get event details of a workflow.
     * @static
     */
    D2_WORKFLOW_EVENT_AUDITS: RestLinkrelsImpl.D2_WORKFLOW_EVENT_AUDITS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all tasks of a workflow.
     * @static
     */
    D2_WORKFLOW_TASKS: RestLinkrelsImpl.D2_WORKFLOW_TASKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get number of notes attached to a workflow.
     * @static
     */
    D2_WORKFLOWS_COUNT: RestLinkrelsImpl.D2_WORKFLOWS_COUNT,

    D2_MASS_UPDATE_CONFIG: RestLinkrelsImpl.D2_MASS_UPDATE_CONFIG,
    D2_MASS_UPDATE_OBJECT_VALIDATION: RestLinkrelsImpl.D2_MASS_UPDATE_OBJECT_VALIDATION,

    D2_OBJECT_LIFECYCLE_STATE: RestLinkrelsImpl.D2_OBJECT_LIFECYCLE_STATE,
    D2_OBJECTS_LIFECYCLE_CONDITIONS_CHECKER: RestLinkrelsImpl.D2_OBJECTS_LIFECYCLE_CONDITIONS_CHECKER,
    D2_OBJECTS_LIFECYCLE_CONFIG: RestLinkrelsImpl.D2_OBJECTS_LIFECYCLE_CONFIG,
    D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY: RestLinkrelsImpl.D2_LIFECYCLE_ESIGN_INTENTION_DICTIONARY,
    D2_LIFECYCLE_PROPERTIES_PAGE: RestLinkrelsImpl.D2_LIFECYCLE_PROPERTIES_PAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to edit object properties.
     * @static
     */
    EDIT: RestLinkrelsImpl.EDIT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL to download content of a object.
     * @static
     */
    EXPORT_URLS: RestLinkrelsImpl.EXPORT_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get favorited objects of user.
     * @static
     */
    FAVORITES: RestLinkrelsImpl.FAVORITES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of supported content formats.
     * @static
     */
    FORMATS: RestLinkrelsImpl.FORMATS,
    LOCATE: RestLinkrelsImpl.LOCATE,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects within a folder/cabinet.
     * @static
     */
    OBJECTS: RestLinkrelsImpl.OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get location of an object within the repository.
     * @static
     */
    OBJECTS_LOCATIONS: RestLinkrelsImpl.OBJECTS_LOCATIONS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects within a folder/cabinet after applying facet filters.
     * @static
     */
    OBJECTS_FACETS: RestLinkrelsImpl.OBJECTS_FACETS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get objects of a DQL doclist.
     * @static
     */
    DQL_DOCLIST_OBJECTS: RestLinkrelsImpl.DQL_DOCLIST_OBJECTS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get thumbnail of object.
     * @static
     */
    OBJECTS_THUMBNAIL_URL: RestLinkrelsImpl.OBJECTS_THUMBNAIL_URL,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get immediate parent of an object.
     * @static
     */
    PARENT: RestLinkrelsImpl.PARENT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to link an object to several folders.
     * @static
     */
    PARENT_LINKS: RestLinkrelsImpl.PARENT_LINKS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get general preference data of the user.
     * @static
     */
    D2_PREFERENCES: RestLinkrelsImpl.D2_PREFERENCES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get column preference data of a widget.
     * @static
     */
    D2_COLUMN_PREFERENCES: RestLinkrelsImpl.D2_COLUMN_PREFERENCES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets preview a content.
     * @static
     */
    PREVIEW_URLS: RestLinkrelsImpl.PREVIEW_URLS,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get URL that lets access to a printable content.
     * @static
     */
    PRINT_URL: RestLinkrelsImpl.PRINT_URL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get property page of an object.
     * @static
     */
    PROPERTY_PAGE: RestLinkrelsImpl.PROPERTY_PAGE,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to execute a quick search.
     * @static
     */
    QUICK_SEARCH: RestLinkrelsImpl.QUICK_SEARCH,
    REPLIES: RestLinkrelsImpl.REPLIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get list of repositories.
     * @static
     */
    REPOSITORIES: RestLinkrelsImpl.REPOSITORIES,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API that point to the resource itself.
     * @static
     */
    SELF: RestLinkrelsImpl.SELF,
    NEXT: RestLinkrelsImpl.NEXT,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get configuration to send email.
     * @static
     */
    SEND_MAIL: RestLinkrelsImpl.SEND_MAIL,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get versions' history of an object.
     * @static
     */
    VERSION_HISTORY: RestLinkrelsImpl.VERSION_HISTORY,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get children of a virtual document.
     * @static
     */
    VD_NODE_CHILDREN: RestLinkrelsImpl.VD_NODE_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get children of a virtual document's snapshot.
     * @static
     */
    VD_SNAPSHOT_NODE_CHILDREN: RestLinkrelsImpl.VD_SNAPSHOT_NODE_CHILDREN,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to move children of a virtual document from one sub-path to another.
     * @static
     */
    VD_MOVE_NODES: RestLinkrelsImpl.VD_MOVE_NODES,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to commit all in-process object while creating new content.
     * @static
     */
    FINISH_ACTION: RestLinkrelsImpl.FINISH_ACTION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to roll back all newly created in-process objects that are not committed yet.
     * @static
     */
    ABORT_ACTION: RestLinkrelsImpl.ABORT_ACTION,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to perform an async operation.
     * @static
     */
    ASYNC_OPERATION: RestLinkrelsImpl.ASYNC_OPERATION,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to get all metadata of an object.
     * @static
     */
    D2_DUMP: RestLinkrelsImpl.D2_DUMP,
    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to validate electronic signature credentials.
     * @static
     */
    D2_SIGNOFF_VALIDATION: RestLinkrelsImpl.D2_SIGNOFF_VALIDATION,
    D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS: RestLinkrelsImpl.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS,

    /**
     * @constant
     * @type {string}
     * @description Link ID of D2-REST API to fetch Documentum dm_sysobject type attributes for a bunch of objects.
     * @static
     */
    D2_SYSOBJECTS: RestLinkrelsImpl.D2_SYSOBJECTS
  };

  /**
   * @typedef {Object} D2RestLinkObject
   * @property {string} rel - Link relation identifier
   * @property {string} [href] - Partial URL for the D2-REST resource
   * @property {string} [hrefTemplate] - Partial templated URL for the D2-REST resource
   */
});
