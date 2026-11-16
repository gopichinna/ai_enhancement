/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/moment", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/widgets/metadata/general.panels/d2/d2.general.form.model", "d2/widgets/metadata/metadata.properties.view", "d2/widgets/metadata/utils/form.converter", "dctmw/utils/utils", "i18n!d2/dialogs/launch.workflow/impl/nls/lang", "css!d2/dialogs/launch.workflow/impl/launch.workflow.schedule/launch.workflow.schedule" ], function(_, Backbone, moment, WizardTabableRegionBehavior, D2GeneralFormModel, D2MetadataPropertiesView, MetadataConverter, utils, lang) {
  "use strict";
  return D2MetadataPropertiesView.extend({
    className: function() {
      return D2MetadataPropertiesView.prototype.className.call(this) + " d2-launch-workflow-schedule";
    },
    constructor: function LaunchWorkflowScheduleView(options) {
      options = options || {};
      this.node = options.node;
      this.behaviors = _.extend({}, this.behaviors, {
        WizardTabableRegionBehavior: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      var dialog = this._createDialogJson(), form = MetadataConverter.convertConfig(dialog, {
        actionMode: "create",
        layoutMode: "singleCol"
      }), formarr = [];
      for (var i = 0; i < form.propertiesConfig.length; i++) {
        form.propertiesConfig[i].node = options.node;
        var model = new D2GeneralFormModel(form.propertiesConfig[i]);
        model.get("schema")["initial_invalid"] = true;
        formarr.push(model);
      }
      this.rendered = false;
      var fcollection = new Backbone.Collection(formarr);
      fcollection.fetched = true;
      this.form = form;
      options.action = "create";
      options.collection = fcollection;
      options.formMode = "create";
      D2MetadataPropertiesView.prototype.constructor.call(this, options);
      this.keyboardBehavior.destroy();
      this.listenTo(this, "render:forms", this.onRenderValidation).listenTo(this, "d2:metadata:formValidation", this.refreshButtons);
    },
    refreshButtons: function() {
      this.validateAllForms(false).done(function(isValid) {
        this.isFormValid = isValid;
        this.options.wizard.refreshFooter();
        this.options.wizard.refreshHeader();
      }.bind(this));
    },
    setErrorMode: function() {},
    onRender: function() {
      if (utils.isMobile()) {
        this.$el.addClass("d2mobile-properties-wrapper");
        this.$el.find("div[role=tabpanel]").addClass("d2mobile-tabpanel d2mobile-tabpanel-edit");
      }
      D2MetadataPropertiesView.prototype.onRender && D2MetadataPropertiesView.prototype.onRender.apply(this, arguments);
    },
    onRenderValidation: function() {
      this.triggerMethod("step:rendered");
      this.validateAllForms(false, true).done(function(isValid) {
        this.refreshButtons(isValid);
      }.bind(this));
    },
    isValid: function() {
      return this.isFormValid;
    },
    _updatePropertiesMap: function(map, properties) {
      var me = this;
      _.each(map, function(value, key) {
        if (_.isArray(value)) {
          if (!_.isEmpty(value)) {
            if (!_.isObject(value[0])) {
              properties[key] = value;
            } else {
              _.each(_.keys(value[0]), function(k) {
                properties[k] = _.pluck(value, k);
              });
            }
          } else {
            properties[key] = [];
          }
        } else if (!_.isObject(value)) {
          properties[key] = value;
        } else {
          me._updatePropertiesMap(value, properties);
        }
      });
    },
    updateModelData: function() {
      var map = this.getFormsValues(), properties = {};
      this._updatePropertiesMap(map, properties);
      var workflowLaunchDate = _.isEmpty(properties.workflow_launch_on_date) ? "" : moment(properties.workflow_launch_on_date).toISOString(), workflowFollowUpDate = _.isEmpty(properties.workflow_ended_by_date) ? "" : moment(properties.workflow_ended_by_date).toISOString(), workflowDueDate = _.isEmpty(properties.workflow_due_date) ? "" : moment(properties.workflow_due_date).toISOString(), workflowStartNotification = utils.isMobile() ? !!properties.workflow_start_notification : !!properties.workflow_start_notification.length;
      this.options.node.set("workflow_launch_date", workflowLaunchDate);
      this.options.node.set("workflow_launch_notification", workflowStartNotification);
      this.options.node.set("workflow_follow_up_date", workflowFollowUpDate);
      this.options.node.set("workflow_due_date", workflowDueDate);
    },
    _createDialogJson: function() {
      var form = {
        order: 1,
        tabs: {
          order: 1,
          tab: [ {
            order: 1,
            label: lang.planLabel,
            date: [ {
              order: 1,
              id: "workflow_launch_on_date",
              label: lang.launchOnLabel
            }, {
              order: 3,
              id: "workflow_due_date",
              label: lang.dueLabel
            } ],
            "list-checkbox": {
              order: 2,
              id: "workflow_start_notification",
              o: {
                v: lang.workflowStartNotificationLabel
              }
            }
          }, {
            order: 2,
            label: lang.followUpLabel,
            date: {
              order: 1,
              id: "workflow_ended_by_date",
              label: lang.workflowEndedByNotificationLabel
            }
          } ]
        }
      };
      if (utils.isMobile()) {
        this._updateMobileFormSchema(form);
      }
      if (!this.node.is_launch_in_past_date_enabled) {
        const today = moment().startOf("day").toISOString();
        _.extend(form.tabs.tab[0].date[0], {
          condition_validation: 'getValue(workflow_launch_on_date).isGreaterOrEqualsThan("' + today + '")',
          validation_message: lang.launchDateValidationMessage
        });
        _.extend(form.tabs.tab[1].date, {
          condition_validation: 'getValue(workflow_ended_by_date).isGreaterOrEqualsThan("' + today + '")',
          validation_message: lang.followUpDateValidationMessage
        });
      }
      return {
        dialog: {
          content: form
        }
      };
    },
    _updateMobileFormSchema: function(form) {
      form.tabs.tab[0]["boolean"] = {
        order: 2,
        id: "workflow_start_notification",
        label: lang.workflowStartNotificationLabel,
        selected: true,
        visible: true
      };
      delete form.tabs.tab[0]["list-checkbox"];
    }
  });
});