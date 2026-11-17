/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import {
  LayoutView,
  Region
} from "nuc/lib/marionette";

import SelectViews from "d2/dialogs/target.browse/impl/select.views/select.views";

import TargetBrowseView from "d2/dialogs/target.browse/impl/target.browse.view";

import TargetBrowse from "d2/dialogs/target.browse/target.browse";

import TableActionBarView from "csui/controls/tableactionbar/tableactionbar.view";

import WidgetTableToolbarItems from "d2/widgets/widgettable/toolbaritems";

import NodesTableToolbarItemsMasks from "d2/widgets/splitview.widgets/impl/splitview.doclist.toolbaritems.mask";

import NodesTableToolbarItems from "csui/widgets/nodestable/toolbaritems";

import lang from "i18n!d2/dialogs/target.browse/impl/nls/lang";

import Template from "hbs!d2/widgets/splitview.widgets/impl/splitview.doclist";

import PubSub from "csui/controls/form/pub.sub";

import "css!d2/widgets/splitview.widgets/impl/splitview.doclist";

class SplitViewDoclist extends LayoutView {
  template = Template;
  className = "binf-widgets splitview-doclist";
  ui() {
    return {
      header: ".splitview-doclist-header",
      body: ".splitview-doclist-body",
      metadataContainer: ".metadata--container .metadata",
      scrollUp: ".scroll-up-icon",
      scrollDown: ".scroll-down-icon"
    };
  }
  regions() {
    return {
      headerRegion: "@ui.header",
      bodyRegion: "@ui.body",
      metaDataRegion: "@ui.metadataContainer"
    };
  }
  events() {
    return {
      "click @ui.scrollUp": "onScrollUp",
      "click @ui.scrollDown": "onScrollDown"
    };
  }
  constructor(options) {
    super(options);
    this.headerView = options.headerView;
    this.view = options.view;
    this.listenTo(this.headerView.tableSettingsView, "change:tablemode", this.onTablemodeChange);
  }
  onRender() {
    this.headerRegion.show(this.headerView);
    this.showView(this.view);
  }
  show() {
    var container = $(".d2-split-pane-content.primary-pane-content");
    var region = new Region({
      el: container
    });
    region.show(this);
  }
  blockWithoutIndicator() {}
  showView(view) {
    this.bodyRegion.show(view);
    this.view = view;
    this.listenTo(this.view.selectViews, "updated:doclist:preference", this.updateHeaderView);
    this.updateHeaderView();
  }
  loadMetaDataRegion(view) {
    this.metaDataRegion.show(view);
  }
  onScrollUp(_event) {
    PubSub.trigger("compareVd:scroll:up");
  }
  onScrollDown(_event) {
    PubSub.trigger("compareVd:scroll:down");
  }
  onTablemodeChange(event) {
    this.view.selectViews.applyTableMode(event);
  }
  updateHeaderView() {
    let columnPreference = this.view.selectViews.collection.node?.get("widgetPreference")?.columnPreference;
    if (this.view.options.favoritesView || this.view.options.searchView) {
      columnPreference = this.view.selectViews.collection.columnPreference;
    }
    this.headerView.tableSettingsView.options.currentTableMode = columnPreference?.get("d2sv_widget_state")?.table_mode || "LIST";
    this.headerView.tableSettingsView.render();
  }
  destroy() {}
  updateButton() {}
}

class SelectViewsWidget extends SelectViews {
  constructor(options) {
    options.isPaginated = true;
    super(options);
    this.commands = options.commands;
    this.enableDrag();
    this.listenTo(this.collection, "sync", this.applyTableMode);
  }
  applyTableMode(selectedTableMode) {
    const tableViewWrap = this.tableView?.options?.tableColumnsWrappingOff || false;
    let columnPreference = this.collection?.node?.get("widgetPreference")?.columnPreference;
    let tableModePref = "LIST";
    if (this.options.favoritesView || this.options.searchView) {
      columnPreference = this.collection.columnPreference;
    }
    tableModePref = columnPreference?.get("d2sv_widget_state")?.table_mode;
    if (typeof selectedTableMode == "string") {
      tableModePref = selectedTableMode;
    }
    if (tableModePref === "LIST" && tableViewWrap === false) return;
    if (tableModePref === "PINNED" && tableViewWrap === true) return;
    this.options.tableColumnsWrappingOff = tableModePref === "PINNED" ? true : false;
    this.options.currentTableMode = tableModePref;
    this.setTableView();
    this.enableDrag();
    SelectViews.prototype.render.call(this);
    if (columnPreference) {
      let widgetState = columnPreference.get("d2sv_widget_state");
      widgetState.table_mode = this.options.currentTableMode;
      columnPreference.set("d2sv_widget_state", widgetState);
      columnPreference.save().done(() => {
        this.trigger("updated:doclist:preference", this.options);
      });
    }
  }
  getInlineActionbarOptions() {
    this.toolbarItems = WidgetTableToolbarItems.clone();
    if (!this.toolbarItems["inlineActionbar"]) {
      this.toolbarItems["inlineActionbar"] = NodesTableToolbarItems["inlineActionbar"];
    }
    if (!this.toolbarItemsMasks) {
      this.toolbarItemsMasks = new NodesTableToolbarItemsMasks();
    }
    return {
      viewClass: TableActionBarView,
      options: _.extend({
        collection: this.toolbarItems.inlineActionbar,
        toolItemsMask: this.toolbarItemsMasks.toolbars.inlineActionbar,
        delayedActions: this.collection.delayedActions,
        container: this.container,
        containerCollection: this.collection
      }, this.toolbarItems.inlineActionbar.options, {
        inlineBarStyle: "csui-table-actionbar-bubble",
        showInlineBarOnHover: true
      })
    };
  }
  enableDrag() {
    let tableViewInstance = this.tableView;
    this.listenTo(this.tableView, "tableRowRendered", function(row) {
      var $row = $(row.target);
      $row.find("a").attr("draggable", false);
      if ($row.hasClass("csui-table-row-shows-inlineform") === false) {
        $row.attr("draggable", true);
      }
      $row.on("dragstart", function(event) {
        let dragData = {
          nodes: []
        }, content = "", selected = tableViewInstance.getSelectedChildren();
        if (selected.length > 0) {
          _.each(selected, function(model, index) {
            dragData.nodes.push({
              i_chronicle_id: model.get("i_chronicle_id"),
              name: model.get("name")
            });
            if (index === 3) {
              content = content + "<div>" + lang.MoreLabel + "</div>";
            } else if (index < 3) {
              content = content + "<div>" + model.get("name") + "</div>";
            }
          });
        } else {
          dragData.nodes.push({
            i_chronicle_id: row.node.get("i_chronicle_id"),
            name: row.node.get("name"),
            type_name: row.node.get("type_name"),
            mime_type: row.node.get("mime_type"),
            modify_date: row.node.get("modify_date")
          });
          content = "<div>" + row.node.get("name") + "</div>";
        }
        event.originalEvent.dataTransfer.setData("draggedData", JSON.stringify(dragData));
        var $dragImage = $('<div class="drag-item-vd-edit"></div>').html(content);
        $dragImage.appendTo($("body"));
        $dragImage.css({
          display: "flex",
          width: "fit-content",
          "flex-direction": "column",
          gap: ".5rem",
          padding: ".5rem",
          "border-radius": "5px",
          "background-color": "#353535",
          color: "white",
          opacity: 1,
          "z-index": 9999
        });
        event.originalEvent.dataTransfer.setDragImage($dragImage[0], 0, 0);
      });
      $row.on("dragend", function() {
        $(".drag-item-vd-edit").remove();
      });
    });
  }
}

class TargetBrowseViewWidget extends TargetBrowseView {
  constructor(options) {
    super(options);
  }
  getSelectViewInstance(options) {
    if (options.collection) {
      options.collection.setEnabledDelayRestCommands(true);
    }
    return new SelectViewsWidget(options);
  }
}

class TargetBrowseWidget extends TargetBrowse {
  splitViewDocList = null;
  constructor(options) {
    super(options);
    this.options.tableModeActionRequired = true;
  }
  _createDialog() {
    this.splitViewDocList = new SplitViewDoclist(_.extend({
      headerView: this._headerControl,
      view: this._view
    }, this.options));
    return this.splitViewDocList;
  }
  onCollectionUpdated(collection) {
    super.onCollectionUpdated(collection);
    _.each(collection.allModels, model => {
      if (!model.get("selectable") && model.get("container") === true) {
        model.set("selectable", false, {
          silent: true
        });
        model.trigger("change:selectable", model, false);
      }
    });
  }
  getTargetBrowseViewInstance(locationParameters) {
    return new TargetBrowseViewWidget(locationParameters);
  }
  getSearchViewInstance(locationParameters) {
    return new TargetBrowseViewWidget(locationParameters);
  }
}

export default TargetBrowseWidget;