/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone" ], function($, _, Backbone) {
  "use strict";
  var PROP_VDM_NUMBER = "vdm-number", PROP_PARENT_VDM_NUMBER = "parent-vdm-number", PROP_PARENT_VD_ID = "parent-id", PROP_VD_RELATION_ID = "relation-id", OBJ_TYPE_SNAPSHOT = "d2c_snapshot", MEM_TSTAMP = "tsLastUpdate", QUERY_PARAM_VD_FRAME_ID = "parent-vd-ids", VD_SPECIFIC_ATTRIBUTES = [ PROP_VDM_NUMBER, PROP_PARENT_VDM_NUMBER, PROP_PARENT_VD_ID, PROP_VD_RELATION_ID ], PRINTABLE_DETAILS_FORMAT = "cid: {0}, v: {1}, name: {2}, id: {3}, r: {4}, p: {5}, pv: {6}";
  return {
    PROP_VDM_NUMBER: PROP_VDM_NUMBER,
    PROP_PARENT_VDM_NUMBER: PROP_PARENT_VDM_NUMBER,
    PROP_PARENT_VD_ID: PROP_PARENT_VD_ID,
    PROP_VD_RELATION_ID: PROP_VD_RELATION_ID,
    MEM_TSTAMP: MEM_TSTAMP,
    QUERY_PARAM_VD_FRAME_ID: QUERY_PARAM_VD_FRAME_ID,
    QUERY_VDM_NUMBERS: "vdm-numbers",
    QUERY_VD_RELATION_IDS: "relation-ids",
    isVirtualDoc: function(node) {
      return node && this.isVirtualDocByAttributes(node.attributes);
    },
    isVirtualDocByAttributes: function(attributes) {
      return attributes && (attributes["rIsVirtualDoc"] === true || attributes["r_is_virtual_doc"] === 1);
    },
    isVDSnapshot: function(node) {
      var objType = node && (node.get("rObjectType") || node.get("r_object_type")), isObjectTypeSnapShot = objType === OBJ_TYPE_SNAPSHOT, assembledFromId = node.get("rAssembledFromId") || node.get("r_assembled_from_id"), isAssembledFromId = assembledFromId ? parseInt(assembledFromId, 16) !== 0 : false;
      return isObjectTypeSnapShot || isAssembledFromId;
    },
    isVDSnapshotByAttributes: function(attributes) {
      var objType = attributes && (attributes["rObjectType"] || attributes["r_object_type"]);
      return objType === OBJ_TYPE_SNAPSHOT;
    },
    hasVDChildren: function(node) {
      return this.isVirtualDoc(node) && node.get("r_link_cnt") > 0;
    },
    getVDMNumber: function(node) {
      return this.getVDProperty(node, PROP_VDM_NUMBER);
    },
    isRootNode: function(node) {
      return this.getVDMNumber(node) === "0";
    },
    getParentVDMNumber: function(node) {
      return this.getVDProperty(node, PROP_PARENT_VDM_NUMBER);
    },
    getParentVDId: function(node) {
      return this.getVDProperty(node, PROP_PARENT_VD_ID);
    },
    getVDRelationId: function(node) {
      return this.getVDProperty(node, PROP_VD_RELATION_ID);
    },
    getVDProperty: function(node, propertyName) {
      var propValue = node.get(propertyName);
      if (!propValue && !!node.origNode) {
        propValue = node.origNode.get(propertyName);
      }
      return propValue;
    },
    getLogPrintableDetails: function(node) {
      return node ? _.str.sformat(PRINTABLE_DETAILS_FORMAT, node.cid, this.getVDMNumber(node), node.get("name"), node.get("id"), this.getVDRelationId(node), this.getParentVDId(node), this.getParentVDMNumber(node)) : "";
    },
    syncToOriginalVDNode: function(node) {
      var origNode = node.origNode;
      if (origNode && origNode[MEM_TSTAMP] <= node[MEM_TSTAMP]) {
        this.copyAttributesExceptVDPrivates(origNode, node);
      }
    },
    copyAttributesExceptVDPrivates: function(destNode, srcAttributes, options) {
      options = options || {};
      if (srcAttributes instanceof Backbone.Model) {
        srcAttributes = srcAttributes.attributes;
      }
      destNode.set(_.omit(srcAttributes, VD_SPECIFIC_ATTRIBUTES), options);
    },
    createVDActionKey: function() {
      var keys = [];
      _.each(arguments, function(arg) {
        if (_.isString(arg) && !_.isEmpty(arg)) {
          keys.push(arg);
        }
      });
      return keys.join("_");
    }
  };
});