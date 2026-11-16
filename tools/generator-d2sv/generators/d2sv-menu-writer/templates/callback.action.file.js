define([], function () {
    'use strict';
    return {
        <%= rActionFunctionName %>: function (options) {
            var selectedObjectIds = options.data.id;
            console.log('<%= rAction %> called...');

            if (selectedObjectIds.indexOf('&') !== -1) {
                selectedObjectIds.replace('&', ',');
            }

            console.log('Selected Object Ids = ' + selectedObjectIds);
        }
    };
});