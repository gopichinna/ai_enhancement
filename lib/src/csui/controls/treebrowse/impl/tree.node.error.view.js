/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "hbs!csui/controls/treebrowse/impl/tree.node.error" ], function($, _, Marionette, TreeNodeErrorTemplate) {
  "use strict";
  return Marionette.ItemView.extend({
    tagName: "span",
    className: "csui-tree-error-node-icon-container",
    template: TreeNodeErrorTemplate,
    constructor: function TreeNodeErrorView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
});