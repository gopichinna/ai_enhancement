/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "dctmw/controls/list/listitem.type.node.view", "hbs!d2/widgets/tasks/impl/tasklistitem" ], function(_, $, Marionette, ListItemTypeNodeView, template) {
  return ListItemTypeNodeView.extend({
    template: template,
    className: function() {
      var className = ListItemTypeNodeView.prototype.className;
      if (_.isString(className)) {
        className += " d2-task-list-item";
      } else {
        className = className.apply(this, arguments) + " d2-task-list-item";
      }
      return className;
    }
  });
});