/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/contexts/factories/factory", "esoc/widgets/userwidget/model/view.simple.user.form" ], function(Backbone, ModelFactory, ViewSimpleUserFormModel) {
  return ModelFactory.extend({
    propertyPrefix: "ViewSimpleUserForm",
    constructor: function ViewSimpleUserFormFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var viewSimpleUserFormModel = options.viewSimpleUserFormModel || {};
      if (!(viewSimpleUserFormModel instanceof Backbone.Model)) {
        viewSimpleUserFormModel = new ViewSimpleUserFormModel({
          userId: this.options.userwidgetmodel.attributes.id
        }, {
          connector: this.options.connector
        });
      }
      this.property = viewSimpleUserFormModel;
    }
  });
});