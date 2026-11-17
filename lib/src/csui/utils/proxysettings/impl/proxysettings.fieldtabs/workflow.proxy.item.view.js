/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette3", "hbs!csui/utils/proxysettings/impl/workflow.proxy.item", "csui/controls/progressblocker/blocker", "csui/controls/globalmessage/globalmessage", "csui/utils/command.error", "csui/models/form", "csui/controls/form/form.view", "i18n!csui/utils/proxysettings/impl/nls/lang", "css!csui/utils/proxysettings/impl/proxysettingstab" ], function(_, $, Marionette, itemTemplate, BlockingView, GlobalMessage, CommandError, FormModel, FormView, lang) {
  var ProxyItemView = Marionette.View.extend({
    className: "proxy-item",
    events: {
      "mouseenter .proxy-user": "onHoverProxyForm",
      "mouseleave .proxy-user": "onBlurProxyForm",
      "focusin .proxy-user": "onHoverProxyForm",
      "focusout .proxy-user": "onBlurProxyForm",
      "click .btn-remove-proxy": "onDeleteProxy",
      "click .btn-edit-proxy": "onEditProxy",
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
      proxyActions: ".csui-proxy-actions"
    },
    constructor: function(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
    },
    getRawFormsData: function() {
      return {
        data: {
          user: this.model.get("id")
        },
        options: {
          fields: {
            user: {
              hidden: false,
              label: lang.user,
              type: "otcs_user_picker"
            }
          }
        },
        schema: {
          properties: {
            user: {
              readonly: !this.isEditMode,
              required: false,
              type: "otcs_user_picker",
              title: lang.user
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
      this.userFormRegion.show(this.userFormView);
    },
    onEditProxy: function() {
      this.isEditMode = true;
      this.render();
    },
    onHoverProxyForm: function() {
      this.ui.proxyActions.css("opacity", "1");
    },
    onBlurProxyForm: function() {
      this.ui.proxyActions.css("opacity", "0");
    },
    onDeleteProxy: function() {
      var self = this;
      var options = {
        url: this.getURLv2(),
        method: "POST",
        data: {
          proxy_id: 0,
          proxy_name: "",
          user_id: this.options.parentOptions.userid
        }
      };
      this.blockActions();
      this.options.parentOptions.connector.makeAjaxCall(options).then(function() {
        self.unblockActions();
        self.destroy();
      }).catch(function(error) {
        self.unblockActions();
        self._showError(error);
      });
    },
    onUpdateProxy: function() {
      var values = this.userFormView.getValues(), self = this;
      if (!this.userFormView.validate()) {
        return;
      }
      var options = {
        url: this.getURLv2(),
        method: "POST",
        data: {
          proxy_id: values.user,
          user_id: this.options.parentOptions.userid
        }
      };
      this.blockActions();
      this.options.parentOptions.connector.makeAjaxCall(options).then(function() {
        self.unblockActions();
        self.isEditMode = false;
        self.model.set("id", values.user);
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
    getURLv2: function() {
      var url = this.options.parentOptions.connector.getConnectionUrl().getApiBase("v2");
      if (url) {
        url += "wfproxyuser";
      }
      return url;
    },
    _showError: function(error) {
      var cmdErr = new CommandError(error);
      GlobalMessage.showMessage("error", lang.proxyError, cmdErr.errorDetails || cmdErr.message);
    }
  });
  return ProxyItemView;
});