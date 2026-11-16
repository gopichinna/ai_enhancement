/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  /**
 * @class FieldsV2Mixin
 * @see {@link ConnectableMixin}
 * @mixin
 *
 * @description Provides support for the setting `fields` URL query parameter as introduced
 by the `api/v2/members/favorites` or `api/v2/members/accessed` (V2) resources.

 Server responses can contain various properties, which can increase the
 response size, if all of them were always returned.

 Adding a field needs the role, which contains them (`properties`, `versions`
 etc.), and optionally their names too (`parent_id`, `create_user_id` etc.).

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeFieldsV2(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getResourceFieldsUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

 ConnectableMixin.mixin(MyModel.prototype);
 FieldsV2Mixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin`
 or with another cumulated mixin which includes it.

 ### How to use the mixin

 Set up the URL parameters by calling `setFields` and `resetFields` and fetch the model:

 ```
 // Set the expansion when creating the model
 var model = new MyModel(undefined, {
      connector: connector,
      fields: {
        properties: ['parent_id', 'create_user_id']
      }
    });
 model.fetch();

 // Set the expansion after creating the model
 model.setFields('properties', ['parent_id', 'create_user_id']);
 model.fetch();
 ```
 */

  var FieldsV2Mixin = {
    mixin: function (prototype) {
      return _.extend(
        prototype,
        /** @lends FieldsV2Mixin# */ {
          /**
         * Fields to include in the response (object literal of strings pointing
         to arrays of strings, empty by default, read-only). Keys and values from the object literal
         are handled the same way as the `setFields` method does the key and value
         (role and properties).  An empty object literal is the default.
         * @memberOf FieldsV2Mixin
         * @instance
         * @type {Object}
         */
          fields: {},

          /**
         * @function
         * @param options -  Recognized option properties:
         * @returns {FieldsV2Mixin}
         * @description  Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.
         */
          makeFieldsV2: function (options) {
            this.fields = (options && options.fields) || {};
            return this;
          },

          //------------------------- hasFields
          /**
         * @function
         * @param {String} role - The field role (i.e. the group of fields) to be checked
         * @returns {Boolean}
         * @description  Checks if a specific field or any fields will be included.  The `role` parameter
         is a string.
 ```
 // Checks if any fields are included
 var anyFields = model.hasFields();
 // Checks if any common property fields are included
 var propertyFields = model.hasFields('properties');
 ```
         */
          hasFields: function (role) {
            if (this.fields[role]) {
              return true;
            }
            if (_.isEmpty(this.fields) && this.collection && this.collection.fields) {
              return role ? !!this.collection.fields[role] : _.isEmpty(this.collection.fields);
            }
            return false;
          },

          // ------------------- setFields
          /**
         * @function
         * @param {String} role - The fields role (i.e. the group of fields).
         * @param names {String|String[]} - The names of the fields of the specified role. The string can
         contain a comma-delimited list, in which case it will be split to an array.
         * @description Adds one or more fields to the response.  The `role` parameter is a string.  The
         `names` parameter can be either string, or an array of strings.  The string can
         contain a comma-delimited list, in which case it will be split to an array.
 ```
 // Have two fields added, option 1
 model.setFields('properties', ['parent_id', 'create_user_id']);
 // Have two fields added, option 2
 model.setFields('properties', 'parent_id');
 model.setFields('properties', 'create_user_id');
 // Have two fields added, option 3
 model.setFields('properties', 'parent_id,create_user_id');
 ```
         */

          setFields: function (role, names) {
            if (_.isObject(role)) {
              _.each(
                role,
                function (value, key) {
                  this._setOneFieldSet(key, value);
                },
                this
              );
            } else {
              this._setOneFieldSet(role, names);
            }
          },

          // ----------------------- resetFields
          /**
         * @function
         * @param {String} role - The fields role (i.e. the group of fields).
         * @param names {String|String[]} - The names of the fields of the specified role.
         The parameter can be either string, or an array of strings.  The string can
         contain a comma-delimited list, in which case it will be split to an array.
         * @description Removes one or more fields from the response. If nothing is specified,
  all roles will be removed (not returned).

 ```
 // Cancel all expansions and fetch the fresh data
 model.resetFields();
 model.fetch();
 ```
         */
          resetFields: function (role, names) {
            if (_.isObject(role)) {
              _.each(
                role,
                function (value, key) {
                  this._resetOneFieldSet(key, value);
                },
                this
              );
            } else {
              this._resetOneFieldSet(role, names);
            }
          },

          /**
         * @function
         * @returns {*}
         * @description  Formats the URL query parameters for the field addition.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.

 ```
 var url = ...,
 query = Url.combineQueryString(
 ...,
 this.getResourceFieldsUrlQuery()
 );
 if (query) {
   url = Url.appendQuery(url, query);
 ```
         */
          getResourceFieldsUrlQuery: function () {
            return _.reduce(
              this.fields,
              function (result, names, role) {
                var fields = result.fields || (result.fields = []),
                  encodedNames = _.map(names, encodeURIComponent),
                  field = encodeURIComponent(role);
                if (encodedNames.length) {
                  var dot = field.indexOf('.');
                  if (dot > 0) {
                    // versions.element(0) -> versions{mime_type}.element(0)
                    field = field.substring(0, dot) + '{' + encodedNames.join(',') + '}' + field.substring(dot);
                  } else {
                    // properties -> properties{name}
                    field += '{' + encodedNames.join(',') + '}';
                  }
                }
                fields.push(field);
                return result;
              },
              {}
            );
          },

          _setOneFieldSet: function (role, names) {
            var fields = this.fields[role] || (this.fields[role] = []);
            if (names) {
              if (!_.isArray(names)) {
                names = names.split(',');
              }
              _.each(
                names,
                function (name) {
                  if (!_.contains(fields, name)) {
                    fields.push(name);
                  }
                },
                this
              );
            }
          },

          _resetOneFieldSet: function (role, names) {
            if (names) {
              var fields = this.fields[role] || (this.fields[role] = []);
              if (!_.isArray(names)) {
                names = names.split(',');
              }
              _.each(
                names,
                function (name) {
                  var index = _.indexOf(fields, name);
                  if (index >= 0) {
                    fields.splice(index, 1);
                  }
                },
                this
              );
            } else if (role) {
              delete this.fields[role];
            } else {
              _.chain(this.fields)
                .keys()
                .each(function (key) {
                  delete this.fields[key];
                }, this);
            }
          }
        }
      );
    },

    mergePropertyParameters: function (output, input) {
      if (typeof input === 'string') {
        input = input.split(',');
      }
      if (Array.isArray(input)) {
        input = input.reduce(function (result, name) {
          var value = result[name];
          // If all fields or expands in a scope were requested, ensure,
          // that an empty array is assigned to it to include app properties
          if (!value || value.length) {
            result[name] = [];
          }
          return result;
        }, {});
      }
      output || (output = {});
      _.each(input, function (values, name) {
        var target = output[name];
        if (target) {
          _.each(values, function (value) {
            if (!_.contains(target, value)) {
              target.push(value);
            }
          });
        } else {
          output[name] = values;
        }
      });
      return output;
    }
  };

  return FieldsV2Mixin;
});
