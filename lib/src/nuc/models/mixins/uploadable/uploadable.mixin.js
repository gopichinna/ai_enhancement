/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/log'], function (module, _, $, log) {
  'use strict';

  log = log(module.id);

  var config = _.extend(
    {
      useJson: false,
      useMock: false,
      usePatch: false,
      metadataPartName: 'body'
    },
    module.config()
  );

  /**
 * @class UploadableMixin
 * @see {@link ConnectableMixin}
 * @see {@link ResourceMixin}
 * @mixin
 *
 * @description Enables creating and modifying the resource behind a `Backbone.Model`.
 Simplifies requests with multi-part content, enables mocking by mockjax
 and supports pasing the JSON body as form-encoded parameter "body".
 Also introduces the `prepare` method to "massage" request body similarly
 to the `parse` method for the response body.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeConnectable(options)
        .makeUploadable(options);
  },

  url: function () {
    return Url.combine(this.connector.connection.url, 'myresource')
  }
});

 ConnectableMixin.mixin(MyModel.prototype);
 UploadableMixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin`
 or with another cumulated mixin which includes it.

 ### How to use the mixin

 It just works whenever you call the `save` method of the model.

 ## makeUploadable(options) : this

 Must be called in the constructor to initialize the mixin functionality.
 Expects the Backbone.Model or Backbone.Collection constructor options passed in.

 ## prepare(data, options) : object

 Can be overridden to "massage" the data, which are going to be sent to the
 server in the request body. If not overridden, the unchanged input of the
 `save` method, or `this.attributes`, will be sent to the server as-is.
 The `prepare` method converts model attributes to the request body object,
 so that the server accepts it, like the `parse` method converts the response
 body object to model attributes, so that the client understands them.

 ```javascript
 // For example, the server sends and receives resource attributes wrapped
 // in an object with a `data` property.
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeUploadable(options);
  },

  prepare: function (data, options) {
    return {data: data};
  },

  parse: function (response, options) {
    return response.data;
  }
});
 UploadableMixin.mixin(MyModel.prototype);
 ```

 Calling the `prepare` method can be prevented by setting the `prepare`
 option to `false`, similarly to preventing the `parse` method from being
 called by setting the `parse` option to `false`.

 */

  var UploadableMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;

      // Mixins are applied after the prototype has been defined. This
      // method is supposed to be overridden in the original prototype.
      if (!prototype.prepare) {
        prototype.prepare = function (data, _options) {
          return data;
        };
      }

      // Let model's prototype prepare formData to post otherwise, have a default impl.
      if (!prototype.prepareFormData) {
        prototype.prepareFormData = function (data, _options) {
          return { body: JSON.stringify(data) };
        };
      }

      return _.extend(prototype, {
        makeUploadable: function (_options) {
          return this;
        },

        sync: function (method, model, options) {
          var useJson = UploadableMixin.useJSON,
            useMock = UploadableMixin.mock,
            usePatch = UploadableMixin.usePatch,
            metadataPartName = UploadableMixin.metadataPartName,
            data = options.data || options.attrs || this.attributes;

          // Allow data "massage", before sending them to the server.
          if (options.prepare !== false) {
            data = this.prepare(data, options);
          }

          // Make sure, that POST and PUT urls do not contain the URL query
          // part.  It is not possible to ensure it inside the url function.
          function currectUpdatingUrl() {
            var url = options.url || _.result(model, 'url');
            return url.replace(/\?.*$/, '');
          }

          if (method === 'create') {
            log.debug('Creating {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
            if (useMock) {
              // append file, if there is
              _.each(_.keys(options.files || {}), function (key) {
                var files = options.files[key],
                  i;
                if (_.isArray(files) && files.length > 1) {
                  // TODO: Adapt this according to the server support;
                  // currently the server can consume only one file
                  for (i = 0; i < files.length; ++i) {
                    var name = i ? key + i : key;
                    data[name] = files[i];
                  }
                } else if (files) {
                  data[key] = files;
                }
              });

              _.extend(options, {
                data: data,
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else if (!_.isEmpty(options.files)) {
              var formData = new FormData();
              data = JSON.stringify(data);
              if (useJson) {
                formData.append(metadataPartName, new Blob([data], { type: 'application/json' }));
              } else {
                formData.append(metadataPartName, data);
              }

              // append file, if there is
              _.each(_.keys(options.files || {}), function (key) {
                var files = options.files[key],
                  i;
                if (_.isArray(files) && files.length > 1) {
                  // TODO: Adapt this according to the server support;
                  // currently the server can consume only one file
                  for (i = 0; i < files.length; ++i) {
                    var name = i ? key + i : key;
                    formData.append(name, files[i]);
                  }
                } else if (files) {
                  formData.append(key, files, files.name);
                }
              });

              _.extend(options, {
                data: formData,
                contentType: false,
                url: currectUpdatingUrl()
              });
            } else {
              if (useJson) {
                _.extend(options, {
                  data: JSON.stringify(data),
                  contentType: 'application/json',
                  url: currectUpdatingUrl()
                });
              } else {
                data = this.prepareFormData(data);
                _.extend(options, {
                  data: $.param(data),
                  contentType: 'application/x-www-form-urlencoded',
                  url: currectUpdatingUrl()
                });
              }
            }
          } else if (method === 'update' || method === 'patch') {
            log.debug('Updating {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
            if (!usePatch) {
              method = 'update';
            }
            // Send metadata_token automatically if it is present.
            // TODO: Move this to server adaptor, optionally as a model feature.
            var metadataToken = this.state && this.state.get('metadata_token');
            if (metadataToken != null) {
              data.metadata_token = metadataToken;
            }
            if (useMock) {
              _.extend(options, {
                data: data,
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else if (useJson) {
              _.extend(options, {
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else {
              data = this.prepareFormData(data);
              _.extend(options, {
                data: $.param(data),
                contentType: 'application/x-www-form-urlencoded',
                url: currectUpdatingUrl()
              });
            }
          }
          return originalSync.call(this, method, model, options);
        }
      });
    },

    // Set to true to enable tests of PUT and PATCH; once the server
    // accepts application/json content type, change the default to true
    useJSON: config.useJson,

    // Set to true to enable unit tests of POST, PUT and PATCH; files
    // have to be looked up in the jqxhr settings object
    mock: config.useMock,

    // Set to true to enable usage of the PATCH verb, if the server
    // supports it
    usePatch: config.usePatch,

    // Set to true to enable usage of the PATCH verb, if the server
    // supports it
    metadataPartName: config.metadataPartName
  };

  return UploadableMixin;
});
