/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/listitem/listitemstandard.view", "csui/controls/tableactionbar/tableactionbar.view", "csui/utils/accessibility", "dctmw/controls/otwc/otwc.checkbox.view", "nuc/utils/base", "d2/models/workflow/task", "d2/widgets/task.details/impl/task.files.list/task.files.relation.view", "hbs!d2/widgets/task.details/impl/task.files.list/task.files.list.item", "css!d2/widgets/task.details/impl/task.files.list/task.files.list.item" ], function(i18n, _, $, Backbone, Marionette, BlockerView, StandardListItem, TableActionBarView, Accessibility, CheckboxView, base, TaskModel, TaskListRelationView, template) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable(), oldOnShowInlineMenu = StandardListItem.prototype.onShowInlineMenu, oldOnHideInlineMenu = StandardListItem.prototype.onHideInlineMenu;
  var TaskFilesListItem = StandardListItem.extend({
    className: "d2-task-files-list-item csui-item-standard binf-list-group-item",
    template: template,
    tagName: function() {
      return "a";
    },
    setElementData: function() {
      this.$el.prop("tabindex", "-1");
      return this.$el;
    },
    ui: {
      inlineBarContainer: ".inline-action-bar-container",
      relationCount: ".d2-task-file-relation-count",
      moreActions: ".csui-tileview-more-btn",
      titleName: ".list-item-title",
      cbContainer: ".selection-cb-container"
    },
    events: {
      "click @ui.inlineBarContainer": "onInlineBarClick",
      focus: "onFocus",
      keydown: "onKeyDownItem",
      "keydown @ui.relationCount": "onRelationCountKeyDown",
      "click @ui.relationCount": "onRelationCountClick",
      "change otc-checkbox": "onCheckBoxChange"
    },
    constructor: function TaskFilesListItem(options) {
      this.filesListView = options.filesListView;
      this.originatingView = options.originatingView;
      this.collection = this.originatingView && this.originatingView.collection;
      this.showPopup = true;
      StandardListItem.prototype.constructor.apply(this, arguments);
      if (!this.collection.options.widgetName) {
        this.collection.options["widgetName"] = this.originatingView.context.viewStateModel.getViewState("widget_name") || this.originatingView.context.viewStateModel.getViewState("task_list_widget_name");
      }
      this.$el.off("click").on("click", ".list-item-title", _.bind(function(event) {
        if (this.isControlClick(event)) {} else {
          event.preventDefault();
          event.stopPropagation();
          this.triggerMethod("click:item");
        }
      }, this)).on("click", ".d2-task-file-relation-count", _.bind(function(event) {
        this.onRelationCountClick(event);
      }, this));
      this.originatingView && BlockerView.delegate(this, this.originatingView);
      accessibleTable && this.$el.addClass("accessible");
      if (base.isIE11()) {
        this.$el.addClass("msie");
      }
      this.listenTo(this, "hidePopover", this.hidePopoverAction);
      this.originatingView && this.listenTo(this.originatingView, "highlight", _.bind(this._highlightAttachment, this));
      this.listenTo(this.model, "highlight", _.bind(this._highlightAttachment, this));
      this.listenTo(this.filesListView, "activate:tab", _.bind(this._destroyRelations, this));
      this.listenTo(this.filesListView, "d2:files:list:scroll", _.bind(this._destroyRelations, this));
      this.stateView = new CheckboxView({
        model: new Backbone.Model({
          attr_checked: false
        })
      });
      this.listenTo(this.stateView.getModel(), "change:attr_checked", this._onCheckboxStateChanged);
    },
    _onCheckboxStateChanged: function(model) {
      this.trigger("selection:changed", model.get("attr_checked"));
      if (this.stateView.model.get("attr_checked")) {
        this.ui.inlineBarContainer.addClass("binf-hidden");
        this.inlineBarView?.destroy();
        this.inlineBarView = null;
      }
    },
    _highlightAttachment: function(highlight) {
      highlight ? this.$el.addClass("attachment-highlight") : this.$el.removeClass("attachment-highlight");
    },
    _setInlineActions: function(options) {
      this.showInlineActionBar = true;
      this.toolbarItems = options.toolbarData.toolbaritems;
      this.toolbarItemsOptions = this.toolbarItems.inlineActionbar.options;
      this.toolbarItemsMasks = options.toolbarData.toolbarItemsMasks;
      this.timeout = options.timeout || 750;
      if (!accessibleTable) {
        this.events = _.extend(this.events, {
          mouseenter: "onShowInlineMenu",
          mouseleave: "onHideInlineMenu"
        });
      }
    },
    onRender: function() {
      StandardListItem.prototype.onRender.apply(this, arguments);
      if (base.isTouchBrowser()) {
        this.onShowInlineMenu($.Event());
      }
      this.relations = false;
      if (!this.filesListView.firstItem) {
        this.filesListView.firstItem = this.$el.first();
        this.filesListView.firstItem && this.filesListView.firstItem.prop("tabindex", "0");
        this.filesListView.selectedIndex = 0;
      }
      if (!this.options.hideListItemViewCheckbox) {
        this.rgnCBContainer = new Marionette.Region({
          el: this.ui.cbContainer[0]
        });
        this.rgnCBContainer.show(this.stateView);
      }
    },
    onShowInlineMenu: function(event) {
      if (event?.target !== this.el) {
        return;
      }
      if (this.stateView.model.get("attr_checked")) {
        return;
      }
      if (event && event.type === "mouseenter") {
        this._showInlineBarTimeout = setTimeout(_.bind(this._showInlineMenu, this), this.timeout);
      } else {
        if (this.inlineBarView) {
          this.ui.inlineBarContainer.addClass("binf-hidden");
          this.inlineBarView.destroy();
          this.inlineBarView = null;
        }
        if (!this.tileViewToolbarItems) {
          this.tileViewToolbarItems = {
            inlineActionbar: this.toolbarItems.inlineActionbar.clone()
          };
          this.tileViewToolbarItems.inlineActionbar.options.maxItemsShown = 1;
          this.tileViewToolbarItems.inlineActionbar.options.notOccupiedSpace = 0;
        }
        oldOnShowInlineMenu.apply(this, arguments);
        this.model.setNonPromotedActionsOptions && this.model.setNonPromotedActionsOptions({
          isNonPromoted: true
        });
        this._inlineMenuView.on("before:execute:command", this._onBeforeExecuteCommand.bind(this));
        this._inlineMenuView.on("after:execute:command", this._onAfterExecuteCommand.bind(this));
        this.ui.moreActions.removeClass("binf-hidden");
      }
    },
    _showInlineMenu: function() {
      if (!this.isDestroyed && !this._inlineMenuView) {
        if (!this.inlineBarView) {
          this.inlineBarView = new TableActionBarView(_.extend({}, this.toolbarItemsOptions, {
            context: this.options.context,
            originatingView: this,
            commands: this.defaultActionController.commands,
            model: this.model,
            collection: this.toolbarItems.inlineActionbar,
            containerCollection: this.model.collection,
            status: {
              originatingView: this
            },
            inlineBarStyle: "csui-table-actionbar-bubble",
            toolItemsMask: this.toolbarItemsMasks.toolbars.inlineActionbar,
            addGroupSeparators: true
          }));
          this.inlineBarView.on("before:execute:command", this._onBeforeExecuteCommand.bind(this));
          this.inlineBarView.on("after:execute:command", this._onAfterExecuteCommand.bind(this));
        }
        this.ui.inlineBarContainer.removeClass("binf-hidden");
        var inlineBarRegion = new Marionette.Region({
          el: this.ui.inlineBarContainer
        });
        inlineBarRegion.show(this.inlineBarView);
      }
    },
    onHideInlineMenu: function() {
      if (base.isTouchBrowser()) {
        return;
      }
      if (this._showInlineBarTimeout) {
        clearTimeout(this._showInlineBarTimeout);
        this._showInlineBarTimeout = null;
      }
      if (oldOnHideInlineMenu.apply(this, arguments)) {
        this.ui.moreActions.addClass("binf-hidden");
      }
      if (this.inlineBarView) {
        this.ui.inlineBarContainer.addClass("binf-hidden");
        this.inlineBarView.destroy();
        this.inlineBarView = null;
      }
    },
    _onBeforeExecuteCommand: function(eventArgs) {
      this.beforeExecuteNodes = eventArgs && eventArgs.status && eventArgs.status.nodes;
      this._includeAdditionalCommandStatusParams(eventArgs.status);
    },
    _onAfterExecuteCommand: function(eventArgs) {
      if (eventArgs && eventArgs.status && eventArgs.status.nodes && eventArgs.status.nodes.length && eventArgs.commandSignature !== "UnreserveDoc") {
        var nodes = this.beforeExecuteNodes && this.beforeExecuteNodes.length ? this.beforeExecuteNodes.models : eventArgs.status.nodes.models, refreshNodeIds = _.map(nodes, function(node) {
          return node.get("id");
        });
        this.beforeExecuteNodes = undefined;
        this.options.originatingView && this.options.originatingView.additionalPanelsView && this.options.originatingView.additionalPanelsView.trigger("d2:refresh:task:attachment", this.options.filesListView, refreshNodeIds);
      }
    },
    _includeAdditionalCommandStatusParams: function(status) {
      return _.defaults(status, {
        context: this.options.context,
        task: this.options.parentModel,
        workflow: this.options.parentModel,
        selectedNodeId: this.model.get("id"),
        selectedFileTab: this.options.tabModel.get("name"),
        selectedMetaTab: ""
      });
    },
    _onClickRelationsMore: function() {
      var cmdOpenFiles = this.options.parentModel instanceof TaskModel ? this.defaultActionController.commands.get("D2-OpenTaskFiles") : this.defaultActionController.commands.get("D2-OpenWorkflowFiles"), cmdStatus = this._includeAdditionalCommandStatusParams({
        selectedMetaTab: "relations"
      });
      if (cmdOpenFiles) {
        cmdOpenFiles.execute(cmdStatus);
        this._destroyRelations();
      }
    },
    onFocus: function() {
      if (this.filesListView.selectedIndex === -1) {
        this.filesListView.selectedIndex = this.filesListView.collection.indexOf(this.model);
      }
    },
    onInlineBarClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
    },
    onKeyDownItem: function(event) {
      var $target = $(event.target);
      switch (event.keyCode) {
       case 40:
        if (this.ui.moreActions.is($target) || this.ui.moreActions.has($target).length || this.ui.titleName.is($target)) {
          this.ui.relationCount.trigger("focus");
        } else if (this.ui.relationCount.is($target)) {
          event.stopPropagation();
          event.preventDefault();
        }
        break;

       case 38:
        if (this.ui.relationCount.is($target)) {
          this.ui.titleName.prop("tabindex", -1).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        }
        break;
      }
    },
    onRelationCountKeyDown: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.showPopover(event);
        break;

       case 27:
        this.hidePopover(event);
      }
    },
    onRelationCountClick: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.relations && !this.firstLoad && !this.preventToggle) {
        if (!this.ui.relationCount.data("binf.popover") || !this.ui.relationCount.data("binf.popover").options.content) {
          this.ui.relationCount.binf_popover("destroy");
          this.ui.relationCount.binf_popover(this.popoverOptions);
        }
        this.onHideInlineMenu(event);
        this.ui.relationCount.data("binf.popover").options.placement = this.getRelationPopoverPlacement();
        this.ui.relationCount.binf_popover("toggle");
        this._popOverPosition();
        this.relations.$el.find(".binf-list-group").perfectScrollbar("update");
        this.relations.$el.find(".binf-list-group").focus();
      } else if (!this.preventToggle) {
        this.showPopover(event);
      }
      this.firstLoad = false;
    },
    _popOverPosition: function() {
      if ($(window).innerHeight() - parseInt(this.relations.$el.parent().parent()[0].getBoundingClientRect().bottom) <= 0 && this.filesListView.$el.find(".binf-list-group a").last().is(this.$el)) {
        var top = parseInt(this.relations.$el.parent().parent().css("top").replace("px", "")) - 5;
        this.relations.$el.parent().parent().css({
          top: top
        });
      }
    },
    showPopover: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var self = this, isTouchEvent = e.originalEvent && e.originalEvent.sourceCapabilities && e.originalEvent.sourceCapabilities.firesTouchEvents;
      this.firstLoad = isTouchEvent ? true : false;
      if (!this.relations) {
        this.loadRelationPopover().done(function() {
          if (self.model.get("relations_count") && self.showPopup) {
            self.onHideInlineMenu(e);
            self.ui.relationCount.binf_popover("show");
            self._popOverPosition();
            self.relations.trigger("ensure:scrollbar");
          } else if (self.model.get("relations_count")) {
            self.showPopup = true;
          }
        });
      } else {
        this.onHideInlineMenu(e);
        if (!this.ui.relationCount.data("binf.popover") || !this.ui.relationCount.data("binf.popover").options.content) {
          this.ui.relationCount.binf_popover("destroy");
          this.ui.relationCount.binf_popover(this.popoverOptions);
        }
        this.ui.relationCount.binf_popover("toggle");
        this.relations.$el.find(".binf-list-group").perfectScrollbar("update");
        this.relations.$el.find(".binf-list-group").focus();
      }
    },
    hidePopover: function(e) {
      var self = this;
      if (e && self.relations && self.relations.$el.parent().parent().find(e.relatedTarget).length === 0) {
        e.preventDefault();
        e.stopPropagation();
        self.hidePopoverAction();
        if (self.$el.find(e.relatedTarget).length !== 0) {
          self._showInlineMenu();
        }
      } else {
        self.showPopup = false;
      }
    },
    hidePopoverAction: function() {
      this.ui.relationCount.binf_popover("hide");
      this.firstLoad = false;
    },
    _destroyRelations: function() {
      this.ui.relationCount.data("binf.popover") && this.ui.relationCount.binf_popover("destroy");
    },
    getRelationPopoverPlacement: function() {
      var offset = this.$el.find(".d2-task-file-relation-count").offset(), relationCountWidth = this.$el.find(".d2-task-file-relation-count").outerWidth(), winWidth = $(window).width();
      if (i18n.settings.rtl) {
        if (offset.left > 270) {
          return "left";
        } else {
          return "right";
        }
      } else {
        if (winWidth - (offset.left + relationCountWidth) > 270) {
          return "right";
        } else {
          return "left";
        }
      }
    },
    loadRelationPopover: function() {
      var deferred = $.Deferred();
      var self = this;
      if (this.model.get("relations_count") && !this.relations) {
        var relOptions = {
          node: self.options.model,
          context: self.context,
          relationView: self
        };
        self.relations = new TaskListRelationView(relOptions);
        BlockerView.imbue(self.relations);
        self.relations.render();
        self.relations.on("click:more", self._onClickRelationsMore.bind(self));
        self.popoverOptions = {
          content: self.relations.$el,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          viewport: self.filesListView.$el,
          template: '<div class="binf-popover d2-task-item-relation-popup" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: "right",
          trigger: "manual"
        };
        self.popoverOptions.placement = self.getRelationPopoverPlacement();
        self.ui.relationCount.binf_popover(self.popoverOptions);
        deferred.resolve();
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    onCheckBoxChange: function(event) {
      this.stateView._onStateChange(event);
    },
    onBeforeDestroy: function() {
      this.stateView && this.stateView.destroy();
      this.formView && this.formView.destroy();
    }
  });
  return TaskFilesListItem;
});