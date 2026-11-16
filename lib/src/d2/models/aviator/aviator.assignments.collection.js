/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  Collection
} from "nuc/lib/backbone";

import ConnectorFactory from "nuc/contexts/factories/connector";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "dctmw/utils/rest.linkrels";

import Session from "dctmw/utils/authenticators/session";

import CollectionResourceMixin from "d2/sdk/models/mixins/collection.resource.mixin";

import AviatorAssignmentModel from "d2/models/aviator/aviator.assignment.model";

import AviatorAssignmentsColumnsCollection from "d2/models/aviator/aviator.assignments.columns";

import clientColumns from "d2/models/aviator/aviator.assignments.client.columns";

import constants from "d2/utils/constants";

import serverColumnsConverter from "d2/server.adaptors/converters/servercolumns";

import sortUtils from "d2/utils/sort.utils";

import widgetConstants from "d2/utils/widget.constants";

const DELAYED_CHILDREN_COUNT_OP_PREFIX = "av4r_children_count_";

const CHILDREN_COUNT_COLLATION_PROP_NAME = "av4r_children_count";

class AviatorAssignmentsCollection extends Collection {
  model = AviatorAssignmentModel;
  widgetType = widgetConstants.D2.ADMIN_AVIATOR;
  #locallyRemovedAssignments = [];
  constructor(models, options = {}) {
    options.ColumnCollectionClass = AviatorAssignmentsColumnsCollection;
    options.connector = Session.get().getContext().getObject(ConnectorFactory);
    options.expanded = _.isBoolean(options.expanded) ? options.expanded : false;
    options.responseMediaType = constants.MediaTypes.JSON;
    super(models, options);
    this.options = options;
    this.makeCollectionResource(options);
    this.clientColumns = _.isArray(options.clientColumns) && !_.isEmpty(options.clientColumns) ? options.clientColumns : clientColumns;
    this.listenTo(this, "before:delayed:data:send", this.beforeSendingDelayedDataRequest);
  }
  url() {
    return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.AVIATOR_ASSIGNMENTS_LIST);
  }
  parse(response) {
    return (response.entries || []).map(function(entry) {
      return _.extend(entry.content.properties, entry.content["aviator_properties"], {
        links: entry.content.links
      });
    });
  }
  sync() {
    this.#clearDirtyState();
    super.sync.apply(this, arguments);
  }
  addNodeModels(models) {
    models = models.map(model => {
      const id = this._isModel(model) ? model.get("id") : model.id;
      let assignmentModel = this.removeLocallyDeletedAssignment(id);
      if (!assignmentModel) {
        assignmentModel = this.#createAviatorAssignmentModel(model);
      }
      return assignmentModel;
    });
    return this.unshift(models);
  }
  #createAviatorAssignmentModel(model) {
    let properties = _.omit(model.attributes, "id", "name"), assignmentModel = new AviatorAssignmentModel({
      properties: _.defaults({
        r_object_id: model.get("id"),
        object_name: model.get("name")
      }, properties)
    }, {
      parse: true
    });
    assignmentModel.isLocallyCreated = true;
    return assignmentModel;
  }
  remove(models, options) {
    let singular = !_.isArray(models);
    if (!_.isArray(models)) {
      models = [ models ];
    }
    models.forEach(model => {
      if (!model.isLocallyCreated) {
        this.#locallyRemovedAssignments.push(model);
      }
      let modelRef = this.get(model);
      if (!modelRef) {
        const idx = this.allModels.indexOf(model);
        if (idx !== -1) {
          modelRef = this.allModels[idx];
          this._modelRemoved && this._modelRemoved(model, this, {});
          this.trigger("removed:allmodel", modelRef);
        }
      }
    });
    return super.remove(singular ? models[0] : models, options);
  }
  #clearDirtyState() {
    this.#locallyRemovedAssignments = [];
  }
  get locallyRemovedAssignments() {
    return this.#locallyRemovedAssignments;
  }
  get locallyAddedAssignments() {
    return this.allModels.filter(model => model.isLocallyCreated);
  }
  get isDirtyCollection() {
    return this.#locallyRemovedAssignments.length > 0 || this.allModels.some(model => model.isLocallyCreated);
  }
  #getLocallyRemovedIdx(id) {
    return this.#locallyRemovedAssignments.findIndex(model => model.get("id") === id);
  }
  removeLocallyDeletedAssignment(id) {
    let idx = this.#getLocallyRemovedIdx(id);
    return idx === -1 ? null : this.#locallyRemovedAssignments.splice(idx, 1)[0];
  }
  removeLocallyAddedAssignment(id) {
    let assignment = this.allModels.find(model => model.get("id") === id);
    if (assignment) {
      assignment.isLocallyCreated = false;
    }
  }
  beforeSendingDelayedDataRequest(parameters) {
    [ "favorites", "locations", "permissions" ].forEach(k => {
      delete parameters[k];
    });
    parameters.cbAddOperationsToBatchRequestPayload = () => {
      const rBody = {};
      this.allModels.forEach(model => {
        const opId = `${DELAYED_CHILDREN_COUNT_OP_PREFIX}${model.get("id")}`;
        rBody[opId] = RestLinkrels.getLink(model.get("links"), RestLinkrels.AVIATOR_ASSIGNMENT_CHILD_COUNT);
      });
      return rBody;
    };
    parameters.cbCollateOperationIntoBatchResponse = (opId, opResponse, collatedOutput) => {
      if (opId.startsWith(DELAYED_CHILDREN_COUNT_OP_PREFIX)) {
        let accumulatedChildrenCount = collatedOutput[CHILDREN_COUNT_COLLATION_PROP_NAME];
        if (!accumulatedChildrenCount) {
          accumulatedChildrenCount = collatedOutput[CHILDREN_COUNT_COLLATION_PROP_NAME] = {};
        }
        const objId = opId.substring(DELAYED_CHILDREN_COUNT_OP_PREFIX.length);
        accumulatedChildrenCount[objId] = _.extend({}, opResponse);
      }
    };
    parameters.cbPrepareObjectsPropertiesFromBatchResponse = (collatedResponse, outputObjectsProperties) => {
      const childrenCount = collatedResponse[CHILDREN_COUNT_COLLATION_PROP_NAME];
      _.keys(childrenCount).forEach(objId => {
        let properties = outputObjectsProperties[objId];
        if (!properties) {
          properties = outputObjectsProperties[objId] = {};
        }
        _.extend(properties, {
          av4r_children_count: childrenCount[objId]["file_count"]
        });
      });
    };
  }
}

CollectionResourceMixin.mixin(AviatorAssignmentsCollection.prototype);

AviatorAssignmentsCollection.prototype.compareObjectsForSort = function(property, left, right) {
  var sortSchema = this.columnTypes[property];
  if (!sortSchema) {
    this.columnTypes[property] = {};
    sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
    this.columnTypes[property] = sortSchema;
  }
  var specialNodeWeight = function(item) {
    return item.isLocallyCreated ? 0 : 1;
  }, cmpVal = specialNodeWeight(left) - specialNodeWeight(right);
  if (cmpVal !== 0) {
    if (_.isString(this.orderBy) && this.orderBy.toLowerCase().trim().split(" ")[1] === "desc") {
      cmpVal = -1 * cmpVal;
    }
    return cmpVal;
  }
  return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
};

Object.defineProperty(AviatorAssignmentsCollection.prototype.constructor, "name", {
  value: "AviatorAssignmentsCollection"
});

export default AviatorAssignmentsCollection;