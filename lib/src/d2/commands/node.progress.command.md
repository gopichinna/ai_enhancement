# NodeProgress Command

Provides a base class for commands that need to show generic progress panel while performing an action on multiple
nodes. It shows CSUI's generic progress panel, and also shows error messages / success toast message accordingly.

All the keys from `status` passed to the command are copied over to `options` (only if specific key is not already there
in `options`). This modified `options` object is passed to all methods except `preProcess`. Sometimes, you would need to
pass some data from `preProcess` to subsequent methods like `doAction` and `handleResults`. Please use `options` object
for the same, as same object is passed around. 

Normal behavior flow is as follows:
1. The progress panel is displayed, and progress gets updated based on the completion of individual node processing.
2. In case the processing for any node fails, or if user aborts the processing (either using *Stop* button for all pending items, or using Cancel icon against each item), or if `doneCommand` options are enabled and there are multiple nodes and at least one node is not within the `commandContainer`, then the progress panel will remain visible after all processing is complete. User can expand it to see individual item status.
3. In case the processing is successful, then progress panel is removed, and toast message is displayed with success details. If it was a single node and `doneCommand` was applicable, then the toast message will also include done command link.


## Options

These options can be passed as part of `options` (second argument to `execute`):

| Option | Description |
|--------|-------------|
| `suppressProgress` | If `true` then actions will be performed on all nodes, but progress panel will not be shown. In case of mobile and failure, it will show error message as a toast as progress panel won't be available. |
| `hideSuccessMessage` | If `true` then success message toast will not be shown after command is successful. |
| `hideFailureMessage` | This is applicable only if `suppressProgress` is true. If this is also `true` then message for failure will not be displayed, in case the command fails. |
| `doneCommand` | This is expected to be a simple object with attributes explained later. If this object is provided, then the success message will include link for further navigation, based on whether the node resides within `commandContainer` or not. The attributes expected for this object are: **1) `signature`:** Command to execute on link click. **2) `label`:** Label for the link. **3) `tooltip`:** Tooltip for the label (optional). |
| `commandContainer` | This must be provided if `doneCommand` link has to be shown. The link is displayed if given node is not within this container. |


## Methods

Implementation command class must/could implement following methods:

| Method | Mandatory | Params | Description |
|--------|-----------|--------|-------------|
| doAction | Yes | `node`, `options` | Main method that must be implemented. It would receive individual node out of the list. Implementation must perform actual action as required, and return promise. In successful case, the promise should be resolved with node object (might be updated during the process). |
| preProcess | No | `status`, `options` | This would be called before actual actions are performed. Any required validation, confirmation, etc. can be performed here. Must return a promise. |
| handleResults | No | `results`, `options` | If this method returns a promise, then command will be resolved only after this promise is resolved. `results` argument is an array containing one element for each input node. The element will be: *Node object* if action for that node was successful, *undefined* if action was aborted by user for that node, and all other cases it is error in execution, and element will be whatever `doAction` promise was *rejected* with. |
| getMessageOptions | No | `options` | Use this method to customize the default success/error messages. See below. |


## Message options

| Lang Key | No. of items | `*` | Status | Params to the message |
|----------|--------------|-----|--------|-----------------------|
| oneFilePending | Single |   | In process | `{0}` - Item name |
| oneFileSuccess | Single |   | Success | `{0}` - Successful item name |
| oneFileFailure | Single |   | Failure | `{0}` - Failed item name |
| multiFilePending | Multi |   | In process | `{0}` - Total items count |
| multiFileSuccess | Multi |   | Success | `{0}` - Successful items count |
| multiFileOneFailure | Multi |   | Single item failed | None |
| multiFileFailure | Multi |   | Multiple items failed | `{0}` - Failed items count |
| oneFileFailureOneFileSuccess | Multi | `*` | 1 failed, 1 succeeded | None |
| multipleFileFailureOneFileSuccess | Multi | `*` | Multiple failed, 1 succeeded | `{0}` - Failed items count |
| oneFileFailureMultipleFileSuccess | Multi | `*` | 1 failed, multiple succeeded | `{0}` - Successful items count |
| multipleFileFailureMultipleFileSuccess | Multi | `*` | Multiple failed, multiple succeeded | `{0}` - Failed items count<br/>`{1}` - Successful items count |
| someItemsStopped | Multi |   | User aborted one or more items | `{0}` - Total items count |

**Note:** Items marked `*` are applicable only if "suppressProgress" option is true. In such case, it will show toast message according to these message config.


## Example

```js
var DeleteCommand = NodeProgressCommand.extend({
  defaults: {
    signature: 'Delete',
    command_key: 'Delete',
    name: lang.CommandNameDelete,
    pageLeavingWarning: lang.DeletePageLeavingWarning,
    scope: 'multiple'
  },

  preProcess: function (status, options) {
    options || (options = {});
    var me = this,
      deferred = $.Deferred();

    // Do something...

    me._confirmAction(status, options).done(function (deleteOptions) {
      options.deleteOptions = deleteOptions;
      deferred.resolve();
    }).fail(function () {
      deferred.reject();
    });

    return deferred.promise();
  },

  doAction: function (node, options) {
    var deferred = $.Deferred();

    node.destroy({
      wait: true,
      deleteOptions: options.deleteOptions,
      container: options.container
    }).done(function () {
      deferred.resolve(node);
    }).fail(deferred.reject);

    return deferred.promise();
  },

  handleResults: function (results, options) {
    var sourceCollection = options.originatingView && options.originatingView.collection,
      deletedIds = _.compact(_.map(results || [], function (result) {
        if (result instanceof Backbone.Model) {
          return result.get('id');
        }
      }));

    if (deletedIds.length > 0) {
      options.context.trigger('d2:objects:deleted', deletedIds);
    }

    return sourceCollection.fetch({reload: true});
  },

  getMessageOptions: function () {
    return {
      oneFilePending: lang.DeletingOneItem,
      multiFilePending: lang.DeletingManyItems,
      oneFileSuccess: lang.DeleteOneItemSuccessMessage,
      multiFileSuccess: lang.DeleteManyItemsSuccessMessage,
      oneFileFailure: lang.DeleteOneItemFailMessage,
      multiFileOneFailure: lang.DeleteManyItemsOneFailMessage,
      multiFileFailure: lang.DeleteManyItemsFailMessage,
      someItemsStopped: lang.DeleteStopped,
      actionType: 'DELETE'
    };
  },

  // Other methods...
});
```
