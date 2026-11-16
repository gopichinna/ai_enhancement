# NodePickerExtraData

It is similar to the same extension provided for "NodeExtraData", for more information please
refer "csui\dialogs\node.picker\node.picker.md".
But this extension point is for target/node pickers and that too if the node indicators flag
value is true. Otherwise, including extra parameter/fields in the REST API's within node/target
picker leads to performance issues.

## How to extend the node picker extra data

Content of a `contentsharing/controls/node.picker/contentsharing.node.picker.extra.data.js`:

```js
define(function () {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        sharing_info: []
      };
    },
  };
});
```

Content of a `src/bundles/contentsharing-all.js`:

```js
define([
  ...,
  'contentsharing/controls/node.picker/contentsharing.node.picker.extra.data',
  ...
] {});
```

Content of `contentsharing/contentsharing-extensions.json`:

```js
{
  ...,
  "csui/dialogs/node.picker/data/node.picker.extra.data": {
    "extensions": {
      "contentsharing": [
        "contentsharing/controls/node.picker/contentsharing.node.picker.extra.data"
      ]
    }
  },
  ...
}
```

## How to access the node picker extra data

```js
var data = node.get('data') || {};
var sharingInfo = data.sharing_info || {};
console.log(sharingInfo.is_shared);
console.log(sharingInfo.sync_tooltip);
```

## How to implement the node picker extra data

```js
define([
  'csui/dialogs/node.picker/data/node.picker.extra.data', ...
], function (nodePickerExtraData, ...) {
  var MyView = Marionette.CollectionView.extend({
    constructor: function MyView(options) {
      Marionette.CollectionView.call(this, options);
      this.collection.setFields(nodePickerExtraData.getModelFields());
      this.collection.setExpand(nodePickerExtraData.getModelExpand());
    }
  });
  return MyView;
}
```
