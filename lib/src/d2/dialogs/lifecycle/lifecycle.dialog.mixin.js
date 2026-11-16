/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/utils/rest.linkrels", "d2/controls/globalmessage/globalmessage", "dctmw/utils/utils", "d2/utils/constants" ], function(_, $, RestLinkrels, GlobalMessage, utils, constants) {
  "use strict";
  return {
    mixin: function(prototype) {
      return _.extend(prototype, {
        _init: function() {},
        _validateSignoff: function(values, node) {
          var deferred = $.Deferred(), url = RestLinkrels.getLink(node.lifeCycleStateConfig.links, RestLinkrels.D2_SIGNOFF_VALIDATION);
          if (!url) {
            deferred.reject();
          }
          var payload = {
            signoff_login: values.signoff_login,
            signoff_password: values.signoff_password
          };
          if (!_.isUndefined(values.signoff_domain)) {
            payload.signoff_domain = values.signoff_domain;
          }
          var ajaxOptions = node.connector.extendAjaxOptions({
            url: url,
            type: "POST",
            contentType: constants.MediaTypes.DCTM_JSON,
            data: JSON.stringify(payload),
            success: function() {
              deferred.resolve();
            }
          });
          var connectorError = ajaxOptions.error;
          ajaxOptions.error = function(xhr, message, statusText) {
            if (xhr.responseJSON && xhr.responseJSON.status === 401 && xhr.responseJSON.code !== "E_INVALID_AUTHENTICATION") {
              connectorError.apply(this, arguments);
            }
            deferred.reject(xhr, message, statusText);
          };
          $.ajax(ajaxOptions);
          return deferred.promise();
        },
        checkSignOffData: function(node, values, externalESignRequired) {
          var waitForValidateSignIn = $.Deferred();
          var signOffdata = {
            signoff_login: values.signoff_login,
            signoff_password: values.signoff_password,
            signoff_domain: values.signoff_domain,
            signoff_intention: values.signoff_intentions
          };
          if (node.lifeCycleStateConfig) {
            node.lifeCycleStateConfig.esign = node.lifeCycleStateConfig.esign || {};
            var newValues = _.pick(values, "signoff_login", "signoff_password");
            var oldVlaues = _.pick(node.lifeCycleStateConfig.esign, "signoff_login", "signoff_password");
            if (!_.isEqual(newValues, oldVlaues)) {
              this.options._wizard.blockActions();
              this._validateSignoff(values, node).done(function() {
                if (node.lifeCycleStateConfig["allow-bulk-processing"] && !node.lifeCycleStateConfig["signoff_each_document"]) {
                  this.options.status.nodes.forEach(function(eachNode) {
                    eachNode.lifeCycleStateConfig && (eachNode.lifeCycleStateConfig.esign = signOffdata);
                  }, this);
                } else {
                  node.lifeCycleStateConfig && (node.lifeCycleStateConfig.esign = signOffdata);
                }
                waitForValidateSignIn.resolve();
              }.bind(this)).fail(function(xhr, message, statusText) {
                node.lifeCycleStateConfig.esign = {};
                if (!externalESignRequired) {
                  GlobalMessage.showMessage("error", utils.parseAjaxErrorAsString(xhr, statusText, message));
                }
                waitForValidateSignIn.reject(xhr, message, statusText);
              }.bind(this)).always(function() {
                this.options._wizard.unblockActions();
              }.bind(this));
            } else {
              waitForValidateSignIn.resolve();
            }
          }
          return waitForValidateSignIn.promise();
        }
      });
    }
  };
});