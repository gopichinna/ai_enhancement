/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/controls/progressblocker/blocker", "nuc/models/nodes", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "csui/utils/commands", "d2/models/workflow/workflows", "d2/widgets/workflowstable/impl/workflow.notes/workflow.notes.popover.view", "d2/models/workflow/task.notes", "csui/utils/contexts/factories/connector", "hbs!d2/controls/table/cells/workflow.note/impl/workflow.note", "i18n!d2/controls/table/cells/workflow.note/impl/nls/lang", "csui/controls/icons.v2", "css!d2/controls/table/cells/workflow.note/impl/workflow.note" ], function(i18n, _, $, Backbone, BlockerView, NodeCollection, TemplatedCellView, cellViewRegistry, commands, WorkflowCollection, WorkflowNotesPopoverView, TaskNoteCollection, ConnectorFactory, template, lang) {
  "use strict";
  var WorkflowNoteCellView = TemplatedCellView.extend({
    template: template,
    needsAriaLabel: true,
    ui: {
      noteItem: ".d2-table-cell-note-container"
    },
    events: {
      keydown: "onKeyInView",
      "click @ui.noteItem": "onClickNote"
    },
    constructor: function WorkflowNoteCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model.actions, "update", function() {
        this.render();
      });
      this.listenTo(this.model, "d2:note:added", function() {
        this.$el.children().binf_popover("destroy");
        this.contentView = null;
        this.collection = null;
        !this.model.get("has_notes") && this.model.set("has_notes", true) && this.render();
      });
    },
    onClickNote: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var me = this;
      if (this.$el.find(".d2_action_add_task_note").length !== 0) {
        this.addNotesCmd && this.addNotesCmd.execute({
          nodes: new NodeCollection([ this.model ])
        }).done(function() {
          me.model.set("has_notes", true);
        });
      } else {
        if (this.contentView && !this.firstLoad && !this.preventToggle) {
          if (!this.ui.noteItem.data("binf.popover") || !this.ui.noteItem.data("binf.popover").options.content) {
            this.ui.noteItem.binf_popover("destroy");
            this.ui.noteItem.binf_popover(this.popoverOptions);
          }
          if ($($.find(".d2-workflow-item-notes-popup")[0]).data("binf.popover") && $($.find(".d2-workflow-item-notes-popup")[0]).data("binf.popover").options.content) {
            var previousPopover = $($.find(".d2-workflow-item-notes-popup")[0]);
            previousPopover.binf_popover("destroy");
            previousPopover.binf_popover(this.popoverOptions);
          }
          this.ui.noteItem.binf_popover("toggle");
          this.contentView.getElementByIndex(this.contentView.selectedIndex) && this.contentView.getElementByIndex(this.contentView.selectedIndex).focus();
        } else if (!this.preventToggle) {
          this.showPopover(event);
        }
        this.firstLoad = false;
      }
    },
    destroypopup: function() {
      var me = this;
      _.each(this.options.tableView.$el.find(".d2-table-cell-note-container"), function(each) {
        if ($(each).data("binf.popover") && $(each).data("binf.popover").options.content) {
          $(each).binf_popover("hide");
          $(each).binf_popover(me.popoverOptions);
        }
      });
    },
    showPopover: function(event) {
      var me = this;
      this.context = this.options.context;
      var isTouchEvent = event.originalEvent && event.originalEvent.sourceCapabilities && event.originalEvent.sourceCapabilities.firesTouchEvents;
      this.firstLoad = !!isTouchEvent;
      this.destroypopup();
      this.collection = this.collection || new TaskNoteCollection(undefined, {
        connector: this.context.getObject(ConnectorFactory),
        taskModel: this.model,
        autoreset: true,
        topRecords: 5
      });
      this.collection.fetch().done(function() {
        me.contentView = new WorkflowNotesPopoverView({
          context: me.context,
          collection: me.collection,
          workflowModel: me.model,
          cellView: me
        });
        me.options.tableView.on("scroll", _.bind(function() {
          me.contentView.trigger("d2:workflow:files:scroll");
        }, me));
        me.options.tableView.on("changed:focus", _.bind(function() {
          if (!(document.activeElement.classList.contains("d2-task-note") || document.activeElement.classList.contains("d2-table-cell-workflow-note"))) {
            me.contentView.trigger("changed:focus");
          }
        }, me));
        BlockerView.imbue(me.contentView);
        me.contentView.render();
        me.popoverOptions = {
          content: me.contentView.$el,
          html: true,
          container: $.fn.binf_modal.getDefaultContainer(),
          viewport: $(".d2-table-view"),
          template: '<div class="binf-popover d2-workflow-item-notes-popup" role="tooltip"><div class="binf-arrow"></div><div class="binf-popover-content"></div></div>',
          placement: i18n.settings.rtl ? "right" : "left",
          trigger: "manual"
        };
        me.ui.noteItem.binf_popover(me.popoverOptions);
        if (!me.ui.noteItem.data("binf.popover") || !me.ui.noteItem.data("binf.popover").options.content) {
          me.ui.noteItem.binf_popover("destroy");
          me.ui.noteItem.binf_popover(me.popoverOptions);
        }
        me.ui.noteItem.binf_popover("toggle");
        me.contentView.getElementByIndex(0).focus();
        me.contentView.trigger("ensure:scrollbar");
        me.contentView.$el.children().perfectScrollbar("update");
      });
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.onClickNote(event);
      }
    },
    getValueData: function() {
      var icon, tooltip;
      if (this.model.get("show_notes")) {
        if (this.model.get("has_notes")) {
          icon = "d2_action_view_notes";
          tooltip = lang.ViewNotesTip;
        } else {
          this.addNotesCmd = commands.get("D2-AddWorkflowNote");
          var enabled = this.addNotesCmd && this.addNotesCmd.enabled({
            nodes: new NodeCollection([ this.model ])
          });
          icon = enabled ? "d2_action_add_task_note" : "";
          tooltip = lang.AddNoteTip;
        }
      }
      return {
        tooltip: tooltip,
        iconName: icon
      };
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-table-cell-workflow-note"
  });
  cellViewRegistry.registerByColumnKey("d2_workflow_note", WorkflowNoteCellView);
  return WorkflowNoteCellView;
});