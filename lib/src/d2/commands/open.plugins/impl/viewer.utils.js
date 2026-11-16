/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "nuc/lib/backbone", "d2/utils/constants", "dctmw/utils/rest.resources", "i18n!d2/commands/open.plugins/nls/localized.strings", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/controls/globalmessage/globalmessage", "csui/models/fileuploads" ], function($, _, Url, Backbone, constants, RestResources, lang, RestLinkrels, serverQueryUtils, GlobalMessage, MultiFileViewCollection) {
  "use strict";
  var viewerUtils = {
    isRelatePermission: function(connector, objectIds) {
      var def = $.Deferred(), currentUser = RestResources.getCurrentUser();
      if (currentUser && currentUser.attributes && currentUser.attributes.properties && currentUser.attributes.properties.client_capability === 1) {
        return def.resolve(false).promise();
      }
      var parameters = {
        ids: objectIds,
        connector: connector,
        permissions: {
          permissionLevel: constants.Permissions.RELATE
        }
      };
      serverQueryUtils.fetchDataForObjects(parameters).done(function(result) {
        var permission = _.reduce(objectIds, function(permission, objectId) {
          return permission && (result.permissions && result.permissions[objectId] && result.permissions[objectId]["base-permission"] && result.permissions[objectId]["base-permission"][constants.Permissions.RELATE]);
        }, true);
        def.resolve(permission);
      }).fail(function() {
        def.resolve(false);
      });
      return def.promise();
    },
    handleViewBinderError: function(failedPublicationDocMap, bravaiViewerView) {
      bravaiViewerView._pageRendered();
      let cloneNodes = new Backbone.Collection(Array.from(failedPublicationDocMap.keys()).map(docId => {
        let node = bravaiViewerView.options.previewNodes.find(node => node.get("i_chronicle_id") === docId);
        return node ? node.clone() : null;
      }).filter(clonedNode => clonedNode !== null));
      let contextObj = bravaiViewerView.options.context;
      let queueItems = cloneNodes.map(function(node) {
        var publicationErrorCause = failedPublicationDocMap.get(node.get("i_chronicle_id")).errorCause;
        return {
          name: node.get("name"),
          errorMessage: publicationErrorCause ? publicationErrorCause : lang.IVGenericPublicationError,
          state: "rejected",
          node: node,
          context: contextObj,
          originatingView: this,
          actionType: "PUBLICATIONERROR-" + _.uniqueId()
        };
      });
      var collection = new MultiFileViewCollection(queueItems, {
        connector: cloneNodes.at(0).connector
      });
      collection.each(function(item) {
        item.node = item.get("node");
        item.node.set("mime_type", item.node.get("mime_type") === undefined ? item.node.get("type") : item.node.get("mime_type"));
        item.unset("node");
      });
      var msgOpts = {
        multiFileFailure: _.str.sformat(lang.IVDocumentViewBinderError, failedPublicationDocMap.size),
        actionType: "DELETE"
      };
      GlobalMessage.showProgressPanel(collection, msgOpts);
    }
  };
  return viewerUtils;
});