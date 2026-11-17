/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/utils/commonconfig.util", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/controls/form/pub.sub", "csui/models/version", "csui/utils/contexts/factories/user", "csui/utils/namedlocalstorage", "i18n!csui/controls/tab.panel/impl/nls/lang", "hbs!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield", "csui/widgets/metadata/impl/metadata.persistencereqswitchflow", "css!csui/controls/tab.panel/requiredfield/impl/tab.contents.header.requiredfield", "csui/lib/binf/js/binf" ], function(module, CommonConfig, require, $, _, Backbone, Marionette, PubSub, VersionModel, UserModelFactory, NamedLocalStorage, lang, tabContentsHeaderTemplate, MetaDataPersistenceReqSwitchFlow) {
  "use strict";
  let config = module.config();
  _.defaults(config, {
    enablePersistanceForRequiredToggle: CommonConfig.enableFeatureInSmartView() || false
  });
  var TabContentsHeaderView = Marionette.ItemView.extend({
    template: tabContentsHeaderTemplate,
    ui: {
      requiredSwitchEle: ".required-field-switch",
      requiredSwitchIcon: ".required-field-switch > div.required-fields-switch"
    },
    events: {
      "click @ui.requiredSwitchIcon": "onClickRequiredIconDiv",
      keydown: "onKeyInView"
    },
    constructor: function TabContentsHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.pubsubPostFix = (this.options.node instanceof VersionModel ? "v" : "p") + this.options.node.get("id");
      const currentUserId = this.options.context.getModel(UserModelFactory).get("id");
      this.namedLocalStorage = new NamedLocalStorage(`metadataPreferences:${currentUserId}`), 
      this.requiredFieldsLabelId = _.uniqueId("requiredFields");
      var objPubSubId = "pubsub:tab:contents:header:view:change:tab:title:" + this.pubsubPostFix;
      PubSub.off(objPubSubId);
      this.listenTo(PubSub, objPubSubId, this._changeTabTitle);
      this.listenTo(this.options?.collection, "add", function(model) {
        !!model.get("required") && this._showRequiredSwitch();
      });
      this.listenTo(this.options?.collection, "remove", function(model) {
        if (!this.isRequiredCatPresent()) {
          this._hideRequiredSwitch();
        }
      });
      this.listenTo(this, "metadata:schema:updated", function(model) {
        if (!this.isRequiredCatPresent()) {
          this._hideRequiredSwitch();
        } else {
          this._showRequiredSwitch();
        }
      }, this);
    },
    templateHelpers: function() {
      return {
        onlyRequiredFieldsLabel: lang.onlyRequiredFieldsLabel,
        requiredFieldsLabelId: this.requiredFieldsLabelId
      };
    },
    onRender: function() {
      this.requiredFieldSwitchModel = new Backbone.Model({
        data: !!this._persistRequiredSwitch()
      });
      var self = this;
      require([ "csui/controls/form/fields/booleanfield.view" ], function(BooleanFieldView) {
        self.requiredFieldSwitchView = new BooleanFieldView({
          mode: "writeonly",
          model: self.requiredFieldSwitchModel,
          labelId: self.requiredFieldsLabelId
        });
        self.requiredFieldSwitchView.render();
        self.listenTo(self.requiredFieldSwitchView, "field:changed", function(event) {
          var objPubSubId = "pubsub:tab:contents:header:view:switch:" + self.pubsubPostFix;
          PubSub.trigger(objPubSubId, {
            on: event.fieldvalue
          });
          const reqSwitchObj = MetaDataPersistenceReqSwitchFlow.getPersistanceFlow(self.options);
          if (config.enablePersistanceForRequiredToggle && reqSwitchObj?.action) {
            this.namedLocalStorage.set(`${reqSwitchObj?.action}:requireSwitched`, event.fieldvalue);
          } else if (!!self.options.node.collection) {
            self.options.node.collection.requireSwitched = event.fieldvalue;
          }
        });
        self.$(".required-fields-switch").append(self.requiredFieldSwitchView.$el);
        if (self.isRequiredCatPresent()) {
          self._showRequiredSwitch();
        }
        PubSub.off("pubsub:header:rightbar:view:change:switch:status");
        self.listenTo(PubSub, "pubsub:header:rightbar:view:change:switch:status", function(reset) {
          if (!!reset) {
            if (!!self.requiredFieldSwitchView.curVal) {
              self.requiredFieldSwitchView.$el.trigger("click");
            }
          } else if (!!self.requiredFieldSwitchModel && self.requiredFieldSwitchModel.get("data") !== undefined && !self.requiredFieldSwitchModel.get("data")) {
            if (!!this._persistRequiredSwitch()) {
              self.requiredFieldSwitchView.$el.trigger("click");
            }
          }
        });
      });
    },
    currentlyFocusedElement: function(event) {
      if (!this.ui.requiredSwitchEle.hasClass("binf-hidden") && this.requiredFieldSwitchView) {
        return $(this.ui.requiredSwitchIcon.find(":input"));
      } else {
        return undefined;
      }
    },
    onKeyInView: function(e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 32 || event.keyCode === 13) {
        if (!this.ui.requiredSwitchEle.hasClass("binf-hidden") && this.requiredFieldSwitchView) {
          event.preventDefault();
          event.stopPropagation();
          setTimeout(_.bind(function() {
            $(target).trigger("click");
          }, this), 200);
        }
      }
      return undefined;
    },
    onClickRequiredIconDiv: function(event) {
      this.requiredFieldSwitchView.onClickWriteField(event);
    },
    _persistRequiredSwitch: function() {
      const reqSwitchObj = MetaDataPersistenceReqSwitchFlow.getPersistanceFlow(this.options);
      const shouldOverrideRequireSwitched = config.enablePersistanceForRequiredToggle && reqSwitchObj?.action;
      return shouldOverrideRequireSwitched ? this.namedLocalStorage.get(`${reqSwitchObj?.action}:requireSwitched`) : this.options.node.collection?.requireSwitched;
    },
    _hideRequiredSwitch: function() {
      this.ui.requiredSwitchEle.addClass("binf-hidden");
      !!this.requiredFieldSwitchView && !!this.requiredFieldSwitchView.getValue() && this.requiredFieldSwitchView.ui.flagWriteField.trigger("click");
    },
    _showRequiredSwitch: function() {
      this.ui.requiredSwitchEle.removeClass("binf-hidden");
    },
    isRequiredCatPresent: function() {
      if (!!this.options.hideRequiredFieldsSwitch) {
        return false;
      }
      var isRequiredCatPresent = false, i = 0;
      for (;!isRequiredCatPresent && i < this.collection.models.length; i++) {
        isRequiredCatPresent = this.collection.models[i].get("required") === true;
      }
      return isRequiredCatPresent;
    }
  });
  return TabContentsHeaderView;
});