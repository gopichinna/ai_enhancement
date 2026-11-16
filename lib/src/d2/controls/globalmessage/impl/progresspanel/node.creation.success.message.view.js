/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/messagehelper", "csui/utils/accessibility", "csui/perspectives/flow/flow.perspective.view", "dctmw/utils/rest.resources", "d2/utils/creation.utils", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings", "i18n!csui/controls/globalmessage/impl/nls/globalmessage.lang", "hbs!d2/controls/globalmessage/impl/progresspanel/impl/node.creation.success.message", "css!d2/controls/globalmessage/impl/progresspanel/impl/node.creation.success.message" ], function(require, _, Backbone, Marionette, MessageHelper, Accessibility, FlowPerspectiveView, RestResources, CreationUtils, utils, lang, csuiLang, template) {
  "use strict";
  var NodeCreationSuccessMessageView = Marionette.ItemView.extend({
    className: "csui-messagepanel csui-success d2-node-create-success-message",
    template: template,
    ui: {
      closeAction: ".csui-header .csui-action-close",
      doneCommandLink: ".node-done-command-link"
    },
    events: {
      "click @ui.closeAction": "doClose",
      "click @ui.doneCommandLink": "onClickLink"
    },
    behaviors: {},
    constructor: function NodeCreationSuccessMessageView(options) {
      options = options || {};
      options.messageHelper = options.messageHelper || new MessageHelper();
      this.messageHelper = options.messageHelper;
      if (options.showLink === true || options.disAllowed_files && options.disAllowed_files.length !== 0) {
        this.displayPermanent = true;
      } else {
        this.displayPermanent = Accessibility.isAccessibleMode();
      }
      this.context = options.context;
      Marionette.ItemView.prototype.constructor.call(this, options);
      var me = this;
      require([ "csui/behaviors/default.action/default.action.behavior" ], function(DefaultActionBehavior) {
        var defaultBehavior = {
          defaultAction: {
            behaviorClass: DefaultActionBehavior
          }
        };
        me._behaviors = Marionette.Behaviors(me, defaultBehavior);
      });
    },
    templateHelpers: function() {
      if (!this.headerId) {
        this.headerId = _.uniqueId("header");
      }
      var successMessageFormat = this.options.successMessageFormat, node = this.options.node, nodeName = node && node.get("name"), title = _.str.sformat(successMessageFormat, nodeName, node._foldername), invalidExtensionMessage = lang.invalidUploadExtension, disAllowed_files = this.options.disAllowed_files, hasInvalidExtensions = this.options.disAllowed_files && this.options.disAllowed_files.length !== 0, linkActive = this.options.showLink;
      return {
        headerId: this.headerId,
        linkActive: linkActive,
        invalidExtensionMessage: invalidExtensionMessage,
        hasInvalidExtensions: hasInvalidExtensions,
        disAllowed_files: disAllowed_files,
        title: title,
        message: _.str.sformat(successMessageFormat, nodeName, node._foldername),
        linkLabel: this.options.linkLabel,
        lang: csuiLang
      };
    },
    onRender: function() {
      this.$el.attr("role", "alertdialog");
      this.$el.attr("aria-labelledby", this.headerId);
    },
    doCollapse: function() {},
    doExpand: function() {},
    doShow: function(relatedView, parentView) {
      var self = this;
      var panel = _.extend({
        csuiAfterShow: function() {
          self._setTimeout();
        }
      }, this);
      this.messageHelper.showPanel(panel, relatedView, parentView);
    },
    doClose: function() {
      this._clearTimeout();
      var self = this, panel = _.extend({
        csuiAfterHide: function() {
          self.destroy();
          self.trigger("escaped:focus");
        }
      }, this);
      this.messageHelper.fadeoutPanel(panel);
    },
    _setTimeout: function() {
      var self = this;
      if (!this.displayPermanent) {
        this.timeout = window.setTimeout(function() {
          self.doClose();
        }, 5e3);
      }
    },
    _clearTimeout: function() {
      if (this.timeout) {
        window.clearTimeout(this.timeout);
        delete this.timeout;
      }
    },
    onClickLink: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var originView = this.options.originatingView instanceof FlowPerspectiveView ? this : this.options.originatingView;
      require([ "csui/utils/commands", "nuc/models/nodes" ], function(commands, NodeCollection) {
        var command = commands.get(this.options["link_command_signature"]);
        if (command) {
          var node = this.options.node;
          var status = {
            nodes: new NodeCollection([ node ]),
            context: this.options.context || node.context,
            originatingView: originView
          };
          if (utils.isMobile() && status.context) {
            status.originatingView || (status.originatingView = this);
            status.context.data || (status.context.data = {});
            status.context.data.originatingNodeId = node.get("id");
          }
          command.execute(status, this.options.linkCommandOptions);
          this.doClose();
        }
      }.bind(this));
    }
  });
  return NodeCreationSuccessMessageView;
});