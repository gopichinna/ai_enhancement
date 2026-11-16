# ToolItemView Interface

Definition of the ToolItemView interface as required by csui/controls/toolbar/toolbar.view.

## Marionette.View

A ToolItemView has to implement the Marionette.View interface.


## Additional Functions

### makeFocusable()

if defined, the function prepares the item to be accessible via keyboard, for example by setting the 'csui-acc-focusable' style.

### renderTextOnly(saveState)

if defined, render the item as text only. This function is called additionally after render, if the view is rendered in a dropdown or flyout.

saveState: if true save the state later restore.

### restoreRenderState()

Called when the item is unwrapped, i.e. moved from the dropdown back into the toolbar.
Later render() is called on the view.

