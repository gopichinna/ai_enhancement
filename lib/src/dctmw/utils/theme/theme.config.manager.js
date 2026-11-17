/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone" ], function($, Backbone) {
  class ThemeConfigModel extends Backbone.Model {
    constructor(attr, options = {}) {
      super(attr, options);
    }
    fetch() {
      return $.Deferred().resolve().promise();
    }
  }
  return {
    initAppPageStyles: function() {},
    getDefaultThemeModel: function() {
      return new ThemeConfigModel();
    },
    getUserThemeModel: function() {
      return new ThemeConfigModel();
    }
  };
});