/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "csui/models/command", "csui/utils/command.error", "csui/utils/commandhelper", "d2/controls/globalmessage/globalmessage", "nuc/utils/url", "dctmw/lib/uri-templates", "dctmw/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/url.utils", "i18n!csui/utils/commands/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function($, CommandModel, CommandError, CommandHelper, GlobalMessage, Url, UriTemplates, Constants, RestLinkrels, RestResources, utils, urlUtils, lang, d2Lang) {
  "use strict";
  const documentOverviewCandidates = [ Constants.Types.DOCUMENT, Constants.Types.EMAIL ];
  var EmailLinkCommand = CommandModel.extend({
    defaults: {
      signature: "EmailLink",
      command_key: "EmailLink",
      name: lang.CommandNameEmailLink,
      verb: lang.CommandVerbEmailLink
    },
    execute: function(status) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), self = this, globalHref = null, locate_url = null, appleNodeLinkBase = "x-otm-as-d2mobile://?launchUrl=nodes/", NEW_LINE = "\n", TWO_LINES = "\n\n", appleURL = "", appleLinkDesc = d2Lang.EmailAppleLinkFormat, error, connector = status.container ? status.container.connector : status.collection.connector;
      if (nodes.length > 1) {
        locate_url = self._mapNodes(nodes, status);
        globalHref = decodeURIComponent(this._getEmailConfigUrl());
      } else {
        nodes.map(node => {
          globalHref = RestLinkrels.getLink(node.get("links"), RestLinkrels.SEND_MAIL) + "?locate_url=";
          locate_url = encodeURIComponent(urlUtils.injectAuthInfoInURL(this._appendParams(node, urlUtils.getNodeUrl(node), status)));
        });
      }
      if (utils.isMobile()) {
        var appleNodeLinks = "";
        appleURL = nodes.length > 1 ? NEW_LINE : TWO_LINES;
        appleURL += appleLinkDesc + TWO_LINES;
        nodes.map(function(node) {
          appleNodeLinks += node.get("name") + NEW_LINE + appleNodeLinkBase + node.get("id") + TWO_LINES;
        });
        appleURL += appleNodeLinks;
      }
      self._getconfig(globalHref, locate_url, connector).done(function(promises) {
        var resultSet = promises, newHref = "mailto:?subject=" + encodeURIComponent(resultSet.subject) + "&body=" + encodeURIComponent(resultSet.message);
        if (utils.isMobile()) {
          newHref += encodeURIComponent(appleURL);
        }
        error = self._openNewHref(newHref);
        if (error) {
          if (utils.isMobile()) {
            GlobalMessage.showMessage("error", error);
            deferred.reject();
          } else {
            deferred.reject(error);
          }
        } else {
          deferred.resolve();
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _getEmailConfigUrl: function() {
      var templateUrl = RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_SEND_EMAIL_CONFIG);
      if (templateUrl) {
        var templateParams = {
          id: "default?"
        }, template = new UriTemplates(templateUrl);
        return template.fill(templateParams);
      }
    },
    _openNewHref: function(newHref) {
      if (newHref.length > 2046) {
        return new CommandError(lang.EmailLinkCommandFailedWithTooMuchItemsErrorMessage);
      } else {
        utils.launchUrlInIframe(newHref);
      }
    },
    _mapNodes: function(nodes, status) {
      var nodeMap = nodes.map(node => {
        var locate_url = encodeURIComponent(urlUtils.injectAuthInfoInURL(this._appendParams(node, urlUtils.getNodeUrl(node), status))), object_names = encodeURIComponent(node.get("name"));
        return "object_names=" + object_names + "&locate_urls=" + locate_url;
      });
      return nodeMap.join("&");
    },
    _appendParams: function(node, url, status) {
      let launchViewerKey = Constants.UrlParams.OVERVIEW_PERSPECTIVE_LAUNCH_VIEWER_IF_CURRENT, preventAutoVersionSwitchKey = Constants.UrlParams.OVERVIEW_PERSPECTIVE_PREVENT_AUTO_VERSION_SWITCH, canIncludeParam = documentOverviewCandidates.includes(node?.get("type")), commandData = CommandHelper.getOriginalAction(node, this.get("signature"), status.data)?.get("commandData"), urlParamConfig = $.parseParam(commandData?.add_url_params), params = {};
      if (canIncludeParam) {
        urlParamConfig[launchViewerKey] === "true" && (params[launchViewerKey] = true);
        urlParamConfig[preventAutoVersionSwitchKey] === "true" && (params[preventAutoVersionSwitchKey] = true);
      }
      let additionParamStr = $.param(params);
      return additionParamStr ? url + `?${additionParamStr}` : url;
    },
    _getconfig: function(href, query_url, connector) {
      var configData, deferred = $.Deferred();
      $.ajax(connector.extendAjaxOptions({
        url: href + query_url,
        type: "GET",
        success: function(response) {
          configData = {
            subject: response.properties.subject,
            message: response.properties.message
          };
          deferred.resolve(configData);
        },
        error: function(request, textStatus, error) {
          deferred.reject(new CommandError(error));
        }
      }));
      return deferred.promise();
    }
  });
  return EmailLinkCommand;
});