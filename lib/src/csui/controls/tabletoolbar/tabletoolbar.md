# TableToolbarView

## Add Item Toolbar

Default toolbar items are added into the add item toolbar dropdown, on 
rendering the page, from addable item's information
(either from v2/app/container call or direct addablenodetypes call). 
The items having inline forms, should send command info,
with signature and group along with inlineforms.

Other module addable types can be added to the dropdown by triggering an event
from tabletoolbar.view

### Examples

```js
// Addable item with command info
getAddableCommandInfo() {
  return {
    signature: 'AddCONWSTemplate',
    group: 'conws'
  }
}
```

### Attributes

* getAddableCommandInfo: indicates the name of the method to be defined in inline forms.
* signature (string): indicates the signature of the menu item to be added.
* group (strung): indicates the group of the module to which the addable item belongs to.

## Extension of title/toolbar views in nodestable view

External modules can use their tabletoolbar extensions to pass their custom 
toolbar/title views to display them in the nodestable. To do this, the extension 
callback function should return the appropriate key along with the corresponding custom view.
The supported keys for toolbarnames are 'navigation', 'filter', 'add', 'left', 'other', 'right'.
The supported key for title view is 'customCaptionView'.

### Examples

```js
//callback function of tabletoolbarview extension from external modules
tableToolbarExtension () {
  return {
    customCaptionView: new CustomTitleView(),
    right: new RightToolbarView()
  }
}
```

### Attributes
* tableToolbarExtension : indicates the callback method of the table toolbar view extension. 
* customCaptionView : indicates the key for the customized title view.
* CustomTitleView : indicates the custom view that overrides the default title view.
* right : indicates the key for the customized right toolbar view.
* RightToolbarView : indicates the custom view that overrides the default right toolbar view.