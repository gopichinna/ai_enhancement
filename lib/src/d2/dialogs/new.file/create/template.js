/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "dctmw/server.adaptors/converters/node" ], function(_, Backbone, nodeConverter) {
  "use strict";
  var TemplateModel = Backbone.Model.extend({
    idAttribute: "id",
    constructor: function TemplateModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.thumbnail = {
        imgUrl: this.attributes.url
      };
      this.actions = new Backbone.Model();
    },
    parse: function(response) {
      var content = response.content;
      var properties = _.extend({}, _.omit(response, "content"), content, {
        id: content["r_object_id"]
      });
      properties.mime_type = nodeConverter.getMimeType(properties.preview_mime);
      properties.a_content_type = properties.preview_mime;
      properties.url = properties.preview_url;
      properties.type = 144;
      properties.name = properties.object_name;
      properties.subject = properties.description;
      properties.template_object_name = properties.object_name;
      properties.template_title = properties.title;
      properties.template_subject = properties.description;
      if (properties.preview_mime === "vd") {
        properties.r_is_virtual_doc = 1;
      }
      properties.wnd_comments = 0;
      return properties;
    }
  });
  return TemplateModel;
});