define([
  'nuc/lib/underscore',
  'json!<%= namespace %>/<%= namespace %>-extensions.json'
], function (_, extensions) {
  'use strict';

  describe('The extension', function () {

    beforeAll(function () {
      expect(extensions).toBeTruthy();
      var collection = extensions['d2/sdk/models/module.collection'];
      expect(collection).toBeTruthy();
      var modules = collection.modules;
      expect(modules).toBeTruthy();
      this.module = modules['<%= namespace %>'];
    });

    it('registers the module', function () {
      expect(this.module).toBeTruthy();
    });

    it('declares a version', function () {
      expect(this.module.version).toBeTruthy();
    });

  });

});
