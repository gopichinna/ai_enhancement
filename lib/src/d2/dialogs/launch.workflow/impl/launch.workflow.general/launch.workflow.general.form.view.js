/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/models/form", "nuc/lib/moment", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "dctmw/utils/utils", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general.form", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(_, FormModel, moment, MetadataConverter, D2FormView, utils, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-launch-workflow-general-form";
      return classname;
    },
    formTemplate: formTemplate,
    constructor: function LauchWorkflowGeneralFormView(options) {
      options || (options = {});
      options.originatingView || (options.originatingView = {
        isErrorMode: function() {
          return false;
        }
      });
      options.topAlignedLabel = true;
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      this.dialogView = options.dialogView;
      this.formmodel = MetadataConverter.convertConfig(dialog, {
        actionMode: "create",
        layoutMode: "singleCol"
      });
      options.model = new FormModel(this.formmodel.propertiesConfig[0]);
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    onRender: function() {
      if (utils.isMobile()) {
        this.$el.addClass("d2mobile-tabpanel d2mobile-tabpanel-edit");
      }
      D2FormView.prototype.onRender && D2FormView.prototype.onRender.apply(this, arguments);
    },
    _createDialogJson: function(options) {
      var node = options.node, form = {
        label: {
          order: 1,
          id: "workflow_template",
          label: lang.templateNameLabel,
          value: node.workflow_template
        },
        text: {
          order: 2,
          id: "workflow_name",
          label: lang.workflowNameLabel,
          value: _.str.sformat(lang.workflowNameValue, node.workflow_config_label, new moment().format("D MMM YYYY HH:mm:ss")),
          condition_required: true
        },
        memo: {
          order: 3,
          id: "workflow_note",
          condition_required: false,
          condition_visible: !node.wf_sv_disable_notes,
          label: lang.noteLabel,
          disallowOnlyEmptySpaces: true,
          rows: 2,
          isTextareaAutoHeight: true,
          ignoreMaxLength: true
        }
      };
      return {
        dialog: {
          content: form
        }
      };
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", function() {
        this.validateForm(false).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.validateForm(false).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
    },
    refreshButtons: function() {
      if (this.dialogView && this.dialogView.options.wizard) {
        this.dialogView.options.wizard.refreshFooter();
        this.dialogView.options.wizard.refreshHeader();
      }
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
      return false;
    }
  });
});