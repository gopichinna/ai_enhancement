/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/dialog/dialog.view'
], function(DialogViewImpl){
  'use strict';

  /**
   * Create a simple modal dialog. Has customizable header, footer and primary content.
   *
   * @example
   * define([
   *  'd2/sdk/controls/dialogs/simple.dialog'
   * ], function(SimpleDialog){
   *  'use strict';
   *
   *  var dialog = new SimpleDialog({title: 'Greetings', bodyMessage: 'Hello World!'});
   *  dialog.show(); //Dialog is rendered with a close button at top-right corner of the header.
   *
   *  dialog = new SimpleDialog({title: 'Greetings', bodyMessage: 'Hello World!', buttons: [{label: 'OK'}]});
   *  dialog.show();//Dialog header does not show a close button anymore, however SimpleDialog automatically adds a 'Cancel' button to close it.
   *
   * });
   *
   * @module {d2/sdk/controls/dialogs/simple.dialog} d2/sdk/controls/dialogs/"simple.dialog"
   * @name SimpleDialog
   * @extends {external:Marionette.View}
   * @fires "shown.binf.modal"
   * @fires "hidden.binf.modal"
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * @external "jQuery.Event"
   * @see https://api.jquery.com/category/events/event-object/
   */

  /**
   * Triggers on the dialog's HTML element when it is shown.
   * @event module:SimpleDialog#event:"shown.binf.modal"
   * @type {external:jQuery.Event}
   */

  /**
   * Trigger on the dialog's HTML element when it becomes hidden.
   * @event module:SimpleDialog#event:"hidden.binf.modal"
   * @type {external:jQuery.Event}
   */

  /**
   * @typedef {Object} FooterButton
   * @property {string} label - Text to be displayed on the button
   * @property {string} [toolTip] - Tooltip associated with the button.
   * @property {string} [id] - Unique identifier of this button.
   * @property {Boolean} [default] - Whether this button is default button in the footer. Default button is drawn with a visual distinction compared
   * to other buttons.
   * @property {Boolean} [separate] - Whether this button is to be drawn separately.
   * @property {FooterButtonClickCallback} [click] - Callback to handle click event from the button.
   * @property {Boolean} [close] - Whether this button closes the dialog.
   * @property {Boolean} [hidden] - Whether this button should be hidden
   * @property {Boolean} [disabled] - Renders a button in disabled state.
   */

  /**
   * @callback FooterButtonClickCallback
   * @param {object} options
   * @param {*} dialog - The dialog itself.
   * @param {HTMLElement} button - DOM element of the button that is clicked.
   * @param {Object} buttonAttributes - Attributes of the button.
   */

  var SimpleDialog = DialogViewImpl.extend({
    /**
     * @constructs
     * @name SimpleDialog
     * @alias module:SimpleDialog
     * @param {object} options - Constructor options
     * @param {string} options.title - Title of the dialog.
     * @param {Boolean} [options.fullSize] - Whether to show a full page dialog.
     * @param {Boolean} [options.largeSize] - Shows a large dialog.
     * @param {Boolean} [options.midSize] - Shows a medium dialog.
     * @param {Boolean} [options.smallSize] - Shows a small dialog.
     * @param {string} [options.bodyMessage] - A message to be shown at the primary content area.
     * @param {FooterButton[]} [options.buttons] - Buttons to show in the footer if footer is not customized with `footerView` options.
     * `SimpleDialog` automatically adds an additional button to close the dialog.
     * @param {external:Marionette.View} [options.view] - Customize the primary content area with this view instance.
     * @param {external:Marionette.View} [options.headerView] - Customize the dialog's header completely with this view instance.
     * @param {external:Marionette.View} [options.footerView] - Customize the dialog's footer completely with this view instance.
     */
    constructor: function SimpleDialog(options) {
      SimpleDialog.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Shows the dialog after it has been instantiated
   * @returns {any} The dialog instance
   * @instance
   */

  /**
   * @function
   * @name updateButton
   * @description Updates the dialog's footer button state.
   * @param {string} id - Identifier of the button to be updated.
   * @param {object} [attributes] - New button state properties
   * @param {Boolean} [attributes.hidden] - Whether is button is to be hidden.
   * @param {Boolean} [attributes.disabled] - Whether this button should be disabled.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name destroy
   * @description Hide & close the dialog
   * @returns {void}
   * @instance
   */

  return SimpleDialog;
});