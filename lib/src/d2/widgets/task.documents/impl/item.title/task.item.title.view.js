/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/item.title/item.title.view", "csui/utils/commands", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "i18n!d2/widgets/task.documents/impl/nls/lang", "hbs!d2/widgets/task.documents/impl/item.title/task.item.title", "css!d2/widgets/task.documents/impl/item.title/task.item.title" ], function(_, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, CSItemTitleView, commands, taskToolItems, TaskToolItemsMasks, lang, template) {
  "use strict";
  var CustomizedItemTitleView = CSItemTitleView.extend({
    initialize: function() {
      CSItemTitleView.prototype.initialize.apply(this, arguments);
      var origNameTemplateHelper = this.nameView.templateHelpers, me = this;
      this.nameView.templateHelpers = function() {
        var helperOptions = origNameTemplateHelper.apply(this, arguments);
        if (_.isFunction(me.options.fnCustomNameFormatter)) {
          _.extend(helperOptions, {
            name: me.options.fnCustomNameFormatter(this.model)
          });
        }
        return helperOptions;
      };
    }
  });
  var TaskItemTitleView = Marionette.LayoutView.extend({
    className: "d2-task-item-title",
    template: template,
    regions: {
      rgnItemTitleContainer: ".item-title-container"
    },
    ui: {
      backButton: "> .icon-task-go-back"
    },
    events: {
      "click @ui.backButton": "_onBackButtonClick",
      "keyup @ui.backButton": "_onBackButtonKeyUp"
    },
    templateHelpers: function() {
      return {
        showBackButton: this.options.showBackButton,
        tooltipGoBack: this.options.tooltipBackButton || lang.defaultTooltipBackButton
      };
    },
    constructor: function TaskItemTitleView(options) {
      options = options || {};
      options.showBackButton = _.isBoolean(options.showBackButton) ? options.showBackButton : false;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      this._setupDefaultOptions();
      this._setupItemTitleView();
    },
    _setupDefaultOptions: function() {
      _.defaults(this.options, {
        commands: commands,
        toolItems: taskToolItems["detailViewHeaderDropdown"],
        toolItemsMask: new TaskToolItemsMasks(this.options)["detailViewHeaderDropdown"]
      });
    },
    _setupItemTitleView: function() {
      if (!this.itemTitleView) {
        this.itemTitleView = new CustomizedItemTitleView(_.defaults({}, this.options));
      }
    },
    onRender: function() {
      this.itemTitleView && this.rgnItemTitleContainer.show(this.itemTitleView);
    },
    _onBackButtonClick: function(e) {
      this.trigger("click:back", e);
    },
    _onBackButtonKeyUp: function(e) {
      var keyCode = e.keyCode;
      if (keyCode === 32 || keyCode === 13) {
        this._onBackButtonClick(e);
      }
    }
  });
  _.extend(TaskItemTitleView.prototype, LayoutViewEventsPropagationMixin);
  return TaskItemTitleView;
});