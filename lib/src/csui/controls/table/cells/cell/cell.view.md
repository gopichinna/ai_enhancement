# CellView

A Marionette view. CellView is the root class for customized display of a column value in the [Table View](../../table.view.js)

Implement a cell view by using the Marionette extend pattern from the base csui/controls/table/cells/cell/cell.view and register it with the cell view registry csui/controls/table/cells/cell.registry to introduce a custom display for your custom column.

## Properties and functions

A cell view is a Marionette view. To the view the node is passed as model at construction time.
When the value has to be displayed, 'render' is called.
When a cell view uses the Marionette extend pattern to derive from the base cell view it can 
override one of the methods approrpiately which are called by
the standard cell view rendering mechanism: render, renderValue, getValueText, getContentView.

### render()

Standard Marionette render method

### renderValue()

Simply calls getValueText and sets the result as text in the dom element of the cell view.

### getValueText()

Returns the value as text. The base cell view and most standard cell views of csui support multi value properties, where ',' is used as separator, if not specified differently via config.multiValueSeparator.

### getAriaLabel()

Returns the aria label to be added to the dom element of the cell.

### getContentView()

A cell view can implement this function to return an object containing the properties 'regionElementId' and 'view',
which is used to display the value in a wrapped row in 'List' mode.

'view' must contain the Marionette view to display the value by calling its render() function.

'regionElementId' specifies the string used as id in the dom for the region wherein the view is displayed.


## Class properties and functions

### columnClassName

the css class added to the cell fields when displayed

### hasFixedWith

true if the column has fixed width, otherwise false

### flexibleWidth

true if the column has flexible width, otherwise false

### permanentColumn

true if the column must not be wrapped into the wrapped rows in 'List' mode, otherwise false
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### noTitleInHeader

true if no title has to be displayed in the column header, otherwise false
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### titleIconInHeader

true if a icon is displayed in the header, otherwise false
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### title

the title to be dsiplayed in the header
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### align

Specifies the horizontal alignment for the column. Possible values are 'left', 'center', 'right'.
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### widthFactor

factor compared to the average how wide the width should be chosen in List mode.
1 means average, less than 1 means smaller than average, greater than 1 means wider than average.
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### isNaming

true if the column has to be considered as the name column instead of the standard 'name' column.
The value from the CellView is used only if the corresponding model in the columns collections
or the tableColumn collection has no value for this property.

### getValue(source, column)

When the column handler has not been created yet, before the table
cell is rendered, the cell value can be obtaind for other
purposes (sorting) by this static method of the column handler.

Default implementation is to return the plain value of the attribute of the column in the source model,
if it is a non-array value. If it is an array value, it returns the first value not null or undefined.

### getModelFields({collection, context, column})

A cell view might need additional data. By returning an appropriate 'field' object in getModelFields(),
the cell view can influence what fields is requested and thus returned from the server, when the collection is fetched.

The function is called to get a 'field' object, which is merged to the 'fields' from other cells using FieldsV2Mixin.mergePropertyParameters(fields, field) and then passed to collection.setFields(fields).

For example the hold.icon.view returns 'rmiconsdata' to request additional data fields for record management icons.
Later it uses data from node.attributes.data.rmiconsdata to display the hold icon, if needed.

```
getModelFields: function(options) {
  return { rmiconsdata: [] };
}
```

### getModelExpand({collection, context, column})

A cell view might need additional data. By returning an appropriate 'expand' object in getModelExpand(),
the cell view can influence what properties of the model are requested and thus returned expanded from the server, when the collection is fetched.

The function is called to get an 'expand' object, which is merged to the 'expands' from other cells using FieldsV2Mixin.mergePropertyParameters(expands, expand) and then passed to collection.setExpand(expands).

For example the parent.view which display the location of a node, returns 'parent_id',
so this the parent id will be returned as expanded attribute by the server.
It later gets the name of the location from the expanded attribute 'parent_id_expand'.

```
    getModelExpand: function (options) {
      return { properties: ['parent_id'] };
    }
```


## Config parameters

### multiValueSeparator

Config parameter to specify the separator used to separate multiple values in the text displayed for a multi value attribute.
By default ',' is used.

