/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  var WIDGET_NAME_WORKFLOW_OVERVIEW = "widget_name", WIDGET_NAME_TASK_ATTACHMENTS = "task_attachments_widget_name", COLLECTION_STATE_REPORTING_TYPE = "wf_reporting_type", COLLECTION_STATE_ORDER_BY = "wf_order_by", COLLECTION_STATE_FILTER = "wf_filter", COLLECTION_STATE_TOP = "top", COLLECTION_STATE_SKIP = "skip", WORKFLOW_MANAGE_ATTACHMENTS = "manage_attachments", WORKFLOW_METADATA_DROPDOWN = "dropdown", WORKFLOW_DOCUMENTS_TYPE = "type", WORKFLOW_DOCUMENTS_SELECTED_NODE = "nodeId", COLLECTION_HAS_MORE_RECORDS = "hasMoreRecords", COLLECTION_HAD_MORE_RECORDS = "hadMoreRecords", COLLECTION_STATE_QFORM_PARAMS = "qform-param", PROP_CONSTANTS = Object.freeze({
    WIDGET_NAME_WORKFLOW_OVERVIEW: WIDGET_NAME_WORKFLOW_OVERVIEW,
    WIDGET_NAME_TASK_ATTACHMENTS: WIDGET_NAME_TASK_ATTACHMENTS,
    COLLECTION_STATE_REPORTING_TYPE: COLLECTION_STATE_REPORTING_TYPE,
    COLLECTION_STATE_ORDER_BY: COLLECTION_STATE_ORDER_BY,
    COLLECTION_STATE_FILTER: COLLECTION_STATE_FILTER,
    COLLECTION_STATE_TOP: COLLECTION_STATE_TOP,
    COLLECTION_STATE_SKIP: COLLECTION_STATE_SKIP,
    COLLECTION_STATE_QFORM_PARAMS: COLLECTION_STATE_QFORM_PARAMS,
    WORKFLOW_MANAGE_ATTACHMENTS: WORKFLOW_MANAGE_ATTACHMENTS,
    WORKFLOW_METADATA_DROPDOWN: WORKFLOW_METADATA_DROPDOWN,
    WORKFLOW_DOCUMENTS_TYPE: WORKFLOW_DOCUMENTS_TYPE,
    WORKFLOW_DOCUMENTS_SELECTED_NODE: WORKFLOW_DOCUMENTS_SELECTED_NODE,
    COLLECTION_HAS_MORE_RECORDS: COLLECTION_HAS_MORE_RECORDS,
    COLLECTION_HAD_MORE_RECORDS: COLLECTION_HAD_MORE_RECORDS,
    DETAILS_PERSPECTIVE_INIT_URL_PARAMS: [ COLLECTION_STATE_FILTER, COLLECTION_STATE_ORDER_BY, COLLECTION_STATE_QFORM_PARAMS ],
    DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS: [ WORKFLOW_METADATA_DROPDOWN, WORKFLOW_DOCUMENTS_TYPE ],
    ADMIN_DETAILS_PERSPECTIVE_INIT_URL_PARAMS: [ WIDGET_NAME_WORKFLOW_OVERVIEW, COLLECTION_STATE_FILTER, COLLECTION_STATE_ORDER_BY, COLLECTION_STATE_QFORM_PARAMS ],
    ADMIN_DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS: [ WIDGET_NAME_WORKFLOW_OVERVIEW, WORKFLOW_METADATA_DROPDOWN, WORKFLOW_DOCUMENTS_TYPE ],
    AUDIT_PERSPECTIVE_INIT_URL_PARAMS: []
  });
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        prepareViewStateApi: function(options) {
          options = options || {};
          this.context = options.context;
        },
        getViewStateModel: function() {
          return this.context && this.context.viewStateModel;
        },
        addUrlParametersSupport: function(urlParameters, replaceExistingParams) {
          var viewStateModel = this.getViewStateModel();
          viewStateModel.addUrlParameters(urlParameters, this.context, replaceExistingParams);
        },
        getBackTitleOfLastRouter: function() {
          return this.getViewStateModel().getBackToTitle();
        },
        getViewStateWorkflowOverviewWidgetName: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.WIDGET_NAME_WORKFLOW_OVERVIEW);
        },
        getViewStateWorkflowReportingType: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_REPORTING_TYPE);
        },
        setViewStateWorkflowReportingType: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_REPORTING_TYPE, value, setToDefault, setToState);
        },
        getViewStateCollectionOrderBy: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_ORDER_BY);
        },
        setViewStateCollectionOrderBy: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_ORDER_BY, value, setToDefault, setToState);
        },
        getViewStateCollectionFilter: function() {
          var filter = this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_FILTER);
          if (_.isString(filter)) {
            try {
              filter = JSON.parse(filter);
            } catch (e) {
              console.warn(e);
            }
          }
          return filter;
        },
        setViewStateCollectionFilter: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_FILTER, JSON.stringify(value), setToDefault, setToState);
        },
        getViewStateCollectionSkipCount: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_SKIP);
        },
        setViewStateCollectionSkipCount: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_SKIP, value, setToDefault, setToState);
        },
        getViewStateCollectionTopCount: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_TOP);
        },
        setViewStateCollectionTopCount: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_TOP, value, setToDefault, setToState);
        },
        getViewStateWorkflowDocumentsType: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.WORKFLOW_DOCUMENTS_TYPE);
        },
        setViewStateWorkflowDocumentsType: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.WORKFLOW_DOCUMENTS_TYPE, value, setToDefault, setToState);
        },
        clearViewStateWorkflowDocumentsType: function() {
          this.setViewStateWorkflowDocumentsType("", false);
        },
        getViewStateWorkflowDocumentsSelectedNodeId: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.WORKFLOW_DOCUMENTS_SELECTED_NODE);
        },
        setViewStateWorkflowDocumentsSelectedNodeId: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.WORKFLOW_DOCUMENTS_SELECTED_NODE, value, setToDefault, setToState);
        },
        getViewStateWorkflowManageAttachments: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.WORKFLOW_MANAGE_ATTACHMENTS);
        },
        setViewStateWorkflowManageAttachments: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.WORKFLOW_MANAGE_ATTACHMENTS, value, setToDefault, setToState);
        },
        getViewStateCollectionHasMoreRecords: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_HAS_MORE_RECORDS);
        },
        setViewStateCollectionHasMoreRecords: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_HAS_MORE_RECORDS, value, setToDefault, setToState);
        },
        getViewStateCollectionHadMoreRecords: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_HAD_MORE_RECORDS);
        },
        setViewStateCollectionHadMoreRecords: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_HAD_MORE_RECORDS, value, setToDefault, setToState);
        },
        getViewStateProperty: function(propName) {
          var viewStateModel = this.getViewStateModel(), propValue = viewStateModel.getViewState(propName);
          return propValue ? propValue : viewStateModel.getDefaultViewState(propName);
        },
        setViewStateProperty: function(propName, propValue, setToDefault, setToState) {
          var viewStateModel = this.getViewStateModel();
          setToDefault !== false && viewStateModel.setDefaultViewState(propName, propValue);
          setToState !== false && viewStateModel.setViewState(propName, propValue);
        }
      });
    },
    PROPERTY_CONSTANTS: PROP_CONSTANTS
  };
});