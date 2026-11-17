/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/pages/start/perspective.router", "csui/utils/contexts/factories/next.version", "csui/models/node/node.model", "i18n!csui/pages/start/nls/lang", "csui/lib/underscore.string" ], function(_, PerspectiveRouter, NextVersionModelFactory, NodeModel, publicLang) {
  "use strict";
  var VersionPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      "nodes/:node_id/versions/:version_number": "openVersionPerspective"
    },
    name: "Vesion",
    constructor: function VersionPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.call(this, options);
      this.nextVersion = this.context.getModel(NextVersionModelFactory);
      this.listenTo(this.nextVersion, "change:id change:version_number", this._updateVersionUrl);
      this.listenTo(this.nextVersion, "change:name change:version_number_name", this._updateVersionPageTitle);
    },
    openVersionPerspective: function(nodeId, versionNumber) {
      if (NodeModel.usesIntegerId) {
        nodeId = parseInt(nodeId);
      }
      versionNumber = parseInt(versionNumber);
      this.nextVersion.set({
        id: nodeId,
        version_number: versionNumber
      });
    },
    _updateVersionUrl: function() {
      this.navigate("nodes/" + this.nextVersion.get("id") + "/versions/" + this.nextVersion.get("version_number"));
    },
    _updateVersionPageTitle: function() {
      if (!this.history.detached) {
        document.title = _.str.sformat(publicLang.VersionTitle, this.nextVersion.get("name"), this.nextVersion.get("version_number_name"), publicLang.ProductName);
      }
    }
  });
  return VersionPerspectiveRouter;
});