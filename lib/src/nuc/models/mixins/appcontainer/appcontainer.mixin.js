/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore'], function (_) {
  'use strict';

  var AppContainerMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeAppContainer: function (_options) {
          return this;
        },

        massageResponse: function (properties) {
          /* eslint-disable no-irregular-whitespace */
          // component extensions
          // icondata
          // socialfeed:pulsecomment​
          // wopi:wopisessionerroricon​
          // wopi:wopisharedreserveicon​
          // var imgs = _.pluck(properties.modify_images, 'key');
          /* eslint-enable no-irregular-whitespace */

          // add id to expands
          _.map(['original', 'create_user', 'owner_user', 'reserved_user', 'modify_user', 'parent'], function (item) {
            var idprop = item + '_id',
              expandprop = idprop + '_expand';
            if (properties[expandprop]) {
              properties[expandprop].id = properties[idprop];
            }
          });

          properties.reserved = !!properties.reserved_user_id;

          // utils/nodesprites expects mime_type, even if it is null
          // apparently also container is expected as a fallback for folders
          // alternatively fix utils/nodesprites

          // special treatment of children of this.node (current container)
          // these have currently parent_id_expand === null to reduce data load
          if (properties.parent_id && !properties.parent_id_expand) {
            properties.parent_id_expand = {
              id: this.node.get('id'),
              type: this.node.get('type'),
              name: this.node.get('name'),
              openable: this.node.get('openable')
            };
          }
          if (properties.parent_id_expand) {
            properties.parent_id_expand.container = true;
            properties.parent_id_expand.mime_type = properties.parent_id_expand.mime_type || null;
          }

          return properties;
        }
      });
    }
  };

  return AppContainerMixin;
});
