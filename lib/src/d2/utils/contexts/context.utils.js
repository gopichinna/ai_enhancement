/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/page/page.context", "dctmw/utils/authenticators/session" ], function(PageContext, Session) {
  "use strict";
  return {
    createPageContext: function() {
      return new PageContext();
    },
    getPerspectiveContext: function() {
      return Session.get().getContext();
    }
  };
});