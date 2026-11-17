/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/list/behaviors/list.view.keyboard.behavior", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/controls/list/list.view", "csui/behaviors/default.action/default.action.behavior", "nuc/models/nodes", "csui/controls/node-type.icon/node-type.icon.view", "csui/utils/commands", "csui/controls/listitem/listitemstandard.view", "d2/widgets/metadata/panels/relations/metadata.relations.model", "hbs!d2/widgets/task.details/impl/task.files.list/task.files.relation", "hbs!d2/widgets/task.details/impl/task.files.list/task.files.relation.item", "hbs!d2/widgets/task.details/impl/task.files.list/task.files.relation.empty", "i18n!d2/widgets/task.details/impl/nls/lang", "css!d2/widgets/task.details/impl/task.files.list/task.files.relation" ], function(_, $, Backbone, Marionette, ListViewKeyboardBehavior, PerfectScrollingBehavior, ListView, DefaultActionBehavior, NodeCollection, NodeTypeIconView, Commands, StandardListItem, RelationCollection, template, templateItem, EmptyViewTemplate, lang) {
  "use strict";
  var TaskFilesRelationItem = StandardListItem.extend({
    className: "d2-task-relation-item csui-item-standard binf-list-group-item",
    template: templateItem,
    setElementData: function() {
      this.$el.prop("tabindex", "0");
      return this.$el;
    },
    constructor: function TaskFilesRelationItem(options) {
      this.relationListView = options.relationListView;
      StandardListItem.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var iconView = new NodeTypeIconView({
        el: this.$el.find(".d2-relation-icon").get(0),
        node: this.options.model
      });
      iconView.render();
    }
  });
  var TaskFilesRelationEmptyView = Marionette.ItemView.extend({
    className: "d2-task-relation-empty",
    template: EmptyViewTemplate,
    constructor: function TaskFilesRelationEmptyView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  var TaskFilesListItemRelation = ListView.extend({
    className: "d2-task-list-relation",
    template: template,
    childView: TaskFilesRelationItem,
    emptyView: TaskFilesRelationEmptyView,
    behaviors: {
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".binf-list-group",
        suppressScrollX: true
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    triggers: {
      "click .more-link": "click:more"
    },
    events: {
      focusout: "onFocusOut",
      keydown: "onKeyDown",
      "keydown .more-link": "onKeyDownMore"
    },
    childEvents: {
      "click:item": "onClickItem"
    },
    childViewOptions: function(model) {
      return {
        model: model,
        name: model.get("name") || model.get("object_name"),
        relationName: model.get("relation_name"),
        showInlineActionBar: false,
        relationListView: this
      };
    },
    constructor: function TaskFilesListItemRelation(options) {
      var self = this, node = options.node.clone();
      node.fetch = options.node.fetch;
      self.options = options;
      options = options || {};
      var columnDefinitions = [ {
        key: "name",
        name: lang.relationSortableKey,
        type: -1,
        type_name: "String",
        direction: "Asc",
        sort: true
      } ];
      this.collection = new RelationCollection(undefined, {
        node: node,
        autoreset: true,
        relationPopup: true,
        clientColumns: columnDefinitions,
        sizeLimit: true
      });
      this.additionalPanelsView = options.additionalPanelsView;
      this.originatingView = options.originatingView;
      this.sizeLimit = 5;
      ListView.prototype.constructor.apply(this, arguments);
      this.onKeyInView = function(event) {
        switch (event.which) {
         case 9:
          if (event.shiftKey && this.getElementByIndex(0)[0] === event.target || !event.shiftKey && this.showMore && $(event.target).hasClass("more-link") || !event.shiftKey && !this.showMore && this.getElementByIndex(this.children.length - 1)[0] === event.target || event.shiftKey && this.$el.find(".binf-list-group")[0] === event.target) {
            event.stopPropagation();
            event.preventDefault();
          }
          break;

         case 27:
          this.options.relationView.$el.trigger("focus");
          this.options.relationView.trigger("hidePopover", event);
          break;
        }
      };
      node._expanded = false;
      node.fetch().done(function() {
        this.collection.fetch().done(function() {
          this.showMore = this.collection.allModels && this.collection.allModels.length > this.sizeLimit;
          this.collection.models = this.collection.slice(0, this.sizeLimit);
          this.render();
          this.showMore && this.$el.find(".more-link-container").removeClass("binf-hidden");
          if (this.options.relationView.ui.relationCount.data("binf.popover").tip().hasClass("binf-in")) {
            this.options.relationView.ui.relationCount.binf_popover("show");
            this.$el.find(".binf-list-group").focus();
          }
        }.bind(this));
      }.bind(this));
    },
    templateHelpers: function() {
      return {
        showMore: this.showMore,
        showMoreLabel: lang.relationsShowMoreLabel
      };
    },
    onClickItem: function(target) {
      var command = Commands.get("Browse");
      var status = _.extend(this.options, {
        nodes: new NodeCollection([ target.model ])
      });
      this.options.relationView.trigger("hidePopover");
      command.execute(status, this.options);
    },
    onFocusOut: function(event) {
      setTimeout(function() {
        if (this.$el.has(document.activeElement).length === 0) {
          this.options.relationView.preventToggle = true;
          this.options.relationView.trigger("hidePopover", event);
          setTimeout(function() {
            this.options.relationView.preventToggle = false;
          }.bind(this), 301);
        }
      }.bind(this));
    },
    onKeyDownMore: function(event) {
      switch (event.which) {
       case 13:
       case 32:
        this.trigger("click:more");
        break;
      }
    }
  });
  return TaskFilesListItemRelation;
});