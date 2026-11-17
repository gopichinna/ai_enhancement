/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/commands", "nuc/models/node/node.model", "csui/controls/progressblocker/blocker", "d2/dialogs/new.file/link.document/impl/link.document.relation.msg.view", "d2/dialogs/new.file/link.document/impl/link.document.relation.item.view", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "i18n!d2/dialogs/new.file/link.document/impl/nls/lang", "hbs!d2/dialogs/new.file/link.document/impl/link.document.relation" ], function(_, $, Backbone, Marionette, base, commands, NodeModel, BlockingView, LinkDocumentRelationMsgView, LinkDocumentRelationItemView, CreationUtils, RestLinkrels, lang, template) {
  "use strict";
  var LinkDocumentRelationView = Marionette.CompositeView.extend({
    className: "link-document-relation binf-hidden",
    template: template,
    childViewContainer: ".link-relation-items",
    childView: LinkDocumentRelationItemView,
    ui: {
      linkRelationBtn: ".link-relation-name",
      linkedRelationLbl: ".linked-relation-name",
      linkRelationMsg: ".link-relation-message",
      mandatoryIcon: ".mandatory-state"
    },
    events: {
      "click @ui.linkRelationBtn": "_addLinkDocument",
      "keyup @ui.linkRelationBtn": "_addLinkDocumentKeydown"
    },
    childEvents: {
      "link:document:remove": "_removeLinkDocument"
    },
    childViewOptions: function() {
      return {
        parent: this,
        parentCollection: this.collection,
        wizard: this.options.wizard
      };
    },
    constructor: function LinkDocumentRelationView(options) {
      this.wizard = options.wizard;
      this.parent = options.parent;
      this.collection = options.model.get("relation_items");
      this.relationMessageModel = new Backbone.Model();
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.model.set("document_linked", false);
      if (this.parent) {
        BlockingView.delegate(this, this.parent);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this, "link:document:item:added", this._updateButtonOnAdd).listenTo(this, "link:document:item:removed", this._updateButtonOnRemove);
    },
    onRender: function() {
      this.updateRelationMessage();
      this.showRelationMessage();
    },
    templateHelpers: function() {
      return {
        mandatoryClass: this.model.get("required") ? "binf-glyphicon binf-glyphicon-star alpaca-icon-required" : "",
        linkRelationName: lang.linkLabel + " " + this.model.get("relation_name"),
        linkedRelationName: lang.linkedLabel + " " + this.model.get("relation_name")
      };
    },
    _addLinkDocument: _.throttle(function() {
      var targetItem = this.collection.detect(function(item) {
        return !item.has("node");
      });
      this._openLinkDocumentProfile(targetItem);
    }, 100),
    _addLinkDocumentKeydown: _.throttle(function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._addLinkDocument();
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }, 100),
    _openLinkDocumentProfile: function(item) {
      var command = commands.get("D2-CreateLinkedDoc");
      var originatingView = this;
      var status = {
        parentNode: this.parent.model,
        linkConfig: item,
        container: this.wizard.data.container,
        originatingView: originatingView,
        context: this.wizard.data.context
      };
      command.execute(status);
    },
    _getLinkedDocs: function() {
      return this.wizard.data.linkedNodes[this.parent.model.get("id")];
    },
    _removeLinkDocument: function(itemView, model) {
      var node = model.get("node");
      this.wizard.data.linkedNodes[this.parent.model.get("id")] = _.reject(this._getLinkedDocs(), function(item) {
        return item.get("id") === node.get("id");
      });
      CreationUtils.finishCreateOperation([ node ], RestLinkrels.ABORT_ACTION);
      model.unset("node");
    },
    _updateButtonOnAdd: function(node) {
      this._getLinkedDocs().push(node);
      var pendingItem = this.collection.detect(function(item) {
        return !item.has("node");
      });
      if (!pendingItem) {
        this.ui.linkRelationBtn.addClass("binf-hidden");
        this.ui.linkedRelationLbl.removeClass("binf-hidden");
        this.ui.linkRelationMsg.addClass("binf-hidden");
        this.model.set("document_linked", true);
        this.parent.trigger("link:document:enable:next");
      } else {
        this.model.set("document_linked", false);
        this.updateRelationMessage(pendingItem);
      }
      this.parent.trigger("link:document:validate");
    },
    _updateButtonOnRemove: function() {
      var pendingItem = this.collection.detect(function(item) {
        return !item.has("node");
      });
      if (pendingItem) {
        this.updateRelationMessage(pendingItem);
        this.ui.linkRelationBtn.removeClass("binf-hidden");
        this.ui.linkedRelationLbl.addClass("binf-hidden");
        this.model.set("document_linked", false);
      }
      this.parent.trigger("link:document:validate");
    },
    updateRelationMessage: function(nextItem) {
      if (!nextItem) {
        nextItem = this.collection.detect(function(item) {
          return !item.has("node");
        });
      }
      var message = "";
      if (nextItem && nextItem.has("message") && nextItem.get("message").trim() && nextItem.get("message").length > 0) {
        message = nextItem.get("message").trim();
        this.ui.linkRelationMsg.removeClass("binf-hidden");
      } else {
        this.ui.linkRelationMsg.addClass("binf-hidden");
      }
      this.relationMessageModel.set("message", message);
    },
    showRelationMessage: function() {
      var linkDocumentRelationMsgView = new LinkDocumentRelationMsgView({
        model: this.relationMessageModel
      });
      var $linkDocumentRelationMsgView = linkDocumentRelationMsgView.render();
      this.ui.linkRelationMsg.html($linkDocumentRelationMsgView.el);
    }
  });
  return LinkDocumentRelationView;
});