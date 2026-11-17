/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/widgets/metadata/metadata.view", "d2/utils/constants", "nuc/models/nodes", "csui/utils/commands", "d2/utils/rest.linkrels", "dctmw/utils/utils", "d2/controls/button.toolbar/button.toolbar.view", "d2/controls/mixins/view.state/task.view.state.mixin", "d2/widgets/task.details/impl/task.additional.panels.view", "d2/models/workflow/task.working.files", "css!d2/widgets/task.details/impl/task.metadata" ], function(_, $, Marionette, CSMetadataView, constants, NodeCollection, commands, RestLinkrels, utils, ButtonToolbarView, TaskViewStateMixin, TaskAdditionalPanelsView, TaskWorkingFileCollection) {
  "use strict";
  var TaskMetadataView = CSMetadataView.extend({
    className: "d2-task-metadata cs-metadata",
    constructor: function TaskMetadataView(options) {
      options = options || {};
      this.context = options.context;
      this.actionBarOriginalWLSize = options.toolbarItemsMasks.toolbars.leftToolbar.whitelist.length;
      this.userData = options.model.get("userData") ? options.model.get("userData") : {};
      this.prepareViewStateApi(options);
      this.addUrlParametersSupport([ "dropdown" ]);
      CSMetadataView.prototype.constructor.call(this, options);
      this.taskAdditionalPanelsView = this.createAdditionalPanelView(options);
      var me = this;
      this.listenTo(this.metadataTabView, "activate:tab", function() {
        me.isExpandedMetadataView();
      });
      me.isExpandedMetadataView();
      this.listenTo(this.metadataHeaderView.rightbarView, "dom:refresh", this._adjustActionBarDisplay.bind(this));
      this.listenToOnce(this, "destroy", function() {
        $(window).off("resize.task_action_bar");
        this.options.toolbarItemsMasks.toolbars.leftToolbar.restoreMask();
        this.options.toolbarItemsMasks.toolbars.otherToolbar.restoreMask();
      }.bind(this));
      $(window).on("resize.task_action_bar", _.throttle(this._adjustActionBarDisplay.bind(this), 300, {
        leading: false
      }));
    },
    onViewStateChanged: function() {
      var selection = this.getViewStateDropdown() || this.getDefaultViewStateDropdown(), tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        if (selection && tabLinks.selected.get("name") !== selection) {
          tabLinks.sortMenuSelectGroupView?.children?.some(view => {
            if (view.model.get("name") === tabLinks.selected.get("name")) {
              tabLinks._selectTabItem({
                itemValue: view.model,
                isSilent: true
              });
              return true;
            }
          });
        }
      }
    },
    createAdditionalPanelView: function(options) {
      return new TaskAdditionalPanelsView(options);
    },
    isExpandedMetadataView: function() {
      if (this.context && this.context.viewStateModel && this.context.viewStateModel.getViewState("dropdown") === "task_performers") {
        this.$el.addClass("expanded-view");
      } else {
        this.$el.removeClass("expanded-view");
      }
    },
    _listenToDropdownSelection: function() {
      var tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        var dropDownName = this.getViewStateDropdown();
        if (dropDownName !== tabLinks.selected.get("name")) {
          this.setViewStateDropdown(tabLinks.selected.get("name"), {
            default: !dropDownName
          });
        }
        this.listenTo(tabLinks.selected, "change", model => {
          this._onDropDownSelectionChanged(model);
          this.isExpandedMetadataView();
        });
      }
    },
    onRender: function() {
      CSMetadataView.prototype.onRender.apply(this, arguments);
      var fetching = this.options.model.fetching;
      if (fetching) {
        return;
      }
      this._adjustRightToolbar();
      this.renderAdditionalPanelsView();
      var me = this;
      $.when(me.fetchWorkingFiles(this.options.model), me.fetchQuerySpaces(this.options.model)).done(function(workingFilesData, querySpaceData) {
        me.workingFilesData = workingFilesData;
        me.querySpaceData = querySpaceData;
        if (Array.isArray(me?.querySpaceData?.queryspace) && me.querySpaceData.queryspace.length > 0) {
          me._addAviatorLaunchBtn(workingFilesData, querySpaceData);
        } else {
          console.warn("QuerySpace data is empty skipping Aviator Launch button rendering.");
        }
        me._addAviatorLaunchBtn(workingFilesData, querySpaceData);
      }).fail(function(error) {
        console.error("Failed to fetch working files or queryspace data reason:" + error);
      });
    },
    fetchWorkingFiles: function(model) {
      var deferred = $.Deferred();
      var workingFileCollection = new TaskWorkingFileCollection(undefined, {
        node: model
      });
      workingFileCollection.fetch({}).done(function() {
        deferred.resolve(workingFileCollection);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    convertQuerySpaceJson: function(inputJson) {
      let outputJson = {
        queryspace: []
      };
      if (inputJson.queryspaces && inputJson.queryspaces.length > 0) {
        inputJson.queryspaces.forEach(qs => {
          let queryspaceItem = {
            name: qs.label,
            documents: [],
            faq: qs.queries
          };
          if (qs.packages) {
            qs.packages.forEach(pkgName => {
              let pkg = inputJson.packages.find(p => p.name === pkgName);
              if (pkg && pkg.documents) {
                queryspaceItem.documents.push(...pkg.documents);
              }
            });
          }
          outputJson.queryspace.push(queryspaceItem);
        });
      }
      return outputJson;
    },
    fetchQuerySpaces: function(model) {
      var deferred = $.Deferred();
      var me = this;
      var url = RestLinkrels.getLink(model.get("links"), RestLinkrels.D2_WORKFLOW_QUERYSPACE);
      if (!url) {
        deferred.reject("Error: D2_WORKFLOW_QUERYSPACE URL not found.");
        return deferred.promise();
      }
      $.ajax(this.model.options.connector.extendAjaxOptions({
        url: url,
        type: "GET",
        contentType: constants.MediaTypes.DCTM_JSON,
        success: function(response) {
          var qsdata = me.convertQuerySpaceJson(response);
          deferred.resolve(qsdata);
        },
        error: _.bind(function(xhr, message, statusText) {
          deferred.reject(utils.parseAjaxErrorAsString(xhr, statusText, message));
        })
      }));
      return deferred.promise();
    },
    _addAviatorLaunchBtn: function(workingFilesData, querySpaceData) {
      var buttonsConfig = {
        left: []
      };
      var me = this;
      var config = {
        id: "navigateBack",
        className: "icon icon-task-go-back",
        iconName: "aie_action_aviator32",
        tooltip: "Launch Task Aviator",
        clickHandler: function() {
          me.renderAviatorPanelView(workingFilesData, querySpaceData);
        }
      };
      buttonsConfig.left.push(config);
      this.btnView = new ButtonToolbarView(buttonsConfig);
      var tbv = this.metadataHeaderView.rightbarView.toolbarView;
      tbv.rightToolbarRegion.$el.append(this.btnView);
      tbv.rightToolbarRegion.show(this.btnView);
    },
    renderAviatorPanelView: function(workingFilesData, querySpaceData) {
      var launchTaskAviatorCommand = commands.get("TaskAviator-LaunchChat");
      if (launchTaskAviatorCommand) {
        launchTaskAviatorCommand.execute({
          context: this.context,
          nodes: new NodeCollection([ this.options.model ]),
          workingFilesData: workingFilesData,
          qsData: querySpaceData
        });
      }
    },
    renderAdditionalPanelsView: function() {
      this.taskAdditionalPanelsView.render();
      Marionette.triggerMethodOn(this.taskAdditionalPanelsView, "before:show", this.taskAdditionalPanelsView, this);
      this.$el.append(this.taskAdditionalPanelsView.el);
      Marionette.triggerMethodOn(this.taskAdditionalPanelsView, "show", this.taskAdditionalPanelsView, this);
    },
    _adjustRightToolbar: function() {
      var toolbarView = this.metadataHeaderView.rightbarView && this.metadataHeaderView.rightbarView.toolbarView, otherToolbarView = toolbarView && toolbarView["otherToolbarView"], selectedNodes = toolbarView && toolbarView.selectedNodes;
      toolbarView && toolbarView.$el && toolbarView.$el.find(".csui-tabletoolbar").removeClass("tile-nav");
      selectedNodes && selectedNodes.reset([ this.options.model ]);
      otherToolbarView && otherToolbarView._adjustToFit();
    },
    _adjustActionBarDisplay: function() {
      var $elToolbar = this.$el.find(".metadata-header-right-bar-container"), elToolbar = $elToolbar.length && $elToolbar[0], toolbarView = this.metadataHeaderView.rightbarView && this.metadataHeaderView.rightbarView.toolbarView, leftToolbarView = toolbarView && toolbarView["leftToolbarView"], otherToolbarView = toolbarView && toolbarView["otherToolbarView"], leftToolbarMask = this.options.toolbarItemsMasks.toolbars.leftToolbar, otherToolbarMask = this.options.toolbarItemsMasks.toolbars.otherToolbar, whiteList = this.options.toolbarItemsMasks.toolbars.leftToolbar.whitelist, blackList = this.options.toolbarItemsMasks.toolbars.otherToolbar.blacklist, signature;
      if (elToolbar) {
        if (elToolbar.offsetWidth < elToolbar.scrollWidth) {
          if (leftToolbarView.collection.length > 1) {
            signature = leftToolbarView.collection.last().get("signature");
            var wlIndex = _.findIndex(whiteList, {
              signature: signature
            }), blIndex = _.findIndex(blackList, {
              signature: signature
            });
            if (wlIndex !== -1 && blIndex !== -1) {
              whiteList.splice(wlIndex, 1);
              leftToolbarMask.trigger("update", leftToolbarMask);
              blackList.splice(blIndex, 1);
              otherToolbarMask.trigger("update", otherToolbarMask);
              if (elToolbar.offsetWidth < elToolbar.scrollWidth) {
                this._adjustActionBarDisplay();
              }
            }
          }
        } else {
          if (whiteList.length < this.actionBarOriginalWLSize) {
            signature = otherToolbarView.collection.first().get("signature");
            blackList.push({
              signature: signature
            });
            otherToolbarMask.trigger("update", otherToolbarMask);
            whiteList.push({
              signature: signature
            });
            leftToolbarMask.trigger("update", leftToolbarMask);
            this._adjustActionBarDisplay();
          }
        }
      }
    },
    onResolutionChange: function(resolutionData) {
      if (resolutionData.viewPortWidth <= constants.Resolution.MEDIUM) {
        this.metadataHeaderView.metadataItemNameView._applyToggle(resolutionData.showSideBar);
      } else {
        this.metadataHeaderView.metadataItemNameView._removeToggle();
      }
      if (resolutionData.viewPortWidth <= constants.Resolution.LOW && resolutionData.showSideBar) {
        this.metadataTabView.$el.width("100%");
        this.taskAdditionalPanelsView.$el.addClass("binf-hidden");
      } else {
        this.metadataTabView.$el.width("");
        this.taskAdditionalPanelsView.$el.removeClass("binf-hidden");
        $(window).trigger("resize.tableview");
      }
    },
    onBeforeDestroy: function() {
      CSMetadataView.prototype.onBeforeDestroy.apply(this, arguments);
      this.taskAdditionalPanelsView && this.taskAdditionalPanelsView.destroy();
    }
  });
  TaskViewStateMixin.mixin(TaskMetadataView.prototype);
  return TaskMetadataView;
});