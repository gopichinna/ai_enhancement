/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery" ], function(require, _, $) {
  "use strict";
  var WIDGET_VIEW = "d2/dialogs/document.preview/document.preview.view", shouldShowPreview = function(node) {
    if (node.skipPreview === true) {
      return false;
    }
    var basePermission = node.get("basePermissions");
    if (basePermission && basePermission["read"] === false) {
      return false;
    }
    var openAction = node.actions.find({
      signature: "D2-Viewer"
    });
    return openAction && !!openAction.get("isMiniView") || node.forcePreview === true;
  };
  return {
    mixin: function(proto) {
      var PluginClass = proto.constructor;
      PluginClass["shouldShowPreview"] = shouldShowPreview;
      return _.extend(proto, {
        widgetView: WIDGET_VIEW,
        isPreviewPlugin: true,
        ViewerClassPath: "d2/commands/open.plugins/impl/csr.preview.view",
        isSupported: PluginClass.isSupported,
        getUrl: function() {},
        open: function(options) {
          return this._openDocumentPreview(options);
        },
        _openDocumentPreview: function(options) {
          options = options || {};
          if (options.highlightElement === false) {
            delete options.highlightElement;
          } else {
            if (!options.highlightElement && event) {
              options.highlightElement = $(event.target).closest("tr");
            }
          }
          var dfd = $.Deferred();
          require([ WIDGET_VIEW ], function(DocumentPreview) {
            DocumentPreview.show({
              context: options.context,
              node: options.node,
              nodes: options.nodes,
              highlightElement: options.highlightElement,
              widgetDetails: options.widgetDetails,
              widgetPreference: options.node.collection?.widgetPreference
            }).done(dfd.resolve).fail(dfd.reject);
          }, dfd.reject);
          return dfd.promise();
        }
      });
    }
  };
});