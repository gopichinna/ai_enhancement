/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/nodesprites", "dctmw/controls/list/sortable.list.view", "dctmw/controls/list/list.state.view", "d2/controls/file.uploader/impl/uploaded.file.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "dctmw/utils/rest.resources", "i18n!d2/dialogs/new.file/emails/impl/nls/lang", "hbs!d2/dialogs/new.file/emails/impl/email.item", "hbs!d2/dialogs/new.file/emails/impl/email.attachment", "hbs!d2/dialogs/new.file/emails/impl/email.attachment.details", "hbs!d2/dialogs/new.file/emails/impl/email.attachments.summary.empty", "css!d2/dialogs/new.file/emails/impl/email.attachments.summary" ], function(_, $, Backbone, Marionette, LayoutViewEventsPropagationMixin, PerfectScrollingBehavior, NodeSpriteCollection, SortableListView, EmptyListView, UploadedFileView, WizardTabableRegionBehavior, RestResources, lang, tmplEmailItem, tmplEmailAttachment, tmplEmailAttachmentDetails, tmplEmailSummaryEmpty) {
  "use strict";
  var UploadedFileViewAdapter = UploadedFileView.extend({
    template: tmplEmailAttachmentDetails,
    constructor: function UploadedFileViewAdapter() {
      UploadedFileView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      var superOptions = UploadedFileView.prototype.templateHelpers.apply(this, arguments);
      return _.extend(superOptions, {
        isCreationSupported: this.model.isCreationSupported,
        exclusionMessage: () => {
          if (this.model.id === "E_MIP_OBJECT_UNSUPPORTED_OPERATION") {
            return lang.E_MIP_OBJECT_UNSUPPORTED_OPERATION;
          }
          return lang.emailAttachmentExclusionMessage;
        },
        showFileIcon: () => {
          if (this.model.id === "E_MIP_OBJECT_UNSUPPORTED_OPERATION") {
            return false;
          }
          return true;
        }
      });
    },
    onRender: function() {
      if (this.model.isCreationSupported) {
        return UploadedFileView.prototype.onRender.apply(this, arguments);
      }
      this.$el.addClass("uploaded-file");
    }
  });
  var AttachmentView = Marionette.LayoutView.extend({
    className: "d2-email-attachment",
    template: tmplEmailAttachment,
    regions: {
      attachmentDetailsContainer: "> .attachment-details"
    },
    ui: {
      attachmentDetailsContainer: "> .attachment-details",
      btnRemoveAttachment: "> .attachment-remove"
    },
    events: {
      "click @ui.btnRemoveAttachment": "onRemoveAttachment"
    },
    constructor: function AttachmentView(options) {
      options = options || {};
      this.parentCollection = options.parentCollection;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },
    templateHelpers: function() {
      return {
        isCreationSupported: this.model.isCreationSupported,
        toolTip: lang.emailAttachmentRemoveTooltip,
        ariaLabel: lang.emailAttachmentRemoveTooltip
      };
    },
    onRender: function() {
      if (!this.detailsView) {
        this.detailsView = new UploadedFileViewAdapter(_.extend({
          el: this.ui.attachmentDetailsContainer[0]
        }, this.options));
        this.detailsView.render();
        this.detailsView.$el.removeAttr("data-d2-key");
        this.attachmentDetailsContainer.attachView(this.detailsView);
      }
    },
    onRemoveAttachment: function(event) {
      event && event.preventDefault();
      event && event.stopPropagation();
      this.parentCollection && this.parentCollection.remove(this.model);
    },
    onBeforeDestroy: function() {
      if (this.detailsView) {
        this.detailsView.destroy();
      }
    }
  });
  _.extend(AttachmentView.prototype, LayoutViewEventsPropagationMixin);
  var EmailItemView = Marionette.CompositeView.extend({
    className: "d2-email-item",
    template: tmplEmailItem,
    childViewContainer: ".cs-list-group",
    childView: AttachmentView,
    childViewOptions: function() {
      return _.extend({}, {
        parentView: this.options.parentView,
        parentCollection: this.collection
      });
    },
    constructor: function EmailItemView(options) {
      options = options || {};
      if (options.model && options.model.childrenCollection) {
        options.collection = options.model.childrenCollection;
      } else {
        options.collection = new Backbone.Collection();
      }
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.model = options.model;
      this.parentCollection = options.parentView && options.parentView.collection;
      this.listenTo(this.collection, "update", this.onChildViewCollectionUpdate);
    },
    templateHelpers: function() {
      return {
        icon: this.model && NodeSpriteCollection.findClassByNode(this.model),
        name: this.model && this.model.get("name"),
        expandLabel: lang.treeListExpandTooltip,
        collapseLabel: lang.treeListCollapseTooltip
      };
    },
    onRender: function() {
      this.$el.attr("data-d2-key", this.model.cid);
      this.$el.attr("draggable", true);
      this.$el.off("dragstart").on("dragstart", this.preventDefaultAndStopPropagation);
    },
    preventDefaultAndStopPropagation: function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onChildViewCollectionUpdate: function() {
      if (this.collection.length === 0) {
        this.parentCollection && this.parentCollection.remove(this.model);
      }
    }
  });
  var EmailAttachmentSummaryView = SortableListView.extend({
    className: function() {
      var zuper = EmailAttachmentSummaryView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-email-attachments-summary";
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    childViewOptions: function() {
      var options, zuper = EmailAttachmentSummaryView.__super__;
      if (_.isFunction(zuper.childViewOptions)) {
        options = zuper.childViewOptions.apply(this, arguments);
      } else if (_.isObject(zuper.childViewOptions)) {
        options = zuper.childViewOptions;
      } else {
        options = {};
      }
      return _.extend(options, {
        parentView: this,
        itemView: EmailItemView
      });
    },
    emptyView: EmptyListView.extend({
      template: tmplEmailSummaryEmpty
    }),
    emptyViewOptions: {
      model: new Backbone.Model({
        state: "empty"
      }),
      stateMessages: {
        empty: _.str.sformat(lang.emailAttachmentsNoneMessage, "<br>")
      }
    },
    constructor: function EmailAttachmentSummaryView(options) {
      options = options || {};
      this.options = options;
      if (options.className) {
        options.className = this.className();
      }
      this.wizard = options.wizard;
      this._filterFileFormats();
      _.extend(this.behaviors, {
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          contentParent: "> .d2-sortable-list",
          suppressScrollX: true,
          scrollYMarginOffset: 15
        },
        TabableRegion: {
          behaviorClass: WizardTabableRegionBehavior
        }
      });
      SortableListView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "update", this.onCollectionUpdate);
    },
    onRender: function() {
      this.updateItemCount();
    },
    updateItemCount: function() {
      if (this.collection.length === 1) {
        this.$el.addClass("single-item");
      } else {
        this.$el.removeClass("single-item");
      }
    },
    getFileFormats: function() {
      return this.formatsCollection;
    },
    _filterFileFormats: function() {
      var formats = RestResources.getFormats().where({
        is_hidden: false
      });
      this.formatsCollection = new Backbone.Collection();
      this.formatsCollection.comparator = "description";
      this.formatsCollection.add(formats);
    },
    onCollectionUpdate: function() {
      this.updateItemCount();
    },
    getTitle: function() {
      return lang.emailAttachmentsSummaryTitle;
    },
    onStepBeforeActive: function() {
      this.triggerMethod("set:focus");
      this.getFooterButtons();
    },
    onStepActive: function() {
      var me = this;
      setTimeout(function() {
        me.nextBtnView && me.nextBtnView.$el && me.nextBtnView.$el.trigger("focus");
      }, 100);
    },
    onItemFocus: function(event) {
      var target = $(event.target);
      if (target.hasClass("d2-select") || target.hasClass("attachment-remove")) {
        this.currentFocusElem = target.closest(".sub-item");
        this.currentFocusElem.removeClass("select");
        this.currentFocusElem.addClass("focus");
      } else {
        this.currentFocusElem = target;
        this.currentFocusElem.removeClass("focus");
        this.currentFocusElem.addClass("select");
      }
    },
    onItemBlur: function(event) {
      var target = $(event.target);
      if (target.hasClass("d2-select") || target.hasClass("attachment-remove")) {
        target.closest(".sub-item").removeClass("focus");
      } else {
        target.removeClass("select");
      }
    },
    onKeyDown: function(event) {
      var me = this, prev, next, idx, sourceModel, parent, preElem = me.currentFocusElem;
      if (!preElem || preElem.length === 0) {
        return;
      }
      if (me.keyboardReorderMode === true) {
        switch (event.which) {
         case 33:
         case 36:
          preElem.insertBefore(me._getFirstElement());
          me._setFocus(preElem);
          break;

         case 34:
         case 35:
          preElem.insertAfter(me._getLastElement());
          me._setFocus(preElem);
          break;

         case 38:
          prev = me._getPrevElement(preElem);
          if (prev.length > 0) {
            preElem.insertBefore(prev);
            me._setFocus(preElem);
          }
          break;

         case 40:
          next = me._getNextElement(preElem);
          if (next.length > 0) {
            preElem.insertAfter(next);
            me._setFocus(preElem);
          }
          break;

         case 27:
          delete me.keyboardReorderMode;
          sourceModel = me.collection.get(me._getItemKey(preElem));
          idx = me.collection.indexOf(sourceModel);
          parent = preElem.parent();
          preElem.remove();
          if (idx === 0) {
            preElem.prependTo(parent);
          } else {
            preElem.insertAfter(parent.find(".sub-item:nth-child(" + idx + ")"));
          }
          me._setFocus(preElem);
          break;

         case 13:
          delete me.keyboardReorderMode;
          sourceModel = me.collection.get(me._getItemKey(preElem));
          idx = this.$el.find(".sub-item").index(preElem);
          parent = preElem.parent();
          me.collection.remove(sourceModel);
          me.collection.add(sourceModel, {
            at: idx
          });
          me._setFocus(parent.find(".sub-item:nth-child(" + (idx + 1) + ")"));
          me.triggerMethod("reorder", sourceModel);
          break;

         case 9:
          break;

         case 46:
          break;

         default:
          return;
        }
      } else {
        switch (event.which) {
         case 32:
          if (event.ctrlKey === true) {
            me.keyboardReorderMode = true;
            me._setFocus(preElem);
          } else {
            if ($(event.target).hasClass("attachment-remove")) {
              $(event.target).trigger("click");
            } else {
              return;
            }
          }
          break;

         case 13:
          if ($(event.target).hasClass("attachment-remove")) {
            $(event.target).trigger("click");
          } else {
            return;
          }
          break;

         default:
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    getFooterButtons: function() {
      var me = this;
      if (me.wizard && me.wizard.footerView && me.wizard.footerView.collection && me.wizard.footerView.collection.length > 0) {
        me.wizard.footerView.collection.each(function(item) {
          if (item.get("id") === "next") {
            me.nextBtnView = me.wizard.footerView.children.findByModel(item);
          }
        });
      }
    }
  });
  return EmailAttachmentSummaryView;
});