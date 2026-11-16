define([
    'd2/sdk/widgets/shortcut.tile/shortcut.tile.behavior'
], function(ShortcutTileBehaviorImpl){
    'use strict';

    var <%= behaviorClassName %> = ShortcutTileBehaviorImpl.extend({
        constructor: function <%= behaviorClassName %>() {
            <%= behaviorClassName %>.__super__.constructor.apply(this, arguments);
        },

        onRender: function () {
            <%= behaviorClassName %>.__super__.onRender.apply(this, arguments);

            // Additional code
        },

        onClick: function() {
            //TODO: Code that handles click event on the tile
            alert('clicked');
        }
    });

    return <%= behaviorClassName %>;
});