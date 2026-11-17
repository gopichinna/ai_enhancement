/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/tab.panel/tab.links.dropdown.view", "d2/widgets/task.details/impl/task.additional.panels.view", "d2/widgets/task.documents/impl/documents.list/working.files.list.view", "d2/widgets/task.documents/impl/documents.list/supporting.files.list.view", "d2/utils/constants", "css!d2/widgets/task.documents/impl/documents.list/task.documents.list" ], function(_, $, Marionette, TabLinkDropDownCollectionView, TaskAdditionalPanelsView, WorkingFilesListView, SupportingFilesListView, constants) {
  "use strict";
  var TAB_NAMES = Object.freeze({
    WORKING_FILES: "working",
    SUPPORTING_FILES: "supporting"
  }), TAB_NAME_TO_TAB_ATTRIBUTE_MAP = {};
  TAB_NAME_TO_TAB_ATTRIBUTE_MAP[TAB_NAMES.WORKING_FILES] = {
    contentView: WorkingFilesListView
  };
  TAB_NAME_TO_TAB_ATTRIBUTE_MAP[TAB_NAMES.SUPPORTING_FILES] = {
    contentView: SupportingFilesListView
  };
  var TaskDocumentsListView = TaskAdditionalPanelsView.extend({
    className: function() {
      var zuper = TaskDocumentsListView.__super__, className = "d2-task-documents-list";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    contentViewOptions: function(tabLink) {
      var options = TaskAdditionalPanelsView.prototype.contentViewOptions.apply(this, arguments);
      options.blockingParentView = this.options.blockingParentView;
      if (this.options.selectedTab && this.options.selectedTab === tabLink.get("name")) {
        options.selectedNodeId = this.options.selectedNodeId;
      }
      if (tabLink.get("name") === TAB_NAMES.SUPPORTING_FILES) {
        options.collection = this.options.supportingFileCollection;
      } else if (tabLink.get("name") === TAB_NAMES.WORKING_FILES) {
        options.collection = this.options.workingFileCollection;
      }
      if (!this.options.isTaskDetailsWithContent) {
        options.toolbarItems = {
          inlineActionbar: this.options.toolbarItems.filesMetadataHeaderDropdown
        };
        options.toolbarItemsMasks = {
          toolbars: {
            inlineActionbar: this.options.toolbarItemsMasks.toolbars.filesMetadataHeaderDropdown
          }
        };
      }
      return options;
    },
    constructor: function TaskDocumentsListView(options) {
      options = options || {};
      _.defaults(options, {
        toolbar: false,
        TabLinkCollectionViewClass: TabLinkDropDownCollectionView
      });
      TaskAdditionalPanelsView.prototype.constructor.call(this, options);
      this.listenToOnce(this, "render", this._onFirstRender).listenTo(this, "change:dropdown:visibility", this._onChangeDropdownVisibility);
    },
    _updateTabHeader: function(model, title) {
      if (model) {
        model.set("title", title);
        this.tabLinks && this._updateDropDownHeaderAndMenuItemHTML(model, title);
        this._updateTabLinks();
      }
    },
    _buildTabs: function() {
      var superTabs = TaskAdditionalPanelsView.prototype._buildTabs.apply(this, arguments);
      return _.chain(superTabs).filter(function(tab) {
        return _.contains(_.keys(TAB_NAME_TO_TAB_ATTRIBUTE_MAP), tab.name);
      }).map(function(tab) {
        return _.extend({}, tab, TAB_NAME_TO_TAB_ATTRIBUTE_MAP[tab.name], {
          contentViewOptions: {
            showOnlyNameCol: this.options.showOnlyNameCol
          }
        });
      }.bind(this)).value();
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.showSideBar === false) {
        return true;
      } else {
        return false;
      }
    },
    onActivateTab: function(tabContent) {
      if (this._activatedTabContent !== tabContent) {
        this._activatedTabContent && Marionette.triggerMethodOn(this._activatedTabContent, "deactivate:self");
        this._activatedTabContent = tabContent;
        if (this.options.isTaskDetailsWithContent) {
          tabContent && tabContent.filesTableTreeView && Marionette.triggerMethodOn(tabContent.filesTableTreeView, "activate:self");
        } else {
          tabContent && Marionette.triggerMethodOn(tabContent, "activate:self");
        }
      }
    },
    _changeTab: function() {
      let tabDetails = this.tabContent.children.findByIndex(this.tabLinks.collection.findIndex(tab => tab.id == this.tabLinks.selected.id));
      if (!tabDetails.content) {
        this.listenTo(this, "panel:view:initiated", () => {
          this._changeTab();
        });
      }
      this.onActivateTab(tabDetails.content);
    },
    onRender: function() {
      TaskAdditionalPanelsView.prototype.onRender?.apply(this, arguments);
      this.listenTo(this.tabLinks.selected, "change:id", () => {
        this._changeTab();
      });
    },
    _onFirstRender: function() {
      if (this.activeTabLink && this.activeTabContent?.model) {
        var tabPane = this.tabContent.children.findByModel(this.activeTabContent.model), tabContent = tabPane.content;
        this.onActivateTab(tabContent, tabPane, this.activeTabLink);
      }
    },
    _onChangeDropdownVisibility: function(isVisible) {
      if (isVisible === true) {
        this.$el.removeClass("dropdown-inactive");
        this.$el.find(".cs-metadata-dropdown").removeAttr("disabled");
        this._triggerEventIfVisibleOrOnDomRefresh("tabable");
      } else {
        this.$el.addClass("dropdown-inactive");
        this.$el.find(".cs-metadata-dropdown").attr("disabled", true);
        this._triggerEventIfVisibleOrOnDomRefresh("tabable:not");
      }
    },
    _triggerEventIfVisibleOrOnDomRefresh: function(eventName) {
      if (this.$el.is(":visible")) {
        this.trigger(eventName);
      } else {
        this.listenToOnce(this, "dom:refresh", this._triggerEventIfVisibleOrOnDomRefresh.bind(this, eventName));
      }
    },
    isTabable: function() {
      return !this.$el.hasClass("dropdown-inactive");
    },
    getWidgetTypeId: function() {
      return this.options.container.get("type") === constants.Types.WORKFLOW ? constants.StorageKey.WORKFLOW_DOCUMENTS : constants.StorageKey.TASK_DOCUMENTS;
    }
  }, {
    TAB_NAMES: TAB_NAMES
  });
  return TaskDocumentsListView;
});