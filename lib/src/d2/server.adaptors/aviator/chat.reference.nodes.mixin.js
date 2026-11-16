/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import NodeModel from "nuc/models/node/node.model";

import BrowsableV2ResponseMixin from "nuc/models/browsable/v2.response.mixin";

import Url from "nuc/utils/url";

import ConnectionFactory from "csui/utils/contexts/factories/connector";

import utils from "dctmw/utils/utils";

import Session from "dctmw/utils/authenticators/session";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

export default {
  mixin: function(prototype) {
    BrowsableV2ResponseMixin.mixin(prototype);
    return _.extend(prototype, {
      makeServerAdaptor(options) {
        this.makeBrowsableV2Response(options);
        return this;
      },
      sync(method, model, options) {
        if (method !== "read") {
          throw new Error("Only fetching the task is supported");
        }
        this.reset();
        let dfd = $.Deferred();
        if (options?.documentReferences?.length > 0) {
          const batchPayload = [], context = Session.get().getContext(), connector = context.getObject(ConnectionFactory), repoUrl = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF);
          _.each(options.documentReferences, documentReference => {
            const id = documentReference?.metadata?.documentID;
            batchPayload.push({
              id: id,
              request: {
                method: "GET",
                uri: Url.combine(repoUrl, "objects", id)
              }
            });
          });
          utils.makeBatchAjaxCall({
            connector: connector,
            operations: batchPayload,
            continueOnError: true
          }).done((successList, errorList) => {
            if (errorList.length > 0) {
              dfd.reject();
            }
            _.each(successList, item => {
              if (item && item.output) {
                let nodeModel = new NodeModel(undefined, {
                  context: context,
                  connector: connector
                }), nodeAttributes = nodeModel.parse(item.output, {});
                nodeModel.set(nodeAttributes, {
                  silent: true
                });
                this.add(nodeModel);
              }
            });
            dfd.resolve();
          });
        }
        return dfd.promise();
      }
    });
  }
};