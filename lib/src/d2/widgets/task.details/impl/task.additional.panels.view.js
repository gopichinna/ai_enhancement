/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/form/pub.sub", "csui/controls/tab.panel/tab.links.ext.view", "csui/controls/tab.panel/tab.links.ext.scroll.mixin", "csui/controls/tab.panel/tab.panel.view", "d2/widgets/task.details/task.additional.panels", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.additional.panels" ], function(_, $, Backbone, Marionette, PubSub, TabLinkCollectionViewExt, TabLinksScrollMixin, TabPanelView, taskAdditionalPanels, lang) {
  "use strict";
  var TaskAdditionalPanelsView = TabPanelView.extend({
    className: "d2-task-additional-panels cs-tabpanel tab-panel",
    contentViewOptions: function(tabLink) {
      var options = {
        context: this.options.context,
        node: this.options.node,
        additionalPanelsView: this,
        commands: this.options.commands,
        originatingView: this.options.originatingView
      }, tabName = tabLink.get("name");
      if (tabName === "working") {
        options.toolbarItems = {
          inlineActionbar: this.options.toolbarItems.workingFileListInlineActionbar,
          tableRightToolbar: this.options.toolbarItems.attachmentsFileTableRightbar,
          tableInlineActionBar: this.options.toolbarItems.workingFileTableInlineActionbar,
          tableHeaderToolbar: this.options.toolbarItems.workingFileTableHeaderToolbar,
          otherToolbar: this.options.toolbarItems.workingFileTableHeaderToolbar
        };
        options.toolbarItemsMasks = {
          toolbars: {
            inlineActionbar: this.options.toolbarItemsMasks.toolbars.workingFileListInlineActionbar,
            tableRightToolbar: this.options.toolbarItemsMasks.toolbars.attachmentsFileTableRightbar,
            tableInlineActionBar: this.options.toolbarItemsMasks.toolbars.workingFileTableInlineActionbar,
            tableHeaderToolbar: this.options.toolbarItemsMasks.toolbars.workingFileTableHeaderToolbar,
            otherToolbar: this.options.toolbarItemsMasks.toolbars.workingFileTableHeaderToolbar
          }
        };
      } else if (tabName === "supporting") {
        options.toolbarItems = {
          inlineActionbar: this.options.toolbarItems.supportingFileListInlineActionbar,
          tableRightToolbar: this.options.toolbarItems.attachmentsFileTableRightbar,
          tableInlineActionBar: this.options.toolbarItems.supportingFileTableInlineActionbar,
          tableHeaderToolbar: this.options.toolbarItems.supportingFileTableHeaderToolbar,
          otherToolbar: this.options.toolbarItems.supportingFileTableHeaderToolbar
        };
        options.toolbarItemsMasks = {
          toolbars: {
            inlineActionbar: this.options.toolbarItemsMasks.toolbars.supportingFileListInlineActionbar,
            tableRightToolbar: this.options.toolbarItemsMasks.toolbars.attachmentsFileTableRightbar,
            tableInlineActionBar: this.options.toolbarItemsMasks.toolbars.supportingFileTableInlineActionbar,
            tableHeaderToolbar: this.options.toolbarItemsMasks.toolbars.supportingFileTableHeaderToolbar
          }
        };
      }
      return options;
    },
    constructor: function TaskAdditionalPanelsView(options) {
      options = options || {};
      this.options = _.defaults(_.omit(options, "model", "collection"), {
        node: options.model,
        taskCollection: options.collection
      });
      _.defaults(this.options, {
        tabType: "binf-nav-pills",
        delayTabContent: true,
        toolbar: true,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        tabs: this._buildTabs()
      });
      if (this.options && this.options.manageAttachments) {
        this.options.node.set("initialPanel", "supporting", {
          silent: true
        });
      } else if (this.options.originatingView && this.options.originatingView.showNotesTab) {
        this.options.node.set("initialPanel", "notes", {
          silent: true
        });
      } else {
        this.options.node.unset("initialPanel");
      }
      TabPanelView.prototype.constructor.call(this, this.options);
      var listView = this.options.originatingView && this.options.originatingView.options.originatingView && this.options.originatingView.options.originatingView.taskListView;
      this.listenTo(this, "update:tab:header", _.bind(this._updateTabHeader, this));
      $(window).on("resize", this._updateTabLinks.bind(this));
      listView && this.listenTo(listView, "after:collapse after:expand", this._updateTabLinks.bind(this));
    },
    _buildTabs: function() {
      return taskAdditionalPanels.chain().filter(function(panel) {
        var contentView = panel.get("contentView"), enabled = contentView.enabled;
        switch (panel.get("name")) {
         case "supporting":
          if (this.options.node.get("wf_supporting_documents_count")) {
            panel.set("title", _.str.sformat(lang.titleAdditionalPanelSupportingFiles, this.options.node.get("wf_supporting_documents_count")));
          } else {
            panel.set("title", lang.defaultTitleAdditionalPanelSupportingFiles);
          }
          break;

         case "working":
          if (this.options.node.get("wf_working_documents_count")) {
            panel.set("title", _.str.sformat(lang.titleAdditionalPanelWorkingFiles, this.options.node.get("wf_working_documents_count")));
          } else {
            panel.set("title", lang.defaultTitleAdditionalPanelWorkingFiles);
          }
          break;

         case "notes":
          if (this.options.node.get("wf_notes_count")) {
            panel.set("title", _.str.sformat(lang.titleAdditionalPanelNotes, this.options.node.get("wf_notes_count")));
          } else {
            panel.set("title", lang.defaultTitleAdditionalPanelNotes);
          }
          break;
        }
        return !enabled || _.isFunction(enabled) && enabled({
          context: this.options.context,
          node: this.options.node
        });
      }.bind(this)).map(function(panel) {
        return panel.attributes;
      }.bind(this)).value();
    },
    onShow: function() {
      this._initializeToolbar();
      _.each(this.tabContent.children._views, function(view) {
        view.$el.removeClass("binf-fade");
      });
    },
    onBeforeDestroy: function() {
      _.each(this.tabContent.children._views, function(view) {
        view.content && view.content.destroy();
      });
    },
    _updateTabLinks: function() {
      this._enableToolbarState();
      this._setFadeoutState();
    },
    _initializeToolbar: function() {
      var me = this;
      if (this.$el.is(":visible")) {
        this._initializeToolbars();
        this.tabsSelector = "> ul li:not(.binf-hidden)";
        this._listenToTabEvent();
        this._updateTabLinks();
      } else {
        setTimeout(function() {
          me._initializeToolbar();
        }, 300);
      }
    },
    _updateTabHeader: function(model, title) {
      model.set("title", title);
      var tabHeader = this.tabLinks.children.findByModel(model) && this.tabLinks.children.findByModel(model).$el;
      tabHeader && tabHeader.find(".cs-tablink-text").html(title) && tabHeader.find("> a").attr("title", title);
      this._updateTabLinks();
    },
    _updateTabHeaderByTabName: function(name, title) {
      var model = this.collection.findWhere({
        name: name
      });
      this._updateTabHeader(model, title);
    },
    _setFadeoutState: function() {
      this.fadeout = this.fadeout || this.$el.find(".fadeout");
      if (this.gotoNextPage && this.gotoNextPage.is(":visible") || this.leftToolbar && this.leftToolbar.is(":visible")) {
        this.fadeout.show();
      } else {
        this.fadeout.hide();
      }
    },
    _isTablinkVisibleInParents: function($el, options) {
      return this.tabLinks._isTablinkVisibleInParents($el, _.defaults(options, {
        percentY: 1
      }));
    }
  });
  _.extend(TaskAdditionalPanelsView.prototype, TabLinksScrollMixin);
  return TaskAdditionalPanelsView;
});