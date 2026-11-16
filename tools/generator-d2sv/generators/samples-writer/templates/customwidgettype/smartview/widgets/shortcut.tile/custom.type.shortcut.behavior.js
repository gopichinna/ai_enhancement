define([
    'd2/sdk/widgets/shortcut.tile/shortcut.tile.behavior'
], function(ShortcutTileBehaviorImpl){
    'use strict';

    var CustomTypeShortcutBehavior = ShortcutTileBehaviorImpl.extend({
        constructor: function CustomTypeShortcutBehavior() {
            CustomTypeShortcutBehavior.__super__.constructor.apply(this, arguments);
        },
        onClick: function() {
            alert('custom parameter sample1 : '+this.options.widgetParams.sample1);
        }
    });

    return CustomTypeShortcutBehavior;
});