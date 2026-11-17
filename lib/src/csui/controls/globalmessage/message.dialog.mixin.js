/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  var CommonViewMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        executeGotoLocation: function(node) {
          require([ "csui/lib/backbone", "csui/utils/commands", "csui/utils/commandhelper" ], function(Backbone, commands, CommandHelper) {
            var command = commands.get("goToLocation");
            if (!command) {
              throw new Error("Invalid command: goToLocation");
            }
            var status = {
              nodes: new Backbone.Collection([ node ]),
              model: node,
              context: this.options.context,
              originatingView: this
            }, options = {
              context: this.options.context,
              originatingView: this
            };
            CommandHelper.handleExecutionResults(command.execute(status, options));
          }.bind(this));
        },
        onClickLink: function(event) {
          event.preventDefault();
          event.stopPropagation();
          this.doClose();
          if (this.options.targetFolder && this._nextNode) {
            this._nextNode.set("id", this.options.targetFolder.get("id"));
          }
        },
        onClickGotoLocation: function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.doClose();
          const targetLocation = this.options.targetLocation;
          if (targetLocation && this._nextNode) {
            let node = this.options.currentNode;
            if (node) {
              node.set({
                parent_id: targetLocation.id
              }, {
                silent: true
              });
              this.executeGotoLocation(node);
            } else {
              this._nextNode.set("id", targetLocation.id);
            }
          }
        }
      });
    }
  };
  return CommonViewMixin;
});