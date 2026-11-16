/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "dctmw/utils/constants", "d2/utils/url.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandModel, CommandHelper, Constants, urlUtils, lang) {
  "use strict";
  var config = {
    linkSeparator: "\r\n"
  };
  const documentOverviewCandidates = [ Constants.Types.DOCUMENT, Constants.Types.EMAIL ];
  var CopyLinkCommand = CommandModel.extend({
    defaults: {
      signature: "CopyLink",
      command_key: "CopyLink",
      name: lang.CommandNameCopyLink,
      scope: "multiple"
    },
    execute: function(status) {
      var deferred = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), success = false;
      if (nodes.length) {
        var nodeUrls = urlUtils.injectAuthInfoInURL(nodes.map(node => {
          return this.appendParams(node, urlUtils.getNodeUrl(node), status);
        })).join(config.linkSeparator);
        success = this._copyToClipboard(nodeUrls);
      }
      require([ "d2/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        if (success) {
          deferred.resolve();
          GlobalMessage.showMessage("success", _.str.sformat(nodes.length > 1 ? lang.CopyLinkSuccessMessagePlural : lang.CopyLinkSuccessMessage, nodes.length));
        } else {
          deferred.reject();
          GlobalMessage.showMessage("error", _.str.sformat(nodes.length > 1 ? lang.CopyLinkFailMessagePlural : lang.CopyLinkFailMessage, nodes.length));
        }
      }, deferred.reject);
      return deferred.promise();
    },
    appendParams: function(node, url, status) {
      let launchViewerKey = Constants.UrlParams.OVERVIEW_PERSPECTIVE_LAUNCH_VIEWER_IF_CURRENT, preventAutoVersionSwitchKey = Constants.UrlParams.OVERVIEW_PERSPECTIVE_PREVENT_AUTO_VERSION_SWITCH, canIncludeParam = documentOverviewCandidates.includes(node?.get("type")), commandData = CommandHelper.getOriginalAction(node, this.get("signature"), status.data)?.get("commandData"), urlParamConfig = $.parseParam(commandData?.add_url_params), params = {};
      if (canIncludeParam) {
        urlParamConfig[launchViewerKey] === "true" && (params[launchViewerKey] = true);
        urlParamConfig[preventAutoVersionSwitchKey] === "true" && (params[preventAutoVersionSwitchKey] = true);
      }
      let additionParamStr = $.param(params);
      return additionParamStr ? url + `?${additionParamStr}` : url;
    },
    _copyToClipboard: function(nodeLink) {
      if (window.clipboardData) {
        window.clipboardData.setData("Text", nodeLink);
        return true;
      } else {
        var success = false, element = document.createTextNode(nodeLink), elParent = document.createElement("span");
        elParent.style.color = "black";
        elParent.style.background = "tranparent";
        elParent.style.backgroundColor = "white";
        elParent.style.whiteSpace = "pre";
        elParent.appendChild(element);
        document.body.appendChild(elParent);
        if (window.getSelection) {
          var selection = window.getSelection();
          selection.removeAllRanges();
          var range = document.createRange();
          range.selectNodeContents(element);
          selection.addRange(range);
          success = document.execCommand("copy");
          selection.removeAllRanges();
        }
        document.body.removeChild(elParent);
        return success;
      }
    }
  });
  return CopyLinkCommand;
});