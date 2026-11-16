/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/nodesprites", "dctmw/server.adaptors/converters/node", "d2/controls/behaviors/wizard.tabable.region.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "dctmw/utils/utils", "i18n!d2/dialogs/zipanddownload/impl/nls/lang", "hbs!d2/dialogs/zipanddownload/zip.download.error.list/impl/zip.download.error.layout.view", "css!d2/dialogs/zipanddownload/zip.download.error.list/impl/zip.download.error.layout.view" ], function(_, $, Backbone, Marionette, NodeSpriteCollection, NodeConvertor, WizardTabableRegionBehavior, PerfectScrollingBehavior, utils, lang, template) {
  "use strict";
  var ZipDownloadErrorLayoutLayoutView = Marionette.LayoutView.extend({
    className: "d2-zip-errorlist-layout-view",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".error-items",
        suppressScrollX: true
      },
      TabableRegionBehavior: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {},
    ui: {
      copyIcon: ".d2-validation-copy"
    },
    events: {
      "click @ui.copyIcon": "onClickCopyIcon",
      "keydown @ui.copyIcon": "onKeyupCopyIcon"
    },
    templateHelpers: function() {
      return {
        showCopyIcon: this.showCopyIcon,
        errorNodeItems: this.errorNodeItems,
        showFilesInfo: this.options.warnings.length > 50,
        filesInfoMessage: _.str.sformat(lang.filesInfoMessage, this.tableimit, this.options.warnings.length),
        headerMessage: this.options["file-count"] > 0 ? this.options.warnings.length === 1 ? lang.headerMessageSingleError : lang.headerMessage : lang.allFilesHeaderMessage,
        copyTooltip: lang.copyTooltip
      };
    },
    constructor: function ZipValidationDialogView(options) {
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.tableimit = 50;
      this.errorNodeItems = this.options.warnings.slice(0, this.tableimit);
      this.showCopyIcon = this.options.warnings.length > 5;
      _.each(this.errorNodeItems, function(node) {
        node["mime_type"] = NodeConvertor.getMimeType(node["aContentType"]) || NodeConvertor.getMimeType(node["a_content_type"]);
        node["iconClass"] = NodeSpriteCollection.findClassByNode(new Backbone.Model(node));
        node["message"] = node["rest-error"]["message"];
      });
    },
    _getErrorString: function() {
      return lang.copyToClipboardDataHeader + "\n" + _.map(this.options.warnings, function(errorNode) {
        return _.str.sformat("{0};{1}", errorNode["object_name"], errorNode["rest-error"]["message"]);
      }).join("\r\n");
    },
    onClickCopyIcon: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (!this.ui.copyIcon.hasClass("copied")) {
        if (utils.copyToClipboard(this._getErrorString())) {
          this.ui.copyIcon.addClass("copied");
          this.ui.copyIcon.find("svg").addClass("binf-hidden");
          this.ui.copyIcon.attr("title", lang.copiedTooltip);
          setTimeout(function() {
            this.ui.copyIcon.removeClass("copied");
            this.ui.copyIcon.find("svg").removeClass("binf-hidden");
            this.ui.copyIcon.attr("title", lang.copyTooltip);
          }.bind(this), 2500);
        }
      }
    },
    onKeyupCopyIcon: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickCopyIcon(event);
        break;
      }
    }
  });
  return ZipDownloadErrorLayoutLayoutView;
});