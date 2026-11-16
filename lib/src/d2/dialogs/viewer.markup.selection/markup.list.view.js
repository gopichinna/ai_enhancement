/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/progressblocker/blocker", "d2/dialogs/viewer.markup.selection/markup.treelistitem.view", "hbs!d2/dialogs/viewer.markup.selection/impl/markup.list.view", "i18n!d2/dialogs/viewer.markup.selection/impl/nls/lang", "css!d2/dialogs/viewer.markup.selection/impl/markup.list.view" ], function($, _, Backbone, Marionette, TabableRegionBehavior, TabablesBehavior, BlockingView, MarkupTreeListItemView, TemplateView, lang) {
  "use strict";
  var SelectMarkupView = Marionette.CompositeView.extend({
    template: TemplateView,
    attributes: function() {
      return {
        role: "tree"
      };
    },
    className: "d2-select-markup-view",
    childViewContainer: ".markup-details-list-group",
    childView: MarkupTreeListItemView,
    templateHelpers: function() {
      return {
        title: lang.MarkupListTitle
      };
    },
    childViewOptions: function() {
      var me = this;
      return {
        documentCount: me.collection.length
      };
    },
    events: {
      keyup: "onKeyInView"
    },
    constructor: function SelectMarkupView(options) {
      options || (options = {});
      this.behaviors = _.extend({
        TabableRegion: {
          behaviorClass: TabableRegionBehavior
        }
      }, this.behaviors);
      options.collection = options.wizard.options.data.collection;
      Marionette.CompositeView.prototype.constructor.call(this, options);
    },
    isTabable: function() {
      return true;
    },
    currentlyFocusedElement: function() {
      var allTabElement = $(".markup-details-content").find("[tabindex=0]");
      if (allTabElement.length > 0) {
        return allTabElement[0];
      }
      var currentView = this.getChildViewByIndex(0);
      currentView.$el.prop("tabindex", "0");
      return currentView.$el;
    },
    onRender: function() {},
    onKeyInView: function(event) {
      var currentView, currentElement, nextElement, child;
      switch (event.keyCode) {
       case 9:
        break;

       case 13:
        if ($(document.activeElement).hasClass("d2-markup-treelistitem")) {
          event.stopPropagation();
          event.preventDefault();
          currentElement = $(document.activeElement);
          nextElement = $(document.activeElement).find(".d2-markup-header button");
          this._moveTo(event, currentElement, nextElement);
        } else if ($(document.activeElement).hasClass("dropdown-icon")) {
          currentView = this.children._views[$(document.activeElement).parents(".d2-markup-header").attr("data-view-id")];
          currentView.ui.headerDropdownIcon.trigger("click", [ "manual" ]);
        }
        break;

       case 27:
        var treeItemHeader = $(document.activeElement).parents(".d2-select-markup-view .d2-markup-header");
        if (treeItemHeader.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          currentElement = $(document.activeElement);
          nextElement = $(document.activeElement).parents(".d2-select-markup-view .d2-markup-treelistitem ");
          this._moveTo(event, currentElement, nextElement);
          $(nextElement).addClass("csui-acc-focusable-active");
        }
        break;

       case 37:
        if (this.isCurrentFocusInsideHeader()) {
          if ($(document.activeElement).hasClass("dropdown-icon")) {
            currentElement = $(document.activeElement);
            nextElement = $(document.activeElement).parent().find("button");
            this._moveTo(event, currentElement, nextElement);
          }
        } else {
          if ($(document.activeElement).hasClass("d2-markup-treelistitem")) {
            currentView = this.children._views[$(document.activeElement).children(".d2-markup-header").attr("data-view-id")];
            if (!currentView.ui.content.hasClass("binf-hidden")) {
              currentView.ui.headerDropdownIcon.trigger("click", [ "manual" ]);
            }
          }
        }
        break;

       case 38:
        if ($(document.activeElement).hasClass("d2-markup-treelistitem")) {
          currentElement = $(document.activeElement);
          currentView = this.children._views[$(document.activeElement).children(".d2-markup-header").attr("data-view-id")];
          nextElement = $(currentView.$el).prev();
          if (nextElement.length > 0) {
            var previousView = this.children._views[$(nextElement).children(".d2-markup-header").attr("data-view-id")];
            if (previousView.ui.content.hasClass("binf-hidden")) {
              $(nextElement).addClass("csui-acc-focusable-active");
            } else {
              var children = $(previousView.$el).find(".cs-list-group").children();
              child = children[children.length - 1];
              nextElement = $(child).find("button");
            }
          }
        } else {
          currentElement = $(document.activeElement);
          var currentParent = $(document.activeElement).parent();
          nextElement = $(currentParent).prev();
          if (nextElement.length > 0) {
            nextElement = $(nextElement).find("button");
          } else {
            nextElement = $(currentElement).parents(".d2-select-markup-view .d2-markup-treelistitem");
          }
        }
        this._moveTo(event, currentElement, nextElement);
        break;

       case 39:
        if (this.isCurrentFocusInsideHeader()) {
          if ($(document.activeElement).hasClass("csui-checkbox")) {
            nextElement = $(document.activeElement).parents(".d2-select-markup-view .d2-markup-header").find(".dropdown-icon");
            $(nextElement).prop("tabindex", 0);
            $(nextElement).trigger("focus");
          }
        } else {
          if ($(document.activeElement).hasClass("d2-markup-treelistitem")) {
            currentView = this.children._views[$(document.activeElement).children(".d2-markup-header").attr("data-view-id")];
            if (currentView.ui.content.hasClass("binf-hidden")) {
              currentView.ui.headerDropdownIcon.trigger("click", [ "manual" ]);
            }
          }
        }
        break;

       case 40:
        if ($(document.activeElement).hasClass("d2-markup-treelistitem")) {
          currentView = this.children._views[$(document.activeElement).children(".d2-markup-header").attr("data-view-id")];
          if (currentView.ui.content.hasClass("binf-hidden")) {
            currentElement = $(currentView.$el);
            nextElement = currentElement.next();
            currentElement.removeClass("csui-acc-focusable-active");
            nextElement.addClass("csui-acc-focusable-active");
          } else {
            currentElement = $(currentView.$el);
            currentElement.removeClass("csui-acc-focusable-active");
            child = this.getChildOfChildViewByIndex(currentView, 0);
            nextElement = $(child.$el).find("button");
          }
        } else if ($(document.activeElement).hasClass("csui-checkbox")) {
          currentElement = $(document.activeElement);
          nextElement = $(document.activeElement).parent().next().find("button");
          if (nextElement.length === 0) {
            nextElement = currentElement.parents(".d2-select-markup-view .d2-markup-treelistitem").next();
          }
        }
        this._moveTo(event, currentElement, nextElement);
        break;
      }
      return true;
    },
    isCurrentFocusInsideHeader: function() {
      var treeItemHeader = $(document.activeElement).parents(".d2-select-markup-view .d2-markup-header");
      return treeItemHeader.length > 0 ? true : false;
    },
    removeAllTabIndex: function() {
      $(".markup-details-content").find("*[tabindex]").removeAttr("tabindex");
    },
    _moveTo: function(event, currentView, nextView) {
      currentView && currentView.removeAttr("tabindex");
      nextView && nextView.prop("tabindex", "0");
      nextView && nextView.trigger("focus");
    },
    getChildViewByIndex: function(index) {
      var cid = this.collection.models[index].cid;
      var viewId = this.children._indexByModel[cid];
      return this.children._views[viewId];
    },
    getChildOfChildViewByIndex: function(childView, index) {
      var cid = childView.collection.models[index].cid;
      var viewId = childView.children._indexByModel[cid];
      return childView.children._views[viewId];
    }
  });
  return SelectMarkupView;
});