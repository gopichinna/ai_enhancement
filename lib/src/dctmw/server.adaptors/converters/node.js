/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/rest.resources", "dctmw/utils/constants", "dctmw/utils/vdoc.utils", "dctmw/utils/widget.constants", "i18n!dctmw/server.adaptors/models/impl/nls/lang" ], function(_, RestResources, constants, vdUtils, widgetConstants, lang) {
  "use strict";
  var clientServerAttrNameMap = {
    id: "r_object_id",
    name: "object_name",
    created_date: "r_creation_date",
    created_user_id: "r_creator_name",
    modify_date: "r_modify_date",
    modify_user_id: "r_modifier",
    owner_user_id: "owner_name",
    reserved_user_id: "r_lock_owner",
    reserved_date: "r_lock_date"
  }, serverClientAttrNameMap = {};
  _.map(clientServerAttrNameMap, function(value, key) {
    serverClientAttrNameMap[value] = key;
  });
  function getId(node) {
    if (_.isString(node)) {
      return node;
    }
    if (node && _.isFunction(node.get)) {
      return node.get("id");
    }
  }
  return {
    convertAncestors: function(breadcrumbs) {
      var that = this;
      var parentId = null;
      return breadcrumbs.map(convertAncestor);
      function convertAncestor(breadcrumb) {
        var id = breadcrumb.r_object_id, properties = {
          id: id,
          name: breadcrumb.object_name,
          parent_id: parentId
        };
        that.setNodeType(properties);
        parentId = id;
        return properties;
      }
    },
    isRepositoryNode: function(node) {
      return getId(node) === constants.NodeId.REPOSITORY;
    },
    isDQLNode: function(node) {
      var id = getId(node);
      return id && id !== -1 && id.indexOf(constants.DQL_NODE_PREFIX) === 0;
    },
    isFavoritesNode: function(node) {
      return getId(node) === constants.NodeId.FAVORITES;
    },
    isNonDCTMNode: function(node) {
      return this.isRepositoryNode(node) || this.isFavoritesNode(node) || this.isDQLNode(node);
    },
    convertNode: function(entry) {
      var id, ancestors, properties, actions, attributes, basePermissions, favorite, relationsCount, previewFormats;
      attributes = entry.properties || entry;
      actions = attributes.actions || [];
      id = attributes.r_object_id;
      ancestors = attributes.i_ancestor_id || [];
      basePermissions = entry["base-permissions"];
      favorite = entry["favorite"] ? entry["favorite"].favorite : undefined;
      relationsCount = entry["relations_count"], previewFormats = entry["previewFormats"] ? entry["previewFormats"]["preview-format"] : undefined;
      properties = {
        ancestors: ancestors,
        links: entry.links,
        basePermissions: basePermissions,
        actions: actions,
        favorite: favorite,
        d2_version_label: attributes["r_version_label"],
        relations_count: relationsCount,
        d2_preview_format: previewFormats
      };
      var unmappedAttributes = _.omit(attributes, _.keys(this.getServerClientAttrNameMap()));
      _.extend(properties, unmappedAttributes);
      var map = this.getClientServerAttrNameMap();
      _.map(map, function(value, key) {
        properties[key] = attributes[value];
      });
      this.setNodeType(properties);
      if (properties.reserved_user_id && properties.reserved_user_id !== "") {
        properties.reserved = true;
        _.extend(properties, {
          reserved_user_id_expand: {
            id: properties.reserved_user_id
          }
        });
      } else {
        properties.reserved = false;
      }
      if (properties.container) {
        if (properties.type === constants.Types.CABINET) {
          properties.parent_id = constants.NodeId.REPOSITORY;
        } else if (attributes.i_folder_id) {
          properties.parent_id = attributes.i_folder_id[0];
        }
        actions.push({
          signature: "browse"
        });
      } else if (_.contains([ constants.Types.DOCUMENT, constants.Types.EMAIL, constants.Types.RENDITION, constants.Types.OBJECT, constants.Types.WORKFLOW_STEP, constants.Types.WORKFLOW ], properties.type)) {
        properties.version_id = id;
        properties.version_number = 1;
        properties.parent_id = _.isString(attributes.i_folder_id) ? attributes.i_folder_id : _.isArray(attributes.i_folder_id) ? attributes.i_folder_id[0] : 0;
        properties.mime_type = properties.mime_type || this.getMimeType(attributes.aContentType) || this.getMimeType(attributes.a_content_type);
        if (basePermissions && basePermissions.read) {
          if (vdUtils.isVDSnapshotByAttributes(properties)) {
            actions.push({
              signature: "D2-OpenVDocSnapshot"
            });
          } else if (!_.contains([ constants.Types.WORKFLOW ], properties.type)) {
            actions.push({
              signature: "open"
            });
          }
        }
      }
      if (!this.isNonDCTMNode(properties.id)) {
        actions.push({
          signature: "properties"
        });
      }
      if (properties.rObjectType === "d2c_workflow_tracker" || properties.r_object_type === "d2c_workflow_tracker") {
        properties.menuType = constants.MenuTypes.WORKFLOWS;
        properties.widgetType = widgetConstants.D2.WORKFLOWS;
        properties.parent_id_expand = properties.parent_name = null;
        properties.customProperties = true;
      }
      _.each(_.keys(entry), function(key) {
        delete entry[key];
      });
      _.extend(entry, properties);
      return properties;
    },
    getClientServerAttrNameMap: function() {
      return clientServerAttrNameMap;
    },
    getServerClientAttrNameMap: function() {
      return serverClientAttrNameMap;
    },
    getMimeType: function(formatName) {
      var format = RestResources.getFormats().get(formatName);
      if (format) {
        return format.get("mime_type");
      }
    },
    setNodeType: function(properties) {
      var id = properties.id || "";
      id = id === -1 ? "" : id;
      var contentType = properties.aContentType, rObjectType = properties.rObjectType || properties.r_object_type;
      if (id.indexOf("0b") === 0) {
        properties.type = constants.Types.FOLDER;
        properties.type_name = lang.nodeTypeFolder;
        properties.container = true;
      } else if (id.indexOf("0c") === 0) {
        properties.type = constants.Types.CABINET;
        properties.type_name = lang.nodeTypeCabinet;
        properties.container = true;
      } else if (id.indexOf("81") === 0) {
        properties.type = constants.Types.BWS;
        properties.type_name = lang.nodeTypeBWS;
        properties.container = true;
        properties.isBws = true;
      } else if (id.indexOf("08") === 0 || id.indexOf("09") === 0) {
        properties.type = contentType === "entourage_msg" || contentType === "msg" ? constants.Types.EMAIL : rObjectType === "d2c_workflow_tracker" ? constants.Types.WORKFLOW : constants.Types.DOCUMENT;
        properties.type_name = rObjectType === "d2c_workflow_tracker" ? lang.nodeTypeWorkflow : lang.nodeTypeDocument;
        properties.container = false;
      } else if (id.indexOf("06") === 0) {
        properties.type = constants.Types.RENDITION;
        properties.type_name = lang.nodeTypeRendition;
        properties.container = false;
      } else if (id.indexOf("4a") === 0) {
        properties.type = constants.Types.TASK;
        properties.type_name = lang.nodeTypeTask;
        properties.container = false;
      } else if (id.indexOf("4b") === 0) {
        properties.type = constants.Types.WORKFLOW_STEP;
        properties.type_name = lang.nodeTypeWorkflowStep;
        properties.container = false;
      } else if (id === constants.NodeId.REPOSITORY) {
        properties.type = constants.Types.REPOSITORY;
        properties.type_name = lang.nodeTypeRepository;
        properties.container = true;
      } else if (id.indexOf(constants.DQL_NODE_PREFIX) === 0) {
        properties.type = constants.Types.DQL;
        properties.type_name = lang.nodeTypeDQL;
        properties.container = true;
      } else if (id === constants.NodeId.FAVORITES) {
        properties.type = constants.Types.FOLDER;
        properties.type_name = lang.nodeTypeFavorites;
        properties.container = true;
        properties.selectable = false;
      } else {
        properties.type = constants.Types.OBJECT;
        properties.type_name = lang.nodeTypeObject;
        properties.container = false;
      }
    }
  };
});