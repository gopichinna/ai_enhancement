/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "i18n!csui/widgets/metadata/impl/nls/lang", "d2/utils/rest.linkrels", "d2/widgets/metadata/utils/form.converter", "csui/models/form", "nuc/models/mixins/node.resource/node.resource.mixin" ], function($, _, lang, RestLinkrels, MetadataConverter, FormModel, NodeResourceMixin) {
  "use strict";
  var D2GeneralFormModel = FormModel.extend({
    constructor: function D2GeneralFormModel(attributes, options) {
      FormModel.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options);
    }
  });
  NodeResourceMixin.mixin(D2GeneralFormModel.prototype);
  return D2GeneralFormModel;
});