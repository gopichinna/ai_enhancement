/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/checkbox/checkbox.view", "csui/controls/icon/icon.view", "csui/controls/listitem/inline.menu.view", "csui/controls/progressblocker/blocker", "nuc/models/nodes", "csui/utils/commands", "d2/controls/workflow.state/workflow.state.view", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/models/workflow/workflow.audit.task.events", "d2/utils/constants", "d2/utils/format.utils", "dctmw/utils/utils", "d2/widgets/workflowstable/workflow.toolbaritems", "d2/widgets/workflowstable/workflow.toolbaritems.masks", "d2/models/workflow/task.notes", "d2/widgets/workflowstable/impl/workflow.notes/workflow.notes.popover.view", "i18n!d2/widgets/workflow.timeline/impl/nls/lang", "d2/widgets/workflow.timeline/impl/wf.timeline.task.events.alert.view", "hbs!d2/widgets/workflow.timeline/impl/wf.timeline.item.task", "css!d2/widgets/workflow.timeline/impl/wf.timeline.item", "css!d2/widgets/workflow.timeline/impl/wf.timeline.item.task" ], function(_, $, Backbone, Marionette, base, CheckboxView, IconView, InlineMenuView, BlockingView, NodeCollection, commands, WorkflowStateView, WorkflowAuditTask, WorkflowAuditTaskEvent, WorkflowAuditTaskEventCollection, constants, formatUtil, utils, workflowToolItems, WorkflowToolItemsMasks, TaskNoteCollection, WorkflowNotesPopoverView, lang, WFTaskEventsAlertView, template) {
  "use strict";
  var eventDetailsAttributeToLabelMap = {
    note_text: lang.note,
    delegated_to: lang.delegatedTo,
    intention: lang.intention,
    mail_address: lang.email,
    mail_subject: lang.subject,
    mail_message: lang.message
  }, eventDetailsAttributes = [ "note_text", "delegated_to", "intention", "mail_address", "mail_subject", "mail_message" ];
  var getTransitionEndEvent = _.once(function() {
    var transitions = {
      transition: "transitionend",
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "oTransitionEnd otransitionend"
    }, element = document.createElement("div"), transition;
    for (transition in transitions) {
      if (typeof element.style[transition] !== "undefined") {
        return transitions[transition];
      }
    }
  });
  var CustomCheckboxView = CheckboxView.extend({
    calculateIconName: function() {
      CheckboxView.prototype.calculateIconName.apply(this, arguments);
      if (this._iconName === "csui_checkbox-selected") {
        this._iconName = "d2_state_checkbox-selected";
      }
      return this._iconName;
    },
    _toggleChecked: function(e) {
      e.stopPropagation();
      CheckboxView.prototype._toggleChecked.apply(this, arguments);
    }
  });
  var NonTabableWFStateView = WorkflowStateView.extend({
    attributes: {},
    behaviors: {}
  });
  var WorkflowTimelineItemTaskView = Marionette.CompositeView.extend({
    className: "d2-workflow-timeline-item-container d2-wf-timeline-task-container",
    template: template,
    ui: {
      selfDetails: "> .d2-workflow-timeline-item",
      selectionContainer: "> .d2-workflow-timeline-item .selection-control",
      commentBtn: "> .d2-workflow-timeline-item .comments",
      status: "> .d2-workflow-timeline-item .status",
      inlineMenuContainer: "> .d2-workflow-timeline-item .inline-context-menu",
      expandCollapse: "> .d2-workflow-timeline-item .item-expand-collapse",
      loadingContainer: "> .d2-workflow-timeline-item .csui-loading-parent-wrapper"
    },
    events: {
      "click @ui.selfDetails": "onSelfClick",
      "click @ui.commentBtn": "onCommentButtonClick",
      "keydown @ui.commentBtn": "onKeyInComment",
      "click @ui.expandCollapse": "onExpandCollapseClick",
      "focusin @ui.selfDetails": "onSelfFocusIn",
      "focusout @ui.selfDetails": "onSelfFocusOut",
      "mouseenter @ui.selfDetails": "_createInlineMenu",
      "mouseleave @ui.selfDetails": "onSelfMouseLeave",
      "keyup @ui.selfDetails": "onSelfKeyUp"
    },
    childViewContainer: "> .d2-workflow-timeline-subitems",
    childEvents: {
      "set:selection": "onChildSetSelection",
      "clear:selection": "onChildClearSelection"
    },
    childViewOptions: function() {
      return {
        timelineView: this.options.timelineView,
        parentView: this
      };
    },
    constructor: function WorkflowTimelineItemTaskView(options) {
      options = options || {};
      var collection = options.collection, model = options.model || options.node;
      if (model instanceof WorkflowAuditTask) {
        options.collection = collection || model.auditEvents;
        options.model = model;
      } else if (model instanceof WorkflowAuditTaskEvent) {
        options.collection = undefined;
        options.model = model;
        var eventDetails = [];
        _.find(eventDetailsAttributes, function(eventDetailsAttribute) {
          if (model.get(eventDetailsAttribute)) {
            if (eventDetailsAttribute === "delegated_to") {
              eventDetails = [ {
                v: model.get(eventDetailsAttribute),
                s: true,
                pt: eventDetailsAttributeToLabelMap[eventDetailsAttribute]
              } ];
              return true;
            } else {
              var value = _.str.sformat(lang.eventDetailsFormat, eventDetailsAttributeToLabelMap[eventDetailsAttribute], model.get(eventDetailsAttribute));
              eventDetails.push(value);
            }
          }
        });
        if (!model.get("delegated_to")) {
          eventDetails = eventDetails.join("<br/>");
        }
        model.set("event_details", eventDetails, {
          silent: true
        });
      } else {
        throw new Error("A WorkflowAuditTask or WorkflowAuditTaskEvent is required.");
      }
      if (collection && !(collection instanceof WorkflowAuditTaskEventCollection)) {
        throw new Error("collection should be of type WorkflowAuditTaskEventCollection");
      }
      this.workflowModel = options.workflowModel;
      this.context = options.context;
      WorkflowTimelineItemTaskView.__super__.constructor.call(this, options);
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this, "click:more", this._openFullNote.bind(this));
      this._setupDefaultOptions();
      this.model instanceof WorkflowAuditTaskEvent && this.listenTo(this.model, "d2:note:added", function() {
        this.noteAdded = true;
      }.bind(this));
      this.listenTo(this.model, "d2:note:added", this._refreshComments.bind(this));
      this.listenTo(this.model, "d2:note:added", this.refreshCollection.bind(this));
      if (this.collection) {
        this.listenTo(this.collection, "sync", this.onCollectionRequestSync).listenTo(this.collection, "error", this.onCollectionRequestError);
      }
    },
    refreshCollection: function() {
      var taskItemView = this.model instanceof WorkflowAuditTask ? this : this.options.parentView;
      if (taskItemView.collection && taskItemView.collection.fetched) {
        if (taskItemView.collection.isExpanded) {
          taskItemView.$(taskItemView.childViewContainer).addClass("notransition");
          taskItemView.blockActions();
          taskItemView.collection.fetch({
            reload: true,
            reset: true
          }).always(function() {
            taskItemView.unblockActions();
            taskItemView.showAllChildElements();
            taskItemView.options.timelineView.$el.find(".timeline-graph").perfectScrollbar("update");
            if (this.model instanceof WorkflowAuditTaskEvent) {
              var oldSelectedView = taskItemView.options && taskItemView.options.timelineView && taskItemView.options.timelineView.oldSelectedView;
              if (oldSelectedView) {
                taskItemView.oldSelectedModelAttrs = _.clone(oldSelectedView.model.attributes);
                if (taskItemView.collection.findWhere({
                  eventId: taskItemView.oldSelectedModelAttrs.eventId
                })) {
                  oldSelectedView.destroy();
                  delete taskItemView.options.timelineView.oldSelectedView;
                }
                if (this.noteAdded) {
                  taskItemView._parent.options.originatingView.showNotesTab = true;
                  taskItemView._parent.options.originatingView.highlightFirstNote = true;
                  this.noteAdded = false;
                }
                taskItemView.updateSelection();
              }
            }
          }.bind(this));
        } else {
          taskItemView.collection.fetched = false;
        }
      }
    },
    onCollectionRequestSync: function(collection) {
      if (collection.length) {
        this.hideSubItemsAlertView();
      } else {
        collection.fetched = false;
        this.showSubItemsAlertView({
          alertMessage: lang.noEventsAlertMessageInfo,
          alertType: "info"
        });
      }
    },
    onCollectionRequestError: function(colleciton, xhr) {
      var err = utils.parseAjaxError(xhr, null, null, true), viewOptions = {
        alertMessage: err.message || err.errorDetails
      };
      this.showSubItemsAlertView(viewOptions);
    },
    showSubItemsAlertView: function(viewOptions) {
      this.$el.addClass("subitems-alert " + (viewOptions.alertType ? "type-" + viewOptions.alertType : ""));
      this.rgnTaskEventsAlert = new Marionette.Region({
        el: this.$(this.childViewContainer)[0]
      });
      this.rgnTaskEventsAlert.show(new WFTaskEventsAlertView(viewOptions));
    },
    hideSubItemsAlertView: function() {
      this.$el.removeClass("subitems-alert type-info");
      this.rgnTaskEventsAlert && this.rgnTaskEventsAlert.destroy();
    },
    _setupDefaultOptions: function() {
      _.defaults(this.options, {
        commands: commands,
        toolbarItems: _.extend({}, workflowToolItems),
        toolbarItemsMasks: new WorkflowToolItemsMasks(this.options),
        originatingView: this,
        blockingParentView: this
      });
    },
    templateHelpers: function() {
      var wfState = this.workflowModel && this.workflowModel.get("d2_workflow_state") || "", itemProperties = this.model instanceof WorkflowAuditTask ? [ {
        label: lang.labelSentDate,
        value: formatUtil.convertToClientFormat(this.model.get("date_sent"), true)
      }, {
        label: lang.labelCompletedDate,
        value: formatUtil.convertToClientFormat(this.model.get("completion_date"), true)
      } ] : [ {
        label: lang.labelDate,
        value: formatUtil.convertToClientFormat(this.model.get("time_stamp"), true)
      } ], options = {
        itemProperties: itemProperties,
        lang: lang,
        hasComment: !this.model.get("wf_sv_disable_notes") && this.model.get("is_note_present") === true,
        hasMenu: this.model instanceof WorkflowAuditTask && this.model.get("task_state") !== constants.WorkflowTaskState.FUTURE && !_.includes([ constants.WorkflowState.ABORTED, constants.WorkflowState.FINISHED ], wfState)
      };
      return _.defaults(options, this.model.attributes);
    },
    onRender: function() {
      if (!this.commentIconView) {
        this.commentIconView = new IconView({
          iconName: "d2_action_view_notes",
          size: "normal",
          states: "true"
        });
        new Marionette.Region({
          el: this.ui.commentBtn
        }).show(this.commentIconView);
      }
      if (!this.wfStatusView && this.model instanceof WorkflowAuditTask) {
        var taskState = this.model.get("task_state"), wfState = this.workflowModel && this.workflowModel.get("d2_workflow_state") || "", applyCombinedState = wfState === constants.WorkflowState.ABORTED && !_.includes([ constants.WorkflowTaskState.FINISHED, constants.WorkflowTaskState.FAULTED, constants.WorkflowTaskState.EVENT_COMPLETED ], taskState), statusModel = new Backbone.Model({
          task_state: applyCombinedState ? taskState + wfState : taskState
        });
        this.wfStatusView = new NonTabableWFStateView({
          model: statusModel,
          statePropertyName: "task_state"
        });
        new Marionette.Region({
          el: this.ui.status
        }).show(this.wfStatusView);
      } else if (!(this.model instanceof WorkflowAuditTask)) {
        this.ui.status.addClass("binf-hidden");
      }
      if (!this.selectionControlView) {
        this.selectionControlView = new CustomCheckboxView();
        new Marionette.Region({
          el: this.ui.selectionContainer
        }).show(this.selectionControlView);
        this.listenTo(this.selectionControlView.model, "change:checked", this.onSelectionControlCheckedChange.bind(this));
      }
      this._createInlineMenu();
    },
    onShow: function() {
      if (this.collection && this.collection.length && this.collection.isExpanded) {
        var oldSelectedView = this.options && this.options.timelineView && this.options.timelineView.oldSelectedView;
        if (oldSelectedView) {
          this.oldSelectedModelAttrs = _.clone(oldSelectedView.model.attributes);
          if (this.collection.findWhere({
            eventId: this.oldSelectedModelAttrs.eventId
          })) {
            oldSelectedView.destroy();
            delete this.options.timelineView.oldSelectedView;
          }
        }
        this.showAllChildElements();
        if (this.collection.fetched && this.oldSelectedModelAttrs) {
          this.updateSelection();
        } else if (!this.collection.fetched) {
          this.blockActions();
          this.$(this.childViewContainer).addClass("notransition");
          this.collection.ensureFetched({
            reload: true,
            reset: true
          }).always(function() {
            this.showAllChildElements();
            this.options.timelineView.$el.find(".timeline-graph").perfectScrollbar("update");
            this.unblockActions();
          }.bind(this));
        }
      } else {
        this.$(this.childViewContainer).removeClass("notransition");
      }
    },
    showAllChildElements: function() {
      var $el = this.$(this.childViewContainer);
      var childHeight = this._getChildHeight(), height = childHeight * (this.rgnTaskEventsAlert ? 1 : this.collection.length);
      if (height) {
        this.ui.expandCollapse.removeClass("icon-expandArrowDown").addClass("icon-expandArrowUp").attr("title", lang.tooltipCollapse);
        this.$el.addClass("item-expanded");
        $el.css({
          height: height
        });
        this.ui.selfDetails[0].offsetHeight;
        $el.removeClass("notransition");
      } else {
        $el.removeClass("notransition");
      }
    },
    onRenderCollection: function() {
      if (this.collection.fetched && this.oldSelectedModelAttrs) {
        this.updateSelection();
      }
    },
    updateSelection: function() {
      var selectedModelInCollection = this.collection.findWhere({
        eventId: this.oldSelectedModelAttrs.eventId
      }), selectableView = selectedModelInCollection && this.children.findByModel(selectedModelInCollection);
      selectableView && selectableView.setSelection();
      delete this.oldSelectedModelAttrs;
    },
    onSelectionControlCheckedChange: function(model, value) {
      if (value === true || value === "true") {
        this.ui.selfDetails.addClass("selected");
        this.trigger("set:selection", this);
        this.options.timelineView && this.options.timelineView.$el.addClass("item-selected");
      } else {
        this.ui.selfDetails.removeClass("selected");
        this.trigger("clear:selection", this);
        if (this.options.timelineView) {
          this.options.timelineView.$el.removeClass("item-selected");
          delete this.options.timelineView.oldSelectedView;
        }
      }
    },
    _refreshComments: function() {
      var taskItemView = this.model instanceof WorkflowAuditTask ? this : this.options.parentView;
      taskItemView.model.set("is_note_present", true);
      if (!taskItemView.model.get("wf_sv_disable_notes")) {
        taskItemView.ui.commentBtn.parent() && taskItemView.ui.commentBtn.parent().removeClass("binf-hidden");
        taskItemView.ui.commentBtn.binf_popover("destroy");
        taskItemView.notePopoverView = null;
        taskItemView.notesCollection = null;
      }
    },
    _openFullNote: function() {
      this.notePopoverView.trigger("changed:focus");
      this._parent.options.originatingView.showNotesTab = true;
      this._parent.options.originatingView.expandFirstNote = true;
      this.selectionControlView.model.set("checked", false);
      this.selectionControlView.$el.click();
    },
    setSelection: function() {
      this.selectionControlView && this.selectionControlView.setChecked(true);
    },
    clearSelection: function() {
      this.selectionControlView && this.selectionControlView.setChecked(false);
    },
    onChildSetSelection: function(view) {
      this.trigger("set:selection", view);
    },
    onChildClearSelection: function(view) {
      this.trigger("clear:selection", view);
    },
    onSelfClick: function() {
      if (this.ui.selfDetails.hasClass("selected")) {
        this.clearSelection();
      } else {
        this.setSelection();
      }
    },
    onCommentButtonClick: function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.notesCollection) {
        if (!this.ui.commentBtn.data("binf.popover") || !this.ui.commentBtn.data("binf.popover").options.content) {
          this.ui.commentBtn.binf_popover("destroy");
          this.ui.commentBtn.binf_popover(this.popoverOptions);
        }
        this.ui.commentBtn.binf_popover("toggle");
        this.notePopoverView && this.notePopoverView.getElementByIndex(0).focus();
      } else {
        this.showPopover(event);
      }
    },
    onKeyInComment: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.onCommentButtonClick(event);
      }
    },
    showPopover: function(event) {
      var me = this;
      var isTouchEvent = event.originalEvent && event.originalEvent.sourceCapabilities && event.originalEvent.sourceCapabilities.firesTouchEvents;
      this.firstLoad = !!isTouchEvent;
      this.notesCollection = this.notesCollection || new TaskNoteCollection(undefined, {
        connector: this.model.connector,
        taskModel: this.model,
        autoreset: true,
        topRecords: 1,
        filterBy: "task"
      });
      this.notesCollection.fetch().done(function() {
        me.notePopoverView = new WorkflowNotesPopoverView({
          context: me.model.connector.context,
          collection: me.notesCollection,
          workflowModel: me.model,
          isTimelineNoteView: true,
          cellView: me.commentIconView,
          originatingView: me
        });
        me._parent.$el.find(".timeline-nodes").on("scroll", _.bind(function() {
          me.notePopoverView.trigger("d2:workflow:files:scroll");
        }, me));
        me.popoverOptions = {
          content: me.notePopoverView.$el,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          viewport: $(".d2-task-metadata-container"),
          template: '<div class="binf-popover d2-workflow-timeline-notes-popup" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: "bottom",
          trigger: "manual"
        };
        me.notePopoverView.render();
        me.ui.commentBtn.binf_popover(me.popoverOptions);
        if (!me.ui.commentBtn.data("binf.popover") || !me.ui.commentBtn.data("binf.popover").options.content) {
          me.ui.commentBtn.binf_popover("destroy");
          me.ui.commentBtn.binf_popover(me.popoverOptions);
        }
        me.ui.commentBtn.binf_popover("toggle");
        me.notePopoverView.$el.find(".d2-task-note > hr").addClass("binf-hidden");
        if (me.notePopoverView.$el.find(".d2-task-note-content")[0].scrollHeight <= parseInt(me.notePopoverView.$el.find(".d2-task-note-content").innerHeight()) + 1) {
          me.notePopoverView.$el.find(".more-link-container").addClass("binf-hidden");
        }
        me.notePopoverView.getElementByIndex(0).focus();
      });
    },
    onExpandCollapseClick: function(event) {
      event && event.stopPropagation();
      if (this.ui.expandCollapse.hasClass("enabled")) {
        this.setExpandedOrCollapsed(this.ui.expandCollapse.hasClass("icon-expandArrowDown"));
      }
    },
    setExpandedOrCollapsed: function(isExpand) {
      var $el = this.$(this.childViewContainer);
      if (!this.$el.hasClass("animating")) {
        var completeExpand = function() {
          this.ui.loadingContainer.addClass("binf-hidden");
          this.$el.removeClass("animating");
          this.ui.expandCollapse.removeClass("icon-expandArrowDown").addClass("icon-expandArrowUp").attr("title", lang.tooltipCollapse);
          this.ui.expandCollapse.removeClass("binf-hidden");
          this.collection.isExpanded = true;
          this.options.timelineView && this.options.timelineView.$el.find(".timeline-graph").perfectScrollbar("update");
          this.trigger("children:expanded", this);
        }.bind(this), completeCollapse = function() {
          this.$el.removeClass("animating");
          this.ui.expandCollapse.addClass("icon-expandArrowDown").removeClass("icon-expandArrowUp").attr("title", lang.tooltipExpand);
          this.$el.removeClass("item-expanded");
          this.collection.isExpanded = false;
          this.options.timelineView && this.options.timelineView.$el.find(".timeline-graph").perfectScrollbar("update");
          this.trigger("children:collapsed", this);
        }.bind(this);
        if (isExpand && this.collection) {
          this.$el.addClass("item-expanded");
          this.$el.addClass("animating");
          !this.collection.fetched && this.ui.loadingContainer.removeClass("binf-hidden");
          !this.collection.fetched && this.ui.expandCollapse.addClass("binf-hidden");
          this.collection.ensureFetched({
            reload: true,
            reset: true
          }).always(function() {
            var childHeight = this._getChildHeight(), height = childHeight * (this.rgnTaskEventsAlert ? 1 : this.collection.length);
            if (height) {
              $el.one(getTransitionEndEvent(), completeExpand);
              $el.css({
                height: height
              });
            } else {
              this.ui.loadingContainer.addClass("binf-hidden");
              this.$el.removeClass("item-expanded");
              this.ui.expandCollapse.removeClass("binf-hidden");
              this.$el.removeClass("animating");
            }
          }.bind(this));
        } else if ($el.height() > 0) {
          $el.one(getTransitionEndEvent(), completeCollapse);
          this.$el.addClass("animating");
          $el.css({
            height: 0
          });
          this.clearSelectionOnChildren();
        }
      }
    },
    _getChildHeight: function() {
      return this.children && this.children.length ? this.children.findByIndex(0).$el.outerHeight() : this.rgnTaskEventsAlert ? this.rgnTaskEventsAlert.currentView.$el.outerHeight() : 0;
    },
    clearSelectionOnChildren: function() {
      if (this.options && this.options.timelineView && this.options.timelineView.selectedView) {
        var selectedModelInCollection = this.collection.findWhere({
          eventId: this.options.timelineView.selectedView.model.get("eventId")
        }), selectableView = selectedModelInCollection && this.children.findByModel(selectedModelInCollection);
        selectableView && selectableView.clearSelection();
      }
    },
    _createInlineMenu: function() {
      var taskState = this.model.get("task_state"), wfState = this.workflowModel && this.workflowModel.get("d2_workflow_state") || "";
      if (!this._inlineMenuView && this.model instanceof WorkflowAuditTask && taskState !== constants.WorkflowTaskState.FUTURE && !_.includes([ constants.WorkflowState.ABORTED, constants.WorkflowState.FINISHED ], wfState)) {
        var rgnMenuBar = new Marionette.Region({
          el: this.ui.inlineMenuContainer
        });
        this._inlineMenuView = new InlineMenuView(_.defaults({
          context: this.context,
          model: this.model,
          tileViewToolbarItems: {
            inlineActionbar: this.options.toolbarItems.timelineInlineActionBar
          }
        }, this.options, {
          originatingView: this
        }));
        this._inlineMenuView.inlineActionbarOptions = _.extend({}, this._inlineMenuView.inlineActionbarOptions, {
          container: null
        }, this.model.get("is_digital_signature_awaiting_task") ? {
          toolItemsMask: this.options.toolbarItemsMasks.toolbars.timelineDigitalSignatureInlineActionBar
        } : {
          toolItemsMask: this.options.toolbarItemsMasks.toolbars.timelineInlineActionBar
        });
        this._inlineMenuView.on("before:execute:command", this.beforeExecuteCommand.bind(this)).on("after:execute:command", this.afterExecuteCommand.bind(this));
        rgnMenuBar.show(this._inlineMenuView);
      }
    },
    beforeExecuteCommand: function(eventArgs) {
      if (eventArgs.commandSignature === "D2-WorkflowAbort") {
        _.extend(eventArgs.status, {
          nodes: new NodeCollection([ this.workflowModel ])
        });
      }
    },
    afterExecuteCommand: function() {},
    onSelfFocusIn: function() {
      this.ui.selfDetails.addClass("focused");
      this._inlineMenuView && this._inlineMenuView.$el.find("[tabindex]:visible").first().attr("tabindex", 0);
    },
    onSelfFocusOut: function(e) {
      if (!e || !$.contains(this.ui.selfDetails[0], e.relatedTarget)) {
        this.ui.selfDetails.removeClass("focused");
      }
    },
    onSelfMouseLeave: function(e) {
      if (this._inlineMenuView && !$.contains(this.ui.selfDetails[0], e.relatedTarget) && !base.isTouchBrowser()) {
        this._inlineMenuView.destroy();
        delete this._inlineMenuView;
      }
    },
    onSelfKeyUp: function(e) {
      if (e && (e.keyCode === 13 || e.keyCode === 32)) {
        e.preventDefault();
        e.stopPropagation();
        if (!this._inlineMenuView || !$.contains(this._inlineMenuView.el, e.target)) {
          $(e.target).trigger("click");
        }
      }
    },
    onBeforeDestroy: function() {
      this.commentIconView && this.commentIconView.destroy();
      this.selectionControlView && this.selectionControlView.destroy();
      this.wfStatusView && this.wfStatusView.destroy();
      this._inlineMenuView && this._inlineMenuView.destroy();
    }
  });
  return WorkflowTimelineItemTaskView;
});