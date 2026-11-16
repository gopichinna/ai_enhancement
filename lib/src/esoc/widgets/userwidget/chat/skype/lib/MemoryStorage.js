/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "esoc/widgets/userwidget/chat/skype/lib/GeneralHelper" ], function(module, _require, $, _, Backbone, GeneralHelper) {
  var _generalHelper = GeneralHelper.attributes;
  var MemoryStorage = new Backbone.Model({
    _data: {},
    init: function(object) {
      var deferred = $.Deferred();
      this._data = {};
      deferred.resolve();
      return deferred.promise();
    },
    create: function(data, id, callback) {
      var deferred = $.Deferred();
      this._data[id] = data;
      deferred.resolve(id);
      _generalHelper.safeCallbackExec({
        callback: callback,
        params: [ id ]
      });
      return deferred.promise();
    },
    read: function(id, callback) {
      var deferred = $.Deferred();
      deferred.resolve(this._data[id]);
      _generalHelper.safeCallbackExec({
        callback: callback,
        params: [ this._data[id] ]
      });
      return deferred.promise();
    },
    update: function(data, id, callback) {
      var deferred = $.Deferred();
      this._data[id] = data;
      deferred.resolve(id);
      _generalHelper.safeCallbackExec({
        callback: callback,
        params: [ id ]
      });
      deferred.promise();
    },
    deleteVal: function(id, callback) {
      var deferred = $.Deferred();
      delete this._data[id];
      deferred.resolve(id);
      _generalHelper.safeCallbackExec({
        callback: callback,
        params: [ id ]
      });
      return deferred.promise();
    }
  });
  return MemoryStorage;
});