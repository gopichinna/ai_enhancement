/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "i18n!d2/dialogs/new.file/create/impl/nls/lang", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/sort.utils", "d2/dialogs/new.file/create/vdoc.table.columns", "nuc/utils/deepClone/deepClone" ], function(_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, lang, RestResources, RestLinkrels, serverQueryUtils, sortUtils, VdocTemplatesColumnCollection) {
  "use strict";
  var VdocTemplateModel = Backbone.Model.extend({
    idAttribute: "id",
    parse: function(response) {
      var properties = response.content && response.content.properties;
      return {
        id: properties["r_object_id"],
        name: properties["label"] || properties["object_name"]
      };
    }
  });
  var VdocTemplateCollection = Backbone.Collection.extend({
    model: VdocTemplateModel,
    constructor: function VdocTemplateCollection(attributes, options) {
      options = options || {};
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options = _.pick(options, [ "connector", "inheritedId", "orderBy", "autoreset" ]);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
      this.columns = VdocTemplatesColumnCollection;
    },
    url: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_VD_TEMPLATES);
      url = Url.appendQuery(url, Url.combineQueryString({
        "inherited-id": this.options.inheritedId,
        inline: true
      }));
      return url;
    },
    parse: function(response) {
      return response.entries || [];
    }
  });
  ClientSideBrowsableMixin.mixin(VdocTemplateCollection.prototype);
  BrowsableV2ResponseMixin.mixin(VdocTemplateCollection.prototype);
  ConnectableMixin.mixin(VdocTemplateCollection.prototype);
  FetchableMixin.mixin(VdocTemplateCollection.prototype);
  return VdocTemplateCollection;
});