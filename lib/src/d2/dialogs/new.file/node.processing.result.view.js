/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/list/list.view", "csui/controls/listitem/listitemstandard.view", "csui/utils/nodesprites", "hbs!d2/dialogs/new.file/impl/node.processing.result", "css!d2/dialogs/new.file/impl/node.processing.result" ], function(_, Backbone, ListView, StandardListItem, NodeSpriteCollection, template) {
  "use strict";
  var NodeProcessingResultView = ListView.extend({
    className: function() {
      var zuper = NodeProcessingResultView.__super__;
      var className = _.isString(zuper.className) ? zuper.className : _.isFunction(zuper.className) ? zuper.className.call(this, this.options) : "";
      className += " d2-node-processing-result";
      return className;
    },
    template: template,
    constructor: function NodeProcessingResultView(options) {
      options || (options = {});
      options.collection = _.isArray(options.collection) ? new Backbone.Collection(options.collection) : options.collection;
      ListView.prototype.constructor.apply(this, arguments);
      if (this.options.hideListTypeIcon === true) {
        this.$el.addClass("hide-list-type-icon");
      }
    },
    templateHelpers: function() {
      return {
        title: this.options.title,
        icon: this.options.icon
      };
    },
    childView: StandardListItem,
    childViewOptions: function() {
      return {
        showNodeIcon: this.options.showNodeIcon,
        templateHelpers: this.childViewTemplateHelpers
      };
    },
    childViewTemplateHelpers: function() {
      return {
        text: this.model.get("name"),
        icon: NodeSpriteCollection.findClassByNode(this.model),
        enableIcon: this.options.showNodeIcon
      };
    },
    onRender: function() {
      this.$el.removeClass("tile");
    }
  }, {
    Types: {
      SUCCESS: {
        icon: "csui-icon-notification-success-white"
      },
      INFO: {
        icon: "csui-icon-notification-information-white"
      },
      WARNING: {
        icon: "d2-icon-node-processing-warning"
      },
      ERROR: {
        icon: "csui-icon-notification-error-white"
      },
      MESSAGE: {
        icon: undefined
      },
      QUESTION: {
        icon: "csui-icon-notification-confirmation-white"
      }
    },
    create: function(options) {
      options = options || {};
      if (options.collection) {
        var newOptions = {
          collection: options.collection
        }, type = _.defaults({}, options.type, NodeProcessingResultView.Types.MESSAGE);
        if (_.isString(options.title) && !_.isEmpty(options.title)) {
          newOptions.title = options.title;
          newOptions.icon = type.icon;
        }
        newOptions.showNodeIcon = options.showNodeIcon === false ? false : true;
        newOptions.hideListTypeIcon = options.hideListTypeIcon;
        return new NodeProcessingResultView(newOptions);
      }
      return null;
    }
  });
  return NodeProcessingResultView;
});