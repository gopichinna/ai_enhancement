/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import $ from "nuc/lib/jquery";

import Url from "nuc/utils/url";

import CsuiItemTitleView from "csui/controls/item.title/item.title.view";

import Constants from "dctmw/utils/constants";

const oIninitialize = CsuiItemTitleView.prototype.initialize;

CsuiItemTitleView.prototype.initialize = function() {
  oIninitialize.apply(this, arguments);
  const collection = this.options?.originatingView?.collection;
  const node = this.options?.model || collection.node;
  if (collection && node) {
    let isLocationChange = false;
    this.isContainerNodeFetching = false;
    this.listenTo(node, "change:id", () => {
      isLocationChange = true;
      this.isContainerNodeFetching = false;
    }).listenTo(collection, "add", model => {
      if (node.get("r_link_cnt") === 0 && model.get("id")) {
        this._refreshNodeAndSyncData();
      }
    }).listenTo(collection, "remove", model => {
      if (collection.length === 0 && model.get("id")) {
        node.set("r_link_cnt", node.get("r_link_cnt") - 1);
        this.iconView.model._updateModelFromNode();
        this._refreshNodeAndSyncData();
      }
    }).listenTo(collection, "sync", () => {
      if (!isLocationChange) {
        if (collection.length === 0 || collection.length && node.get("r_link_cnt") === 0) {
          this._refreshNodeAndSyncData();
        }
      }
      isLocationChange = false;
    });
  }
};

CsuiItemTitleView.prototype._refreshNodeAndSyncData = function() {
  const node = this.options.model;
  if (!this.isContainerNodeFetching && node.get("type") === Constants.Types.FOLDER) {
    this.isContainerNodeFetching = true;
    const url = Url.appendQuery(node.url(), Url.combineQueryString({
      view: "r_link_cnt"
    })), id = node.get("id");
    $.ajax(node.connector.extendAjaxOptions({
      url: url
    })).done(res => {
      if (id === node.get("id")) {
        node.set("r_link_cnt", res.properties.r_link_cnt);
        this.iconView.model._updateModelFromNode();
      }
    }).always(() => {
      this.isContainerNodeFetching = false;
    });
  }
};