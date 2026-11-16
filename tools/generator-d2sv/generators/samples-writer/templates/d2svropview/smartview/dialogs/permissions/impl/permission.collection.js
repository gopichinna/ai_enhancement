define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'd2/sdk/models/mixins/resource.mixin',
  'd2/sdk/models/mixins/browsable.collection.mixin'
], function(_, Backbone, ResourceMixin, BrowsableMixin){
  'use strict';

  var BASE_PERMISSION_PREFIX = 'basic',
    EXT_PERMISSION_PREFIX = 'extended',
    EXT_PERMISSION_SEP = ',';

  var PermissionModel = Backbone.Model.extend({
    idAttribute: 'id',
    constructor: function PermissionModel(attributes, options) {
      options = options || {};
      PermissionModel.__super__.constructor.call(this, attributes, options);
    }
  });

  var PermissionCollection = Backbone.Collection.extend({
    model: PermissionModel,

    constructor: function PermissionCollection(models, options) {
      options = options || {};

      PermissionCollection.__super__.constructor.apply(this, arguments);
      this.options = _.pick(options, ['connector', 'orderBy']);

      this
        .makeResource(options)
        .makeBrowsableCollection(options);
    },

    url: function() {
      return '';
    }
  }, {
    createFrom: function(data) {
      var modelData = _.map(_.keys(data), function(owner){
        var obj = {perm_owner: owner};
        _.each(data[owner], function(perm){
          if(perm.startsWith(BASE_PERMISSION_PREFIX)) {
            obj['base_permission'] = perm.substr(BASE_PERMISSION_PREFIX.length + 1);
          } else if(perm.startsWith(EXT_PERMISSION_PREFIX)) {
            perm = perm.substr(EXT_PERMISSION_PREFIX.length + 1);
            obj['ext_permission'] = perm.split(EXT_PERMISSION_SEP);
          }
        });

        return obj;
      });

      var collection = new PermissionCollection([]);
      collection.fetched = true;
      collection.reset(modelData);
      return collection;
    }
  });

  ResourceMixin.mixin(PermissionCollection.prototype);
  BrowsableMixin.mixin(PermissionCollection.prototype);

  return PermissionCollection;
});