/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/lib/uri-templates'
], function(UriTemplatesImpl){
  'use strict';

  /**
   * Utility to help with parameter substitution for templatized URIs while turning it into an
   * accessible URI.
   *
   * @example <caption>Sample use</caption>
   * define([
   *  'd2/sdk/utils/rest.linkrels',
   *  'd2/sdk/utils/rest.resources',
   *  'd2/sdk/utils/uri.templates'
   * ], function(RestLinkrels, RestResources, UriTemplates){
   *  'use strict';
   *
   *  var LINKREL_SEND_MAIL_CFG = 'http://identifiers.emc.com/linkrel/d2-sendmail-config';
   *
   *  function getMailConfigURL() {
   *    var templateUrl = RestLinkrels.getLinkTemplate(RestResources.getCurrentRepository().get('links'), LINKREL_SEND_MAIL_CFG);
   *    if (templateUrl) {
   *      var params = {
   *        'id': "default?"
   *      }, template = new UriTemplates(templateUrl);
   *
   *      return template.fill(params);
   *    }
   *  }
   *
   *  return {
   *    getMailConfigURL: getMailConfigURL
   *  };
   * });
   *
   * @module {d2/sdk/utils/uri.templates} d2/sdk/utils/"uri.templates"
   * @name UriTemplates
   *
   */

  /**
   * @constructs
   * @name UriTemplates
   * @alias module:UriTemplates
   * @param {string} templatizedUri - Templatized URI, which will later be turned into accessible URI.
   */

  var UriTemplates = UriTemplatesImpl;

  /**
   * @function
   * @name fill
   * @description Substitute template parameters with their values.
   * @param {object} templateParams - An object hash containing key-value pairs. All matching keys from the URI is replaced with the key's corresponding value.
   * @returns {String} Returns the accessible URI.
   * @instance
   */

  return UriTemplates;
});