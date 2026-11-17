/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/controls/query.form/query.form.view'
], function(QueryFormViewImpl){
  'use strict';

  var QueryFormView = QueryFormViewImpl.extend({
    constructor: function QueryFormView(options) {
      QueryFormView.__super__.constructor.call(this, options);
    }
  });

  return QueryFormView;
});