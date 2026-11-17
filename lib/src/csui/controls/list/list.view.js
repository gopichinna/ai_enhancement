/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "smart/controls/list/list.view", "i18n" ], function($, _, SmartListView, i18n) {
  var ListView = SmartListView.extend({
    constructor: function ListView(options) {
      options || (options = {});
      _.defaults(options, {
        filterValue: ""
      });
      options.customEle = this.showInlineActionBar ? "div.csui-item-standard:nth-child({0})" : "";
      SmartListView.prototype.constructor.call(this, options);
      this.listenTo(this, "doc:preview:generic:actions", this._highlightRow);
    },
    _highlightRow: function(targetNode, HIGHLIGHT_CLASS_NAME) {
      $("." + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
      var rowIndex = _.findIndex(this.collection.models, function(node) {
        return node.get("id") === targetNode.get("id");
      });
      if (rowIndex !== -1) {
        var child = this.$childViewContainer;
        var target = child && child.children();
        var targetRow = target && target.eq(rowIndex);
        targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
      }
    }
  });
  return ListView;
});