/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/userpicker/roles/user.view", "csui/controls/userpicker/roles/group.view" ], function(UserView, GroupView) {
  "use strict";
  return [ {
    type: 0,
    viewClass: UserView
  }, {
    type: 1,
    viewClass: GroupView
  } ];
});