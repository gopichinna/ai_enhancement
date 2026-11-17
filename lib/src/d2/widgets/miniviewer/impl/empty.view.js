/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/commands", "nuc/models/nodes", "i18n!d2/widgets/miniviewer/impl/nls/lang", "hbs!d2/widgets/miniviewer/impl/emptyview", "css!d2/widgets/miniviewer/impl/emptyview" ], function(_, $, Backbone, Marionette, commands, NodeCollection, lang, template) {
  "use strict";
  var EmptyView = Marionette.ItemView.extend({
    className: "d2-empty-view",
    template: template,
    events: {
      "click .btn-close-viewer": "_onClickClose",
      "keyup .btn-close-viewer": "_onKeyUp",
      "click otc-button": "_noPreviewDownload"
    },
    constructor: function EmptyView(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        iconClass: this.options.iconClass,
        message: this.options.message,
        closeBtnTitle: lang.labelCloseViewer,
        showCloseButton: !this.options.hideCloseButton,
        showDownloadButton: this.options.showDownloadButton
      };
    },
    _onClickClose: function(e) {
      e && e.stopPropagation();
      this.trigger("viewer:close", e);
    },
    _onKeyUp: function(e) {
      if (e && (e.keyCode === 13 || e.keyCode === 32)) {
        this._onClickClose(e);
      }
    },
    _noPreviewDownload: function() {
      this.cmdInstance = commands.findWhere({
        signature: "Download"
      });
      const cmdStatus = {
        context: this.options.context,
        container: this.options.node.parent,
        nodes: new NodeCollection([ this.options.node ])
      };
      if (this.cmdInstance && this.cmdInstance.enabled(cmdStatus)) {
        this.cmdInstance.execute(cmdStatus);
      }
    }
  });
  return EmptyView;
});