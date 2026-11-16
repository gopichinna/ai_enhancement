/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/nodesprites", "nuc/models/node/node.model", "i18n!d2/dialogs/new.file/link.document/impl/nls/lang", "hbs!d2/dialogs/new.file/link.document/impl/link.document.relation.item" ], function(_, $, Backbone, Marionette, base, NodeSpritesCollection, NodeModel, lang, template) {
  "use strict";
  var LinkDocumentRelationItemView = Marionette.ItemView.extend({
    className: "link-document-relation-item",
    template: template,
    ui: {
      removeBtn: ".remove-button"
    },
    events: {
      "click @ui.removeBtn": "_onRemoveBtnClick",
      "keyup @ui.removeBtn": "_onRemoveBtnKeydown",
      "focus @ui.removeBtn": "_onButtonFocus",
      "focusout @ui.removeBtn": "_onButtonFocusOut"
    },
    constructor: function LinkDocumentRelationItemView(options) {
      this.wizard = options.wizard;
      this.parent = options.parent;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change:node", this._onNodeChange);
    },
    onRender: function() {
      if (this.model.get("node")) {
        this.$el.removeClass("binf-hidden");
      } else {
        this.$el.addClass("binf-hidden");
      }
    },
    templateHelpers: function() {
      var objectIcon = "";
      var objectName = "";
      if (this.model.has("node") && this.model.get("node")) {
        objectIcon = NodeSpritesCollection.findByNode(this.model.get("node")).get("className");
        objectName = this.model.get("node").get("name");
      }
      return {
        objectIcon: objectIcon,
        objectName: objectName,
        removeToolTip: lang.removeToolTip
      };
    },
    _onNodeChange: function(model, node) {
      this.render();
      if (node) {
        this.parent.trigger("link:document:item:added", node);
      } else {
        this.parent.trigger("link:document:item:removed", node);
      }
    },
    _onButtonFocus: function() {
      this.$el.addClass("focus");
    },
    _onButtonFocusOut: function() {
      this.$el.removeClass("focus");
    },
    _onRemoveBtnClick: _.throttle(function() {
      this.trigger("link:document:remove", this.model);
    }, 100),
    _onRemoveBtnKeydown: _.throttle(function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.trigger("link:document:remove", this.model);
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, 100)
  });
  return LinkDocumentRelationItemView;
});