/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url", "csui/models/form", "csui/lib/moment", "csui/models/mixins/resource/resource.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "esoc/widgets/userwidget/util" ], function(_, Url, FormModel, moment, ResourceMixin, FetchableMixin, Util) {
  "use strict";
  var ViewSimpleUserFormModel = FormModel.extend({
    util: Util,
    constructor: function ViewSimpleUserFormModel(attributes, options) {
      FormModel.prototype.constructor.apply(this, arguments);
      this.makeResource(options);
    },
    clone: function() {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },
    url: function() {
      var url = Url.combine(this.connector.connection.url, "forms", "users", this.attributes.userId, "view");
      return url;
    },
    parse: function(response) {
      var form = !!response.forms && response.forms[0];
      return form;
    }
  });
  ResourceMixin.mixin(ViewSimpleUserFormModel.prototype);
  FetchableMixin.mixin(ViewSimpleUserFormModel.prototype);
  return ViewSimpleUserFormModel;
});