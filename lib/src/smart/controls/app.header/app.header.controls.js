/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui-ext!smart/controls/app.header/app.header.controls" ], function(module, _, Backbone, extraAppControls) {
  "use strict";
  var config = module.config();
  var logo = new Backbone.Collection([]);
  var flattenAppControls = _.flatten(extraAppControls);
  flattenAppControls && flattenAppControls.forEach((control, index) => {
    if (control.type === "logo") {
      logo.add(control);
      flattenAppControls.splice(index, 1);
    }
  });
  var appControls = new Backbone.Collection([], {
    comparator: "sequence"
  });
  flattenAppControls && appControls.add(_.flatten(flattenAppControls, true));
  var masks = _.reduce(_.values(config.masks || {}), function(result, mask) {
    return {
      blacklist: result.blacklist.concat(mask.blacklist || []),
      whitelist: result.whitelist.concat(mask.whitelist || [])
    };
  }, {
    blacklist: [],
    whitelist: []
  });
  masks = {
    blacklist: _.unique(masks.blacklist),
    whitelist: _.unique(masks.whitelist)
  };
  function filterComponentByMask(component) {
    return !_.contains(masks.blacklist, component.id) && (!masks.whitelist.length || _.contains(masks.whitelist, component.id));
  }
  appControls.remove(appControls.reject(filterComponentByMask));
  return {
    logo: logo,
    rightSide: appControls
  };
});