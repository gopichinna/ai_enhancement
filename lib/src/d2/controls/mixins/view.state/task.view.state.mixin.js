/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  var WIDGET_NAME_TASK_LIST = "task_list_widget_name", WIDGET_NAME_TASK_ATTACHMENTS = "task_attachments_widget_name", COLLECTION_STATE_ORDER_BY = "task_order_by", COLLECTION_STATE_FILTER = "task_filter", COLLECTION_STATE_TOP = "top", COLLECTION_STATE_SKIP = "skip", TASK_MANAGE_ATTACHMENTS = "manage_attachments", TASK_METADATA_DROPDOWN = "dropdown", TASK_DOCUMENTS_TYPE = "type", TASK_DOCUMENTS_SELECTED_NODE = "nodeId", COLLECTION_HAS_MORE_RECORDS = "hasMoreRecords", COLLECTION_HAD_MORE_RECORDS = "hadMoreRecords", COLLECTION_STATE_FACETFILTERS = "facetFilters", PROP_CONSTANTS = Object.freeze({
    WIDGET_NAME_TASK_LIST: WIDGET_NAME_TASK_LIST,
    WIDGET_NAME_TASK_ATTACHMENTS: WIDGET_NAME_TASK_ATTACHMENTS,
    COLLECTION_STATE_ORDER_BY: COLLECTION_STATE_ORDER_BY,
    COLLECTION_STATE_FILTER: COLLECTION_STATE_FILTER,
    COLLECTION_STATE_TOP: COLLECTION_STATE_TOP,
    COLLECTION_STATE_SKIP: COLLECTION_STATE_SKIP,
    TASK_MANAGE_ATTACHMENTS: TASK_MANAGE_ATTACHMENTS,
    TASK_METADATA_DROPDOWN: TASK_METADATA_DROPDOWN,
    TASK_DOCUMENTS_TYPE: TASK_DOCUMENTS_TYPE,
    TASK_DOCUMENTS_SELECTED_NODE: TASK_DOCUMENTS_SELECTED_NODE,
    COLLECTION_HAS_MORE_RECORDS: COLLECTION_HAS_MORE_RECORDS,
    COLLECTION_HAD_MORE_RECORDS: COLLECTION_HAD_MORE_RECORDS,
    COLLECTION_STATE_FACETFILTERS: COLLECTION_STATE_FACETFILTERS,
    DETAILS_PERSPECTIVE_INIT_URL_PARAMS: [ COLLECTION_STATE_FILTER, COLLECTION_STATE_ORDER_BY ],
    DOCUMENTS_PERSPECTIVE_INIT_URL_PARAMS: [ TASK_METADATA_DROPDOWN, TASK_DOCUMENTS_TYPE ]
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
        getViewStateTaskListWidgetName: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.WIDGET_NAME_TASK_LIST);
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
            } catch (ex) {
              console.warn(ex);
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
        getViewStateTaskDocumentsType: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.TASK_DOCUMENTS_TYPE);
        },
        setViewStateTaskDocumentsType: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.TASK_DOCUMENTS_TYPE, value, setToDefault, setToState);
        },
        clearViewStateTaskDocumentsType: function() {
          this.setViewStateTaskDocumentsType("", false);
        },
        getViewStateTaskDocumentsSelectedNodeId: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.TASK_DOCUMENTS_SELECTED_NODE);
        },
        setViewStateTaskDocumentsSelectedNodeId: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.TASK_DOCUMENTS_SELECTED_NODE, value, setToDefault, setToState);
        },
        getViewStateTaskManageAttachments: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.TASK_MANAGE_ATTACHMENTS);
        },
        setViewStateTaskManageAttachments: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.TASK_MANAGE_ATTACHMENTS, value, setToDefault, setToState);
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
        getViewStateCollectionFacetFilter: function() {
          return this.getViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_FACETFILTERS);
        },
        setViewStateCollectionFacetFilter: function(value, setToDefault, setToState) {
          return this.setViewStateProperty(PROP_CONSTANTS.COLLECTION_STATE_FACETFILTERS, value, setToDefault, setToState);
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