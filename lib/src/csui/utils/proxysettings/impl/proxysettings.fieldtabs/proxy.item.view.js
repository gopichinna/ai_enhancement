/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette3", "hbs!csui/utils/proxysettings/impl/proxy.item", "csui/controls/progressblocker/blocker", "csui/controls/globalmessage/globalmessage", "csui/utils/command.error", "csui/models/form", "csui/controls/form/form.view", "i18n!csui/utils/proxysettings/impl/nls/lang", "css!csui/utils/proxysettings/impl/proxysettingstab" ], function(_, $, Marionette, itemTemplate, BlockingView, GlobalMessage, CommandError, FormModel, FormView, lang) {
  var ProxyItemView = Marionette.View.extend({
    className: "proxy-item",
    events: {
      "mouseover .proxy-user": "onHoverProxyForm",
      "mouseleave .proxy-user": "onBlurProxyForm",
      "focusin .proxy-user": "onHoverProxyForm",
      "focusout .proxy-user": "onBlurProxyForm",
      "click .btn-edit-proxy": "onEditProxy",
      "click .btn-remove-proxy": "onDeleteProxy",
      "click .btn-update-proxy": "onUpdateProxy",
      "click .btn-cancel-update-proxy": "onCancelUpdate"
    },
    template: itemTemplate,
    templateContext: function() {
      return {
        save: lang.save,
        cancel: lang.cancel,
        edit: lang.edit,
        remove: lang.remove,
        removeProxyUserAria: _.str.sformat(lang.removeProxyUserAria, this.model.get("name")),
        editProxyUserAria: _.str.sformat(lang.editProxyUserAria, this.model.get("name"))
      };
    },
    ui: {
      userForm: ".user-form",
      editForm: ".add-proxy-form",
      proxyUserContainer: ".proxy-user",
      updateProxyContainer: ".update-proxy-container",
      proxyActions: ".csui-proxy-actions",
      editButton: ".btn-edit-proxy"
    },
    constructor: function(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
    },
    getRawFormsData: function() {
      return {
        data: {
          user: this.model.get("id"),
          timePeriod: this.model.get("from_date") != null,
          start: this.model.get("from_date"),
          end: this.model.get("to_date")
        },
        options: {
          fields: {
            user: {
              hidden: false,
              label: lang.user,
              type: "otcs_user_picker",
              fieldClass: this.model.get("from_date") != null ? "user-with-timeperiod" : ""
            },
            timePeriod: {
              hidden: !this.isEditMode,
              label: lang.limitTime,
              title: lang.limitTime,
              ariaLabel: lang.limitTime,
              type: "checkboxV2"
            },
            start: {
              hidden: this.model.get("from_date") == null && !this.isEditMode,
              label: lang.from,
              type: "date",
              fieldClass: "proxy-item-timeperiod start-timeperiod"
            },
            end: {
              hidden: this.model.get("to_date") == null && !this.isEditMode,
              label: lang.to,
              type: "date",
              fieldClass: "proxy-item-timeperiod"
            }
          }
        },
        schema: {
          properties: {
            user: {
              readonly: true,
              required: this.isEditMode,
              type: "otcs_user_picker",
              title: lang.user
            },
            timePeriod: {
              readonly: false,
              required: false,
              type: "checkboxV2",
              title: lang.timePeriod
            },
            start: {
              readonly: !this.isEditMode,
              required: false,
              type: "date",
              title: lang.startDate
            },
            end: {
              readonly: !this.isEditMode,
              required: false,
              type: "date",
              title: lang.endDate
            }
          },
          type: "object"
        }
      };
    },
    onRender: function() {
      var formModel = new FormModel(this.getRawFormsData());
      if (this.userFormView != null) {
        this.userFormView.destroy();
      }
      this.userFormView = new FormView({
        context: this.options.parentOptions.context,
        model: formModel,
        mode: this.isEditMode ? "update" : "read"
      });
      if (this.isEditMode) {
        this.ui.proxyUserContainer.addClass("binf-hidden");
        this.ui.updateProxyContainer.removeClass("binf-hidden");
        this.userFormRegion = new Marionette.Region({
          el: this.ui.editForm
        });
      } else {
        this.ui.proxyUserContainer.removeClass("binf-hidden");
        this.ui.updateProxyContainer.addClass("binf-hidden");
        this.userFormRegion = new Marionette.Region({
          el: this.ui.userForm
        });
      }
      this.listenTo(this.userFormView, "change:field", function(event) {
        if (event.name === "timePeriod") {
          this.onTimePeriodToggle(event);
          return;
        }
      });
      this.listenTo(this.userFormView, "render:form", function() {
        if (this.model.get("to_date") == null) {
          this.$el.find(".proxy-item-timeperiod").addClass("binf-hidden");
        }
      });
      this.userFormRegion.show(this.userFormView);
      this.userFormView.model.set({
        timePeriod: this.model.get("from_date") != null
      });
    },
    onTimePeriodToggle: function(event) {
      if (event.value) {
        this.$el.find(".proxy-item-timeperiod").removeClass("binf-hidden");
      } else {
        this.$el.find(".proxy-item-timeperiod").addClass("binf-hidden");
      }
      event.model.set({
        timePeriod: event.value
      }, {
        silent: true
      });
    },
    onHoverProxyForm: function() {
      this.ui.proxyActions.css("opacity", "1");
    },
    onBlurProxyForm: function() {
      this.ui.proxyActions.css("opacity", "0");
    },
    onEditProxy: function() {
      this.isEditMode = true;
      this.render();
    },
    onDeleteProxy: function() {
      var values = this.userFormView.getValues(), self = this;
      var options = {
        url: this.getURLv2(values.user),
        method: "DELETE"
      };
      this.blockActions();
      this.options.parentOptions.connector.makeAjaxCall(options).then(function() {
        self.unblockActions();
        self.options.parentOptions.collection.remove([ self.model ]);
        self.destroy();
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error);
      });
    },
    onUpdateProxy: function() {
      var values = this.userFormView.getValues(), timeChecked = this.userFormView.model.get("timePeriod"), self = this;
      var options = {
        url: this.getURLv2(values.user),
        method: "PUT",
        data: {
          from_date: timeChecked ? values.start : null,
          to_date: timeChecked ? values.end : null
        }
      };
      this.blockActions();
      this.options.parentOptions.connector.makeAjaxCall(options).then(function() {
        self.unblockActions();
        self.isEditMode = false;
        self.model.set("from_date", values.start);
        self.model.set("to_date", values.end);
        self.render();
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error);
      });
    },
    onCancelUpdate: function() {
      this.isEditMode = false;
      this.render();
    },
    getURLv2: function(userId) {
      var url = this.options.parentOptions.connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "members/proxies/" + userId;
      }
      return url;
    },
    _showError: function(error) {
      var cmdErr = new CommandError(error);
      GlobalMessage.showMessage("error", lang.delegateError, cmdErr.errorDetails || cmdErr.message);
    }
  });
  return ProxyItemView;
});