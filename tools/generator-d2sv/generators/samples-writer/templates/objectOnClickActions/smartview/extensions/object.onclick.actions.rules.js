define([
], function () {
    'use strict';

    return [
        {
            decides: function (node) {
                return node.get('aContentType') === 'crtext';
            },
            signature: 'OpenModelAlert',
            sequence: 9
        }, {
            decides: function (node) {
                return node.get('aContentType') === 'png';
            },
            signature: 'OpenToastMessage',
            sequence: 9
        }
    ];
});
