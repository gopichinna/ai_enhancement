/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/controls/dialog/dialog.view", "csui/utils/base", "csui/utils/nodesprites", "i18n!csui/controls/zipanddownload/impl/nls/lang", "csui/models/node/node.model", "csui/utils/accessibility", "csui/controls/zipanddownload/impl/dialog.header/dialog.header.view", "hbs!csui/controls/zipanddownload/impl/download.dialog/impl/download.dialog", "css!csui/controls/zipanddownload/impl/download.dialog/impl/download.dialog" ], function($, _, DialogView, base, NodeSprites, lang, NodeModel, Accessibility, DialogHeaderView, template) {
  var DownloadDialogView = DialogView.extend({
    className: "csui-zipanddownload-dialog csui-download-dialog",
    template: template,
    templateHelpers: function() {
      var jobs = this.options.model, unprocessedItemsSize = this.options.model.get("unprocessed_items_list") && this.options.model.get("unprocessed_items_list").length, alertMsgId = _.uniqueId("msg"), nameErrorId = _.uniqueId("err");
      if (this.options.model.get("unprocessed_items_list")) {
        this.options.model.get("unprocessed_items_list").map(function(skippedModel) {
          skippedModel.mimeIcon = NodeSprites.findClassByNode(new NodeModel({
            id: skippedModel.id,
            container: skippedModel.container,
            mime_type: skippedModel.mimetype,
            type: skippedModel.subtype
          }));
        });
      }
      if (unprocessedItemsSize && unprocessedItemsSize > 0) {
        this.describedBy = alertMsgId;
      }
      return {
        inputId: _.uniqueId("input"),
        alertMsgId: alertMsgId,
        nameErrorId: nameErrorId,
        skipped: jobs.get("total_skipped"),
        skippedTypes: jobs.get("unprocessed_items_list"),
        supported: jobs.get("total_supported"),
        size: base.formatFriendlyFileSize(jobs.get("total_supported_size")),
        fileName: this.options.model.get("name"),
        zipFileName: lang.zipFileName,
        labelType: lang.labelType,
        labelName: lang.labelName,
        labelLocation: lang.labelLocation,
        labelMessage: lang.labelMessage,
        skippedItemsLabel: _.str.sformat(unprocessedItemsSize === 1 ? lang.skippedItemLabel : lang.skippedItemsLabel, unprocessedItemsSize)
      };
    },
    ui: _.extend({
      fileName: "input[name=download-name]",
      errorEl: ".csui-archive-name-error"
    }, DialogView.prototype.ui),
    events: _.extend({
      "keypress @ui.fileName": "downloadArchive",
      "focusin @ui.fileName": "onFocusInFileName",
      keyup: "onKeyInView"
    }, DialogView.prototype.events),
    constructor: function DownloadDialogView(options) {
      options || (options = {});
      options.dialogTxtAria = lang.downloadDialogTitle;
      this.noTabablesBehavior = true;
      options.headerView = this._createDownloadHeaderView(options);
      DialogView.prototype.constructor.call(this, options);
    },
    _createDownloadHeaderView: function(options) {
      return new DialogHeaderView({
        title: lang.downloadDialogTitle,
        describedBy: "download-zip-file",
        source: "downloadZip",
        itemsCount: options.model?.get("total"),
        size: options.model?.get("total_size")
      });
    },
    downloadArchive: function(e) {
      if (e.type === "keypress" && e.keyCode === 13) {
        e.preventDefault();
        var downloadBtn = this.$el.find("#zipDownload").first();
        if (downloadBtn.length && !downloadBtn.is(":disabled")) {
          downloadBtn.trigger("click");
        }
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27 && !event.isDefaultPrevented()) {
        event.stopPropagation();
        this.destroy();
      }
      if (event.keyCode === 9) {
        if (this.$el.is(document.activeElement)) {
          var ele = event.shiftKey ? this.getActiveRegion(true) : this.getActiveRegion();
          $(ele).trigger("focus");
          event.stopPropagation();
        }
      }
    },
    getActiveRegion: function(last) {
      var tabElements = this.$el.find("*[tabindex=0]:not(:disabled):visible, input");
      if (last && tabElements.length) {
        return tabElements[tabElements.length - 1];
      } else {
        return tabElements.length && tabElements[0];
      }
    },
    onFocusInFileName: function(event) {
      if (Accessibility.isAccessibleMode()) {
        return;
      }
      var currentInputElement = $(event.target)[0], currentInputElementVal = currentInputElement.value, selEnd = !!currentInputElementVal ? currentInputElementVal.length : 0;
      if (currentInputElementVal.lastIndexOf(".") > 0 && currentInputElementVal.lastIndexOf(".") < currentInputElementVal.length - 1) {
        selEnd = currentInputElementVal.lastIndexOf(".");
      }
      currentInputElement.selectionEnd = selEnd;
    }
  });
  return DownloadDialogView;
});