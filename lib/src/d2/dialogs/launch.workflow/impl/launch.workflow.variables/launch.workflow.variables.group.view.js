/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/form/pub.sub", "csui/controls/progressblocker/blocker", "csui/utils/commands", "smart/dialogs/modal.alert/modal.alert", "d2/dialogs/launch.workflow/impl/launch.workflow.variables/launch.workflow.variables.view", "d2/controls/globalmessage/globalmessage", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/controls/group.panel/group.panel.view", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function($, _, Marionette, Url, TabablesBehavior, PubSub, BlockingView, commands, ModalAlert, LaunchWorkflowVariablesView, GlobalMessage, WizardTabableRegionBehavior, GroupPanelView, lang) {
  "use strict";
  return GroupPanelView.extend({
    className: function() {
      return GroupPanelView.prototype.className + " d2-advanced-search-dialog csui-normal-scrolling";
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    constructor: function LaunchWorkflowVariableGroupView(options) {
      options = options || {};
      this.options = _.defaults(_.omit(options, "model", "collection"), {
        node: options.model,
        taskCollection: options.collection
      });
      options.groups = options.groups || this._buildGroups();
      options.groupData = options.groupData || {};
      _.extend(options.groupData, {
        wizard: options.wizard
      });
      GroupPanelView.prototype.constructor.call(this, options);
      var blockingView = this.options.blockingView || this.options.wizard;
      if (blockingView) {
        BlockingView.delegate(this, blockingView);
      } else {
        BlockingView.imbue(this);
      }
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])"), elToFocus;
        if (tabElements.length) {
          tabElements.prop("tabindex", "-1");
          tabElements = tabElements.not(tabElements.filter(".d2-group-content:not(.group-expanded) *:not(.d2-group-expandCollapse)"));
          tabElements.prop("tabindex", 0);
        }
        if (!!event && event.shiftKey) {
          elToFocus = tabElements[tabElements.length - 1];
        } else {
          elToFocus = tabElements[0];
        }
        if (!event.preventScroll) {
          var elemScrollParent = this.$el;
          var elemTop = $(elToFocus).offset().top, viewportTop = elemScrollParent[0].getBoundingClientRect().top, viewportBottom = elemScrollParent[0].getBoundingClientRect().bottom, isElemVisible = elemTop > viewportTop && elemTop < viewportBottom;
          if (!isElemVisible) {
            var currScrollTop = elemScrollParent.scrollTop();
            elemTop < viewportBottom ? elemScrollParent.scrollTop(currScrollTop + (elemTop - viewportBottom)) : elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
          }
        }
        return elToFocus;
      };
      this.listenTo(this, "d2:group:expand:collapse", function() {
        this.currentlyFocusedElement({
          preventScroll: true
        });
      }.bind(this));
      this.listenTo(this, "group:form:value:changed", this.formValueChanged.bind(this));
      this.listenTo(this, "update:footer", this.updateFooter.bind(this));
    },
    formValueChanged: function(childview) {
      _.each(this.children._views, function(gContentView) {
        if (childview !== gContentView.contentView) {
          gContentView.contentView.trigger("form:value:changed");
        }
      });
    },
    isValid: function() {
      var isValid = true;
      _.each(this.children._views, function(childView) {
        isValid = isValid && childView && childView.getContentView() && childView.getContentView().isValidForm();
      });
      return isValid;
    },
    updateInitialValues: function() {
      _.each(this.children._views, function(childView) {
        childView.getContentView().updateInitialValue();
      });
      this.updateFooter();
    },
    updateFooter: function() {
      this.options.wizard && this.options.wizard.refreshFooter();
    },
    getAllValues: function() {
      var values = {};
      _.each(this.children._views, function(childView) {
        if (childView && childView.getContentView()) {
          _.extend(values, childView.getContentView().getValues());
        }
      });
      return values;
    },
    _buildGroups: function() {
      _.extend(this.options, {
        formType: "save"
      });
      let subTitle = this.options?.node?.get("process-variables-dialog")["page-content"]?.dialog?.content?.tabs?.tab?.label ? this.options?.node?.get("process-variables-dialog")["page-content"]?.dialog?.content?.tabs?.tab?.label : lang.ProcessVariablesSubTitle;
      return [ {
        name: "Variables",
        subtitle: subTitle,
        indicateRequired: true,
        initialExpand: true,
        contentView: LaunchWorkflowVariablesView,
        groupType: "variable",
        contentViewOptions: this.options
      } ];
    },
    isValidForm: function() {
      if (this.rendered) {
        return this.isValid;
      }
      return false;
    },
    updateModelData: function() {
      var processFormValues = this.getAllValues();
      this.options.node.set("process_variables_form", processFormValues.contentProcessVariables);
    }
  });
});