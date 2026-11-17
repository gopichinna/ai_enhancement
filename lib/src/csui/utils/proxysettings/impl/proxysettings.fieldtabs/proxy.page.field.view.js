/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/lib/backbone", "csui/controls/progressblocker/blocker", "csui/controls/globalmessage/globalmessage", "csui/utils/command.error", "csui/utils/contexts/factories/user", "csui/utils/proxy", "csui/models/form", "csui/controls/form/form.view", "csui/utils/proxysettings/impl/proxysettings.fieldtabs/proxy.collection.view", "csui/utils/proxysettings/impl/proxysettings.fieldtabs/workflow.proxy.item.view", "i18n!csui/utils/proxysettings/impl/nls/lang", "hbs!csui/utils/proxysettings/impl/proxy.field", "css!csui/utils/proxysettings/impl/proxysettingstab" ], function($, _, Marionette, Backbone, BlockingView, GlobalMessage, CommandError, UserModelFactory, Proxy, FormModel, FormView, ProxyCollectionView, WorkflowProxyView, lang, Template) {
  "use strict";
  var ProxyFieldView = Marionette.ItemView.extend({
    className: "proxy-settings-field-view",
    template: Template,
    templateHelpers: function() {
      return {
        addUser: lang.addUser,
        addWorkflowUserAria: lang.addWorkflowUserAria,
        save: lang.save,
        cancel: lang.cancel,
        workflow: lang.workflow,
        fullAccess: lang.fullAccess,
        addFullAccessUserAria: lang.addFullAccessUserAria,
        emptyProxy: lang.emptyProxy,
        emptyDelegate: lang.emptyDelegate,
        workflowInfo: lang.workflowInfo,
        proxyInfo: lang.proxyInfo
      };
    },
    events: {
      "click .btn-add-proxy": "onCreateProxy",
      "click .proxy-container .btn-save-proxy:not(.disabled)": "onAddProxy",
      "click .proxy-container .btn-cancel-proxy": "onCancelProxyCreate",
      "click .workflow-proxy-container .btn-save-proxy:not(.disabled)": "onAddWorkflowProxy",
      "click .workflow-proxy-container .btn-cancel-proxy": "onCancelWorkflowProxyCreate",
      "click .btn-add-workflow-proxy": "onCreateWorkflowProxy",
      "focusin .proxy-container .proxy-tooltip-btn": "onProxyTooltip",
      "focusin .workflow-proxy-container .workflow-tooltip-btn": "onWorkflowTooltip",
      "focusout .proxy-container .proxy-tooltip-btn": "onProxyTooltipOut",
      "focusout .workflow-proxy-container .workflow-tooltip-btn": "onWorkflowTooltipOut"
    },
    ui: {
      newFormConatiner: ".proxy-container .add-proxy-form-container",
      newWorkflowFormContainer: ".workflow-proxy-container .add-proxy-form-container",
      newWorkflowProxyContainer: ".workflow-proxy-container .add-proxy-form",
      newProxyContainer: ".proxy-container .add-proxy-form",
      addButton: ".proxy-container .add-button-group",
      addWorkflowButton: ".workflow-proxy-container .add-button-group",
      proxyList: ".proxy-list",
      workflowProxyList: ".workflow-proxy-list",
      proxyContainer: ".proxy-container",
      workflowContiner: ".workflow-proxy-container",
      emptyWFProxy: ".workflow-proxy-container .empty-proxy",
      emptyProxy: ".proxy-container .empty-proxy",
      proxyTooltipBtn: ".proxy-container .proxy-tooltip-btn",
      workflowTooltipBtn: ".workflow-proxy-container .workflow-tooltip-btn",
      proxyTooltip: ".proxy-container .binf-popover",
      workflowTooltip: ".workflow-proxy-container .binf-popover"
    },
    constructor: function(options) {
      options || (options = {});
      Marionette.ItemView.call(this, options);
      BlockingView.imbue(this);
      this.user = this.options.authUser || this.options.context.getModel(UserModelFactory);
      this.options.userid = this.user.get("id");
      this.restrictProxyAccess = this.user.get("privilege_user_admin_rights") || this.user.get("privilege_system_admin_rights") || this.user.get("privilege_content_manager") || this.user.get("privilege_grant_discovery");
    },
    getRawFormsData: function() {
      return {
        data: {
          user: "",
          timePeriod: false,
          start: "",
          end: ""
        },
        options: {
          fields: {
            user: {
              hidden: false,
              label: this.restrictProxyAccess ? lang.workflowProxyUser : lang.user,
              type: "otcs_user_picker",
              fieldClass: "new-proxy-user-field"
            },
            timePeriod: {
              hidden: this.isWorkflowProxy,
              label: lang.limitTime,
              type: "checkboxV2",
              fieldClass: "timePeriodCheck user-proxy-field"
            },
            start: {
              hidden: this.isWorkflowProxy,
              label: lang.from,
              type: "date",
              fieldClass: "timePeriod user-proxy-field"
            },
            end: {
              hidden: this.isWorkflowProxy,
              label: lang.to,
              type: "date",
              fieldClass: "timePeriod user-proxy-field"
            }
          }
        },
        schema: {
          properties: {
            user: {
              readonly: false,
              required: true,
              type: "otcs_user_picker",
              title: lang.user
            },
            timePeriod: {
              readonly: false,
              required: false,
              type: "checkboxV2",
              title: lang.limitTime
            },
            start: {
              readonly: false,
              required: false,
              type: "date",
              title: lang.from
            },
            end: {
              readonly: false,
              required: false,
              type: "date",
              title: lang.to
            }
          },
          type: "object"
        }
      };
    },
    onRender: function() {
      if (this.restrictProxyAccess || !Proxy.enabled() || !!this.user.get("proxy_proxy_user_id")) {
        this.ui.proxyContainer.addClass("binf-hidden");
      } else {
        this.getUserProxies();
      }
      this.getWorkflowProxy();
    },
    onProxyTooltip: function(e) {
      this.ui.proxyTooltip.removeClass("binf-hidden");
      this.ui.proxyTooltip.css({
        top: $(e.target).position().top + $(e.target).height() / 2 - $(this.ui.proxyTooltip).height() / 2,
        left: $(e.target).position().left + $(e.target).width() + 16
      });
    },
    onWorkflowTooltip: function(e) {
      this.ui.workflowTooltip.removeClass("binf-hidden");
      this.ui.workflowTooltip.css({
        top: $(e.target).position().top + $(e.target).height() / 2 - $(this.ui.workflowTooltip).height() / 2,
        left: $(e.target).position().left + $(e.target).width() + 16
      });
    },
    onProxyTooltipOut: function() {
      this.ui.proxyTooltip.addClass("binf-hidden");
    },
    onWorkflowTooltipOut: function() {
      this.ui.workflowTooltip.addClass("binf-hidden");
    },
    onCreateWorkflowProxy: function() {
      this.isWorkflowProxy = true;
      this.onCreateProxy();
      this.isWorkflowProxy = false;
    },
    onCreateProxy: function() {
      var self = this, usedRegion, usedFormView, usedContainer = this.isWorkflowProxy ? this.ui.newWorkflowFormContainer : this.ui.newFormConatiner, usedRegionContainer = this.isWorkflowProxy ? this.ui.newWorkflowProxyContainer : this.ui.newProxyContainer, usedButton = this.isWorkflowProxy ? this.ui.addWorkflowButton : this.ui.addButton;
      var formModel = new FormModel(this.getRawFormsData());
      if (this.isWorkflowProxy) {
        if (this.newWorkflowProxyRegion != null) {
          this.newWorkflowFormView.destroy();
          this.newWorkflowProxyRegion.destroy();
        }
        this.newWorkflowProxyRegion = new Marionette.Region({
          el: usedRegionContainer
        });
        this.newWorkflowFormView = new FormView({
          context: this.options.context,
          model: formModel,
          mode: "create"
        });
        usedFormView = this.newWorkflowFormView;
        usedRegion = this.newWorkflowProxyRegion;
        this.listenTo(this.newWorkflowFormView, "change:field", function(event) {
          var values = this.newWorkflowFormView.getValues();
          if (values.user) {
            this.$el.find(".workflow-proxy-container .btn-save-proxy").removeClass("disabled");
          }
        });
      } else {
        if (this.newProxyRegion != null) {
          this.newFormView.destroy();
          this.newProxyRegion.destroy();
        }
        this.newProxyRegion = new Marionette.Region({
          el: usedRegionContainer
        });
        this.newFormView = new FormView({
          context: this.options.context,
          model: formModel,
          mode: "create"
        });
        usedFormView = this.newFormView;
        usedRegion = this.newProxyRegion;
        this.listenTo(this.newFormView, "change:field", function(event) {
          var values = this.newFormView.getValues();
          if (event.name === "timePeriod") {
            this.onTimePeriodToggle(event);
          }
          var timeChecked = this.newFormView.model.get("timePeriod");
          if (values.user && !timeChecked || values.user && timeChecked && values.start !== null && values.start !== "" && values.end !== null && values.end !== "") {
            this.$el.find(".proxy-container .btn-save-proxy").removeClass("disabled");
          } else {
            this.$el.find(".proxy-container .btn-save-proxy").addClass("disabled");
          }
        });
      }
      usedContainer.removeClass("binf-hidden");
      usedButton.addClass("binf-hidden");
      this.listenTo(usedFormView, "render:form", function() {
        self.$el.find(".new-proxy-user-field input")[0].focus();
        self.$el.find(".timePeriod").addClass("binf-hidden");
        if (this.restrictProxyAccess) {
          this.$el.find(".user-proxy-field").parent().addClass("binf-hidden");
          this.$el.find(".workflow-proxy-check").parent().addClass("binf-hidden");
        }
      });
      usedRegion.show(usedFormView);
    },
    onCancelWorkflowProxyCreate: function() {
      this.$el.find(".workflow-proxy-container .btn-save-proxy").addClass("disabled");
      this.newWorkflowFormView.destroy();
      this.ui.newWorkflowFormContainer.addClass("binf-hidden");
      this.ui.addWorkflowButton.removeClass("binf-hidden");
    },
    onCancelProxyCreate: function() {
      this.$el.find(".proxy-container .btn-save-proxy").addClass("disabled");
      this.newFormView.destroy();
      this.ui.newFormConatiner.addClass("binf-hidden");
      this.ui.addButton.removeClass("binf-hidden");
    },
    getURLv2: function() {
      var url = this.options.connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "members/proxies";
      }
      return url;
    },
    getWorkflowURLv2: function(isGetRequest) {
      var url = this.options.connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "wfproxyuser";
        if (isGetRequest) {
          url += "/" + this.options.userid;
        }
      }
      return url;
    },
    onAddWorkflowProxy: function() {
      this.isWorkflowProxy = true;
      this.onAddProxy();
      this.isWorkflowProxy = false;
    },
    onAddProxy: function() {
      var self = this, values, timeChecked, options;
      if (this.isWorkflowProxy) {
        values = this.newWorkflowFormView.getValues();
        if (!this.newWorkflowFormView.validate()) {
          return;
        }
        options = {
          url: this.getWorkflowURLv2(false),
          method: "POST",
          data: {
            proxy_id: values.user,
            user_id: this.options.userid
          }
        };
      } else {
        values = this.newFormView.getValues();
        if (!this.newFormView.validate()) {
          return;
        }
        timeChecked = this.newFormView.model.get("timePeriod");
        options = {
          url: this.getURLv2(),
          method: "POST",
          data: {
            id: values.user,
            from_date: timeChecked ? values.start : null,
            to_date: timeChecked ? values.end : null
          }
        };
      }
      this.blockActions();
      this.options.connector.makeAjaxCall(options).then(function() {
        self.unblockActions();
        self.render();
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error, self.isWorkflowProxy ? lang.proxyError : lang.delegateError);
      });
    },
    getUserProxies: function() {
      var self = this;
      var options = {
        url: this.getURLv2(),
        method: "GET"
      };
      this.blockActions();
      this.options.connector.makeAjaxCall(options).then(function(response) {
        self.unblockActions();
        self.proxyListRegion = new Marionette.Region({
          el: self.ui.proxyList
        });
        var collection = new Backbone.Collection(response.results.data);
        self.options.collection = collection;
        self.proxyListRegion.show(new ProxyCollectionView(self.options));
        self.listenTo(self.options.collection, "remove", function() {
          if (self.options.collection.length == 0) {
            self.ui.emptyProxy.removeClass("binf-hidden");
          }
        });
        if (response.results.data.length > 0) {
          self.ui.emptyProxy.addClass("binf-hidden");
        } else {
          self.ui.emptyProxy.removeClass("binf-hidden");
        }
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error, lang.delegateError);
      });
    },
    getWorkflowProxy: function() {
      let self = this;
      let options = {
        url: this.getWorkflowURLv2(true),
        method: "GET"
      };
      this.blockActions();
      this.options.connector.makeAjaxCall(options).then(function(response) {
        self.unblockActions();
        self.workflowProxyListRegion = new Marionette.Region({
          el: self.ui.workflowProxyList
        });
        if (!!response.results.forms) {
          let model = new Backbone.Model(response.results.forms[0].data);
          if (model.get("id") !== null && model.get("id") !== 0) {
            self.ui.addWorkflowButton.addClass("binf-hidden");
            self.workflowProxyView = new WorkflowProxyView({
              model: model,
              parentOptions: self.options
            });
            self.listenTo(self.workflowProxyView, "destroy", function() {
              self.ui.addWorkflowButton.removeClass("binf-hidden");
              self.ui.emptyWFProxy.removeClass("binf-hidden");
            });
            self.workflowProxyListRegion.show(self.workflowProxyView);
            self.ui.emptyWFProxy.addClass("binf-hidden");
          } else {
            self.ui.addWorkflowButton.removeClass("binf-hidden");
            self.ui.emptyWFProxy.removeClass("binf-hidden");
          }
        } else {
          self.ui.workflowContiner.addClass("binf-hidden");
        }
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error, lang.proxyError);
      });
    },
    onTimePeriodToggle: function(event) {
      if (event.value) {
        this.$el.find(".timePeriod").removeClass("binf-hidden");
      } else {
        this.$el.find(".timePeriod").addClass("binf-hidden");
      }
      event.model.set({
        timePeriod: event.value
      }, {
        silent: true
      });
    },
    onWorkflowToggle: function(event) {
      if (event.fieldView.curVal) {
        this.$el.find(".user-proxy-field").parent().addClass("binf-hidden");
      } else {
        this.$el.find(".user-proxy-field").parent().removeClass("binf-hidden");
      }
    },
    _showError: function(error, label) {
      var cmdErr = new CommandError(error);
      GlobalMessage.showMessage("error", label, cmdErr.errorDetails || cmdErr.message);
    }
  });
  return ProxyFieldView;
});