# Toolbar Items (widgets/nodestable/toolbaritems)

  Has the definition of toolbars used in the nodestable.view.


### Example how to add additional toolbar items from code

 The following code extract is an example on how a module could add additional toolbar items into
 the "Add"-Toolbar divided from the existing items by using a unique group identifier for those
 items.

```js
    define(["module",
      "csui/lib/jquery",
      "csui/lib/underscore",
      ...
      'csui/widgets/nodestable/toolbaritems',
      ...
      ], function (module, $, _,
        ...
        toolbarItems,	// instance of toolbarItems for 4 toolbars: filterToolbar, addToolbar, otherToolbar, rightToolbar
        ...
          ) {
        
        ...
    
        // add an additional item to the add toolbar;
        // register the following code on the 'reset'
        // event of the addable node type collection
        
        var addToolbarItemFactory = toolbarItems.addToolbar;
    
        // Notes:
        // For a toolbar item to be displayed the associated command must exist and
        // the enabled function of that command must return true.
        // When adding additional items to the toolbar factory it will be sorted into
        // the specified group. Not existing groups are added at the end.
        // Groups are separated by a divider.
        
        var toolItem = new ToolItemModel({
              signature: 'AddConnectedWorkspace',	// must match with a command
              name: "Sales Workspace",
              type: 0,
              group: 'conws'
            });
          addToolbarItemFactory.addItem(toolItem);
    
        ...
    });
```

## Toolbar options

### suppressGroupSeparators

 maintains a list of group names. If a group's name is in this list,
 a separator will not be added between that group and the one before it.

 Example (ToolItemsFactory is for csui/controls/toolbar/toolitems.factory):

```js
 exampleToolbar: new ToolItemsFactory({
         group1: [
             {signature: "ExampleSignature",
                 ...other attributes...
             },
             ...other toolbar items...
         ],
         group2: [
             ...
         ],
         group3: [
             ...
         ]
     },
     {
         ...other options...,
         suppressGroupSeparators: ['group3'],
         ...other options...
     })
```

 The menu will then look like the following:

 Group 1 Menu Item 1
 Group 1 Menu Item 2
 ...
 Separator
 Group 2 Menu Item 1
 Group 2 Menu Item 2
 ...
 Group 3 Menu Item 1
 Group 3 Menu Item 2
 ...

 Any number of group names can be listed in suppressGroupSeparators. This example just shows the case
 that 1 group is listed. suppressGroupSeparators can be useful when some menu items do not show as
 rows in the menu. For example, in the mobile app's bottom-up action menu, the user can open the
 Properties page of an item by tapping an icon in the menu header. Though this action is listed,
 it does not show as a row in the menu, and so the group that the action is in should be listed
 in suppressGroupSeparators. For instance, if the action to open the Properties page were listed
 in group3 in the above example, and the developer did not list group3 in suppressGroupSeparators,
 an extra separator would show at the bottom of the menu.

### maxItemsShown

specifies the maximum number of items shown in the toolbar directly.
If there are more items, then they are wrapped into a three-dot-menu.
Only wrappable items are wrapped into the three-dot-menu.

A wrappable toolitem is an item, which meets all conditions that the toolbar will
wrap it into a three-dot-menu, if the number of items displayed directly in the
toolbar would exceed maxItemsShown.

Set maxItemsShown to the desired number.
Setting maxItemsShown to 0 forces the toolbar to display all items in a dropdown, except the unwrappable items.
Leave it undefined or set it to undefined to force the toolbar to never wrap.


If the toolbar is displayed by csui/controls/toobar/toolbar.view:

If the instantiated toolitem view is an instance of csui/controls/toolbar/toolitem.view
or csui/controls/toolbar/flyout.toolitem.view then it is handled as wrappable item,
otherwise it is handled as unwrappable item.

To decide, whether a three-dot-menu is needed, the toolbar counts the
wrappable items and if the resulting number exceeds maxItemsShown,
then all further wrappable items are wrapped into the three-dot-menu.
All other items stay directly in the toolbar. This also means, that if
there are unwrappable items and their count plus the number of wrappable items
is greater than maxItemsShown, then there are more items displayed directly
in the toolbar than specified by maxItemsShown.

## Toolitem options

### signature

The signature of the associated command

### name

specifies the name of the toolitem, if no icon is given or the item is wrapped into a three-dot-menu.

### customView

true: this tool item has a custom view specified in viewClass

false or unset: the toolitem is displayed as standard toolitem view and is wrappable.

when set to a instance of Backbone.View: this view is used as toolitem view.

### className

css class name added to the dom element of the tool item view.

### viewClass

the class of a custom toolitem view. when given and customView is true,
then a csui/controls/toolbar/toolitem.custom.view is used as toolitem and
the given view class is rendered embedded there in a custom view region.
Such a toolitem is not wrapped into a dropdown.

## Developing a toolitem

Assuming your csui extension is 'smartsample', you have to follow all the steps described in this chapter.

### 1 Create a toolitem

To create a toolitem you have to create an extension for csui/widgets/nodestable/toolbaritems.

Declare you toolitems as shown below.
Note that a wrappable toolitem needs a name.

### isOTWC

Boolean flag to enable OTWC adoption and JATO theme icons. Below properties will be required.

```js
{
  isOTWC : true,
  iconsName: "... OT icon name ...",
  iconsSVG: "... JATO icon SVG ..."
}
```
Please note that for 'addToolbar' the properties are 'dropDownIconName' and 'dropDownIconSVG'.

```js
define([
  'smartsample/controls/toolitems/custom.toolitem.view',
  'smartsample/controls/toolitems/unwrappable.toolitem.view',
  'smartsample/controls/toolitems/wrappable.toolitem.view'
], function (
  SmartSampleToolItemCustomView,
  SmartSampleUnwrappableToolItemView,
  SmartSampleWrappableToolItemView) {
  var toolbarItems = {
    rightToolbar: [
      {
        // declaring a wrappable standard toolitem
        signature: "SmartSampleSignature1",
        name: "... name of your toolitem 1 ...",
        icon: "... your smart ui icon ...",
        group: "main",
        className: ".. css class for your styling ..."
      },
      {
        // declaring an unwrappable custom toolitem view embedded in a csui/controls/toolbar/toolitem.custom.view
        signature: "SmartSampleSignature2",
        name: "... name of your toolitem 2 ...",
        iconName: "... your smart ui icon v2 ...",
        group: "main",
        className: ".. css class for your styling ...",
        viewClass: SmartSampleToolItemCustomView,
        customView: true
      },
      {
        // declaring an unwrappable toolitem view.
        signature: "SmartSampleSignature3",
        name: "... name of your toolitem 3 ...",
        iconName: "... your smart ui icon v2 ...",
        group: "main",
        className: ".. css class for your styling ...",
        customView: SmartSampleUnwrappableToolItemView
      }
      {
        // declaring a wrappable toolitem view.
        signature: "SmartSampleSignature4",
        name: "... name of your toolitem 4 ...",
        iconName: "... your smart ui icon v2 ...",
        group: "main",
        className: ".. css class for your styling ...",
        customView: SmartSampleWrappableToolItemView
      }
    ]
  };
  return toolbarItems;
});
```

### 2 Implement your toolitem view classes

#### SmartSampleToolItemCustomView

```js
define([
  "csui/lib/marionette",
  ...

], function (
  Marionette,
  ...
) {
  "use strict";

  var SmartSampleToolItemCustomView = Marionette.View.extend({
    // Custom views embedded in csui/controls/toolbar/toolitem.custom.view can be any Backbone.view
    // They are not wrapped into a dropdown.

    constructor: function(options) {
      // note that the constructor gets a node model passed in options.model, if available.
      Marionette.View.prototype.constructor.apply(this, arguments);
    }

    ...

  });

  return SmartSampleToolItemCustomView;
});
```


#### SmartSampleUnwrappableToolItemView

```js
define([
  "csui/lib/marionette",
  ...

], function (
  Marionette,
  ...
) {
  "use strict";

  var SmartSampleUnwrappableToolItemView = Marionette.View.extend({
    // Extending from somewhere else than ToolItemView makes the item unwrappable.

    constructor: function(options) {
      // note that the constructor gets a toolitem model passed in options.model.
      Marionette.View.prototype.constructor.apply(this, arguments);
    }

    ...

  });

  return SmartSampleUnwrappableToolItemView;
});
```

#### SmartSampleWrappableToolItemView

Implement the toolitem view class according csui/controls/toolbar/toolitem.view.md.

```js
define([
  "csui/controls/toolbar/toolitem.view",
  ...

], function (
  ToolItemView,
  ...
) {
  "use strict";

  var SmartSampleWrappableToolItemView = ToolItemView.extend({
    // Extending ToolItemView makes the item wrappable

    constructor: function(options) {
      // note that the constructor gets a toolitem model passed in options.model.
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    renderTextOnly: function () {
      ... called in case a toolitem is wrapped into a three-dot-menu
      ... render toolitem with text only
      ... override this function only if standard does not fit your needs
    },

    render: function () {
      ... render toolitem completely with icon and text
      ... override this function only if standard does not fit your needs
    },

    ...

});

  return SmartSampleWrappableToolItemView;
});
```

### 3 Implement your command


Depending on the toolbar configurations the toolitem triggering the command was rendered
in the toolbar directly or it was be wrapped into a dropdown menu, which was opened through
a three-dot-button. It can even be rendered inside a flyout.

The command attached to the toolitem must handle all the situations, especially if the command
wants to display a dialog and use the toolitem view as anchor element to position the dialog.

If the toolitem view was rendered in the toolbar, then the dialog can be placed there.
But if the toolitem view was rendered in a dropdown or flyout the dropdown or flyout is
already closed and the toolitem view is not visible anymore.

The sitation can be detected by checking the visibility of status.toolItemView.$el.
A reasonable substitute if the toolitem is in a dropdown is to use the three-dot-icon
as anchor:


```js
define(["require", 'csui/lib/jquery'
  ...
], function (require, $
  ...
) {
  'use strict';

  var SmartSampleCommand = NodeCommand.extend({

    ...

    defaults: {
      signature: "SmartSampleSignature1" or ... or "SmartSampleSignature4"
      ...
    },

    enabled: function (status) {

      ... implement the enabled function only if your action is not an action sent by the server
      ... return true to enable the toolitem, false otherwise

    },

    execute: function (status, options) {

      var deferred  = $.Deferred();

      ...

      require(['smartsample/dialogs/customdialog'],
          function (SmartsampleCustomDialog) {


            var anchorElement = status.toolItemView.$el;
            if (status.toolItemView.$el.is(':visible')) {
              // command was triggered from a toolitem directly in the toolbar
              // open dialog near the toolitem view
            } else {
              // command was triggered from a toolitem in the dropdown,
              // which is always closed at that point in time.
              // open a global modal dialog or what UX defines for you.
            }

            ...

            // after command is executed, reject or resolve the promise.

          return deferred.promise();
    }
  });

  return SmartSampleCommand;

});
```

### 4 Test your toolitem in the debug environment

To test your toolitem in the debug environment, do the following:

When testing your toolitem you must test the situation where your item is rendered directly in the toolbar
as well as the situation, when it is wrapped into the three-dot-menu.
To achieve this, you must enforce a situation, where your toolitem is wrapped into the three-dot-menu.

You can achieve this for testing by enforcing the toolbar that you are extending to wrap all items into
the three-dot-menu as follows:

In your debugging environment go to the corresponding toolitem specification, where maxItemsShown is defined
and set this setting to 0 to enforce the toolbar to wrap all items into the three-dot-menu.
As in this example we defined a toolitem for the "rightToolbar" go to csui/widgets/nodestable/toolbaritems.js.
In the definition of the rightToolbar change maxItemsShown from 5 to 0:

you will find:

```js
    rightToolbar: new ToolItemsFactory({
      main: [

        ...

      ]
    }, {
      maxItemsShown: 5,
      ...
    })
```

change it to: 

```js
    rightToolbar: new ToolItemsFactory({
      main: [

        ...

      ]
    }, {
      maxItemsShown: 0,
      ...
    })
```

Then go to the nodestable view in the browser accessing the debug server and adapt your code
as needed to make it work as desired.

### 5 Test a toolitem in an installation

To test a toolitem in an installation, first find the toolbar with your item as
described in the next chapter, set the maxItemsShown property as needed to 0,
undefined or something greater than 0 and follow the instructions as described
in the next chapter to be sure, that the toolbar renders using the new setting.

Then check if your item behaves as expected, depending on whether you implemented
a wrappable or an unwrappable toolitem view.

### 6 Find out which toolitems of a toolbar are wrappable and which not

To find out which toolitems of a toolbar are wrappable and which not, do the following:

Find the toolbaritems configuration you want to investigate.
In the above example this is the 'rightToolbar' in 'csui/widgets/nodestable/toolbaritems'.

In the browser go to where the toolbar with your toolitem is displayed,
open the developer tools and paste and execute the following code, adapted to your values:

```js
csui.require('csui/widgets/nodestable/toolbaritems').rightToolbar.options.maxItemsShown = 0;
```

Then navigate away to a different perspective, for example from folder perspective to landing page,
and then back to the location using the navigaton functions of smartui,
for example using the breadcrumb and the node browsing view.
You may also use "Back"/"Forward" of the browser.

As a result you see all wrappable toolitems in the three-dot-menu and
all unwrappable toolitems staying in the toolbar directly.

Important: do not use browser "Refresh/F5" or its address bar,
otherwise the patched toolbar is reloaded and reverted to the original values.
