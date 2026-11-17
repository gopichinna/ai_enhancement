/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert'
], function(CustomModalAlertImpl){
  'use strict';

  /**
   * Shows a modal alert with customized body content.
   *
   * The `options` parameter can contain a property `contentView` that is used as the modal's body. If the `contentView` is not present then
   * in it's all sense it behaves like a regular {@link ./modal.alert|ModalAlert}
   *
   * @see {@link ./modal.alert|ModalAlert} for a list of static methods available to instantiate a modal alert with custom content.
   *
   * @example <caption>To show a ModalAlert with another Marionette.View as content</caption>
   * define([
   *  'nuc/lib/marionette',
   *  'd2/controls/alerts/customizable.content.modal.alert'
   * ], function(Marionette, ModalAlert){
   *  'use strict';
   *
   *  var ContentView = Marionette.LayoutView.extend({
   *    template: false,
   *    className: 'sample-modal-content',
   *    constructor: function ContentView(options) {
   *      options = options || {};
   *      ContentView.__super__.constructor.call(this, options);
   *    },
   *
   *    onRender: function() {
   *      this.$el.text('Hello World!');
   *    }
   *  });
   *
   *  ModalAlert.showInformation(function(result){
   *    console.log(result);
   *  }, '' , 'Greetings', {
   *    buttons: {
   *      showYes: true,
   *      labelYes: 'OK',
   *      showNo: false,
   *      showCancel: false
   *    },
   *    contentView: new ContentView(),
   *    modalClass: 'my-sample-greeting-modal'
   *  });
   * });
   *
   * @module {d2/sdk/controls/customizable.content.modal.alert} d2/sdk/controls/"customizable.content.modal.alert"
   * @name CustomizableContentModalAlert
   * @extends {external:ModalAlert}
   */

  /**
   * @external ModalAlert
   * @see ./modal.alert
   */

  function showModal(options) {
    var alert = new CustomContentModalAlert(options);
    return alert.show();
  }

  var CustomContentModalAlert = CustomModalAlertImpl.extend({
    constructor: function CustomContentModalAlert(options) {
      CustomContentModalAlert.__super__.constructor.call(this, options);
    }
  },{
    _show: showModal
  });

  return CustomContentModalAlert;
});