/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/objectstorage'], function (_, Backbone, ObjectStorage) {
  function NamedStorage(storage, name) {
    this.storage = storage;
    this.name = name;
    try {
      this.storage.setItem('testkey', 'testvalue');
    } catch (e) {
      this.os = new ObjectStorage();
    }
  }

  _.extend(NamedStorage.prototype, Backbone.Events, {
    constructor: NamedStorage,

    get: function (key, _value) {
      return getContent.call(this)[key];
    },

    set: function (key, value) {
      var content = getContent.call(this);
      content[key] = value;
      saveContent.call(this, content);
    },

    remove: function (key) {
      var content = getContent.call(this);
      delete content[key];
      saveContent.call(this, content);
    },

    destroy: function () {
      this.storage.removeItem(this.name);
    }
  });

  function getContent() {
    var content;
    if (this.os) {
      content = this.os.getItem(this.name);
    } else {
      content = this.storage && this.storage.getItem(this.name);
    }
    return (content && JSON.parse(content)) || {};
  }

  function saveContent(content) {
    if (this.os) {
      this.os.setItem(this.name, JSON.stringify(content));
    } else {
      this.storage && this.storage.setItem(this.name, JSON.stringify(content));
    }
  }

  NamedStorage.extend = Backbone.View.extend;
  NamedStorage.version = '1.0';

  return NamedStorage;
});
