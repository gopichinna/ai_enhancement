/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!d2/commands/open.plugins/impl/markup.migration/view.template", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/markup.migration/styles" ], function(_, $, Marionette, template, lang) {
  "use strict";
  var markupMigration = Marionette.ItemView.extend({
    className: "markup-migration",
    template: template,
    ui: {
      reload: ".messageBox .reload"
    },
    events: {
      "click @ui.reload": "onClickReload"
    },
    templateHelpers: function() {
      return {
        statusSuccess: this.status === "COMPLETE",
        statusInprogress: this.status === "INPROGRESS",
        statusFailed: this.status === "FAILED",
        isMigrationBannerForBravaGCompare: this.viewerType === "GRAPHICAL_COMPARE",
        isMigrationBannerForBravaViewer: this.viewerType === "BRAVA_VIEWER" || this.viewerType === "CSR_VIEWER",
        text: this.getStatusText(this.status, this.viewerType),
        reloadText: lang.MarkupMigrtionReloadViewer,
        statusTitleUpdateFailed: this.status === "TITLE_UPDATE_FAILED",
        titleUpdateRetryText: lang.MarkupMigrationTitleUpdateRetry
      };
    },
    constructor: function markupMigration(options) {
      this.options = options || {};
      this.status = this.options.status;
      this.viewerType = this.options.viewerType;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    getStatusText: function(status, viewerType) {
      var text = "";
      if (status === "COMPLETE") {
        text = lang.MarkupMigrationComplete;
      } else if (status === "INPROGRESS") {
        text = lang.MarkupMigrationInProgress;
      } else if (viewerType === "GRAPHICAL_COMPARE") {
        text = lang.MarkupMigrationGraphicalCompare;
      } else if (viewerType === "BRAVA_VIEWER") {
        text = _.str.sformat(lang.MarkupMigrationHtmlViewer, "markups");
      } else if (viewerType === "CSR_VIEWER") {
        text = _.str.sformat(lang.MarkupMigrationHtmlViewer, "annotations");
      } else if (status === "TITLE_UPDATE_FAILED") {
        text = lang.MarkupMigrationTitleUpdateFailed;
      } else {
        text = lang.MarkupMigrationFailed;
      }
      return text;
    },
    onClickReload: function() {
      if (this.options.reloadClick) {
        this.options.reloadClick();
      }
    },
    onBeforeDestroy: function() {},
    checkAndDisplayMigrationBanner: function(connector, documentIds, markupMigrationElement, view) {
      var dfd = $.Deferred();
      require([ "d2/commands/open.plugins/impl/iviewer/utils" ], function(iViewerUtils) {
        iViewerUtils.isMarkupMigrationStartedForAny(connector, documentIds).then(function(isMigrated) {
          var region = new Marionette.Region({
            el: markupMigrationElement
          });
          if (isMigrated) {
            $(markupMigrationElement).removeClass("binf-hidden");
            $(markupMigrationElement).addClass("with-migration-status");
            region.show(view);
          } else {
            $(markupMigrationElement).addClass("binf-hidden");
            $(markupMigrationElement).removeClass("with-migration-status");
          }
          dfd.resolve(isMigrated);
        }).fail(function() {
          console.error("Error fetching markup migration status");
          dfd.resolve(true);
        });
      });
      return dfd.promise();
    }
  });
  return markupMigration;
});