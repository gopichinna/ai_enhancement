/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  Collection
} from "nuc/lib/backbone";

import {
  LayoutView
} from "nuc/lib/marionette";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import LayoutViewEventsPropagationMixin from "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import ConnectorFactory from "csui/utils/contexts/factories/connector";

import BusinessWorkspaceModelFactory from "d2/utils/contexts/factories/bws.model.factory";

import commands from "csui/utils/commands";

import RestLinkrels from "d2/utils/rest.linkrels";

import constants from "d2/utils/constants";

import BWNodesTableView from "d2/widgets/business.workspace/impl/bws.nodestable.view";

import BWSHeaderInfoView from "d2/widgets/business.workspace/impl/bws.header.info.view";

import BWToolBarView from "d2/widgets/business.workspace/impl/bws.toolbar.view";

import BWSHeaderFormView from "d2/widgets/business.workspace/impl/bws.metadata.form.view";

import BWSToolbarItems from "d2/widgets/business.workspace/toolbar/toolbaritems";

import BWSToolbarItemsMasks from "d2/widgets/business.workspace/toolbar/toolbaritems.masks";

import utils from "dctmw/utils/utils";

import widgetUtils from "d2/utils/widgets.utils";

import template from "hbs!d2/widgets/business.workspace/impl/business.workspace";

import "css!d2/widgets/business.workspace/impl/business.workspace";

const headerStateOpts = {
  expanded: "expanded",
  collapsed: "collapsed"
};

class BusinessWorkSpacePerspectiveView extends LayoutView {
  constructor(options = {}) {
    super(options);
    this.businessWorkspaceModel = this.options.context.getObject(BusinessWorkspaceModelFactory, options);
    options.businessWorkspaceModel = this.businessWorkspaceModel;
    let toolbarItemsMask = new BWSToolbarItemsMasks();
    options.toolbarItems = BWSToolbarItems.clone();
    options.toolbarItemsMasks = toolbarItemsMask;
    options.headermenuItems = BWSToolbarItems.clone();
    options.headermenuItemsMask = toolbarItemsMask.toolbars.headerMenuToolbar;
    this.nodestableView = new BWNodesTableView(options);
    this.businessWorkspaceModel.once("sync", this._renderBusinessWorkspace.bind(this));
    this.propagateEventsToRegions();
    if (this.nodestableView?.collection?.node) {
      let nodesTableCollection = this.nodestableView.collection, containerNode = nodesTableCollection.node, widgetPreference = containerNode.get("widgetPreference"), d2ActionsOptions = widgetPreference && {
        menuType: constants.MenuTypes.BWS_ITEMS,
        widgetType: widgetPreference.widgetType
      };
      if (d2ActionsOptions) {
        if (!nodesTableCollection.options) {
          nodesTableCollection.options = {};
        }
        nodesTableCollection.options.d2ActionsOptions = d2ActionsOptions;
        nodesTableCollection.delayedActions.widgetType = d2ActionsOptions.widgetType;
        nodesTableCollection.delayedActions.menuType = d2ActionsOptions.menuType;
        nodesTableCollection.setNonPromotedActionsOptions(d2ActionsOptions);
      }
    }
  }
  _renderWorkspaceView() {
    this._renderWorkspaceHeader();
    this.setInitialStateForBWSHeader();
  }
  onRender() {
    if (this.businessWorkspaceModel.fetched) {
      this._renderWorkspaceView();
    }
    this._renderWorkspaceTable();
  }
  getWidgetPreference() {
    return this.businessWorkspaceModel.get("widgetPreference");
  }
  onDomRefresh() {
    this.$el.closest(".cs-perspective.cs-flow-perspective").addClass("workspace-perspective");
  }
  _showBWSHeaderInfoView() {
    let bwsHeaderInfoView = new BWSHeaderInfoView({
      model: this.businessWorkspaceModel
    });
    this.bwsHeaderInfoRegion.show(bwsHeaderInfoView);
  }
  _renderWorkspaceHeader() {
    this._showBWSHeaderInfoView();
    this._showTypeIconForBWS();
    this._showActionsForBWS();
    if (this._isMoreDetailsExpanded()) {
      this._fetchPropertyPage().done(formContent => {
        this._initializeWSHeaderFormView(formContent);
      });
    }
  }
  _fetchPropertyPage() {
    let dfd = $.Deferred(), cachedFormContent = this.getCachedFormContent();
    if (cachedFormContent) {
      dfd.resolve(cachedFormContent);
    } else {
      let connector = this.getConnector(), self = this;
      $.ajax(connector.extendAjaxOptions({
        url: RestLinkrels.getLink(this.businessWorkspaceModel.get("links"), RestLinkrels.PROPERTY_PAGE),
        type: "GET",
        headers: {
          Accept: constants.MediaTypes.DCTM_D2_V1_JSON,
          "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
        },
        success: function(resp) {
          self.setCachedFormContent(resp["page-content"]);
          dfd.resolve(resp["page-content"]);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
    }
    return dfd.promise();
  }
  _isMoreDetailsExpanded() {
    return this.retrieveBWSHeaderStateInfo("bwsHeader") === headerStateOpts.expanded;
  }
  getConnector() {
    return this.options.context.getObject(ConnectorFactory);
  }
  getNodeLinks() {
    return this.businessWorkspaceModel.get("links");
  }
  getCachedFormContent() {
    return this.cachedFormContent;
  }
  setCachedFormContent(cachedFormContent) {
    this.cachedFormContent = cachedFormContent;
  }
  _initializeWSHeaderFormView(formContent) {
    this._renderWSFormView(formContent);
    this._trackPropertyPageChange();
  }
  _renderWSFormView(formContent) {
    if (!this.wsFormView) {
      let options = {
        formMode: "read",
        nodeLinks: this.getNodeLinks(),
        connector: this.getConnector(),
        forceStopFormResponsive: true,
        formContent: formContent,
        model: this.businessWorkspaceModel
      };
      this.wsFormView = new BWSHeaderFormView(options);
      this.showOTCFormView();
      this.listenTo(this.wsFormView, "ontoggle:metadata:content", () => {
        this._showMetadataForBWS();
      });
    }
  }
  showOTCFormView() {
    this.wsFormView && this.bwsBasicMetadata.show(this.wsFormView);
  }
  _checkAndInitializeWSHeaderForm() {
    this._fetchPropertyPage().done(formContent => {
      this._initializeWSHeaderFormView(formContent);
    });
  }
  _renderWorkspaceTable() {
    this.bwsTableRegion.show(this.nodestableView);
  }
  _renderBusinessWorkspace(model, response, options) {
    if (options?.xhr?.settings?.type !== "DELETE") {
      this._renderWorkspaceView();
    }
  }
  _trackPropertyPageChange() {
    this.listenTo(this.businessWorkspaceModel, "change", () => {
      this.wsFormView.trigger("property:page:field:changed", this.businessWorkspaceModel);
    });
  }
  _showTypeIconForBWS() {
    let nodeTypeIconView = new NodeTypeIconView({
      node: this.businessWorkspaceModel,
      originatingView: this
    });
    this.bwsTypeIconRegion.show(nodeTypeIconView);
  }
  _showActionsForBWS() {
    let toolBarView = new BWToolBarView(_.defaults({
      businessWorkspaceModel: this.businessWorkspaceModel,
      originatingView: this,
      context: this.options.context
    }, this.options, {
      originatingView: this
    }));
    this.bwsActionsRegion.show(toolBarView);
    toolBarView.$el.find(".binf-dropdown a.binf-dropdown-toggle").attr("tabindex", 0);
  }
  _showMetadataForBWS() {
    let bwsPropertiesCommand = commands.get("BWS-Properties");
    if (bwsPropertiesCommand) {
      bwsPropertiesCommand.execute({
        container: this.businessWorkspaceModel,
        originatingView: this,
        context: this.options.context,
        nodes: new Collection(this.businessWorkspaceModel)
      });
    }
  }
  onClickBWSHeaderExpandCollapseButton() {
    if (this.ui.bwsMoreInfo.hasClass("binf-hidden")) {
      this.ui.bwsMoreInfo.removeClass("binf-hidden");
      this.ui.bwsHeaderExpandCollapseButton.attr("icon", "action:action_caret_close_all32");
      this.storeBWSHeaderStateInfo("bwsHeader", headerStateOpts.expanded);
      this._checkAndInitializeWSHeaderForm();
    } else {
      this.ui.bwsMoreInfo.addClass("binf-hidden");
      this.ui.bwsHeaderExpandCollapseButton.attr("icon", "action:action_caret_open_all32");
      this.storeBWSHeaderStateInfo("bwsHeader", headerStateOpts.collapsed);
    }
  }
  setInitialStateForBWSHeader() {
    const state = this.retrieveBWSHeaderStateInfo("bwsHeader");
    if (state === headerStateOpts.collapsed || state === undefined) {
      this.ui.bwsMoreInfo.addClass("binf-hidden");
      this.ui.bwsHeaderExpandCollapseButton.attr("icon", "action:action_caret_open_all32");
    }
  }
  storeBWSHeaderStateInfo(groupKey, state) {
    var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
    var key = widgetUtils.getRepoUserName() + "_" + groupKey;
    namedLocalStorage.set(key, state);
  }
  retrieveBWSHeaderStateInfo(groupKey) {
    var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
    var key = widgetUtils.getRepoUserName() + "_" + groupKey;
    return namedLocalStorage.get(key);
  }
}

Object.assign(BusinessWorkSpacePerspectiveView.prototype, {
  template: template,
  className: "bws-perspective-container",
  regions: {
    bwsTypeIconRegion: ".bws-type-icon",
    bwsNameRegion: ".bws-name",
    bwsTableRegion: ".bws-table",
    bwsActionsRegion: ".bws-actions",
    bwsMetadataTabsRegion: ".bws-metadata-tabs",
    bwsBasicMetadata: ".bws-basic-metadata",
    bwsHeaderInfoRegion: ".bws-header-info-container"
  },
  ui: {
    workspaceMetadataContent: ".workspace-metadata-content",
    bwsHeaderExpandCollapseButton: ".bws-header-expand-collapse",
    bwsMoreInfo: ".bws-more-info"
  },
  events: {
    "click @ui.bwsHeaderExpandCollapseButton": "onClickBWSHeaderExpandCollapseButton"
  }
});

LayoutViewEventsPropagationMixin.mixin(BusinessWorkSpacePerspectiveView.prototype);

Object.defineProperty(BusinessWorkSpacePerspectiveView.prototype.constructor, "name", {
  value: "WorkSpaceHeaderView"
});

export default BusinessWorkSpacePerspectiveView;