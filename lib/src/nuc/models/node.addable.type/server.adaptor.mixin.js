/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/utils/url'], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (_options) {
          return this;
        },

        url: function () {
          return Url.combine(this.node.urlBase(), 'addablenodetypes');
        },

        parse: function (response, _options) {
          // The server returns very inconvenient structure, where the types
          // have textual keys and no subtype numbers.  An array of object
          // literals describing the addable type is put together from the
          // number parsed out of the form URL (!) from the data object
          // and the name from the definition object.
          var data = response.data,
            definitions = response.definitions;
          return _.chain(data)
            .keys()
            .map(function (key) {
              var url = data[key],
                definition = definitions[key];
              if (url && definition) {
                var match = url && /[?&]type=([^&]+)(?:&.*)?$/.exec(url);
                if (match) {
                  var subtype = parseInt(match[1], 10);
                  var type_name = definition.name;
                  return {
                    type: subtype,
                    type_name: type_name
                  };
                }
              }
            })
            .compact()
            .value();
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
