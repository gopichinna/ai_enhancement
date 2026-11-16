/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/autofetchable/autofetchable.mixin'
], function (_, ConnectableMixin, FetchableMixin, AutoFetchableMixin) {
  'use strict';

  /**
 * @class ResourceMixin
 * @see {@link ConnectableMixin}
 * @see {@link FetchableMixin}
 * @see {@link AutoFetchableMixin}
 * @mixin
 *
 * @description Helps implementing a model for a typical server resource, which has an identifier
 (the property 'id' by default), by combining the following three mixins:
 {@link ConnectableMixin}, {@link FetchableMixin} and {@link AutoFetchableMixin}.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeResource(options);
  },

  urlRoot: function () {
    return Url.combine(this.connector.connection.url, 'myresources');
  }

});

 ResourceMixin.mixin(MyModel.prototype);
 ```

 ## Remarks

 The included `FetchableMixin` overrides the `fetch` method and calls the original
 implementation from it.  If you supply your own custom implementation of this method,
 or use another mixin which overrides it, you should apply this mixin after yours.

 ### How use the mixin

 Specify the model attributes, the connector and fetch the model:

 ```
 // Specify the attributes and the connector when creating the model
 var connector = new Connector(...),
 model = new MyModel({
      id: 2000
    }, {
      connector: connector
    });
 model.fetch();

 // Set the attributes and the connector after creating the model
 model.set('id', 2000);
 connector.assignTo(model);
 model.fetch();
 ```

 */

  var ResourceMixin = {
    mixin: function (prototype) {
      ConnectableMixin.mixin(prototype);
      FetchableMixin.mixin(prototype);
      AutoFetchableMixin.mixin(prototype);

      return _.extend(prototype, {
        makeResource: function (options) {
          return this.makeConnectable(options).makeFetchable(options).makeAutoFetchable(options);
        }
      });
    }
  };

  return ResourceMixin;
});
