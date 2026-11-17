/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/rest.resources", "nuc/utils/url", "dctmw/utils/utils", "d2/widgets/metadata/panels/relations/metadata.relations.model", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, RestLinkrels, constants, RestResources, Url, utils, RelationCollection, lang) {
  "use strict";
  var RelationsModel = Backbone.Model.extend({
    constructor: function RelationsModel(options) {
      options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, options);
    },
    sync: function(method, model, options) {
      var deferred = $.Deferred(), me = this;
      if (method === "create") {
        if (options.relationTypeModel.get("isMultiRelation")) {
          this.createRelations(deferred, options);
        } else {
          this._checkSameRelationExists(options).done(function() {
            me.createRelations(deferred, options);
          }).fail(function() {
            var err = {};
            err.responseJSON = {
              message: _.str.sformat(lang.RelationsOneFailure, options.parentNode.get("name")),
              details: lang.RelationExistsMsg
            };
            deferred.reject(err);
          });
        }
        return deferred.promise();
      } else {
        throw Error("Only create method is allowed for relation model");
      }
    },
    createRelations: function(deferred, options) {
      var batchPayload = [], url = RestLinkrels.getLink(options.parentNode.get("links"), RestLinkrels.D2_RELATIONS);
      if (options.reverseRelation) {
        url = Url.appendQuery(url, Url.combineQueryString({
          "reverse-relation": true
        }));
      }
      _.each(options.childNodes.models, function(childNode) {
        var payload = {
          properties: {
            relation_name: options.relationTypeModel.get("relationName"),
            child_id: childNode.get("id"),
            description: options.description,
            r_object_type: options.relationTypeModel.get("relationType")
          }
        };
        if (options.formValues && options.formValues[childNode.get("id")]) {
          _.extend(payload["properties"], options.formValues[childNode.get("id")]);
        }
        batchPayload.push({
          id: childNode.get("id"),
          request: {
            method: "POST",
            uri: url,
            entity: JSON.stringify(payload),
            headers: [ {
              name: "Content-Type",
              value: constants.MediaTypes.DCTM_JSON
            } ]
          }
        });
      }, this);
      utils.makeBatchAjaxCall({
        connector: options.parentNode.connector,
        operations: batchPayload,
        continueOnError: true,
        sequential: true
      }).done(function(successList, errorList) {
        return deferred.resolve(options.childNodes, successList, errorList);
      }).fail(function(error) {
        deferred.reject(error);
      });
    },
    _checkSameRelationExists: function(options) {
      var deferred = $.Deferred(), relationAlreadyExists = false, columnDefinitions = [ {
        key: "name",
        name: "",
        type: -1,
        type_name: "String",
        direction: "Asc",
        sort: true
      } ];
      this.relationCollection = new RelationCollection(undefined, {
        node: options.parentNode,
        autoreset: true,
        relationPopup: true,
        clientColumns: columnDefinitions,
        sizeLimit: true
      });
      this.relationCollection.fetch().done(function(RelationsData) {
        RelationsData.forEach(function(eachRelation) {
          var type = eachRelation.get("relation_type_name");
          if (eachRelation.get(`${type}.relation_name`) === options.relationTypeModel.get("relationName") && options.childNodes.models[0].get("id") === eachRelation.get("id")) {
            relationAlreadyExists = true;
          }
        });
        if (!relationAlreadyExists) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }).fail(deferred.reject);
      return deferred.promise();
    }
  });
  return RelationsModel;
});