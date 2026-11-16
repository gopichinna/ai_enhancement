# NodesTableView

Shows a table with child nodes of a node container, offering rich functionality for browsing, sorting, filtering, inspecting and other actions.

If you want to get drill-down to child containers supported automatically, use a context object, which implements it; `BrowsingContext`, for example.

### Example

Show the widget on the full page:

```javascript
var region = new Marionette.Region({el: '#content'}),
    context = new BrowsingContext(),
    view = new NodesTableView({
      context: context,
      data: {
        containerId: 2000
      },
      tableAria: 'Content of Folder MyStuff'  
    });

region.show(view);
```

```html
<div id="content" class="binf-widgets"></div>
```

```css
#content {
  width: 100vw;
  height: 100vh;
}
```

## Options

### tableAria

Short and specific text for users of screen readers of what this table holds, eg 'Content of Folder MyStuff'. 
This must be localized properly.

### preferencesStorageId (string)

If defined, used to identify column customizations instead using containerId. Has precedence
over containerId. Used for example in recently accessed table view where nodestable.view is used,
but no containerId is available.

### data.containerId (integer, undefined by default)

Node ID of the container to enter. The contextual node will be entered by default.

### data.orderBy (string, 'name' by default)

Name of the node property, which the children will be ordered by. The REST API resource, which backs up the collection has to support sorting by this property. Srtale core propeprties are: 'modify_date', 'name', 'size' and 'type'.

### data.pageSize (integer, 30 by default)

Maximum number of children (rows) shown on a page in the table. Other childrne will be accessible by pagination.

### data.pageSizes (array of integers, [30, 50, 100] by default)

Available page sizes to choose from. If `pageSize` is not explicitly included, it will be added automatically.


## Widget Settings

The nodestable.view stores following preferences to its WidgetSettingsModel

### Settings overview

table mode

    The mode chosen by the user is stored.

column widths

    If the user resizes the width of the displayed columns this width is stored as widget settings.


### Settings format

The nodestable.view gets the WidgetSettingsCollection from the storage and from there it gets its WidgetSettingsModel by using options.preferencesStorageId or if this is not given by using 'global', prepended with the widget specific prefix 'csui/widgets/nodestable' separated by colon:

```
  csui/widgets/nodestable:global
```

The WidgetSettingsModel of the nodes table has the following format:

```
{
  "tableMode": "nowrap",
  "columns": {
    "name": {
      "width": 308
    },
    "size": {
      "width": 183
    },
    "modify_date": {
      "width": 112
    }
  }
}
```

Table mode can be 'wrap', 'nowrap' or 'thumbnail'.

## Opening column settings dialog

To open the column settings dialog just call openColumnSettings on the nodestable view.

Not passing any parameter to openColumnSettings let the nodestable store the columnCustomizings
and update the display, if needed, after closing the dialog.

```
    nodesTableView.openColumnSettings();
```

To get notified when the settings are about to be saved use the beforeSave callback.
When passing a beforeSave callback returning a promise the nodestable will store the columnCustomizings
and update the display if needed, when the promise is resolved.
The same happens is somethings truthy is returned instead of a promise.

```
    nodesTableView.openColumnSettings({ beforeSave: (columnCustomizings) => {
      return new Promise((resolve, reject) => {
        // do something before save and resolve the promise when finished.
        resolve();
      });
    }});

```

Returning something falsy instead of a promise or rejecting the promise
will prevent any further processing in the nodes table.
This gives the caller the opportunity to do complex custom handling.
In this case the caller must also take care to store the column customizings,
maintain the columns collection and render the nodestable at a dedicated point in time.
