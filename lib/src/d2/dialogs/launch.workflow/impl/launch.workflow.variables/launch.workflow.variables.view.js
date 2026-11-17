/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/models/form", "nuc/lib/moment", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "dctmw/utils/utils", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.variables/launch.workflow.variables", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function(_, Marionette, FormModel, moment, MetadataConverter, D2FormView, utils, formTemplate) {
  "use strict";
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-launch-workflow-general-form-container d2-launch-workflow-general-form";
      return classname;
    },
    formTemplate: formTemplate,
    constructor: function LauchWorkflowVariablesView(options) {
      options || (options = {});
      this._updateOptions(options);
      options.topAlignedLabel = true;
      var dialog = this._createDialogJson(options);
      this.rendered = false;
      this.dialogView = options.groupPanelView || options.dialogView;
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
      return {
        dialog: {
          content: this._creatFormFromNode(options.node)
        }
      };
    },
    _updateOptions: function(options) {
      if (!options.originatingView) {
        options.originatingView = new Marionette.View();
      }
      if (!options.originatingView.isErrorMode) {
        options.originatingView.isErrorMode = function() {
          return false;
        };
      }
    },
    _creatFormFromNode: function(node) {
      var entries = node.get("process-variables-dialog");
      var formData = entries["page-content"]["dialog"]["content"];
      return formData;
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", function() {
        this.validateForm(false).done(function(isValid) {
          this.isValidated = isValid;
          this.refreshButtons();
        }.bind(this));
      }.bind(this));
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.validateForm(false).done(function(isValid) {
          this.isValidated = isValid;
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
        return this.isValidated;
      }
      return false;
    }
  });
});