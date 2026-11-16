/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/nodesprites", "nuc/models/node/node.model", "d2/utils/constants", "d2/controls/form/fields/d2selectfield.view", "i18n!d2/controls/file.uploader/impl/nls/lang", "hbs!d2/controls/file.uploader/impl/uploaded.file", "css!d2/controls/file.uploader/impl/uploaded.file" ], function(_, $, Backbone, Marionette, base, NodeSpritesCollection, NodeModel, constants, D2SelectField, lang, template) {
  "use strict";
  var UploadedFileView = Marionette.LayoutView.extend({
    template: template,
    constructor: function UploadedFileView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.$el.attr("data-d2-key", this.model.cid);
    },
    regions: {
      selectFileFormatRegion: ".format-menu"
    },
    ui: {
      fileFormat: ".file-format",
      fileIcon: ".file-icon",
      fileFormatValue: ".format-value",
      fileFormatMenu: ".format-menu"
    },
    templateHelpers: function() {
      this.formatIcon = NodeSpritesCollection.findByNode(this.model).get("className");
      this.haveErrorMessage = false;
      this.errorMessage = "";
      if (this.model.attributes.itemState === constants.ItemStates.INVALID_ENDING) {
        this.haveErrorMessage = true;
        this.errorMessage = this.model.attributes.errorMessage;
      }
      return {
        name: this.model.get("name"),
        sizeLabel: lang.size,
        sizeValue: base.formatFriendlyFileSize(this.model.contentFile.size),
        fileFormatLabel: lang.fileFormat,
        fileIcon: this.formatIcon,
        haveErrorMessage: this.haveErrorMessage,
        errorMessage: this.errorMessage
      };
    },
    onRender: function() {
      this.$el.addClass("uploaded-file");
      var self = this;
      var unknownFormat = false;
      var formats = [];
      var fileNameSplit = this.model.get("name").split(".");
      if (fileNameSplit.length > 1) {
        var fileExtn = fileNameSplit.pop().toLowerCase();
        formats = new Backbone.Collection(this.options.parentView.getFileFormats().where({
          dos_extension: fileExtn
        }));
      } else {
        formats = new Backbone.Collection(this.options.parentView.getFileFormats().where({
          name: this.model.attributes.mime_type
        }));
      }
      if (formats.length === 0) {
        formats = this.options.parentView.getFileFormats();
        unknownFormat = true;
      }
      var formatName = "unknown";
      if (this.model.get("aContentType")) {
        formatName = this.model.get("aContentType");
      } else if (!unknownFormat) {
        var defaultFormats = formats.where({
          "is-default": true
        }), mimeFilter;
        if (defaultFormats.length) {
          if (defaultFormats.length === 1) {
            formatName = defaultFormats[0].get("name");
          } else {
            mimeFilter = _.find(defaultFormats, function(format) {
              return format.get("mime_type") === this.model.get("mime_type");
            }.bind(this));
            if (mimeFilter) {
              formatName = mimeFilter.get("name");
            } else {
              formatName = defaultFormats[0].get("name");
            }
          }
        } else {
          mimeFilter = formats.findWhere({
            mime_type: this.model.get("mime_type")
          });
          if (mimeFilter) {
            formatName = mimeFilter.get("name");
          } else {
            formatName = formats.at(0).get("name");
          }
        }
      }
      if (formats.length > 0) {
        if (formats.length === 1 || this.options.model.attributes.itemState === constants.ItemStates.INVALID_ENDING) {
          var singleFormat = formats.at(0);
          this.ui.fileFormatValue.html(singleFormat.get("description"));
          this.ui.fileFormatValue.toggle(true);
          this.ui.fileFormatMenu.toggle(false);
          this._updateNodeFormat(singleFormat);
        } else {
          var format = formats.findWhere({
            name: formatName
          });
          format = self._getFormatForSelect(format);
          this._selectFormat(format);
          var field = new D2SelectField({
            selected: format,
            collection: new Backbone.Collection(),
            datasource: function() {
              return self._getFormatsForSelect(formats);
            }
          });
          this.listenTo(field, "field:changed", this._selectFormat.bind(this));
          this.selectFileFormatRegion.show(field);
          this.ui.fileFormatValue.toggle(false);
          this.ui.fileFormatMenu.toggle(true);
        }
      } else {
        this.ui.fileFormat.toggle(false);
      }
    },
    _getFormatsForSelect: function(formats) {
      var self = this;
      var list = formats.map(function(format) {
        return self._getFormatForSelect(format);
      });
      return new (Backbone.Collection.extend())(list);
    },
    _getFormatForSelect: function(format) {
      var options = {
        id: format.get("name"),
        name: format.get("description"),
        format: format
      };
      return new (Backbone.Model.extend())(options);
    },
    _selectFormat: function(item) {
      this._updateNodeFormat(item.get("format"));
    },
    _updateNodeFormat: function(format) {
      this.model.set("aContentType", format.get("name"));
      this.model.set("a_content_type", format.get("description"));
      this.model.set("mime_type", format.get("mime_type"));
      this._updateFormatIcon();
    },
    _updateFormatIcon: function() {
      var formatIcon = NodeSpritesCollection.findByNode(this.model).get("className");
      if (this.formatIcon && this.formatIcon !== formatIcon) {
        this.ui.fileIcon.removeClass(this.formatIcon);
      }
      this.formatIcon = formatIcon;
      this.ui.fileIcon.addClass(this.formatIcon);
    }
  });
  return UploadedFileView;
});