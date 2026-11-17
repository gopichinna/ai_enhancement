/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/letter-avatar-random-color/letter-avatar-colors" ], function(_, LetterAvatarColor) {
  var UserAvatarColor = {
    getUserAvatarColor: function(user) {
      if (!user || _.isEmpty(user)) {
        return "";
      }
      var initials = user.initials && user.initials.length > 1 ? user.initials : user.name ? user.name.substring(0, 2) : "";
      return LetterAvatarColor.getLetterAvatarColor(initials);
    }
  };
  return UserAvatarColor;
});