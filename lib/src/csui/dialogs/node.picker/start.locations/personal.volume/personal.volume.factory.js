/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/dialogs/node.picker/start.locations/node.base.factory", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang" ], function(_, NodeBaseFactory, lang) {
  "use strict";
  var PersonalVolumeFactory = NodeBaseFactory.extend({
    constructor: function PersonalVolumeFactory(options) {
      options = _.defaults({
        node: {
          id: "volume",
          type: 142
        },
        icon: "csui-icon-personal-volume",
        unselectable: false,
        defaultName: lang.labelPersonalVolume
      }, options);
      NodeBaseFactory.prototype.constructor.call(this, options);
    }
  });
  return PersonalVolumeFactory;
});