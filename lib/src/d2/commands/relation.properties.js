/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery", "nuc/utils/url", "d2/commands/d2-metadata.properties", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "i18n!d2/commands/nls/localized.strings" ], function(_, Backbone, $, Url, D2PropertiesCommand, constants, RestResources, RestLinkrels, lang) {
  "use strict";
  var RelationPropertiesCommand = D2PropertiesCommand.extend({
    defaults: {
      signature: "D2-RelationProperties",
      command_key: "D2-RelationProperties",
      name: lang.CommandNameRelationProperties,
      verb: lang.CommandVerbRelationProperties,
      scope: "multiple"
    },
    _executeWithoutSaveState: function(status) {
      let repoUrlHref = RestLinkrels._getLinkMeta(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF).href, relationModels = status.collection.models, nodeModels = status.nodes.models, relationModelsNew = relationModels.map(model => {
        let newModel = new Backbone.Model({
          origCid: model.cid,
          id: model.get("associate_id"),
          type: constants.DocumentLinkType.RELATION,
          name: status.originatingView.model.attributes.name + " - " + model.get("relation_name") + " - " + model.get("name"),
          links: [ {
            rel: RestLinkrels.PROPERTY_PAGE,
            href: Url.combine(repoUrlHref, "objects", model.get("associate_id"), "property-page")
          } ],
          actions: model.get("actions"),
          ignoreLinksUpdate: true,
          suppressSignoffInputs: true
        });
        newModel.actions = model.actions;
        newModel.attributes.links.push(...model.get("links").filter(link => link.rel !== RestLinkrels.PROPERTY_PAGE));
        newModel.connector = model.connector;
        return newModel;
      });
      status.collection = new Backbone.Collection(relationModelsNew);
      let statusNodeModelIds = status.nodes.models.map(model => model.cid);
      let statusNodesNew = relationModelsNew.filter(model => {
        return statusNodeModelIds.includes(model.get("origCid"));
      });
      status.nodes.reset(statusNodesNew);
      D2PropertiesCommand.prototype._executeWithoutSaveState.apply(this, arguments).always(() => {
        _.each(status.collection.models, model => {
          let origRelationModel = relationModels.find(relationModel => {
            return relationModel.cid === model.get("origCid");
          });
          _.each(model.attributes, (value, key) => {
            let relationModelAttributeKey = model.d2DocumentType + "." + key;
            if (model.d2DocumentType) {
              origRelationModel.set(relationModelAttributeKey, value);
            }
            if (key === "description") {
              origRelationModel.set("relation_description", value);
            }
          });
        });
        status.collection.reset(relationModels);
        status.nodes.reset(nodeModels);
      });
    },
    enabled: () => {
      return true;
    }
  });
  return RelationPropertiesCommand;
});