/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import Url from "nuc/utils/url";

import Session from "dctmw/utils/authenticators/session";

import ConnectionFactory from "csui/utils/contexts/factories/connector";

import constants from "d2/utils/constants";

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
    } = this.#options, node = nodes[0], where = {
      "expression-type": "expression-set",
      expressions: [ {
        "expression-type": "property",
        name: "r_object_id",
        operator: "EQUAL",
        value: node.get("id")
      } ]
    };
    return where;
  }
  makeChatRequest(body) {
    body.chats = body.messages;
    delete body.messages;
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
                documentID: reference.properties["r_object_id"]
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
}

export default ChatServerAdapter;