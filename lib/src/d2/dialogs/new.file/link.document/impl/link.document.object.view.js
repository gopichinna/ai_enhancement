/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/nodesprites", "csui/controls/progressblocker/blocker", "d2/utils/creation.utils", "d2/dialogs/new.file/link.document/impl/link.document.relation.view", "i18n!d2/dialogs/new.file/link.document/impl/nls/lang", "hbs!d2/dialogs/new.file/link.document/impl/link.document.object" ], function(_, $, Backbone, Marionette, base, NodeSpritesCollection, BlockingView, CreationUtils, LinkDocumentRelationView, lang, template) {
  "use strict";
  var LinkDocumentObjectView = Marionette.CompositeView.extend({
    className: "link-document-object",
    template: template,
    tagName: "div",
    childViewContainer: ".linked-document-relations",
    childView: LinkDocumentRelationView,
    childViewOptions: function() {
      return {
        parent: this,
        parentCollection: this.collection,
        wizard: this.options.wizard
      };
    },
    constructor: function LinkDocumentObjectView(options) {
      this.parent = options.parent;
      this.wizard = options.wizard;
      options.collection = new Backbone.Collection();
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (this.parent) {
        BlockingView.delegate(this, this.parent);
      } else {
        BlockingView.imbue(this);
      }
      this.collection.on("update", this.render);
      this.listenTo(this, "link:document:enable:next", this.enableNextItemViews).listenTo(this, "link:document:validate", this.checkObjectLinkRelations);
      this._fetchLinkDocumentRelations(this.model);
      if (!_.has(this.wizard.data.linkedNodes, this.model.get("id")) || !this.wizard.data.linkedNodes[this.model.get("id")]) {
        this.wizard.data.linkedNodes[this.model.get("id")] = [];
      }
    },
    templateHelpers: function() {
      this.formatIcon = NodeSpritesCollection.findByNode(this.model).get("className");
      return {
        name: this.model.get("name"),
        objectIcon: this.formatIcon
      };
    },
    onRender: function() {
      this.updateChildViews();
      this.checkObjectLinkRelations();
    },
    checkObjectLinkRelations: function() {
      var pendingItem = this.collection.detect(function(item) {
        return item.get("required") && !item.get("document_linked");
      });
      if (pendingItem) {
        this.model.set("mandatory_document_linked", false);
      } else {
        this.model.set("mandatory_document_linked", true);
      }
      this.parent.trigger("link:document:validate");
    },
    updateChildViews: function() {
      if (this.collection.models && this.collection.models.length > 0) {
        for (var index = 0; index < this.collection.models.length; index++) {
          var item = this.collection.models[index];
          if (!item.get("required")) {
            this.children.findByModel(item).$el.removeClass("binf-hidden");
          } else {
            this.children.findByModel(item).$el.removeClass("binf-hidden");
            break;
          }
        }
      }
    },
    enableNextItemViews: function() {
      if (this.collection.models && this.collection.models.length > 0) {
        for (var index = 0; index < this.collection.models.length; index++) {
          var item = this.collection.models[index];
          if (!item.get("required") || item.get("document_linked")) {
            this.children.findByModel(item).$el.removeClass("binf-hidden");
          } else {
            this.children.findByModel(item).$el.removeClass("binf-hidden");
            break;
          }
        }
      }
    },
    _fetchLinkDocumentRelations: function(nodeModel) {
      if (nodeModel.linkDocConfig) {
        this._updateCollection(nodeModel.linkDocConfig);
      } else {
        this.$el.addClass("binf-hidden");
      }
    },
    _updateCollection: function(linkDocConfig) {
      this.collection = linkDocConfig;
    }
  });
  return LinkDocumentObjectView;
});