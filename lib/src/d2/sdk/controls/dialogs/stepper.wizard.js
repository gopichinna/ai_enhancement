/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/controls/stepper.wizard/stepper.wizard.view'
], function(StepperWizardViewImpl){
  'use strict';

  /**
   * Create a modal wizard that navigates through a configured set of steps to achieve some arbitrary functionality.
   * Steps can be navigated in a simple-sequential manner or on-demand hopping manner.
   *
   * @example <caption>Minimal configuration for a two-step wizard</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/dialogs/stepper.wizard'
   *  ],function(Backbone, Marionette, StepperWizard){
   *    'use strict';
   *
   *    new StepperWizard({
   *      steps: [
   *        {
   *          id: 'first',
   *          viewClass: Marionette.View.extend({
   *            template: '<div>First Step View</div>'
   *          }),
   *          title: 'First Step Title',
   *        },
   *        {
   *          id: 'last',
   *          viewClass: Marionette.View.extend({
   *            template: '<div>Last Step View</div>'
   *          }),
   *          title: 'Last Step Title'
   *        }
   *     ]
   *   }).show();
   * });
   *
   * @example <caption>Sample 3-step wizard</caption>
   * define([
   *  'nuc/lib/backbone',
   *  'nuc/lib/marionette',
   *  'd2/sdk/controls/dialogs/stepper.wizard'
   * ],function(Backbone, Marionette, StepperWizard){
   *  'use strict';
   *
   *  new StepperWizard({
   *    steps: [
   *      {
   *        id: 'first',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>First Step View</div>'
   *        }),
   *        nextStepId: 'second',
   *        title: 'First Step Title',
   *        subTitle: 'First Step Subtitle'
   *      },
   *      {
   *        id: 'second',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>Second Step View</div>'
   *        }),
   *        buttons: [
   *          {
   *            id: 'additional', //An extra button for second step
   *            label: 'Additional',
   *            align: 'begin',
   *            clickHandler: function(){
   *              console.log('additional button clicked at step 2');
   *            }
   *          }
   *        ],
   *        nextStepId: 'third',
   *        previousStepId: 'first',
   *        title: 'Second Step Title'
   *      },
   *      {
   *        id: 'third',
   *        viewClass: Marionette.View.extend({
   *          template: '<div>Third Step View</div>',
   *          onStepActive: function(){
   *            //Refresh all footer buttons
   *            this.options.wizard.refreshFooter();
   *          },
   *          isValid: function() {
   *            //some custom logic to determine the return value here will control 'disabled' state of the 'next' button
   *            return true;
   *          }
   *        }),
   *        buttons: [
   *          {
   *            id: 'next',
   *            label: 'Done',
   *            disabled: function() {
   *              // Enable/Disable the 'Done' button based on validation state after the step has become active
   *              return !this.isValid(); //'this' refers to the view instance of this step
   *            }
   *          }
   *        ],
   *        previousStepId: 'second',
   *        title: 'Third step title',
   *        subTitle: 'This is the last step'
   *      }
   *    ],
   *    data: { //This data will be shared across all step views.
   *      model: new Backbone.Model({})
   *    }
   *  }).show();
   * });
   *
   * @module {d2/sdk/controls/dialogs/stepper.wizard} d2/sdk/controls/dialogs/"stepper.wizard"
   * @name StepperWizard
   * @extends {external:Marionette.View}
   * @fires module:StepperWizard#wizard:shown
   * @fires module:StepperWizard#wizard:minimized
   * @fires module:StepperWizard#wizard:restored
   * @fires module:StepperWizard#wizard:closed
   * @fires module:StepperWizard#wizard:forceclose
   * @fires module:StepperWizard#step:before:active
   * @fires module:StepperWizard#dom:refresh
   * @fires module:StepperWizard#step:active
   * @fires module:StepperWizard#step:before:inactive
   * @fires module:StepperWizard#step:inactive
   */

  /**
   * @external "Marionette.View"
   * @see https://marionettejs.com/docs/v2.4.7/marionette.view.html
   */

  /**
   * Triggered on the wizard instance after it appears on screen
   * @event module:StepperWizard#wizard:shown
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is minimized
   * @event module:StepperWizard#wizard:minimized
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is restored from minimized state.
   * @event module:StepperWizard#wizard:restored
   * @type {string}
   */

  /**
   * Triggered on the wizard instance after it is closed.
   * @event module:StepperWizard#wizard:closed
   * @type {string}
   * @param {Boolean} isCancel - Whether the wizard was closed or cancelled.
   * @param {...any} [args] - Any additional parameters passed to `cancel()` or `close()`
   */

  /**
   * Triggered on the wizard instance just before it is about to be force closed due to unplanned page navigation e.g. reload
   * @event module:StepperWizard#wizard:forceclose
   * @type {string}
   */

  /**
   * Triggered on StepView instance when the corresponding step is about to appear on screen.
   * @event module:StepperWizard#step:before:active
   * @type {string}
   */

  /**
   * Triggered on the StepView when it appears on screen.
   * @event module:StepperWizard#dom:refresh
   * @type {string}
   */

  /**
   * Triggered on the StepView after the step has become active and DOM is updated with corresponding view.
   * @event module:StepperWizard#step:active
   * @type {string}
   */

  /**
   * Triggered on the StepView when it is about to disappear from screen.
   * @event module:StepperWizard#step:before:inactive
   * @type {string}
   */

  /**
   * Triggered on the StepView after the view has been removed from DOM.
   * @event module:StepperWizard#step:inactive
   * @type {string}
   */

  /**
   * Configuration for each step
   * @typedef {object} StepConfig
   * @property {string} id - A unique identifier for the step
   * @property {external:Marionette.View} viewClass - View definition(not an instance, the class itself) which will be used to create presentation for the corresponding step.
   * @property {string|function} [nextStepId] - Id of the step, which the wizard should show next. Defaults to 'id' of the next step in config, if any.
   * @property {string|function} [previousStepId] - Id of the step, which the wizard should go back to from present step. Defaults to 'id' of the previous step in config, if any.
   * @property {string|function} [title] - Used to set title for the step
   * @property {string|function} [subTitle] - Used to set sub-title for the step
   * @property {ButtonConfig[]} [buttons] - Configuration to control behavior of default and/or any additional button for this step. Three customizable buttons are automatically created by the wizard to facilitate back & forth navigation between steps and cancellation.
   * Any other buttons configured here will be created upon activation of corresponding step
   * @property {StepCancellationCallback} [onCancel] - Callback to decide whether or not to close a wizard upon receiving CANCEL signal from either `close`,`cancel` button press or `cancel()` API call.
   * @property {object} [viewOptions] - An unmanaged JS Object that will be passed only onto the view's constructor for this step
   * @property {Boolean} [transient=false] - Indicates whether or not this step is to be considered a transient one. A transient step is never kept in step navigation history. In effect, with default navigation setup, clicking back on the step next to a transient step always brings the user back to the step before the transient one
   *
   */

  /**
   * Configuration for a button
   * @typedef {object} ButtonConfig
   * @property {string} id - Identifier for the button. Buttons with `id='next'` & `id='previous'` & `id='cancel'` are already added to the set by the wizard.
   * @property {string} [className] - Name of CSS class to be applied to the button
   * @property {string} [align=end] - Alignment of the button. 'previous', 'next', 'cancel' buttons come with pre-defined but customizable alignment.
   * Buttons aligned on the same side will be placed according to their order of definition
   * @property {string|function} [label] - Label for the button
   * @property {string|function} [ariaLabel] - Accessible title for the button. Defaults to same as `label`, if omitted or kept blank
   * @property {string|function} [toolTip] - Tooltip for the button
   * @property {Boolean|function} [hidden=false] - Whether this button should be hidden upon step activation or not
   * @property {Boolean|function} [disabled=false] - Whether this button should be disabled upon step activation or not. The 'hidden' attribute takes precedence over this 'disabled' attribute
   * @property {ButtonClickHandler} [clickHandler] - Default click handler for this button. This handler gets executed in context of the step's view
   * @note Default `clickHandler` for button with id='previous', id='next' & id='cancel' are already defined by the wizard to control back & forth navigation and cancellation. Overriding those handlers may be desired for an alternative behavior for a step
   *
   */

  /**
   * @callback StepCancellationCallback
   * @returns {jQuery.Promise|void} Return a `JQuery Promise` object to control the decision. The wizard will close or discard the CANCEL signal depending on whether the `Promise` is resolved or rejected.
   * If anything else is returned from the Function or the callback is not defined at all, the default 'CANCEL' signal handler will close the wizard.
   * @note This callback is executed in the context of view instance associated with the current step.
   */

  /**
   * @callback ButtonClickHandler
   * @note This callback is executed in the context of view instance associated with the current step.
   * @returns {void}
   */

  var StepperWizardView = StepperWizardViewImpl.extend({

    /**
     * @constructs
     * @name StepperWizard
     * @alias module:StepperWizard
     * @param {object} options - Constructor options
     * @param {StepConfig[]} options.steps - Step configuration of the wizard. Each step is represented with a different screen and a transition animation
     * is played when the wizard moves from one step to another due to user interaction.
     * @param {Boolean} [options.showPageLeavingWarning=true] - Whether to show a page blocker when user tries to close the wizard.
     * @param {Boolean} [options.suppressHeader=false] - Indicate whether to hide the header.
     * @param {Boolean} [options.suppressFooter=false] - Indicate whether to hide the footer.
     * @param {Boolean} [options.usePreviousStepTitleAsBackButtonTooltip=true] - Whether to show previous step's title as tooltip for `Back` button shown on current step.
     * @param {object} [options.data=undefined] - Any arbitrary piece of data that is shared among all the steps i.e views representing the steps.
     * @param {string} [options.className=undefined] - An additional CSS class name to be used along with its own styling classes. Useful, when specific styling
     * classes are required to be written for step views or customize overall appearance of the wizard.
     */
    constructor: function(options) {
      options = options || {};
      StepperWizardView.__super__.constructor.call(this, options);
    }
  });

  /**
   * @function
   * @name show
   * @description Show the wizard after construction. The wizard becomes visible on screen only after this method is called.
   * @note By default the wizard shows up on the first step as specified in constructor options.
   * @param {string} [stepId] - Instead of starting from the first step, start from this particular step. If a matching step is not found the wizard
   * disregards this parameter and starts from the first step.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name close
   * @description Close and finally destroy the wizard.
   * @param {...any} [arg] - This method could be invoked with any number of parameters. All those parameters will be passed as event parameters for "wizard:closed"
   * event.
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name cancel
   * @description Try closing the wizard with a CANCEL signal. If the signal is not interfered with, it eventually causes the wizard to close and destroy itself.
   * @param {...any} [arg] - All arguments that this method is invoked with, will be passed as event parameters for "wizard:closed"
   * @returns {void}
   * @instance
   */

  /**
   * @function
   * @name minimize
   * @description Hide the wizard from screen without destroying it.
   * @note Only one wizard can be minimized with a notification, every other instance that tries to do the same at the same time will fail to minimize itself
   * @param {jQuery.Promise} [promise] - Whether or not the wizard needs to be minimized with a notification on the toolbar.
   * Usually used when wizard is performing long-running background task on some step and it doesn't want to keep the end user blocked on the modal wizard.
   * Resolve or reject the promise to change status of the notification icon.
   * @param {string} [notificationTooltip] - What should be the tooltip of the notification icon if wizard is minimized with a notification
   * @returns {Boolean} Returns `true` to indicate that the wizard is actually minimized. otherwise returns `false`.
   * @instance
   */

  /**
   * @function
   * @name restore
   * @description Restore a minimized hidden wizard and bring it back on screen.
   * @instance
   */

  /**
   * @function
   * @name prevStep
   * @description Go to previous step as determined by 'steps' configuration of the wizard
   * @instance
   */

  /**
   * @function
   * @name nextStep
   * @description Go to next step as determined by 'steps' configuration of the wizard.
   * @instance
   */

  /**
   * @function
   * @name gotoStep
   * @description Go to specific step with given animation direction. Allows random jump from one step to another.
   * @param {string} stepId - Id of the step to go to
   * @param {Boolean} [animateFromEnd=true] - Whether or not the next step to be sweeped-in from end edge of the wizard.
   * If `false`, the step is sweeped-in from beginning of the wizard.
   * @instance
   */

  /**
   * @function
   * @name refreshHeader
   * @description Refresh header to show updated data (title & subTitle) for the step if they were changed
   * @instance
   */

  /**
   * @function
   * @name refreshFooter
   * @description Refresh footer to show updated button states
   * @note If the method is called without any parameter then all buttons of the active step are refreshed.
   * @param {...string} [buttonId] - Id of the button to refresh. Multiple id could be passed as parameters.
   * @instance
   */

  /**
   * @function
   * @name getData
   * @description Returns a reference to the data shared across steps
   * @returns {*} The data that was set as part of constructor options.
   * @instance
   */

  /**
   * @function
   * @name getId
   * @description Returns a specifier to uniquely identify a wizard instance. Can be used later for inbound radio channel events
   * @returns {string} Unique identifier of this wizard instance
   * @instance
   */

  /**
   * @function
   * @name blockActions
   * @description Creates an indeterminate progress view over the wizard to block user interaction. The blocker remains active until `unblockActions()` is called.
   * @instance
   */

  /**
   * @function
   * @name unblockActions
   * @description Withdraws an active user interaction blocker from over the wizard
   * @instance
   */

  return StepperWizardView;
});