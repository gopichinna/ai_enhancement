/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/form/fields/textareafield.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior" ], function(TextAreaFieldView, TabableRegionBehavior) {
  "use strict";
  var SourceDialogTextAreaFieldView = TextAreaFieldView.extend({
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    onAfterShow: function() {
      this.$el.find("*[tabindex]").prop("tabindex", 0);
      this.currentlyFocusedElement().focus();
    },
    onDomRefresh: function() {
      this.refreshFocusEngage();
    },
    currentlyFocusedElement: function() {
      return this.focusables[0];
    },
    refreshFocusEngage: function() {
      this.focusables = this.$el.find("textarea").filter(function(index, elem) {
        return elem.offsetWidth && elem.offsetHeight;
      });
    },
    onLastTabElement: function() {
      this.refreshFocusEngage();
      return this.currentlyFocusedElement();
    }
  });
  return SourceDialogTextAreaFieldView;
});