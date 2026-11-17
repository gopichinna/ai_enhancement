/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "nuc/models/node/node.model", "nuc/models/nodes", "csui/utils/commandhelper", "d2/commands/create.folder.type.filter", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/constants", "d2/utils/creation.utils", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/create.folder/impl/nls/lang", "i18n!d2/server.adaptors/nls/lang" ], function($, _, CommandModel, NodeModel, NodeCollection, CommandHelper, typeFilter, RestLinkrels, RestResources, constants, CreationUtils, lang, viewLang, typeLang) {
  "use strict";
  require([ "d2/controls/table/inlineforms/folder/folder.view" ]);
  var ROOT_FOLDER_TYPE = "dm_folder", ROOT_CABINET_TYPE = "dm_cabinet";
  return CommandModel.extend({
    defaults: {
      signature: "D2-CreateFolder",
      command_key: "D2-CreateFolder",
      name: lang.CommandNameCreateFolder,
      scope: "single",
      verb: lang.CommandNameCreateFolder
    },
    enabled: function(status, options) {
      var nodes = new NodeCollection([ status.container ]), newStatus = _.defaults({
        nodes: nodes
      }, status);
      return CommandModel.prototype.enabled.call(this, newStatus, options);
    },
    execute: function(status, options) {
      options = options || {};
      var me = this, deferred = $.Deferred(), typeData;
      try {
        typeData = me._fetchFolderTypes(status);
      } catch (err) {
        return deferred.reject(err);
      }
      status.forwardToTable = true;
      var newNode = new NodeModel({
        type: typeData.isCabinet ? constants.Types.CABINET : constants.Types.FOLDER,
        type_name: typeData.isCabinet ? typeLang.nodeTypeCabinet : typeLang.nodeTypeFolder,
        container: true,
        typeData: typeData,
        rObjectType: typeData.defaultType,
        r_link_cnt: 0,
        links: CommandHelper.getOriginalAction(status.container, me.get("signature"), status.data).get("links"),
        name: ""
      }, {
        connector: status.container.connector,
        collection: status.collection
      });
      newNode.context = status.context;
      if (options.skipRefreshSelection === true) {
        deferred.resolve(newNode);
      } else {
        CreationUtils.refreshSelection(status).done(function() {
          deferred.resolve(newNode);
        }).fail(deferred.reject);
      }
      return deferred.promise();
    },
    _fetchFolderTypes: function(status) {
      var dctmTypeData = RestResources.getDctmTypeData(), params = status.data || {}, i, item, typeList, output = {
        folderTypes: []
      }, cabinetTypes = dctmTypeData.getAllSubTypes(ROOT_CABINET_TYPE, true), handleTypeError = function(name) {
        if (status.nonMenuAction) {
          throw new Error(_.str.sformat(viewLang.InvalidObjectTypeErrorMsg, name));
        } else {
          throw new Error(_.str.sformat(viewLang.ErrInvalidMenuConfig, name));
        }
      };
      if (params.only_object_type) {
        params.only_object_type = params.only_object_type.toLowerCase();
        item = dctmTypeData.getTypeDetails(params.only_object_type);
        if (!item) {
          handleTypeError(params.only_object_type);
          return;
        }
        output.folderTypes.push(item);
        output.defaultType = item.name;
      } else if (params.list_object_type) {
        params.list_object_type = params.list_object_type.toLowerCase();
        typeList = params.list_object_type.split(",");
        for (i = 0; i < typeList.length; i++) {
          item = dctmTypeData.getTypeDetails(typeList[i].trim());
          if (!item) {
            handleTypeError(typeList[i].trim());
            return;
          }
          output.folderTypes.push(item);
          if (item.name === (params.default_object_type || "").toLowerCase()) {
            output.defaultType = item.name;
          }
        }
      } else {
        params.root_object_type = params.root_object_type || ROOT_FOLDER_TYPE;
        params.root_object_type = params.root_object_type.toLowerCase();
        params.default_object_type = params.default_object_type || params.root_object_type;
        params.default_object_type = params.default_object_type.toLowerCase();
        item = dctmTypeData.getTypeDetails(params.root_object_type);
        if (!item) {
          handleTypeError(params.root_object_type);
          return;
        }
        output.folderTypes = typeFilter.filter(dctmTypeData.getAllSubTypes(params.root_object_type, true));
        if (!_.any(cabinetTypes, {
          name: params.root_object_type
        })) {
          output.folderTypes = _.reject(output.folderTypes, function(type) {
            return _.any(cabinetTypes, {
              name: type.name
            });
          });
        }
        _.each(output.folderTypes, function(type) {
          if (type.name === params.default_object_type) {
            output.defaultType = type.name;
          }
        });
      }
      _.each(output.folderTypes, function(type) {
        if (_.any(cabinetTypes, {
          name: type.name
        })) {
          output.isCabinet = true;
        }
      });
      return output;
    }
  });
});