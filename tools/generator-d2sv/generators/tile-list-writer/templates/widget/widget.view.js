define([
  'd2/sdk/widgets/list.tile/list.tile.view',
  '<%= namespace %>/utils/contexts/factories/<%= typedModulePrefix %>.collection.factory',
  'i18n!<%= namespace %>/widgets/<%= srcDir %>/impl/nls/lang',
  'css!<%= namespace %>/widgets/<%= srcDir %>/impl/<%= srcDir %>'
], function(ListTileViewImpl, <%= typedNamePrefix %>CollectionFactory, lang){
  'use strict';

  var <%= typedNamePrefix %>View = ListTileViewImpl.extend({
    constructor: function <%= typedNamePrefix %>View(options) {
      options = options || {};
      options.lang = lang; //By defining language keys failedListText, emptyListText & zeroResults this tile's data state messages can be customized.
      options.cssClass = 'd2-tile-<%= typedNamePrefix.toLowerCase(); %>';
      options.collectionFactory = <%= typedNamePrefix %>CollectionFactory;

      <%= typedNamePrefix %>View.__super__.constructor.call(this, options);

      // TODO: uncomment the following block of code if items shown in this tile needs to update on delete
      /*this.makeTileViewActionable({
        context: this.context,
        collection: this.completeCollection,
        handleDeleteEvent: true
      });*/
    }
  });

  return <%= typedNamePrefix %>View;
});
