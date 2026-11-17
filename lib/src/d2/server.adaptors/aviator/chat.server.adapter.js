/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import Url from "nuc/utils/url";

import Session from "dctmw/utils/authenticators/session";

import ConnectionFactory from "csui/utils/contexts/factories/connector";

import constants from "d2/utils/constants";

import vdocUtils from "d2/utils/vdoc.utils";

import RestResources from "dctmw/utils/rest.resources";

import RestLinkrels from "d2/utils/rest.linkrels";

class ChatServerAdapter {
  #options;
  constructor(options) {
    this.#options = options;
  }
  #getConnector() {
    let context = Session.get().getContext(), connector = context.getObject(ConnectionFactory);
    return connector;
  }
  getChatUrl() {
    const repoUrl = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), chatUrl = Url.combine(repoUrl, "chat");
    return chatUrl;
  }
  prepareWhereClause() {
    const {
      nodes
    } = this.#options;
    let where;
    if (nodes.length === 1) {
      let firstNode = nodes[0];
      if (vdocUtils.isVirtualDoc(firstNode) && vdocUtils.getVDMNumber(firstNode)) {
        let firstNodeId = firstNode.get("id"), av4rExtraObjectIds = firstNode.has("av4rAlliedObjectIds") ? firstNode.get("av4rAlliedObjectIds") : [], nodeIds = [ firstNodeId, ...av4rExtraObjectIds ];
        nodeIds = _.uniq(nodeIds);
        where = this._getExpressionForObjects(nodeIds);
      } else if (firstNode.get("container") === true) {
        where = this._getExpressionForContainerWithCurrentVersion(firstNode);
      } else {
        where = this._getExpressionForObject(firstNode);
      }
    } else {
      where = this._getExpressionForObjects(nodes);
    }
    return where;
  }
  makeChatRequest(body) {
    body.chats = body.messages;
    body["inline-citation"] = body.inlineCitation === "true";
    delete body.messages;
    delete body.inlineCitation;
    return new Promise((resolve, reject) => {
      const connector = this.#getConnector();
      $.ajax(connector.extendAjaxOptions({
        url: this.getChatUrl(),
        type: "POST",
        data: JSON.stringify(body),
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          if (response?.references) {
            _.each(response?.references, reference => {
              reference.metadata = {
                documentID: reference.properties["r_object_id"],
                content: {
                  chunks: reference?.content?.chunks,
                  source: reference?.content?.source
                }
              };
            });
          }
          resolve(response);
        },
        error: function(xhr) {
          if (xhr && xhr.responseText) {
            var msg = JSON.parse(xhr.responseText);
            reject(new Error(msg ? msg.message : xhr.responseText));
          }
          reject(xhr);
        }
      }));
    });
  }
  _getExpressionForObject(node) {
    let objectId = _.isString(node) ? node : node.get("id");
    return {
      "expression-type": "expression-set",
      operator: "AND",
      expressions: [ {
        "expression-type": "property",
        name: "r_object_id",
        operator: "EQUAL",
        value: objectId
      } ]
    };
  }
  _getExpressionForObjects(nodes) {
    let expressions = [];
    _.each(nodes, node => {
      expressions.push(this._getExpressionForObject(node));
    });
    return {
      "expression-type": "expression-set",
      operator: "OR",
      expressions: expressions
    };
  }
  _getExpressionForContainerWithCurrentVersion(node) {
    let objectId = node.get("id");
    return {
      "expression-type": "expression-set",
      operator: "AND",
      expressions: [ {
        "expression-type": "property-list",
        name: "r_object_id",
        operator: "IN",
        values: [ objectId ]
      }, {
        "expression-type": "property-list",
        name: "r_version_label",
        operator: "IN",
        values: [ "CURRENT" ]
      } ]
    };
  }
}

export default ChatServerAdapter;