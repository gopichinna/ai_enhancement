/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/globalmessage/impl/custom.wrapper.view" ], function(SmartCustomWrapperView) {
  "use strict";
  var CustomWrapperView = SmartCustomWrapperView.extend({
    constructor: function CustomWrapperView(options) {
      SmartCustomWrapperView.prototype.constructor.call(this, options);
    }
  });
  return CustomWrapperView;
});