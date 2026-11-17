/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Adds the deepClone method to _, Backbone.Model and Backbone.Collection
define(['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {
  // See https://gist.github.com/prantlf/6d134475af24d4b2f7de

  // Performs a deep clone of primitive values, arrays, object literals,
  // and arbitrary objects, if requested.  It is supposed to clone object
  // literals, which are going to be modified, but the original should
  // stay intact.
  //
  // The default behaviour works well with JSON REST API responses and
  // and other objects, which contain only values of native types.
  // If functions or HTML elements are encountered, they will not be
  // actually cloned; they will be just copied, which works well with
  // the typical options objects for Backbone constructors.
  // If arbitrary objects can be encountered, additional options can
  // be used to specify the result:
  //
  // default behaviour
  // : Throws an error
  // cloneCloneableObjects: true
  // : Uses deepClone or clone method, if available.
  // cloneArbitraryObjects: true
  // : Creates new objects with clones own properties of the original.
  // copyArbitraryObjects
  // : Copies the original.
  //
  // This function depends on Underscore.js.
  function deepClone(source, options) {
    if (
      !source ||
      typeof source !== 'object' ||
      source instanceof HTMLElement ||
      _.isBoolean(source) ||
      _.isNumber(source) ||
      _.isString(source)
    ) {
      return source;
    }
    if (_.isDate(source) || _.isRegExp(source)) {
      return new source.constructor(source.valueOf());
    }
    if (_.isArray(source)) {
      return _.map(source, function (obj) {
        return _.deepClone(obj);
      });
    }
    if (source.constructor !== Object) {
      if (options) {
        if (options.cloneCloneableObjects) {
          if (source.deepClone) {
            return source.deepClone();
          }
          if (source.clone) {
            return source.clone();
          }
        }
        if (options.copyArbitraryObjects) {
          return source;
        }
        if (!options.cloneArbitraryObjects) {
          throw new Error('Cannot clone an arbitrary function object instance');
        }
      } else {
        throw new Error('Cannot clone an arbitrary function object instance');
      }
    }
    return _.reduce(
      source,
      function (result, value, key) {
        result[key] = deepClone(value);
        return result;
      },
      {}
    );
  }

  // Expose deepClone among the Underscore.js methods
  _.mixin({ deepClone: deepClone });

  // Add deepClone to the Backbone.Model prototype
  Backbone.Model.prototype.deepClone = function (options) {
    return new this.constructor(deepClone(this.attributes, options));
  };

  // Add deepClone to the Backbone.Collection prototype
  Backbone.Collection.prototype.deepClone = function (options) {
    return new this.constructor(
      this.map(function (model) {
        return deepClone(model.attributes, options);
      })
    );
  };

  return deepClone;
});
