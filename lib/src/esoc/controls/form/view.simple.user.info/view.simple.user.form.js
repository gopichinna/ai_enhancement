/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/controls/form/form.view", "esoc/widgets/userwidget/util", "hbs!esoc/controls/form/view.simple.user.info/impl/view.simple.user.form" ], function(_, $, FormView, Util, formTemplate) {
  "use strict";
  var ViewSimpleUserForm = FormView.extend({
    className: "cs-form esoc-simple-user-widget-view-form",
    formTemplate: formTemplate,
    util: Util,
    formTemplateHelpers: function() {
      return {
        cid: this.model.cid
      };
    },
    constructor: function ViewSimpleUserForm(options) {
      FormView.prototype.constructor.call(this, options);
      this.listenTo(this, "change:field", this._saveField);
      this.onWinResize = _.bind(this.windowResize, this);
      $(window).on("resize.app", this.onWinResize);
      this.originalHeight = 0;
    },
    windowResize: function() {
      this.formHeight();
      this.triggerMethod("dom:refresh");
    },
    formHeight: function() {
      if (this.options.orginatingView.$el.is(":visible")) {
        if (!this.options.orginatingView.options.sidePanel) {
          var id = this.options.model.get("userId"), className = ".user" + id;
          if (this.originalHeight === 0) {
            this.originalHeight = $(className + " .esoc-simple-user-widget-body .esoc-simple-user-widget-tab-view > .esoc-simple-user-widget-form-body").length > 0 ? $(className + " .esoc-simple-user-widget-form-content").height() + 52 : $(className + " .esoc-simple-user-widget-body").height();
          }
          $(".esoc-simple-user-widget-dialog " + className + " .binf-modal-content").css("height", this.originalHeight + $(className + " .esoc-simple-user-widget-header").height());
          if ($(className + " .esoc-simple-user-widget-body .esoc-simple-user-widget-tab-view > .esoc-simple-user-widget-form-body").length > 0) {
            $(className + " .esoc-simple-user-widget-form-body").css("height", $(className + " .esoc-simple-user-widget-body").height());
          }
        }
        this.options.orginatingView.triggerMethod("update:scrollbar");
      } else {
        $(window).off("resize.app", this.onWinResize);
        this.destroy();
      }
    },
    onRenderForm: function() {
      this.formHeight();
      this.handleManagerAttributes();
      this.options.orginatingView.trigger("view:shown");
    },
    _getLayout: function() {
      var template = this.getOption("formTemplate"), html = template.call(this, {
        data: this.alpaca.data,
        mode: this.mode
      }), bindings = this._getBindings(), view = {
        parent: "bootstrap-csui",
        layout: {
          template: html,
          bindings: bindings
        }
      };
      return view;
    },
    _getBindings: function() {
      var bindings = {
        reportsToID: _.str.sformat("reportsToID-{0}", this.model.cid),
        OfficeLocation: _.str.sformat("OfficeLocation-{0}", this.model.cid),
        MailAddress: _.str.sformat("MailAddress-{0}", this.model.cid),
        Contact: _.str.sformat("Contact-{0}", this.model.cid),
        CellularPhone: _.str.sformat("CellularPhone-{0}", this.model.cid)
      };
      return bindings;
    },
    _saveField: function(args) {
      this.model.fetched && this.model.invalidateFetch();
      var formData = new FormData(), newValue = args.value ? args.value : "", connector = this.model.connector;
      if (args.name == "reportsToID") {
        formData.append(this.util.commonUtil.globalConstants.ACTION, this.util.commonUtil.globalConstants.UPDATE_EXTENDED_INFO);
        formData.append("reportsTo", newValue);
        var ajaxParams = {
          itemview: this,
          url: this.util.commonUtil.getV2Url(connector.getConnectionUrl()) + this.util.commonUtil.REST_URLS.pulseRestUrl + args.model.attributes.userId,
          type: "PUT",
          data: formData,
          connector: connector
        };
      } else {
        switch (args.name) {
         case "OfficeLocation":
          formData.append("office_location", newValue);
          break;

         case "MailAddress":
          formData.append("business_email", newValue);
          break;

         case "Contact":
          formData.append("business_phone", newValue);
          break;

         case "CellularPhone":
          formData.append("cell_phone", newValue);
          break;
        }
        var ajaxParams = {
          itemview: this,
          url: this.util.commonUtil.getV2Url(connector.getConnectionUrl()) + "/members/" + args.model.attributes.userId,
          type: "PUT",
          data: formData,
          connector: connector
        };
      }
      this.util.updateAjaxCall(ajaxParams);
      this.handleManagerAttributes();
    },
    handleManagerAttributes: function() {
      this.$el.find(".cs-field-read-inner button").attr("tabindex", "0");
      this.$el.find(".esoc-user-container").on("keypress", function(e) {
        e.stopPropagation();
      });
    }
  });
  return ViewSimpleUserForm;
});