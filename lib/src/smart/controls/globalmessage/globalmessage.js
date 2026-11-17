/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/messagehelper", "smart/utils/accessibility", "smart/controls/globalmessage/impl/messagedialog.view", "smart/controls/globalmessage/impl/custom.wrapper.view", "smart/controls/progresspanel/progresspanel", "smart/dialogs/modal.alert/modal.alert" ], function(module, _, $, Backbone, MessageHelper, Accessibility, MessageDialogView, CustomWrapperView, SmartProgressPanel) {
  "use strict";
  var config = module.config();
  _.defaults(config, {
    enablePermanentHeaderMessages: false
  });
  if (Accessibility.isAccessibleMode()) {
    config.enablePermanentHeaderMessages = true;
  }
  var messageHelper = new MessageHelper(), globals = {}, hasDefaultRegion;
  var GlobalMessage = {
    setMessageRegionView: function(messageRegionView, options = {}) {
      this._cleanupPreviousMessageRegion();
      options = _.defaults({}, options, {
        useClass: true,
        sizeToParentContainer: true
      });
      options.classes && (globals.classNames = options.classes);
      globals.relatedView = options.useClass ? undefined : messageRegionView;
      globals.sizeToParentContainer = options.sizeToParentContainer;
      globals.messageRegionView = messageRegionView;
    },
    setProgresspanelMessageRegionView: _.bind(SmartProgressPanel.setProgresspanelMessageRegionView, SmartProgressPanel),
    showMessage: function(info, text, details, options) {
      if (options?.MessageDialogMixin) {
        options?.MessageDialogMixin?.mixin(MessageDialogView.prototype);
      }
      return this._showMessageDialogView(MessageDialogView, _.extend({
        info: info,
        message: text,
        details: details,
        messageHelper: messageHelper,
        sizeToParentContainer: globals.sizeToParentContainer,
        enablePermanentHeaderMessages: options?.configOptions?.enablePermanentHeaderMessages ? options.configOptions.enablePermanentHeaderMessages : config.enablePermanentHeaderMessages
      }, options));
    },
    showCustomView: function(customView) {
      return this._showMessageDialogView(CustomWrapperView, {
        contentView: customView,
        messageHelper: messageHelper
      });
    },
    _showMessageDialogView: function(View, options) {
      this._ensureMessageRegion();
      var messageDialogView = messageHelper.activatePanel(messageHelper.createPanel(globals, View, options), globals.relatedView, globals.messageRegionView);
      this._addEventHandlers(messageDialogView);
      return messageDialogView;
    },
    _addEventHandlers: function(view) {
      var resizeHandler = function() {
        messageHelper.resizePanel(view, globals.relatedView);
      };
      $(window).on("resize", resizeHandler);
      view.listenTo(globals.messageRegionView, "resize", resizeHandler);
      view.once("before:destroy", function() {
        $(window).off("resize", resizeHandler);
        view.stopListening(globals.messageRegionView, "resize", resizeHandler);
      });
    },
    _ensureMessageRegion: function() {
      if (globals.messageRegionView) {
        return;
      }
      var modalContainer = $.fn.binf_modal.getDefaultContainer(), messageContainer = $("<div>", {
        class: "csui-message-container"
      }, {
        style: "position:absolute; top: 0; left: 0; width: 0; height: 100vh;"
      }).appendTo(modalContainer);
      globals.messageRegionView = new Backbone.View({
        el: messageContainer
      });
      hasDefaultRegion = true;
    },
    _cleanupPreviousMessageRegion: function() {
      if (hasDefaultRegion) {
        globals.messageRegionView.remove();
        hasDefaultRegion = false;
      }
      globals = {};
    }
  };
  return GlobalMessage;
});