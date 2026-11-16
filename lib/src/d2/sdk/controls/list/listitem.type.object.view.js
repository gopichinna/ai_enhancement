/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'csui/controls/listitem/listitemobject.view'
], function(ListItemTypeObjectViewImpl){
  'use strict';

  var ListItemTypeObjectView = ListItemTypeObjectViewImpl.extend({
    constructor: function ListItemTypeObjectView(options) {
      options = options || {};
      ListItemTypeObjectView.__super__.constructor.call(this, options);
    }
  });

  return ListItemTypeObjectView;
});
