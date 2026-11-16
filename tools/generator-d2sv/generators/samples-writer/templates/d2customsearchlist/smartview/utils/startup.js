define([
], function(){
  'use strict';

  return {
    beforeStartup: function() {
      require([
        '<%= namespace %>/overrides/widgets/savedsearch/savedsearch.group.model',
      ], (SavedSearchGroupModel) => {
        if(SavedSearchGroupModel){
          console.log("Override the SavedSearchModel model")
        }
      });

    },

    afterStartup: function() {
      //Any code to be executed after Smartview startup
      //can return a jQuery promise to hold Smartview startup sequence until the promise is settled.
    }
  };
});
