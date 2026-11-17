/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/list/simplelist.view", "csui/controls/listitem/listitemstandard.view", "nuc/utils/base", "dctmw/controls/list/list.state.view", "dctmw/controls/list/impl/list.keyboard.behavior", "i18n!dctmw/controls/list/impl/nls/lang", "hbs!dctmw/controls/list/impl/list", "css!dctmw/controls/list/impl/list" ], function(_, $, Backbone, Marionette, NodeTypeIconView, CSSimpleListView, CSStandardListItemView, base, ListStateView, ListKeyboardBehavior, lang, template) {
  "use strict";
  var D2ListView = CSSimpleListView.extend({
    className: function() {
      var zuper = D2ListView.__super__, className = "d2-listview";
      var clazz = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " " + clazz;
      if (this.options && this.options.className) {
        className += " " + _.result(this.options, "className");
      }
      return className;
    },
    template: template,
    emptyView: ListStateView,
    emptyViewOptions: function() {
      var me = this;
      return {
        model: new Backbone.Model({
          state: "empty"
        }),
        stateMessages: {
          empty: me.options.emptyStateMessage || lang.emptyStateMessage
        }
      };
    },
    childView: CSStandardListItemView,
    childViewOptions: function() {
      var opts = _.extend({}, this.options);
      opts.templateHelpers = function() {
        return {
          name: this.model.get("name"),
          itemLabel: this.model.get("name"),
          enableIcon: true,
          showInlineActionBar: false
        };
      };
      return opts;
    },
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender",
      "before:destroy": "_onBeforeChildDestroy"
    },
    behaviors: {
      ListKeyboardBehavior: {
        behaviorClass: ListKeyboardBehavior
      }
    },
    constructor: function D2ListView(options) {
      options = options || {};
      this.selectedModel = options.selectedModel;
      this.mergeAttributesFromSelectedModelOnIDChange = true;
      this.skippableAttributesOnMerge = [ "name" ];
      this.attributesUsedForEqualityComparison = [ "id" ];
      this.postRenderAutoSelectIndex = -1;
      CSSimpleListView.prototype.constructor.call(this, options);
      this.listenTo(this.selectedModel, "change:id", this._adjustSelection).listenTo(this.collection, "change", this._onCollectionModelChange);
    },
    onRender: function() {
      CSSimpleListView.prototype.onRender && CSSimpleListView.prototype.onRender.apply(this, arguments);
      if (base.isIE11()) {
        this.$el.addClass("fix-msie");
      }
    },
    _onChildRender: function(childView) {
      if (childView instanceof CSStandardListItemView) {
        var templateOptions = childView.options.templateHelpers();
        childView.$(".list-item-title").attr({
          title: templateOptions.name,
          "aria-label": templateOptions.itemLabel
        }).text(templateOptions.name);
        if (!childView._nodeIconView) {
          childView._nodeIconView = new NodeTypeIconView({
            el: childView.$(".csui-type-icon").get(0),
            node: childView.model
          });
          childView._nodeIconView.render();
        }
      }
    },
    _onBeforeChildDestroy: function(childView) {
      if (childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },
    _onCollectionModelChange: function(model) {
      var childView = this.children.findByModel(model);
      !!childView && this._onChildRender(childView);
    },
    _initialEvents: function() {
      CSSimpleListView.prototype._initialEvents.apply(this, arguments);
      if (this.collection) {
        this.listenTo(this.collection, "remove", this._adjustSelection.bind(this, true));
      }
    },
    onBeforeRenderEmpty: function() {
      this.$el.addClass("empty-state");
    },
    onRenderEmpty: function() {
      if (!this.collection.fetched) {
        return;
      }
      this._adjustSelection();
    },
    onBeforeRenderCollection: function() {
      this.$el.removeClass("empty-state");
    },
    onRenderCollection: function() {
      if (this.postRenderAutoSelectIndex >= 0) {
        var index = this.postRenderAutoSelectIndex, childView = this.children.findByIndex(index);
        this.postRenderAutoSelectIndex = -1;
        if (childView) {
          childView.trigger("click:item", childView);
          return;
        }
      }
      this._adjustSelection();
    },
    _adjustSelection: function(doNotLookForSimilarItem) {
      if (!this.$el.is(":visible")) {
        this.listenToOnce(this, "dom:refresh", this._adjustSelection.bind(this, doNotLookForSimilarItem));
        return;
      }
      if (this.selectedModel) {
        var selIndex = doNotLookForSimilarItem === true ? -1 : this._findIndexOfModelIn(this.collection.models, this.selectedModel);
        if (selIndex !== -1) {
          var selModel = this.collection.at(selIndex);
          if (this.mergeAttributesFromSelectedModelOnIDChange === true && selModel.get("id") !== this.selectedModel.get("id")) {
            selModel.set(_.omit(this.selectedModel.attributes, this.skippableAttributesOnMerge));
          }
          this.setSelectedIndex(selIndex);
        } else {
          var $selectedItem = this.$el.find("[data-csui-active]");
          $selectedItem.removeClass("binf-active").removeAttr("data-csui-active").removeAttr("aria-current");
          this.trigger("clear:selection");
        }
      }
    },
    _findIndexOfModelIn: function(models, targetModel) {
      if (targetModel) {
        var index = -1;
        _.any(this.attributesUsedForEqualityComparison, function(attr) {
          index = _.findIndex(models, function(model) {
            var value = model.get(attr);
            return !_.isUndefined(value) && !_.isNull(value) && value === targetModel.get(attr);
          });
          return index !== -1;
        });
        return index;
      }
      return -2;
    },
    onDomRefresh: function() {},
    _setCssItemSelected: function($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $item.siblings("[data-csui-active]");
      $active.removeClass("binf-active").removeAttr("data-csui-active").removeAttr("aria-current");
      $item.addClass("binf-active").attr("data-csui-active", "").attr("aria-current", "page");
      $item.siblings().prop("tabindex", "-1");
    },
    onClickItem: function(src) {
      src.cancelClick = false;
      this.trigger("click:item", src);
      if (src.cancelClick === false) {
        if (this.selectedModel) {
          var model = src.model;
          if (model.get("id") !== this.selectedModel.get("id")) {
            this.selectedModel.clear({
              silent: true
            });
          }
          this.selectedModel.set(model.attributes);
        }
        this._setCssItemSelected(src.$el);
      }
    },
    setSelectedIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return;
      }
      var nthChildSel = _.str.sformat("div a:nth-child({0})", index + 1);
      var $item = this.$(nthChildSel);
      this._setCssItemSelected($item);
      $item.first().trigger("focus");
    },
    getSelectedIndex: function() {
      var $selectedItem = this.$el.find("[data-csui-active]");
      var selectedIndex = this.$el.find(".cs-list-group > a").index($selectedItem);
      return selectedIndex;
    },
    getSelectedItem: function() {
      var selectedIndex = this.getSelectedIndex(), selectedItem = selectedIndex !== -1 && selectedIndex < this.collection.length ? this.children.findByModel(this.collection.at(selectedIndex)) : undefined;
      return selectedItem;
    }
  });
  return D2ListView;
});