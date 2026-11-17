/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import DialogView from "csui/controls/dialog/dialog.view";

import Session from "dctmw/utils/authenticators/session";

import HeaderView from "d2/dialogs/facet.dialog/impl/header/header.view";

import FooterView from "d2/dialogs/facet.dialog/impl/footer/footer.view";

import ContentView from "d2/dialogs/facet.dialog/impl/content/facet.dialog.content.view";

import FacetDialogCollection from "d2/dialogs/facet.dialog/impl/models/facet.dialog.collection";

import {
  buildModels,
  unSelectAllModels
} from "d2/dialogs/facet.dialog/impl/facet.dialog.utils";

import lang from "i18n!d2/dialogs/facet.dialog/impl/nls/lang";

import "css!d2/dialogs/facet.dialog/impl/facet.dialog";

const COLUMNS_COUNT = 4, ROWS_PER_COLUMN = 10, defaultPageSize = COLUMNS_COUNT * ROWS_PER_COLUMN, defaultDDList = [ 40, 60, 80 ];

class FacetDialogView {
  constructor(options = {}) {
    options = {
      defaultPageSize: defaultPageSize,
      ...options
    };
    this.options = options;
    this.completeTopics = options.topics;
    this.currentHierrachyItems = options.items;
    this.currentItems = buildModels(options.items);
    this.selectionIdsSet = new Set();
    this.unselectionIdsSet = new Set();
    this.newSelectionIdsSet = new Set();
    this.currentItems.forEach(item => {
      item.get("checked") && this.selectionIdsSet.add(item.get("id"));
    });
    this.prepareData();
  }
  prepareData() {
    this.selectionData = {
      oldSelectionIds: this.selectionIdsSet,
      unSelectionIds: this.unselectionIdsSet,
      newSelectionIds: this.newSelectionIdsSet
    };
    this.collection = new FacetDialogCollection([], {
      selectionIdsSet: this.selectionIdsSet,
      nodes: this.currentItems,
      selectionData: this.selectionData,
      top: defaultPageSize
    });
  }
  initializeViews(fnResolve, fnReject) {
    this.headerView = new HeaderView({
      title: this.options.dialogTitle
    });
    this.footerView = new FooterView({
      buttons: this.getFooterButtons(fnResolve, fnReject)
    });
    this.contentView = new ContentView({
      collection: this.collection,
      selectionData: this.selectionData,
      pageSize: defaultPageSize,
      COLUMNS_COUNT: COLUMNS_COUNT,
      ROWS_PER_COLUMN: ROWS_PER_COLUMN,
      defaultDDList: defaultDDList
    });
    this.headerView.on("change:filter", model => {
      this.collection.setTopicFilter(model.get("where"));
    });
  }
  getFooterButtons(fnResolve, fnReject) {
    let {
      unSelectionIds,
      oldSelectionIds,
      newSelectionIds
    } = this.selectionData;
    let btns = [ {
      id: "btn-apply",
      label: lang.dialogBtnApply,
      default: true,
      click: () => {
        this.isCloseHandled = true;
        this.dialog?.destroy();
        fnResolve({
          newSelectionIds: newSelectionIds,
          unSelectionIds: unSelectionIds
        });
      }
    }, {
      id: "btn-clear-all",
      label: lang.dialogBtnClearAll,
      click: () => {
        unSelectAllModels(this.currentItems);
        newSelectionIds.clear();
        unSelectionIds.clear();
        oldSelectionIds.forEach(id => unSelectionIds.add(id));
      }
    }, {
      id: "btn-close",
      label: lang.dialogBtnClose,
      close: true,
      click: () => {
        this.isCloseHandled = true;
        this.dialog?.destroy();
        fnReject({
          cancelled: true
        });
      }
    } ];
    if (this.options.isSingleSelection) {
      btns.splice(1, 1);
    }
    return btns;
  }
  openDialog() {
    return new Promise((resolve, reject) => {
      this.collection.fetch().then(() => {
        this.initializeViews(resolve, reject);
        this.dialog = new DialogView({
          className: () => "d2-facet-dialog",
          title: this.options.dialogTitle,
          headerView: this.headerView,
          footerView: this.footerView,
          view: this.contentView,
          largeSize: true
        }).show();
        this.dialog.listenTo(Session.get(), "end", this.dialog.destroy);
        this.dialog.listenTo(this.dialog, "hide", () => {
          if (!this.isCloseHandled) {
            reject({
              cancelled: true
            });
          }
        });
      });
    });
  }
}

Object.defineProperty(FacetDialogView.prototype.constructor, "name", {
  value: "FacetDialogView"
});

export default FacetDialogView;