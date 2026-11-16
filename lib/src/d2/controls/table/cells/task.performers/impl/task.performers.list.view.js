/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/utils/contexts/factories/connector", "hbs!d2/controls/table/cells/task.performers/impl/task.performers.item", "hbs!d2/controls/table/cells/task.performers/impl/task.performers.info", "i18n!d2/controls/table/cells/task.performers/impl/nls/lang", "csui/lib/binf/js/binf" ], function(require, $, _, Backbone, Marionette, ConnectorFactory, taskPerformersItemTemplate, taskPerformersInfoTemplate, lang) {
  "use strict";
  var TaskPerformersExpandView = Marionette.ItemView.extend({
    constructor: function TaskPerformersExpandView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.$el.attr({
        tabindex: "-1",
        role: "button"
      });
    },
    triggers: {
      click: "expand:toggled"
    },
    events: {
      keydown: "onKeydown"
    },
    template: false,
    className: "task-performers-expand focusable-item",
    updateAttributes: function(buttonLabel) {
      this.$el.attr({
        title: buttonLabel,
        "aria-label": buttonLabel
      }).text(buttonLabel);
    },
    onKeydown: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.trigger("expand:toggled", {}, true);
        event.preventDefault();
        event.stopPropagation();
      } else {
        this.options.parentView.triggerMethod("keydown:item", event);
      }
    }
  });
  var TaskPerformersItemView = Marionette.ItemView.extend({
    constructor: function TaskPerformersItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      var userId = this.model.get("id"), userProperties = this.model.get("properties"), userAddress = userProperties && userProperties["user_address"], performerInfo = userId;
      this.model.set(userProperties);
      this.model.set("isExternal", this.options.isExternal);
      if (userAddress) {
        performerInfo = _.str.sformat(lang.performerInfo, performerInfo, userAddress);
      }
      this.$el.attr({
        tabindex: "-1",
        role: "button",
        "aria-label": performerInfo
      });
    },
    template: taskPerformersItemTemplate,
    className: "task-performers-item focusable-item",
    ui: {
      taskPerformersId: ".task-performer-id"
    },
    events: {
      mouseenter: "_showPopover",
      mouseleave: "_hidePopover",
      keydown: "_onKeyDown",
      focusout: "_onFocusOut"
    },
    templateHelpers: function() {
      return {
        performer_id: this.model.get("id")
      };
    },
    onRender: function() {
      if (!this.model.get("id")) {
        this.$el.addClass("binf-hidden");
      } else {
        this._enablePopover();
      }
    },
    _onFocusOut: function(event) {
      this._hidePopover(event);
    },
    _onKeyDown: function(event) {
      var $popOverEl = this.$el.find(".binf-popover");
      if (event.which === 13 || event.which === 32) {
        this._showPopover(event);
      } else if (event.which === 27 && $popOverEl.length > 0 && $popOverEl.hasClass("binf-in")) {
        this._hidePopover(event);
      } else {
        this.options.parentView.triggerMethod("keydown:item", event);
      }
    },
    _enablePopover: function() {
      var self = this, userId = this.model.get("id"), cellView = this._getCellView();
      if (userId && cellView && cellView.options && cellView.options.context) {
        require([ "d2/widgets/user.info/user.info.view" ], function(UserInfoView) {
          if (!self.isDestroyed) {
            self.userInfoView = new UserInfoView({
              model: self.model,
              context: cellView.options.context,
              showUserWidgetOnEvent: true
            });
            var $userInfoEl = self.userInfoView.render().$el, contentHeight = self._getheightOfPopupContent(cellView, $userInfoEl);
            self.ui.taskPerformersId.parent().addClass("user-info-popover-content");
            self.ui.taskPerformersId.binf_popover({
              content: $userInfoEl,
              html: true,
              placement: self._getPopoverPlacement.bind(self, cellView, contentHeight)
            });
          }
        });
      }
    },
    _getheightOfPopupContent: function(cellView, $taskPerformersInfoEl) {
      var $taskPerformersEl = cellView.$el.find(".task-performers");
      $taskPerformersInfoEl.appendTo($taskPerformersEl);
      var height = $taskPerformersInfoEl.outerHeight();
      $taskPerformersInfoEl.remove();
      return height;
    },
    _getCellView: function() {
      return this.options && this.options.parentView && this.options.parentView.options && this.options.parentView.options.cellView;
    },
    _getPopoverPlacement: function(cellView, contentHeight) {
      var placement = "bottom";
      if (cellView && cellView.options && cellView.options.tableView) {
        var $cellViewEl = cellView.$el, $tableViewEl = cellView.options.tableView.$el, tbodyInnerHeight = $tableViewEl.find("table.binf-table tbody").innerHeight(), bottomPosition = $cellViewEl.position().top + this.$el.position().top + this.$el.outerHeight() + contentHeight;
        if (tbodyInnerHeight < bottomPosition) {
          placement = "top";
        }
      }
      return placement;
    },
    _showPopover: function(event) {
      if (this.userInfoView) {
        if (!this.userWidgetShown) {
          this.userInfoView.trigger("show:profile:picture");
          this.userWidgetShown = true;
        }
        this.ui.taskPerformersId.binf_popover("show");
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _hidePopover: function(event) {
      this.ui.taskPerformersId.binf_popover("hide");
      event.preventDefault();
      event.stopPropagation();
    }
  });
  return Marionette.CollectionView.extend({
    constructor: function TaskPerformersListView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.taskPerformersExpandView = new TaskPerformersExpandView({
        parentView: this
      }).render();
      this.listenTo(this.taskPerformersExpandView, "expand:toggled", this.onExpandToggled.bind(this));
    },
    className: "task-performers-list",
    emptyView: false,
    childView: TaskPerformersItemView,
    childViewOptions: function() {
      return {
        parentView: this,
        isExternal: this.options.isExternal
      };
    },
    getTaskPerformerWrapperEl: function() {
      return this.options.cellView.$el.find(".task-performers");
    },
    isExpanded: function() {
      return this.$el.closest("tr").attr("row-expanded") === "true";
    },
    onExpandToggled: function(triggerObject, focusFirstItem) {
      var expanded = this.isExpanded();
      if (expanded) {
        this.$el.closest("tr").removeAttr("row-expanded");
      } else {
        this.$el.closest("tr").attr("row-expanded", true);
      }
      this.resetContent();
      if (focusFirstItem) {
        this.$el.find(".focusable-item").first().trigger("focus");
      }
    },
    getHiddenItemCount: function() {
      var renderedItems = this.$el.find(".task-performers-item").length;
      return this.options.performers.length - renderedItems;
    },
    removeExcessItems: function() {
      var listViewWidth = this.$el.width(), wrapperElementWidth = this.getTaskPerformerWrapperEl().width();
      if (wrapperElementWidth > 0 && listViewWidth >= wrapperElementWidth) {
        this.collection.pop();
        this.appendExpandButton(true);
      }
    },
    appendExpandButton: function(removeExcessesItems) {
      var buttonLabel = "";
      if (this.isExpanded()) {
        buttonLabel = lang.showLess;
      } else {
        var hiddenItemCount = this.getHiddenItemCount();
        buttonLabel = _.str.sformat(lang.showMore, hiddenItemCount);
      }
      this.taskPerformersExpandView.updateAttributes(buttonLabel);
      this.$el.append(this.taskPerformersExpandView.$el);
      if (removeExcessesItems) {
        this.removeExcessItems();
      }
    },
    resetContent: function() {
      var self = this, $tableRowEl = this.$el.closest("tr.csui-saved-item");
      self.taskPerformersExpandView.$el.detach();
      $tableRowEl.removeClass("row-expanded");
      if (self.isExpanded()) {
        this.collection.reset(self.options.performers);
        var listViewWidth = self.$el.width(), wrapperElementWidth = self.getTaskPerformerWrapperEl().width();
        if (wrapperElementWidth > 0 && listViewWidth >= wrapperElementWidth) {
          $tableRowEl.addClass("row-expanded");
          this.appendExpandButton(false);
        }
      } else {
        self.collection.reset();
        _.each(self.options.performers, function(performer) {
          var listViewWidth = self.$el.width(), wrapperElementWidth = self.getTaskPerformerWrapperEl().width();
          if (wrapperElementWidth > 0 && listViewWidth < wrapperElementWidth) {
            self.collection.add(performer);
          }
        });
        this.removeExcessItems();
      }
    },
    onKeydownItem: function(event) {
      if (this.collection.length === 1) {
        return;
      }
      switch (event.which) {
       case 33:
       case 36:
        this.onFocusFirst(event);
        break;

       case 34:
       case 35:
        this.onFocusLast(event);
        break;

       case 37:
        this.onFocusPrev(event);
        break;

       case 39:
        this.onFocusNext(event);
        break;

       case 27:
        $(event.target).closest("td").trigger("focus");
        break;

       default:
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    },
    setElementFocus: function($element) {
      if ($element.length > 0 && $element.hasClass("focusable-item")) {
        $element.trigger("focus");
      }
    },
    onFocusFirst: function() {
      var $el = this.$el.find(".focusable-item");
      this.setElementFocus($el.first());
    },
    onFocusLast: function() {
      var $el = this.$el.find(".focusable-item");
      this.setElementFocus($el.last());
    },
    onFocusPrev: function(event) {
      var $el = $(event.target).closest(".focusable-item");
      this.setElementFocus($el.prev());
    },
    onFocusNext: function(event) {
      var $el = $(event.target).closest(".focusable-item");
      this.setElementFocus($el.next());
    }
  });
});