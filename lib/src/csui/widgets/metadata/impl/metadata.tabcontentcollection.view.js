/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/tab.panel/impl/tab.contents.view.v2", "csui/utils/base" ], function(_, TabContentCollectionView, base) {
  var MetadataTabContentCollectionView = TabContentCollectionView.extend({
    constructor: function MetadataTabContentCollectionView(attributes, options) {
      TabContentCollectionView.prototype.constructor.apply(this, arguments);
      _.extend(this, {
        currentlyFocusedElement: function(event) {
          var reverseDirection = event && event.shiftKey;
          var elToFocus = this.currentlyFocusedElementInternal(event);
          var totalElements = this.keyboardBehavior.tabableElements.length;
          var cursor = reverseDirection ? totalElements - 1 : 0;
          while (elToFocus.hasClass("binf-hidden") && cursor >= 0 && cursor < totalElements) {
            event.elementCursor = cursor = cursor + (reverseDirection ? -1 : 1);
            elToFocus = this.currentlyFocusedElementInternal(event);
          }
          if (!base.isElementVisibleInParent(elToFocus, this.$el, 1, 1)) {
            this.$el.scrollTop(elToFocus.offset().top);
          }
          return elToFocus;
        }
      });
    }
  });
  return MetadataTabContentCollectionView;
});