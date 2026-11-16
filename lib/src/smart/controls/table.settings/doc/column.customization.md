# Configuration

## Column Customization Side Panel Smart Control

The Column Customization Side Panel Smart Control is a class that provides methods to show or 
hide a side panel with the column customization views embedded.


### Example for using Column Customization Side Panel Smart Control

```js
    csui.require(['nuc/lib/backbone',
    'smart/controls/table.settings/table.settings.columns.side.panel.view',
  ],
  function(Backbone, TableSettingsColumnsSidePanelView) {
    // the allColumns collection provides information about all available columns and which of
    // them are pinned, permanent or being shown by default.
    const allColumns = new Backbone.Collection([
      { id: 'type', name: 'Type', permanent: true, pinned: true },
      { id: 'name', name: 'Name', permanent: true, pinned: true },
      { id: 'size', name: 'Size', label: 'Metadata', default: true },
      { id: 'wnd_comments', name: 'Comments' },
      { id: 'favorite', name: 'Favorite', default: true },
    ]);

    // the selectedColumns collection is a backbone collection that has the actual state. If 
    // prefilled with items from the allColumns collection, it defines, which columns are 
    // actually shown as selected in the side panel. Note that the order in the selectedColumns 
    // collection matters. 
    const selectedColumns = new Backbone.Collection();
    
    // the orderBy parameter is an array with properties from the allColumns collection and defines
    // by which order the columns are sorted before displayed in the edit view.
    const sp = new TableSettingsColumnsSidePanelView({ allColumns: allColumns, selectedColumns: selectedColumns });
    sp.show();
  });
```

# methods

## TableSettingsColumnsSidePanelView(options) ⇒ <code>TableSettingsColumnsSidePanelView</code>

**Kind**: constructor

- **<code>options.allColumns: `required`(Backbone collection)</code>**
  the allColumns collection provides information about all available columns. Each entry must
  have a unique id. The name will be displayed as the name of the column in the side panel. An
  optional label will be displayed together with the name. If permanent: true is set, the
  element can't be removed from the list of selected columns. Permanent columns are
  automatically selected. Columns with pinned: true are ordered to be always at the top of the
  list and can't be removed as well. Default columns are columns that are initially selected for
  being shown. The allColumns collection will be used in case the user clicks "reset to defaults".


- **<code>options.selectedColumns: `required`(Backbone collection)</code>**
  the selectedColumns collection is a backbone collection that has the actual state. If
  prefilled with items from the allColumns collection, it defines, which columns are actually
  shown as selected in the side panel. Note that the order in the selectedColumns collection
  matters: it is the order of columns the user defined in the customization side panel or when
  prefilling selectedColumns the order will be the order shown to the user.


## show() ⇒ <code>promise</code>
Starts showing the side panel. The promise will resolve once the side panel is shown completely
(transition finished).

**Kind**: async function

## hide() ⇒ <code>promise</code>
Starts hiding (closing) the side panel. The promise will resolve once the side panel is no more 
shown.

**Kind**: async function
