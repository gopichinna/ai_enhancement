/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/lib/alpaca/js/alpaca.lite", "csui/controls/form/fields/base/csformfield.view", "hbs!d2/controls/form/impl/d2singleselecttree/d2singleselecttreefield", "i18n!d2/controls/form/impl/nls/lang", "css!d2/controls/form/impl/d2singleselecttree/d2singleselecttreefield" ], function(require, $, _, Alpaca, FormFieldView, template, lang) {
  "use strcit";
  return FormFieldView.extend({
    className: function() {
      return FormFieldView.prototype.className + " d2-singleselecttreefield";
    },
    template: template,
    templateHelpers: function() {
      var templateData = {
        browseTitle: this.alpacaField && this.alpacaField.options && this.alpacaField.options.browseTooltip || lang.browseTooltip,
        enabled: !this.alpacaField.schema.disabled
      };
      if (this.alpacaField.data && this.alpacaField.data.tooltip) {
        templateData["tooltip"] = this.alpacaField.data.tooltip;
      }
      return _.extend(FormFieldView.prototype.templateHelpers.apply(this), templateData);
    },
    ui: _.extend(FormFieldView.prototype.ui || {}, {
      openDialog: ".icon-select-dialog"
    }),
    events: _.extend(FormFieldView.prototype.events || {}, {
      "click @ui.openDialog": "onClickOpenSelectDialog",
      "keyup @ui.openDialog": "onKeyUpOpenSelectDialog"
    }),
    constructor: function D2SingleSelectTreeFieldView(options) {
      if (options.model && options.model.get("data")) {
        options.model.set("origData", _.clone(options.model.get("data")), {
          silent: true
        });
        options.model.set("data", options.model.get("data").title, {
          silent: true
        });
      }
      FormFieldView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "render disable:field", _.bind(function() {
        if (this.alpacaField && this.alpacaField.schema && !this.alpacaField.schema.disabled && this.ui.writeField) {
          this.ui.writeField.attr("readonly", true);
        }
      }, this));
    },
    getValue: function() {
      return this.model.get("origData") && _.clone(this.model.get("origData"));
    },
    setValue: function(value, validate, silent) {
      if (_.isObject(value)) {
        this.model.set("origData", _.clone(value), {
          silent: true
        });
        value = value.title;
      }
      this.ui.writeField.val(value);
      if (this.model.get("origData")) {
        this.ui.writeField.attr("title", this.model.get("origData").path);
      }
      FormFieldView.prototype.setValue.call(this, value, validate, silent);
    },
    onKeyUpOpenSelectDialog: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.onClickOpenSelectDialog(event);
        break;
      }
    },
    onClickOpenSelectDialog: _.throttle(function(event) {
      var me = this;
      if (me.isOpenDialogButtonDisabled()) {
        return;
      }
      me.disableOpenDialogButton();
      me.hideCustomErrorMsg();
      me.alpacaField.options.treeDataSource().done(function(sourceData) {
        require([ "d2/dialogs/single.selection.tree/single.select.tree" ], function(SingleSelectTreeDialog) {
          me.selectDialog = new SingleSelectTreeDialog({
            data: sourceData,
            enableAddChild: true,
            createAddChildForm: me.alpacaField.options.createAddChildForm,
            context: me.alpacaField.connector.config.context
          });
          me.selectDialog.show().done(function(selectedNode) {
            me.setValue(_.extend({
              key: selectedNode.key,
              title: selectedNode.title,
              tooltip: selectedNode.tooltip,
              icon: selectedNode.icon
            }, selectedNode.data));
          }).always(function() {
            me.setFocus();
          });
        });
      }).fail(function(error) {
        this.showCustomErrorMsg(error.message);
      }).always(function() {
        me.enableOpenDialogButton();
      });
      event.stopPropagation();
      event.preventDefault();
    }, 500, {
      trailing: false
    }),
    showCustomErrorMsg: function(errorMsg) {
      var messageTemplateDescriptor = this.alpacaField.view.getTemplateDescriptor("message"), customErrorMessageEl = Alpaca.tmpl(messageTemplateDescriptor, {
        id: "userErrorMessage",
        message: errorMsg,
        view: this.alpacaField.view
      });
      customErrorMessageEl.addClass("d2-single-select-tree-error-message").attr("role", "alert");
      this.$el.find(".cs-field-write").append(customErrorMessageEl);
    },
    hideCustomErrorMsg: function() {
      this.$el.find(".cs-field-write").find(".d2-single-select-tree-error-message").remove();
    },
    disableOpenDialogButton: function() {
      this.ui.openDialog.attr("disabled", true);
    },
    enableOpenDialogButton: function() {
      this.ui.openDialog.removeAttr("disabled");
    },
    isOpenDialogButtonDisabled: function() {
      return !!this.ui.openDialog.attr("disabled");
    }
  });
});