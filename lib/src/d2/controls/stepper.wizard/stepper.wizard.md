# StepperWizard

**Module: d2/controls/stepper.wizard/stepper.wizard.view**

Shows a workflow dialog sliding-in from the right edge of the screen. Representation for each of the steps of workflow &
navigation among them, are created and configured externally.

## Class Methods

### StepperWizardView([options](#options))

Creates a new instance with supplied configuration. The wizard does not appear on the screen yet.

#### options

##### steps: [[stepConfiguration](#stepconfiguration), ...]
An array of configuration options to define all of the steps in workflow. Each item in this array is configuration for a single step in the workflow.

##### showPageLeavingWarning: Boolean
Control whether or not to show warning when a wizard is open and user tries to reload app or relocate to some other site url.

defaults to `true`. 

##### suppressHeader: Boolean
Control whether or not to show the wizard header.

defaults to `false`.

##### suppressFooter: Boolean
Control whether or not to show the wizard footer.

defaults to `false`.

##### usePreviousStepTitleAsBackButtonTooltip: Boolean
Whether or not to use title of previous step as the back button's tooltip. Works only if the back button has not been configured with any custom tooltip.

defaults to `true`.

##### data: Object
An unmanaged JS Object that is shared among all the views that constitute steps of the workflow. A reference to the wizard instance is injected in this object as 'wizard'.

##### className: String
Name of CSS class to be applied to the DOM element for the wizard. Used for applying custom styles to an instance.

#### stepConfiguration
- *(mandatory)* **id**: String
  - A unique identifier for the step.
- *(mandatory)* **viewClass**: Marionette.View 
  - View definition(not an instance, the class itself) which will be used to create presentation for the corresponding step.
- *(optional)* **nextStepId**: String | Function
  - Id of the step, which the wizard should show next. Defaults to 'id' of the next step in config, if any.
- *(optional)* **previousStepId**: String | Function
  - Id of the step, which the wizard should go back to from present step. Defaults to 'id' of the previous step in config, if any.
- *(optional)* **title**: String | Function
  - Used to set title for the step.
- *(optional)* **subTitle**: String | Function
  - Used to set sub-title for the step.
- *(optional)* **buttons**: [[buttonConfiguration](#buttonconfiguration), ...]
  - Configuration to control behavior of default and/or any additional button for this step. Three customizable buttons are automatically created by the wizard to facilitate back & forth navigation between steps and cancellation. Any other buttons configured here will be created upon activation of corresponding step.
- *(optional)* **onCancel**: Function
  - Callback to decide whether or not to close a wizard upon receiving CANCEL signal from either close,cancel button press or cancel() API call.
    - It can return a `JQuery Promise` object to control the decision. The wizard will close or discard the CANCEL signal depending on whether the `Promise` is resolved or rejected.
    - If anything else is returned from the Function or the callback is not defined at all, the default 'CANCEL' signal handler will close the wizard.
- *(optional)* **viewOptions**: Object
  - An unmanaged JS Object that will be passed only onto the view's constructor for this step.
- *(optional)* **transient**: Boolean
  - Indicates whether or not this step is to be considered a transient one. A transient step is never kept in step navigation history. In effect, with default navigation setup, clicking back on the step next to a transient step always brings the user back to the step before the transient one.
  - Defautls to `false`

**Note:** `nextStepId, previousStepId, title, subTitle` can be alternatively defined as `Function` returning String value. If done so, the `Function` will be executed in context of the step's view each time before the step becomes active.

#### buttonConfiguration
- *(mandatory)* **id**: String
  - Identifier for the button. Buttons with `id='next'` & `id='previous'` & `id='cancel'` are already added to the set by the wizard.
- *(optional)* **className**: String
  - Name of CSS class to be applied to the button.
- *(optional)* **align**: String ('begin' | 'end')
  - Alignment of the button. Defaults to 'end'. 'previous', 'next', 'cancel' button comes with pre-defined but customizable alignment.
  - Buttons aligned on the same side will be placed according to their order of definition.
- *(optional)* **label**: String | Function
  - Label for the button.
- *(optional)* **ariaLabel**: String | Function
  - Accessible title for the button. Defaults to same as `label`, if omitted or kept blank.
- *(optional)* **toolTip**: String | Function
  - Tooltip for the button. 
- *(optional)* **hidden**: Boolean | Function
  - Whether this button should be hidden upon step activation or not. Defaults to `false`.
- *(optional)* **disabled**: Boolean | Function
  - Whether this button should be disabled upon step activation or not. Defaults to `false`. The 'hidden' attribute takes precedence over this 'disabled' attribute.
- *(optional)* **clickHandler**: Function
  - Default click handler for this button. This handler gets executed in context of the step's view.

**Note:** Default clickHandlers for button with `id='previous'`, `id='next'` & `id='cancel'` are already defined by the wizard to control back & forth navigation and cancellation. Overriding those handlers may be desired for an alternative behavior for a step.

## Instance Methods

#### show(stepId)
Bring the wizard on-screen.
- *(optional)* **stepId**: String
  - Id of the step from which to start the workflow. 
If omitted, the workflow starts from the first step as provided in 'steps' configuration option.

#### close([relayArguments, ...])
Close and immediately destroy the wizard. All arguments that this method id invoked with, will be passed as event parameters for [wizard:closed](#wizard-closed)

#### cancel([relayArguments, ...])
Try closing the wizard with a 'CANCEL' signal. If the signal is not interfered with, it eventually causes the wizard to close and destroy itself.  All arguments that this method id invoked with, will be passed as event parameters for [wizard:closed](#wizard-closed)

#### minimize(promise, notificationTooltip)
Hide the wizard from screen without destroying it. Returns `true|false` to indicate if it is actually minimized or not.
- *(optional)* **promise**: `Jquery Promise`
  - Whether or not the wizard needs to be minimized with a notification on the toolbar.
  - Usually used when wizard is performing long-running background task on some step and it doesn't want to keep the end user blocked on the modal wizard.
  - Resolve or reject the promise to change status of the notification icon.
- *(optional)* **notificationTooltip**: String
  - What should be the tooltip of the notification icon if wizard is minimized with a notification.
  
**Note:** Only one wizard can be minimized with a notification, every other instance that tries to do the same at the same time will fail to minimize itself.

#### restore()
Restore a minimized hidden wizard and bring it back on screen.

#### prevStep()
Go to previous step as determined by 'steps' configuration.

#### nextStep()
Go to next step as determined by 'steps' configuration.

#### gotoStep(stepId, animateFromEnd)
Go to specific step with given animation direction.
- *(mandatory)* **stepId**: String
  - Id of the step to go to.
- *(optional)* **animateFromEnd**: Boolean
  - Whether or not the next step to be sweeped-in from end edge of the wizard. Defaults to `true`. If `false`, the step is sweeped-in from beginning of the wizard.
  
#### refreshHeader()
Refresh header to show updated data (title & subTitle) for the step if they were changed.

#### refreshFooter([buttonId, ...])
Refresh footer to show updated button states.
- *(optional)* **buttonId**: String
  - Id of the button to refresh.
  - If no parameter is passed all button on the active step are updated.
   
#### getData()
Returns a reference to the [data](#data-object) shared accross steps.

#### getId()
Returns a specifier to uniquely identify a wizard instance. Can be used later for inbound radio channel events.

#### blockActions()
Creates an indeterminate progress view over the wizard to block user interaction. The blocker remains active until **unblockActions()** is called.

#### unblockActions()
Withdraws an active user interaction blocker from over the wizard. 

## Inbound Events

#### wizard:state:restore
Attempts restoring an already minimized wizard. This event can be triggered on either the wizard instance or the `'stepper_wizard'` radio channel. If triggered on the channel, first event argument must be ID of a wizard instance.

#### wizard:close
Attempts closing and destroying the wizard. This event can be triggered on either the wizard instance or the `'stepper_wizard'` radio channel. If triggered on the channel, first event argument must be ID of a wizard instance.
```` javascript
var wizard = new StepperWizard({...}).show();
wizard.minimize();

var channel = Backbone.Wreqr.radio.channel('stepper_wizard').vent;
channel.trigger('wizard:state:restore', wizard.getId()); //restore the wizard

...

channel.trigger('wizard:close', wizard.getId()); //close the wizard
````

## Outbound Events

#### wizard:shown
Triggered on the wizard instance after it appears on screen.

#### wizard:minimized
Triggered on the wizard instance & radio channel `'stepper_wizard'` after it is minimized.
- Parameters (wizardId)
  - wizardId: String, Id of the wizard minimized, only available for listeners on the radio channel.

#### wizard:restored
Triggered on the wizard instance & radio channel `'stepper_wizard'` after it is restored from minimized state.
- Parameters (wizardId)
  - wizardId: String, Id of the wizard restored, only available for listeners on the radio channel.

#### wizard:closed
Triggered on the wizard instance & radio channel `'stepper_wizard'`, after it is closed.
- Parameters (isCancelled, [wizardId], [relayParam, ...])
  - isCancelled: Boolean, Whether or not the wizard is closing due to a CANCEL signal.
  - wizardId: String, Id of the wizard getting destroyed, only available for listeners on radio channel.
  - relayParam: Unspecified, Any additional parameters that may have been passed to [close()](#close-relayarguments-) or [cancel()](#cancel-relayarguments-) API calls.

#### wizard:forceclose
Triggered on the wizard instance just before it is about to be force closed due to unplanned page navigation e.g. reload.

#### step:before:active
Triggered on the StepView when the correspoding step is about to appear on screen.

#### dom:refresh
Triggered on the StepView when it appears on screen.

#### step:active
Triggered on the StepView after the step has become active and DOM is updated with corresponding view.

#### step:before:inactive
Triggered on the StepView when it is about to disappear from screen.

#### step:inactive
Triggered on the StepView after the view has been removed from DOM.

## Examples

Here are couple of examples to demonstrate the API of StepperWizard

#### Minimal configuration for 2-step wizard
````javascript
define([
  'csui/lib/backbone',
  'csui/lib/marionette',
  'd2/controls/stepper.wizard/stepper.wizard.view'
  ],function(Backbone, Marionette, StepperWizard){
  
  new StepperWizard({
    steps: [
      {
        id: 'first',
        viewClass: Marionette.View.extend({
          template: '<div>First Step View</div>'
        }),
        title: 'First Step Title',
      },
      {
        id: 'last',
        viewClass: Marionette.View.extend({
          template: '<div>Last Step View</div>'
        }),
        title: 'Last Step Title'
      }
    ]
  }).show();
});
````

#### Sample 3-Step wizard
````javascript
define([
  'csui/lib/backbone',
  'csui/lib/marionette',
  'd2/controls/stepper.wizard/stepper.wizard.view'
  ],function(Backbone, Marionette, StepperWizard){
  
  new StepperWizard({
    steps: [
      {
        id: 'first',
        viewClass: Marionette.View.extend({
          template: '<div>First Step View</div>'
        }),
        nextStepId: 'second',
        title: 'First Step Title',
        subTitle: 'First Step Subtitle'
      },
      {
        id: 'second',
        viewClass: Marionette.View.extend({
          template: '<div>Second Step View</div>'
        }),
        buttons: [
          {
            id: 'additional', //An extra button for second step
            label: 'Additional',
            align: 'begin',
            clickHandler: function(){
              console.log('additional button clicked at step 2');
            }
          }
        ],
        nextStepId: 'third',
        previousStepId: 'first',
        title: 'Second Step Title'
      },{
        id: 'third',
        viewClass: Marionette.View.extend({
          template: '<div>Third Step View</div>',
          onStepActive: function(){
            //Refresh all footer buttons
            this.options.wizard.refreshFooter();
          },
          isValid: function() {
            //some custom logic to determine the return value here will control 'disabled' state of the 'next' button
            return true;
          }
        }),
        buttons: [
          {
            id: 'next',
            label: 'Done',
            disabled: function() {
              // Enable/Disable the 'Done' button based on validation state after the step has become active
              return !this.isValid();
            }
          }
        ],
        previousStepId: 'second',
        title: 'Third step title',
        subTitle: 'This is the last step'
      }
    ],
    data: { //This data will be shared accross all step views.
      model: new Backbone.Model({})
    }
  }).show();
});
````