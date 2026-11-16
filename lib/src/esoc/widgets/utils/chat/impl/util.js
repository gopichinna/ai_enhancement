/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "i18n!esoc/widgets/utils/chat/impl/nls/lang", "esoc/widgets/common/util" ], function(module, $, _, Lang, CommonUtil) {
  var Utils = {
    lang: Lang,
    commonUtil: CommonUtil,
    launchChatWindow: function(options) {
      var uriPrefix = options.uriPrefix ? options.uriPrefix : CommonUtil.globalConstants.URI_PREFIX, uri = uriPrefix + CommonUtil.globalConstants.URI_DELIMITER + options.tguser + CommonUtil.globalConstants.AT_SIGN_SYMBOL + options.domain;
      window.location = uri;
    }
  };
  return Utils;
});