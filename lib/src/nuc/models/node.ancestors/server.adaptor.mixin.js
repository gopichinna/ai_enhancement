/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/models/ancestor', 'nuc/utils/url'], function (_, AncestorModel, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (_options) {
          return this;
        },

        url: function () {
          return Url.combine(this.node.urlBase(), 'ancestors');
        },

        parse: function (response, _options) {
          // TODO: Currently the breadcrumb parameters are set in the
          // constructor. Should this be moved to public methods like
          // ChildNodeCollection is controlled?  It would enable more
          // flexible usage of the model class and view changes.  The
          // server doesn't allow filtering, ordering or limiting of
          // the ancestor list.

          response = response.ancestors;

          if (this.options.stop) {
            var id = this.options.stop.get ? this.options.stop.get('id') : this.options.stop.id;
            var skip;
            response = _.filter(response.reverse(), function (ancestor) {
              var result = !skip;
              if (ancestor.id == id) {
                skip = true;
              }
              return result;
            }).reverse();
          }

          if (this.options.limit && response.length > this.options.limit) {
            response.splice(0, response.length - this.options.limit);
            response.unshift({
              type: AncestorModel.Hidden
            });
          }

          // Help DefaultActionBehavior generate a link to open a node from
          // breadcrumb.  Ancestor items are not complete node infos, but
          // they have to be containers and setting {container:true} is enough
          // to render correct link to open the container.
          _.each(response, function (node) {
            node.container = true;
          });

          return response;
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
