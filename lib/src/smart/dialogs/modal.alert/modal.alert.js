/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "nuc/utils/log", "smart/utils/smart.base", "nuc/lib/handlebars", "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "smart/dialogs/modal.alert/modal.alert.footer", "smart/mixins/generic.utilities/footerview.responsiveness.mixin", "hbs!smart/dialogs/modal.alert/impl/modal.alert", "hbs!smart/dialogs/modal.alert/impl/light.weight.message", "i18n!smart/dialogs/modal.alert/impl/nls/lang", "smart/behaviors/keyboard.navigation/tabkey.behavior", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.status.icons", "smart/lib/binf/js/binf", "smart/themes/carbonfiber/ot-icons/icons_smart_notification", "css!smart/dialogs/modal.alert/impl/modal.alert", "css!smart/dialogs/modal.alert/impl/light.weight.message", "css!smart/controls/globalmessage/globalmessage_icons", "css!smart/controls/dialog/impl/dialog" ], function(module, _, $, Marionette, Backbone, log, smartBase, Handlebars, LayoutViewEventsPropagationMixin, ModalAlertFooterView, FooterViewResponsiveMixin, template, lightWeightMessageTemplate, lang, TabKeyBehavior, theming, jatoStateIcons) {
  log = log(module.id);
  var SimpleMessageModel = Backbone.Model.extend({
    defaults: {
      message: ""
    },
    constructor: function SimpleMessageModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var SimpleMessageView = Marionette.ItemView.extend({
    className: "csui-simple-message-view",
    template: Handlebars.compile("{{message}}"),
    constructor: function SimpleMessageView(options) {
      options.model = new SimpleMessageModel({
        message: options.message
      });
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
  var ModalAlertView = Marionette.LayoutView.extend({
    className: function() {
      var className = "csui-alert cs-dialog binf-modal binf-fade";
      if (this.options.modalClass) {
        className += " " + this.options.modalClass;
      }
      return className;
    },
    getTemplate: function() {
      return this.options?.lightWeight ? lightWeightMessageTemplate : template;
    },
    ui: {
      footer: ".binf-modal-footer"
    },
    regions: {
      bodyRegion: ".binf-modal-body",
      footerRegion: ".binf-modal-footer"
    },
    events: {
      "shown.binf.modal": "onShown",
      "hide.binf.modal": "onHiding",
      "hidden.binf.modal": "onHidden",
      keydown: "onKeyDown"
    },
    behaviors: {
      TabKeyBehavior: {
        behaviorClass: TabKeyBehavior,
        recursiveNavigation: true
      }
    },
    constructor: function ModalAlertView(options) {
      this.previousFocusedElement = document.activeElement;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (this.options.message || !this.options.bodyView) {
        this.options.bodyView = SimpleMessageView;
        this.options.bodyViewOptions = {
          message: this.options.message || ""
        };
        this.options = _.omit(this.options, "message");
      }
      options = this.options;
      var buttonData = _.reduce(ModalAlertView.buttonData, function(result, value, key) {
        result["label" + key] = value.label;
        result["tooltip" + key] = value.tooltip;
        result["aria" + key] = value.aria;
        return result;
      }, {});
      options.buttons = _.defaults({}, _.isEmpty(options.buttons) ? ModalAlertView.buttons.Close : options.buttons, buttonData);
      _.defaults(options, ModalAlertView.defaultOptions.Information, {
        centerVertically: true,
        showHeader: options.title !== ""
      });
      this._deferred = $.Deferred();
    },
    templateHelpers: function() {
      var templateVals = _(this.options).clone();
      templateVals.dlgTitleId = _.uniqueId("dlgTitle");
      templateVals.dlgMsgId = _.uniqueId("dlgMsg");
      templateVals.closeButtonAria = templateVals.buttons.ariaClose;
      templateVals.closeButtonTooltip = templateVals.buttons.tooltipClose;
      templateVals.bodyViewExists = templateVals.bodyView != false;
      templateVals.isJATO = theming.isJATOTheme();
      return templateVals;
    },
    show: function() {
      this.render();
      var staticBackdrop = this.options.staticBackdrop === false ? this.options.staticBackdrop : true;
      this.$el.binf_modal({
        backdrop: staticBackdrop ? "static" : true,
        keyboard: false
      });
      if (this.options.centerVertically) {
        this.centerVertically();
      }
      this.$el.binf_modal("show");
      this.triggerMethod("show");
      var promise = this._deferred.promise(), self = this;
      promise.close = function() {
        self.$el.binf_modal("hide");
        return promise;
      };
      return promise;
    },
    centerVertically: function() {
      var $clone;
      var top;
      $clone = this.$el.clone();
      $clone.css("display", "block");
      $clone.appendTo($.fn.binf_modal.getDefaultContainer());
      top = Math.round(($clone.height() - $clone.find(".binf-modal-content").height()) / 2);
      top = top > 0 ? top : 0;
      $clone.remove();
      this.$el.find(".binf-modal-content").css("margin-top", top);
    },
    onShown: function() {
      this.footerView && this.updateFooterView(this.footerView);
      this.footerView.$el.removeClass("smart-footer-btn-wrapper");
      this._deferred.notify({
        state: "shown"
      });
      this.setTabFocus(false);
      this.$el.find(".binf-modal-backdrop").attr("aria-hidden", true);
      this.trigger("modalalert:after:shown", false);
    },
    onHiding: function() {
      var self = this;
      this.$el.addClass("binf-fadein");
      setTimeout(function() {
        self._deferred.notify({
          state: "hiding"
        });
      }, 300);
    },
    onRender: function() {
      var bodyView = new this.options.bodyView(this.options.bodyViewOptions);
      this.showChildView("bodyRegion", bodyView);
      this._renderFooter();
    },
    onDestroy: function() {
      if (this.previousFocusedElement && document.body.contains(this.previousFocusedElement)) {
        this.previousFocusedElement.focus();
      }
    },
    onDomRefresh: function() {
      this.footerView && this.updateFooterView(this.footerView);
    },
    _renderFooter: function() {
      const footerCollection = new Backbone.Collection();
      const buttons = this.options?.buttons || {};
      var btnSize = this.options?.lightWeight ? "mini" : "";
      if (theming.isJATOTheme()) {
        btnSize = "";
      }
      if (!_.isEmpty(buttons)) {
        if (buttons.showYes) {
          footerCollection.add({
            id: "btn-yes",
            label: buttons.labelYes || lang.YesButtonLabel,
            arialabel: buttons?.yesAria ?? "",
            variant: "primary",
            size: btnSize,
            classes: "csui-yes csui-default",
            disabled: buttons.disableYes || false,
            trigger: "click:yes"
          });
        }
        if (buttons.showNo) {
          footerCollection.add({
            id: "btn-no",
            label: buttons.labelNo || lang.NoButtonLabel,
            arialabel: buttons?.noAria ?? "",
            variant: "secondary",
            size: btnSize,
            classes: "csui-no",
            disabled: buttons.disableNo || false,
            trigger: "click:no"
          });
        }
        if (buttons.showCancel) {
          footerCollection.add({
            id: "btn-cancel",
            variant: "secondary",
            arialabel: buttons?.cancelAria ?? "",
            size: btnSize,
            label: buttons.labelCancel || lang.CancelButtonLabel,
            classes: "csui-cancel",
            disabled: buttons.disableCancel || false
          });
        }
      }
      const footerView = this.footerView = new ModalAlertFooterView({
        el: this.ui.footer[0],
        collection: footerCollection
      });
      this.listenTo(footerView, "childview:click button:click", this.onClickButton);
      this.footerView.$el.addClass("smart-footer-btn-wrapper");
      footerView.render();
      this.footerRegion.attachView(footerView);
      this.updateFooterView(this.footerView);
    },
    onClickButton: function(view) {
      const attributes = view?.model?.attributes || view || {};
      if (attributes && !attributes?.el) {
        attributes.trigger && this.triggerMethod(attributes.trigger);
      }
      if (!attributes?.el) {
        let activeEl = document.activeElement;
        if (this?.$el?.find(activeEl)?.length != 0 || this?.el?.isSameNode(activeEl)) {
          activeEl.blur();
        }
        this.$el?.binf_modal?.("hide");
      }
    },
    updateButtons: function(settingsObj) {
      if (settingsObj) {
        var hasYes, hasNo, hasCancel;
        if (this.options.buttons.showYes) {
          hasYes = true;
        }
        if (this.options.buttons.showNo) {
          hasNo = true;
        }
        if (this.options.buttons.showCancel) {
          hasCancel = true;
        }
        var disableSettings = _.pick(settingsObj, "disableYes", "disableNo", "disableCancel");
        this.options.buttons = _.extend({}, this.options.buttons, disableSettings);
        if (hasYes) {
          this.footerView?.updateButton("btn-yes", {
            disabled: !!this.options.buttons.disableYes
          });
        }
        if (hasNo) {
          this.footerView?.updateButton("btn-no", {
            disabled: !!this.options.buttons.disableNo
          });
        }
        if (hasCancel) {
          this.footerView?.updateButton("btn-cancel", {
            disabled: !!this.options.buttons.disableCancel
          });
        }
      }
    },
    onHidden: function(event) {
      this.destroy();
      this.$el.find(".binf-modal-backdrop").attr("aria-hidden", false);
      if (this.options.callback) {
        this.options.callback(this._result);
      }
      if (this._result) {
        this._deferred.resolve(this._result);
      } else {
        this._deferred.reject(this._result);
      }
    },
    onKeyDown: function(event) {
      var keyCode = event.keyCode;
      if (keyCode === 9 || keyCode === 13) {
        event.preventDefault();
      }
      switch (keyCode) {
       case 13:
        if (event.target === this.el) {
          this.footerView?.$el.find("otc-button.csui-default")?.trigger("click");
        } else {
          $(event.target).trigger("click");
        }
        break;

       case 27:
        if (event?.target.classList?.contains("smart-dropdown-menuitem")) {
          event.preventDefault();
          event.stopPropagation();
          this.el?.querySelector(".binf-dropdown-toggle").focus();
        } else if (this.options?.closeWithEsc !== false) {
          let activeEl = document.activeElement;
          if (this?.$el?.find(activeEl)?.length != 0 || this?.el?.isSameNode(activeEl)) {
            activeEl.blur();
          }
          this.$el?.binf_modal?.("hide");
        }
        break;

       case 9:
        this.trigger("modalalert:after:shown", event.shiftKey);
        return this.setTabFocus(event.shiftKey);
      }
    },
    onClickYes: function() {
      this._result = true;
    },
    onClickNo: function() {
      this._result = false;
    },
    _setTabFocus: async function(tabShift) {
      let btnElement = this.el.querySelector("otc-button:not([disabled])");
      await btnElement.updateComplete.then(_.bind(() => {
        this._setTabFocus(tabShift);
      }, this));
      return btnElement.updateComplete;
    },
    waitForOTCButton: async function() {
      let btnElement = this.el.querySelector("otc-button:not([disabled])");
      return btnElement?.updateComplete;
    },
    setTabFocus: async function(tabShift) {
      await this.waitForOTCButton();
      var tabElements = this.$("*[tabindex]:not([disabled])"), lastIndex = tabElements.length - 1, i = this._getStartIndex(lastIndex, tabShift, tabElements);
      if (lastIndex > -1) {
        var activeIndex = this.activeIndex !== undefined ? this.activeIndex : tabShift ? 0 : lastIndex;
        do {
          var $tabElem = $(tabElements[i]);
          if (smartBase.isVisibleInWindowViewport($tabElem)) {
            this.activeIndex = i;
            $tabElem.trigger("focus");
            break;
          }
          if (tabShift) {
            i = i === 0 ? lastIndex : i - 1;
          } else {
            i = i === lastIndex ? 0 : i + 1;
          }
        } while (i != activeIndex);
      }
      return false;
    },
    _getStartIndex: function(lastIndex, tabShift) {
      var startIndex = 0, activeIndex = this.activeIndex;
      if (tabShift) {
        startIndex = lastIndex;
        if (activeIndex !== undefined && activeIndex > 0) {
          startIndex = this.activeIndex - 1;
        }
      } else {
        if (activeIndex !== undefined && activeIndex < lastIndex) {
          startIndex = activeIndex + 1;
        }
      }
      return startIndex;
    }
  }, {
    defaultOptions: {
      Success: {
        title: lang.DefaultSuccessTitle,
        altText: lang.DefaultSuccessTitle,
        titleIcon: "notification_success24",
        jatoTitleIcon: jatoStateIcons.statusSuccess,
        showTitleIcon: true,
        titleCloseIcon: "csui-icon-dismiss-white",
        showTitleCloseButton: false,
        headerClass: "success-header"
      },
      Information: {
        title: lang.DefaultInfoTitle,
        altText: lang.DefaultInfoTitle,
        titleIcon: "notification_information24",
        jatoTitleIcon: jatoStateIcons.statusInfo,
        showTitleIcon: true,
        titleCloseIcon: "csui-icon-dismiss-white",
        showTitleCloseButton: false,
        headerClass: "info-header"
      },
      Warning: {
        title: lang.DefaultWarningTitle,
        altText: lang.DefaultWarningTitle,
        titleIcon: "notification_warning24",
        jatoTitleIcon: jatoStateIcons.statusWarning,
        showTitleIcon: true,
        titleCloseIcon: "csui-icon-dismiss-white",
        showTitleCloseButton: false,
        headerClass: "warning-header"
      },
      Error: {
        title: lang.DefaultErrorTitle,
        altText: lang.DefaultErrorTitle,
        titleIcon: "notification_error24",
        jatoTitleIcon: jatoStateIcons.statusError,
        showTitleIcon: true,
        titleCloseIcon: "csui-icon-dismiss-white",
        showTitleCloseButton: false,
        headerClass: "error-header"
      },
      Message: {
        title: lang.DefaultMessageTitle,
        altText: lang.DefaultMessageTitle,
        titleIcon: "",
        jatoTitleIcon: "",
        showTitleIcon: false,
        titleCloseIcon: "csui-icon-dismiss",
        showTitleCloseButton: false,
        headerClass: "message-header"
      },
      Question: {
        title: lang.DefaultQuestionTitle,
        altText: lang.DefaultQuestionTitle,
        titleIcon: "notification_question24",
        jatoTitleIcon: jatoStateIcons.statusQuestion,
        showTitleIcon: true,
        titleCloseIcon: "csui-icon-dismiss-white",
        showTitleCloseButton: false,
        headerClass: "question-header"
      }
    },
    buttons: {
      YesNoCancel: {
        showYes: true,
        showNo: true,
        showCancel: true
      },
      YesNo: {
        showYes: true,
        showNo: true,
        showCancel: false
      },
      OkCancel: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: true
      },
      Ok: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: false
      },
      Cancel: {
        showYes: false,
        showNo: false,
        showCancel: true
      },
      Close: {
        showYes: false,
        showNo: false,
        showCancel: true,
        labelCancel: lang.CloseButtonLabel
      }
    },
    buttonData: {
      Yes: {
        label: lang.YesButtonLabel,
        tooltip: lang.YesButtonLabel,
        aria: ""
      },
      No: {
        label: lang.NoButtonLabel,
        tooltip: lang.NoButtonLabel,
        aria: ""
      },
      Ok: {
        label: lang.OkButtonLabel,
        tooltip: lang.OkButtonLabel,
        aria: ""
      },
      Cancel: {
        label: lang.CancelButtonLabel,
        tooltip: lang.CancelButtonLabel,
        aria: ""
      },
      Close: {
        label: lang.CloseButtonLabel,
        tooltip: lang.CloseButtonLabel,
        aria: lang.CloseButtonAria
      }
    },
    showSuccess: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success, ModalAlertView.buttons.Close);
      return this._show(options);
    },
    showInfo: function(callback, message, title, options) {
      this.showInformation.apply(this, arguments);
    },
    showInformation: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information, ModalAlertView.buttons.Close);
      return this._show(options);
    },
    showWarning: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning, ModalAlertView.buttons.Close);
      return this._show(options);
    },
    showError: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error, ModalAlertView.buttons.Close);
      return this._show(options);
    },
    showMessage: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message, ModalAlertView.buttons.Close);
      return this._show(options);
    },
    confirmSuccess: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    confirmInfo: function(callback, message, title, options) {
      log.warn("The method 'configInfo' has been deprecated and will be removed." + "  Use 'configInformation' instead.") && console.warn(log.last);
      log.warn("Occurred " + log.getStackTrace(2)) && console.warn(log.last);
      this.confirmInformation.apply(this, arguments);
    },
    confirmInformation: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    confirmWarning: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    confirmError: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    confirmQuestion: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Question, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    confirmMessage: function(callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message, ModalAlertView.buttons.YesNo);
      return this._show(options);
    },
    _makeOptions: function(parameters, defaultOptions, defaultButtons) {
      var callback = parameters[0], message = parameters[1], title = parameters[2], options = parameters[3];
      if (typeof callback !== "function") {
        options = title;
        title = message;
        message = callback;
        callback = undefined;
      }
      if (typeof message === "object") {
        options = _.clone(message);
      } else if (typeof title === "object") {
        options = _.defaults({
          message: message
        }, title);
      } else {
        options = _.defaults({
          message: message,
          title: title
        }, options);
      }
      options.buttons = _.defaults({}, options.buttons, defaultButtons);
      options.callback = callback;
      return _.defaults(options, defaultOptions);
    },
    _show: function(options) {
      var alert = new ModalAlertView(options);
      return alert.show();
    }
  });
  _.extend(ModalAlertView.prototype, FooterViewResponsiveMixin);
  _.extend(ModalAlertView.prototype, LayoutViewEventsPropagationMixin);
  return ModalAlertView;
});