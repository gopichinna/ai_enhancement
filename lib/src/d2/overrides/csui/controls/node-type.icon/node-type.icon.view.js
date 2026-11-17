/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

const origInitialize = NodeTypeIconView.prototype.initialize;

const origOnDestroy = NodeTypeIconView.prototype.onDestroy;

NodeTypeIconView.prototype.initialize = function(options) {
  if (options?.node?.get("image_url") && options?.model) {
    options.model.set("imageUrl", options.node.get("image_url"));
    this.ownModel = false;
  }
  origInitialize.apply(this, arguments);
};

NodeTypeIconView.prototype.onDestroy = function() {
  if (!this.ownModel && this.options?.node?.get("image_url")) {
    this.model.stopListening();
  }
  origOnDestroy.apply(this, arguments);
};