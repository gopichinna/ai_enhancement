/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/utils/base", "csui/controls/thumbnail/content/content.factory", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/controls/thumbnail/content/thumbnail.icon/thumbnail.icon.view", "csui/controls/thumbnail/content/select/select.view", "hbs!csui/controls/thumbnail/impl/thumbnail.item", "css!csui/controls/thumbnail/thumbnail" ], function(_, $, Marionette, base, ContentFactory, LayoutViewEventsPropagationMixin, ThumbnailIconView, SelectContentView, thumbnailItemTemplate) {
  "use strict";
  var ThumbnailItemView = Marionette.LayoutView.extend({
    className: function() {
      var className = "csui-thumbnail-item" + " csui-thumbnail-item-" + this.model.cid;
      if (this.model.inlineFormView) {
        className = className + " csui-thumbnail-item-form";
      }
      return className;
    },
    template: thumbnailItemTemplate,
    templateHelpers: function() {
      return {
        columns: this.options.thumbnailContent.models,
        isChecked: this.options.thumbnailView.collection.itemchecked,
        selectThumbnails: this.options.thumbnailView.options.selectThumbnails === "none"
      };
    },
    ui: {
      itemContainer: ".csui-thumbnail-item-container"
    },
    attributes: {
      tabindex: "0"
    },
    events: {
      "click @ui.itemContainer": "onItemClick",
      keydown: "onItemKeyDown"
    },
    regions: {
      selectContentRegion: ".csui-thumbnail-select",
      thumbnailIconRegion: ".csui-thumbnail-thumbnailIcon"
    },
    initialize: function() {
      var self = this;
      if (this.options.thumbnailContent && this.options.thumbnailContent.models) {
        _.each(this.options.thumbnailContent.models, function(model, index) {
          var content = ContentFactory.getContentView(model);
          if (content) {
            var region = model.get("key");
            self.addRegion(region, ".csui-thumbnail-" + region);
          }
        }, this);
      }
      if (!base.isHybrid() && this.options.showInlineToolbar) {
        this._subscribeEventHandlers();
      }
      this.model.set("inactive", !this.options.thumbnailView.checkModelHasAction(this.model), {
        silent: true
      });
      self.ContentFactory = ContentFactory;
      this.listenTo(this.model, "change:csuiIsSelected", function(model) {
        if (model.get(SelectContentView.isSelectedModelAttributeName)) {
          this.options.thumbnailView.$el.find(".csui-thumbnail-select").addClass("csui-checkbox");
          this.$el.addClass("csui-thumbnail-item-selected");
        } else {
          this.$el.removeClass("csui-thumbnail-item-selected");
          if (!this.options.thumbnailView._allSelectedNodes.length) {
            this.options.thumbnailView.$el.find(".csui-thumbnail-select").removeClass("csui-checkbox");
            this.$el.removeClass("csui-thumbnail-item-selected");
          }
        }
        this.options.thumbnailView.$el.find(".selectAction").attr("tabindex", -1);
      });
      if (this.options.thumbnailView._allSelectedNodes.findWhere({
        id: this.model.get("id")
      })) {
        this.options.model.set("csuiIsSelected", true);
      }
    },
    constructor: function ThumbnailItemView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this.model, "sync", this.render);
      this.model.set("itemselected", false, {
        silent: true
      });
      this.listenTo(this.options.thumbnailView, "cancelInlineForm", function(options) {
        if (this.activeInlineForm) {
          this.activeInlineForm.cancel(options);
        }
      });
    },
    onItemClick: function() {
      this.options.thumbnailView.currentItemView = this;
    },
    onItemKeyDown: function(event) {
      if ($(event.target).is('input[type="text"]')) {
        event.stopPropagation();
      } else if (base.isFirefox() && event.keyCode === 13 && $(event.target).is('input[type="checkbox"]')) {
        event.preventDefault();
        event.stopPropagation();
        var chkBoxValue = this.model.get(SelectContentView.isSelectedModelAttributeName);
        event.checked = !chkBoxValue;
        this.selectContentView.trigger("clicked:checkbox", event);
      } else if ((event.keyCode === 13 || event.keyCode === 32) && $(event.target).hasClass("csui-thumbnail-item")) {
        event.preventDefault();
        !this.el.closest(".csui-thumbnail-stop-propagation") && event.stopPropagation();
        this.model.set("itemselected", true, {
          silent: true
        });
        this.$el.addClass("csui-thumbnail-item-keyActive");
        this.showInlineActions.bind(this);
        this.focusableChildren = this.$el.find("*[tabindex]:visible").filter(function() {
          if (!($(this).parents().hasClass("csui-thumbnail-nodestate") || $(this).parent().hasClass("csui-thumbnail-name-container"))) {
            return this;
          }
        });
        $(this).parent().hasClass("csui-thumbnail-name-container");
        $(this.focusableChildren[0]).trigger("focus");
        this.focusedThumbnailCardIndex = 0;
      } else if (event.keyCode === 27) {
        this.model.set("itemselected", false, {
          silent: true
        });
        this.$el.removeClass("csui-thumbnail-item-keyActive");
        this.focusableChildren = "";
        this.$el.trigger("focus");
      } else if (event.keyCode === 9) {
        this.focusableChildren = this.$el.find("*[tabindex]:visible").filter(function() {
          if (!($(this).parents().hasClass("csui-thumbnail-nodestate") || $(this).parent().hasClass("csui-thumbnail-name-container"))) {
            return this;
          }
        });
        var focusablesSelector = "a[href], area[href], input,.csui-thumbnail-select input[type=checkbox], select, textarea, button," + " iframe, object, embed, *[tabindex], *[contenteditable]";
        var focusables = this.options.thumbnailView.resultsView.$el.find(focusablesSelector);
        if (this.$el.hasClass("csui-thumbnail-item-keyActive")) {
          event.preventDefault();
          event.stopPropagation();
          if (event.shiftKey) {
            if (this.focusedThumbnailCardIndex > 0) {
              this.focusedThumbnailCardIndex--;
            }
            $(this.focusableChildren[this.focusedThumbnailCardIndex]).trigger("focus");
          } else {
            if ($(event.target).hasClass("csui-thumbnail-item")) {
              this.focusedThumbnailCardIndex = -1;
            }
            if (this.focusedThumbnailCardIndex < this.focusableChildren.length - 1) {
              this.focusedThumbnailCardIndex++;
            }
            $(this.focusableChildren[this.focusedThumbnailCardIndex]).trigger("focus");
          }
        } else {
          if (focusables.length) {
            focusables.prop("tabindex", -1);
          }
          $(this.options.thumbnailView.resultsView.$el.find(".csui-thumbnail-item")[this.options.thumbnailView.resultsView.currentIndexFocussed]).attr("tabindex", 0);
        }
      }
    },
    _subscribeEventHandlers: function() {
      this.$el && this.$el.mousehover(this.showInlineActions.bind(this), this.hideInlineActions.bind(this), {
        namespace: this.cid
      });
      this.$el && this.$el.on("focus", this.showInlineActions.bind(this));
      this.$el && this.$el.on("blur", this.hideInlineActions.bind(this));
    },
    _unsubscribeEventHandlers: function() {
      if (this._isRendered) {
        this.$el.mousehover("off", {
          namespace: this.cid
        });
        this.$el && this.$el.off("focus");
        this.$el && this.$el.off("blur");
      }
    },
    showInlineActions: function(e) {
      if (this.$el.find(".csui-inlineform-group").length === 0) {
        var inlineToolbarContainer = this.$el.find(".csui-thumbnail-actionbar");
        if (inlineToolbarContainer.length > 0 && !this.options.originatingView.lockedForOtherContols) {
          var self = this, args = {
            sender: self,
            target: inlineToolbarContainer,
            model: self.model
          };
          self.trigger("mouseenter:row", args);
        }
      } else {
        this.$el.find(".csui-thumbnail-select").css({
          display: "none"
        });
      }
    },
    hideInlineActions: function(e) {
      var inlineToolbarContainer = this.$el.find(".csui-thumbnail-actionbar");
      if (inlineToolbarContainer.length > 0) {
        var self = this, args = {
          sender: self,
          target: inlineToolbarContainer,
          model: self.model
        };
        if (!this.model.get("itemselected")) {
          self.trigger("mouseleave:row", args);
        }
      }
    },
    onRender: function(e) {
      var self = this;
      if (self.model.isLocallyCreated && !self.model.inlineFormView) {
        this.$el.find(".csui-thumbnail-content-container").addClass("csui-new-item");
      }
      if (self.model.isLocallyCreated) {
        self.listenTo(this.options.thumbnailView, "inlineFormCreation", function(models) {
          var nodeModel = models[models.length - 1], className = ".csui-thumbnail-name-" + nodeModel.cid, divForInlineForm = this.options.thumbnailView.$el.find(className), inlineFormRegion = new Marionette.Region({
            el: divForInlineForm
          });
          if (nodeModel.inlineFormView) {
            self.activeInlineForm && self.activeInlineForm.destroy();
            self.activeInlineForm = new nodeModel.inlineFormView({
              model: nodeModel,
              originatingView: self.options.originatingView,
              context: self.options.thumbnailView.context
            });
            if (self.$el.hasClass("csui-thumbnail-item-form")) {
              self.$el.addClass("csui-new-thumbnail-item");
            }
            self.activeInlineForm.listenTo(self.activeInlineForm, "destroy", function() {
              self.options.thumbnailView.lockedForOtherContols = false;
              delete self.activeInlineForm;
              self.trigger("destroy:inlineform");
            });
            inlineFormRegion.show(self.activeInlineForm);
            self.trigger("show:inlineform");
          }
        });
        self.listenTo(this.options.thumbnailView, "updateItem", function(collectionormodel) {
          if (self.activeInlineForm && self.activeInlineForm.model.cid === collectionormodel.cid) {
            self.activeInlineForm.model.trigger("sync");
            self.activeInlineForm.cancel({
              silent: true
            });
            collectionormodel.renamed = true;
          }
        });
      }
      this.selectContentView = new SelectContentView({
        tagName: "div",
        model: this.options.model,
        thumbnailView: this.options.thumbnailView,
        events: function() {
          if (base.isFirefox()) {
            return _.extend({}, SelectContentView.prototype.events, {
              keydown: self.onKeyInView
            });
          }
          return SelectContentView.prototype.events;
        }
      });
      this.selectContentRegion.show(this.selectContentView);
      if (this.options.model.get("csuiIsSelected")) {
        this.selectContentRegion.$el.addClass("csui-checkbox");
        this.$el.addClass("csui-thumbnail-item-selected");
      } else {
        if (this.options.thumbnailView.getSelectedChildren().length === 0 && this.options.thumbnailView.resultsView.$el.find(".csui-checkbox")) {
          this.selectContentRegion.$el.removeClass("csui-checkbox");
          this.$el.removeClass("csui-thumbnail-item-selected");
        }
      }
      if (this.options.model.get(SelectContentView.isSelectedModelAttributeName)) {
        this.$el.addClass("csui-thumbnail-item-selected");
      }
      if (this.getSelectedChildren().length > 0 && self.model.isLocallyCreated && !self.model.inlineFormView || this.options.thumbnailView._allSelectedNodes.length) {
        this.$el.find(".csui-new-item").parent().find(".csui-thumbnail-select").addClass("csui-checkbox");
        this.selectContentRegion.$el.addClass("csui-checkbox");
      }
      self.listenTo(this.selectContentView, "clicked:checkbox", function(event) {
        if (event.checked) {
          this.options.thumbnailView.cancelAnyExistingInlineForm();
        }
        this.options.thumbnailView.stopListening(this.options.thumbnailView, "thumbnailItem:toggled");
        this.options.thumbnailView.listenTo(this.options.thumbnailView, "thumbnailItem:toggled", _.bind(function(event) {
          var self = this;
          setTimeout(function() {
            self.$el.find(".selectAction").trigger("focus");
            var focusablesSelector = "a[href], area[href], input,.csui-thumbnail-select input[type=checkbox], select, textarea, button," + " iframe, object, embed, *[tabindex], *[contenteditable]";
            var focusables = self.$el.find(focusablesSelector);
            if (focusables.length) {
              focusables.prop("tabindex", -1);
            }
          }, 0);
          if (event.checked) {
            if (this.options.thumbnailView.options.selectThumbnails === "single" && this.options.thumbnailView._allSelectedNodes.length === 0 || this.options.thumbnailView.options.selectThumbnails === "multiple") {
              this.options.thumbnailView._allSelectedNodes.add(event.view.model, {
                silent: true
              });
            } else if (this.options.thumbnailView.options.selectThumbnails === "single" && this.options.thumbnailView._allSelectedNodes.length > 0) {
              this.options.thumbnailView._allSelectedNodes.reset([]);
              this.options.thumbnailView._allSelectedNodes.add(event.view.model, {
                silent: true
              });
            }
          } else {
            this.options.thumbnailView._allSelectedNodes.remove(event.view.model, {
              silent: true
            });
          }
          this.options.thumbnailView._allSelectedNodes.reset(this.options.thumbnailView._allSelectedNodes.models);
        }, this));
        this.options.thumbnailView.trigger("thumbnailItem:toggled", event);
        self.showToolBarActions(event);
        if (event.checked) {
          if (this.options.thumbnailView.resultsView.inlineToolbarView) {
            this.options.thumbnailView.resultsView.inlineToolbarView.destroy();
          }
          self.model.set(SelectContentView.isSelectedModelAttributeName, true);
          self.model.attributes.isSelected = true;
          self.options.thumbnailView.trigger("thumbnailSelected", {
            sender: self,
            targets: self.options.thumbnailView,
            nodes: self.getNodes.call(self)
          });
        } else {
          self.model.set(SelectContentView.isSelectedModelAttributeName, false);
          self.model.attributes.isSelected = false;
          self.options.thumbnailView.trigger("thumbnailUnSelected", {
            sender: self,
            targets: self.options.thumbnailView,
            nodes: self.getNodes.call(self)
          });
        }
        this.options.thumbnailHeaderView.trigger("selectOrUnselect.mixed");
      });
      this.thumbnailIconView = new ThumbnailIconView({
        model: this.options.model,
        context: this.options.context,
        column: {
          defaultAction: true
        },
        originatingView: this.options.originatingView
      });
      this.thumbnailIconRegion.show(this.thumbnailIconView);
      this.listenTo(this.thumbnailIconView, "execute:defaultAction", function(event) {
        if (base.isControlClick(event)) {} else {
          event.preventDefault();
          self.options.thumbnailView.trigger("execute:defaultAction", self.model);
        }
      });
      this.contents = this.options.columns;
      var contentModelsByKey = [];
      this.contents.each(function(nodeContentModel) {
        var key = nodeContentModel.get("column_key");
        contentModelsByKey.push(key);
      }, this);
      contentModelsByKey.push("overview");
      if (this.options.thumbnailContent && this.options.thumbnailContent.models) {
        _.each(this.options.thumbnailContent.models, function(model, index) {
          if (this.options.model && this.options.model.isReservedClicked || this.options.model.isUnreservedClicked) {
            this.options.model.set("inactive", this.options.model.attributes.inactive, {
              silent: true
            });
          } else {
            this.options.model.set("inactive", !this.options.thumbnailView.checkModelHasAction(this.model), {
              silent: true
            });
          }
          var content = ContentFactory.getContentView(model);
          var key = model.get("key");
          if (content && contentModelsByKey.indexOf(key) > -1) {
            var region = model.get("key"), conFactory = model.get("showoverview") ? ContentFactory : undefined, column = model.toJSON();
            column.name = column.key;
            var contentView = new content({
              tagName: "DIV",
              model: self.model,
              context: self.options.context,
              column: column,
              ContentFactory: conFactory,
              displayLabel: model.get("displayLabel"),
              displayTitle: model.get("displayTitle"),
              displayIcon: true,
              originatingView: self.options.originatingView,
              selectedChildren: this.options.thumbnailView.options.selectedChildren,
              collection: this.options.thumbnailView.options.collection,
              columns: this.options.columns
            });
            self[region].show(contentView);
            self.listenTo(contentView, "clicked:content", function(event) {
              self.trigger("clicked:content", {
                contentView: contentView,
                rowIndex: self._index,
                colIndex: index,
                model: self.model
              });
            });
            self.listenTo(contentView, "execute:defaultAction", function(event) {
              event.preventDefault();
              event.stopPropagation();
              self.options.thumbnailView.trigger("execute:defaultAction", self.model);
            });
            self.listenTo(contentView, "show:add:favorite:form", function() {
              self.hideInlineActions();
              self.favoritePopoverOpened = true;
              self.options.originatingView.lockedForOtherContols = true;
            });
            self.listenTo(contentView, "close:add:favorite:form", function() {
              self.favoritePopoverOpened = false;
              self.options.originatingView.lockedForOtherContols = false;
            });
            self.listenTo(contentView, "shown:overview:flyout", function() {
              self.hideInlineActions();
              self.overviewPopoverOpened = true;
              self.options.originatingView.lockedForOtherContols = true;
            });
            self.listenTo(contentView, "hide:overview:flyout", function() {
              self.overviewPopoverOpened = false;
              self.options.originatingView.lockedForOtherContols = false;
            });
          }
        }, this);
      }
    },
    getNodes: function() {
      var nodes = [];
      nodes.push(this.model);
      return nodes;
    },
    showToolBarActions: function(event) {
      if (!event.checked) {
        this._subscribeEventHandlers();
        this.options.thumbnailView.resultsView.options.showInlineActionBar = false;
      }
      this.triggerMethod("show:toolbar");
    },
    getSelectedChildren: function() {
      return this.model.collection.where({
        csuiIsSelected: true
      });
    }
  });
  _.extend(ThumbnailItemView.prototype, LayoutViewEventsPropagationMixin);
  return ThumbnailItemView;
});