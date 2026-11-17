/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/controls/listitem/listitemstandard.view", "css!dctmw/controls/list/impl/listitem" ], function(_, ListItemTypeModelViewImpl) {
  "use strict";
  var ListItemTypeModelView = ListItemTypeModelViewImpl.extend({
    className: function() {
      var clazz = "d2-listitem ";
      clazz += ListItemTypeModelView.__super__.className.call(this);
      return clazz;
    },
    constructor: function ListItemTypeModelView(options) {
      options = options || {};
      ListItemTypeModelView.__super__.constructor.call(this, options);
    },
    onRender: function() {
      var superMethod = ListItemTypeModelView.__super__.onRender;
      _.isFunction(superMethod) && superMethod.apply(this, arguments);
      var notClickable = !this.model || !this.defaultActionController.hasAction(this.model);
      this.$el[notClickable ? "addClass" : "removeClass"]("no-click");
    }
  });
  return ListItemTypeModelView;
});