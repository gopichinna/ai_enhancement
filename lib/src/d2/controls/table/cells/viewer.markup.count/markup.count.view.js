/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/table/cells/viewer.markup.count/impl/markups.count.view", "i18n!d2/controls/table/cells/viewer.markup.count/impl/nls/lang", "css!d2/controls/table/cells/viewer.markup.count/impl/markups.count.view" ], function(_, Marionette, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    tagName: "li",
    className: "d2-cell-markup-count-wrapper",
    template: template,
    templateHelpers: function() {
      return {
        title: this.getTitleText()
      };
    },
    constructor: function WfAssociationCountView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    getTitleText: function() {
      const data = this.model.get("viewer_markup_count");
      if (data > 1) {
        return _.str.sformat(lang.markupTitleMultiple, data);
      }
      return _.str.sformat(lang.markupTitleSingle, data);
    }
  }, {
    enabled: function(status) {
      return status.node.get("viewer_markup_count") > 0;
    }
  });
});