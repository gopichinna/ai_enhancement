/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/constants'
], function(ConstantsImpl){
  'use strict';

  /**
   * Some utility constants.
   * @module {d2/sdk/utils/constants} d2/sdk/utils/constants
   * @name Constants
   * @extends {Object}
   */
  
  return Object.freeze({
    /**
     * Supported AJAX media types.
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} DCTM_JSON - "application/vnd.emc.documentum+json".
     * @property {string} DCTM_XML - "application/vnd.emc.documentum+xml".
     * @property {string} DCTM_D2_V1_JSON - "application/vnd.documentum.d2.v1+json".
     *
     */

    MediaTypes: ConstantsImpl.MediaTypes,

    /**
     * Object types. Used for type equality comparison for {@link ../models/node.model|NodeModel}s.
     * @example
     *
     * define(['d2/sdk/utils/constants'], function(constants){
     *    //supposing 'node' is an instance of NodeModel
     *    if(node.get('type') === constants.Types.FOLDER) {
     *      console.log('This is a folder');
     *    }
     * });
     * @memberOf module:Constants
     * @type {Object}
     * @property {number} FOLDER
     * @property {number} OBJECT
     * @property {number} REPOSITORY
     * @property {number} CABINET
     * @property {number} DOCUMENT
     * @property {number} RENDITION
     * @property {number} WORKFLOW_STEP
     * @property {number} TASK
     * @property {number} TASK_PERFORMER
     * @property {number} WORKFLOW
     * @property {number} WORKFLOW_EVENT
     * @property {number} TASK_EVENT
     * @property {number} EMAIL
     * @property {number} DQL
     * @property {number} ACCESSOR
     *
     */
    Types: ConstantsImpl.Types,

    /**
     * Values used as 'type' query-parameter while making AJAX call to retrieve menu actions associated with a {@link ../models/node.model|NodeModel}
     *
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} CONTEXT - 'MenuContext'
     * @property {string} NEW_OBJECT - 'MenuNewObject'
     * @property {string} USER - 'MenuUser'
     * @property {string} VDOC - 'MenuContextVD'
     * @property {string} SUBMENU_VD_ADD_CHILD - 'MenuContextVDAddChildOption'
     * @property {string} SUBMENU_VD_REPLACE_CHILD - 'MenuContextVDReplaceChildOption'
     * @property {string} TASKS - 'MenuContextTasksList'
     * @property {string} SUBMENU_CHANGE_TASK_PRIORITY - 'MenuContextTaskPriority'
     * @property {string} TASK_DOCUMENTS - 'MenuContextTaskDocument'
     * @property {string} WORKFLOWS - 'MenuContextWorkflowOverview'
     * @property {string} SAVED_SEARCH - 'MenuContextSavedSearchObject'
     * @property {string} SUBMENU_LAUNCH_WORKFLOW - 'MenuDocumentWorkflow'
     * @property {string} DETAIL_RELATIONS - 'MenuContextDetailRelations'
     * @property {string} DETAIL_RENDITIONS - 'MenuContextDetailRenditions'
     * @property {string} DETAIL_VERSIONS - 'MenuContextDetailVersions'
     * @property {string} SUBMENU_SHARE - 'MenuDocumentShare'
     * @property {string} SUBMENU_MASS_UPDATE - 'MenuToolsMassUpdate'
     * @property {string} SUBMENU_DOCUMENT_LIFECYCLE - 'MenuDocumentLifeCycle'
     * @property {string} SUBMENU_DOCUMENT_LIFECYCLE_ATTACH - 'MenuDocumentLifeCycleAttach'
     * @property {string} SUBMENU_DOCUMENT_D2_LIFECYCLE_ATTACH - 'MenuDocumentD2LifeCycleAttach'
     *
     */
    MenuTypes: ConstantsImpl.MenuTypes,

    WizardType: ConstantsImpl.WizardType,

    /**
     * Date formats used by D2-REST APIs.
     * @memberOf module:Constants
     * @type {Object}
     * @property {string} DATE_ONLY - 'YYYY-MM-DD'
     * @property {string} DATE_TIME - 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
     */
    ISODateFormats: ConstantsImpl.ISODateFormats
  });
});