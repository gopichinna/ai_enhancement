/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/base", "csui/controls/multilingual.text.picker/multilingual.popover.mixin", "csui/controls/table/inlineforms/base/views/textfield/textfield.view", "hbs!csui/controls/table/inlineforms/base/views/textfield/impl/multilingual.textfield", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/controls/table/inlineforms/base/views/textfield/impl/multilingual.textfield" ], function(_, base, MultiLingualPopoverMixin, TextFieldView, basetemplate, theming, jatoIcons) {
  var MultilingTextFieldView = TextFieldView.extend({
    template: basetemplate,
    templateContext: function() {
      let data = {
        isJATO: theming.isJATOTheme(),
        globeIconSVG: jatoIcons.actionLanguage
      };
      const baseTemplateContext = this.constructor.__super__.templateContext.apply(this, arguments);
      return _.extend(baseTemplateContext, data);
    },
    constructor: function MultilingTextFieldView(options) {
      this.listenTo(this, "ml:value:updated", function(val) {
        this.onMultiLingualPopoverClose(val);
      });
      options = options || {};
      options.connector = options.parentView && options.parentView.model && options.parentView.model.connector;
      TextFieldView.prototype.constructor.apply(this, arguments);
    },
    ui: function() {
      return _.extend({}, TextFieldView.prototype.ui, {
        mlGlobeIcon: ".csui-multilingual-icon"
      });
    },
    events: function() {
      return _.extend({}, TextFieldView.prototype.events, {
        "click @ui.mlGlobeIcon": "_showLanguagePopover",
        "keydown @ui.mlGlobeIcon": "onKeyDownGlobeIcon"
      });
    },
    onKeyDownGlobeIcon: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.multiLingualForm && this.keyDownOnGlobeIcon(event);
      }
    },
    loadAdditionalInfo: function() {
      var self = this, parentModel = this.parentView.model, mlData = parentModel.get("name_multilingual"), model = this.model, id = parentModel.get("id");
      this.$el.addClass("csui-multilingual-input");
      var errorMessage = parentModel.get("csuiInlineFormErrorMessage");
      if (!!errorMessage) {
        this.$el.find("input.csui-inlineform-error").attr("aria-errormessage", this.options.node.get("errorid"));
      }
      var blockableView = this.parentView.options.originatingView;
      blockableView && blockableView.blockActions && blockableView.blockActions();
      this.targetElement = this.ui.inputFieldName;
      this.metadataLanguages = this.options.metadataLanguages || base.getMetadataLanguageInfo();
      var mlOptions = {
        parentView: this,
        targetElement: this.targetElement,
        validationRequired: false,
        mlGlobeIcon: this.ui.mlGlobeIcon
      };
      !!mlData && model.set("name_multilingual", mlData, {
        silent: true
      });
      !!id && model.set("id", id, {
        silent: true
      });
      this.requiredInfoAvilable("name_multilingual").then(function() {
        mlOptions.multilingualData = self.model.get("name_multilingual");
        self._loadMultiLingualPopover(mlOptions);
        !mlData && parentModel.set("name_multilingual", model.get("name_multilingual"), {
          silent: true
        });
        blockableView && blockableView.unblockActions && blockableView.unblockActions();
        self._openMLFlyoutInEditMode();
      });
    },
    onInputValueChanged: function(event) {
      _.isFunction(this.updateMLdata) && this.updateMLdata(event);
    },
    onRender: function() {
      this.loadAdditionalInfo();
    },
    onBeforeDestroy: function() {
      this.multiLingualForm && this.multiLingualForm.trigger("ml:hide:popover");
    },
    onMultiLingualPopoverClose: function(obj) {
      this.prevMultilingualVal = this.model.get("name_multilingual");
      this.model.set("name_multilingual", obj.value_multilingual, {
        silent: true
      });
      this.targetElement.val(obj.value);
      this.saveMldata = obj;
      this.model.set({
        validField: !!obj.value.trim(),
        value: obj.value
      });
      this.options.parentView.trigger("enable:save:btn");
    }
  });
  MultiLingualPopoverMixin.mixin(MultilingTextFieldView.prototype);
  return MultilingTextFieldView;
});