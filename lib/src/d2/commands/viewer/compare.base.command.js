/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "csui/models/command", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/widget.constants" ], function($, Backbone, _, CommandModel, RestResources, serverQueryUtils, widgetConstants) {
  "use strict";
  var notSupportedExtensions = {
    mp3: "mp3",
    mp4: "mp4",
    F4V: "F4V",
    MOV: "MOV",
    m4v: "m4v",
    "mpeg-4v": "mpeg-4v",
    "3gp": "3gp",
    dat: "dat"
  };
  var supportedExtensionsForTextCompare = {
    pdf: "pdf",
    txt: "txt"
  };
  var CompareBaseCommand = CommandModel.extend({
    constructor: function CompareBaseCommand() {
      this.previewNodes = new Backbone.Collection();
      this.listenTo(this.previewNodes, "update:viewer:markup:count", function(markupCounts) {
        this.previewNodes.originalNodes.each(function(node) {
          var objData = markupCounts[node.get("id")];
          if (node.get("viewer_markup_count") != objData.markup_count) {
            node.set("viewer_markup_count", objData.markup_count);
          }
        });
      });
      CommandModel.prototype.constructor.call(this, arguments);
    },
    getAllNotSupportedContentTypes: function(iViewer) {
      var contentTypes = [], formatCollection;
      if (this.allNotSupportedContentTypes) {
        return this.allNotSupportedContentTypes;
      }
      var nonSupportedTypes = notSupportedExtensions;
      if (iViewer) {
        var types = this.getTypesFromWidgetParam("iv_g_compare_format_unsupported");
        if (!_.isEmpty(types)) {
          nonSupportedTypes = types;
        }
      }
      formatCollection = RestResources.getFormats();
      if (formatCollection && !_.isEmpty(formatCollection)) {
        formatCollection.each(function(data) {
          if (nonSupportedTypes[data.get("dos_extension")]) {
            contentTypes.push(data.get("name"));
          }
        });
      }
      this.allNotSupportedContentTypes = contentTypes;
      return contentTypes;
    },
    getAllSupportedContentTypesForGraphicalCompare: function(iViewer) {
      var contentTypes = {}, supportedTypes = {}, formatCollection;
      if (this.allSupportedContentTypesForGraphicalCompare) {
        return this.allSupportedContentTypesForGraphicalCompare;
      }
      if (iViewer) {
        supportedTypes = this.getTypesFromWidgetParam("iv_g_compare_format");
      }
      formatCollection = RestResources.getFormats();
      if (formatCollection && !_.isEmpty(formatCollection)) {
        formatCollection.each(function(data) {
          if (iViewer) {
            if (supportedTypes && supportedTypes[data.get("dos_extension")]) {
              contentTypes[data.get("name")] = data.get("name");
            }
          } else {
            if (!notSupportedExtensions[data.get("dos_extension")]) {
              contentTypes[data.get("name")] = data.get("name");
            }
          }
        });
      }
      this.allSupportedContentTypesForGraphicalCompare = contentTypes;
      return contentTypes;
    },
    getAllSupportedContentTypesForTextCompare: function(iViewer) {
      var contentTypes = {}, formatCollection;
      if (this.allSupportedContentTypesForTextCompare) {
        return this.allSupportedContentTypesForTextCompare;
      }
      formatCollection = RestResources.getFormats();
      var supportedTypes = supportedExtensionsForTextCompare;
      if (iViewer) {
        supportedTypes = this.getTypesFromWidgetParam("iv_t_compare_format");
      }
      if (formatCollection && !_.isEmpty(formatCollection)) {
        formatCollection.each(function(data) {
          if (supportedTypes && supportedTypes[data.get("dos_extension")]) {
            contentTypes[data.get("name")] = data.get("name");
          }
        });
      }
      this.allSupportedContentTypesForTextCompare = contentTypes;
      return contentTypes;
    },
    getContentType: function(node) {
      return node.get("aContentType") || node.get("a_content_type");
    },
    getTypesFromWidgetParam: function(param) {
      var formatTypes = {}, userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets");
      var ivWidgetConfiguration = null;
      if (userDefaultWidgets && !_.isEmpty(userDefaultWidgets)) {
        ivWidgetConfiguration = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, userDefaultWidgets[widgetConstants.DEFAULT.BRAVAIV]);
        var types = ivWidgetConfiguration["widgetParams"] && ivWidgetConfiguration["widgetParams"][param];
        types = types && types.split(",");
        if (types && types.length > 0) {
          formatTypes = _.reduce(types, function(result, value) {
            result[value.trim()] = value.trim();
            return result;
          }, {});
        }
      }
      return formatTypes;
    },
    _blockActions: function(status) {
      if (status && status.originatingView && status.originatingView.blockActions) {
        status.originatingView.blockActions();
      } else {
        $("div.load-container.csui-global").removeClass("binf-hidden");
      }
    },
    _unblockActions: function(status) {
      if (status && status.originatingView && status.originatingView.unblockActions) {
        status.originatingView.unblockActions();
      } else {
        $("div.load-container.csui-global").addClass("binf-hidden");
      }
    }
  });
  return CompareBaseCommand;
});