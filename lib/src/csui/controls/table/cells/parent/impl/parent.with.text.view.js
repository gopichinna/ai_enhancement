/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/node.links/node.links", "csui/controls/table/cells/parent/impl/parent.base.view" ], function(_, nodeLinks, ParentBaseView) {
  "use strict";
  var ParentTextView = ParentBaseView.extend({
    tagName: "a",
    attributes: function() {
      return {
        title: this.model.get("name"),
        href: nodeLinks.getUrl(this.model)
      };
    },
    template: false,
    triggers: {
      click: "cell:node:request"
    },
    constructor: function ParentTextView(options) {
      ParentBaseView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.el.textContent = this.model.get("name");
    }
  });
  return ParentTextView;
});