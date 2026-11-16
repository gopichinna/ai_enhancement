/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/dialogs/node.picker/start.locations/node.base.factory", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang" ], function(_, NodeBaseFactory, lang) {
  "use strict";
  var CategoryVolumeFactory = NodeBaseFactory.extend({
    constructor: function CategoryVolumeFactory(options) {
      options = _.defaults({
        node: {
          id: "volume",
          type: 133
        },
        unselectable: true,
        icon: "csui-icon-category-volume",
        defaultName: lang.labelCategoryVolume
      }, options);
      NodeBaseFactory.prototype.constructor.call(this, options);
    }
  });
  return CategoryVolumeFactory;
});