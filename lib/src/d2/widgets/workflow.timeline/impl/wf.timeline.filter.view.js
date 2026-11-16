/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/controls/tab.panel/tab.links.dropdown.view", "d2/utils/constants", "d2/utils/widgets.utils", "dctmw/utils/utils" ], function(_, $, Backbone, CSTabLinksDropdownView, constants, widgetUtils, utils) {
  "use strict";
  var filterOptionMapper = function(option) {
    return _.extend(_.deepClone(option), {
      id: option.name,
      uniqueTabId: _.uniqueId(option.name)
    });
  };
  var WorkflowTimelineFilterView = CSTabLinksDropdownView.extend({
    behaviors: {},
    constructor: function WorkflowTimelineFilterView(options) {
      options = options || {};
      this.targetCollection = options.targetCollection;
      this.filterOptions = widgetUtils.getFilterOptions(options.targetCollection.node.get("workflow_filters"));
      options.collection = new Backbone.Collection(_.map(this.filterOptions, filterOptionMapper));
      _.defaults(options, {
        activeTab: new Backbone.Model({
          tabIndex: 0
        }),
        selectedTab: "manual"
      });
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
      if (namedLocalStorage && namedLocalStorage.get(constants.StorageKey.WF_TIMELINE_SELECTED_TASK_FILTER) && options.collection.get(namedLocalStorage.get(constants.StorageKey.WF_TIMELINE_SELECTED_TASK_FILTER).name)) {
        options.selectedTab = namedLocalStorage.get(constants.StorageKey.WF_TIMELINE_SELECTED_TASK_FILTER).name;
      }
      namedLocalStorage.remove(constants.StorageKey.WF_TIMELINE_SELECTED_TASK_FILTER);
      CSTabLinksDropdownView.prototype.constructor.call(this, options);
      this.targetCollection && this.listenTo(this.targetCollection, "sync error", this.onTargetCollectionSync);
    },
    onRender: function() {
      this._updateSelectionLabels();
      CSTabLinksDropdownView.prototype.onRender.apply(this, arguments);
    },
    _updateSelectionLabels: function() {
      CSTabLinksDropdownView.prototype._updateSelectionLabels.apply(this, arguments);
      var name = this.selected.get("name"), prevName = this.selected.previous("name"), matchingModel = this.collection.get(name), prevOption = prevName && _.findWhere(this.filterOptions, {
        name: prevName
      });
      if (matchingModel.get("serverSideFilter") || this.targetCollection.workflowFilterName) {
        this.targetCollection.clearFilter(false);
        this.targetCollection.fetch(matchingModel.get("serverSideFilter") ? {
          filterName: name,
          reload: true,
          reset: true
        } : {
          reload: true,
          reset: true
        }).then(() => {
          matchingModel.get("serverSideFilter") && matchingModel.set({
            fExpression: {
              type: constants.Types.TASK
            }
          });
          this.trigger("selection:changed", name, matchingModel && matchingModel.get("group"), prevName, prevOption && prevOption.group);
          matchingModel && this.targetCollection && this.targetCollection.setFilter(matchingModel.get("fExpression"), {
            fetch: true,
            clear: true
          });
        });
      } else {
        this.trigger("selection:changed", name, matchingModel && matchingModel.get("group"), prevName, prevOption && prevOption.group);
        matchingModel && this.targetCollection && this.targetCollection.setFilter(matchingModel.get("fExpression"), {
          fetch: true,
          clear: true
        });
      }
      var namedLocalStorage = utils.getLocalStore(constants.StorageKey.WIDGET_CONTEXT);
      if (matchingModel && namedLocalStorage) {
        namedLocalStorage.set(constants.StorageKey.WF_TIMELINE_SELECTED_TASK_FILTER, matchingModel);
      }
    },
    onTargetCollectionSync: function(collection, resp, options) {
      if (options && !!options.request) {
        var selectedTabName = this.selected.get("name");
        var selectedModel = this.collection.get(selectedTabName);
        if (!selectedModel && this.collection.length) {
          this.activateDropdownTab(this.collection.at(0).get("name"), true);
        } else if (selectedModel) {
          this.activateDropdownTab(selectedModel.get("name"), true);
        }
      }
    },
    currentlyFocusedElement: function() {
      return this.ui.toggle;
    },
    onLastTabElement: function() {
      return false;
    },
    accActivateTabableRegion: function() {
      this.ui.toggle.attr("tabindex", 0);
    }
  });
  return WorkflowTimelineFilterView;
});