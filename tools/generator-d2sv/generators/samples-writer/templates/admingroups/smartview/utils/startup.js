define([
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/utils/url',
  'd2/sdk/utils/contexts/factories/connector',
  'd2/sdk/utils/rest.resources',
  'd2/sdk/utils/rest.linkrels',
  'd2/sdk/utils/utils',
  '<%= namespace %>/utils/constants',
  '<%= namespace %>/utils/menu.utils'
], function(_, $, Url, ConnectorFactory, RestResources, RestLinkrels, utils, constants, menuUtils){
  'use strict';

  function fetchMenuActions(connector) {
    var dfd = $.Deferred(),
      actionUrl = RestLinkrels.getLink(RestResources.getCurrentRepository().get('links'), RestLinkrels.ACTIONS);

    $.ajax(connector.extendAjaxOptions({
      url: Url.appendQuery(actionUrl, Url.combineQueryString({
        type: constants.MenuTypes.ADMIN_GROUP_CONTEXT
      })),

      success: function(response) {
        var entries = response && response.entries || [],
          entry = entries.length ? entries[0] : undefined,
          content = entry && entry.content,
          actionItems = content && content.actionItems || [];

        menuUtils.loadActionsForGroupContextMenu(actionItems);
        dfd.resolve();
      },

      error: function (xhr, textStatus, errorThrown) {
        dfd.reject(utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown));
      }
    }));

    return dfd.promise();
  }

  return {
    beforeStartup: function(options) {
      var connector = options.context.getObject(ConnectorFactory);
      return fetchMenuActions(connector);
    },

    afterStartup: function() {
      //Any code to be executed after Smartview startup
      //can return a jQuery promise to hold Smartview startup sequence until the promise is settled.
    }
  };
});
