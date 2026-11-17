/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/models/member/member.model", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/progressblocker/blocker", "csui/models/form", "d2/controls/form/d2.form.view", "d2/utils/constants", "d2/widgets/metadata/utils/form.converter", "i18n!d2/widgets/workflow.details/impl/nls/lang", "hbs!d2/widgets/workflow.details/impl/workflow.details.tab", "css!d2/widgets/workflow.details/impl/workflow.details.tab" ], function(_, $, Marionette, UserModel, LayoutViewEventsPropagationMixin, BlockingView, FormModel, D2FormView, constants, MetadataConverter, lang, template) {
  "use strict";
  var WFDetailsFormView = D2FormView.extend({
    constructor: function WFDetailsFormView(options) {
      options || (options = {});
      var node = options.node, form = MetadataConverter.convertConfig({
        dialog: {
          content: {
            order: 1,
            list: {
              id: "workflow_supervisor",
              label: lang.wfDetailsLabelSupervisor,
              field_content_type: "USER_OR_GROUP",
              assistance_type: "custom",
              asynchronous: true,
              o: [ {
                v: node.get("supervisor_name"),
                s: true,
                p: 0
              } ],
              order: 1
            },
            date: {
              id: "r_start_date",
              display_time: true,
              label: lang.wfDetailsLabelStartDate,
              mapping_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
              value_format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
              value: node.get("r_start_date") || "",
              mapping_value: node.get("r_start_date") || "",
              property_type: "date",
              repeating: false,
              order: 2
            }
          }
        }
      }, {
        actionMode: "update",
        layoutMode: "singleCol"
      });
      options.topAlignedLabel = true;
      options.model = new FormModel(form.propertiesConfig[0]);
      options.model.get("schema")["initial_invalid"] = false;
      options.mode = "update";
      options.layoutMode = "singleCol";
      D2FormView.prototype.constructor.call(this, options);
    },
    setUserData: function(usersDump) {
      if (!this.userData) {
        this.userData = {};
      }
      _.extend(this.userData, usersDump);
    }
  });
  var WorkflowDetailsTabView = Marionette.LayoutView.extend({
    className: "d2-workflow-details-tab",
    template: template,
    regions: {
      rgnProperties: "> .d2-workflow-details-tab-content"
    },
    constructor: function WorkflowDetailsTabView(options) {
      options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },
    onRender: function() {
      if (!this.propertiesView) {
        this.propertiesView = new WFDetailsFormView({
          context: this.options.context,
          node: this.options.node
        });
        this.listenTo(this.propertiesView, "render:form", this.trigger.bind(this, "render:complete"));
      }
      var node = this.options.node;
      if (node.has("userData")) {
        this.propertiesView.setUserData(node.get("userData"));
        this.showPropertiesView();
      } else {
        var userModel = new UserModel({
          id: node.get("supervisor_name")
        });
        this.blockActions();
        userModel.fetch().always(function() {
          var id = userModel.get("id"), userData = {};
          userData[id] = _.extend({
            id: id,
            links: userModel.get("links")
          }, userModel.get("properties"));
          this.unblockActions();
          if (!this.isDestroyed) {
            node.set("userData", userData, {
              silent: true
            });
            this.propertiesView.setUserData(userData);
            this.showPropertiesView();
          }
        }.bind(this));
      }
    },
    showPropertiesView: function() {
      this.rgnProperties.show(this.propertiesView);
    },
    onBeforeDestroy: function() {
      this.propertiesView && this.propertiesView.destroy();
    }
  }, {
    enabled: function(options) {
      options = options || {};
      return options.node && options.node.get("type") === constants.Types.WORKFLOW;
    }
  });
  _.extend(WorkflowDetailsTabView.prototype, LayoutViewEventsPropagationMixin);
  return WorkflowDetailsTabView;
});