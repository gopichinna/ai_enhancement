# Checkbox Control

**Module: csui/controls/checkbox/checkbox.view**

The checkbox.view.js implements a marionette.js view that renders a checkbox throught the otc-checkbox webcomponent.

The checkbox.view creates a model in its constructor to store view state.

The attribute which stores the checked state is *checked* and can have these states:
* 'true'
* 'false'
* 'mixed'

## CheckboxView(options)

Creates a new instance.

#### Options

disabled
: initial disabled state. Default is false.

checked
: initial checked state. Default is 'false'.

ariaLabel
: aria-label attribute set on the HTML markup of the control.

infoMessage
: additional message providing more information.

title
: title attribute set on the HTML markup of the control. Default is ''.

model
: model to use as view model.


## Public Methods

The checkbox view has a backbone model for the state and aria-label text and is accessible via
the view.

Additionally there are the following methods:

setDisabled(bool: disabled)
: render the checkbox as disabled and don't fire the clicked event

setChecked(string: checked)
: set the checked attribute in the view model and render the checkbox depending on its new
checked value. See above for valid checked values.

## Events

clicked
: Triggers when the checkbox has been clicked or activated by space or enter key when in focus

Note that it is possible to use the views model to listen for additional backbone model events.
