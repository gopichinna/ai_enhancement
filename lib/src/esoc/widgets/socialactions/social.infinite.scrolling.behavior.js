/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/tile/behaviors/infinite.scrolling.behavior" ], function(InfiniteScrollingBehavior) {
  "use strict";
  var SocialInfiniteScrollingBehavior = InfiniteScrollingBehavior.extend({
    _checkScrollPositionFetch: function() {
      var commentsContainer = this._content;
      var containerHeight = commentsContainer.height();
      var containerScrollHeight = commentsContainer[0].scrollHeight;
      var containerScrollTop = commentsContainer.scrollTop();
      if (containerScrollTop + 30 >= containerScrollHeight - containerHeight) {
        this._content.find(".esoc-social-comment-load-more:last").trigger("click");
      }
    }
  });
  return SocialInfiniteScrollingBehavior;
});