/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/commandhelper", "d2/utils/node.utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/constants", "i18n!csui/models/impl/nls/lang" ], function($, _, Url, CommandHelper, nodeUtils, RestResources, RestLinkrels, constants, lang) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function() {
          return this;
        },
        url: function() {
          var links = RestResources.getCurrentRepository().get("links");
          return RestLinkrels.getLink(links, RestLinkrels.D2_FAVORITES);
        },
        _serverCallPreCheck: function() {
          if (this.isNew()) {
            return {
              error: lang.serverCallPrecheckFailedModelIsNew
            };
          }
          if (!this.options || !this.options.connector) {
            return {
              error: lang.serverCallPrecheckFailedMissingConnector
            };
          }
          return undefined;
        },
        _serverCallUpdateFavorite: function(ajaxMethod, deferred, selected) {
          var error = this._serverCallPreCheck();
          if (error !== undefined) {
            deferred.reject(error);
            return;
          }
          var href = Url.combine(this.url(), this.get("id")), url = ajaxMethod === "POST" ? this.url() : href, options = {
            type: ajaxMethod,
            url: url,
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
            },
            data: ajaxMethod !== "POST" ? undefined : JSON.stringify({
              properties: {
                r_object_id: this.id
              }
            })
          };
          $.ajax(this.options.connector.extendAjaxOptions(options)).done(_.bind(function(resp) {
            this.set("selected", selected);
            if (window.csui && window.csui.mobile) {
              var selectedNode = this.get("node"), widgetType = selectedNode.collection.widgetType, widgetName = selectedNode.collection.options && selectedNode.collection.options.widgetName, isDisableLocationColumn = selectedNode.collection.options && selectedNode.collection.options.isDisableLocationColumn;
              CommandHelper.refreshNode(this, {
                widgetName: widgetName,
                widgetType: widgetType,
                isDisableLocationColumn: isDisableLocationColumn
              });
            }
            deferred.resolve(resp);
          }, this)).fail(function(err) {
            deferred.reject(err);
          });
        }
      });
    }
  };
});