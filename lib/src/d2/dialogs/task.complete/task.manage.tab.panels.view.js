/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/tab.panel/tab.links.ext.view", "csui/controls/tab.panel/tab.panel.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/dialogs/task.complete/next.tasks.form.view", "d2/dialogs/task.update.performers/task.update.performer.view", "d2/utils/form.utils", "i18n!d2/dialogs/task.complete/impl/nls/lang", "css!d2/dialogs/task.complete/impl/task.manage.tab.panels" ], function(require, $, _, TabLinkCollectionViewExt, TabPanelView, PerfectScrollingBehavior, NextTasksFormView, TaskUpdatePerformerView, formUtils, lang) {
  "use strict";
  return TabPanelView.extend({
    className: "d2-task-manage-tab-panels smart-tab-panel",
    contentViewOptions: function() {
      return _.extend({
        ignoreFormChange: true,
        supressBehavior: true
      }, this.options);
    },
    constructor: function TaskManageTabPanelView(options) {
      options = options || {};
      this.showPerformersTab = options.showPerformersTab;
      _.defaults(options, {
        tabType: "binf-nav-pills",
        delayTabContent: false,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        tabs: this._buildTabs()
      });
      this.behaviors = _.extend({
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          contentParent: ".binf-tab-content",
          suppressScrollX: true
        }
      }, this.behaviors);
      TabPanelView.prototype.constructor.call(this, options);
      this.keyboardBehavior.destroy();
      !this.showPerformersTab && this.$el.addClass("hide-tab-panel");
      this.listenTo(this, "activate:tab", _.bind(this._resetScroll, this));
    },
    _resetScroll: function() {
      this.$el.find(".binf-tab-content").perfectScrollbar("update");
      this.$el.find(".binf-tab-content").scrollTop(0);
    },
    _buildTabs: function() {
      var tabs = [ {
        contentView: NextTasksFormView,
        name: "next_tasks",
        title: lang.NextTasksTabLabel
      } ];
      if (this.showPerformersTab) {
        tabs.push({
          contentView: TaskUpdatePerformerView,
          name: "task_performers",
          title: lang.TaskPerformersTabLabel
        });
      }
      return tabs;
    },
    onShow: function() {
      _.each(this.tabContent.children._views, function(view) {
        view.$el.removeClass("binf-fade");
        var formView = view.content, reqFieldIds = [], has_required_fields = false, model = formView.model, tabLinkModel = this.tabLinks.collection.findWhere(view.model);
        model.get("schema") && formUtils.jsonObjTraverse(model.get("schema"), "", "required", true, reqFieldIds, "properties", true);
        if (reqFieldIds.length > 0) {
          has_required_fields = true;
        }
        if (model.get("required") !== has_required_fields) {
          model.set({
            required: has_required_fields
          }, {
            silent: true
          });
          tabLinkModel.set({
            required: has_required_fields
          }, {
            silent: true
          });
        }
      }.bind(this));
      this.tabLinks.render();
    },
    validateAllTabs: function() {
      var dfd = $.Deferred(), me = this, promises = [];
      _.each(this.tabContent.children._views, function(view) {
        var promise = $.Deferred();
        promises.push(promise);
        if (view.content instanceof TaskUpdatePerformerView) {
          view.content.onFormFieldValidate({
            refreshState: true,
            validateOnlyRequiredFields: false,
            skipUpdateFooter: true
          }).done(promise.resolve).fail(promise.reject);
        } else {
          promise.resolve();
        }
      });
      $.whenAll.apply($, promises).done(dfd.resolve).fail(dfd.reject).always(function() {
        me.options.wizard.refreshFooter();
      });
      return dfd.promise();
    },
    getAllValues: function() {
      var values = {};
      _.each(this.tabContent.children._views, function(view) {
        if (view.content instanceof TaskUpdatePerformerView) {
          values.performers = view.content.getFormValueMap();
        } else {
          view.content && _.extend(values, view.content.getFormValueMap());
        }
      });
      return values;
    },
    isValid: function() {
      var isValid = this.tabContent;
      isValid && _.each(this.tabContent.children._views, function(view) {
        isValid = isValid && view.content && view.content.isValidForm();
      });
      return isValid;
    }
  });
});