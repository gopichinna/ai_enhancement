/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/utils" ], function($, _, serverQueryUtils, constants, widgetConstants, utils) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          if (options) {
            this.isDelayedActions = options.isDelayedActions;
            this.isNonPromoted = options.isNonPromoted;
            this.menuType = options.menuType;
            this.widgetType = options.widgetType;
          }
          return this;
        },
        sync: function(method, model, options) {
          var promise = $.Deferred(), isPromoted;
          if (this.isNonPromoted === true) {
            isPromoted = "NON-PROMOTED";
          } else {
            isPromoted = "PROMOTED";
          }
          if (this.isDelayedActions === true) {
            isPromoted = undefined;
          }
          if (this.nodes && this.nodes.length > 0 && !this.nodes[0]) {
            options.success.call(options.context, [], "success", {});
            promise.resolve();
          } else {
            var serverQueryOptions = {
              ids: this.nodes,
              connector: this.connector,
              actions: {
                menuType: this.menuType || constants.MenuTypes.CONTEXT,
                widgetType: this.widgetType || widgetConstants.D2.DOCLIST,
                queryAction: isPromoted
              },
              previewFormats: !utils.isMobile() && (this.isDelayedActions === true || this.isNonPromoted !== true)
            };
            serverQueryUtils.fetchDataForObjects(serverQueryOptions).done(function(output) {
              var actions = output.actions;
              _.each(output.previewFormats, function(value, key) {
                var actionArr = actions[key] || [];
                actionArr.splice(0, 0, {
                  signature: "D2-PreviewFormat",
                  csuiNonPromotedAction: false,
                  commandData: value
                });
                actions[key] = actionArr;
              });
              actions = _.map(actions, function(data, key) {
                return {
                  id: key,
                  actions: data
                };
              });
              options.success.call(options.context, actions, "success", {});
              promise.resolve();
            }).fail(function(err) {
              promise.reject(err);
            });
          }
          return promise.promise();
        }
      });
    }
  };
});