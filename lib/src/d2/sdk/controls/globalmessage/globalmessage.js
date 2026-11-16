/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/controls/globalmessage/globalmessage',
  'd2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view'
],function(GlobalMessageImpl, ClickableLinkNodeMessageViewImpl){
  'use strict';

  /**
   * UI component used to show different types of toast messages.
   *
   * @module {d2/sdk/controls/globalmessage/globalmessage} d2/sdk/controls/globalmessage/globalmessage
   * @name GlobalMessage
   * @extends {external:Marionette.View}
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external NodeModel
   * @see ../models/node.model
   */

  /**
   * @typedef {Object} GMConfigOptions
   * @property {Boolean} enablePermanentHeaderMessages - Whether to show the toast message without auto-dismiss. Defaults to `false`.
   */

  return {
    /**
     * Show a toast message of particular type
     *
     * @function
     * @param {string} type - Type of the message. Possible values are `'info', 'success', 'warning', 'error'`.
     * @param {string} message - The message to be shown.
     * @param {string} [details] - Details associated with the message.
     * @param {object} [options] - Control options
     * @param {GMConfigOptions} [options.configOption] - Message display configuration.
     * @returns {external:Marionette.View} The toast message view instance.
     * @note `success` messages automatically disappear after some timeout.
     * @memberOf module:GlobalMessage
     *
     * @example
     * define([
     *  'd2/sdk/controls/globalmessage/globalmessage'
     * ], function(GlobalMessage){
     *  'use strict';
     *
     *  //To show information message
     *  GlobalMessage.showMessage('info', 'Hello world!');
     *
     *  //To show success message
     *  GlobalMessage.showMessage('success', 'This is a sample success message');
     * });
     *
     */
    showMessage: function(){
      return GlobalMessageImpl.showMessage.apply(GlobalMessageImpl, arguments);
    },

    showProgressPanel: function() {
      return GlobalMessageImpl.showProgressPanel.apply(GlobalMessageImpl, arguments);
    },

    hideProgressPanel: function() {
      return GlobalMessageImpl.hideProgressPanel.apply(GlobalMessageImpl, arguments);
    },

    /**
     * Show a success toast message with a clickable link that can execute a command model implementaion.
     * @param {object} options - Message options
     * @param {Boolean} options.showLink - Whether to show a link
     * @param {external:NodeModel} options.node - A NodeModel instance whose details is used to format the message. Also used later to execute the linked command when user clicks
     * on the link.
     * @param {Context} options.context - Reference to the application context.
     * @param {string} options.messageFormat - A string template. First placeholder in the string will be replaced with the name attribute value from `options.node`.
     * Can also be used to pass a complete message disregarding the fact that it will try to interpret as a template.
     * @param {string} options.linkLabel - Text to be shown as link.
     * @param {string} options.linkCommandSignature - Signature of the command to be executed when user clicks on the displayed link.
     * @memberOf module:GlobalMessage
     *
     * @example
     * define([
     *    'd2/sdk/controls/globalmessage/globalmessage',
     *    'd2/sdk/models/node.model',
     *    'd2/sdk/utils/contexts/context.utils'
     * ], function(GlobalMessage, NodeModel, contextUtil){
     *  'use strict';
     *
     *  GlobalMessage.showSuccessMessageWithLink({
     *    showLink: true,
     *    node: new NodeModel({id: '090015fa80002d49', name: 'SampleDocument'}),
     *    context: contextUtil.getPerspectiveContext(),
     *    messageFormat: 'Hello "{0}"',
     *    linkLabel: 'click to open overview',
     *    linkCommandSignature: 'Browse'
     *  });
     * });
     *
     */
    showSuccessMessageWithLink: function(options) {
      options = options || {};
      return GlobalMessageImpl._showMessageView(ClickableLinkNodeMessageViewImpl, {
        showLink: options.showLink,
        node: options.node,
        context: options.context,
        successMessageFormat: options.messageFormat,
        linkLabel: options.linkLabel,
        link_command_signature: options.linkCommandSignature
      });
    }
  };
});