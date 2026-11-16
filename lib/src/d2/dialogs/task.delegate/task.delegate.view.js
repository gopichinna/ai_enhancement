/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/form", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/form/d2.form.view", "d2/widgets/metadata/utils/form.converter", "d2/utils/task.utils", "css!d2/dialogs/task.delegate/impl/task.delegate" ], function($, _, Backbone, FormModel, WizardTabableRegionBehavior, D2FormView, MetadataConverter, taskUtils) {
  "use strict";
  var TaskDelegateView = D2FormView.extend({
    className: function() {
      return D2FormView.prototype.className.apply(this, arguments) + " task-delegate-form";
    },
    constructor: function TaskDelegateView(options) {
      options || (options = {});
      this.node = options.task;
      var self = this, form = MetadataConverter.convertConfig(options.formContent, {
        actionMode: "create",
        layoutMode: "singleCol",
        extendFieldOptions: function(field) {
          field.getDataSourceCallBack = function(attr, alpField) {
            var dfd = $.Deferred(), fieldOptions = alpField.options.ds, fieldView = alpField.fieldView, filter = fieldOptions && fieldOptions.filter || "";
            self.getUsers(filter, options).done(function(userResponse) {
              if (userResponse["has-more-records"]) {
                fieldView.collection.hasMoreRecords = true;
              } else if (!filter) {
                fieldView.allUserOptions = userResponse.options;
                field.asynchronous = false;
                delete alpField.options.ds;
              }
              self.setUserData(userResponse.userData);
              dfd.resolve(fieldView.allUserOptions || userResponse.options);
            }).fail(dfd.reject);
            return dfd.promise();
          };
        }
      });
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = true;
      options.mode = "create";
      D2FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "valid:field", this._raiseValidChangeEvent);
      this.listenTo(this, "invalid:field", this._raiseInvalidChangeEvent);
      this.listenTo(this, "render", function() {
        if (this.form.childrenByPropertyId["task_delegate_users_note"]) {
          this.form.childrenByPropertyId["task_delegate_users_note"].fieldView.ui.writeField.attr("tabindex", "0");
        }
      }.bind(this));
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    setUserData: function(usersDump) {
      if (!this.userData) {
        this.userData = {};
      }
      _.extend(this.userData, usersDump);
    },
    getUsers: function(filter, options) {
      return taskUtils.getUserForTaskDelegate(options.task, filter, options);
    }
  });
  return TaskDelegateView;
});