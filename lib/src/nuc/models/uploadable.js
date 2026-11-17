/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/utils/log'], function (
  module,
  _,
  $,
  Backbone,
  log
) {
  'use strict';

  log = log(module.id);

  function UploadableModel(_ParentModel) {
    var prototype = {
      makeUploadable: function (_options) {
        // log.warn('Module "nuc/models/uploadable" has been deprecated and is going to be removed.' +
        //          '  Use "nuc/models/mixins/uploadable/uploadable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this;
      },

      sync: function (method, model, options) {
        var data = options.data || options.attrs || this.attributes;
        // Make sure, that POST and PUT urls do not contain the URL query
        // part.  It is not possible to ensure it inside the url function.
        function currectUpdatingUrl() {
          var url = options.url || _.result(model, 'url');
          return url.replace(/\?.*$/, '');
        }

        if (method === 'create') {
          log.debug('Creating {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
          var formData = new FormData();
          formData.append('body', JSON.stringify(data));

          // append file, if there is
          _.each(_.keys(options.files || {}), function (key) {
            var files = options.files[key],
              i;
            if (_.isArray(files) && files.length > 1) {
              // TODO: Adapt this according to the server support.
              for (i = 0; i < files.length; ++i) {
                var name = i ? key + i : key;
                formData.append(name, files[i]);
              }
            } else if (files) {
              formData.append(key, files);
            }
          });

          _.extend(options, {
            data: formData,
            contentType: false,
            url: currectUpdatingUrl()
          });
        } else if (method === 'update' || method === 'patch') {
          log.debug('Updating {0} ({1}).', log.getObjectName(this), this.cid) && console.log(log.last);
          method = 'update';
          data = { body: JSON.stringify(data) };
          _.extend(options, {
            data: $.param(data),
            contentType: 'application/x-www-form-urlencoded',
            url: currectUpdatingUrl()
          });
        }
        return Backbone.sync(method, model, options);
      }
    };
    prototype.Uploadable = _.clone(prototype);

    return prototype;
  }

  return UploadableModel;
});
