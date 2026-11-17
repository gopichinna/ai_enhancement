/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/controls/query.form/query.form.panel.view'
], function(QueryFormPanelViewImpl){
  'use strict';

  var QueryFormPanelView = QueryFormPanelViewImpl.extend({
    constructor: function QueryFormPanelView(options) {
      QueryFormPanelView.__super__.constructor.call(this, options);
    }
  });

  return QueryFormPanelView;
});