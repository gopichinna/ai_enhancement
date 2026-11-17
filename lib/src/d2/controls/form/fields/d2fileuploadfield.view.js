/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/fields/base/csformfield.view", "dctmw/dialogs/file.open/file.open.dialog", "csui/controls/form/pub.sub", "dctmw/utils/utils", "d2/utils/constants", "d2/ctf/ctfBridge", "d2/ctf/utils", "i18n!csui/controls/form/impl/nls/lang", "i18n!d2/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2fileupload/d2fileupload", "css!d2/controls/form/impl/d2fileupload/d2fileupload" ], function(require, _, $, Backbone, Marionette, FormFieldView, FileOpenDialog, PubSub, utils, constants, ctfBridge, ctfUtils, lang, d2lang, template) {
  "use strict";
  var FileUploadView = FormFieldView.extend({
    constructor: function FileUploadView() {
      FormFieldView.apply(this, arguments);
      this._isReadyToSave = false;
      this.files = this.curVal;
      this.setMode();
      this.setIconClass();
      this.listenTo(this.model, "change", function() {
        this.setIconClass();
        this.render();
      }, this);
    },
    className: "cs-formfield d2-fileupload-field",
    ui: {
      readArea: ".cs-field-read",
      readField: ".cs-field-read button",
      writeArea: ".cs-field-write",
      writeField: ".cs-field-write input",
      fileopen: ".d2-icon-fileupload-browse",
      clear: ".d2-icon-fileupload-clear"
    },
    events: {
      "click @ui.fileopen": "onFileOpenBtnClicked",
      "click @ui.clear": "onFileClearClicked",
      "keydown @ui.fileopen": "onFileBtnKeydown",
      "keydown @ui.clear": "onFileBtnKeydown",
      keydown: "onKeyInView"
    },
    onRender: function() {
      var me = this;
      this.alpacaField && this.alpacaField.setValue(this.getDisplayValue());
      setTimeout(function() {
        me.ui.writeField.attr("readonly", true);
      });
    },
    setMode: function() {
      this.mode = this.options.mode;
      this.mode = this.options.alpaca && this.options.alpaca.schema.readonly ? "readonly" : "read";
      if (this.options.alpaca) {
        if (this.options.alpaca.options.setRequiredFieldsEditable && this.mode !== "readonly") {
          this.mode = "writeonly";
        }
      }
    },
    setIconClass: function() {
      this.iconclass = this.model.get("data") ? "d2-icon-fileupload-clear" : "d2-icon-fileupload-browse";
      this.iconclasstitle = this.model.get("data") ? d2lang.clear : d2lang.browse;
    },
    setValue: function(value) {
      this.model.set("data", value);
    },
    getEditValue: function() {
      this.curVal = this.files;
      return this.curVal;
    },
    getValue: function() {
      return this.curVal;
    },
    trySetValue: function() {
      var bIsValid = true, isReadyToSaveView = this.isReadyToSave();
      if (isReadyToSaveView) {
        bIsValid = this.options.alpacaField.setValueAndValidate(this.getDisplayValue(), true);
      }
      var alpacaFieldEl = this.$el.parents(".binf-form-group.alpaca-field");
      if (bIsValid) {
        alpacaFieldEl.removeClass("binf-has-error alpaca-invalid");
        this.$el.removeClass("cs-formfield-invalid");
      } else {
        alpacaFieldEl.addClass("binf-has-error alpaca-invalid");
        this.$el.addClass("cs-formfield-invalid");
        this.$el.trigger($.Event("field:invalid"));
      }
      return bIsValid;
    },
    createFileSelectorDlg: function() {
      var options = {
        multiple: !!this.options.alpaca.options.multiple,
        directory: !!this.options.alpaca.options.directory
      };
      var fileOpenDialog = new FileOpenDialog(options);
      var me = this;
      this.listenTo(fileOpenDialog, "add:files", function(files) {
        this._isReadyToSave = true;
        this.oldVal = this.files ? this.files : null;
        this.files = files ? files : null;
        this.setValue(files, false);
        this.triggerFocusOnField();
        this.ui.writeField.attr("readonly", true);
        PubSub.trigger([ "fileselectiondlg", "fileselected", me.options.propertyId ].join(":"), files);
        fileOpenDialog.destroy();
      });
      return fileOpenDialog;
    },
    triggerFocusOnField: function() {
      this.ui.writeField.trigger("focus");
    },
    createCtfFileSelectorDlg: function() {
      var me = this, $backdrop = ctfUtils.getBackdropForFileUploader();
      ctfBridge.publishSelectFile(function(filearr) {
        $backdrop.remove();
        if (filearr && filearr[0]) {
          var filePath = filearr[0].file_path, filename = filePath.replace(/^.*[\\\/]/, ""), fileSize = filearr[0].file_size, file;
          try {
            file = new File([ "" ], filename);
            file.path = filePath;
            file.size = fileSize;
          } catch (err) {
            file = {
              name: filename,
              path: filePath,
              size: fileSize
            };
          }
          var files = [ file ];
          me._isReadyToSave = true;
          me.oldVal = me.files ? me.files : null;
          me.files = files ? files : null;
          me.setValue(files, false);
          me.ui.writeField.trigger("focus");
          me.ui.writeField.attr("readonly", true);
          PubSub.trigger([ "fileselectiondlg", "fileselected", me.options.propertyId ].join(":"), files);
        }
      });
    },
    resetOldValueAfterCancel: function() {
      this.model.set("data", this.oldVal);
      this.files = this.oldVal;
      this.model.trigger("change");
      return true;
    },
    onFileOpenBtnClicked: function() {
      if (this.formView.options.clientMode === constants.BrowserPluginMode.WSCTF) {
        PubSub.trigger([ "fileselectiondlg", "opened", this.options.propertyId ].join(":"), this);
        this.createCtfFileSelectorDlg();
      } else {
        var fileOpenDialog = this.createFileSelectorDlg();
        PubSub.trigger([ "fileselectiondlg", "opened", this.options.propertyId ].join(":"), this);
        fileOpenDialog.show();
      }
    },
    onFileClearClicked: function() {
      PubSub.trigger([ "fileselectiondlg", "fileselected", this.options.propertyId ].join(":"), null);
      this.files = null;
      this.setValue(null, false);
      this.triggerFocusOnField();
      this.ui.writeField.attr("readonly", true);
    },
    onFileBtnKeydown: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        $(event.currentTarget).trigger("click");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      switch (keyCode) {
       case 32:
        this.onFileClearClicked();
        break;
      }
    },
    isReadyToSave: function() {
      return this._isReadyToSave;
    },
    setStateWrite: function() {
      if (this.getStatesBehavior().isWriteOnly() || this.getStatesBehavior().isStateWrite()) {
        this.ui.readArea.addClass("binf-hidden");
        this.ui.writeArea.removeClass("binf-hidden");
        this.ui.fileopen.trigger("focus");
      }
      return true;
    },
    getDisplayValue: function() {
      var data = this.model.get("data");
      var label = "";
      if (data && this.options.alpaca.options.directory) {
        var fileItem = data instanceof FileList ? data.item(0) : data[0];
        label = (fileItem.rootDirectory || fileItem.webkitRelativePath || fileItem.path).split("/")[0];
      } else if (data instanceof FileList) {
        label = data.item(0).name;
      } else if (data instanceof File || data && data.name) {
        label = data.name;
      } else if (_.isArray(data) && data.length > 0) {
        label = data[0].name;
      }
      return label;
    },
    allowEditOnEnter: function() {
      return false;
    },
    allowEditOnClickReadArea: function() {
      return false;
    },
    template: template,
    templateHelpers: function() {
      var data = this.model.get("data");
      var label = this.getDisplayValue();
      return {
        writeonlyMode: this.mode === "writeonly",
        iconclass: this.iconclass,
        iconclasstitle: this.iconclasstitle,
        isReadOnly: this.mode === "readonly",
        applyFlag: this.options.model.get("options") ? this.options.model.get("options").applyFlag : undefined,
        schema: this.model.get("schema"),
        emptyLabel: lang.noValueSet,
        hasData: data,
        data: label,
        alpacaPlaceholderFile: lang.alpacaPlaceholderFile,
        cancel: lang.cancel,
        edit: lang.edit
      };
    }
  });
  return FileUploadView;
});