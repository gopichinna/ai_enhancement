/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/lib/marionette", "csui/perspective.manage/impl/options.form.view", "csui/perspective.manage/impl/widget.item.view", "i18n!csui/perspective.manage/impl/nls/lang", "csui/models/widget/widget.collection", "hbs!csui/perspective.manage/impl/widget.item" ], function(module, _, $, Backbone, Marionette, WidgetOptionsFormView, WidgetItemView, Lang, WidgetCollection, WidgetItemTemplate) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  });
  var WidgetListView = Marionette.ItemView.extend({
    tagName: "div",
    template: WidgetItemTemplate,
    constructor: function WidgetListView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options.existsWidgetTypes || (options.existsWidgetTypes = []);
      Marionette.ItemView.call(this, options);
      this.context = this.options.pmanView.context;
      var self = this;
      self.widegtsUpdated = false;
      this.allWidgets = new WidgetCollection();
      this.allWidgets.fetch().done(function() {
        self.collection = self._groupWidgetsByModule();
        self.render();
        self.trigger("items:fetched");
      });
      this.listenTo(this.context, "update:widget:panel", _.bind(function(opts) {
        this.widegtsUpdated = true;
        var newEleToBeProcess = opts.widgetModel && opts.widgetModel.type ? opts.widgetModel.type : undefined, oldEleToBeProcess = opts.oldWidgetModel && opts.oldWidgetModel.type ? opts.oldWidgetModel.type : undefined;
        if (!!newEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, newEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          } else {
            this.options.existsWidgetTypes.push(newEleToBeProcess);
          }
          newEleToBeProcess = newEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + newEleToBeProcess + '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass("binf-hidden") : "";
        }
        if (!!oldEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, oldEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          oldEleToBeProcess = oldEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + oldEleToBeProcess + '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass("binf-hidden") : "";
        }
      }, this));
      this.listenTo(this.context, "reset:widget:panel", _.bind(function(opts) {
        this.options.existsWidgetTypes = [];
        this.widegtsUpdated = true;
      }, this));
    },
    initialize: function() {
      _.bindAll(this, "renderItem");
    },
    className: "cs-module-list",
    render: function() {
      this.collection && this.collection.each(this.renderItem);
    },
    renderItem: function(model) {
      var parentView = this;
      var itemView = new WidgetItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, "widgets:expanded", _.bind(this.trigger, this, "dom:refresh", this));
      $(this.el).append(itemView.el);
    },
    _groupWidgetsByModule: function() {
      var moduleCollection = new Backbone.Collection();
      var widgets = this.allWidgets.filter(function(widget) {
        var manifest = widget.get("manifest");
        if (!manifest || !_.has(manifest, "title") || !_.has(manifest, "description") || manifest.deprecated) {
          return false;
        }
        var schema = JSON.parse(JSON.stringify(manifest.schema || {})), options = JSON.parse(JSON.stringify(manifest.options || {})), isValidSchema = WidgetOptionsFormView._normalizeOptions(schema.properties, options.fields || {}, {});
        if (!isValidSchema) {
          return false;
        }
        return true;
      });
      _.each(widgets, _.bind(function(widget) {
        var manifest = _.defaults(widget.get("manifest"), {
          allowMultiple: true,
          title: Lang.noTitle
        }), canDragAndDrop = manifest.allowMultiple;
        if (!canDragAndDrop) {
          canDragAndDrop = $.inArray(widget.get("id"), this.options.existsWidgetTypes) === -1;
        }
        widget.set({
          allowMultiple: manifest.allowMultiple,
          canDragAndDrop: canDragAndDrop,
          title: manifest.title
        });
      }, this));
      _.each(_.groupBy(widgets, function(widget) {
        return widget.serverModule.id;
      }), function(val, key) {
        var title = _.first(val).serverModule.get("title");
        title = title ? title.replace(/OpenText /, "") : _.first(val).serverModule.get("id").toUpperCase();
        moduleCollection.add({
          id: key,
          title: title,
          widgets: val
        });
      });
      return moduleCollection;
    },
    _sanitiseWidgetLibrary: function() {},
    onInitWidgets: function() {
      this.$el.empty();
      if (this.widegtsUpdated) {
        this.collection = this._groupWidgetsByModule();
        this.widegtsUpdated = false;
      }
      this.render();
    }
  });
  return WidgetListView;
});