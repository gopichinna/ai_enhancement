/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/perspective.manage/settings.panel/setting.items" ], function(_, $, Backbone, accordionItems) {
  let settings = [];
  accordionItems.each(function(item) {
    settings.push(item.get("contentView"));
  });
  var SettingModel = Backbone.Model.extend({
    constructor: function SettingModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this._getConfigFromFormData = attributes.getConfigFromFormData;
      this._getFormDataFromConfig = attributes.getFormDataFromConfig;
      this._getDefaultConfig = attributes.getDefaultConfig;
    },
    getConfigFromFormData: function(formData, headerConfig) {
      var configVal = this._getConfigFromFormData.apply(this, arguments);
      if (this.get("widgetId")) {
        var widgets = headerConfig.options.header.widgets;
        var wIndex = _.findIndex(widgets, function(w) {
          return w.view === this.get("widgetId");
        }, this);
        var widgetConfig = widgets[wIndex];
        widgetConfig.options = $.extend(true, {}, widgetConfig.options, configVal);
        var changeWidgets = [];
        changeWidgets[wIndex] = widgetConfig;
        configVal = {
          options: {
            header: {
              widgets: changeWidgets
            }
          }
        };
      }
      return configVal;
    },
    getFormDataFromConfig: function(headerConfig) {
      if (this.get("widgetId")) {
        var widgetConfig = _.findWhere(headerConfig.options.header.widgets, {
          view: this.get("widgetId")
        });
        headerConfig = widgetConfig.options;
      }
      return this._getFormDataFromConfig && this._getFormDataFromConfig(headerConfig) || {};
    },
    getDefaultConfig: function() {
      return _.isFunction(this._getDefaultConfig) ? this._getDefaultConfig() : {};
    },
    getData: function(headerConfig) {
      var formData = this.getFormDataFromConfig(headerConfig), defaultData = this.getDefaultConfig(), data = $.extend(true, {}, defaultData, formData);
      return data;
    },
    hasOwnView: function() {
      return !!this.get("view");
    }
  });
  var SettingsCollection = Backbone.Collection.extend({
    model: SettingModel
  });
  return new SettingsCollection(settings);
});