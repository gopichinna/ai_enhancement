/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/progressblocker/blocker", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/new.file/link.document/impl/link.document.object.view", "i18n!d2/dialogs/new.file/link.document/impl/nls/lang", "hbs!d2/dialogs/new.file/link.document/impl/link.document", "css!d2/dialogs/new.file/link.document/impl/link.document" ], function(_, $, Backbone, Marionette, base, BlockingView, PerfectScrollingBehavior, WizardTabableRegionBehavior, LinkDocumentObjectView, lang, template) {
  "use strict";
  var LinkDocumentView = Marionette.CompositeView.extend({
    className: "link-document",
    template: template,
    childViewContainer: ".link-document-list-group",
    childView: LinkDocumentObjectView,
    templateHelpers: function() {
      return {
        filesTitle: lang.filesTitle
      };
    },
    childViewOptions: function() {
      return {
        parent: this,
        parentCollection: this.collection,
        wizard: this.options.wizard
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".link-document-list",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    constructor: function LinkDocumentView(options) {
      this.nextButtonDisabled = true;
      this.checkNodeCollection(options);
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "link:document:validate", this.validateLinkDouments);
      if (this.wizard) {
        BlockingView.delegate(this, this.options.wizard);
      } else {
        BlockingView.imbue(this);
      }
    },
    checkNodeCollection: function(options) {
      if (!options.collection) {
        this.createMode = true;
        this.collection = new Backbone.Collection();
        if (options.node) {
          this.collection.add(options.node);
        }
      }
    },
    onRender: function() {
      this.validateLinkDouments();
    },
    getTitle: function() {
      return this.createMode ? lang.linkDocumentCreateTitle : lang.linkDocumentUploadTitle;
    },
    validateLinkDouments: function() {
      var pendingItem = this.collection.detect(function(item) {
        return !item.get("mandatory_document_linked");
      });
      if (pendingItem) {
        this.nextButtonDisabled = true;
      } else {
        this.nextButtonDisabled = false;
      }
      this.options.wizard.refreshFooter();
    }
  });
  return LinkDocumentView;
});