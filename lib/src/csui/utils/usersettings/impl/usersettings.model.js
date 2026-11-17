/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/mixins/uploadable/uploadable.mixin" ], function($, _, Backbone, Url, ConnectableMixin, FetchableMixin, UploadableMixin) {
  "use strict";
  var UserSettingsModel = Backbone.Model.extend({
    constructor: function(options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.set({
        id: options.userid
      }, {
        silent: true
      });
      this.makeConnectable(options);
      this.makeUploadable(options);
    },
    validate: function() {
      var errMsg, requestObj;
      var ok = true;
      if (!this.get("requestObj")) {
        ok = false;
        errMsg = "requestObj does not exists.";
      } else {
        requestObj = this.get("requestObj");
      }
      if (ok) {
        if (!!requestObj.SmartUI && !!requestObj.General) {
          ok = false;
          errMsg = "requestObj does not contain the expectected settings.";
        }
      }
      if (!ok) {
        console.log(errMsg);
        return errMsg;
      }
    },
    url: function() {
      var url = Url.combine(this.connector.getConnectionUrl().getApiBase("v2"), "members/preferences");
      url = Url.appendQuery(url, "metadata=true&config_name=SmartUI&config_name=General");
      return url;
    },
    parse: function(response, options) {
      if (Array.isArray(response.results)) {
        let data = response.results[0].data, generalData;
        if (response.results[1]) {
          generalData = response.results[1].data;
        }
        var accessibleMode = false;
        if (data && data.config_name === "SmartUI") {
          accessibleMode = data.preferences.accessibleMode;
        } else {}
        var responsiveContainerMode = false;
        if (data && data.config_name === "SmartUI") {
          responsiveContainerMode = !!data.preferences.responsiveContainerMode;
        }
        var responsiveContainerMessageMode = false;
        if (data && data.config_name === "SmartUI") {
          responsiveContainerMessageMode = !!data.preferences.responsiveContainerMessageMode;
        }
        var hasContentMgrPriv = false, contentMgtMode;
        if (generalData && generalData.config_name === "General" && generalData.preferences && generalData.preferences.HasContentMgrPriv) {
          hasContentMgrPriv = generalData.preferences.HasContentMgrPriv;
          if (hasContentMgrPriv) {
            contentMgtMode = data.preferences.General;
          }
        }
        return {
          accessibleMode: accessibleMode,
          metadataLangType: generalData && generalData.preferences ? generalData.preferences.metadataLangType : "",
          localeType: generalData && generalData.preferences ? generalData.preferences.localeType : "",
          responsiveContainerMode: responsiveContainerMode,
          responsiveContainerMessageMode: responsiveContainerMessageMode,
          hasContentMgrPriv: hasContentMgrPriv,
          contentMgtMode: contentMgtMode,
          isInContentMgrMode: generalData && generalData.preferences ? generalData.preferences.IsInContentMgrMode : false
        };
      } else {
        var self = response.links.data.self;
        if (self.method !== "PUT" || self.body.length !== 0) {} else {
          return {};
        }
      }
    },
    prepare: function(data, options) {
      return data.requestObj;
    }
  });
  ConnectableMixin.mixin(UserSettingsModel.prototype);
  FetchableMixin.mixin(UserSettingsModel.prototype);
  UploadableMixin.mixin(UserSettingsModel.prototype);
  return UserSettingsModel;
});