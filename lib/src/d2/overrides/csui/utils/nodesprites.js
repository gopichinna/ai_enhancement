/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import NodeSprites from "csui/utils/nodesprites";

NodeSprites.findByNode = function(node) {
  return this.find(function(item) {
    return item.matchRules(node, item.attributes, item.attributes);
  });
};