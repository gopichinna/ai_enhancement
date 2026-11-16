/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/form", "d2/widgets/metadata/utils/form.converter", "d2/controls/form/d2.form.view", "dctmw/utils/utils", "hbs!d2/dialogs/task.complete/impl/next.tasks.form", "i18n!d2/dialogs/task.complete/impl/nls/lang" ], function(_, $, FormModel, MetadataConverter, D2FormView, utils, formTemplate, lang) {
  "use strict";
  return D2FormView.extend({
    className: function() {
      var classname = D2FormView.prototype.className.call(this);
      classname += " d2-next-tasks-form";
      return classname;
    },
    formTemplate: formTemplate,
    constructor: function NextTasksFormView(options) {
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
      var form = _.extend({
        data: {},
        schema: {},
        options: {}
      }, this.formmodel.propertiesConfig[0]);
      options.model = new FormModel(form);
      options.mode = "create";
      D2FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
    },
    _createDialogJson: function(options) {
      var maxNextTasks = options.maxNextTasks, editable = options.nextTasksEditable, nextTasksData = _.map(options.nextTasks, function(nextTask) {
        return {
          v: nextTask.activity_id,
          l: nextTask.task_subject || nextTask.task_name,
          s: !editable
        };
      }), form;
      if (utils.isMobile()) {
        form = this._createMobileDialogJson({
          taskSubject: options.taskSubject,
          mandatoryComment: options.mandatoryComment,
          nextTasksData: nextTasksData,
          maxNextTasks: maxNextTasks,
          editable: editable,
          task: options.task
        });
      } else {
        form = {
          label: {
            order: 1,
            id: "task_subject",
            label: lang.TaskSubjectLabel,
            value: options.taskSubject
          },
          "list-checkbox": {
            order: 2,
            id: "next_tasks",
            label: nextTasksData.length <= 1 ? lang.NextTaskLabel : lang.NextTasksLabel,
            condition_visible: nextTasksData.length !== 0,
            forceCheckboxList: true,
            condition_required: true,
            singleSelect: maxNextTasks === 1,
            showOnHover: maxNextTasks === 1,
            o: nextTasksData
          },
          memo: {
            order: 3,
            id: "task_note",
            condition_required: options.mandatoryComment,
            condition_visible: !options.task.get("wf_sv_disable_notes"),
            label: lang.NoteLabel,
            disallowOnlyEmptySpaces: true,
            rows: 2,
            isTextareaAutoHeight: true,
            ignoreMaxLength: true
          }
        };
      }
      if (!editable) {
        if (!utils.isMobile()) {
          Object.defineProperty(form, "list", Object.getOwnPropertyDescriptor(form, "list-checkbox"));
          delete form["list-checkbox"];
          _.extend(form["list"], {
            condition_required: false,
            rows: nextTasksData.length
          });
        }
      } else if (maxNextTasks !== 1 && maxNextTasks < nextTasksData.length) {
        var validationJson = {
          condition_validation: _.str.sformat('getValue("next_tasks").value.length <= {0}', maxNextTasks),
          validation_message: _.str.sformat(lang.MaximumNextTasksValidationMessage, maxNextTasks)
        };
        if (!utils.isMobile()) {
          _.extend(form["list-checkbox"], validationJson);
        } else {
          _.extend(form["list"], validationJson);
        }
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    _createMobileDialogJson: function(options) {
      var form = {
        memo: {
          order: 2,
          id: "task_note",
          condition_required: options.mandatoryComment,
          condition_visible: !options.task.get("wf_sv_disable_notes"),
          label: lang.NoteLabel,
          disallowOnlyEmptySpaces: true,
          rows: 2,
          isTextareaAutoHeight: true,
          ignoreMaxLength: true
        }
      };
      if (!options.editable) {
        _.extend(form, {
          list: {
            order: 1,
            id: "next_tasks",
            rows: options.nextTasksData.length,
            condition_visible: options.nextTasksData.length > 0,
            label: options.nextTasksData.length <= 1 ? lang.NextTaskLabel : lang.NextTasksLabel,
            o: options.nextTasksData
          }
        });
      } else if (options.maxNextTasks === 1) {
        _.extend(form, {
          combo: {
            order: 1,
            id: "next_tasks",
            label: options.nextTasksData.length <= 1 ? lang.NextTaskLabel : lang.NextTasksLabel,
            condition_required: true,
            autoselect_single: true,
            o: options.nextTasksData
          }
        });
      } else if (options.maxNextTasks > 1) {
        _.extend(form, {
          list: {
            order: 1,
            id: "next_tasks",
            isAutoSelectSingle: true,
            removeDefaultNone: true,
            condition_required: true,
            maxSelection: options.maxNextTasks,
            label: options.nextTasksData.length <= 1 ? lang.NextTaskLabel : lang.NextTasksLabel,
            o: options.nextTasksData
          }
        });
      }
      return form;
    },
    _modifyModel: function() {
      D2FormView.prototype._modifyModel.call(this);
      if (this.alpaca.options.fields["next_tasks"] && this.alpaca.options.fields["next_tasks"].type === "d2list" && !this.options.nextTasksEditable) {
        _.extend(this.alpaca.options.fields["next_tasks"], {
          readonly: true,
          mode: "readonly"
        });
        this.alpaca.schema.properties["next_tasks"].readonly = true;
      }
    },
    onD2ChangeFormValidationListeners: function() {
      var me = this;
      this.validateForm(false, true).done(function(isValid) {
        me.isValid = isValid;
        me.refreshButtons();
      });
    },
    onShow: function() {
      this.listenTo(this, "d2:change:formValidation", this.onD2ChangeFormValidationListeners);
      this.listenTo(this, "render:form", function() {
        this.rendered = true;
        this.form.hideInitValidationError = true;
        this.form.refreshValidationState(true, function() {
          this.validateForm(false, true).done(function(isValid) {
            this.isValid = isValid;
            this.refreshButtons();
          }.bind(this));
        }.bind(this));
      }.bind(this));
      if (this.isRenderFinished()) {
        this.rendered = true;
        this.validateForm(false, true).done(function(isValid) {
          this.isValid = isValid;
          this.refreshButtons();
        }.bind(this));
      }
    },
    refreshButtons: function() {
      if (this.dialogView && this.dialogView.options.wizard) {
        this.dialogView.options.wizard.refreshFooter([ "next" ]);
      }
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
      return false;
    },
    getFormValueMap: function() {
      return this.getValues();
    }
  });
});