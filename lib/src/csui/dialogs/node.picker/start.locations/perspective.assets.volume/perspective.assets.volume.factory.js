/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/dialogs/node.picker/start.locations/node.base.factory", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang" ], function(_, NodeBaseFactory, lang) {
  "use strict";
  var PerspectiveAssetsVolumeFactory = NodeBaseFactory.extend({
    constructor: function PerspectiveAssetsVolumeFactory(options) {
      options = _.defaults({
        node: {
          id: "volume",
          type: 954
        },
        unselectable: true,
        icon: "csui-icon-perspective-assets-volume",
        defaultName: lang.labelPerspectiveAssetsVolume
      }, options);
      NodeBaseFactory.prototype.constructor.call(this, options);
    }
  });
  return PerspectiveAssetsVolumeFactory;
});