/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  var config = {
    colors: [ "#414979", "#2e3d98", "#4f3690", "#e00051", "#006353", "#007599", "#147bbc", "#a0006b", "#ba004C" ]
  };
  var LetterAvatarColor = {
    getLetterAvatarColor: function(initials) {
      if (!initials) {
        return "";
      }
      var charIndex = 0, colourIndex = 0, initialsLen = initials.length;
      initials = initials.toUpperCase();
      for (var i = 0; i < initialsLen; i++) {
        charIndex += initials.charCodeAt(i);
      }
      colourIndex = parseInt(charIndex.toString().split("").pop());
      colourIndex = colourIndex === 9 ? colourIndex - 1 : colourIndex;
      return config.colors[colourIndex];
    }
  };
  return LetterAvatarColor;
});