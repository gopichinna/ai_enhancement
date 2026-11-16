define(['d2/sdk/utils/widget.constants'], function(widgetConstants) {
    'use strict';

    function validateConfigCustomType0() {
        var validation = {
            status: true
        };
        // TODO: Validates widgetConfig. Set validation.status = false if the validation should fail.
        return validation;
    }
    // List of landing tile definitions
    return [{
        type: 'CustomType',
        icon: 'custom-widget-type',
        isShortcut: true,
        tileConfigType: widgetConstants.TileConfigTypes.WIDGET,
        validateConfig: validateConfigCustomType0
    }];
});