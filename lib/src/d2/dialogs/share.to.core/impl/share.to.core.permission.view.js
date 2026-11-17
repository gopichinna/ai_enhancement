/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "i18n", "csui/utils/contexts/factories/connector", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/utils/constants", "d2/controls/typeahead/typeahead.view", "d2/dialogs/share.to.core/impl/share.to.core.assignee.option.view", "d2/dialogs/share.to.core/impl/share.to.core.utils", "i18n!d2/dialogs/share.to.core/impl/nls/lang", "hbs!d2/dialogs/share.to.core/impl/share.to.core.permission", "hbs!d2/dialogs/share.to.core/impl/share.to.core.permission.msg", "hbs!d2/dialogs/share.to.core/impl/share.to.core.assignee.drag.item" ], function(_, $, Backbone, Marionette, i18n, ConnectorFactory, TabablesBehavior, constants, TypeAheadView, ShareToCoreOptionView, ShareToCoreUtils, lang, template, msgTemplate, dragItemTemplate) {
  "use strict";
  var ShareToCorePermissionView = Marionette.LayoutView.extend({
    constructor: function ShareToCorePermissionView(options) {
      if (!options.model.has("assignee")) {
        options.model.set("assignee", new Backbone.Collection());
      }
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.context = this.options.context;
      this.parentView = this.options.parentView;
    },
    className: "share-to-core-permission",
    template: template,
    ui: {
      errorPanel: ".error-panel",
      errorMessage: ".error-message",
      errorAction: ".error-action",
      errorCancel: ".error-cancel",
      permissionHeader: ".permission-header",
      permissionMessage: ".permission-message",
      permissionAssignee: ".permission-assignee",
      permissionCount: ".permission-count",
      assigneeSelect: ".assignee-select"
    },
    regions: {
      assigneeSelectRegion: ".assignee-select"
    },
    templateHelpers: function() {
      return {
        permissionLabel: this.model.get("label"),
        cancelCaption: lang.cancel
      };
    },
    events: {
      "click @ui.permissionHeader": "_onClickPermissionHeader",
      "keydown @ui.permissionHeader": "_onKeyDownPermissionHeader",
      "click @ui.errorCancel": "_onClickErrorCancel",
      "keydown @ui.errorCancel": "_onKeyDownErrorCancel",
      "click @ui.errorAction": "_onClickErrorAction",
      "keydown @ui.errorAction": "_onKeyDownErrorAction",
      "mouseenter @ui.permissionMessage": "_showPermissionPopover",
      "mouseleave @ui.permissionMessage": "_hidePermissionPopover"
    },
    onRender: function() {
      this._enablePermissionPopover();
      this._enableDragListener();
      this._createAssigneeSelectField();
      this.ui.errorPanel.addClass("binf-hidden");
      this.ui.permissionHeader.attr("collapsed", false);
      this.collapsed = false;
      this.updatePermissionCount();
    },
    updatePermissionCount: function() {
      if (this.options.showAssigneeCount) {
        var assigneeCollection = this.model.get("assignee");
        var permissionCount = _.str.sformat(lang.permissionCount, assigneeCollection.length);
        this.ui.permissionCount.html(permissionCount);
      }
    },
    _createAssigneeSelectField: function() {
      var assigneeCollection = this.model.get("assignee");
      this.assigneeSelectField = new TypeAheadView({
        parentView: this,
        collection: assigneeCollection,
        regex: this._getRegex(),
        searchDatasource: this.datasourceForSearch.bind(this),
        fetchDataOn: "keypress",
        optionViewClass: ShareToCoreOptionView,
        placeholder: lang.userTypeaheadPlaceHolder,
        enableChickletSelection: true,
        disableReorder: true,
        toolTipIdName: true,
        customOptionsWidth: true,
        focusFirstOption: true
      });
      this.assigneeSelectRegion.show(this.assigneeSelectField);
      this.listenTo(this.assigneeSelectField, "typeahead:chicklet:added", this._addAssignee.bind(this));
      this.listenTo(this.assigneeSelectField, "typeahead:chicklet:removed", this._removeAssignee.bind(this));
      this.listenTo(this.assigneeSelectField, "typeahead:chicklet:cut", this._cutAssignee.bind(this));
      this.listenTo(this.assigneeSelectField, "typeahead:chicklet:paste", this._pasteAssignee.bind(this));
      this.assigneeSelectField.$el.find(".typeahead-search-text-field").addClass("focusable");
    },
    clearErrorMessage: function() {
      if (this.errorAssigneeModel && this.otherPermissionSetModel) {
        this.assigneeSelectField.trigger("typeahead:remove:item", this.errorAssigneeModel, false);
        this._hideErrorMessage();
      }
    },
    showErrorMessage: function(assigneeModel, otherPermissionSetModel) {
      if (assigneeModel && otherPermissionSetModel) {
        this.ui.errorPanel.removeClass("binf-hidden");
        this.ui.errorPanel.find("[tabindex]").attr("tabindex", 0);
        var otherPermission = otherPermissionSetModel.get("label").toLowerCase();
        var errorMessage = _.str.sformat(lang.assigneeErrorMessage, assigneeModel.get("name"), otherPermission);
        this.ui.errorMessage.html(errorMessage);
        this.ui.errorAction.html(lang.assigneeErrorAction);
        this.otherPermissionSetModel = otherPermissionSetModel;
        this.errorAssigneeModel = assigneeModel;
        var errorChickletView = this.assigneeSelectField.getChickletViewByModel(this.errorAssigneeModel);
        errorChickletView.$el.addClass("error-item");
      }
    },
    _removeAssignee: function() {
      this.parentView.validatePermissionSets(this);
      this.assigneeSelectField.clearClipboard();
    },
    _addAssignee: function(assigneeModel) {
      this.parentView.validatePermissionSets(this, assigneeModel);
      this.assigneeSelectField.clearClipboard();
    },
    _cutAssignee: function() {
      this.parentView.validatePermissionSets(this);
    },
    _pasteAssignee: function() {
      this.parentView.validatePermissionSets(this);
    },
    _getRegex: function() {
      return /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    },
    _onErrorAction: function() {
      var self = this;
      if (this.errorAssigneeModel && this.otherPermissionSetModel) {
        var assigneeCollecton = this.otherPermissionSetModel.get("assignee");
        var matchedModel = assigneeCollecton.detect(function(model) {
          return self.errorAssigneeModel.get("id") === model.get("id");
        });
        assigneeCollecton.remove(matchedModel);
        this.assigneeSelectField.trigger("typeahead:search:field:focus");
        var errorChickletView = this.assigneeSelectField.getChickletViewByModel(this.errorAssigneeModel);
        errorChickletView.$el.removeClass("error-item");
        this._hideErrorMessage();
        this.parentView.validatePermissionSets(this);
      }
    },
    _onErrorCancel: function() {
      this.clearErrorMessage();
      this.assigneeSelectField.trigger("typeahead:search:field:focus");
      this.parentView.validatePermissionSets(this);
    },
    _hideErrorMessage: function() {
      this.ui.errorPanel.addClass("binf-hidden");
      this.ui.errorPanel.find("[tabindex]").attr("tabindex", -1);
      this.ui.errorMessage.html("");
      this.ui.errorAction.html("");
      delete this.otherPermissionSetModel;
      delete this.errorAssigneeModel;
    },
    _onClickPermissionHeader: function() {
      if (this.collapsed) {
        this.ui.permissionAssignee.removeClass("binf-hidden");
        this.ui.permissionHeader.attr("collapsed", false);
        this.collapsed = false;
      } else {
        this.ui.permissionAssignee.addClass("binf-hidden");
        this.ui.permissionHeader.attr("collapsed", true);
        this.collapsed = true;
      }
    },
    _onKeyDownPermissionHeader: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._onClickPermissionHeader();
        break;

       default:
        return;
      }
    },
    _onClickErrorAction: function() {
      this._onErrorAction();
    },
    _onClickErrorCancel: function() {
      this._onErrorCancel();
    },
    _onKeyDownErrorAction: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._onErrorAction();
        break;

       default:
        return;
      }
    },
    _onKeyDownErrorCancel: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this._onErrorCancel();
        break;

       default:
        return;
      }
    },
    _getSelectedModelCids: function() {
      var d2DataKeys = [];
      var selectedElements = this.assigneeSelectField.$el.find(".typeahead-chicklet-item[chicklet-selected=true]");
      selectedElements.each(function(index, element) {
        var $element = $(element);
        var d2DataKey = $element.attr("data-d2-key");
        d2DataKeys.push(d2DataKey);
      });
      return d2DataKeys;
    },
    _validateDragEvent: function() {
      var isValid = true;
      if (this.parentView.dragData && this.parentView.dragData.dragInitiatedFrom) {
        isValid = !this.parentView.dragData.dragInitiatedFrom.$el.is(this.$el);
      }
      return isValid;
    },
    _enableDragListener: function() {
      var self = this;
      this.counter = 0;
      self.ui.assigneeSelect.on("dragover", function($event) {
        $event.preventDefault();
        $event.stopPropagation();
      });
      self.ui.assigneeSelect.on("dragenter", function() {
        if (!self._validateDragEvent()) {
          return;
        }
        self.counter++;
        if (self.parentView.dragData) {
          self.ui.assigneeSelect.addClass("droppable");
        }
      });
      self.ui.assigneeSelect.on("dragleave", function() {
        if (!self._validateDragEvent()) {
          return;
        }
        self.counter--;
        if (self.counter === 0) {
          self.ui.assigneeSelect.removeClass("droppable");
          self.counter = 0;
        }
      });
      self.ui.assigneeSelect.on("dragstart", function($event) {
        $event.originalEvent.dataTransfer.setData("text", "");
        var draggedItemModels, selectedModelCids = self._getSelectedModelCids();
        if (selectedModelCids && selectedModelCids.length > 0) {
          draggedItemModels = self.assigneeSelectField.findValueByIds(selectedModelCids);
        } else {
          var cid = $($event.target).attr("data-d2-key");
          draggedItemModels = self.assigneeSelectField.findValueByIds([ cid ]);
        }
        self.setCustomDragImage($event, draggedItemModels);
        self.parentView.dragData = {
          dragInitiatedFrom: self,
          draggedItemModels: draggedItemModels
        };
        self.parentView.validatePermissionSets(this);
      });
      self.ui.assigneeSelect.on("dragend", function($event) {
        $event.preventDefault();
        delete self.parentView.dragData;
      });
      self.ui.assigneeSelect.on("drop", function($event) {
        $event.preventDefault();
        if (self.parentView.dragData) {
          var dragData = self.parentView.dragData;
          if (!self._validateDragEvent()) {
            delete self.parentView.dragData;
            return;
          }
          self.ui.assigneeSelect.removeClass("droppable");
          self.counter = 0;
          if (dragData.dragInitiatedFrom && dragData.draggedItemModels) {
            var draggersItems = [];
            _.each(dragData.draggedItemModels, function(item) {
              draggersItems.push(item.attributes);
            });
            self.assigneeSelectField.trigger("typeahead:add:items", draggersItems);
            dragData.dragInitiatedFrom.model.get("assignee").remove(dragData.draggedItemModels);
          }
          delete self.parentView.dragData;
          self.parentView.validatePermissionSets(this);
        }
      });
    },
    datasourceForSearch: function(keyword) {
      var dfd = $.Deferred();
      ShareToCoreUtils.fetchUsersFromCore(keyword, this.context, this.options.commandKey).always(function(coreUsersDetails) {
        var optionsForSearch = _.map(coreUsersDetails, function(item) {
          return {
            id: item["email"],
            name: item["first_name"] + " " + item["last_name"],
            data: item
          };
        });
        dfd.resolve(optionsForSearch);
      });
      return dfd.promise();
    },
    _enablePermissionPopover: function() {
      if (this._canShowPermissionPopover()) {
        var self = this, content = msgTemplate.call(this, {
          message: this.model.get("description")
        }), rtl = i18n.settings.rtl;
        self.ui.permissionMessage.binf_popover({
          content: content,
          html: true,
          placement: function() {
            if (rtl) {
              return "left";
            } else {
              return "right";
            }
          }
        });
      }
    },
    _canShowPermissionPopover: function() {
      return true;
    },
    _showPermissionPopover: function(e) {
      if (this._canShowPermissionPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.permissionMessage.binf_popover("show");
      }
    },
    _hidePermissionPopover: function(e) {
      if (this._canShowPermissionPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.ui.permissionMessage.binf_popover("hide");
      }
    },
    setCustomDragImage: function($event, draggedItemModels) {
      var originalEvent = $event.originalEvent, dt = originalEvent.dataTransfer;
      if (draggedItemModels && draggedItemModels.length > 0 && _.isFunction(dt.setDragImage)) {
        var $targetEl = $($event.target), targetElWidth = $targetEl.width() + "px", chickletText = $targetEl.find(".chicklet-text").html(), content = dragItemTemplate.call(this, {
          singleItem: draggedItemModels.length === 1,
          chickletText: chickletText,
          chickletCount: draggedItemModels.length
        });
        var $img = $('<div class="drag-item" style="width:' + targetElWidth + '"></div>').html(content);
        $img.appendTo(this.parentView.el);
        setTimeout(function() {
          $img.remove();
        });
        dt.setDragImage($img[0], 40, 20);
      }
    }
  });
  return ShareToCorePermissionView;
});