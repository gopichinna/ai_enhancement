# Configuration

## Bulk Selection Smart Control

A Marionette view that provides a bulk selection control to display a button with badge and dropdown menu of selected items.

The bulk selection view will render a button with a text label and a counter icon with the number of selected items.  Clicking the button will open a dropdown menu containing the name and mime type icon of each selected item.

The menu will also contain a clickable item that can be used to clear all selected items from the collection. When hovering an individual item in the dropdown, an 'X' icon will be displayed, allowing the user to remove a single item from the collection.

### Example for using Bulk Selection Smart Control view

```js
define(['smart/controls/bulk.selection/bulk.selection'], function (BulkSelectionView) {
  selectedCountView = new BulkSelectionView({
    collection:  selectedItems
    getNodeTypeIconView: BulkSelectionView.prototype.getNodeTypeIconView,
  });
});
```

## Parameters

- **options: `required`(Object)** - The view's options object.
- **options.collection: `required`(Backbone collection)** - The collection contains a list of selected nodes.
- **options.getNodeTypeIconView: `required`(Function)** - A callback that returns a NodeTypeIconView, which renders the mime type icons.
