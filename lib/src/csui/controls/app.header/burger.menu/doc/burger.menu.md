# Configuration

## Application header's hamburger menu items configuration
Note: Applicable only for v2 application header.

### Extension should be provided by CSUI's modules
```js
csui.require.config({
  config: {
    "csui/controls/app.header/burger.menu/burger.menu": {
      "extensions": {
        "<<moudule>>": [
          "<<module>>/controls/app.header/<<module>>.burger.menu.items"
        ]
      }
    },
  },
});
```
Note: Each entry from this extension should return promise object on which resovling the same should return the actual menu items.

### Example from CSUI module itself to pass default burger menu items.
```js
csui.require.config({
  config: {
    "csui/controls/app.header/burger.menu/burger.menu": {
      "extensions": {
        "csui": [
          "csui/controls/app.header/burger.menu/csui.burger.menu"
        ]
      }
    },
  },
});
```


#### And the extension file should provide the information regarding burger menu items as shown below
```js
define(['i18n!csui/controls/app.header/burger.menu/impl/nls/lang'], function (lang) {
    'use strict';

    // static menu items.
    let burgerMenuItems = {
        groups: [
            {
                id: "mynavigationpages",
                name: lang.myNavigationPages,
                sequence: 300
            },
        ],
        items: [
            {
                name: lang.home,
                signature: "",
                sequence: 100,
                execute: function (args) {
                    // provide custom logic upon clicking on this menu item
                },
                isActive: function (args) {
                    // provide custom logic to return a boolean.
                    // whether current menu item is activate or not.
                }
            },
            {
                groupBy: "mynavigationpages",
                name: lang.recentlyAccessed,
                signature: "recentlyaccessed",
                sequence: 200,
                execute: function (args) {
                    // provide custom logic upon clicking on this menu item
                },
                isActive: function (args) {
                    // provide custom logic to return a boolean.
                    // whether current menu item is activate or not.
                }
            },
            {
                name: lang.enterprise,
                signature: "enterprise",
                sequence: 990,
                execute: function (args) {
                    // provide custom logic upon clicking on this menu item
                },
                isActive: function (args) {
                    // provide custom logic to return a boolean.
                    // whether current menu item is activate or not.
                }
            }
        ]
    };

    const getMenuItems = function (args) {
        ...
        ...
        // obtain dynamic items
        connector
            .makeAjaxCall({
                type: "GET",
                url: myPerspectivesUrl,
            })
            .always(
                _.bind(function (response, statusText, jqxhr) {
                    if (jqxhr && jqxhr.status === 200) {
                        let myPerspectives = response.results;
                        if (myPerspectives.length) {
                            burgerMenuItems.groups.push({
                                id: "welcomepages",
                                name: lang.welcomePages,
                                sequence: 200
                            });
                            let seq = 0;
                            myPerspectives.forEach((perspective) => {
                                console.log(perspective.name);
                                let __menuItem = {
                                    groupBy: "welcomepages",
                                    name: perspective.Name ?? perspective.name,
                                    sequence: seq + 100,
                                    signature: perspective.DataID ?? perspective.dataid,
                                    execute: function (args) {
                                      // provide custom logic upon clicking on this menu item
                                    },
                                    isActive: function (args) {
                                      // provide custom logic to return a boolean.
                                      // whether current menu item is activate or not.
                                    }
                                };
                                burgerMenuItems.items.push(__menuItem);
                            });
                        }
                        // resolving both static and dynamic menu items.
                        deferred.resolve(burgerMenuItems);
                    }
                }, this),
            );
        return deferred.promise();
    };
    // return promise object.
    return getMenuItems;
});
```

## Options

<ul>
  <li><b>groups -  `...` (List)</b> Array of object's containing keys as id and name for grouping burger menu items.</li>  
  <li><b>id - `...` (String)</b> unique value(group id) to be provided to make items as grouped by this value</li>
  <li><b>name - `...` (String)</b> group name  to be displayed in hamburger menu for the respective id.</li>
</ul>

<ul>

  <li><b>items - `...` (List)</b> Array of objects containing keys as groupBy, name, signature and execute, is Active functions.</li>
  <li><b>groupBy - `...` (String)</b> Optional value used to group elements based on id, id of the group to be placed in for the item specified in groups object. If this parameter is not available, then that menu item will be considered as "Standalone" and will render in level one.</li>
  <li><b>name - `...` (String)</b> Item name to be displayed in hamburger menu for the respective item.</li>
  <li><b>signature - `required` (String)</b> unique value (command) to be passed.</li>
 
</ul>

## Public Methods

<ul>
    <li><b>execute():</b> 
    provide custom logic for functionality after clicking on the menu item, is executed on click of respective item in hamburger menu.</li>
    <li><b>isActive():</b> 
    Provide custom logic to return a boolean, whether current menu item is activate or not.</li>
</ul>
