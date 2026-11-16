/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  LayoutView
} from "nuc/lib/marionette";

import $ from "nuc/lib/jquery";

import _ from "nuc/lib/underscore";

import NodeModel from "nuc/models/node/node.model";

import commands from "csui/utils/commands";

import NodeCollection from "nuc/models/nodes";

import clientLocation from "dctmw/utils/client.location";

import template from "hbs!d2/widgets/viewer.perspective/impl/viewer.perspective";

import widgetConstants from "d2/utils/widget.constants";

import serverQueryUtils from "d2/utils/server.query.utils";

import iViewerUtils from "d2/commands/open.plugins/impl/iviewer/utils";

import EmptyView from "d2/widgets/miniviewer/impl/empty.view";

import lang from "i18n!d2/widgets/viewer.perspective/impl/nls/lang";

import "css!d2/widgets/viewer.perspective/impl/viewer.perspective";

class ViewerPerspectiveView extends LayoutView {
  constructor(options = {}) {
    super(options);
    this.context = options.context;
    const {
      viewStateModel
    } = this.context;
    this.connector = this.context.getObject("connector");
    this.listenTo(viewStateModel, `change:${viewStateModel.CONSTANTS.QUERY_STRING_PARAMS}`, this._refreshViewer);
    this.viewModel = new NodeModel({}, {
      connector: this.connector,
      autofetch: true
    });
    this.viewModel.skipPreview = true;
    this.listenTo(this.viewModel, "sync", this._onNodeSync);
    this.cmdInstance = commands.findWhere({
      signature: "Open"
    });
  }
  _onNodeSync() {
    const cmdStatus = {
      context: this.context,
      container: this.viewModel.parent,
      nodes: new NodeCollection([ this.viewModel ])
    }, cmdOptions = {
      context: this.context,
      containerRegion: this.viewerContainer,
      viewerOptions: {
        hideCloseButton: true,
        contentView: true
      }
    };
    var me = this;
    if (this.cmdInstance && this.cmdInstance.enabled(cmdStatus, cmdOptions)) {
      this.cmdInstance.execute(cmdStatus, cmdOptions).fail(function() {
        me._showNoPreview(me.viewModel);
      });
    } else {
      console.log("Can not view");
    }
  }
  _refreshViewer() {
    const params = clientLocation.getHashParams();
    this.viewModel.set("id", params["node"]);
    this.viewModel["viewerWidgetName"] = params["viewer-name"];
    this.viewModel["popOutWindow"] = true;
  }
  checkAndGetIVUserInfo() {
    var deferred = $.Deferred(), ivUserInfo = undefined, widgetName, widgetConfig;
    if (!ivUserInfo) {
      const params = clientLocation.getHashParams();
      widgetName = params && params["viewer-name"];
      if (widgetName) {
        widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.BRAVAIV, widgetName);
      }
      if (widgetConfig && widgetConfig.widget_type === widgetConstants.D2.BRAVAIV) {
        iViewerUtils.getIVUserInfo(this.connector).done(function(userInfo) {
          deferred.resolve(userInfo);
        }).fail(function() {
          deferred.reject();
        });
      } else {
        deferred.resolve();
      }
    } else {
      deferred.resolve();
    }
    return deferred.promise();
  }
  onShow() {
    this.checkAndGetIVUserInfo().done(function() {
      this._refreshViewer();
    }.bind(this));
  }
  _showNoPreview(node) {
    this.emptyView = new EmptyView({
      iconClass: "no-preview",
      message: _.str.sformat(lang.noPreview, node.get("name")),
      hideCloseButton: true,
      showDownloadButton: true,
      node: node,
      context: this.context
    });
    this.viewerContainer.show(this.emptyView);
  }
}

Object.assign(ViewerPerspectiveView.prototype, {
  className: "viewer-perspective",
  template: template,
  regions: {
    viewerContainer: ".viewer-container"
  }
});

Object.defineProperty(ViewerPerspectiveView.prototype.constructor, "name", {
  value: "ViewerPerspectiveView"
});

export default ViewerPerspectiveView;