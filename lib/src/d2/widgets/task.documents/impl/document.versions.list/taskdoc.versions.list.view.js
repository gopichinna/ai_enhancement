/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import SimpleListView from "csui/controls/list/simplelist.view";

import TabableRegionBehavior from "csui/behaviors/keyboard.navigation/tabable.region.behavior";

import NodeTypeIconView from "csui/controls/node-type.icon/node-type.icon.view";

import VersionModel from "csui/models/version";

import lang from "i18n!csui/widgets/metadata/impl/nls/lang";

import "css!d2/widgets/task.documents/impl/document.versions.list/taskdoc.versions.list";

class TaskDocVersionsListView extends SimpleListView {
  constructor(options) {
    super(options);
    this.options = options || {};
    this.options.data.enableIcon = true;
    this.events = _.extend({}, SimpleListView.prototype.events, this.events);
    this.listenTo(this, "childview:render", this.onRenderItem);
    this.listenTo(this, "childview:before:destroy", this.onBeforeDestroyItem);
    this.listenTo(options.collection, "sync", this.onVersionsReset);
  }
  events = {
    keydown: "onKeyDown"
  };
  behaviors = {
    TabableRegionBehavior: {
      behaviorClass: TabableRegionBehavior,
      initialActivationWeight: 100
    }
  };
  filter(child) {
    this.majorVersion = this.options.collection.first()?.get("version_number_name").split(".")[0];
    return child.get("version_number_name").split(".")[0] == this.majorVersion || child.get("version_number_name").split(".")[0] != this.majorVersion && child.get("version_number_name").endsWith(".0");
  }
  onVersionsReset() {
    let firstModel = this.options.collection.first();
    if (firstModel) {
      this.majorVersion = firstModel.get("version_number_name").split(".")[0];
      this.addSeperatorClass();
      this.trigger("click:item", {
        model: firstModel
      });
      this.setSelectedIndex(0);
    }
  }
  addSeperatorClass() {
    let childId = "";
    for (let id in this.children._views) {
      if (this.children._views[id].model.get("version_number_name")?.split(".")[0] == this.majorVersion) {
        childId = id;
      } else break;
    }
    this.children._views[childId].$el.addClass("task-version-list-seperator");
  }
  onRender() {
    super.onRender && super.onRender();
    this.options.collection.fetch();
  }
  childViewOptions(model) {
    return {
      templateHelpers: () => {
        const nameAttribute = this.options.nameAttribute || "name";
        return {
          enableIcon: true,
          name: model.get(nameAttribute)
        };
      },
      nameAttribute: this.options.data.nameAttribute,
      childRole: this.options.data.childRole,
      enableIcon: true
    };
  }
  onRenderItem(childView) {
    const model = childView.model;
    if (model instanceof VersionModel) {
      const verNum = model.get("version_number_name");
      $(childView.$(".csui-type-icon").get(0)).append(`<span title="${verNum}" class="list-item-version">${verNum}</span>`);
    } else {
      if (this.options && this.options.isThumbnailView || this.options.originatingView && this.options.originatingView.thumbnailView) {
        this.$el.addClass("csui-metadata-navigation-thumbnail");
        model.attributes.image_url = model.get("csuiThumbnailImageUrl");
      } else {
        this.$el.find(".csui-metadata-navigation-thumbnail").removeClass("csui-metadata-navigation-thumbnail");
      }
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$(".csui-type-icon").get(0),
        node: model
      });
      childView._nodeIconView.render();
    }
    const show_required = this.options.data?.show_required === true;
    const enforcedRequire = model?.options?.enforcedRequiredAttrs === true;
    if (show_required && enforcedRequire) {
      const titleEl = childView.$(".list-item-title").get(0);
      if (titleEl) {
        let cssClasses, tooltip;
        if (model.validated === true) {
          cssClasses = "cs-icon-required category_required_done";
          tooltip = lang.requiredPassedTooltip;
        } else {
          cssClasses = "cs-icon-required category_required";
          tooltip = lang.requiredTooltip;
        }
        $(titleEl).before(`<span class="${cssClasses}" aria-label="${tooltip}" title="${tooltip}"></span>`);
      }
    }
  }
  onBeforeDestroyItem(childView) {
    if (childView._nodeIconView) {
      childView._nodeIconView.destroy();
    }
  }
  currentlyFocusedElement() {
    this.$el.find(".cs-header-with-go-back").prop("tabindex", 0);
    this.selectedIndex = this.getSelectedIndex();
    const activeItem = this.getSelectedItem()?.el;
    if (activeItem) {
      activeItem.setAttribute("tabindex", 0);
    }
  }
}

Object.assign(TaskDocVersionsListView.prototype, {
  className: `${SimpleListView.prototype.className} task-version-list`
});

export default TaskDocVersionsListView;